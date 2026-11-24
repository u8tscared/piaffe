/* Formats français pour les e-mails (sans dépendre d'Intl, pour un rendu identique partout). */

const DOW = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MON = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Décalage de Paris (minutes) à un instant UTC : +60 en hiver, +120 en été (dernier dimanche de mars / octobre, 1 h UTC). */
export function parisOffsetMin(utc: Date): number {
  const y = utc.getUTCFullYear();
  const lastSunday = (m: number) => { const d = new Date(Date.UTC(y, m + 1, 0, 1)); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.getTime(); };
  const t = utc.getTime();
  return t >= lastSunday(2) && t < lastSunday(9) ? 120 : 60;
}

/** Date et heure locales de Paris pour un instant UTC. */
export function toParis(utc: Date): { y: number; m: number; d: number; hh: number; mm: number; dow: number } {
  const l = new Date(utc.getTime() + parisOffsetMin(utc) * 60000);
  return { y: l.getUTCFullYear(), m: l.getUTCMonth() + 1, d: l.getUTCDate(), hh: l.getUTCHours(), mm: l.getUTCMinutes(), dow: l.getUTCDay() };
}

/** Interprète "2026-11-18", "18/11/2026" ou un ISO complet. Renvoie {y,m,d,time?} en heure de Paris. */
export function parseDay(v: unknown): { y: number; m: number; d: number; time?: string } | null {
  const s = String(v ?? "").trim();
  let r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (r) return { y: +r[1], m: +r[2], d: +r[3] };
  r = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (r) return { y: +r[3], m: +r[2], d: +r[1] };
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    if (isNaN(dt.getTime())) return null;
    const p = toParis(dt);
    return { y: p.y, m: p.m, d: p.d, time: `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}` };
  }
  return null;
}

/** « mercredi 18 novembre 2026 » (ou la valeur telle quelle si elle n'est pas une date). */
export function dateLong(v: unknown, withYear = true): string {
  const p = parseDay(v);
  if (!p) return String(v ?? "");
  const dow = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return `${DOW[dow]} ${p.d === 1 ? "1er" : p.d} ${MON[p.m - 1]}${withYear ? " " + p.y : ""}`;
}
/** « 18/11/2026 ». */
export function dateShort(v: unknown): string {
  const p = parseDay(v);
  return p ? `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}` : String(v ?? "");
}
/** « 17 h », « 17 h 30 ». */
export function hour(v: unknown): string {
  const r = /^(\d{1,2}):(\d{2})/.exec(String(v ?? ""));
  if (!r) return String(v ?? "");
  return `${+r[1]} h${r[2] === "00" ? "" : " " + r[2]}`;
}
export function duration(min: unknown): string {
  const n = Number(min);
  if (!n) return "";
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60), m = n % 60;
  return `${h} h${m ? " " + String(m).padStart(2, "0") : ""}`;
}

/** Montant : depuis amount_cents (entier) ou amount (euros). « 1 234,56 € », « 520 € ». */
export function money(d: Record<string, unknown>, key = "amount"): string {
  const c = d[key + "_cents"] != null ? Number(d[key + "_cents"]) : d[key] != null ? Math.round(Number(d[key]) * 100) : NaN;
  return euros(c);
}
export function euros(cents: number): string {
  if (!isFinite(cents)) return "";
  const neg = cents < 0, a = Math.abs(Math.round(cents));
  const ent = Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const dec = a % 100;
  return `${neg ? "-" : ""}${ent}${dec ? "," + String(dec).padStart(2, "0") : ""} €`;
}

export function plural(n: number, one: string, many = one + "s"): string { return `${n} ${n > 1 ? many : one}`; }
