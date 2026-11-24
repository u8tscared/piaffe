import type { Env } from "../env";
import { all, json, one } from "../lib/db";
import { ACCOUNTS, CATEGORIES, PAY_METHODS, STATUS_FR, vatAccount, type PayMethod } from "./catalog";
import { decFr } from "./money";
import { getSettings } from "./settings";
import { snapshotOf, type InvoiceRow } from "./invoices";
import type { Snapshot } from "./snapshot";

/**
 * Exports comptables.
 * - FEC (art. A47 A-1 du LPF) : 18 colonnes, séparateur tabulation (ou « | »), dates AAAAMMJJ, montants à virgule,
 *   jeu de caractères ISO 8859-15, nom SIRENFECAAAAMMJJ.txt (date de clôture). Journaux VE (ventes), BQ (banque),
 *   CA (caisse), AC (achats). Chaque écriture est équilibrée.
 * - Écritures CSV génériques (Journal;Date;Pièce;Compte;Compte auxiliaire;Libellé;Débit;Crédit;Échéance), importables
 *   dans Pennylane, Tiime, Sage, ACD, Quadra, Cegid via leur import d'écritures paramétrable.
 * - Journal des ventes et des encaissements CSV lisibles (séparateur « ; », UTF-8 avec BOM pour Excel).
 */

export interface Entry {
  journal: "VE" | "BQ" | "CA" | "AC"; date: string; piece: string; piece_date: string; account: string; account_label: string;
  aux: string; aux_label: string; label: string; debit: number; credit: number; let?: string; date_let?: string; valid_date: string; due?: string | null;
}
const JOURNALS: Record<Entry["journal"], string> = { VE: "Ventes", BQ: "Banque", CA: "Caisse", AC: "Achats" };

function auxOf(i: InvoiceRow): { aux: string; label: string } {
  const label = i.customer_name || "Client";
  if (i.customer_ref) return { aux: ("C" + i.customer_ref).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17), label };
  if (i.customer_siren) return { aux: "C" + i.customer_siren, label };
  return { aux: "CDIVERS", label: "Clients divers" };
}

function letterCode(n: number): string { let s = ""; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

export async function buildEntries(env: Env, clubId: string, from: string, to: string): Promise<Entry[]> {
  const db = env.DB;
  const st = await getSettings(db, clubId);
  const acct = (cat: string, def: string) => st.accounts[cat] || def;
  const invoices = await all<InvoiceRow>(db, "SELECT * FROM invoices WHERE club_id = ? AND number IS NOT NULL AND issue_date BETWEEN ? AND ? ORDER BY issue_date, series, seq", clubId, from, to);
  const out: Entry[] = [];
  const letters = new Map<string, string>(); let li = 0;
  for (const i of invoices) {
    if (i.status === "paid" || i.status === "cancelled") letters.set(i.id, letterCode(li++));
  }
  const depositCache = new Map<string, Snapshot>();
  for (const i of invoices) {
    const s = snapshotOf(i); if (!s) continue;
    const { aux, label: auxLabel } = auxOf(i);
    const credit = i.kind === "credit_note";
    const base = { journal: "VE" as const, date: i.issue_date!, piece: i.number!, piece_date: i.issue_date!, aux: "", aux_label: "", valid_date: i.issue_date!, due: i.due_date };
    const lib = `${credit ? "Avoir" : i.kind === "deposit" ? "Acompte" : "Facture"} ${i.number} ${auxLabel}`.slice(0, 100);
    const push = (account: string, amount: number, extra: Partial<Entry> = {}) => {
      if (!amount) return;
      // amount > 0 = sens normal (débit pour le client sur une facture), inversé pour un avoir
      const debitSide = (amount > 0) !== credit;
      out.push({ ...base, account, account_label: ACCOUNTS[account] || CATEGORIES[account]?.label || "Compte " + account, label: lib, debit: debitSide ? Math.abs(amount) : 0, credit: debitSide ? 0 : Math.abs(amount), ...extra });
    };
    const clientLine = (amount: number) => push("411000", amount, { aux, aux_label: auxLabel, let: letters.get(i.id) || letters.get(i.original_id || "") || "", date_let: letters.has(i.id) ? (i.paid_at || i.cancelled_at || "").slice(0, 10) : "" });
    clientLine(s.totals.ttc);
    // Produits par compte (crédit), ou 419100 pour une facture d'acompte.
    const byAccount = new Map<string, number>();
    for (const l of s.lines) {
      const a = i.kind === "deposit" ? "419100" : acct(l.category, l.account || CATEGORIES[l.category]?.account || "706800");
      byAccount.set(a, (byAccount.get(a) || 0) + l.line_ht);
    }
    for (const [a, amt] of byAccount) push(a, -amt);
    for (const g of s.groups) if (g.vat) push(vatAccount(g.rate_bp), -g.vat);
    // Facture finale : reprise des acomptes (débit 419100 et TVA, crédit client).
    for (const id of json<string[]>(i.deposit_ids, [])) {
      let ds = depositCache.get(id);
      if (!ds) { const d = await one<InvoiceRow>(db, "SELECT * FROM invoices WHERE id = ? AND club_id = ?", id, clubId); if (d?.snapshot) { ds = snapshotOf(d); depositCache.set(id, ds); } }
      if (!ds) continue;
      push("419100", ds.totals.ht, { label: (`Reprise acompte ${ds.number} ` + auxLabel).slice(0, 100) });
      for (const g of ds.groups) if (g.vat) push(vatAccount(g.rate_bp), g.vat, { label: (`Reprise acompte ${ds.number} ` + auxLabel).slice(0, 100) });
      clientLine(-ds.totals.ttc);
    }
  }
  // Encaissements
  const pays = await all<any>(db, `SELECT p.*, i.number, i.customer_ref, i.customer_name, i.customer_siren, i.status AS inv_status, i.paid_at AS inv_paid_at, i.id AS inv_id
    FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id WHERE p.club_id = ? AND p.paid_at BETWEEN ? AND ? ORDER BY p.paid_at, p.created_at`, clubId, from, to);
  for (const p of pays) {
    const m = PAY_METHODS[p.method as PayMethod] || PAY_METHODS.other;
    const j = m.journal as Entry["journal"];
    const { aux, label: auxLabel } = auxOf(p as InvoiceRow);
    const piece = (p.reference ? `${p.number}/${p.reference}` : p.number).slice(0, 40);
    const lib = `${p.amount > 0 ? "Règlement" : "Remboursement"} ${m.label} ${p.number} ${auxLabel}`.slice(0, 100);
    const a = Math.abs(p.amount); const inflow = p.amount > 0;
    const base = { journal: j, date: p.paid_at, piece, piece_date: p.paid_at, label: lib, valid_date: p.paid_at, aux: "", aux_label: "" };
    out.push({ ...base, account: m.account, account_label: ACCOUNTS[m.account] || m.label, debit: inflow ? a : 0, credit: inflow ? 0 : a });
    out.push({ ...base, account: "411000", account_label: ACCOUNTS["411000"], aux, aux_label: auxLabel, debit: inflow ? 0 : a, credit: inflow ? a : 0, let: letters.get(p.inv_id) || "", date_let: letters.has(p.inv_id) ? (p.inv_paid_at || "").slice(0, 10) : "" });
  }
  // Achats (factures fournisseurs reçues)
  const inc = await all<any>(db, "SELECT * FROM incoming_invoices WHERE club_id = ? AND issue_date BETWEEN ? AND ? AND status != 'refused' ORDER BY issue_date, received_at", clubId, from, to);
  for (const f of inc) {
    const credit = f.type_code === "381";
    const aux = ("F" + (f.supplier_siren || f.supplier_name || "DIVERS")).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);
    const lib = `${credit ? "Avoir" : "Facture"} ${f.number || ""} ${f.supplier_name || ""}`.trim().slice(0, 100);
    const base = { journal: "AC" as const, date: f.issue_date, piece: String(f.number || f.id).slice(0, 40), piece_date: f.issue_date, label: lib, valid_date: f.issue_date, aux: "", aux_label: "" };
    const d = (amt: number) => (credit ? { debit: 0, credit: amt } : { debit: amt, credit: 0 });
    const c = (amt: number) => (credit ? { debit: amt, credit: 0 } : { debit: 0, credit: amt });
    out.push({ ...base, account: f.account || "606000", account_label: ACCOUNTS[f.account || "606000"] || "Achats", ...d(f.total_ht) });
    if (f.total_vat) out.push({ ...base, account: "445660", account_label: ACCOUNTS["445660"], ...d(f.total_vat) });
    out.push({ ...base, account: "401000", account_label: ACCOUNTS["401000"], aux, aux_label: f.supplier_name || "Fournisseur", ...c(f.total_ht + f.total_vat) });
  }
  return out.sort((a, b) => a.journal.localeCompare(b.journal) || a.date.localeCompare(b.date) || a.piece.localeCompare(b.piece));
}

const ymd = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).replace(/-/g, "") : "");
const clean = (s: unknown, sep: string) => String(s ?? "").replace(/[\t\r\n|]+/g, " ").replace(sep === ";" ? /;/g : /\u0000/g, ",").replace(/[  ]/g, " ").trim();

export const FEC_HEADER = ["JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"];

export function fecText(entries: Entry[], sep: "\t" | "|" = "\t"): string {
  const lines = [FEC_HEADER.join(sep)];
  // Une écriture = un journal + une pièce + une date ; numérotation continue par journal.
  const nums = new Map<string, string>(); const counters: Record<string, number> = {};
  for (const e of entries) {
    const k = `${e.journal}|${e.piece}|${e.date}|${e.label.startsWith("Reprise") ? "" : ""}`;
    if (!nums.has(k)) { counters[e.journal] = (counters[e.journal] || 0) + 1; nums.set(k, `${e.journal}${String(counters[e.journal]).padStart(6, "0")}`); }
    lines.push([e.journal, JOURNALS[e.journal], nums.get(k)!, ymd(e.date), e.account, clean(e.account_label, sep), e.aux, clean(e.aux_label, sep), clean(e.piece, sep), ymd(e.piece_date),
      clean(e.label, sep), decFr(e.debit), decFr(e.credit), e.let || "", ymd(e.date_let), ymd(e.valid_date), "", ""].join(sep));
  }
  return lines.join("\r\n") + "\r\n";
}

/** Encodage ISO 8859-15 (Latin-9), exigé par l'article A47 A-1 ; caractères absents remplacés. */
export function latin9(s: string): Uint8Array {
  const special: Record<string, number> = { "€": 0xa4, "Š": 0xa6, "š": 0xa8, "Ž": 0xb4, "ž": 0xb8, "Œ": 0xbc, "œ": 0xbd, "Ÿ": 0xbe };
  const forbidden = new Set([0xa4, 0xa6, 0xa8, 0xb4, 0xb8, 0xbc, 0xbd, 0xbe]);
  const repl: Record<string, string> = { "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", "…": "...", " ": " ", "−": "-" };
  const out: number[] = [];
  for (const ch0 of s) {
    const ch = repl[ch0] ?? ch0;
    for (const ch2 of ch) {
      if (special[ch2] != null) { out.push(special[ch2]); continue; }
      const c = ch2.codePointAt(0)!;
      out.push(c < 0x100 && !forbidden.has(c) ? c : 0x3f);
    }
  }
  return new Uint8Array(out);
}

export async function fecFilename(env: Env, clubId: string, end: string): Promise<string> {
  const c = await one<{ siren: string | null; siret: string | null }>(env.DB, "SELECT siren, siret FROM clubs WHERE id = ?", clubId);
  const siren = (c?.siren || c?.siret?.slice(0, 9) || "000000000").replace(/\D/g, "").slice(0, 9).padStart(9, "0");
  return `${siren}FEC${ymd(end)}.txt`;
}

const csvCell = (v: unknown) => { const s = String(v ?? "").replace(/[  ]/g, " "); return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";

export function entriesCsv(entries: Entry[]): string {
  return csv([["Journal", "Date", "Pièce", "Compte", "Compte auxiliaire", "Libellé du compte auxiliaire", "Libellé", "Débit", "Crédit", "Échéance", "Lettrage"],
    ...entries.map((e) => [e.journal, e.date.split("-").reverse().join("/"), e.piece, e.account, e.aux, e.aux_label, e.label, decFr(e.debit), decFr(e.credit), e.due ? e.due.split("-").reverse().join("/") : "", e.let || ""])]);
}

export async function salesCsv(env: Env, clubId: string, from: string, to: string): Promise<string> {
  const rows = await all<InvoiceRow>(env.DB, "SELECT * FROM invoices WHERE club_id = ? AND number IS NOT NULL AND issue_date BETWEEN ? AND ? ORDER BY issue_date, series, seq", clubId, from, to);
  const out: unknown[][] = [["Date", "Numéro", "Type", "Client", "Référence client", "SIREN client", "Libellé", "Base HT 5,5 %", "TVA 5,5 %", "Base HT 10 %", "TVA 10 %", "Base HT 20 %", "TVA 20 %", "Exonéré ou hors champ", "Total HT", "Total TVA", "Total TTC", "Acomptes déduits", "Encaissé", "Reste dû", "Échéance", "Statut", "Facture d'origine", "Facture électronique"]];
  for (const i of rows) {
    const s = snapshotOf(i); const sg = i.kind === "credit_note" ? -1 : 1;
    const g = (bp: number, k: "base" | "vat") => sg * (s?.groups.filter((x) => x.category === "S" && x.rate_bp === bp).reduce((a, x) => a + x[k], 0) || 0);
    const ex = sg * (s?.groups.filter((x) => x.category !== "S").reduce((a, x) => a + x.base, 0) || 0);
    const orig = i.original_id ? (await one<{ number: string }>(env.DB, "SELECT number FROM invoices WHERE id = ? AND club_id = ?", i.original_id, clubId))?.number : "";
    out.push([i.issue_date!.split("-").reverse().join("/"), i.number, i.kind === "credit_note" ? "Avoir" : i.kind === "deposit" ? "Acompte" : "Facture", i.customer_name, i.customer_ref || "", i.customer_siren || "", i.label || "",
      decFr(g(550, "base")), decFr(g(550, "vat")), decFr(g(1000, "base")), decFr(g(1000, "vat")), decFr(g(2000, "base")), decFr(g(2000, "vat")), decFr(ex),
      decFr(sg * i.total_ht), decFr(sg * i.total_vat), decFr(sg * i.total_ttc), decFr(i.prepaid_amount), decFr(i.paid_amount),
      decFr(i.kind === "credit_note" ? 0 : Math.max(0, i.total_ttc - i.prepaid_amount - i.credited_amount - i.paid_amount)),
      i.due_date ? i.due_date.split("-").reverse().join("/") : "", i.kind === "credit_note" ? "avoir" : STATUS_FR[i.status] || i.status, orig || "", i.einvoice_status || ""]);
  }
  return csv(out);
}

export async function paymentsCsv(env: Env, clubId: string, from: string, to: string): Promise<string> {
  const rows = await all<any>(env.DB, `SELECT p.*, i.number, i.customer_name, i.customer_ref FROM invoice_payments p JOIN invoices i ON i.id = p.invoice_id
    WHERE p.club_id = ? AND p.paid_at BETWEEN ? AND ? ORDER BY p.paid_at, p.created_at`, clubId, from, to);
  return csv([["Date", "Facture", "Client", "Référence client", "Moyen de paiement", "Référence", "Montant", "Compte de trésorerie"],
    ...rows.map((p) => { const m = PAY_METHODS[p.method as PayMethod] || PAY_METHODS.other; return [p.paid_at.split("-").reverse().join("/"), p.number, p.customer_name, p.customer_ref || "", m.label, p.reference || "", decFr(p.amount), m.account]; })]);
}
