import { describe, it, expect } from "vitest";
import { call, seed } from "./helpers";
import { apiKey } from "./mail-kit";

// FEC fictif (même contenu que migration/essais/fec-exemple.txt) : ventes, banque, achats.
const T = "\t";
const FEC = [
  ["JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"],
  ["VT", "Ventes", "VT0001", "20260905", "411000", "Clients", "C0012", "MARTIN Léa", "FA2026-0101", "20260905", "Forfait annuel", "780,00", "", "A", "20260915", "20260930", "", ""],
  ["VT", "Ventes", "VT0001", "20260905", "706100", "Enseignement", "", "", "FA2026-0101", "20260905", "Forfait annuel", "", "650,00", "", "", "20260930", "", ""],
  ["VT", "Ventes", "VT0001", "20260905", "445710", "TVA collectée", "", "", "FA2026-0101", "20260905", "Forfait annuel", "", "130,00", "", "", "20260930", "", ""],
  ["VT", "Ventes", "VT0002", "20261002", "411000", "Clients", "C0027", "GIRARD Hugo", "FA2026-0144", "20261002", "Pension octobre", "420,00", "", "", "", "20261031", "", ""],
  ["VT", "Ventes", "VT0002", "20261002", "706300", "Pensions", "", "", "FA2026-0144", "20261002", "Pension octobre", "", "381,82", "", "", "20261031", "", ""],
  ["VT", "Ventes", "VT0002", "20261002", "445710", "TVA collectée", "", "", "FA2026-0144", "20261002", "Pension octobre", "", "38,18", "", "", "20261031", "", ""],
  ["BQ", "Banque", "BQ0001", "20260915", "512000", "Banque", "", "", "VIR-0915", "20260915", "Virement MARTIN", "780,00", "", "", "", "20260930", "", ""],
  ["BQ", "Banque", "BQ0001", "20260915", "411000", "Clients", "C0012", "MARTIN Léa", "VIR-0915", "20260915", "Virement MARTIN", "", "780,00", "A", "20260915", "20260930", "", ""],
].map((l) => l.join(T)).join("\n");
const HELLOASSO = `Numéro;Formule;Montant tarif;Date;Statut;Moyen de paiement;Nom;Prénom;Nom payeur;Prénom payeur;Email payeur;Date de naissance
70012;Adhésion annuelle enfant;95,00;03/09/2026 10:12;Validé;Carte bancaire;Rousseau;Zoé;Rousseau;Claire;claire.rousseau@exemple.fr;14/05/2015
70014;Adhésion annuelle enfant;95,00;05/09/2026 09:02;Refusé;Carte bancaire;Lambert;Inès;Lambert;Marc;marc.lambert@exemple.fr;21/11/2016`;

describe("POST /api/v1/import/fec et /fichier", () => {
  it("FEC : aperçu du résumé comptable, des clients, factures et règlements, sans rien écrire", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/fec", { method: "POST", token: key, json: { nom: "FEC-2026.txt", content: FEC } });
    expect(r.status).toBe(200);
    const j: any = await r.json();
    expect(j.action).toBe("preview");
    expect(j.comptabilite).toMatchObject({ format: "fec", equilibre: true, ecritures: 3, chiffre_affaires_ht: 1031.82, tva: { collectee: 168.18 } });
    expect(j.comptabilite.exercice).toEqual({ debut: "2026-09-05", fin: "2026-10-02" });
    expect(j.sources.map((s: any) => s.type).sort()).toEqual(["adherents", "factures", "reglements"]);
    expect(j.lots).toMatchObject({ members: 2, invoices: 2, payments: 1 });
  });

  it("FEC : import simulé puis appliqué", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/fec?action=commit&dry_run=true", { method: "POST", token: key, json: { nom: "FEC.txt", content: FEC } });
    expect(r.status).toBe(200);
    const j: any = await r.json();
    expect(j.report).toMatchObject({ job_id: j.job_id, dry_run: true, status: "simulated" });
    expect(j.source ?? j.report.source).toBe("fec");
  });

  it("refuse un fichier qui n'est pas un FEC sur /fec", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/fec", { method: "POST", token: key, json: { nom: "x.csv", content: "Nom;Prénom\nA;B" } });
    expect(r.status).toBe(400);
    expect(((await r.json()) as any).error.code).toBe("not_fec");
  });

  it("export HelloAsso : colonnes rangées toutes seules, paiements refusés écartés", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const r = await call("/api/v1/import/fichier", { method: "POST", token: key, json: { nom: "export-helloasso.csv", content: HELLOASSO } });
    expect(r.status).toBe(200);
    const j: any = await r.json();
    const types = j.sources.map((s: any) => s.type);
    expect(types).toContain("adherents");
    expect(types).toContain("reglements");
    expect(j.controle.encaisse_ttc).toBe(95);
    expect(j.sources.every((s: any) => s.logiciel === "helloasso")).toBe(true);
  });

  it("tableur quelconque : type et colonnes devinés", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const csv = "Nom du cheval;Race;Robe;N° SIRE;Propriétaire\nVanille;Connemara;Gris;25001234X;Club\nTornado;Selle Français;Bai;25004321Y;Club";
    const r = await call("/api/v1/import/fichier?nom=cavalerie.csv", { method: "POST", token: key, body: new TextEncoder().encode(csv), headers: { "content-type": "text/csv" } });
    expect(r.status).toBe(200);
    const j: any = await r.json();
    expect(j.sources[0]).toMatchObject({ type: "chevaux", colonnes: { "Nom du cheval": "nom", Race: "race", Robe: "robe", "N° SIRE": "sire" } });
    expect(j.lots.horses).toBe(2);
  });
});
