import { describe, it, expect } from "vitest";
import { call, setupClub, issued, lessonLines, SIREN_CLUB, SIREN_PRO } from "./invoicing.helpers";
import { parisToday } from "../src/invoicing/invoices";
import { unzipStored, crc32 } from "../src/invoicing/zip";
import { FEC_HEADER } from "../src/invoicing/exports";
import { sandbox } from "../src/invoicing/pa";
import { connectClub, pullIncoming } from "../src/invoicing/einvoice";
import { env } from "./invoicing.helpers";

const year = parisToday().slice(0, 4);
const month = parisToday().slice(0, 7);

async function activity(token: string) {
  const a = await issued(token, { customer_ref: "m001", lines: lessonLines });
  await call(`/api/invoices/${a.id}/payments`, { method: "POST", token, json: { amount: 5000, method: "check", reference: "123" } });
  await call(`/api/invoices/${a.id}/payments`, { method: "POST", token, json: { amount: a.total_ttc - 5000, method: "cash" } });
  const b = await issued(token, { customer_type: "business", customer_name: "SARL Haras", customer_siren: SIREN_PRO, customer_address: { line1: "1 route", zip: "61000", city: "Alençon" }, price_mode: "ht", lines: [{ label: "Pension", category: "boarding", unit_price: 41667 }, { label: "Foin", category: "goods", quantity: 3, unit_price: 1234 }] });
  await call(`/api/invoices/${b.id}/credit-note`, { method: "POST", token, json: { reason: "Remise commerciale", amount: 2000 } });
  const dep = await issued(token, { kind: "deposit", customer_ref: "m003", lines: [{ label: "Acompte stage", category: "course", unit_price: 10000 }] });
  const fin = await issued(token, { customer_ref: "m003", deposit_ids: [dep.id], lines: [{ label: "Stage", category: "course", unit_price: 30000 }] });
  return { a, b, dep, fin };
}

function parseFec(txt: string, sep = "\t") {
  const lines = txt.replace(/\r\n$/, "").split("\r\n").map((l) => l.split(sep));
  return { header: lines[0], rows: lines.slice(1) };
}
const num = (s: string) => Math.round(Number(s.replace(",", ".")) * 100);

describe("exports comptables", () => {
  it("FEC : 18 colonnes, nom réglementaire, chaque écriture équilibrée, débit = crédit", async () => {
    const o = await setupClub();
    await activity(o.token);
    const r = await call(`/api/accounting/exports/fec?year=${year}&encoding=utf8`, { token: o.token });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-disposition")).toContain(`${SIREN_CLUB}FEC${year}1231.txt`);
    const { header, rows } = parseFec(await r.text());
    expect(header).toEqual(FEC_HEADER);
    expect(rows.every((l) => l.length === 18)).toBe(true);
    const byEntry = new Map<string, number>();
    let d = 0, c = 0;
    for (const l of rows) {
      expect(l[3]).toMatch(/^\d{8}$/);
      expect(l[11]).toMatch(/^\d+,\d{2}$/);
      d += num(l[11]); c += num(l[12]);
      byEntry.set(l[2], (byEntry.get(l[2]) || 0) + num(l[11]) - num(l[12]));
    }
    expect(d).toBe(c);
    for (const [k, v] of byEntry) expect(v, k).toBe(0);
    const journals = new Set(rows.map((l) => l[0]));
    expect([...journals].sort()).toEqual(["BQ", "CA", "VE"]);
    const accounts = new Set(rows.map((l) => l[4]));
    for (const a of ["411000", "706100", "706200", "707000", "445711", "445713", "467100", "419100", "511200", "530000"]) expect(accounts, a).toContain(a);
    // Lettrage du client sur la facture soldée
    expect(rows.some((l) => l[4] === "411000" && l[13] === "A")).toBe(true);
  });

  it("FEC : séparateur barre verticale et encodage ISO 8859-15 par défaut", async () => {
    const o = await setupClub();
    await issued(o.token, { customer_ref: "m001", customer_name: "Œdipe Martin", label: "Facture à 20 €", lines: [{ label: "Œuvre équestre", category: "goods", unit_price: 1000 }] });
    const r = await call(`/api/accounting/exports/fec?year=${year}&sep=pipe`, { token: o.token });
    expect(r.headers.get("content-type")).toContain("iso-8859-15");
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect(bytes.includes(0xe9)).toBe(true); // é
    expect(bytes.includes(0xbc)).toBe(true); // Œ en Latin-9
    const txt = new TextDecoder("latin1").decode(bytes);
    expect(txt.split("\r\n")[0].split("|").length).toBe(18);
  });

  it("journal des ventes, encaissements et écritures CSV", async () => {
    const o = await setupClub();
    const { a, b } = await activity(o.token);
    const sb = new Uint8Array(await (await call(`/api/accounting/exports/sales.csv?month=${month}`, { token: o.token })).arrayBuffer());
    expect([...sb.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8 pour Excel
    const s = new TextDecoder().decode(sb);
    const rows = s.trim().split("\r\n");
    expect(rows[0]).toContain("Base HT 5,5 %");
    expect(rows.find((r) => r.includes(a.number))).toContain("payée");
    expect(rows.some((r) => r.includes(";Avoir;"))).toBe(true);
    expect(rows.find((r) => r.includes(b.number) && r.includes(";Facture;"))).toContain(SIREN_PRO);
    const p = await (await call(`/api/accounting/exports/payments.csv?month=${month}`, { token: o.token })).text();
    expect(p).toContain("Chèque");
    expect(p).toContain("Espèces");
    const e: string = await (await call(`/api/accounting/exports/entries.csv?month=${month}`, { token: o.token })).text();
    const lines = e.trim().split("\r\n").slice(1).map((l) => l.split(";"));
    const deb = lines.reduce((x, l) => x + num(l[7]), 0), cre = lines.reduce((x, l) => x + num(l[8]), 0);
    expect(deb).toBe(cre);
    const vat = await (await call(`/api/accounting/vat?month=${month}`, { token: o.token })).json() as any;
    expect(vat.accounts.map((x: any) => x.account)).toContain("445711");
  });

  it("archive ZIP des PDF du mois, avec les factures fournisseurs", async () => {
    const o = await setupClub();
    const { a } = await activity(o.token);
    await connectClub(env, o.clubId, "http://x");
    await sandbox.inject(env, o.clubId, await (await call(`/api/invoices/${a.id}/facturx.xml`, { token: o.token })).text());
    await pullIncoming(env);
    const r = await call(`/api/accounting/exports/pdfs.zip?month=${month}`, { token: o.token });
    expect(r.status).toBe(200);
    const files = unzipStored(new Uint8Array(await r.arrayBuffer()));
    expect(files.length).toBe(6); // 5 factures et avoirs + 1 facture fournisseur
    expect(files.filter((f) => f.name.endsWith(".pdf")).every((f) => new TextDecoder().decode(f.data.slice(0, 5)) === "%PDF-")).toBe(true);
    expect(files.some((f) => f.name.startsWith("achats/"))).toBe(true);
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});
