import { describe, it, expect } from "vitest";
import { call, env, seed } from "./helpers";
import { apiKey, getRecord } from "./mail-kit";
import { decode, detectDelimiter, parseCsv, heuristicMapper } from "../src/import/csv";

/** Encode une chaîne en Windows-1252 (export Excel français typique). */
function cp1252(s: string): Uint8Array {
  const rev: Record<string, number> = { "€": 0x80, "’": 0x92, "œ": 0x9c };
  return Uint8Array.from([...s].map((ch) => rev[ch] ?? ch.charCodeAt(0)));
}
const CSV = [
  "Export Kavalog du 24/11/2026;;;;;;;;",
  "N° adhérent;Nom;Prénom;Date de naissance;N° licence;Galop;Téléphone;E-mail;Nom du cheval;SIRE;Puce;Race;Robe;Solde",
  "K-001;MARTIN;Léa;14/03/2012;1234567A;Galop 4;06 12 34 56 78;lea.martin@exemple.fr;Ulysse de la Roche;15012345K;250259600418731;Selle Français;Bai brun;-195,00 €",
  "K-002;GARÇON;Chloé;02/05/2010;7654321B;G2;0698765432;chloe@exemple.fr;;;;;;0",
  "K-003;\"DUPONT; dit « Jojo »\";Élodie;;;;;;;;;;;\"1 234,56 €\"",
].join("\r\n");

describe("lecture des fichiers", () => {
  it("détecte Windows-1252, UTF-8 avec BOM et le séparateur", () => {
    const w = decode(cp1252("Prénom;Élodie;Garçon;€"));
    expect(w).toEqual({ text: "Prénom;Élodie;Garçon;€", encoding: "windows-1252" });
    const u = decode(new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("Prénom,Nom")]));
    expect(u).toEqual({ text: "Prénom,Nom", encoding: "utf-8" });
    expect(detectDelimiter("a;b;c\n1;2;3\n4;5;6")).toBe(";");
    expect(detectDelimiter("a,b,c\n1,\"2;x\",3")).toBe(",");
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    expect(parseCsv('a;"b ""c"";d"\r\n1;2', ";")).toEqual([["a", 'b "c";d'], ["1", "2"]]);
  });
  it("mappe les colonnes françaises courantes, avec un indice de confiance", async () => {
    const m = await heuristicMapper(["Nom", "Prénom", "Né(e) le", "N° licence", "Tél. portable", "Courriel", "Nom du cheval", "N° SIRE", "Transpondeur", "Colonne mystère"], [["MARTIN", "Léa", "14/03/2012", "1234567A", "0612345678", "a@b.fr", "Ulysse", "15012345K", "250259600418731", "zz"]]);
    expect(m.mapping).toMatchObject({ Nom: "last", "Prénom": "first", "Né(e) le": "birth", "N° licence": "lic", "Tél. portable": "phone", Courriel: "email", "Nom du cheval": "name", "N° SIRE": "sire", Transpondeur: "chip", "Colonne mystère": null });
    expect(m.confiance.Nom).toBe(1);
  });
});

describe("POST /api/v1/import/csv", () => {
  it("aperçu d'un export Windows-1252 : encodage, ligne d'en-tête, mappage proposé, aucune écriture", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/csv", { method: "POST", token: key, body: cp1252(CSV), headers: { "content-type": "text/csv" } });
    expect(r.status).toBe(200);
    const j: any = await r.json();
    expect(j.action).toBe("preview");
    expect(j.detected).toMatchObject({ encoding: "windows-1252", delimiter: ";", header_row: 2, rows: 3 });
    expect(j.coll).toBe("members");
    expect(j.mapping["N° adhérent"]).toBe("external_id");
    expect(j.mapping["Nom du cheval"]).toBe("name");
    expect(j.counts).toEqual({ members: 3, horses: 1 });
    const lea = j.sample.find((s: any) => s.external_id === "csv:K-001");
    expect(lea.data).toMatchObject({ last: "MARTIN", first: "Léa", birth: "2012-03-14", galop: 4, balance: -195, lic: "1234567A" });
    expect(j.sample.find((s: any) => s.external_id === "csv:K-003").data).toMatchObject({ last: "DUPONT; dit « Jojo »", first: "Élodie", balance: 1234.56 });
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ?").bind(o.clubId).first<any>();
    expect(n.n).toBe(0);
  });
  it("import avec mappage explicite (multipart) : adhérents et chevaux liés, réimport idempotent", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const send = async () => {
      const fd = new FormData();
      fd.append("file", new File([cp1252(CSV)], "export.csv", { type: "text/csv" }));
      fd.append("action", "commit");
      fd.append("mapping", JSON.stringify({ "N° adhérent": "external_id", Nom: "last", "Prénom": "first", "Date de naissance": "birth", "N° licence": "lic", Galop: "galop", "Téléphone": "phone", "E-mail": "email", "Nom du cheval": "name", SIRE: "sire", Puce: "chip", Race: "breed", Robe: "coat", Solde: null }));
      return call("/api/v1/import/csv", { method: "POST", token: key, body: fd });
    };
    const r = await send();
    expect(r.status, await r.clone().text()).toBe(200);
    const j: any = await r.json();
    expect(j.report.counts.members.created).toBe(3);
    expect(j.report.counts.horses.created).toBe(1);
    const hid = j.report.ids.horses["sire:15012345K"], mid = j.report.ids.members["csv:K-001"];
    const h = (await getRecord(o.clubId, "horses", hid))!.data;
    expect(h).toMatchObject({ name: "Ulysse de la Roche", owner: mid, breed: "Selle Français", coat: "Bai brun", kind: "proprietaire" });
    const m = (await getRecord(o.clubId, "members", mid))!.data;
    expect(m.balance).toBe(0); // colonne Solde non mappée
    const again: any = await (await send()).json();
    expect(again.report.totals.created).toBe(0);
    expect(again.report.counts.members.unchanged).toBe(3);
  });
  it("erreurs claires : fichier vide, mappage invalide, classeur Excel", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r1 = await call("/api/v1/import/csv", { method: "POST", token: key, body: "", headers: { "content-type": "text/csv" } });
    expect(r1.status).toBe(400);
    const r2 = await call("/api/v1/import/csv?mapping=" + encodeURIComponent(JSON.stringify({ Nom: "nom_inconnu" })), { method: "POST", token: key, body: "Nom;Prénom\nA;B", headers: { "content-type": "text/csv" } });
    expect(r2.status).toBe(400);
    expect(((await r2.json()) as any).error.code).toBe("invalid_mapping");
    const r3 = await call("/api/v1/import/csv", { method: "POST", token: key, body: new Uint8Array([0x50, 0x4b, 3, 4, 0, 0]), headers: { "content-type": "application/octet-stream" } });
    expect(((await r3.json()) as any).error.code).toBe("xlsx_not_supported");
    const r4 = await call("/api/v1/import/csv", { method: "POST", token: key, json: { content: "Nom;Prénom;Email\nPetit;Jade;jade@exemple.fr", action: "commit", dry_run: true } });
    const j4: any = await r4.json();
    expect(j4.report.dry_run).toBe(true);
    expect(j4.report.counts.members.created).toBe(1);
  });
});

describe("POST /api/v1/import/colonnes", () => {
  it("propose un mappage à partir des en-têtes et d'exemples", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/colonnes", { method: "POST", token: key, json: { entetes: ["NOM", "PRENOM", "Col7", "Cheval"], exemples: [["MARTIN", "Léa", "lea@exemple.fr", "Ulysse"]] } });
    const j: any = await r.json();
    expect(j.mapping).toEqual({ NOM: "last", PRENOM: "first", Col7: "email", Cheval: "name" });
    expect(j.confiance.Col7).toBeLessThan(1);
    expect(j.coll).toBe("members");
    expect((await call("/api/v1/import/colonnes", { method: "POST", token: key, json: { entetes: [] } })).status).toBe(400);
  });
});
