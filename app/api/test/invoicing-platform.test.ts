import { describe, it, expect } from "vitest";
import { env, call, setupClub, addUser } from "./invoicing.helpers";
import { emit } from "../src/lib/events";
import { createPlatformInvoice } from "../src/invoicing/platform";
import { extractFacturX } from "../src/invoicing/pdf";
import { parisToday } from "../src/invoicing/invoices";

describe("factures de Piaffe aux clubs", () => {
  it("subscription.paid produit une facture Factur-X de Marceau Ruis EI, réglée, idempotente, rangée dans les achats du club", async () => {
    const o = await setupClub();
    const ev = { type: "subscription.paid", club_id: o.clubId, stripe_invoice_id: "in_" + o.clubId, number: "ABC-0001", amount_cents: 5900, tax_cents: 0,
      period_start: "2026-11-24T00:00:00Z", period_end: "2026-12-23T23:59:59Z", plan: "club" };
    await emit(env, null, ev); await emit(env, null, ev);
    const list = await (await call("/api/invoicing/piaffe-invoices", { token: o.token })).json() as any;
    expect(list.invoices.length).toBe(1);
    const inv = list.invoices[0];
    expect(inv.number).toMatch(new RegExp(`^PIA-${parisToday().slice(0, 4)}-\\d{5}$`));
    expect(inv).toMatchObject({ total_ttc: 5900, total_vat: 0, status: "paid", period_start: "2026-11-24", period_end: "2026-12-23" });
    const r = await call(`/api/invoicing/piaffe-invoices/${inv.id}/pdf`, { token: o.token });
    expect(r.status).toBe(200);
    const x = await extractFacturX(new Uint8Array(await r.arrayBuffer()));
    expect(x.xml).toContain("<ram:Name>Marceau Ruis EI</ram:Name>");
    expect(x.xml).toContain('schemeID="0002">934733122<');
    expect(x.xml).toContain("TVA non applicable, art. 293 B du CGI");
    expect(x.xml).toContain("<ram:Name>Écurie des Tilleuls</ram:Name>");
    const purchases = await (await call(`/api/accounting/purchases?year=${parisToday().slice(0, 4)}`, { token: o.token })).json() as any;
    expect(purchases.purchases).toHaveLength(1);
    expect(purchases.purchases[0]).toMatchObject({ source: "piaffe", total_ttc: 5900, account: "651000", has_pdf: true });
    // La facture Piaffe n'apparaît pas dans les ventes du club et n'est pas payable par le lot Stripe.
    const sales = await (await call("/api/invoices", { token: o.token })).json() as any;
    expect(sales.invoices).toHaveLength(0);
  });

  it("en régime normal, la TVA à 20 % est extraite du montant payé", async () => {
    const o = await setupClub();
    const inv = await createPlatformInvoice({ ...env, PLATFORM_VAT_REGIME: "normal" } as any, { club_id: o.clubId, amount_cents: 7080, period_start: null, period_end: null, stripe_invoice_id: "in_n_" + o.clubId, plan: "domaine" });
    expect(inv).toMatchObject({ total_ttc: 7080, total_ht: 5900, total_vat: 1180, status: "paid" });
  });

  it("seuls les gérants et le comptable du club acheteur voient ses factures Piaffe", async () => {
    const a = await setupClub(); const b = await setupClub();
    await createPlatformInvoice(env, { club_id: a.clubId, amount_cents: 2900, period_start: null, period_end: null, stripe_invoice_id: "in_x_" + a.clubId, plan: "essentiel" });
    const lb = await (await call("/api/invoicing/piaffe-invoices", { token: b.token })).json() as any;
    expect(lb.invoices).toHaveLength(0);
    const acc = await addUser(a.clubId, "accountant");
    const la = await (await call("/api/invoicing/piaffe-invoices", { token: acc.token })).json() as any;
    expect(la.invoices).toHaveLength(1);
    expect((await call(`/api/invoicing/piaffe-invoices/${la.invoices[0].id}/pdf`, { token: b.token })).status).toBe(404);
    const m = await addUser(a.clubId, "member", "m001");
    expect((await call("/api/invoicing/piaffe-invoices", { token: m.token })).status).toBe(403);
  });
});
