import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv, Env } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { all, audit, one, rateLimit, run } from "../lib/db";
import { emit } from "../lib/events";
import { ApiError, bad, body, forbidden, isEmail, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { randomToken, sha256 } from "../lib/crypto";
import { sendMail } from "../mail/send";
import { APPLICATION_FEE_PERCENT, AUTOPAY_NOTICE_DAYS, MAX_CHARGE_ATTEMPTS, PAY_LINK_DAYS } from "./plans";
import { stripe, stripeRequest, StripeError } from "./stripe";
import { METHOD_LABEL, RETURN_PATHS, appUrl, euros, ownerEmails } from "./common";
import { invoices, NOT_PAYABLE, remainingCents, type InvoiceInfo } from "./invoices";
import { assertCanActFor, isManager, payableRefs, personInfo } from "./people";

type Ctx = { waitUntil(p: Promise<unknown>): void } | null;
const DAY = 864e5;

/* ---------- Compte connecté ---------- */

export interface ConnectRow {
  club_id: string; stripe_account_id: string; charges_enabled: number; payouts_enabled: number; details_submitted: number;
  card_enabled: number; sepa_enabled: number; requirements: string; disabled_reason: string | null;
}
export const connectRow = (db: D1Database, clubId: string) => one<ConnectRow>(db, "SELECT * FROM connect_accounts WHERE club_id = ?", clubId);

async function readyAccount(db: D1Database, clubId: string): Promise<ConnectRow> {
  const a = await connectRow(db, clubId);
  if (!a || !a.charges_enabled) throw new ApiError(409, "connect_not_ready", "Le paiement en ligne n'est pas encore activé pour ce club.");
  return a;
}

function methodsFor(a: ConnectRow, wantSepa = true): string[] {
  const m = ["card"];
  if (wantSepa && a.sepa_enabled) m.push("sepa_debit");
  return m;
}

export function feeFor(amount: number) {
  return APPLICATION_FEE_PERCENT > 0 ? Math.round((amount * APPLICATION_FEE_PERCENT) / 100) : 0;
}

/** Met à jour l'état du compte connecté à partir de l'objet Account de Stripe. */
export async function applyAccount(env: Env, clubId: string, acct: any) {
  const caps = acct.capabilities || {};
  const req = [...new Set([...(acct.requirements?.currently_due || []), ...(acct.requirements?.past_due || [])])];
  await run(env.DB, `UPDATE connect_accounts SET charges_enabled = ?, payouts_enabled = ?, details_submitted = ?, card_enabled = ?, sepa_enabled = ?,
      requirements = ?, disabled_reason = ?, updated_at = ? WHERE club_id = ? AND stripe_account_id = ?`,
    acct.charges_enabled ? 1 : 0, acct.payouts_enabled ? 1 : 0, acct.details_submitted ? 1 : 0,
    caps.card_payments === "active" ? 1 : 0, caps.sepa_debit_payments === "active" ? 1 : 0,
    JSON.stringify(req.slice(0, 50)), acct.requirements?.disabled_reason || null, nowIso(), clubId, acct.id);
}

function statusJson(a: ConnectRow | null) {
  if (!a) return { connected: false, charges_enabled: false, payouts_enabled: false, details_submitted: false, card: false, sepa: false, requirements: [], disabled_reason: null };
  let req: string[] = [];
  try { req = JSON.parse(a.requirements); } catch { req = []; }
  return {
    connected: true, account_id: a.stripe_account_id, charges_enabled: !!a.charges_enabled, payouts_enabled: !!a.payouts_enabled,
    details_submitted: !!a.details_submitted, card: !!a.card_enabled, sepa: !!a.sepa_enabled, requirements: req,
    disabled_reason: a.disabled_reason, dashboard_url: "https://dashboard.stripe.com/",
  };
}

/* ---------- Clients Stripe des adhérents (sur le compte du club) ---------- */

async function ensureConnectCustomer(env: Env, clubId: string, acct: string, personRef: string, fallbackEmail?: string | null): Promise<{ id: string; email: string | null }> {
  const ex = await one<{ stripe_customer_id: string; email: string | null }>(env.DB, "SELECT stripe_customer_id, email FROM connect_customers WHERE club_id = ? AND person_ref = ?", clubId, personRef);
  if (ex) return { id: ex.stripe_customer_id, email: ex.email };
  const p = await personInfo(env.DB, clubId, personRef);
  const email = p.email || fallbackEmail || null;
  const cus = await stripe(env, "POST", "/v1/customers", {
    email: email || undefined, name: p.name || undefined, preferred_locales: ["fr"], metadata: { piaffe_club_id: clubId, piaffe_person_ref: personRef },
  }, { account: acct, idempotencyKey: `piaffe_cc_${clubId}_${personRef}` });
  await run(env.DB, "INSERT OR IGNORE INTO connect_customers (club_id, person_ref, stripe_customer_id, email) VALUES (?,?,?,?)", clubId, personRef, cus.id, email);
  const row = await one<{ stripe_customer_id: string; email: string | null }>(env.DB, "SELECT stripe_customer_id, email FROM connect_customers WHERE club_id = ? AND person_ref = ?", clubId, personRef);
  return { id: row!.stripe_customer_id, email: row!.email };
}

/* ---------- Factures ---------- */

async function loadInvoice(env: Env, clubId: string, invoiceId: string): Promise<InvoiceInfo> {
  const inv = await invoices().get(env.DB, clubId, invoiceId);
  if (!inv || inv.club_id !== clubId) throw notFound("Facture introuvable.");
  return inv;
}

/** Montant encore à encaisser en ligne : reste dû moins les prélèvements SEPA en cours. */
async function outstanding(env: Env, inv: InvoiceInfo): Promise<number> {
  if (NOT_PAYABLE.has(inv.status)) return 0;
  const inflight = await one<{ s: number }>(env.DB,
    "SELECT COALESCE(SUM(amount_cents), 0) AS s FROM online_payments WHERE club_id = ? AND invoice_id = ? AND status = 'processing'", inv.club_id, inv.id);
  return Math.max(0, remainingCents(inv) - (inflight?.s || 0));
}

async function assertNoActiveSchedule(db: D1Database, clubId: string, invoiceId: string) {
  const s = await one(db, "SELECT id FROM payment_schedules WHERE club_id = ? AND invoice_id = ? AND status IN ('active','pending_mandate')", clubId, invoiceId);
  if (s) throw new ApiError(409, "schedule_active", "Un échéancier est déjà en place pour cette facture.");
}

/** Crée un Checkout (mode payment) sur le compte connecté pour le reste dû d'une facture. */
async function invoiceCheckout(env: Env, o: { inv: InvoiceInfo; acct: ConnectRow; userId: string | null; email: string | null; kind: "checkout" | "link"; successPath: string; cancelPath: string }) {
  const { inv, acct } = o;
  const amount = await outstanding(env, inv);
  if (amount <= 0) throw new ApiError(409, "nothing_due", "Cette facture est déjà réglée.");
  if (amount < 50) throw new ApiError(409, "amount_too_small", "Le montant restant est trop faible pour un paiement en ligne.");
  await assertNoActiveSchedule(env.DB, inv.club_id, inv.id);
  const personRef = inv.customer_ref;
  const cus = personRef ? await ensureConnectCustomer(env, inv.club_id, acct.stripe_account_id, personRef, o.email) : null;

  // Une seule session ouverte par facture : les précédentes sont expirées (évite un double paiement).
  const open = await all<{ id: string; stripe_checkout_session: string }>(env.DB,
    "SELECT id, stripe_checkout_session FROM online_payments WHERE club_id = ? AND invoice_id = ? AND status = 'pending' AND stripe_checkout_session IS NOT NULL", inv.club_id, inv.id);
  for (const p of open) {
    try { await stripeRequest(env, "POST", `/v1/checkout/sessions/${p.stripe_checkout_session}/expire`, {}, { account: acct.stripe_account_id }); } catch { /* déjà terminée */ }
    await run(env.DB, "UPDATE online_payments SET status = 'canceled', updated_at = ? WHERE id = ? AND status = 'pending'", nowIso(), p.id);
  }

  const payId = newId("pay");
  const fee = feeFor(amount);
  await run(env.DB, "INSERT INTO online_payments (id, club_id, invoice_id, person_ref, user_id, kind, amount_cents, fee_cents) VALUES (?,?,?,?,?,?,?,?)",
    payId, inv.club_id, inv.id, personRef, o.userId, o.kind, amount, fee);
  const meta = { piaffe_payment_id: payId, piaffe_club_id: inv.club_id, piaffe_invoice_id: inv.id };
  const label = inv.number ? `Facture ${inv.number}` : "Facture";
  const session = await stripe(env, "POST", "/v1/checkout/sessions", {
    mode: "payment", locale: "fr", customer: cus?.id, client_reference_id: payId,
    payment_method_types: methodsFor(acct),
    line_items: [{ quantity: 1, price_data: { currency: inv.currency || "eur", unit_amount: amount, product_data: { name: label, description: inv.label || undefined } } }],
    payment_intent_data: { metadata: meta, description: label, application_fee_amount: fee > 0 ? fee : undefined },
    metadata: meta,
    success_url: appUrl(env, o.successPath), cancel_url: appUrl(env, o.cancelPath),
  }, { account: acct.stripe_account_id, idempotencyKey: "piaffe_pay_" + payId });
  await run(env.DB, "UPDATE online_payments SET stripe_checkout_session = ?, updated_at = ? WHERE id = ?", session.id, nowIso(), payId);
  return { url: session.url as string, payment_id: payId, amount_cents: amount };
}

/* ---------- Échéanciers ---------- */

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Programme le prélèvement automatique d'une facture émise si le payeur a un mandat actif (hook invoice.issued). */
export async function scheduleAutopay(env: Env, clubId: string, invoiceId: string) {
  const inv = await invoices().get(env.DB, clubId, invoiceId);
  if (!inv || !inv.customer_ref) return;
  const amount = await outstanding(env, inv);
  if (amount <= 0) return;
  const mdt = await one<any>(env.DB, "SELECT * FROM payment_mandates WHERE club_id = ? AND person_ref = ? AND status = 'active' AND autopay = 1 ORDER BY created_at DESC LIMIT 1", clubId, inv.customer_ref);
  if (!mdt) return;
  const exists = await one(env.DB, "SELECT id FROM payment_schedules WHERE club_id = ? AND invoice_id = ? AND status IN ('active','pending_mandate','completed')", clubId, invoiceId);
  if (exists) return;
  const minDue = new Date(Date.now() + AUTOPAY_NOTICE_DAYS * DAY);
  const due = inv.due_date && Date.parse(inv.due_date) > minDue.getTime() ? new Date(Date.parse(inv.due_date)) : minDue;
  const sid = newId("sch");
  await env.DB.batch([
    env.DB.prepare("INSERT INTO payment_schedules (id, club_id, invoice_id, person_ref, kind, count, total_cents, mandate_id, status) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(sid, clubId, invoiceId, inv.customer_ref, "autopay", 1, amount, mdt.id, "active"),
    env.DB.prepare("INSERT INTO payment_installments (id, schedule_id, club_id, seq, due_date, amount_cents, notified_at) VALUES (?,?,?,?,?,?,?)")
      .bind(newId("ins"), sid, clubId, 1, ymd(due), amount, nowIso()),
  ]);
  // Pré-notification SEPA : c'est l'e-mail invoice_issued du lot C (sepa: true, montant et échéance) ; le
  // prélèvement n'a jamais lieu avant AUTOPAY_NOTICE_DAYS jours après l'émission. Voir autopayFor().
}

/** Pour le lot C : le payeur sera-t-il prélevé automatiquement ? (option « sepa » de l'e-mail invoice_issued) */
export async function autopayFor(db: D1Database, clubId: string, personRef: string | null): Promise<{ label: string | null; notice_days: number } | null> {
  if (!personRef) return null;
  const m = await one<{ label: string | null }>(db, "SELECT label FROM payment_mandates WHERE club_id = ? AND person_ref = ? AND status = 'active' AND autopay = 1 ORDER BY created_at DESC LIMIT 1", clubId, personRef);
  return m ? { label: m.label, notice_days: AUTOPAY_NOTICE_DAYS } : null;
}

/* ---------- Résultats de paiement (webhooks et cron) ---------- */

/** Motifs de refus lisibles (codes Stripe les plus courants). */
const REASON_LABEL: Record<string, string> = {
  insufficient_funds: "provision insuffisante", card_declined: "carte refusée", expired_card: "carte expirée",
  authentication_required: "authentification demandée par la banque", generic_decline: "refus de la banque",
  debit_not_authorized: "prélèvement contesté auprès de la banque", account_closed: "compte bancaire clôturé",
  async_payment_failed: "prélèvement refusé par la banque",
};

async function paymentByMeta(db: D1Database, clubId: string, o: any) {
  const id = o?.metadata?.piaffe_payment_id;
  if (id) return one<any>(db, "SELECT * FROM online_payments WHERE id = ? AND club_id = ?", id, clubId);
  if (o?.id) return one<any>(db, "SELECT * FROM online_payments WHERE stripe_payment_intent = ? AND club_id = ?", o.id, clubId);
  return null;
}

async function payerEmail(db: D1Database, clubId: string, personRef: string | null) {
  if (!personRef) return null;
  return (await personInfo(db, clubId, personRef)).email
    || (await one<{ email: string | null }>(db, "SELECT email FROM connect_customers WHERE club_id = ? AND person_ref = ?", clubId, personRef))?.email || null;
}

async function methodOf(env: Env, acct: string, pi: any): Promise<string> {
  const types: string[] = pi.payment_method_types || [];
  if (types.length === 1) return types[0];
  const pm = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id;
  if (typeof pi.payment_method === "object" && pi.payment_method?.type) return pi.payment_method.type;
  if (!pm) return types[0] || "card";
  try { return (await stripeRequest(env, "GET", `/v1/payment_methods/${pm}`, {}, { account: acct })).type || "card"; } catch { return types[0] || "card"; }
}

export async function paymentSucceeded(env: Env, ctx: Ctx, clubId: string, acct: string, pi: any) {
  const db = env.DB;
  const p = await paymentByMeta(db, clubId, pi);
  if (!p) return "ignored";
  const method = await methodOf(env, acct, pi);
  const amount = Number(pi.amount_received || pi.amount) || p.amount_cents;
  const r = await run(db, `UPDATE online_payments SET status = 'succeeded', method = ?, stripe_payment_intent = ?, stripe_charge = ?, amount_cents = ?, paid_at = ?, updated_at = ?
    WHERE id = ? AND status IN ('pending','processing','failed','canceled')`,
    method, pi.id, typeof pi.latest_charge === "string" ? pi.latest_charge : null, amount, nowIso(), nowIso(), p.id);
  if (!r.meta.changes) return "ok"; // déjà traité
  if (p.installment_id) {
    await run(db, "UPDATE payment_installments SET status = 'paid', payment_id = ?, updated_at = ? WHERE id = ? AND club_id = ?", p.id, nowIso(), p.installment_id, clubId);
    const ins = await one<{ schedule_id: string }>(db, "SELECT schedule_id FROM payment_installments WHERE id = ?", p.installment_id);
    if (ins) await run(db, `UPDATE payment_schedules SET status = 'completed', updated_at = ? WHERE id = ? AND status = 'active'
      AND NOT EXISTS (SELECT 1 FROM payment_installments WHERE schedule_id = ? AND status NOT IN ('paid','canceled'))`, nowIso(), ins.schedule_id, ins.schedule_id);
  }
  await emit(env, ctx, { type: "invoice.paid", club_id: clubId, invoice_id: p.invoice_id, amount_cents: amount, method, stripe_ref: pi.id, payment_id: p.id });
  await audit(db, { club_id: clubId, action: "payment.succeeded", target: p.invoice_id, data: { payment_id: p.id, amount, method } });
  const inv = await invoices().get(db, clubId, p.invoice_id);
  const to = inv?.email || await payerEmail(db, clubId, p.person_ref);
  const first = p.person_ref ? (await personInfo(db, clubId, p.person_ref)).first : null;
  if (to) await sendMail(env, { to, template: "payment_receipt", club_id: clubId, data: {
    first, amount_cents: amount, paid_at: nowIso().slice(0, 10), method: METHOD_LABEL[method] || "Paiement en ligne", number: inv?.number || undefined,
    balance_cents: inv ? Math.max(0, remainingCents(inv) - amount) : undefined,
  } });
  return "ok";
}

export async function paymentFailed(env: Env, ctx: Ctx, clubId: string, paymentId: string, reason: string, piId?: string | null) {
  const db = env.DB;
  const p = await one<any>(db, "SELECT * FROM online_payments WHERE id = ? AND club_id = ?", paymentId, clubId);
  if (!p) return "ignored";
  const r = await run(db, "UPDATE online_payments SET status = 'failed', failure_reason = ?, stripe_payment_intent = COALESCE(stripe_payment_intent, ?), updated_at = ? WHERE id = ? AND status IN ('pending','processing')",
    reason.slice(0, 120), piId || null, nowIso(), p.id);
  if (!r.meta.changes) return "ok";
  let finalFailure = true;
  if (p.installment_id) {
    const ins = await one<any>(db, "SELECT * FROM payment_installments WHERE id = ? AND club_id = ?", p.installment_id, clubId);
    if (ins) {
      if (ins.attempts < MAX_CHARGE_ATTEMPTS) {
        finalFailure = false;
        await run(db, "UPDATE payment_installments SET status = 'scheduled', next_attempt_at = ?, last_error = ?, updated_at = ? WHERE id = ?",
          new Date(Date.now() + 3 * DAY).toISOString(), reason.slice(0, 120), nowIso(), ins.id);
      } else {
        await run(db, "UPDATE payment_installments SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?", reason.slice(0, 120), nowIso(), ins.id);
        await run(db, "UPDATE payment_schedules SET status = 'failed', updated_at = ? WHERE id = ?", nowIso(), ins.schedule_id);
      }
    }
  }
  await emit(env, ctx, { type: "payment.failed", club_id: clubId, invoice_id: p.invoice_id, reason, payment_id: p.id, stripe_ref: piId || null, final: finalFailure });
  const inv = await invoices().get(db, clubId, p.invoice_id);
  const data = { amount_cents: p.amount_cents, reason: REASON_LABEL[reason] || undefined, number: inv?.number || undefined,
    method: METHOD_LABEL[p.method] || undefined, retry_url: appUrl(env, RETURN_PATHS.invoiceCancel(p.invoice_id)) };
  // Un paiement par Checkout refusé est déjà signalé à l'écran : l'e-mail concerne les prélèvements et échéances.
  if (p.kind !== "checkout" && p.kind !== "link") {
    const to = inv?.email || await payerEmail(db, clubId, p.person_ref);
    const first = p.person_ref ? (await personInfo(db, clubId, p.person_ref)).first : null;
    if (to) await sendMail(env, { to, template: "payment_failed", club_id: clubId, data: { ...data, first } });
    if (finalFailure) for (const m of await ownerEmails(db, clubId, ["owner", "manager"])) await sendMail(env, { to: m.email, template: "payment_failed", club_id: clubId, data: { ...data, first: m.first } });
  }
  return "ok";
}

async function activateMandate(env: Env, clubId: string, acct: string, si: any) {
  const db = env.DB;
  const id = si?.metadata?.piaffe_mandate_id;
  if (!id) return "ignored";
  const m = await one<any>(db, "SELECT * FROM payment_mandates WHERE id = ? AND club_id = ?", id, clubId);
  if (!m || m.status === "active" || m.status === "revoked") return m ? "ok" : "ignored";
  const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  if (!pmId) return "ignored";
  let method = "sepa_debit", label: string | null = null;
  try {
    const pm = typeof si.payment_method === "object" && si.payment_method?.type ? si.payment_method : await stripeRequest(env, "GET", `/v1/payment_methods/${pmId}`, {}, { account: acct });
    method = pm.type || method;
    const last4 = pm[method]?.last4;
    if (last4) label = method === "sepa_debit" ? `IBAN se terminant par ${last4}` : `Carte se terminant par ${last4}`;
  } catch { /* libellé facultatif */ }
  const r = await run(db, `UPDATE payment_mandates SET status = 'active', stripe_setup_intent = ?, stripe_payment_method = ?, stripe_mandate = ?, method = ?, label = ?, updated_at = ?
    WHERE id = ? AND status = 'pending'`, si.id, pmId, typeof si.mandate === "string" ? si.mandate : si.mandate?.id || null, method, label, nowIso(), id);
  if (!r.meta.changes) return "ok";
  await audit(db, { club_id: clubId, action: "payment.mandate_active", target: m.person_ref, data: { mandate_id: id, method } });
  return "ok";
}

/* ---------- Webhooks Connect ---------- */

export async function handleConnectEvent(env: Env, ctx: Ctx, evt: any): Promise<"ok" | "ignored"> {
  const db = env.DB;
  if (!evt.account) return "ignored";
  const a = await one<{ club_id: string }>(db, "SELECT club_id FROM connect_accounts WHERE stripe_account_id = ?", evt.account);
  if (!a) return "ignored";
  const clubId = a.club_id;
  const o = evt.data?.object || {};
  // Isolation : un objet qui annonce un autre club que celui du compte connecté est ignoré.
  const metaClub = o.metadata?.piaffe_club_id;
  if (metaClub && metaClub !== clubId) return "ignored";

  switch (evt.type) {
    case "account.updated":
      if (o.id !== evt.account) return "ignored";
      await applyAccount(env, clubId, o);
      return "ok";
    case "checkout.session.completed": {
      if (o.mode === "setup") {
        if (!o.setup_intent) return "ignored";
        const si = typeof o.setup_intent === "object" ? o.setup_intent : await stripeRequest(env, "GET", `/v1/setup_intents/${o.setup_intent}`, {}, { account: evt.account });
        return activateMandate(env, clubId, evt.account, si) as Promise<"ok" | "ignored">;
      }
      if (o.mode !== "payment") return "ignored";
      // carte cadeau achetée sur la page publique du club (src/public) : crée la carte et envoie le code
      if (o.metadata?.piaffe_gift_id) return (await import("../public/routes")).giftPaid(env, ctx, clubId, o);
      const p = await paymentByMeta(db, clubId, o);
      if (!p) return "ignored";
      const pi = typeof o.payment_intent === "string" ? o.payment_intent : o.payment_intent?.id;
      // Le succès est enregistré par payment_intent.succeeded ; ici on relie l'intention et on marque « en cours » (SEPA).
      await run(db, `UPDATE online_payments SET stripe_payment_intent = COALESCE(stripe_payment_intent, ?), status = CASE WHEN status = 'pending' AND ? != 'paid' THEN 'processing' ELSE status END,
        updated_at = ? WHERE id = ?`, pi || null, o.payment_status || "", nowIso(), p.id);
      return "ok";
    }
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      if (o.mode !== "payment") return "ignored";
      const p = await paymentByMeta(db, clubId, o);
      if (!p) return "ignored";
      if (evt.type === "checkout.session.expired") {
        await run(db, "UPDATE online_payments SET status = 'canceled', updated_at = ? WHERE id = ? AND status = 'pending'", nowIso(), p.id);
        return "ok";
      }
      return paymentFailed(env, ctx, clubId, p.id, "async_payment_failed") as Promise<"ok" | "ignored">;
    }
    case "payment_intent.processing": {
      const p = await paymentByMeta(db, clubId, o);
      if (!p) return "ignored";
      await run(db, "UPDATE online_payments SET status = 'processing', stripe_payment_intent = ?, updated_at = ? WHERE id = ? AND status = 'pending'", o.id, nowIso(), p.id);
      return "ok";
    }
    case "payment_intent.succeeded":
      return paymentSucceeded(env, ctx, clubId, evt.account, o) as Promise<"ok" | "ignored">;
    case "payment_intent.payment_failed": {
      const p = await paymentByMeta(db, clubId, o);
      if (!p) return "ignored";
      return paymentFailed(env, ctx, clubId, p.id, o.last_payment_error?.decline_code || o.last_payment_error?.code || "payment_failed", o.id) as Promise<"ok" | "ignored">;
    }
    case "charge.refunded": {
      const piId = typeof o.payment_intent === "string" ? o.payment_intent : o.payment_intent?.id;
      const p = piId ? await one<any>(db, "SELECT * FROM online_payments WHERE stripe_payment_intent = ? AND club_id = ?", piId, clubId) : null;
      if (!p) return "ignored";
      const total = Math.min(Number(o.amount_refunded) || 0, p.amount_cents);
      const delta = total - p.refunded_cents;
      if (delta <= 0) return "ok";
      const r = await run(db, "UPDATE online_payments SET refunded_cents = ?, status = ?, updated_at = ? WHERE id = ? AND refunded_cents = ?",
        total, total >= p.amount_cents ? "refunded" : "partially_refunded", nowIso(), p.id, p.refunded_cents);
      if (!r.meta.changes) return "ok";
      await emit(env, ctx, { type: "payment.refunded", club_id: clubId, invoice_id: p.invoice_id, amount_cents: delta, stripe_ref: o.id, payment_id: p.id });
      return "ok";
    }
    case "setup_intent.succeeded":
      return activateMandate(env, clubId, evt.account, o) as Promise<"ok" | "ignored">;
    case "mandate.updated": {
      if (o.status !== "inactive") return "ok";
      const m = await one<any>(db, "SELECT * FROM payment_mandates WHERE stripe_mandate = ? AND club_id = ?", o.id, clubId);
      if (!m) return "ignored";
      await revokeMandate(env, clubId, m, false);
      return "ok";
    }
  }
  return "ignored";
}

async function revokeMandate(env: Env, clubId: string, m: any, detach: boolean) {
  const db = env.DB;
  const r = await run(db, "UPDATE payment_mandates SET status = 'revoked', autopay = 0, updated_at = ? WHERE id = ? AND club_id = ? AND status != 'revoked'", nowIso(), m.id, clubId);
  if (!r.meta.changes) return;
  if (detach && m.stripe_payment_method) {
    const a = await connectRow(db, clubId);
    if (a) { try { await stripeRequest(env, "POST", `/v1/payment_methods/${m.stripe_payment_method}/detach`, {}, { account: a.stripe_account_id }); } catch { /* déjà détaché */ } }
  }
  // Les échéances futures qui reposaient sur ce mandat sont annulées ; le gérant est prévenu.
  const scheds = await all<{ id: string }>(db, "SELECT id FROM payment_schedules WHERE club_id = ? AND mandate_id = ? AND status = 'active'", clubId, m.id);
  for (const s of scheds) {
    await run(db, "UPDATE payment_installments SET status = 'canceled', updated_at = ? WHERE schedule_id = ? AND status = 'scheduled'", nowIso(), s.id);
    await run(db, "UPDATE payment_schedules SET status = 'canceled', updated_at = ? WHERE id = ?", nowIso(), s.id);
  }
  await audit(db, { club_id: clubId, action: "payment.mandate_revoked", target: m.person_ref, data: { mandate_id: m.id } });
  await emit(env, null, { type: "mandate.revoked", club_id: clubId, person_ref: m.person_ref, mandate_id: m.id });
}

/* ---------- Cron : prélèvements des échéances arrivées à terme ---------- */

export async function chargeDueInstallments(env: Env, now = new Date()) {
  const db = env.DB;
  const today = ymd(now);
  const due = await all<any>(db,
    `SELECT i.*, s.invoice_id, s.person_ref, s.mandate_id, s.kind AS schedule_kind FROM payment_installments i JOIN payment_schedules s ON s.id = i.schedule_id
     WHERE i.status = 'scheduled' AND s.status = 'active' AND i.due_date <= ? AND (i.next_attempt_at IS NULL OR i.next_attempt_at <= ?)
     ORDER BY i.due_date LIMIT 50`, today, now.toISOString());
  let charged = 0;
  for (const ins of due) {
    // Verrou : une seule exécution du cron prend l'échéance.
    const lock = await run(db, "UPDATE payment_installments SET status = 'processing', attempts = attempts + 1, updated_at = ? WHERE id = ? AND status = 'scheduled'", nowIso(), ins.id);
    if (!lock.meta.changes) continue;
    const attempt = ins.attempts + 1;
    const release = (status: string, err: string) => run(db, "UPDATE payment_installments SET status = ?, last_error = ?, updated_at = ? WHERE id = ?", status, err, nowIso(), ins.id);
    const acct = await connectRow(db, ins.club_id);
    const mdt = ins.mandate_id ? await one<any>(db, "SELECT * FROM payment_mandates WHERE id = ? AND club_id = ?", ins.mandate_id, ins.club_id) : null;
    if (!acct?.charges_enabled || !mdt || mdt.status !== "active") { await release("scheduled", "not_ready"); await run(db, "UPDATE payment_installments SET next_attempt_at = ? WHERE id = ?", new Date(now.getTime() + DAY).toISOString(), ins.id); continue; }
    const inv = await invoices().get(db, ins.club_id, ins.invoice_id);
    const left = inv ? await outstanding(env, inv) : 0;
    if (!inv || left <= 0) { await release("canceled", "nothing_due"); await run(db, `UPDATE payment_schedules SET status = 'completed', updated_at = ? WHERE id = ? AND NOT EXISTS (SELECT 1 FROM payment_installments WHERE schedule_id = ? AND status IN ('scheduled','processing'))`, nowIso(), ins.schedule_id, ins.schedule_id); continue; }
    const amount = Math.min(ins.amount_cents, left);
    const payId = newId("pay");
    const fee = feeFor(amount);
    await run(db, "INSERT INTO online_payments (id, club_id, invoice_id, person_ref, kind, amount_cents, fee_cents, method, status, installment_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
      payId, ins.club_id, ins.invoice_id, ins.person_ref, ins.schedule_kind === "autopay" ? "autopay" : "installment", amount, fee, mdt.method, "processing", ins.id);
    await run(db, "UPDATE payment_installments SET payment_id = ? WHERE id = ?", payId, ins.id);
    try {
      const pi = await stripeRequest(env, "POST", "/v1/payment_intents", {
        amount, currency: inv.currency || "eur", customer: mdt.stripe_customer_id, payment_method: mdt.stripe_payment_method,
        payment_method_types: [mdt.method], off_session: true, confirm: true,
        description: (inv.number ? `Facture ${inv.number}` : "Facture") + (ins.schedule_kind === "autopay" ? "" : `, échéance ${ins.seq}`),
        application_fee_amount: fee > 0 ? fee : undefined,
        metadata: { piaffe_payment_id: payId, piaffe_club_id: ins.club_id, piaffe_invoice_id: ins.invoice_id, piaffe_installment_id: ins.id },
      }, { account: acct.stripe_account_id, idempotencyKey: `piaffe_ins_${ins.id}_${attempt}` });
      await run(db, "UPDATE online_payments SET stripe_payment_intent = ?, updated_at = ? WHERE id = ?", pi.id, nowIso(), payId);
      if (pi.status === "succeeded") await paymentSucceeded(env, null, ins.club_id, acct.stripe_account_id, pi);
      else if (pi.status === "requires_payment_method" || pi.status === "canceled") await paymentFailed(env, null, ins.club_id, payId, pi.last_payment_error?.code || "payment_failed", pi.id);
      charged++;
    } catch (e) {
      const reason = e instanceof StripeError ? (e.declineCode || e.code || e.type) : "error";
      await paymentFailed(env, null, ins.club_id, payId, reason);
    }
  }
  return charged;
}

/* ---------- Routes ---------- */

const app = new Hono<AppEnv>();
const managers = requireRole("owner", "manager");
const payers = requireRole("owner", "manager", "member");

app.post("/api/connect/onboard", managers, async (c) => {
  const env = c.env;
  const club = c.get("club")!;
  let a = await connectRow(env.DB, club.id);
  if (!a) {
    const full = await one<any>(env.DB, "SELECT name, email FROM clubs WHERE id = ?", club.id);
    // Compte connecté équivalent « Standard » via les controller properties : le club a le tableau de bord
    // Stripe complet, paie lui-même ses frais, Stripe gère les vérifications et le risque.
    const acct = await stripe(env, "POST", "/v1/accounts", {
      country: "FR", email: full?.email || c.get("user")!.email, default_currency: "eur",
      business_profile: { name: full?.name || club.name },
      controller: { fees: { payer: "account" }, losses: { payments: "stripe" }, requirement_collection: "stripe", stripe_dashboard: { type: "full" } },
      metadata: { piaffe_club_id: club.id },
    }, { idempotencyKey: "piaffe_acct_" + club.id });
    await run(env.DB, "INSERT OR IGNORE INTO connect_accounts (club_id, stripe_account_id, created_by) VALUES (?,?,?)", club.id, acct.id, c.get("user")!.id);
    a = (await connectRow(env.DB, club.id))!;
    await applyAccount(env, club.id, acct);
    await audit(env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "connect.account_created", target: acct.id });
  }
  const link = await stripe(env, "POST", "/v1/account_links", {
    account: a.stripe_account_id, type: "account_onboarding", collection_options: { fields: "eventually_due" },
    refresh_url: appUrl(env, RETURN_PATHS.connectRefresh), return_url: appUrl(env, RETURN_PATHS.connectReturn),
  });
  return c.json({ url: link.url, expires_at: link.expires_at ? new Date(link.expires_at * 1000).toISOString() : null });
});

app.get("/api/connect/status", managers, async (c) => {
  const club = c.get("club")!;
  let a = await connectRow(c.env.DB, club.id);
  if (a && c.req.query("refresh")) {
    const acct = await stripe(c.env, "GET", `/v1/accounts/${a.stripe_account_id}`);
    await applyAccount(c.env, club.id, acct);
    a = await connectRow(c.env.DB, club.id);
  }
  return c.json({ ...statusJson(a), application_fee_percent: APPLICATION_FEE_PERCENT });
});

/** Ce que l'adhérent peut utiliser (boutons de l'interface). */
app.get("/api/pay/options", requireUser, async (c) => {
  const club = c.get("club");
  if (!club || !c.get("membership")) throw new ApiError(403, "no_club", "Choisissez d'abord un club.");
  const a = await connectRow(c.env.DB, club.id);
  const on = !!a?.charges_enabled;
  return c.json({ enabled: on, card: on, sepa: on && !!a?.sepa_enabled, mandate: on && !!a?.sepa_enabled });
});

app.post("/api/pay/invoice/:id", payers, async (c) => {
  const club = c.get("club")!;
  const a = await readyAccount(c.env.DB, club.id);
  const inv = await loadInvoice(c.env, club.id, c.req.param("id"));
  await assertCanActFor(c, inv.customer_ref);
  // L'e-mail du client Stripe est celui de la facture ou de la fiche, jamais celui d'un gérant qui encaisse au guichet.
  const email = inv.email || (c.get("membership")!.role === "member" ? c.get("user")!.email : null);
  const r = await invoiceCheckout(c.env, { inv, acct: a, userId: c.get("user")!.id, email, kind: "checkout",
    successPath: RETURN_PATHS.invoiceSuccess(inv.id), cancelPath: RETURN_PATHS.invoiceCancel(inv.id) });
  return c.json(r);
});

async function setupCheckout(c: Context<AppEnv>, a: ConnectRow, personRef: string, o: { scheduleId?: string; methods: string[]; autopay: boolean; successPath: string; cancelPath: string }) {
  const env = c.env;
  const club = c.get("club")!;
  const cus = await ensureConnectCustomer(env, club.id, a.stripe_account_id, personRef, c.get("membership")!.role === "member" ? c.get("user")!.email : null);
  const mid = newId("mdt");
  await run(env.DB, "INSERT INTO payment_mandates (id, club_id, person_ref, user_id, stripe_customer_id, method, autopay, schedule_id) VALUES (?,?,?,?,?,?,?,?)",
    mid, club.id, personRef, c.get("user")!.id, cus.id, o.methods.length === 1 ? o.methods[0] : "sepa_debit", o.autopay ? 1 : 0, o.scheduleId || null);
  const meta = { piaffe_mandate_id: mid, piaffe_club_id: club.id, piaffe_person_ref: personRef };
  const s = await stripe(env, "POST", "/v1/checkout/sessions", {
    mode: "setup", currency: "eur", locale: "fr", customer: cus.id, payment_method_types: o.methods,
    setup_intent_data: { metadata: meta }, metadata: meta,
    success_url: appUrl(env, o.successPath), cancel_url: appUrl(env, o.cancelPath),
  }, { account: a.stripe_account_id, idempotencyKey: "piaffe_setup_" + mid });
  await run(env.DB, "UPDATE payment_mandates SET stripe_checkout_session = ? WHERE id = ?", s.id, mid);
  return { url: s.url as string, mandate_id: mid };
}

/** Mandat SEPA pour les échéances mensuelles (forfaits, pensions) : prélèvement automatique des factures émises. */
app.post("/api/pay/mandate", payers, async (c) => {
  const club = c.get("club")!;
  const a = await readyAccount(c.env.DB, club.id);
  if (!a.sepa_enabled) throw new ApiError(409, "sepa_not_enabled", "Le prélèvement SEPA n'est pas encore activé sur le compte Stripe du club.");
  const b = await body<{ person_ref?: string }>(c);
  let personRef = typeof b.person_ref === "string" ? b.person_ref.trim() : "";
  if (!personRef) {
    if (isManager(c)) throw bad("missing_field", "Le champ « person_ref » est obligatoire.");
    personRef = (c.get("membership")!.person_ref || "").split(",")[0].trim();
  }
  if (!personRef) throw forbidden("Votre compte n'est relié à aucune fiche adhérent.");
  await assertCanActFor(c, personRef);
  const r = await setupCheckout(c, a, personRef, { methods: ["sepa_debit"], autopay: true, successPath: RETURN_PATHS.mandateSuccess, cancelPath: RETURN_PATHS.mandateCancel });
  return c.json(r);
});

async function visibleRefs(c: Context<AppEnv>): Promise<Set<string> | null> {
  if (isManager(c)) return null; // tout le club
  return payableRefs(c.env.DB, c.get("club")!.id, c.get("membership")!.person_ref);
}
function refFilter(refs: Set<string> | null, col = "person_ref"): [string, string[]] {
  if (!refs) return ["", []];
  const list = [...refs];
  if (!list.length) return [" AND 0", []];
  return [` AND ${col} IN (${list.map(() => "?").join(",")})`, list];
}

app.get("/api/pay/mandates", payers, async (c) => {
  const club = c.get("club")!;
  const refs = await visibleRefs(c);
  const [w, args] = refFilter(refs);
  const pr = c.req.query("person_ref");
  const rows = await all<any>(c.env.DB, `SELECT id, person_ref, method, label, autopay, status, created_at FROM payment_mandates WHERE club_id = ? AND status != 'pending'${w}${pr ? " AND person_ref = ?" : ""} ORDER BY created_at DESC LIMIT 200`,
    club.id, ...args, ...(pr ? [pr] : []));
  return c.json({ mandates: rows.map((r) => ({ ...r, autopay: !!r.autopay })) });
});

async function mandateFor(c: Context<AppEnv>, id: string) {
  const m = await one<any>(c.env.DB, "SELECT * FROM payment_mandates WHERE id = ? AND club_id = ?", id, c.get("club")!.id);
  if (!m) throw notFound("Mandat introuvable.");
  await assertCanActFor(c, m.person_ref);
  return m;
}

app.patch("/api/pay/mandates/:id", payers, async (c) => {
  const m = await mandateFor(c, c.req.param("id"));
  const b = await body<{ autopay?: boolean }>(c);
  if (typeof b.autopay !== "boolean") throw bad("missing_field", "Le champ « autopay » est obligatoire.");
  await run(c.env.DB, "UPDATE payment_mandates SET autopay = ?, updated_at = ? WHERE id = ?", b.autopay ? 1 : 0, nowIso(), m.id);
  return c.json({ ok: true });
});

app.delete("/api/pay/mandates/:id", payers, async (c) => {
  const m = await mandateFor(c, c.req.param("id"));
  await revokeMandate(c.env, c.get("club")!.id, m, true);
  return c.json({ ok: true });
});

app.get("/api/pay/payments", payers, async (c) => {
  const club = c.get("club")!;
  const refs = await visibleRefs(c);
  const [w, args] = refFilter(refs);
  const inv = c.req.query("invoice_id");
  const rows = await all<any>(c.env.DB,
    `SELECT id, invoice_id, person_ref, kind, amount_cents, refunded_cents, fee_cents, method, status, failure_reason, paid_at, created_at
     FROM online_payments WHERE club_id = ? AND status != 'canceled'${w}${inv ? " AND invoice_id = ?" : ""} ORDER BY created_at DESC LIMIT 500`, club.id, ...args, ...(inv ? [inv] : []));
  return c.json({ payments: rows });
});

app.get("/api/pay/schedules", payers, async (c) => {
  const club = c.get("club")!;
  const refs = await visibleRefs(c);
  const [w, args] = refFilter(refs);
  const inv = c.req.query("invoice_id");
  const scheds = await all<any>(c.env.DB, `SELECT id, invoice_id, person_ref, kind, count, total_cents, status, created_at FROM payment_schedules WHERE club_id = ?${w}${inv ? " AND invoice_id = ?" : ""} ORDER BY created_at DESC LIMIT 200`,
    club.id, ...args, ...(inv ? [inv] : []));
  for (const s of scheds) s.installments = await all(c.env.DB, "SELECT seq, due_date, amount_cents, status, attempts FROM payment_installments WHERE schedule_id = ? AND club_id = ? ORDER BY seq", s.id, club.id);
  return c.json({ schedules: scheds });
});

app.delete("/api/pay/schedules/:id", managers, async (c) => {
  const club = c.get("club")!;
  const s = await one<any>(c.env.DB, "SELECT id FROM payment_schedules WHERE id = ? AND club_id = ?", c.req.param("id"), club.id);
  if (!s) throw notFound("Échéancier introuvable.");
  await run(c.env.DB, "UPDATE payment_installments SET status = 'canceled', updated_at = ? WHERE schedule_id = ? AND status = 'scheduled'", nowIso(), s.id);
  await run(c.env.DB, "UPDATE payment_schedules SET status = 'canceled', updated_at = ? WHERE id = ? AND status IN ('active','pending_mandate')", nowIso(), s.id);
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "payment.schedule_canceled", target: s.id });
  return c.json({ ok: true });
});

app.post("/api/pay/payments/:id/refund", managers, async (c) => {
  const club = c.get("club")!;
  const a = await readyAccount(c.env.DB, club.id);
  const p = await one<any>(c.env.DB, "SELECT * FROM online_payments WHERE id = ? AND club_id = ?", c.req.param("id"), club.id);
  if (!p) throw notFound("Paiement introuvable.");
  if (!["succeeded", "partially_refunded"].includes(p.status) || !p.stripe_payment_intent) throw new ApiError(409, "not_refundable", "Ce paiement ne peut pas être remboursé.");
  const b = await body<{ amount_cents?: number; reason?: string }>(c);
  const left = p.amount_cents - p.refunded_cents;
  const amount = b.amount_cents === undefined ? left : Math.round(Number(b.amount_cents));
  if (!Number.isFinite(amount) || amount <= 0 || amount > left) throw bad("invalid_amount", `Le montant à rembourser doit être compris entre 0,01\u00a0€ et ${euros(left)}.`);
  const reason = ["duplicate", "fraudulent", "requested_by_customer"].includes(String(b.reason)) ? b.reason : "requested_by_customer";
  const refund = await stripe(c.env, "POST", "/v1/refunds", {
    payment_intent: p.stripe_payment_intent, amount, reason, refund_application_fee: p.fee_cents > 0 ? true : undefined,
    metadata: { piaffe_payment_id: p.id, piaffe_club_id: club.id },
  }, { account: a.stripe_account_id, idempotencyKey: `piaffe_refund_${p.id}_${p.refunded_cents}_${amount}` });
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "payment.refund", target: p.id, data: { amount, refund: refund.id } });
  return c.json({ ok: true, refund_id: refund.id, status: refund.status, amount_cents: amount });
});

/* ---------- Liens de paiement ---------- */

app.post("/api/pay/link", managers, async (c) => {
  const env = c.env;
  const club = c.get("club")!;
  await readyAccount(env.DB, club.id);
  const b = await body<{ invoice_id?: string; email?: string; send?: boolean }>(c);
  if (!b.invoice_id) throw bad("missing_field", "Le champ « invoice_id » est obligatoire.");
  const inv = await loadInvoice(env, club.id, String(b.invoice_id));
  const amount = await outstanding(env, inv);
  if (amount <= 0) throw new ApiError(409, "nothing_due", "Cette facture est déjà réglée.");
  let email = typeof b.email === "string" ? b.email.trim() : "";
  if (email && !isEmail(email)) throw bad("invalid_email", "L'adresse e-mail n'est pas valide.");
  if (!email) email = inv.email || (inv.customer_ref ? (await personInfo(env.DB, club.id, inv.customer_ref)).email : null) || "";
  const token = "pl_" + randomToken(24);
  const expires = new Date(Date.now() + PAY_LINK_DAYS * DAY).toISOString();
  await run(env.DB, "INSERT INTO pay_links (id, club_id, invoice_id, token_hash, email, created_by, expires_at) VALUES (?,?,?,?,?,?,?)",
    newId("pln"), club.id, inv.id, await sha256(token), email || null, c.get("user")!.id, expires);
  const url = appUrl(env, "/api/pay/l/" + token);
  let sent = false;
  if (email && b.send !== false) {
    const first = inv.customer_ref ? (await personInfo(env.DB, club.id, inv.customer_ref)).first : null;
    const late = inv.due_date ? Math.floor((Date.now() - Date.parse(inv.due_date)) / DAY) : 0;
    await sendMail(env, { to: email, template: "payment_reminder", club_id: club.id, data: {
      level: 1, first, number: inv.number, amount_cents: amount, due_date: inv.due_date || undefined, days_late: late > 0 ? late : undefined, pay_url: url,
    } });
    sent = true;
  }
  await audit(env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "payment.link", target: inv.id, data: { sent } });
  return c.json({ url, expires_at: expires, sent, amount_cents: amount });
});

function page(title: string, msg: string, status: 400 | 404 | 409 | 410 | 429) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]!));
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#f7f5f0;color:#1f2a24;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{max-width:420px;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.06)}h1{font-size:20px;margin:0 0 8px}</style>
</head><body><main><h1>${esc(title)}</h1><p>${esc(msg)}</p></main></body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

/** Lien public : ouvre un Checkout frais pour le reste dû (le lien reste valable même si une session expire). */
app.get("/api/pay/l/:token", async (c) => {
  const env = c.env;
  const ip = c.req.header("cf-connecting-ip") || "local";
  if (!(await rateLimit(env.DB, "paylink:" + ip, 30, 600))) return page("Trop de tentatives", "Réessayez dans quelques minutes.", 429);
  const token = c.req.param("token");
  if (!/^pl_[A-Za-z0-9_-]{20,64}$/.test(token)) return page("Lien invalide", "Ce lien de paiement n'est pas valide. Demandez un nouveau lien à votre club.", 404);
  const l = await one<any>(env.DB, "SELECT * FROM pay_links WHERE token_hash = ?", await sha256(token));
  if (!l || l.revoked_at) return page("Lien invalide", "Ce lien de paiement n'est pas valide. Demandez un nouveau lien à votre club.", 404);
  if (l.expires_at < nowIso()) return page("Lien expiré", "Ce lien de paiement a expiré. Demandez un nouveau lien à votre club.", 410);
  try {
    const a = await readyAccount(env.DB, l.club_id);
    const inv = await loadInvoice(env, l.club_id, l.invoice_id);
    const r = await invoiceCheckout(env, { inv, acct: a, userId: null, email: l.email, kind: "link", successPath: RETURN_PATHS.linkSuccess, cancelPath: RETURN_PATHS.linkCancel });
    await run(env.DB, "UPDATE pay_links SET last_opened_at = ? WHERE id = ?", nowIso(), l.id);
    return c.redirect(r.url, 303);
  } catch (e) {
    if (e instanceof ApiError && e.code === "nothing_due") return page("Facture réglée", "Cette facture est déjà réglée. Merci\u00a0!", 409);
    if (e instanceof ApiError && e.code === "schedule_active") return page("Échéancier en cours", "Cette facture est réglée par échéances. Aucun paiement n'est nécessaire maintenant.", 409);
    if (e instanceof ApiError && e.status < 500) return page("Paiement indisponible", e.message, 409);
    throw e;
  }
});

export default app;
