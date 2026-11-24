import { describe, it, expect } from "vitest";
import { call, setupClub, addUser, draft, issued, lessonLines } from "./invoicing.helpers";

describe("droits d'accès aux factures", () => {
  it("un adhérent ne voit que ses factures et celles de sa famille, jamais les brouillons", async () => {
    const o = await setupClub();
    const mine = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const family = await issued(o.token, { customer_ref: "m002", lines: lessonLines });
    const other = await issued(o.token, { customer_ref: "m003", lines: lessonLines });
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const lea = await addUser(o.clubId, "member", "m001");
    const r = await call("/api/invoices", { token: lea.token });
    expect(r.status).toBe(200);
    const ids = ((await r.json()) as any).invoices.map((i: any) => i.id).sort();
    expect(ids).toEqual([mine.id, family.id].sort());
    expect((await call(`/api/invoices/${other.id}`, { token: lea.token })).status).toBe(404);
    expect((await call(`/api/invoices/${other.id}/pdf`, { token: lea.token })).status).toBe(404);
    expect((await call(`/api/invoices/${d.id}`, { token: lea.token })).status).toBe(404);
    const pdf = await call(`/api/invoices/${mine.id}/pdf`, { token: lea.token });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
  });

  it("un adhérent sans fiche ne voit rien et ne peut ni créer ni payer à la main", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const m = await addUser(o.clubId, "member");
    expect(((await (await call("/api/invoices", { token: m.token })).json()) as any).invoices).toEqual([]);
    expect((await call("/api/invoices", { method: "POST", token: m.token, json: { customer_ref: "m001", lines: lessonLines } })).status).toBe(403);
    expect((await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: m.token, json: { amount: 100, method: "cash" } })).status).toBe(403);
  });

  it("le comptable lit et exporte, mais ne modifie rien", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const d = await draft(o.token, { customer_ref: "m001", lines: lessonLines });
    const acc = await addUser(o.clubId, "accountant");
    const list = ((await (await call("/api/invoices", { token: acc.token })).json()) as any).invoices.map((i: any) => i.id);
    expect(list).toContain(inv.id);
    expect(list).not.toContain(d.id);
    expect((await call(`/api/invoices/${inv.id}/pdf`, { token: acc.token })).status).toBe(200);
    expect((await call("/api/accounting/exports/fec?year=" + new Date().getFullYear(), { token: acc.token })).status).toBe(200);
    expect((await call("/api/invoices/summary", { token: acc.token })).status).toBe(200);
    expect((await call("/api/invoicing/settings", { token: acc.token })).status).toBe(200);
    for (const [path, method] of [["/api/invoices", "POST"], [`/api/invoices/${d.id}`, "PATCH"], [`/api/invoices/${d.id}/issue`, "POST"], [`/api/invoices/${inv.id}/credit-note`, "POST"],
      [`/api/invoices/${inv.id}/payments`, "POST"], [`/api/invoices/${inv.id}/remind`, "POST"], ["/api/invoicing/settings", "PUT"], ["/api/einvoicing/connect", "POST"]] as const) {
      const r = await call(path, { method, token: acc.token, json: { reason: "x", amount: 100, method: "cash", lines: lessonLines } });
      expect(r.status, `${method} ${path}`).toBe(403);
    }
  });

  it("employé et coach n'ont pas accès aux factures", async () => {
    const o = await setupClub();
    for (const role of ["staff", "coach"] as const) {
      const u = await addUser(o.clubId, role);
      expect((await call("/api/invoices", { token: u.token })).status).toBe(403);
      expect((await call("/api/accounting/exports/sales.csv", { token: u.token })).status).toBe(403);
    }
    expect((await call("/api/invoices")).status).toBe(401);
  });

  it("isolation stricte entre clubs", async () => {
    const a = await setupClub(); const b = await setupClub();
    const inv = await issued(a.token, { customer_ref: "m001", lines: lessonLines });
    expect((await call(`/api/invoices/${inv.id}`, { token: b.token })).status).toBe(404);
    expect((await call(`/api/invoices/${inv.id}/pdf`, { token: b.token })).status).toBe(404);
    expect((await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: b.token, json: { amount: 100, method: "cash" } })).status).toBe(404);
    expect((await call(`/api/invoices/${inv.id}/credit-note`, { method: "POST", token: b.token, json: { reason: "x" } })).status).toBe(404);
    // En-tête X-Piaffe-Club vers un club dont on n'est pas membre : aucun accès.
    expect((await call("/api/invoices", { token: b.token, club: a.clubId })).status).toBe(403);
    const list = ((await (await call("/api/invoices", { token: b.token })).json()) as any).invoices;
    expect(list.find((i: any) => i.id === inv.id)).toBeUndefined();
  });

  it("réglages : validation et droits", async () => {
    const o = await setupClub();
    let r = await call("/api/invoicing/settings", { method: "PUT", token: o.token, json: { iban: "FR76 1234" } });
    expect(r.status).toBe(400);
    r = await call("/api/invoicing/settings", { method: "PUT", token: o.token, json: { iban: "FR76 3000 6000 0112 3456 7890 189", payment_terms_days: 30, reminders: { days: [7, 20] }, prefix_invoice: "FAC" } });
    expect(r.status).toBe(200);
    const s = ((await r.json()) as any).settings;
    expect(s).toMatchObject({ iban: "FR7630006000011234567890189", payment_terms_days: 30, prefix_invoice: "FAC", reminders: { enabled: true, days: [7, 20] } });
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    expect(inv.number.startsWith("FAC-")).toBe(true);
    r = await call("/api/invoicing/settings", { method: "PUT", token: o.token, json: { prefix_credit: "FAC" } });
    expect(r.status).toBe(400);
  });
});
