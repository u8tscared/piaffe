import { Hono } from "hono";
import type { AppEnv, Env } from "../env";
import { requireRole } from "../lib/auth";
import { audit, json, one, run } from "../lib/db";
import { emit } from "../lib/events";
import { ApiError, bad, body } from "../lib/http";
import { nowIso, slugify } from "../lib/ids";
import { randomToken } from "../lib/crypto";
import { sendMail } from "../mail/send";
import { FOUNDER_OFFER, PLANS, REFERRAL, TRIAL_DAYS, WRITE_GRACE_DAYS, TRIAL_REMINDER_DAYS, catalog, findPlan, lookupKey, planFromLookupKey, type Interval } from "./plans";
import { stripe, stripeRequest, StripeError } from "./stripe";
import { RETURN_PATHS, VAT_FRANCHISE_NOTE, appUrl, euros, isoFromUnix, ownerEmails, vatRegime } from "./common";
import { planAccess } from "./access";
import { ensureCatalog, findVatRate, type Req } from "./setup-stripe";
import { safeEqual } from "../lib/crypto";

type Ctx = { waitUntil(p: Promise<unknown>): void } | null;

/* ---------- Données ---------- */

export interface BillingRow {
  club_id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null;
  plan: string | null; interval: string | null; price_lookup_key: string | null; status: string | null;
  current_period_end: string | null; cancel_at_period_end: number; past_due_since: string | null;
  founder: number; referral_code: string | null; referred_by: string | null; referral_rewarded_at: string | null;
  trial_reminders: string; last_invoice_url: string | null;
}

export async function billingRow(db: D1Database, clubId: string) {
  return one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE club_id = ?", clubId);
}
async function ensureRow(db: D1Database, clubId: string) {
  await run(db, "INSERT OR IGNORE INTO billing_subscriptions (club_id) VALUES (?)", clubId);
  return (await billingRow(db, clubId))!;
}

/** Cache des Price par lookup_key (par isolat, 10 min). */
const priceCache = new Map<string, { id: string; amount: number; at: number }>();
export function clearPriceCache() { priceCache.clear(); }
async function priceFor(env: Env, key: string) {
  const c = priceCache.get(key);
  if (c && Date.now() - c.at < 6e5) return c;
  const r = await stripe(env, "GET", "/v1/prices", { lookup_keys: [key], active: true, limit: 1 });
  const p = r?.data?.[0];
  if (!p) throw new ApiError(503, "price_missing", "Cette offre n'est pas encore disponible au paiement. Contactez-nous, nous la réglons rapidement.");
  const v = { id: p.id as string, amount: p.unit_amount as number, at: Date.now() };
  priceCache.set(key, v);
  return v;
}

const STATUS_MAP: Record<string, string> = {
  trialing: "trialing", active: "active", past_due: "past_due", unpaid: "unpaid",
  canceled: "canceled", incomplete_expired: "canceled", paused: "unpaid",
};

/** Applique l'état d'un abonnement Stripe au club (clubs.plan / plan_status / trial_ends_at). */
export async function applySubscription(env: Env, ctx: Ctx, sub: any, opts: { deleted?: boolean } = {}) {
  const db = env.DB;
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  // Le club est retrouvé par le client Stripe enregistré chez nous (jamais sur la seule foi des métadonnées).
  let row = customer ? await one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?", customer) : null;
  if (!row) { console.warn("abonnement sans club connu", sub.id); return; }
  if (row.stripe_subscription_id && row.stripe_subscription_id !== sub.id && !opts.deleted) {
    // Un nouvel abonnement remplace l'ancien seulement s'il est vivant.
    if (!["active", "trialing", "past_due"].includes(sub.status)) return;
  }
  if (opts.deleted && row.stripe_subscription_id && row.stripe_subscription_id !== sub.id) return;

  const item = sub.items?.data?.[0];
  const parsed = planFromLookupKey(item?.price?.lookup_key);
  const status = opts.deleted ? "canceled" : STATUS_MAP[sub.status];
  if (!status) return; // incomplete : transitoire, on attend la suite.
  const periodEnd = isoFromUnix(item?.current_period_end ?? sub.current_period_end);
  const trialEnd = isoFromUnix(sub.trial_end);
  const now = nowIso();
  const pastDue = status === "past_due" || status === "unpaid" ? (row.past_due_since || now) : null;
  const club = await one<{ plan: string; plan_status: string }>(db, "SELECT plan, plan_status FROM clubs WHERE id = ?", row.club_id);
  const plan = parsed?.plan || row.plan || club?.plan || "trial";

  await db.batch([
    db.prepare(`UPDATE billing_subscriptions SET stripe_subscription_id = ?, plan = ?, interval = ?, price_lookup_key = ?, status = ?,
      current_period_end = ?, cancel_at_period_end = ?, past_due_since = ?, updated_at = ? WHERE club_id = ?`)
      .bind(sub.id, plan, parsed?.interval || row.interval, item?.price?.lookup_key || row.price_lookup_key, opts.deleted ? "canceled" : sub.status,
        periodEnd, sub.cancel_at_period_end ? 1 : 0, pastDue, now, row.club_id),
    db.prepare("UPDATE clubs SET plan = ?, plan_status = ?, trial_ends_at = COALESCE(?, trial_ends_at), updated_at = ? WHERE id = ?")
      .bind(plan, status, status === "trialing" ? trialEnd : null, now, row.club_id),
  ]);
  if (!club || club.plan !== plan || club.plan_status !== status) {
    await audit(db, { club_id: row.club_id, action: "billing.subscription", target: sub.id, data: { plan, status } });
    await emit(env, ctx, { type: "subscription.changed", club_id: row.club_id, plan, status });
  }
}

/* ---------- Webhooks de la plateforme ---------- */

export async function handlePlatformEvent(env: Env, ctx: Ctx, evt: any): Promise<"ok" | "ignored"> {
  const o = evt.data?.object || {};
  const db = env.DB;
  switch (evt.type) {
    case "checkout.session.completed": {
      if (o.mode !== "subscription" || !o.subscription) return "ignored";
      const row = await one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?", o.customer);
      if (!row || (o.client_reference_id && o.client_reference_id !== row.club_id)) return "ignored";
      const sub = await stripeRequest(env, "GET", `/v1/subscriptions/${o.subscription}`);
      await run(db, "UPDATE billing_subscriptions SET stripe_subscription_id = ?, updated_at = ? WHERE club_id = ?", o.subscription, nowIso(), row.club_id);
      await applySubscription(env, ctx, sub);
      return "ok";
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await applySubscription(env, ctx, o); return "ok";
    case "customer.subscription.deleted":
      await applySubscription(env, ctx, o, { deleted: true }); return "ok";
    case "customer.subscription.trial_will_end": {
      const row = await one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?", o.customer);
      if (!row) return "ignored";
      const ends = isoFromUnix(o.trial_end);
      const days = ends ? Math.max(0, Math.round((Date.parse(ends) - Date.now()) / 864e5)) : 3;
      await notifyTrialEnding(env, ctx, row.club_id, ends, days, true);
      return "ok";
    }
    case "invoice.paid": {
      const row = await one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?", o.customer);
      if (!row) return "ignored";
      await run(db, "UPDATE billing_subscriptions SET past_due_since = NULL, last_invoice_url = ?, updated_at = ? WHERE club_id = ?", o.hosted_invoice_url || null, nowIso(), row.club_id);
      await run(db, "UPDATE clubs SET plan_status = 'active', updated_at = ? WHERE id = ? AND plan_status IN ('past_due','unpaid')", nowIso(), row.club_id);
      const club = await one<{ name: string }>(db, "SELECT name FROM clubs WHERE id = ?", row.club_id);
      const amount = Number(o.amount_paid) || 0;
      await emit(env, ctx, {
        type: "subscription.paid", club_id: row.club_id, stripe_invoice_id: o.id, number: o.number || null, amount_cents: amount,
        tax_cents: Number(o.tax) || 0, hosted_invoice_url: o.hosted_invoice_url || null, invoice_pdf: o.invoice_pdf || null,
        period_start: isoFromUnix(o.period_start), period_end: isoFromUnix(o.period_end), plan: row.plan,
      });
      if (amount > 0) {
        const planName = (row.founder ? FOUNDER_OFFER.name : findPlan(row.plan)?.name || row.plan || "") + (row.interval === "year" ? ", annuel" : ", mensuel");
        for (const m of await ownerEmails(db, row.club_id)) {
          await sendMail(env, { to: m.email, template: "subscription_receipt", data: {
            first: m.first, club_name: club?.name, plan: planName, amount_cents: amount,
            period_start: isoFromUnix(o.period_start)?.slice(0, 10), period_end: isoFromUnix(o.period_end)?.slice(0, 10),
            invoice_number: o.number || undefined, invoice_url: o.hosted_invoice_url || undefined,
          } });
        }
        await rewardReferrer(env, row);
      }
      return "ok";
    }
    case "invoice.payment_failed": {
      const row = await one<BillingRow>(db, "SELECT * FROM billing_subscriptions WHERE stripe_customer_id = ?", o.customer);
      if (!row) return "ignored";
      await run(db, "UPDATE billing_subscriptions SET past_due_since = COALESCE(past_due_since, ?), updated_at = ? WHERE club_id = ?", nowIso(), nowIso(), row.club_id);
      const club = await one<{ name: string }>(db, "SELECT name FROM clubs WHERE id = ?", row.club_id);
      await emit(env, ctx, { type: "payment.failed", club_id: row.club_id, invoice_id: null, scope: "subscription", reason: o.last_finalization_error?.code || "payment_failed", stripe_ref: o.id });
      for (const m of await ownerEmails(db, row.club_id)) {
        await sendMail(env, { to: m.email, template: "payment_failed", data: {
          first: m.first, amount_cents: Number(o.amount_due) || 0, number: o.number || undefined,
          reason: `abonnement ${club?.name ? "de " + club.name : "Piaffe"}, accès en écriture maintenu ${WRITE_GRACE_DAYS} jours`,
          retry_url: appUrl(env, RETURN_PATHS.portalReturn),
        } });
      }
      return "ok";
    }
  }
  return "ignored";
}

async function rewardReferrer(env: Env, row: BillingRow) {
  if (!row.referred_by || row.referral_rewarded_at) return;
  const ref = await billingRow(env.DB, row.referred_by);
  if (!ref?.stripe_customer_id) return;
  // Marque d'abord (une seule récompense), la clé d'idempotence protège l'appel Stripe en cas de rejeu.
  const r = await run(env.DB, "UPDATE billing_subscriptions SET referral_rewarded_at = ? WHERE club_id = ? AND referral_rewarded_at IS NULL", nowIso(), row.club_id);
  if (!r.meta.changes) return;
  await stripeRequest(env, "POST", `/v1/customers/${ref.stripe_customer_id}/balance_transactions`, {
    amount: -REFERRAL.referrer_credit_cents, currency: "eur", description: "Parrainage Piaffe", metadata: { referee_club_id: row.club_id },
  }, { idempotencyKey: "piaffe_referral_" + row.club_id });
  await audit(env.DB, { club_id: row.referred_by, action: "billing.referral_reward", target: row.club_id, data: { cents: REFERRAL.referrer_credit_cents } });
}

/** Rappel de fin d'essai : événement trial.ending pour les autres lots et e-mail trial_ending aux titulaires. */
export async function notifyTrialEnding(env: Env, ctx: Ctx, clubId: string, endsAt: string | null, days: number, hasSubscription: boolean) {
  const club = await one<{ name: string }>(env.DB, "SELECT name FROM clubs WHERE id = ?", clubId);
  await emit(env, ctx, { type: "trial.ending", club_id: clubId, trial_ends_at: endsAt, days_left: days, has_subscription: hasSubscription });
  for (const m of await ownerEmails(env.DB, clubId)) {
    await sendMail(env, { to: m.email, template: "trial_ending", data: {
      first: m.first, club_name: club?.name, days_left: days, trial_ends_at: endsAt?.slice(0, 10), plan_url: appUrl(env, RETURN_PATHS.portalReturn),
    } });
  }
}

/* ---------- Cron : rappels de fin d'essai et fin d'essai sans abonnement ---------- */

export async function subscriptionCron(env: Env) {
  const db = env.DB;
  const now = Date.now();
  const maxDays = Math.max(...TRIAL_REMINDER_DAYS);
  const rows = (await db.prepare(
    `SELECT c.id, c.trial_ends_at, b.trial_reminders, b.stripe_subscription_id FROM clubs c LEFT JOIN billing_subscriptions b ON b.club_id = c.id
     WHERE c.plan_status = 'trialing' AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at <= ? LIMIT 500`)
    .bind(new Date(now + (maxDays + 1) * 864e5).toISOString()).all<any>()).results || [];
  for (const r of rows) {
    const left = (Date.parse(r.trial_ends_at) - now) / 864e5;
    if (left <= 0) {
      // Essai terminé sans abonnement Stripe : impayé (écriture bloquée après le délai de grâce).
      if (!r.stripe_subscription_id) {
        await run(db, "UPDATE clubs SET plan_status = 'unpaid', updated_at = ? WHERE id = ? AND plan_status = 'trialing'", nowIso(), r.id);
        await emit(env, null, { type: "subscription.changed", club_id: r.id, plan: "trial", status: "unpaid" });
      }
      continue;
    }
    if (r.stripe_subscription_id) continue; // Stripe envoie trial_will_end ; le moyen de paiement est déjà là.
    const sent = json<number[]>(r.trial_reminders, []);
    const due = TRIAL_REMINDER_DAYS.filter((d) => left <= d && !sent.includes(d)).sort((a, b) => a - b)[0];
    if (due === undefined) continue;
    await run(db, "INSERT OR IGNORE INTO billing_subscriptions (club_id) VALUES (?)", r.id);
    // Tous les paliers dépassés sont marqués : un seul e-mail même si le cron a manqué des jours.
    const all = [...new Set([...sent, ...TRIAL_REMINDER_DAYS.filter((d) => left <= d)])];
    await run(db, "UPDATE billing_subscriptions SET trial_reminders = ? WHERE club_id = ?", JSON.stringify(all), r.id);
    await notifyTrialEnding(env, null, r.id, r.trial_ends_at, Math.ceil(left), false);
  }
}

/* ---------- Routes ---------- */

const app = new Hono<AppEnv>();

app.get("/api/billing/plans", async (c) => {
  const club = c.get("club");
  const row = club ? await billingRow(c.env.DB, club.id) : null;
  const regime = vatRegime(c.env);
  return c.json({
    currency: "eur", trial_days: TRIAL_DAYS,
    vat: { regime, note: regime === "franchise" ? VAT_FRANCHISE_NOTE : "Prix hors taxes, TVA 20 % en sus.", rate: regime === "franchise" ? 0 : 20 },
    plans: PLANS.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, features: p.features, limits: p.limits, highlighted: !!p.highlighted,
      month_cents: p.month_cents, year_cents: p.year_cents, year_saving_cents: p.month_cents * 12 - p.year_cents })),
    founder: row?.founder ? { plan: FOUNDER_OFFER.plan, name: FOUNDER_OFFER.name, month_cents: FOUNDER_OFFER.month_cents, year_cents: FOUNDER_OFFER.year_cents } : null,
  });
});

async function referralCode(db: D1Database, clubId: string, slug: string, row: BillingRow) {
  if (row.referral_code) return row.referral_code;
  for (let i = 0; i < 5; i++) {
    const code = (slugify(slug).replace(/-/g, "").slice(0, 8) + "-" + randomToken(4).replace(/[^a-zA-Z0-9]/g, "").slice(0, 4)).toUpperCase();
    const r = await run(db, "UPDATE billing_subscriptions SET referral_code = ? WHERE club_id = ? AND referral_code IS NULL AND NOT EXISTS (SELECT 1 FROM billing_subscriptions WHERE referral_code = ?)", code, clubId, code);
    if (r.meta.changes) return code;
  }
  return null;
}

app.get("/api/billing/subscription", requireRole("owner", "manager", "accountant"), async (c) => {
  const club = c.get("club")!;
  const db = c.env.DB;
  const row = await ensureRow(db, club.id);
  const cl = await one<any>(db, "SELECT plan, plan_status, trial_ends_at, slug FROM clubs WHERE id = ?", club.id);
  const isOwner = c.get("membership")!.role === "owner";
  return c.json({
    plan: cl.plan, plan_name: findPlan(cl.plan)?.name || (cl.plan === "trial" ? "Essai" : cl.plan), plan_status: cl.plan_status,
    trial_ends_at: cl.trial_ends_at, interval: row.interval, current_period_end: row.current_period_end,
    cancel_at_period_end: !!row.cancel_at_period_end, founder: !!row.founder, has_customer: !!row.stripe_customer_id,
    has_subscription: !!row.stripe_subscription_id, last_invoice_url: isOwner ? row.last_invoice_url : null,
    referral_code: isOwner ? await referralCode(db, club.id, cl.slug, row) : null,
    access: await planAccess(db, club.id), can_manage: isOwner,
  });
});

async function ensureCustomer(c: any, row: BillingRow): Promise<string> {
  if (row.stripe_customer_id) return row.stripe_customer_id;
  const env: Env = c.env;
  const club = c.get("club");
  const user = c.get("user");
  const full = await one<any>(env.DB, "SELECT name, email, siren, vat_number FROM clubs WHERE id = ?", club.id);
  const cus = await stripe(env, "POST", "/v1/customers", {
    name: full.name, email: full.email || user.email, preferred_locales: ["fr"],
    metadata: { club_id: club.id, siren: full.siren || undefined },
    invoice_settings: vatRegime(env) === "franchise" ? { footer: VAT_FRANCHISE_NOTE } : undefined,
  }, { idempotencyKey: "piaffe_customer_" + club.id });
  await run(env.DB, "UPDATE billing_subscriptions SET stripe_customer_id = ?, updated_at = ? WHERE club_id = ? AND stripe_customer_id IS NULL", cus.id, nowIso(), club.id);
  return (await billingRow(env.DB, club.id))!.stripe_customer_id!;
}

app.post("/api/billing/checkout", requireRole("owner"), async (c) => {
  const env = c.env;
  const b = await body<{ plan?: string; interval?: string; promo_code?: string; referral_code?: string }>(c);
  const plan = findPlan(b.plan);
  if (!plan) throw bad("invalid_plan", "Cette offre n'existe pas.");
  const interval = (b.interval || "month") as Interval;
  if (interval !== "month" && interval !== "year") throw bad("invalid_interval", "Choisissez un paiement mensuel ou annuel.");
  if (b.promo_code && b.referral_code) throw bad("one_discount", "Un seul code peut être utilisé\u00a0: code promo ou code de parrainage.");
  const club = c.get("club")!;
  const db = env.DB;
  const row = await ensureRow(db, club.id);
  if (row.stripe_subscription_id && ["active", "trialing", "past_due", "unpaid"].includes(row.status || ""))
    throw new ApiError(409, "already_subscribed", "Votre club a déjà un abonnement. Changez d'offre depuis l'espace de facturation.");

  const founder = !!row.founder && plan.key === FOUNDER_OFFER.plan;
  const price = await priceFor(env, lookupKey(founder ? "fondateur" : plan.key, interval));
  const discounts: Record<string, string>[] = [];
  let referredBy: string | null = null;
  if (b.promo_code) {
    const code = String(b.promo_code).trim().slice(0, 64);
    const pc = await stripe(env, "GET", "/v1/promotion_codes", { code, active: true, limit: 1 });
    if (!pc?.data?.[0]) throw bad("promo_invalid", "Ce code promo n'est pas valable.");
    discounts.push({ promotion_code: pc.data[0].id });
  } else if (b.referral_code) {
    const ref = await one<{ club_id: string }>(db, "SELECT club_id FROM billing_subscriptions WHERE referral_code = ? COLLATE NOCASE", String(b.referral_code).trim().slice(0, 64));
    if (!ref || ref.club_id === club.id) throw bad("referral_invalid", "Ce code de parrainage n'est pas valable.");
    referredBy = ref.club_id;
    discounts.push({ coupon: REFERRAL.coupon_id });
  }

  const customer = await ensureCustomer(c, row);
  const cl = await one<any>(db, "SELECT trial_ends_at FROM clubs WHERE id = ?", club.id);
  // L'essai de 30 jours court dans Piaffe sans carte ; s'il reste plus de 2 jours, Stripe ne facture qu'à sa fin.
  const trialEnd = cl?.trial_ends_at && Date.parse(cl.trial_ends_at) > Date.now() + 49 * 3600e3 ? Math.floor(Date.parse(cl.trial_ends_at) / 1000) : undefined;
  const lineItem: Record<string, unknown> = { price: price.id, quantity: 1 };
  let automaticTax: unknown;
  if (vatRegime(env) === "normal") {
    if ((env as any).STRIPE_TAX === "automatic") automaticTax = { enabled: true };
    else {
      const rate = await findVatRate((m, p, params) => stripeRequest(env, m, p, params).then((data) => ({ status: 200, data })).catch((e) => ({ status: e.status || 500, data: null })));
      if (rate) lineItem.tax_rates = [rate];
    }
  }
  const meta = { club_id: club.id, plan: plan.key, interval, founder: founder ? "1" : "0" };
  const session = await stripe(env, "POST", "/v1/checkout/sessions", {
    mode: "subscription", customer, client_reference_id: club.id, locale: "fr",
    line_items: [lineItem],
    success_url: appUrl(env, RETURN_PATHS.subscriptionSuccess), cancel_url: appUrl(env, RETURN_PATHS.subscriptionCancel),
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    automatic_tax: automaticTax,
    discounts: discounts.length ? discounts : undefined,
    allow_promotion_codes: discounts.length ? undefined : true,
    subscription_data: { metadata: meta, trial_end: trialEnd, description: "Abonnement Piaffe " + (founder ? FOUNDER_OFFER.name : plan.name) },
    metadata: meta,
  });
  if (referredBy) await run(db, "UPDATE billing_subscriptions SET referred_by = ? WHERE club_id = ? AND referred_by IS NULL", referredBy, club.id);
  await audit(db, { club_id: club.id, user_id: c.get("user")!.id, action: "billing.checkout", target: session.id, data: { plan: plan.key, interval } });
  return c.json({ url: session.url, id: session.id });
});

app.post("/api/billing/portal", requireRole("owner"), async (c) => {
  const club = c.get("club")!;
  const row = await ensureRow(c.env.DB, club.id);
  if (!row.stripe_customer_id) throw new ApiError(409, "no_customer", "Choisissez d'abord une offre pour accéder à l'espace de facturation.");
  const s = await stripe(c.env, "POST", "/v1/billing_portal/sessions", { customer: row.stripe_customer_id, return_url: appUrl(c.env, RETURN_PATHS.portalReturn), locale: "fr" });
  return c.json({ url: s.url });
});

/** Resynchronise l'abonnement depuis Stripe (retour du Checkout avant le webhook, webhook manqué). */
app.post("/api/billing/sync", requireRole("owner"), async (c) => {
  const club = c.get("club")!;
  const row = await ensureRow(c.env.DB, club.id);
  if (!row.stripe_customer_id) return c.json({ ok: true, synced: false });
  const list = await stripe(c.env, "GET", "/v1/subscriptions", { customer: row.stripe_customer_id, status: "all", limit: 5 });
  const subs: any[] = list?.data || [];
  const live = subs.find((s) => ["active", "trialing", "past_due", "unpaid"].includes(s.status)) || subs[0];
  if (live) await applySubscription(c.env, c.executionCtx, live, { deleted: live.status === "canceled" });
  return c.json({ ok: true, synced: !!live });
});

/* ---------- Administration (Marceau) : protégée par BILLING_ADMIN_SECRET ---------- */

function requireAdmin(c: any) {
  const secret = (c.env as any).BILLING_ADMIN_SECRET as string | undefined;
  const got = (c.req.header("authorization") || "").replace(/^Bearer\s+/, "");
  if (!secret || secret.length < 24 || !safeEqual(got, secret)) throw new ApiError(403, "forbidden", "Accès refusé.");
}

/** Crée ou met à jour produits, prix et coupons dans le compte Stripe de la plateforme. Idempotent. */
app.post("/admin/billing/setup", async (c) => {
  requireAdmin(c);
  const env = c.env;
  const req: Req = async (m, p, params) => {
    try { return { status: 200, data: await stripeRequest(env, m, p, params || {}) }; }
    catch (e) { if (e instanceof StripeError) return { status: e.status, data: { error: { message: e.message } } }; throw e; }
  };
  const log = await ensureCatalog(req, catalog(), { vatRegime: vatRegime(env) });
  clearPriceCache();
  return c.json({ ok: true, log });
});

/** Accorde (ou retire) l'offre fondateurs à un club. */
app.post("/admin/billing/founder", async (c) => {
  requireAdmin(c);
  const b = await body<{ club_id?: string; founder?: boolean }>(c);
  if (!b.club_id) throw bad("missing_field", "Le champ « club_id » est obligatoire.");
  const exists = await one(c.env.DB, "SELECT id FROM clubs WHERE id = ?", b.club_id);
  if (!exists) throw new ApiError(404, "not_found", "Club introuvable.");
  const on = b.founder !== false;
  if (on) {
    const n = await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM billing_subscriptions WHERE founder = 1 AND club_id != ?", b.club_id);
    if ((n?.n || 0) >= FOUNDER_OFFER.max_clubs) throw new ApiError(409, "founder_full", "Les places de l'offre fondateurs sont toutes attribuées.");
  }
  await run(c.env.DB, "INSERT OR IGNORE INTO billing_subscriptions (club_id) VALUES (?)", b.club_id);
  await run(c.env.DB, "UPDATE billing_subscriptions SET founder = ?, updated_at = ? WHERE club_id = ?", on ? 1 : 0, nowIso(), b.club_id);
  await audit(c.env.DB, { club_id: b.club_id, action: "billing.founder", data: { founder: on } });
  return c.json({ ok: true, founder: on });
});

export default app;
