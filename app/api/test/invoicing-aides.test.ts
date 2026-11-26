import { describe, expect, it } from "vitest";
import { env, call, setupClub, issued } from "./invoicing.helpers";

/* Aides de l'adhérent (module Croissance) déduites de sa facture : règlement par un tiers, mention claire, une seule fois. */
const batch = (token: string, ops: unknown[]) => call("/api/records/batch", { method: "POST", token, json: { ops } });
const aid = (id: string, data: Record<string, unknown>) => ({ op: "upsert", coll: "aids", id, data: { status: "deduit", ...data } });
const lines = [{ label: "Forfait annuel 1 h par semaine", category: "lesson", quantity: 1, unit_price: 29000 }];

describe("factures · aides déduites", () => {
  it("Pass'Sport et CAF réglés par des tiers : TVA inchangée, mention, reste à payer, aides reliées à la facture", async () => {
    const o = await setupClub();
    await batch(o.token, [aid("ai1", { kind: "passsport", member: "m001", amount: 50, code: "PS26-ABCD-EFGH" }), aid("ai2", { kind: "caf", member: "m001", amount: 60, ref: "CAF des Yvelines" }),
      aid("ai3", { kind: "ancv", member: "m001", amount: 40, status: "declare" }), aid("ai4", { kind: "cse", member: "m003", amount: 80 })]);
    const inv = await issued(o.token, { customer_ref: "m001", lines });
    expect(inv.total_ttc).toBe(29000);
    expect(inv.paid_amount).toBe(11000);
    const snap = JSON.parse((await env.DB.prepare("SELECT snapshot FROM invoices WHERE id = ?").bind(inv.id).first<any>()).snapshot);
    expect(snap.totals.ttc).toBe(29000);
    expect(snap.mentions.join(" ").replace(/[\u00a0\u202f]/g, " ")).toContain("Déjà réglé par des aides : Pass'Sport 50,00 € (payé par l'État, code PS26-ABCD-EFGH), Aide CAF aux loisirs 60,00 € (payée par la CAF). Reste à payer : 180,00 €.");
    const pays = await env.DB.prepare("SELECT method, amount FROM invoice_payments WHERE invoice_id = ? ORDER BY amount").bind(inv.id).all<any>();
    expect(pays.results).toEqual([{ method: "pass_sport", amount: 5000 }, { method: "other", amount: 6000 }]);
    const a1 = JSON.parse((await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = 'aids' AND id = 'ai1'").bind(o.clubId).first<any>()).data);
    expect(a1).toMatchObject({ invoice: inv.id, invoiceNumber: inv.number });
    // facture suivante : les aides déjà prises ne reviennent pas
    const inv2 = await issued(o.token, { customer_ref: "m001", lines });
    expect(inv2.paid_amount).toBe(0);
  });

  it("une aide plus grande que le reste à payer attend ; un type refusé dans les réglages n'est pas pris", async () => {
    const o = await setupClub();
    await batch(o.token, [{ op: "upsert", coll: "growthCfg", id: "aides", data: { accept: { cse: false } } }, aid("ai1", { kind: "passsport", member: "m001", amount: 50 }), aid("ai2", { kind: "cse", member: "m001", amount: 10 })]);
    const inv = await issued(o.token, { customer_ref: "m001", lines: [{ label: "Baptême poney", category: "lesson", quantity: 1, unit_price: 3000 }] });
    expect(inv.paid_amount).toBe(0);
    const inv2 = await issued(o.token, { customer_ref: "m001", lines });
    expect(inv2.paid_amount).toBe(5000);
  });
});
