import { describe, it, expect, afterEach } from "vitest";
import { Hono } from "hono";
import { env } from "./helpers";
import { formEncode, signPayload, verifyStripeSignature, stripe, stripeRequest, STRIPE_API_VERSION } from "../src/billing/stripe";
import { computeAccess, requireActivePlan } from "../src/billing/access";
import { ensureCatalog } from "../src/billing/setup-stripe";
import { catalog, planFromLookupKey, PLANS } from "../src/billing/plans";
import { tableInvoiceLookup, remainingCents } from "../src/billing/invoices";
import { errorHandler } from "../src/lib/http";
import { fakeStripe } from "./billing-helpers";

const DAY = 864e5;
let fake: ReturnType<typeof fakeStripe> | null = null;
afterEach(() => { fake?.restore(); fake = null; });

describe("billing · encodage et client Stripe", () => {
  it("encode les objets imbriqués et les tableaux au format Stripe", () => {
    const s = formEncode({ a: 1, b: { c: "x y", d: [{ e: true }, { e: false }] }, skip: undefined, n: null, l: ["u", "v"] });
    expect(decodeURIComponent(s)).toBe("a=1&b[c]=x y&b[d][0][e]=true&b[d][1][e]=false&l[0]=u&l[1]=v");
  });

  it("envoie la version d'API fixée, une clé d'idempotence et l'en-tête Stripe-Account", async () => {
    fake = fakeStripe({ "POST /v1/customers": () => ({ id: "cus_1" }) });
    await stripeRequest(env, "POST", "/v1/customers", { name: "Léa" }, { account: "acct_9", idempotencyKey: "k1" });
    const c = fake.calls[0];
    expect(c.headers["stripe-version"]).toBe(STRIPE_API_VERSION);
    expect(c.headers["idempotency-key"]).toBe("k1");
    expect(c.headers["stripe-account"]).toBe("acct_9");
    expect(c.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    expect(c.params.name).toBe("Léa");
  });

  it("traduit un refus de carte en 402 et une erreur Stripe en 502 sans exposer le message", async () => {
    fake = fakeStripe({
      "POST /v1/payment_intents": () => { throw Object.assign(new Error("Your card was declined."), { status: 402, type: "card_error", code: "card_declined" }); },
      "POST /v1/refunds": () => { throw Object.assign(new Error("secret detail"), { status: 400, type: "invalid_request_error" }); },
    });
    await expect(stripe(env, "POST", "/v1/payment_intents", {})).rejects.toMatchObject({ status: 402, code: "payment_refused" });
    await expect(stripe(env, "POST", "/v1/refunds", {})).rejects.toMatchObject({ status: 502, code: "stripe_error" });
  });
});

describe("billing · signature des webhooks", () => {
  const body = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
  it("accepte une signature valide", async () => {
    expect(await verifyStripeSignature(body, await signPayload(body, "whsec_a"), "whsec_a")).toBe(true);
  });
  it("refuse un mauvais secret, un corps modifié et un en-tête absent", async () => {
    const h = await signPayload(body, "whsec_a");
    expect(await verifyStripeSignature(body, h, "whsec_b")).toBe(false);
    expect(await verifyStripeSignature(body + " ", h, "whsec_a")).toBe(false);
    expect(await verifyStripeSignature(body, null, "whsec_a")).toBe(false);
    expect(await verifyStripeSignature(body, "v1=abc", "whsec_a")).toBe(false);
  });
  it("refuse une signature de plus de 5 minutes (rejeu)", async () => {
    const t = Math.floor(Date.now() / 1000) - 301;
    expect(await verifyStripeSignature(body, await signPayload(body, "whsec_a", t), "whsec_a")).toBe(false);
    const t2 = Math.floor(Date.now() / 1000) - 290;
    expect(await verifyStripeSignature(body, await signPayload(body, "whsec_a", t2), "whsec_a")).toBe(true);
  });
  it("accepte plusieurs v1 (rotation du secret côté Stripe) et plusieurs secrets côté Stabl", async () => {
    const good = (await signPayload(body, "whsec_new")).split(",")[1];
    const t = Math.floor(Date.now() / 1000);
    const header = `t=${t},v1=${"0".repeat(64)},${good},v0=deadbeef,extra=1`;
    expect(await verifyStripeSignature(body, header, "whsec_new")).toBe(true);
    expect(await verifyStripeSignature(body, await signPayload(body, "whsec_old"), "whsec_new, whsec_old")).toBe(true);
  });
});

describe("billing · règle d'accès selon l'abonnement", () => {
  const now = Date.parse("2026-11-24T10:00:00Z");
  const iso = (d: number) => new Date(now + d * DAY).toISOString();
  it("abonnement actif : écriture permise", () => {
    expect(computeAccess({ plan_status: "active", trial_ends_at: null, past_due_since: null }, now).write).toBe(true);
  });
  it("essai : permis pendant l'essai et 7 jours après, bloqué ensuite", () => {
    expect(computeAccess({ plan_status: "trialing", trial_ends_at: iso(5), past_due_since: null }, now)).toMatchObject({ write: true, reason: "trial" });
    expect(computeAccess({ plan_status: "trialing", trial_ends_at: iso(-3), past_due_since: null }, now)).toMatchObject({ write: true, reason: "trial_grace" });
    expect(computeAccess({ plan_status: "trialing", trial_ends_at: iso(-8), past_due_since: null }, now)).toMatchObject({ write: false, read: true, reason: "blocked_trial" });
  });
  it("impayé : écriture bloquée 7 jours après le début de l'impayé, lecture toujours permise", () => {
    expect(computeAccess({ plan_status: "past_due", trial_ends_at: null, past_due_since: iso(-6) }, now)).toMatchObject({ write: true, reason: "past_due_grace" });
    expect(computeAccess({ plan_status: "past_due", trial_ends_at: null, past_due_since: iso(-7.1) }, now)).toMatchObject({ write: false, read: true, reason: "blocked_unpaid" });
    expect(computeAccess({ plan_status: "unpaid", trial_ends_at: iso(-10), past_due_since: null }, now).write).toBe(false);
  });
  it("résilié : permis jusqu'à la fin de la période payée", () => {
    expect(computeAccess({ plan_status: "canceled", trial_ends_at: null, past_due_since: null, current_period_end: iso(3) }, now).write).toBe(true);
    expect(computeAccess({ plan_status: "canceled", trial_ends_at: null, past_due_since: null, current_period_end: iso(-1) }, now).write).toBe(false);
  });
  it("requireActivePlan laisse lire et bloque l'écriture (402) d'un club impayé", async () => {
    const clubId = "clb_access_" + Date.now();
    await env.DB.prepare("INSERT INTO clubs (id, name, slug, plan_status, trial_ends_at) VALUES (?,?,?,?,?)").bind(clubId, "Écurie", "e-" + clubId, "unpaid", new Date(Date.now() - 20 * DAY).toISOString()).run();
    const app = new Hono<any>();
    app.onError(errorHandler as any);
    app.use("*", async (c, next) => { c.set("club", { id: clubId }); await next(); });
    app.get("/x", requireActivePlan, (c) => c.json({ ok: true }));
    app.post("/x", requireActivePlan, (c) => c.json({ ok: true }));
    expect((await app.request("/x", {}, env)).status).toBe(200);
    const r = await app.request("/x", { method: "POST" }, env);
    expect(r.status).toBe(402);
    expect(((await r.json()) as any).error.code).toBe("plan_inactive");
  });
});

describe("billing · catalogue et utilitaires", () => {
  it("les offres annuelles offrent deux mois et les lookup_key se relisent", () => {
    for (const p of PLANS) expect(p.year_cents).toBe(p.month_cents * 10);
    expect(planFromLookupKey("piaffe_club_year")).toEqual({ plan: "club", interval: "year", founder: false });
    expect(planFromLookupKey("piaffe_fondateur_month")).toEqual({ plan: "club", interval: "month", founder: true });
    expect(planFromLookupKey("autre")).toBeNull();
  });

  it("le script de catalogue crée produits, prix et coupons puis ne recrée rien au second passage", async () => {
    const products = new Map<string, any>(), prices: any[] = [], coupons = new Map<string, any>();
    const req = async (m: string, p: string, params: any = {}) => {
      if (m === "GET" && p.startsWith("/v1/products/")) { const x = products.get(p.split("/")[3]); return x ? { status: 200, data: x } : { status: 404, data: {} }; }
      if (m === "POST" && p === "/v1/products") { products.set(params.id, { ...params, active: true }); return { status: 200, data: params }; }
      if (m === "GET" && p === "/v1/prices") return { status: 200, data: { data: prices.filter((x) => x.active && x.lookup_key === params.lookup_keys[0]) } };
      if (m === "POST" && p === "/v1/prices") { for (const x of prices) if (x.lookup_key === params.lookup_key) x.lookup_key = null; prices.push({ id: "price_" + prices.length, active: true, lookup_key: params.lookup_key, unit_amount: params.unit_amount, currency: params.currency, recurring: params.recurring, product: params.product }); return { status: 200, data: {} }; }
      if (m === "POST" && p.startsWith("/v1/prices/")) { const x = prices.find((y) => y.id === p.split("/")[3]); x.active = false; return { status: 200, data: x }; }
      if (m === "GET" && p.startsWith("/v1/coupons/")) { const x = coupons.get(p.split("/")[3]); return x ? { status: 200, data: x } : { status: 404, data: {} }; }
      if (m === "POST" && p === "/v1/coupons") { coupons.set(params.id, params); return { status: 200, data: params }; }
      return { status: 404, data: {} };
    };
    const cat = catalog();
    await ensureCatalog(req as any, cat);
    expect(products.size).toBe(4);
    expect(prices.length).toBe(8);
    expect(coupons.size).toBe(2);
    const log = await ensureCatalog(req as any, cat);
    expect(prices.length).toBe(8);
    expect(log.filter((l) => l.startsWith("Prix déjà présent")).length).toBe(8);
    // Changement de prix : nouveau Price, ancien archivé.
    cat.products[0].prices[0].amount = 6900;
    await ensureCatalog(req as any, cat);
    expect(prices.length).toBe(9);
    expect(prices.filter((x) => x.active).length).toBe(8);
  });

  it("lit les factures du lot C (reste dû, acomptes, avoirs) et refuse celles d'un autre club ou de la plateforme", async () => {
    await env.DB.exec("CREATE TABLE IF NOT EXISTS test_invoices_b (id TEXT PRIMARY KEY, club_id TEXT, number TEXT, customer_ref TEXT, total_ttc INTEGER, paid_amount INTEGER, prepaid_amount INTEGER, credited_amount INTEGER, status TEXT, issuer TEXT)");
    await env.DB.prepare("INSERT INTO test_invoices_b VALUES (?,?,?,?,?,?,?,?,?,?)").bind("inv_a", "clb_a", "F-1", "m001", 52000, 10000, 2000, 0, "partially_paid", "club").run();
    await env.DB.prepare("INSERT INTO test_invoices_b VALUES (?,?,?,?,?,?,?,?,?,?)").bind("inv_p", "clb_a", "PF-1", null, 14900, 0, 0, 0, "issued", "platform").run();
    const l = tableInvoiceLookup("test_invoices_b");
    const inv = await l.get(env.DB, "clb_a", "inv_a");
    expect(inv && remainingCents(inv)).toBe(40000);
    expect(await l.get(env.DB, "clb_b", "inv_a")).toBeNull();
    expect(await l.get(env.DB, "clb_a", "inv_p")).toBeNull();
  });
});
