/* Normalisation des valeurs importées (formats français courants des exports d'autres logiciels). */

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
/** Clé de comparaison : minuscules, sans accents ni ponctuation, espaces simples. */
export function key(s: unknown): string {
  return stripAccents(String(s ?? "")).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Téléphone français au format de l'appli « 06 12 34 56 78 » ; international conservé « +44 20… ». null si vide. */
export function normPhone(v: unknown): { value: string | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  const raw = String(v).trim();
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("+33")) d = "0" + d.slice(3).replace(/^0/, "");
  else if (/^33\d{9}$/.test(d)) d = "0" + d.slice(2);
  else if (/^[1-9]\d{8}$/.test(d)) d = "0" + d; // zéro perdu par un tableur
  if (/^0\d{9}$/.test(d)) return { value: d.replace(/(\d{2})(?=\d)/g, "$1 ").trim(), ok: true };
  if (/^\+\d{7,15}$/.test(d)) return { value: d, ok: true };
  return { value: raw, ok: false };
}

export function normEmail(v: unknown): { value: string | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  const s = String(v).trim().toLowerCase().replace(/^mailto:/, "").replace(/\s+/g, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? { value: s, ok: true } : { value: null, ok: false };
}

const valid = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y > 1900 && y < 2200 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA, JJ/MM/AA, AAAA-MM-JJ (avec ou sans heure), numéro de série Excel → AAAA-MM-JJ. */
export function normDate(v: unknown): { value: string | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
    return { value: dt.toISOString().slice(0, 10), ok: true };
  }
  const s = String(v).trim();
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s);
  if (r && valid(+r[1], +r[2], +r[3])) return { value: iso(+r[1], +r[2], +r[3]), ok: true };
  r = /^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{2}|\d{4})(?:\s.*)?$/.exec(s);
  if (r) {
    let y = +r[3];
    if (r[3].length === 2) y += y > (new Date().getUTCFullYear() % 100) + 1 ? 1900 : 2000;
    if (valid(y, +r[2], +r[1])) return { value: iso(y, +r[2], +r[1]), ok: true };
  }
  if (/^\d{5}(\.\d+)?$/.test(s)) return normDate(Number(s));
  return { value: null, ok: false };
}

/** « 1 234,56 € », « 1.234,56 », « -195 », « (195,00) », 780 → nombre en euros. */
export function normAmount(v: unknown): { value: number | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  if (typeof v === "number") return isFinite(v) ? { value: Math.round(v * 100) / 100, ok: true } : { value: null, ok: false };
  let s = String(v).trim().replace(/[€\s  ]|EUR|euros?/gi, "");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.endsWith("-")) { neg = true; s = s.slice(0, -1); }
  if (s.startsWith("-")) { neg = !neg; s = s.slice(1); } else if (s.startsWith("+")) s = s.slice(1);
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");       // 1.234,56
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");                      // 1,234.56
  else s = s.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return { value: null, ok: false };
  const n = Math.round(parseFloat(s) * 100) / 100;
  return { value: neg ? -n : n, ok: true };
}

/** SIRE (8 chiffres + lettre de contrôle) ou UELN (15 caractères). */
export function normSire(v: unknown): { value: string | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  const s = String(v).toUpperCase().replace(/[\s.\-/]/g, "");
  return { value: s, ok: /^\d{8}[A-Z]$/.test(s) || /^[0-9A-Z]{15}$/.test(s) };
}
/** Puce électronique (transpondeur ISO 11784) : 15 chiffres. */
export function normChip(v: unknown): { value: string | null; ok: boolean } {
  if (v == null || v === "") return { value: null, ok: true };
  const s = String(v).replace(/[\s.\-]/g, "");
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) return { value: s, ok: false }; // abîmée par un tableur (2,50259E+14)
  return { value: s, ok: /^\d{15}$/.test(s) };
}

export function normBool(v: unknown): boolean | null {
  if (v == null || v === "") return null;
  if (typeof v === "boolean") return v;
  const k = key(v);
  if (["oui", "o", "yes", "y", "x", "1", "vrai", "true", "fourni", "ok"].includes(k)) return true;
  if (["non", "n", "no", "0", "faux", "false"].includes(k)) return false;
  return null;
}

/** « Galop 4 », « G4 », « 4 », « Galop de bronze » → nombre (0 à 7). */
export function normGalop(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v >= 0 && v <= 9 ? Math.round(v) : null;
  const k = key(v);
  const m = /(\d)/.exec(k);
  if (m) return Math.min(9, +m[1]);
  if (/bronze/.test(k)) return 1; if (/argent/.test(k)) return 2; if (/\bor\b/.test(k)) return 3;
  return null;
}

/** « 14:00 », « 14h », « 14 h 30 », « 14:00:00 » → « HH:MM ». */
export function normTime(v: unknown): string | null {
  const r = /^(\d{1,2})\s*[:hH]\s*(\d{2})?/.exec(String(v ?? "").trim());
  if (!r) return null;
  const h = +r[1], m = +(r[2] || 0);
  return h < 24 && m < 60 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` : null;
}

const DOW: Record<string, number> = { dim: 0, dimanche: 0, lun: 1, lundi: 1, mar: 2, mardi: 2, mer: 3, mercredi: 3, jeu: 4, jeudi: 4, ven: 5, vendredi: 5, sam: 6, samedi: 6 };
export const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export function normDow(v: unknown): number | null {
  if (typeof v === "number") return v >= 0 && v <= 6 ? v : v === 7 ? 0 : null;
  const k = key(v);
  if (/^\d$/.test(k)) return +k % 7;
  return k in DOW ? DOW[k] : null;
}

export function ageFrom(birth: string, today = new Date()): number {
  const t = today.toISOString().slice(0, 10);
  return +t.slice(0, 4) - +birth.slice(0, 4) - (t.slice(5) < birth.slice(5) ? 1 : 0);
}

export function normSex(v: unknown): string | null {
  const k = key(v);
  if (!k) return null;
  if (["f", "femme", "feminin", "fille"].includes(k)) return "F";
  if (["m", "h", "homme", "masculin", "garcon"].includes(k)) return "M";
  return String(v);
}
const HORSE_SEX: Record<string, string> = { hongre: "Hongre", h: "Hongre", jument: "Jument", f: "Jument", j: "Jument", etalon: "Étalon", e: "Étalon", m: "Étalon", male: "Étalon", femelle: "Jument" };
export function normHorseSex(v: unknown): string | null {
  const k = key(v);
  return k ? HORSE_SEX[k] || String(v) : null;
}
