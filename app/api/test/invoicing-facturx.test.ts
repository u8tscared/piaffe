import { describe, it, expect } from "vitest";
import { PDFDocument, PDFName, PDFDict, PDFArray } from "pdf-lib";
import { env, call, setupClub, issued, lessonLines, SIREN_CLUB, SIREN_PRO } from "./invoicing.helpers";
import { extractFacturX } from "../src/invoicing/pdf";
import { parseIncomingXml, esc } from "../src/invoicing/cii";
import { srgbIcc } from "../src/invoicing/icc";

const tag = (xml: string, t: string) => [...xml.matchAll(new RegExp(`<ram:${t}(?: [^>]*)?>([^<]*)</ram:${t}>`, "g"))].map((m) => m[1]);
const cents = (s: string) => Math.round(Number(s) * 100);

async function proInvoice(token: string, extra: Record<string, unknown> = {}) {
  return issued(token, {
    customer_type: "business", customer_name: "SARL Haras du Bocage & Fils", customer_siren: SIREN_PRO,
    customer_address: { line1: "1 route du Haras", zip: "61000", city: "Alençon" }, price_mode: "ht",
    lines: [...lessonLines, { label: "Pension <box 4>", category: "boarding", quantity: 1, unit_price: 52000 }, { label: "Transport", category: "transport", quantity: 3, unit_price: 3333 }],
    ...extra,
  });
}

describe("XML Factur-X (CII, EN 16931)", () => {
  it("contient les champs obligatoires et des totaux cohérents au centime", async () => {
    const o = await setupClub();
    const inv = await proInvoice(o.token);
    const xml = await (await call(`/api/invoices/${inv.id}/facturx.xml`, { token: o.token })).text();
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain("<ram:ID>urn:cen.eu:en16931:2017</ram:ID>");
    expect(tag(xml, "TypeCode")[0]).toBe("380");
    expect(xml).toContain(`<ram:ID>${inv.number}</ram:ID>`);
    expect(xml).toContain(`schemeID="0002">${SIREN_CLUB}<`);
    expect(xml).toContain(`schemeID="0225">${SIREN_CLUB}<`);
    expect(xml).toMatch(/schemeID="VA">FR\d{2}552100554</);
    expect(xml).toContain("<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>");
    expect(xml).toContain("<ram:ID>M1</ram:ID>"); // biens et services : opération mixte
    const lineTotals = tag(xml, "LineTotalAmount").map(cents);
    const headerLineTotal = lineTotals.pop()!;
    expect(lineTotals.reduce((a, b) => a + b, 0)).toBe(headerLineTotal);
    const basis = cents(tag(xml, "TaxBasisTotalAmount")[0]);
    const tax = cents(tag(xml, "TaxTotalAmount")[0]);
    const grand = cents(tag(xml, "GrandTotalAmount")[0]);
    expect(basis).toBe(headerLineTotal);
    expect(grand).toBe(basis + tax);
    expect(cents(tag(xml, "DuePayableAmount")[0])).toBe(grand);
    expect(grand).toBe(inv.total_ttc);
    // Ventilation par taux : base × taux arrondi, somme des TVA = total TVA
    const settle = xml.slice(xml.indexOf("<ram:ApplicableHeaderTradeSettlement>"));
    const groups = [...settle.matchAll(/<ram:ApplicableTradeTax>([\s\S]*?)<\/ram:ApplicableTradeTax>/g)].map((m) => ({
      vat: cents(tag(m[1], "CalculatedAmount")[0]), base: cents(tag(m[1], "BasisAmount")[0]), rate: Number(tag(m[1], "RateApplicablePercent")[0]), cat: tag(m[1], "CategoryCode")[0],
    }));
    expect(groups.map((g) => g.rate).sort()).toEqual([0, 20, 5.5]);
    for (const g of groups) expect(g.vat).toBe(Math.round((g.base * g.rate) / 100));
    expect(groups.reduce((a, g) => a + g.vat, 0)).toBe(tax);
    expect(groups.reduce((a, g) => a + g.base, 0)).toBe(basis);
    expect(settle).toContain("<ram:ExemptionReason>");
    // Caractères spéciaux échappés
    expect(xml).toContain("Pension &lt;box 4&gt;");
    expect(xml).toContain("SARL Haras du Bocage &amp; Fils");
  });

  it("TVA exigible à l'encaissement pour les services (code 72), sur les débits si l'option est prise (code 5)", async () => {
    const o = await setupClub();
    const a = await issued(o.token, { customer_ref: "m001", lines: [lessonLines[0]] });
    const xa = await (await call(`/api/invoices/${a.id}/facturx.xml`, { token: o.token })).text();
    expect(xa).toContain("<ram:DueDateTypeCode>72</ram:DueDateTypeCode>");
    await call("/api/invoicing/settings", { method: "PUT", token: o.token, json: { vat_on_debits: true } });
    const b = await issued(o.token, { customer_ref: "m001", lines: [lessonLines[0]] });
    const xb = await (await call(`/api/invoices/${b.id}/facturx.xml`, { token: o.token })).text();
    expect(xb).toContain("<ram:DueDateTypeCode>5</ram:DueDateTypeCode>");
    expect(xb).toContain("<ram:SubjectCode>TXD</ram:SubjectCode>");
  });

  it("franchise : catégorie E, motif VATEX-FR-FRANCHISE, identifiant fiscal du vendeur", async () => {
    const o = await setupClub({ regime: "franchise" });
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    expect(inv.total_vat).toBe(0);
    const xml = await (await call(`/api/invoices/${inv.id}/facturx.xml`, { token: o.token })).text();
    expect(xml).toContain("VATEX-FR-FRANCHISE");
    expect(xml).toContain("TVA non applicable, art. 293 B du CGI");
    expect(xml).toContain(`schemeID="FC">${SIREN_CLUB}<`);
    expect(xml).not.toContain('schemeID="VA"');
  });

  it("relit une facture CII (réception) : fournisseur, totaux, TVA", async () => {
    const o = await setupClub();
    const inv = await proInvoice(o.token);
    const xml = await (await call(`/api/invoices/${inv.id}/facturx.xml`, { token: o.token })).text();
    const p = parseIncomingXml(xml);
    expect(p).toMatchObject({ number: inv.number, type_code: "380", supplier_siren: SIREN_CLUB, total_ttc: inv.total_ttc, total_ht: inv.total_ht, total_vat: inv.total_vat, supplier_name: "Écurie des Tilleuls" });
    expect(p.vat_breakdown.length).toBe(3);
    expect(esc("a<b&\u0001")).toBe("a&lt;b&amp;");
  });
});

describe("PDF Factur-X (PDF/A-3b)", () => {
  it("est un PDF lisible avec la pièce jointe factur-x.xml identique au XML, métadonnées et profil de couleur", async () => {
    const o = await setupClub();
    const inv = await proInvoice(o.token);
    const r = await call(`/api/invoices/${inv.id}/pdf`, { token: o.token });
    expect(r.status).toBe(200);
    const pdf = new Uint8Array(await r.arrayBuffer());
    expect(new TextDecoder().decode(pdf.slice(0, 8))).toBe("%PDF-1.7");
    const x = await extractFacturX(pdf);
    const xml = await (await call(`/api/invoices/${inv.id}/facturx.xml`, { token: o.token })).text();
    expect(x.xml).toBe(xml);
    expect(x.relationship).toBe("Alternative");
    expect(x.pdfa).toBe(true);
    const doc = await PDFDocument.load(pdf, { updateMetadata: false });
    expect(doc.getTitle()).toBe(`Facture ${inv.number}`);
    const oi = doc.catalog.lookup(PDFName.of("OutputIntents")) as PDFArray;
    const intent = oi.lookup(0) as PDFDict;
    expect(String(intent.get(PDFName.of("S")))).toBe("/GTS_PDFA1");
    expect(intent.get(PDFName.of("DestOutputProfile"))).toBeTruthy();
    expect(doc.context.trailerInfo.ID).toBeTruthy();
    const raw = new TextDecoder("latin1").decode(pdf);
    expect(raw).toContain("/FontFile2");
    expect(raw).not.toMatch(/\/BaseFont \/Helvetica/);
    expect(raw).toContain("/AFRelationship /Alternative");
    expect(raw).toContain("/Subtype /text#2Fxml");
  });

  it("régénère un PDF identique au premier (contenu figé)", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const a = new Uint8Array(await (await call(`/api/invoices/${inv.id}/pdf`, { token: o.token })).arrayBuffer());
    const row = await env.DB.prepare("SELECT pdf_key, pdf_sha256 FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    await env.FILES.delete(row.pdf_key);
    const b = new Uint8Array(await (await call(`/api/invoices/${inv.id}/pdf`, { token: o.token })).arrayBuffer());
    const h = async (u: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", u))].map((x) => x.toString(16).padStart(2, "0")).join("");
    expect(await h(a)).toBe(row.pdf_sha256);
    expect(await h(b)).toBe(await h(a));
  });

  it("pagine une longue facture", async () => {
    const o = await setupClub();
    const lines = Array.from({ length: 60 }, (_, k) => ({ label: `Séance particulière n° ${k + 1} avec un libellé assez long pour passer à la ligne dans le tableau`, category: "lesson", unit_price: 4500 }));
    const inv = await issued(o.token, { customer_ref: "m001", lines });
    const pdf = new Uint8Array(await (await call(`/api/invoices/${inv.id}/pdf`, { token: o.token })).arrayBuffer());
    expect((await extractFacturX(pdf)).pages).toBeGreaterThan(2);
  });

  it("profil ICC sRGB valide (en-tête acsp, taille déclarée exacte)", () => {
    const icc = srgbIcc();
    const dv = new DataView(icc.buffer, icc.byteOffset, icc.byteLength);
    expect(dv.getUint32(0)).toBe(icc.length);
    expect(new TextDecoder().decode(icc.slice(36, 40))).toBe("acsp");
    expect(new TextDecoder().decode(icc.slice(12, 20))).toBe("mntrRGB ");
    expect(dv.getUint32(128)).toBe(9);
  });
});
