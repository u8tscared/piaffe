/* Outils de test du lot B : faux Stripe, webhooks signés, factures simulées, capture des événements. */
import { env, seed } from "./helpers";
import { setFetch, signPayload } from "../src/billing/stripe";
import { setInvoiceLookup, type InvoiceInfo } from "../src/billing/invoices";
import { on } from "../src/lib/events";
import { call } from "./helpers";

export interface StripeCall { method: string; path: string; params: Record<string, string>; headers: Record<string, string> }
type Handler = (c: StripeCall) => unknown | Promise<unknown>;

/** Faux Stripe : routes "POST /v1/checkout/sessions" ou regex ; enregistre chaque appel. */
export function fakeStripe(routes: Record<string, Handler> = {}) {
  const calls: StripeCall[] = [];
  const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  setFetch(async (url, init) => {
    const u = new URL(url);
    const method = init.method || "GET";
    const raw = method === "GET" || method === "DELETE" ? u.searchParams.toString() : String(init.body || "");
    const params: Record<string, string> = {};
    for (const [k, v] of new URLSearchParams(raw)) params[k] = v;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init.headers || {}) as Record<string, string>)) headers[k.toLowerCase()] = v;
    const c: StripeCall = { method, path: u.pathname, params, headers };
    calls.push(c);
    const key = `${method} ${u.pathname}`;
    let h: Handler | undefined = routes[key];
    if (!h) for (const [k, fn] of Object.entries(routes)) {
      const [m, p] = k.split(" ");
      if (m === method && p.includes("*") && new RegExp("^" + p.replace(/\*/g, "[^/]+") + "$").test(u.pathname)) { h = fn; break; }
    }
    if (!h) h = defaults(key);
    if (!h) return res(404, { error: { type: "invalid_request_error", message: "No such route " + key } });
    try { return res(200, await h(c)); }
    catch (e: any) { return res(e.status || 400, { error: { type: e.type || "invalid_request_error", code: e.code, message: e.message, decline_code: e.decline } }); }
  });
  return {
    calls,
    find: (method: string, path: string) => calls.filter((c) => c.method === method && c.path === path),
    restore: () => setFetch(),
  };
}

let n = 0;
const id = (p: string) => `${p}_test${Date.now().toString(36)}${(n++).toString(36)}`;

function defaults(key: string): Handler | undefined {
  if (key === "GET /v1/prices") return (c) => ({ data: [{ id: "price_" + c.params["lookup_keys[0]"], unit_amount: 14900, lookup_key: c.params["lookup_keys[0]"] }] });
  if (key === "POST /v1/customers") return () => ({ id: id("cus") });
  if (key === "POST /v1/checkout/sessions") return (c) => { const i = id("cs"); return { id: i, url: "https://checkout.stripe.test/" + i, mode: c.params.mode }; };
  if (key === "POST /v1/billing_portal/sessions") return () => ({ id: id("bps"), url: "https://billing.stripe.test/p" });
  if (key === "POST /v1/accounts") return () => ({ id: id("acct"), charges_enabled: false, payouts_enabled: false, details_submitted: false, capabilities: {}, requirements: { currently_due: ["external_account"] } });
  if (key === "POST /v1/account_links") return () => ({ url: "https://connect.stripe.test/setup", expires_at: Math.floor(Date.now() / 1000) + 300 });
  if (key === "POST /v1/payment_intents") return (c) => ({ id: id("pi"), status: "processing", amount: Number(c.params.amount), metadata: {} });
  if (key === "POST /v1/refunds") return (c) => ({ id: id("re"), status: "succeeded", amount: Number(c.params.amount) });
  if (key.startsWith("POST /v1/checkout/sessions/") && key.endsWith("/expire")) return () => ({ status: "expired" });
  if (key.startsWith("GET /v1/payment_methods/")) return () => ({ type: "sepa_debit", sepa_debit: { last4: "4321" } });
  if (key.startsWith("POST /v1/customers/") && key.endsWith("/balance_transactions")) return () => ({ id: id("cbtxn") });
  return undefined;
}

/** Envoie un événement signé au webhook. */
export async function sendEvent(evt: Record<string, unknown>, o: { connect?: boolean; secret?: string; t?: number; header?: string } = {}) {
  const raw = JSON.stringify({ object: "event", livemode: false, created: Math.floor(Date.now() / 1000), ...evt });
  const secret = o.secret || (o.connect ? "whsec_test_connect" : "whsec_test");
  const sig = o.header ?? await signPayload(raw, secret, o.t);
  return call(o.connect ? "/webhooks/stripe-connect" : "/webhooks/stripe", { method: "POST", body: raw, headers: { "stripe-signature": sig, "content-type": "application/json" } });
}
export const evtId = () => id("evt");

/** Factures simulées (le lot C n'est pas nécessaire pour ces tests). */
export const fakeInvoices = new Map<string, InvoiceInfo>();
export function useFakeInvoices() {
  setInvoiceLookup({ async get(_db, clubId, invoiceId) { const i = fakeInvoices.get(invoiceId); return i && i.club_id === clubId ? i : null; } });
}
export function addInvoice(clubId: string, customerRef: string | null, total: number, extra: Partial<InvoiceInfo> = {}): InvoiceInfo {
  const inv: InvoiceInfo = { id: id("inv"), club_id: clubId, number: "F-2026-" + (1000 + n), customer_ref: customerRef, total_cents: total, paid_cents: 0, status: "issued", due_date: null, label: "Pension complète", currency: "eur", email: null, ...extra };
  fakeInvoices.set(inv.id, inv);
  return inv;
}

/** Capture des événements internes émis. */
export const captured: { type: string; [k: string]: unknown }[] = [];
let hooked = false;
export function captureEvents() {
  if (hooked) return;
  hooked = true;
  for (const t of ["invoice.paid", "payment.failed", "payment.refunded", "subscription.changed", "subscription.paid", "trial.ending", "mandate.revoked"]) on(t, (_e, e) => { captured.push(e as any); });
}
export const eventsOf = (type: string, clubId?: string) => captured.filter((e) => e.type === type && (!clubId || e.club_id === clubId));

/** Club avec compte connecté prêt à encaisser. */
export async function seedConnectedClub(role: Parameters<typeof seed>[0] = "owner", ready = true) {
  const s = await seed(role);
  const acct = id("acct");
  await env.DB.prepare("INSERT INTO connect_accounts (club_id, stripe_account_id, charges_enabled, payouts_enabled, details_submitted, card_enabled, sepa_enabled) VALUES (?,?,?,?,?,?,?)")
    .bind(s.clubId, acct, ready ? 1 : 0, ready ? 1 : 0, ready ? 1 : 0, ready ? 1 : 0, ready ? 1 : 0).run();
  return { ...s, acct };
}

export async function addMember(clubId: string, id: string, data: Record<string, unknown>) {
  await env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data) VALUES (?,?,?,?)").bind(clubId, "members", id, JSON.stringify({ id, ...data })).run();
}

export async function mails(to: string, template?: string) {
  try {
    const r = await env.DB.prepare(`SELECT template FROM email_outbox WHERE to_email = ?${template ? " AND template = ?" : ""}`).bind(...(template ? [to, template] : [to])).all<any>();
    return r.results || [];
  } catch { return []; }
}
