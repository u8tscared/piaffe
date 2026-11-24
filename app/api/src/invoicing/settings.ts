import { json, one, run } from "../lib/db";
import type { Env } from "../env";
import type { VatRegime } from "./catalog";

/** Réglages de facturation d'un club (table invoicing_settings, JSON). Toutes les clés sont facultatives. */
export interface InvoicingSettings {
  payment_terms_days: number;        // particuliers
  b2b_terms_days: number;            // professionnels (30 jours max par défaut, art. L441-10 du code de commerce : 60 jours)
  late_penalty_text: string;         // taux des pénalités de retard (professionnels)
  iban: string | null; bic: string | null;
  prefix_invoice: string; prefix_credit: string;
  vat_on_debits: boolean;            // option pour le paiement de la TVA d'après les débits
  vat_periodicity: "decade" | "monthly" | "bimonthly"; // e-reporting (réel normal mensuel, mensuel, franchise)
  reminders: { enabled: boolean; days: number[] };
  send_on_issue: boolean;
  footer: string | null;
  accounts: Record<string, string>;  // catégorie → compte de produit (surcharge du plan par défaut)
  einvoicing_enabled: boolean;
  legal: { capital?: string; rcs?: string; ape?: string; extra?: string };
}

export const DEFAULT_SETTINGS: InvoicingSettings = {
  payment_terms_days: 15,
  b2b_terms_days: 30,
  late_penalty_text: "trois fois le taux d'intérêt légal",
  iban: null, bic: null,
  prefix_invoice: "F", prefix_credit: "AV",
  vat_on_debits: false,
  vat_periodicity: "monthly",
  reminders: { enabled: true, days: [3, 15, 30] },
  send_on_issue: true,
  footer: null,
  accounts: {},
  einvoicing_enabled: true,
  legal: {},
};

export async function getSettings(db: D1Database, clubId: string): Promise<InvoicingSettings> {
  const r = await one<{ data: string }>(db, "SELECT data FROM invoicing_settings WHERE club_id = ?", clubId);
  const d = json<Partial<InvoicingSettings>>(r?.data, {});
  return { ...DEFAULT_SETTINGS, ...d, reminders: { ...DEFAULT_SETTINGS.reminders, ...(d.reminders || {}) }, legal: { ...(d.legal || {}) }, accounts: { ...(d.accounts || {}) } };
}

const PREFIX_RE = /^[A-Z0-9]{1,6}$/;
const IBAN_RE = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;

/** Valide et fusionne une mise à jour partielle. Lève une Error(message en français) si invalide. */
export function mergeSettings(cur: InvoicingSettings, p: Record<string, any>): InvoicingSettings {
  const n: InvoicingSettings = structuredClone(cur);
  const int = (v: any, min: number, max: number, f: string) => {
    const x = Number(v); if (!Number.isInteger(x) || x < min || x > max) throw new Error(`Le réglage « ${f} » doit être un nombre entier entre ${min} et ${max}.`); return x;
  };
  if ("payment_terms_days" in p) n.payment_terms_days = int(p.payment_terms_days, 0, 120, "payment_terms_days");
  if ("b2b_terms_days" in p) n.b2b_terms_days = int(p.b2b_terms_days, 0, 60, "b2b_terms_days");
  if ("late_penalty_text" in p) n.late_penalty_text = String(p.late_penalty_text || DEFAULT_SETTINGS.late_penalty_text).slice(0, 200);
  if ("iban" in p) {
    const v = p.iban ? String(p.iban).replace(/\s+/g, "").toUpperCase() : null;
    if (v && !IBAN_RE.test(v)) throw new Error("L'IBAN saisi n'est pas valide.");
    n.iban = v;
  }
  if ("bic" in p) n.bic = p.bic ? String(p.bic).replace(/\s+/g, "").toUpperCase().slice(0, 11) : null;
  for (const k of ["prefix_invoice", "prefix_credit"] as const) if (k in p) {
    const v = String(p[k] || "").toUpperCase(); if (!PREFIX_RE.test(v)) throw new Error("Le préfixe de numérotation doit contenir de 1 à 6 lettres ou chiffres.");
    n[k] = v;
  }
  if (n.prefix_invoice === n.prefix_credit) throw new Error("Les factures et les avoirs doivent avoir des préfixes différents.");
  if ("vat_on_debits" in p) n.vat_on_debits = !!p.vat_on_debits;
  if ("vat_periodicity" in p) {
    if (!["decade", "monthly", "bimonthly"].includes(p.vat_periodicity)) throw new Error("La périodicité de l'e-reporting doit être « decade », « monthly » ou « bimonthly ».");
    n.vat_periodicity = p.vat_periodicity;
  }
  if ("reminders" in p && p.reminders && typeof p.reminders === "object") {
    if ("enabled" in p.reminders) n.reminders.enabled = !!p.reminders.enabled;
    if ("days" in p.reminders) {
      const d = Array.isArray(p.reminders.days) ? p.reminders.days.map((x: any) => int(x, 1, 180, "reminders.days")) : [];
      n.reminders.days = [...new Set<number>(d)].sort((a, b) => a - b).slice(0, 5);
    }
  }
  if ("send_on_issue" in p) n.send_on_issue = !!p.send_on_issue;
  if ("footer" in p) n.footer = p.footer ? String(p.footer).slice(0, 500) : null;
  if ("accounts" in p && p.accounts && typeof p.accounts === "object") {
    for (const [k, v] of Object.entries(p.accounts)) {
      if (!/^[0-9]{3,10}$/.test(String(v))) throw new Error("Un numéro de compte doit contenir de 3 à 10 chiffres.");
      n.accounts[k] = String(v);
    }
  }
  if ("einvoicing_enabled" in p) n.einvoicing_enabled = !!p.einvoicing_enabled;
  if ("legal" in p && p.legal && typeof p.legal === "object") {
    for (const k of ["capital", "rcs", "ape", "extra"] as const) if (k in p.legal) n.legal[k] = p.legal[k] ? String(p.legal[k]).slice(0, 200) : undefined;
  }
  return n;
}

export async function saveSettings(db: D1Database, clubId: string, s: InvoicingSettings) {
  await run(db, "INSERT INTO invoicing_settings (club_id, data, updated_at) VALUES (?,?,?) ON CONFLICT(club_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    clubId, JSON.stringify(s), new Date().toISOString());
}

export interface Address { line1?: string; line2?: string; zip?: string; city?: string; country?: string }
export interface Party {
  name: string; siren: string | null; siret: string | null; vat: string | null; address: Address;
  email: string | null; phone: string | null; legal_lines: string[];
}
export interface Seller extends Party { regime: VatRegime; trade_name?: string | null; logo_key?: string | null }

export function parseAddress(a: unknown): Address {
  if (!a) return {};
  if (typeof a === "object") return a as Address;
  const j = json<Address | null>(a, null);
  if (j && typeof j === "object") return j;
  return { line1: String(a) };
}

const LEGAL_FORMS: Record<string, string> = {
  association: "Association loi 1901", ei: "Entreprise individuelle", eurl: "EURL", sarl: "SARL", sas: "SAS", sasu: "SASU",
  earl: "EARL", gaec: "GAEC", scea: "SCEA",
};

/** Le club vendeur, d'après la table clubs (socle) et les réglages. */
export async function clubSeller(db: D1Database, clubId: string, s?: InvoicingSettings): Promise<Seller | null> {
  const c = await one<any>(db, "SELECT name, legal_form, siren, siret, vat_number, vat_regime, address, email, phone, logo_key, settings FROM clubs WHERE id = ?", clubId);
  if (!c) return null;
  const st = s || await getSettings(db, clubId);
  const regime = (["normal", "franchise", "association_exoneree"].includes(c.vat_regime) ? c.vat_regime : "normal") as VatRegime;
  const legal: string[] = [];
  const lf = LEGAL_FORMS[c.legal_form] || null;
  legal.push([lf, st.legal.capital ? "au capital de " + st.legal.capital : null].filter(Boolean).join(" "));
  if (c.siret || c.siren) legal.push("SIRET " + (c.siret || c.siren));
  if (st.legal.rcs) legal.push("RCS " + st.legal.rcs);
  if (st.legal.ape) legal.push("APE " + st.legal.ape);
  const siren = (c.siren || (c.siret ? String(c.siret).slice(0, 9) : null)) || null;
  const vatNo = regime === "normal" ? c.vat_number || (siren ? frVatNumber(siren) : null) : null;
  if (vatNo) legal.push("TVA intracommunautaire " + vatNo);
  if (st.legal.extra) legal.push(st.legal.extra);
  return {
    name: c.name, siren, siret: c.siret || null, vat: vatNo, address: parseAddress(c.address),
    email: c.email || null, phone: c.phone || null, legal_lines: legal.filter(Boolean), regime, logo_key: c.logo_key || null,
  };
}

/** Piaffe (Marceau Ruis EI), émetteur des factures d'abonnement (variables PLATFORM_*). */
export function platformSeller(env: Env): Seller {
  const regime: VatRegime = env.PLATFORM_VAT_REGIME === "normal" ? "normal" : "franchise";
  const addr = String(env.PLATFORM_ADDRESS || "");
  const m = /^(.*?),\s*(\d{5})\s+([^,]+)(?:,\s*(.*))?$/.exec(addr);
  const address: Address = m ? { line1: m[1], zip: m[2], city: m[3], country: /france/i.test(m[4] || "France") ? "FR" : (m[4] || "FR") } : { line1: addr, country: "FR" };
  const siren = String(env.PLATFORM_SIREN || "").replace(/\s/g, "") || null;
  const vat = regime === "normal" && siren ? frVatNumber(siren) : null;
  const legal = [env.PLATFORM_LEGAL_NOTE || "Entreprise individuelle", env.PLATFORM_SIRET ? "SIRET " + env.PLATFORM_SIRET : siren ? "SIREN " + siren : ""];
  if (vat) legal.push("TVA intracommunautaire " + vat);
  return {
    name: env.PLATFORM_LEGAL_NAME || "Marceau Ruis EI", trade_name: env.PLATFORM_TRADE_NAME || null, siren, siret: env.PLATFORM_SIRET || null, vat,
    address, email: null, phone: null, legal_lines: legal.filter(Boolean), regime,
  };
}

/** Numéro de TVA intracommunautaire français calculé depuis le SIREN (clé = (12 + 3 × (SIREN mod 97)) mod 97). */
export function frVatNumber(siren: string): string {
  const n = Number(siren); const k = (12 + 3 * (n % 97)) % 97;
  return "FR" + String(k).padStart(2, "0") + siren;
}
/** Contrôle de Luhn d'un SIREN. */
export function validSiren(s: string): boolean {
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) { let d = Number(s[8 - i]); if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; } sum += d; }
  return sum % 10 === 0;
}
