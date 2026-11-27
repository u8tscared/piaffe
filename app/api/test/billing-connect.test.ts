import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { env, call, seed } from "./helpers";
import { fakeStripe, sendEvent, evtId, captureEvents, eventsOf, useFakeInvoices, addInvoice, fakeInvoices, seedConnectedClub, addMember, mails } from "./billing-helpers";
import { cron } from "../src/billing/routes";
import { emit } from "../src/lib/events";

let fake: ReturnType<typeof fakeStripe>;
beforeAll(() => { captureEvents(); useFakeInvoices(); });
afterEach(() => fake?.restore());
const j = async (r: Response) => (await r.json()) as any;

/** Adhérent rattaché à la fiche m001 du même club. */
async function memberOf(clubId: string, personRef = "m001") {
  return seed("member", { clubId, personRef });
}

describe("billing · onboarding Connect", () => {
  it("le gérant crée le compte connecté (frais payés par le club, tableau de bord complet) puis reçoit un lien ; le compte est réutilisé", async () => {
    fake = fakeStripe();
    const s = await seed("manager");
    const r = await call("/api/connect/onboard", { method: "POST", token: s.token });
    expect(r.status).toBe(200);
    expect((await j(r)).url).toBe("https://connect.stripe.test/setup");
    const acct = fake.find("POST", "/v1/accounts")[0].params;
    expect(acct["controller[fees][payer]"]).toBe("account");
    expect(acct["controller[losses][payments]"]).toBe("stripe");
    expect(acct["controller[stripe_dashboard][type]"]).toBe("full");
    expect(acct["controller[requirement_collection]"]).toBe("stripe");
    expect(acct.country).toBe("FR");
    expect(acct["metadata[piaffe_club_id]"]).toBe(s.clubId);
    const link = fake.find("POST", "/v1/account_links")[0].params;
    expect(link.type).toBe("account_onboarding");
    await call("/api/connect/onboard", { method: "POST", token: s.token });
    expect(fake.find("POST", "/v1/accounts").length).toBe(1);
    expect(fake.find("POST", "/v1/account_links").length).toBe(2);
    const st = await j(await call("/api/connect/status", { token: s.token }));
    expect(st).toMatchObject({ connected: true, charges_enabled: false, application_fee_percent: 0 });
    expect(st.requirements).toContain("external_account");
  });

  it("employé, coach, adhérent et comptable ne gèrent pas Connect (403)", async () => {
    fake = fakeStripe();
    for (const role of ["staff", "coach", "member", "accountant"] as const) {
      const s = await seed(role);
      expect((await call("/api/connect/onboard", { method: "POST", token: s.token })).status).toBe(403);
      expect((await call("/api/connect/status", { token: s.token })).status).toBe(403);
    }
    expect(fake.calls.length).toBe(0);
  });

  it("account.updated active le compte ; un événement d'un compte inconnu est ignoré", async () => {
    const s = await seedConnectedClub("owner", false);
    const r = await sendEvent({ id: evtId(), type: "account.updated", account: s.acct, data: { object: { id: s.acct, charges_enabled: true, payouts_enabled: true, details_submitted: true, capabilities: { card_payments: "active", sepa_debit_payments: "active" }, requirements: { currently_due: [] } } } }, { connect: true });
    expect(r.status).toBe(200);
    const st = await j(await call("/api/connect/status", { token: s.token }));
    expect(st).toMatchObject({ charges_enabled: true, card: true, sepa: true });
    const other = await sendEvent({ id: evtId(), type: "account.updated", account: "acct_inconnu", data: { object: { id: "acct_inconnu", charges_enabled: true } } }, { connect: true });
    expect(await j(other)).toMatchObject({ received: true, result: "ignored" });
  });

  it("le webhook Connect vérifie sa propre signature", async () => {
    const s = await seedConnectedClub();
    const r = await sendEvent({ id: evtId(), type: "account.updated", account: s.acct, data: { object: { id: s.acct } } }, { connect: true, secret: "whsec_test" });
    expect(r.status).toBe(400);
  });
});

describe("billing · paiement d'une facture du club", () => {
  it("l'adhérent paie sa facture : Checkout sur le compte du club, montant relu côté serveur, sans commission", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", last: "Martin", email: "lea.martin@exemple.fr", fam: "F1" });
    const m = await memberOf(club.clubId);
    const inv = addInvoice(club.clubId, "m001", 52000, { paid_cents: 12000 });
    const r = await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: m.token, json: { amount_cents: 1 } });
    expect(r.status).toBe(200);
    const out = await j(r);
    expect(out.amount_cents).toBe(40000);
    const cs = fake.find("POST", "/v1/checkout/sessions")[0];
    expect(cs.headers["stripe-account"]).toBe(club.acct);
    expect(cs.params.mode).toBe("payment");
    expect(cs.params["line_items[0][price_data][unit_amount]"]).toBe("40000");
    expect(cs.params["payment_intent_data[application_fee_amount]"]).toBeUndefined();
    expect(cs.params["payment_method_types[1]"]).toBe("sepa_debit");
    expect(cs.params["payment_intent_data[metadata][piaffe_payment_id]"]).toBe(out.payment_id);
    // Client Stripe créé sur le compte connecté, avec l'e-mail de la fiche.
    const cus = fake.find("POST", "/v1/customers")[0];
    expect(cus.headers["stripe-account"]).toBe(club.acct);
    expect(cus.params.email).toBe("lea.martin@exemple.fr");
  });

  it("un adhérent ne paie pas la facture d'un autre adhérent (403) mais peut payer celle de sa famille", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", fam: "F1" });
    await addMember(club.clubId, "m002", { first: "Zoé", fam: "F1" });
    await addMember(club.clubId, "m003", { first: "Hugo", fam: "F3" });
    const m = await memberOf(club.clubId);
    const autre = addInvoice(club.clubId, "m003", 10000);
    expect((await call(`/api/pay/invoice/${autre.id}`, { method: "POST", token: m.token })).status).toBe(403);
    const famille = addInvoice(club.clubId, "m002", 10000);
    expect((await call(`/api/pay/invoice/${famille.id}`, { method: "POST", token: m.token })).status).toBe(200);
    const staff = await seed("staff", { clubId: club.clubId });
    expect((await call(`/api/pay/invoice/${famille.id}`, { method: "POST", token: staff.token })).status).toBe(403);
  });

  it("isolation : la facture d'un autre club est introuvable (404)", async () => {
    fake = fakeStripe();
    const a = await seedConnectedClub();
    const b = await seedConnectedClub();
    const invB = addInvoice(b.clubId, "m001", 10000);
    expect((await call(`/api/pay/invoice/${invB.id}`, { method: "POST", token: a.token })).status).toBe(404);
    // En forçant l'en-tête du club B, un utilisateur sans adhésion à B n'a aucun rôle.
    expect((await call(`/api/pay/invoice/${invB.id}`, { method: "POST", token: a.token, club: b.clubId })).status).toBe(403);
    expect(fake.calls.length).toBe(0);
  });

  it("409 si le compte du club n'est pas activé ou si la facture est réglée", async () => {
    fake = fakeStripe();
    const off = await seedConnectedClub("owner", false);
    const inv = addInvoice(off.clubId, null, 10000);
    expect((await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: off.token }))).error.code).toBe("connect_not_ready");
    const on = await seedConnectedClub();
    const paid = addInvoice(on.clubId, null, 10000, { paid_cents: 10000 });
    expect((await j(await call(`/api/pay/invoice/${paid.id}`, { method: "POST", token: on.token }))).error.code).toBe("nothing_due");
    const draft = addInvoice(on.clubId, null, 10000, { status: "draft" });
    expect((await call(`/api/pay/invoice/${draft.id}`, { method: "POST", token: on.token })).status).toBe(409);
  });

  it("une nouvelle session expire la précédente (pas de double paiement)", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    const inv = addInvoice(club.clubId, null, 10000);
    await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: club.token });
    await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: club.token });
    expect(fake.calls.filter((c) => c.path.endsWith("/expire")).length).toBe(1);
    const rows = await env.DB.prepare("SELECT status FROM online_payments WHERE invoice_id = ? ORDER BY created_at").bind(inv.id).all<any>();
    expect(rows.results.map((r: any) => r.status)).toEqual(["canceled", "pending"]);
  });

  it("payment_intent.succeeded émet invoice.paid une seule fois, même rejoué ou doublé par un second événement", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", email: "lea.recu@exemple.fr" });
    const inv = addInvoice(club.clubId, "m001", 25000);
    const { payment_id } = await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: club.token }));
    const pi = { id: "pi_ok_" + payment_id, object: "payment_intent", amount: 25000, amount_received: 25000, payment_method_types: ["card"], latest_charge: "ch_1", metadata: { piaffe_payment_id: payment_id, piaffe_club_id: club.clubId, piaffe_invoice_id: inv.id } };
    const evt = { id: evtId(), type: "payment_intent.succeeded", account: club.acct, data: { object: pi } };
    expect((await sendEvent(evt, { connect: true })).status).toBe(200);
    expect((await j(await sendEvent(evt, { connect: true }))).duplicate).toBe(true);
    await sendEvent({ ...evt, id: evtId() }, { connect: true });
    const paid = eventsOf("invoice.paid", club.clubId);
    expect(paid.length).toBe(1);
    expect(paid[0]).toMatchObject({ invoice_id: inv.id, amount_cents: 25000, method: "card", stripe_ref: pi.id });
    expect((await mails("lea.recu@exemple.fr", "payment_receipt")).length).toBe(1);
    const list = await j(await call(`/api/pay/payments?invoice_id=${inv.id}`, { token: club.token }));
    expect(list.payments[0].status).toBe("succeeded");
  });

  it("un événement Connect qui annonce un autre club est ignoré", async () => {
    fake = fakeStripe();
    const a = await seedConnectedClub();
    const b = await seedConnectedClub();
    const inv = addInvoice(b.clubId, null, 10000);
    const { payment_id } = await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: b.token }));
    // Événement venu du compte du club A, qui vise le paiement du club B.
    const r = await sendEvent({ id: evtId(), type: "payment_intent.succeeded", account: a.acct, data: { object: { id: "pi_x", amount: 10000, metadata: { piaffe_payment_id: payment_id } } } }, { connect: true });
    expect((await j(r)).result).toBe("ignored");
    expect(eventsOf("invoice.paid", b.clubId).length).toBe(0);
  });

  it("payment_intent.payment_failed émet payment.failed", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    const inv = addInvoice(club.clubId, null, 10000);
    const { payment_id } = await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: club.token }));
    await sendEvent({ id: evtId(), type: "payment_intent.payment_failed", account: club.acct, data: { object: { id: "pi_f", metadata: { piaffe_payment_id: payment_id }, last_payment_error: { code: "card_declined" } } } }, { connect: true });
    expect(eventsOf("payment.failed", club.clubId)[0]).toMatchObject({ invoice_id: inv.id, reason: "card_declined" });
  });

  it("remboursement : réservé au gérant, borné au montant payé, puis charge.refunded émet payment.refunded", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa" });
    const inv = addInvoice(club.clubId, "m001", 30000);
    const { payment_id } = await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: club.token }));
    await sendEvent({ id: evtId(), type: "payment_intent.succeeded", account: club.acct, data: { object: { id: "pi_r", amount: 30000, payment_method_types: ["card"], metadata: { piaffe_payment_id: payment_id } } } }, { connect: true });
    const m = await memberOf(club.clubId);
    expect((await call(`/api/pay/payments/${payment_id}/refund`, { method: "POST", token: m.token, json: {} })).status).toBe(403);
    expect((await call(`/api/pay/payments/${payment_id}/refund`, { method: "POST", token: club.token, json: { amount_cents: 40000 } })).status).toBe(400);
    const r = await call(`/api/pay/payments/${payment_id}/refund`, { method: "POST", token: club.token, json: { amount_cents: 10000 } });
    expect(r.status).toBe(200);
    const re = fake.find("POST", "/v1/refunds")[0];
    expect(re.headers["stripe-account"]).toBe(club.acct);
    expect(re.params).toMatchObject({ payment_intent: "pi_r", amount: "10000" });
    const ch = { id: evtId(), type: "charge.refunded", account: club.acct, data: { object: { id: "ch_r", payment_intent: "pi_r", amount_refunded: 10000 } } };
    await sendEvent(ch, { connect: true });
    await sendEvent({ ...ch, id: evtId() }, { connect: true });
    const ev = eventsOf("payment.refunded", club.clubId);
    expect(ev.length).toBe(1);
    expect(ev[0]).toMatchObject({ amount_cents: 10000, invoice_id: inv.id });
    const row = await env.DB.prepare("SELECT status, refunded_cents FROM online_payments WHERE id = ?").bind(payment_id).first<any>();
    expect(row).toEqual({ status: "partially_refunded", refunded_cents: 10000 });
  });
});

describe("billing · échéanciers, mandats et liens", () => {
  it("paiement en 3 fois : mandat via Checkout setup, puis le cron prélève la première échéance hors session", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", email: "lea.ech@exemple.fr" });
    const m = await memberOf(club.clubId);
    const inv = addInvoice(club.clubId, "m001", 100000);
    expect((await call(`/api/pay/invoice/${inv.id}/installments`, { method: "POST", token: m.token, json: { count: 4 } })).status).toBe(400);
    const r = await j(await call(`/api/pay/invoice/${inv.id}/installments`, { method: "POST", token: m.token, json: { count: 3 } }));
    expect(r.installments).toEqual([33334, 33333, 33333]);
    const setup = fake.find("POST", "/v1/checkout/sessions")[0].params;
    expect(setup.mode).toBe("setup");
    expect(setup["setup_intent_data[metadata][piaffe_mandate_id]"]).toBe(r.mandate_id);
    // Paiement direct bloqué tant que l'échéancier existe.
    expect((await j(await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: m.token }))).error.code).toBe("schedule_active");
    await sendEvent({ id: evtId(), type: "setup_intent.succeeded", account: club.acct, data: { object: { id: "seti_1", payment_method: "pm_1", mandate: "mandate_1", metadata: { piaffe_mandate_id: r.mandate_id, piaffe_club_id: club.clubId } } } }, { connect: true });
    const sch = await j(await call(`/api/pay/schedules?invoice_id=${inv.id}`, { token: m.token }));
    expect(sch.schedules[0].status).toBe("active");
    expect(sch.schedules[0].installments.length).toBe(3);
    await cron(env, "*/10 * * * *");
    const pis = fake.find("POST", "/v1/payment_intents");
    expect(pis.length).toBe(1);
    expect(pis[0].headers["stripe-account"]).toBe(club.acct);
    expect(pis[0].params).toMatchObject({ amount: "33334", off_session: "true", confirm: "true", payment_method: "pm_1", "payment_method_types[0]": "sepa_debit" });
    await cron(env, "*/10 * * * *");
    expect(fake.find("POST", "/v1/payment_intents").length).toBe(1); // pas de double prélèvement
    const pay = await env.DB.prepare("SELECT id FROM online_payments WHERE invoice_id = ? AND kind = 'installment'").bind(inv.id).first<any>();
    await sendEvent({ id: evtId(), type: "payment_intent.succeeded", account: club.acct, data: { object: { id: "pi_i1", amount: 33334, payment_method_types: ["sepa_debit"], metadata: { piaffe_payment_id: pay.id } } } }, { connect: true });
    const after = await j(await call(`/api/pay/schedules?invoice_id=${inv.id}`, { token: m.token }));
    expect(after.schedules[0].installments.map((i: any) => i.status)).toEqual(["paid", "scheduled", "scheduled"]);
    expect(eventsOf("invoice.paid", club.clubId).at(-1)).toMatchObject({ amount_cents: 33334, method: "sepa_debit" });
  });

  it("un prélèvement refusé est retenté, puis l'échéancier échoue après 3 tentatives", async () => {
    fake = fakeStripe({ "POST /v1/payment_intents": () => { throw Object.assign(new Error("declined"), { status: 402, type: "card_error", code: "card_declined", decline: "insufficient_funds" }); } });
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", email: "lea.refus@exemple.fr" });
    const inv = addInvoice(club.clubId, "m001", 30000);
    const r = await j(await call(`/api/pay/invoice/${inv.id}/installments`, { method: "POST", token: club.token, json: { count: 3 } }));
    await sendEvent({ id: evtId(), type: "setup_intent.succeeded", account: club.acct, data: { object: { id: "seti_2", payment_method: "pm_2", metadata: { piaffe_mandate_id: r.mandate_id } } } }, { connect: true });
    for (let i = 0; i < 3; i++) {
      await env.DB.prepare("UPDATE payment_installments SET next_attempt_at = NULL WHERE club_id = ?").bind(club.clubId).run();
      await cron(env, "*/10 * * * *");
    }
    const s = await env.DB.prepare("SELECT status FROM payment_schedules WHERE invoice_id = ?").bind(inv.id).first<any>();
    expect(s.status).toBe("failed");
    const fails = eventsOf("payment.failed", club.clubId);
    expect(fails.length).toBe(3);
    expect(fails.at(-1)).toMatchObject({ final: true, reason: "insufficient_funds" });
    expect((await mails("lea.refus@exemple.fr", "payment_failed")).length).toBe(3);
  });

  it("mandat SEPA : l'adhérent l'enregistre, chaque facture émise est prélevée automatiquement, la révocation annule", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa" });
    const m = await memberOf(club.clubId);
    const r = await j(await call("/api/pay/mandate", { method: "POST", token: m.token, json: {} }));
    expect(fake.find("POST", "/v1/checkout/sessions")[0].params["payment_method_types[0]"]).toBe("sepa_debit");
    // Un adhérent ne crée pas de mandat pour une autre fiche.
    expect((await call("/api/pay/mandate", { method: "POST", token: m.token, json: { person_ref: "m099" } })).status).toBe(403);
    await sendEvent({ id: evtId(), type: "checkout.session.completed", account: club.acct, data: { object: { mode: "setup", setup_intent: { id: "seti_3", payment_method: { id: "pm_3", type: "sepa_debit", sepa_debit: { last4: "4321" } }, mandate: "mandate_3", metadata: { piaffe_mandate_id: r.mandate_id } } } } }, { connect: true });
    const list = await j(await call("/api/pay/mandates", { token: m.token }));
    expect(list.mandates[0]).toMatchObject({ status: "active", label: "IBAN se terminant par 4321", autopay: true });
    const inv = addInvoice(club.clubId, "m001", 52000, { due_date: new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10) });
    await emit(env, null, { type: "invoice.issued", club_id: club.clubId, invoice_id: inv.id });
    const sch = await j(await call(`/api/pay/schedules?invoice_id=${inv.id}`, { token: club.token }));
    expect(sch.schedules[0]).toMatchObject({ kind: "autopay", status: "active", total_cents: 52000 });
    expect(sch.schedules[0].installments[0].due_date).toBe(inv.due_date);
    await sendEvent({ id: evtId(), type: "mandate.updated", account: club.acct, data: { object: { id: "mandate_3", status: "inactive" } } }, { connect: true });
    const after = await j(await call(`/api/pay/schedules?invoice_id=${inv.id}`, { token: club.token }));
    expect(after.schedules[0].status).toBe("canceled");
    expect(eventsOf("mandate.revoked", club.clubId).length).toBe(1);
  });

  it("un adhérent ne voit que ses paiements et mandats", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { fam: "F1" });
    await addMember(club.clubId, "m005", { fam: "F5" });
    const inv5 = addInvoice(club.clubId, "m005", 10000);
    await call(`/api/pay/invoice/${inv5.id}`, { method: "POST", token: club.token });
    const m = await memberOf(club.clubId);
    expect((await j(await call("/api/pay/payments", { token: m.token }))).payments.length).toBe(0);
    expect((await j(await call("/api/pay/payments", { token: club.token }))).payments.length).toBe(1);
  });

  it("lien de paiement : le gérant l'envoie, la page publique ouvre un Checkout frais ; un faux jeton est refusé", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub("manager");
    await addMember(club.clubId, "m001", { first: "Léa", email: "lea.lien@exemple.fr" });
    const inv = addInvoice(club.clubId, "m001", 18000);
    const m = await memberOf(club.clubId);
    expect((await call("/api/pay/link", { method: "POST", token: m.token, json: { invoice_id: inv.id } })).status).toBe(403);
    const r = await j(await call("/api/pay/link", { method: "POST", token: club.token, json: { invoice_id: inv.id } }));
    expect(r.sent).toBe(true);
    expect(r.url).toMatch(/\/api\/pay\/l\/pl_/);
    expect((await mails("lea.lien@exemple.fr", "payment_reminder")).length).toBe(1);
    const path = new URL(r.url).pathname;
    const open = await call(path, { redirect: "manual" });
    expect(open.status).toBe(303);
    expect(open.headers.get("location")).toMatch(/^https:\/\/checkout\.stripe\.test\//);
    expect(fake.find("POST", "/v1/checkout/sessions").at(-1)!.params["line_items[0][price_data][unit_amount]"]).toBe("18000");
    expect((await call("/api/pay/l/pl_" + "x".repeat(32))).status).toBe(404);
    // Facture réglée entre-temps : la page le dit, sans Checkout.
    fakeInvoices.get(inv.id)!.paid_cents = 18000;
    const done = await call(path, { redirect: "manual" });
    expect(done.status).toBe(409);
    expect(await done.text()).toContain("déjà réglée");
  });

  it("options de paiement visibles par l'adhérent", async () => {
    const club = await seedConnectedClub();
    const m = await memberOf(club.clubId);
    expect(await j(await call("/api/pay/options", { token: m.token }))).toMatchObject({ enabled: true, sepa: true, installments: [3, 10] });
  });
});

describe("billing · paiement en 3 fois avec Klarna", () => {
  it("non activé : refus clair ; activé : Checkout Klarna seul, le club reçoit le total", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await addMember(club.clubId, "m001", { first: "Léa", last: "Martin", email: "lea.martin@exemple.fr", fam: "F1" });
    const m = await memberOf(club.clubId);
    const inv = addInvoice(club.clubId, "m001", 62000);
    let opts = await j(await call("/api/pay/options", { token: m.token }));
    expect(opts.klarna).toBe(false);
    let r = await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: m.token, json: { method: "klarna" } });
    expect(r.status).toBe(409);
    expect((await j(r)).error.code).toBe("klarna_not_ready");
    // le club active Klarna dans son tableau de bord Stripe : account.updated le signale
    await sendEvent({ id: evtId(), type: "account.updated", account: club.acct, data: { object: { id: club.acct, charges_enabled: true, payouts_enabled: true, details_submitted: true, capabilities: { card_payments: "active", sepa_debit_payments: "active", klarna_payments: "active" }, requirements: { currently_due: [] } } } }, { connect: true });
    opts = await j(await call("/api/pay/options", { token: m.token }));
    expect(opts).toMatchObject({ klarna: true, klarna_min_cents: 100, klarna_max_cents: 450000 });
    r = await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: m.token, json: { method: "klarna" } });
    expect(r.status).toBe(200);
    const cs = fake.find("POST", "/v1/checkout/sessions")[0];
    expect(cs.params["payment_method_types[0]"]).toBe("klarna");
    expect(cs.params["payment_method_types[1]"]).toBeUndefined();
    expect(cs.params["line_items[0][price_data][unit_amount]"]).toBe("62000");
    expect(cs.headers["stripe-account"]).toBe(club.acct);
  });

  it("au-delà de 4 500 € : Klarna refusé", async () => {
    fake = fakeStripe();
    const club = await seedConnectedClub();
    await env.DB.prepare("UPDATE connect_accounts SET klarna_enabled = 1 WHERE club_id = ?").bind(club.clubId).run();
    await addMember(club.clubId, "m001", { first: "Léa", fam: "F1" });
    const m = await memberOf(club.clubId);
    const inv = addInvoice(club.clubId, "m001", 480000);
    const r = await call(`/api/pay/invoice/${inv.id}`, { method: "POST", token: m.token, json: { method: "klarna" } });
    expect(r.status).toBe(400);
    expect((await j(r)).error.code).toBe("klarna_amount");
  });
});
