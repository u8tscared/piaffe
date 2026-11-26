/* Espace admin : calculs purs (testés sans base) : revenu mensuel, quota d'e-mails, état d'un club. */
import { FOUNDER_OFFER, PLANS } from "../billing/plans";

const DAY = 864e5;

/** Revenu mensuel récurrent (HT, centimes) d'un abonnement. */
export function monthlyCents(s: { plan: string | null; interval: string | null; founder: number | boolean | null }): number {
  const year = s.interval === "year";
  if (s.founder) return year ? Math.round(FOUNDER_OFFER.year_cents / 12) : FOUNDER_OFFER.month_cents;
  const p = PLANS.find((x) => x.key === s.plan);
  if (!p) return 0;
  return year ? Math.round(p.year_cents / 12) : p.month_cents;
}

/** Plafonds gratuits des fournisseurs d'e-mails (src/mail/providers.ts). */
export const MAIL_CAPS: Record<string, { day: number | null; month: number | null; label: string }> = {
  brevo: { day: 300, month: null, label: "Brevo, offre gratuite : 300 e-mails par jour" },
  resend: { day: 100, month: 3000, label: "Resend, offre gratuite : 100 par jour, 3 000 par mois" },
  log: { day: null, month: null, label: "Mode journal : aucun e-mail ne part vraiment" },
};

export function mailQuota(provider: string, today: number, month: number) {
  const cap = MAIL_CAPS[provider] || { day: null, month: null, label: "Fournisseur « " + provider + " »" };
  const pctDay = cap.day ? Math.min(100, Math.round((today / cap.day) * 100)) : null;
  const pctMonth = cap.month ? Math.min(100, Math.round((month / cap.month) * 100)) : null;
  const pct = Math.max(pctDay ?? 0, pctMonth ?? 0);
  return { provider, label: cap.label, today, month, day_cap: cap.day, month_cap: cap.month, pct, level: pct >= 90 ? "bad" : pct >= 70 ? "warn" : "ok" };
}

/** Résumé lisible de l'état commercial d'un club. */
export function clubState(c: { plan_status: string; trial_ends_at: string | null; suspended_at?: string | null }, now = Date.now()) {
  if (c.suspended_at) return { key: "suspendu", label: "Suspendu", tone: "bad" };
  switch (c.plan_status) {
    case "active": return { key: "payant", label: "Payant", tone: "ok" };
    case "trialing": {
      const left = c.trial_ends_at ? Math.ceil((Date.parse(c.trial_ends_at) - now) / DAY) : null;
      if (left !== null && left <= 0) return { key: "essai_fini", label: "Essai terminé", tone: "warn" };
      return { key: "essai", label: left === null ? "En essai" : left === 1 ? "Essai, dernier jour" : `Essai, ${left} jours`, tone: left !== null && left <= 7 ? "warn" : "info" };
    }
    case "past_due": return { key: "impaye", label: "Impayé", tone: "bad" };
    case "unpaid": return { key: "impaye", label: c.trial_ends_at && Date.parse(c.trial_ends_at) < now ? "Essai fini, sans offre" : "Impayé", tone: "bad" };
    case "canceled": return { key: "resilie", label: "Résilié", tone: "mut" };
    default: return { key: c.plan_status, label: c.plan_status, tone: "mut" };
  }
}

/** Nouvelle date de fin d'essai : à partir de la fin actuelle si elle est encore à venir, sinon d'aujourd'hui. */
export function extendedTrialEnd(current: string | null, days: number, now = Date.now()): string {
  const base = current && Date.parse(current) > now ? Date.parse(current) : now;
  return new Date(base + days * DAY).toISOString();
}

/* ---------- CSV de prospection ---------- */

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const HEAD: Record<string, string[]> = {
  name: ["nom", "name", "centre", "etablissement", "structure", "raison sociale", "club", "ecurie", "nom du centre"],
  city: ["ville", "city", "commune", "localite"],
  email: ["email", "e mail", "mail", "courriel", "e mail pro", "email pro", "adresse e mail", "adresse email"],
  source: ["source", "origine", "provenance"],
  phone: ["telephone", "tel", "phone", "portable", "mobile"],
  notes: ["notes", "note", "commentaire", "commentaires", "remarque"],
};

export function parseCsvLine(line: string, d: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === d) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export interface ProspectIn { name: string; city: string; email: string; source: string; phone: string; notes: string }

/** Lit un CSV (séparateur ; , ou tabulation, en-tête obligatoire). Renvoie les lignes et les lignes refusées. */
export function parseProspectsCsv(text: string): { rows: ProspectIn[]; rejected: { line: number; reason: string }[]; columns: Record<string, string> } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], rejected: [], columns: {} };
  const first = lines[0];
  const d = [";", "\t", ","].map((x) => [x, first.split(x).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const head = parseCsvLine(first, d).map(norm);
  const idx: Record<string, number> = {}, columns: Record<string, string> = {};
  for (const [k, names] of Object.entries(HEAD)) {
    const i = head.findIndex((h) => names.includes(h));
    if (i >= 0) { idx[k] = i; columns[k] = parseCsvLine(first, d)[i]; }
  }
  const rows: ProspectIn[] = [], rejected: { line: number; reason: string }[] = [];
  if (idx.name === undefined) return { rows, rejected: [{ line: 1, reason: "Colonne « nom » introuvable dans l'en-tête." }], columns };
  for (let n = 1; n < lines.length && n <= 5000; n++) {
    const cells = parseCsvLine(lines[n], d);
    const get = (k: string) => (idx[k] === undefined ? "" : (cells[idx[k]] || "").trim());
    const row: ProspectIn = { name: get("name").slice(0, 160), city: get("city").slice(0, 80), email: get("email").toLowerCase().slice(0, 254), source: get("source").slice(0, 120), phone: get("phone").slice(0, 40), notes: get("notes").slice(0, 2000) };
    if (!row.name) { rejected.push({ line: n + 1, reason: "Nom vide." }); continue; }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.email)) { rejected.push({ line: n + 1, reason: "E-mail invalide : " + row.email }); continue; }
    rows.push(row);
  }
  return { rows, rejected, columns };
}
