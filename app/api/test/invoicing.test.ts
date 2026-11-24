import { describe, it, expect } from "vitest";
import { env, call, setupClub, draft, issue, issued, lessonLines, SIREN_PRO } from "./invoicing.helpers";
import { computeTotals, vatOf } from "../src/invoicing/money";
import { emit } from "../src/lib/events";
import { invoices as billingInvoices } from "../src/billing/invoices";
import { dailyInvoices } from "../src/invoicing/routes-impl";
import { addDays, parisToday } from "../src/invoicing/invoices";

describe("calcul des montants", () => {
  it("prix HT : TVA calculée par taux sur la base cumulée, arrondi au centime", () => {
    const t = computeTotals([
      { label: "a", category: "lesson", quantity: 3, unit_price: 1333 },
      { label: "b", category: "lesson", quantity: 1, unit_price: 1 },
      { label: "c", category: "goods", quantity: 1.5, unit_price: 999 },
    ], "ht", "normal");
    const g55 = t.groups.find((g) => g.rate_bp === 550)!;
    expect(g55.base).toBe(4000);
    expect(g55.vat).toBe(220);
    const g20 = t.groups.find((g) => g.rate_bp === 2000)!;
    expect(g20.base).toBe(1499); // 1,5 × 9,99 = 14,985 → 14,99
    expect(g20.vat).toBe(300);   // 2,998 → 3,00
    expect(t.total_ttc).toBe(t.total_ht + t.total_vat);
    expect(t.operation_category).toBe("mixed");
  });

  it("prix TTC : le TTC saisi est conservé, la TVA reste à moins d'un centime de base × taux, les lignes somment la base", () => {
    for (const ttc of [14500, 2990, 1, 7, 52000, 99999, 33333, 12345]) {
      const t = computeTotals([{ label: "x", category: "goods", quantity: 1, unit_price: ttc }, { label: "y", category: "goods", quantity: 3, unit_price: 333 }], "ttc", "normal");
      expect(t.total_ttc).toBe(ttc + 999);
      for (const g of t.groups) {
        expect(Math.abs(g.vat - vatOf(g.base, g.rate_bp))).toBeLessThanOrEqual(1);
        expect(t.lines.filter((l) => l.vat_rate_bp === g.rate_bp).reduce((a, l) => a + l.line_ht, 0)).toBe(g.base);
      }
    }
  });

  it("franchise en base : toutes les lignes exonérées avec la mention de l'article 293 B", () => {
    const t = computeTotals(lessonLines, "ttc", "franchise");
    expect(t.total_vat).toBe(0);
    expect(t.groups.every((g) => g.category === "E")).toBe(true);
    expect(t.groups.some((g) => g.reason === "TVA non applicable, art. 293 B du CGI")).toBe(true);
  });

  it("débours et cotisations : exonérés même en régime normal", () => {
    const t = computeTotals([{ label: "Licence", category: "disbursement", unit_price: 3600 }, { label: "Adhésion", category: "membership", unit_price: 2000 }], "ttc", "normal");
    expect(t.total_vat).toBe(0);
    expect(t.groups.length).toBe(2);
  });
});

describe("brouillons et émission", () => {
  it("crée un brouillon, remplit le client depuis la fiche adhérent et calcule les totaux", async () => {
    const o = await setupClub();
    const inv = await draft(o.token, { customer_ref: "m001", label: "Novembre", lines: lessonLines });
    expect(inv.status).toBe("draft");
    expect(inv.number).toBeNull();
    expect(inv.customer.name).toBe("Léa Martin");
    expect(inv.customer.email).toBe("lea.martin@exemple.fr");
    expect(inv.customer.address.city).toBe("Rambouillet");
    expect(inv.total_ttc).toBe(14500 + 3600 + 5980);
    expect(inv.lines.length).toBe(3);
  });

  it("refuse une fiche client inconnue et des lignes invalides", async () => {
    const o = await setupClub();
    let r = await call("/api/invoices", { method: "POST", token: o.token, json: { customer_ref: "m999", lines: lessonLines } });
    expect(r.status).toBe(400);
    r = await call("/api/invoices", { method: "POST", token: o.token, json: { customer_ref: "m001", lines: [{ label: "x", unit_price: 12.5 }] } });
    expect(r.status).toBe(400);
    r = await call("/api/invoices", { method: "POST", token: o.token, json: { customer_ref: "m001", lines: [{ label: "x", unit_price: 100, vat_rate: 7 }] } });
    expect(r.status).toBe(400);
  });

  it("modifie un brouillon puis l'émet : numéro légal, PDF, copie dans records", async () => {
    const o = await setupClub();
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const p = await call(`/api/invoices/${d.id}`, { method: "PATCH", token: o.token, json: { label: "Pension et cours", lines: [lessonLines[0]] } });
    expect(p.status).toBe(200);
    expect(((await p.json()) as any).invoice.total_ttc).toBe(14500);
    const r = await issue(o.token, d.id);
    expect(r.status).toBe(200);
    const year = parisToday().slice(0, 4);
    expect(r.body.invoice.number).toBe(`F-${year}-00001`);
    expect(r.body.invoice.status).toBe("issued");
    expect(r.body.invoice.issue_date).toBe(parisToday());
    expect(r.body.invoice.due_date).toBe(addDays(parisToday(), 15));
    const rec = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'invoices' AND id = ?").bind(o.clubId, `F-${year}-00001`).first<{ data: string }>();
    const data = JSON.parse(rec!.data);
    expect(data).toMatchObject({ member: "m001", amount: 145, vat: 5.5, status: "émise", label: "Pension et cours", inv: d.id });
    const row = await env.DB.prepare("SELECT pdf_key, xml_key FROM invoices WHERE id = ?").bind(d.id).first<any>();
    expect(await env.FILES.head(row.pdf_key)).not.toBeNull();
    expect(await env.FILES.head(row.xml_key)).not.toBeNull();
  });

  it("gèle la facture émise : plus de modification ni de suppression, même directement en base", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    let r = await call(`/api/invoices/${inv.id}`, { method: "PATCH", token: o.token, json: { label: "Autre" } });
    expect(r.status).toBe(409);
    r = await call(`/api/invoices/${inv.id}`, { method: "DELETE", token: o.token });
    expect(r.status).toBe(409);
    r = await call(`/api/invoices/${inv.id}/issue`, { method: "POST", token: o.token, json: {} });
    expect(r.status).toBe(409);
    await expect(env.DB.prepare("UPDATE invoices SET total_ttc = 1 WHERE id = ?").bind(inv.id).run()).rejects.toThrow(/invoice_frozen/);
    await expect(env.DB.prepare("UPDATE invoice_lines SET unit_price = 1 WHERE invoice_id = ?").bind(inv.id).run()).rejects.toThrow(/invoice_frozen/);
    await expect(env.DB.prepare("DELETE FROM invoices WHERE id = ?").bind(inv.id).run()).rejects.toThrow(/invoice_frozen/);
  });

  it("supprime un brouillon", async () => {
    const o = await setupClub();
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const r = await call(`/api/invoices/${d.id}`, { method: "DELETE", token: o.token });
    expect(r.status).toBe(200);
    expect((await call(`/api/invoices/${d.id}`, { token: o.token })).status).toBe(404);
  });

  it("refuse l'émission sans SIREN du club", async () => {
    const o = await setupClub({ siren: null });
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const r = await issue(o.token, d.id);
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("missing_siren");
  });

  it("client professionnel : SIREN et adresse obligatoires, mentions de pénalités et indemnité de 40 €", async () => {
    const o = await setupClub();
    const base = { customer_type: "business", customer_name: "SARL Haras du Bocage", lines: lessonLines, price_mode: "ht" };
    const d1 = await draft(o.token, { ...base, customer_address: { line1: "1 route du Haras", zip: "61000", city: "Alençon" } });
    expect((await issue(o.token, d1.id)).status).toBe(400);
    const inv = await issued(o.token, { ...base, customer_siren: SIREN_PRO, customer_address: { line1: "1 route du Haras", zip: "61000", city: "Alençon" } });
    expect(inv.einvoice.channel).toBe("b2b");
    expect(inv.einvoice.status).toBe("pending");
    expect(inv.due_date).toBe(addDays(parisToday(), 30));
    const xml = await (await call(`/api/invoices/${inv.id}/facturx.xml`, { token: o.token })).text();
    expect(xml).toContain("<ram:SubjectCode>PMT</ram:SubjectCode>");
    expect(xml).toContain("<ram:SubjectCode>AAB</ram:SubjectCode>");
    expect(xml).toContain(`schemeID="0002">${SIREN_PRO}<`);
    const row = await env.DB.prepare("SELECT snapshot FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.snapshot).toContain("indemnité forfaitaire pour frais de recouvrement de 40");
  });
});

describe("numérotation continue", () => {
  it("numérote sans trou ni doublon en concurrence (20 émissions simultanées)", async () => {
    const o = await setupClub();
    const ids: string[] = [];
    for (let k = 0; k < 20; k++) ids.push((await draft(o.token, { customer_ref: "m003", lines: [lessonLines[0]] })).id);
    const res = await Promise.all(ids.map((id) => issue(o.token, id)));
    expect(res.every((r) => r.status === 200)).toBe(true);
    const nums = res.map((r) => Number(r.body.invoice.number.split("-")[2])).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("une même facture émise deux fois en même temps ne consomme qu'un numéro", async () => {
    const o = await setupClub();
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const [a, b] = await Promise.all([issue(o.token, d.id), issue(o.token, d.id)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const c = await env.DB.prepare("SELECT value FROM invoice_counters WHERE club_id = ?").bind(o.clubId).first<any>();
    expect(c.value).toBe(1);
    const d2 = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    expect(d2.number.endsWith("-00002")).toBe(true);
  });

  it("chaque club a sa propre série, les avoirs ont la leur", async () => {
    const a = await setupClub(); const b = await setupClub();
    const ia = await issued(a.token, { customer_ref: "m001", lines: lessonLines });
    const ib = await issued(b.token, { customer_ref: "m001", lines: lessonLines });
    expect(ia.number).toBe(ib.number);
    const r = await call(`/api/invoices/${ia.id}/credit-note`, { method: "POST", token: a.token, json: { reason: "Stage annulé" } });
    const j: any = await r.json();
    expect(j.credit_note.number).toBe(`AV-${parisToday().slice(0, 4)}-00001`);
  });
});

describe("avoirs, acomptes, paiements", () => {
  it("avoir total : la facture passe en annulée, l'avoir référence la facture d'origine", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const r = await call(`/api/invoices/${inv.id}/credit-note`, { method: "POST", token: o.token, json: { reason: "Erreur de facturation" } });
    expect(r.status).toBe(201);
    const j: any = await r.json();
    expect(j.credit_note.kind).toBe("credit_note");
    expect(j.credit_note.total_ttc).toBe(inv.total_ttc);
    expect(j.invoice.status).toBe("cancelled");
    const xml = await (await call(`/api/invoices/${j.credit_note.id}/facturx.xml`, { token: o.token })).text();
    expect(xml).toContain("<ram:TypeCode>381</ram:TypeCode>");
    expect(xml).toContain(`<ram:IssuerAssignedID>${inv.number}</ram:IssuerAssignedID>`);
    const rec = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'creditNotes' AND id = ?").bind(o.clubId, j.credit_note.number).first<any>();
    expect(JSON.parse(rec.data)).toMatchObject({ amount: -inv.total_ttc / 100, status: "avoir", ref: inv.number });
    const again = await call(`/api/invoices/${inv.id}/credit-note`, { method: "POST", token: o.token, json: { reason: "Encore" } });
    expect(again.status).toBe(409);
  });

  it("avoir partiel en montant : réparti par taux, le reste dû diminue, plafonné au restant", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const r = await call(`/api/invoices/${inv.id}/credit-note`, { method: "POST", token: o.token, json: { reason: "Deux séances reportées", amount: 5000 } });
    const j: any = await r.json();
    expect(r.status).toBe(201);
    expect(j.credit_note.total_ttc).toBe(5000);
    expect(j.invoice.amount_due).toBe(inv.total_ttc - 5000);
    expect(j.invoice.status).toBe("issued");
    const over = await call(`/api/invoices/${inv.id}/credit-note`, { method: "POST", token: o.token, json: { reason: "Trop", amount: inv.total_ttc } });
    expect(over.status).toBe(400);
  });

  it("paiements partiels et moyens multiples, refus du trop-perçu", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    let r = await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: o.token, json: { amount: 10000, method: "ancv", reference: "Remise 42" } });
    expect(r.status).toBe(201);
    expect(((await r.json()) as any).invoice.status).toBe("partially_paid");
    r = await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: o.token, json: { amount: 100000, method: "cash" } });
    expect(r.status).toBe(400);
    r = await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: o.token, json: { amount: inv.total_ttc - 10000, method: "check", reference: "Chèque 1234567" } });
    const j: any = await r.json();
    expect(j.invoice.status).toBe("paid");
    expect(j.invoice.amount_due).toBe(0);
    expect(j.invoice.payments.map((p: any) => p.method)).toEqual(["ancv", "check"]);
    r = await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: o.token, json: { amount: 100, method: "bitcoin" } });
    expect(r.status).toBe(400);
    const rec = await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'invoices' AND id = ?").bind(o.clubId, inv.number).first<any>();
    expect(JSON.parse(rec.data)).toMatchObject({ status: "payée", method: "Chèque" });
  });

  it("invoice.paid du lot Stripe : paiement enregistré une seule fois, puis remboursement", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const ev = { type: "invoice.paid", club_id: o.clubId, invoice_id: inv.id, amount_cents: inv.total_ttc, method: "card", stripe_ref: "pi_123", payment_id: "pay_1" };
    await emit(env, null, ev); await emit(env, null, ev);
    let row = await env.DB.prepare("SELECT status, paid_amount FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row).toEqual({ status: "paid", paid_amount: inv.total_ttc });
    await emit(env, null, { type: "payment.refunded", club_id: o.clubId, invoice_id: inv.id, amount_cents: 3000, stripe_ref: "ch_1", payment_id: "pay_1" });
    row = await env.DB.prepare("SELECT status, paid_amount FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.paid_amount).toBe(inv.total_ttc - 3000);
    expect(["partially_paid", "issued", "sent"]).toContain(row.status);
    const info = await billingInvoices().get(env.DB, o.clubId, inv.id);
    expect(info!.total_cents - info!.paid_cents).toBe(3000);
  });

  it("acompte puis facture finale : l'acompte est déduit du net à payer", async () => {
    const o = await setupClub();
    const dep = await issued(o.token, { kind: "deposit", customer_ref: "m001", label: "Acompte stage", lines: [{ label: "Acompte stage d'été", category: "course", unit_price: 10000 }] });
    expect(dep.number.startsWith("F-")).toBe(true);
    const fin = await issued(o.token, { customer_ref: "m001", label: "Stage d'été", deposit_ids: [dep.id], lines: [{ label: "Stage d'été, 5 jours", category: "course", unit_price: 35000 }] });
    expect(fin.total_ttc).toBe(35000);
    expect(fin.prepaid_amount).toBe(10000);
    expect(fin.amount_due).toBe(25000);
    const xml = await (await call(`/api/invoices/${fin.id}/facturx.xml`, { token: o.token })).text();
    expect(xml).toContain("<ram:TotalPrepaidAmount>100.00</ram:TotalPrepaidAmount>");
    expect(xml).toContain("<ram:DuePayableAmount>250.00</ram:DuePayableAmount>");
    expect(xml).toContain("<ram:ID>S4</ram:ID>");
    const depXml = await (await call(`/api/invoices/${dep.id}/facturx.xml`, { token: o.token })).text();
    expect(depXml).toContain("<ram:TypeCode>386</ram:TypeCode>");
    const twice = await call("/api/invoices", { method: "POST", token: o.token, json: { customer_ref: "m001", deposit_ids: [dep.id], lines: [lessonLines[0]] } });
    expect(twice.status).toBe(400);
  });

  it("retards et relances automatiques", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines, due_date: parisToday() });
    const later = addDays(parisToday(), 5);
    const r = await dailyInvoices(env, later);
    expect(r.overdue).toBeGreaterThanOrEqual(1);
    const row = await env.DB.prepare("SELECT status, reminders_count FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.status).toBe("overdue");
    expect(row.reminders_count).toBe(1);
    await dailyInvoices(env, later);
    expect((await env.DB.prepare("SELECT reminders_count FROM invoices WHERE id = ?").bind(inv.id).first<any>()).reminders_count).toBe(1);
    const m = await call(`/api/invoices/${inv.id}/remind`, { method: "POST", token: o.token });
    expect(m.status).toBe(200);
    expect(((await m.json()) as any).invoice.reminders_count).toBe(2);
  });
});
