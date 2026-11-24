import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { env, call, seed } from "./helpers";
import { fakeStripe, sendEvent, evtId, captureEvents, eventsOf, mails } from "./billing-helpers";
import { cron } from "../src/billing/routes";
import { clearPriceCache } from "../src/billing/subscription";

const DAY = 864e5;
let fake: ReturnType<typeof fakeStripe>;
beforeAll(() => captureEvents());
afterEach(() => { fake?.restore(); clearPriceCache(); });

const j = async (r: Response) => (await r.json()) as any;
async function setCustomer(clubId: string, cus: string, extra = "") {
  await env.DB.prepare(`INSERT OR IGNORE INTO billing_subscriptions (club_id) VALUES (?)`).bind(clubId).run();
  await env.DB.prepare(`UPDATE billing_subscriptions SET stripe_customer_id = ? ${extra} WHERE club_id = ?`).bind(cus, clubId).run();
}
function subObject(cus: string, o: Record<string, unknown> = {}) {
  const end = Math.floor(Date.now() / 1000) + 30 * 86400;
  return { id: "sub_" + cus, object: "subscription", customer: cus, status: "active", cancel_at_period_end: false, trial_end: null,
    items: { data: [{ price: { id: "price_x", lookup_key: "piaffe_club_month" }, current_period_end: end }] }, metadata: {}, ...o };
}

describe("billing · offres", () => {
  it("liste les trois offres publiquement, avec la mention de franchise de TVA", async () => {
    const r = await j(await call("/api/billing/plans"));
    expect(r.plans.map((p: any) => p.key)).toEqual(["essentiel", "club", "domaine"]);
    expect(r.vat.regime).toBe("franchise");
    expect(r.vat.note).toContain("293 B");
    expect(r.trial_days).toBe(30);
    expect(r.founder).toBeNull();
  });
});

describe("billing · Checkout de l'abonnement", () => {
  it("le titulaire obtient une URL Checkout avec les bons paramètres (prix relu côté serveur, SIREN/TVA, adresse, essai restant)", async () => {
    fake = fakeStripe();
    const s = await seed("owner");
    await env.DB.prepare("UPDATE clubs SET trial_ends_at = ? WHERE id = ?").bind(new Date(Date.now() + 20 * DAY).toISOString(), s.clubId).run();
    const r = await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "club", interval: "year", amount: 1 } });
    expect(r.status).toBe(200);
    expect((await j(r)).url).toMatch(/^https:\/\/checkout\.stripe\.test\//);
    const price = fake.find("GET", "/v1/prices")[0];
    expect(price.params["lookup_keys[0]"]).toBe("piaffe_club_year");
    const cs = fake.find("POST", "/v1/checkout/sessions")[0].params;
    expect(cs.mode).toBe("subscription");
    expect(cs["line_items[0][price]"]).toBe("price_piaffe_club_year");
    expect(cs["tax_id_collection[enabled]"]).toBe("true");
    expect(cs.billing_address_collection).toBe("required");
    expect(cs["customer_update[address]"]).toBe("auto");
    expect(cs["automatic_tax[enabled]"]).toBeUndefined(); // franchise en base : pas de TVA
    expect(cs.allow_promotion_codes).toBe("true");
    expect(Number(cs["subscription_data[trial_end]"])).toBeGreaterThan(Date.now() / 1000 + 19 * 86400);
    expect(cs.client_reference_id).toBe(s.clubId);
    const cus = fake.find("POST", "/v1/customers")[0].params;
    expect(cus["invoice_settings[footer]"]).toContain("293 B");
    expect(cus["metadata[club_id]"]).toBe(s.clubId);
  });

  it("seul le titulaire gère l'abonnement : gérant, employé et adhérent reçoivent 403", async () => {
    fake = fakeStripe();
    for (const role of ["manager", "staff", "member", "accountant"] as const) {
      const s = await seed(role);
      expect((await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "club" } })).status).toBe(403);
      expect((await call("/api/billing/portal", { method: "POST", token: s.token })).status).toBe(403);
    }
    expect((await call("/api/billing/checkout", { method: "POST", json: { plan: "club" } })).status).toBe(401);
    expect(fake.calls.length).toBe(0);
  });

  it("refuse une offre ou une périodicité inconnue", async () => {
    fake = fakeStripe();
    const s = await seed("owner");
    expect((await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "or" } })).status).toBe(400);
    expect((await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "club", interval: "week" } })).status).toBe(400);
  });

  it("applique un code promo Stripe valide et refuse un code inconnu", async () => {
    fake = fakeStripe({ "GET /v1/promotion_codes": (c) => ({ data: c.params.code === "RENTREE" ? [{ id: "promo_1" }] : [] }) });
    const s = await seed("owner");
    const ok = await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "essentiel", promo_code: "RENTREE" } });
    expect(ok.status).toBe(200);
    const cs = fake.find("POST", "/v1/checkout/sessions")[0].params;
    expect(cs["discounts[0][promotion_code]"]).toBe("promo_1");
    expect(cs.allow_promotion_codes).toBeUndefined();
    const ko = await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "essentiel", promo_code: "FAUX" } });
    expect(ko.status).toBe(400);
    expect((await j(ko)).error.code).toBe("promo_invalid");
  });

  it("parrainage : le code d'un autre club applique le coupon, son propre code est refusé", async () => {
    fake = fakeStripe();
    const parrain = await seed("owner");
    const code = (await j(await call("/api/billing/subscription", { token: parrain.token }))).referral_code;
    expect(code).toMatch(/^[A-Z0-9]+-[A-Z0-9]{2,4}$/);
    expect((await call("/api/billing/checkout", { method: "POST", token: parrain.token, json: { plan: "club", referral_code: code } })).status).toBe(400);
    const filleul = await seed("owner");
    const r = await call("/api/billing/checkout", { method: "POST", token: filleul.token, json: { plan: "club", referral_code: code.toLowerCase() } });
    expect(r.status).toBe(200);
    expect(fake.find("POST", "/v1/checkout/sessions").at(-1)!.params["discounts[0][coupon]"]).toBe("piaffe_parrainage");
    const row = await env.DB.prepare("SELECT referred_by FROM billing_subscriptions WHERE club_id = ?").bind(filleul.clubId).first<any>();
    expect(row.referred_by).toBe(parrain.clubId);
  });

  it("refuse un second Checkout quand un abonnement est déjà actif", async () => {
    fake = fakeStripe();
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_dup", ", stripe_subscription_id = 'sub_dup', status = 'active'");
    expect((await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "club" } })).status).toBe(409);
  });

  it("portail client : 409 sans client Stripe, URL sinon", async () => {
    fake = fakeStripe();
    const s = await seed("owner");
    expect((await call("/api/billing/portal", { method: "POST", token: s.token })).status).toBe(409);
    await setCustomer(s.clubId, "cus_portal");
    const r = await call("/api/billing/portal", { method: "POST", token: s.token });
    expect((await j(r)).url).toBe("https://billing.stripe.test/p");
    expect(fake.find("POST", "/v1/billing_portal/sessions")[0].params.customer).toBe("cus_portal");
  });

  it("l'offre fondateurs utilise le prix fondateur pour le plan Club", async () => {
    fake = fakeStripe();
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_fdr", ", founder = 1");
    expect((await j(await call("/api/billing/plans", { token: s.token }))).founder.month_cents).toBe(9900);
    await call("/api/billing/checkout", { method: "POST", token: s.token, json: { plan: "club" } });
    expect(fake.find("GET", "/v1/prices")[0].params["lookup_keys[0]"]).toBe("piaffe_fondateur_month");
  });

  it("la route d'administration du catalogue est fermée sans secret", async () => {
    const r = await call("/admin/billing/setup", { method: "POST", headers: { authorization: "Bearer n'importe-quoi-de-tres-long-0000" } });
    expect(r.status).toBe(403);
  });
});

describe("billing · webhooks de la plateforme", () => {
  it("refuse une signature invalide ou absente (400) sans rien enregistrer", async () => {
    const id = evtId();
    expect((await sendEvent({ id, type: "invoice.paid", data: { object: {} } }, { secret: "whsec_mauvais" })).status).toBe(400);
    expect((await sendEvent({ id, type: "invoice.paid", data: { object: {} } }, { header: "" })).status).toBe(400);
    expect((await sendEvent({ id, type: "invoice.paid", data: { object: {} } }, { t: Math.floor(Date.now() / 1000) - 600 })).status).toBe(400);
    expect(await env.DB.prepare("SELECT id FROM stripe_events WHERE id = ?").bind(id).first()).toBeNull();
  });

  it("un abonnement mis à jour synchronise clubs.plan / plan_status et émet subscription.changed une seule fois malgré le rejeu", async () => {
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_sync");
    const evt = { id: evtId(), type: "customer.subscription.updated", data: { object: subObject("cus_sync") } };
    const r1 = await sendEvent(evt);
    expect(r1.status).toBe(200);
    const club = await env.DB.prepare("SELECT plan, plan_status FROM clubs WHERE id = ?").bind(s.clubId).first<any>();
    expect(club).toEqual({ plan: "club", plan_status: "active" });
    const r2 = await sendEvent(evt);
    expect((await j(r2)).duplicate).toBe(true);
    expect(eventsOf("subscription.changed", s.clubId).length).toBe(1);
  });

  it("checkout.session.completed relit l'abonnement chez Stripe et l'applique", async () => {
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_cs");
    fake = fakeStripe({ "GET /v1/subscriptions/*": () => subObject("cus_cs", { id: "sub_cs", status: "trialing", trial_end: Math.floor(Date.now() / 1000) + 10 * 86400, items: { data: [{ price: { lookup_key: "piaffe_domaine_month" } }] } }) });
    const r = await sendEvent({ id: evtId(), type: "checkout.session.completed", data: { object: { mode: "subscription", customer: "cus_cs", subscription: "sub_cs", client_reference_id: s.clubId } } });
    expect(r.status).toBe(200);
    const club = await env.DB.prepare("SELECT plan, plan_status, trial_ends_at FROM clubs WHERE id = ?").bind(s.clubId).first<any>();
    expect(club.plan).toBe("domaine");
    expect(club.plan_status).toBe("trialing");
    expect(Date.parse(club.trial_ends_at)).toBeGreaterThan(Date.now() + 9 * DAY);
  });

  it("un abonnement d'un client inconnu n'affecte aucun club (isolation)", async () => {
    const s = await seed("owner");
    const r = await sendEvent({ id: evtId(), type: "customer.subscription.updated", data: { object: subObject("cus_inconnu", { metadata: { club_id: s.clubId } }) } });
    expect(r.status).toBe(200);
    expect((await j(r)).result).toBe("ok");
    const club = await env.DB.prepare("SELECT plan, plan_status FROM clubs WHERE id = ?").bind(s.clubId).first<any>();
    expect(club).toEqual({ plan: "trial", plan_status: "trialing" });
  });

  it("un échec de paiement ouvre la période de grâce puis bloque l'écriture ; invoice.paid rétablit", async () => {
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_fail");
    await sendEvent({ id: evtId(), type: "customer.subscription.updated", data: { object: subObject("cus_fail", { status: "past_due" }) } });
    await sendEvent({ id: evtId(), type: "invoice.payment_failed", data: { object: { id: "in_1", customer: "cus_fail", amount_due: 14900 } } });
    let sub = await j(await call("/api/billing/subscription", { token: s.token }));
    expect(sub.plan_status).toBe("past_due");
    expect(sub.access.write).toBe(true);
    expect(eventsOf("payment.failed", s.clubId).length).toBe(1);
    await env.DB.prepare("UPDATE billing_subscriptions SET past_due_since = ? WHERE club_id = ?").bind(new Date(Date.now() - 8 * DAY).toISOString(), s.clubId).run();
    sub = await j(await call("/api/billing/subscription", { token: s.token }));
    expect(sub.access).toMatchObject({ read: true, write: false, reason: "blocked_unpaid" });
    await sendEvent({ id: evtId(), type: "invoice.paid", data: { object: { id: "in_2", customer: "cus_fail", amount_paid: 14900, hosted_invoice_url: "https://invoice.stripe.test/x" } } });
    sub = await j(await call("/api/billing/subscription", { token: s.token }));
    expect(sub.plan_status).toBe("active");
    expect(sub.access.write).toBe(true);
    expect(eventsOf("subscription.paid", s.clubId)[0]).toMatchObject({ amount_cents: 14900, stripe_invoice_id: "in_2" });
    expect((await mails(s.email, "subscription_receipt")).length).toBe(1);
    expect((await mails(s.email, "payment_failed")).length).toBe(1);
  });

  it("le parrain reçoit son crédit une seule fois, au premier paiement du filleul", async () => {
    fake = fakeStripe();
    const parrain = await seed("owner");
    await setCustomer(parrain.clubId, "cus_parrain");
    const filleul = await seed("owner");
    await setCustomer(filleul.clubId, "cus_filleul", `, referred_by = '${parrain.clubId}'`);
    for (const id of ["in_f1", "in_f2"]) await sendEvent({ id: evtId(), type: "invoice.paid", data: { object: { id, customer: "cus_filleul", amount_paid: 9900 } } });
    const bt = fake.find("POST", "/v1/customers/cus_parrain/balance_transactions");
    expect(bt.length).toBe(1);
    expect(bt[0].params.amount).toBe("-5000");
  });

  it("customer.subscription.trial_will_end émet trial.ending et envoie trial_ending au titulaire", async () => {
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_trial");
    await sendEvent({ id: evtId(), type: "customer.subscription.trial_will_end", data: { object: { customer: "cus_trial", trial_end: Math.floor(Date.now() / 1000) + 3 * 86400 } } });
    const e = eventsOf("trial.ending", s.clubId);
    expect(e.length).toBe(1);
    expect(e[0].days_left).toBe(3);
    expect((await mails(s.email, "trial_ending")).length).toBe(1);
  });

  it("une erreur de traitement répond 500 puis l'événement est retraité au nouvel essai", async () => {
    const s = await seed("owner");
    await setCustomer(s.clubId, "cus_retry");
    fake = fakeStripe({ "GET /v1/subscriptions/*": () => { throw Object.assign(new Error("boom"), { status: 500, type: "api_error" }); } });
    const evt = { id: evtId(), type: "checkout.session.completed", data: { object: { mode: "subscription", customer: "cus_retry", subscription: "sub_r" } } };
    expect((await sendEvent(evt)).status).toBe(500);
    fake.restore();
    fake = fakeStripe({ "GET /v1/subscriptions/*": () => subObject("cus_retry", { id: "sub_r" }) });
    expect((await sendEvent(evt)).status).toBe(200);
    const row = await env.DB.prepare("SELECT status, attempts FROM stripe_events WHERE id = ?").bind(evt.id).first<any>();
    expect(row).toEqual({ status: "processed", attempts: 2 });
  });
});

describe("billing · cron de fin d'essai", () => {
  it("envoie un seul rappel par palier et passe en impayé à la fin de l'essai sans abonnement", async () => {
    const a = await seed("owner");
    await env.DB.prepare("UPDATE clubs SET trial_ends_at = ? WHERE id = ?").bind(new Date(Date.now() + 2.5 * DAY).toISOString(), a.clubId).run();
    const b = await seed("owner");
    await env.DB.prepare("UPDATE clubs SET trial_ends_at = ? WHERE id = ?").bind(new Date(Date.now() - DAY).toISOString(), b.clubId).run();
    await cron(env, "0 6 * * *");
    await cron(env, "0 6 * * *");
    expect(eventsOf("trial.ending", a.clubId).length).toBe(1);
    const row = await env.DB.prepare("SELECT trial_reminders FROM billing_subscriptions WHERE club_id = ?").bind(a.clubId).first<any>();
    expect(JSON.parse(row.trial_reminders).sort()).toEqual([3, 7]);
    const cb = await env.DB.prepare("SELECT plan_status FROM clubs WHERE id = ?").bind(b.clubId).first<any>();
    expect(cb.plan_status).toBe("unpaid");
    const sub = await j(await call("/api/billing/subscription", { token: b.token }));
    expect(sub.access.write).toBe(true); // encore dans les 7 jours de grâce
  });
});
