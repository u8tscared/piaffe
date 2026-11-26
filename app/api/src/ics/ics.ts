/*
 * Génération iCalendar (RFC 5545) : CRLF, pliage à 75 octets sans couper un caractère UTF-8,
 * échappement des textes, UID stables, DTSTAMP, VTIMEZONE Europe/Paris, RRULE hebdomadaire et EXDATE, VALARM.
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  /** Date locale (Europe/Paris) AAAA-MM-JJ. */
  date: string;
  /** Heure locale HH:MM ; absente = journée entière. */
  time?: string | null;
  durationMin?: number;
  /** Jours pour un événement « journée entière » (1 par défaut). */
  days?: number;
  rrule?: string;
  /** Dates locales AAAA-MM-JJ des occurrences annulées (même heure que DTSTART). */
  exdates?: string[];
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  sequence?: number;
  /** Dernière modification (ISO UTC) : sert de DTSTAMP et LAST-MODIFIED. */
  updatedAt?: string;
  categories?: string[];
  url?: string;
}

export const PRODID = "-//Stabl//Calendrier Stabl 1.0//FR";

export const VTIMEZONE_PARIS = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Paris", "X-LIC-LOCATION:Europe/Paris",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
];

/** Échappement des valeurs TEXT (RFC 5545 § 3.3.11). */
export function escText(s: unknown): string {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

const enc = new TextEncoder();
/** Pliage : lignes de 75 octets au plus, suite précédée d'une espace, jamais au milieu d'un caractère UTF-8. */
export function fold(line: string): string {
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) { out.push(cur); cur = ""; bytes = 0; limit = 74; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const compact = (d: string) => d.replace(/-/g, "");
const hhmmss = (t: string) => t.replace(":", "").padEnd(4, "0") + "00";
export function utcStamp(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
/** Ajoute des minutes à une date et heure locales (arithmétique « murale »). */
export function addLocal(date: string, time: string, min: number): { date: string; time: string } {
  const [y, m, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, h, mi) + min * 60000);
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`, time: `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}` };
}
function addDays(date: string, n: number): string { return addLocal(date, "00:00", n * 1440).date; }

export function eventLines(e: IcsEvent, alarmMin?: number | null): string[] {
  const L: string[] = ["BEGIN:VEVENT", "UID:" + e.uid, "DTSTAMP:" + utcStamp(e.updatedAt)];
  if (e.updatedAt) L.push("LAST-MODIFIED:" + utcStamp(e.updatedAt));
  if (e.time) {
    const end = addLocal(e.date, e.time, e.durationMin || 60);
    L.push(`DTSTART;TZID=Europe/Paris:${compact(e.date)}T${hhmmss(e.time)}`, `DTEND;TZID=Europe/Paris:${compact(end.date)}T${hhmmss(end.time)}`);
  } else {
    L.push(`DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(addDays(e.date, e.days || 1))}`);
  }
  if (e.rrule) L.push("RRULE:" + e.rrule);
  if (e.exdates?.length) {
    const ex = [...new Set(e.exdates)].sort().map((d) => (e.time ? `${compact(d)}T${hhmmss(e.time)}` : compact(d)));
    L.push(e.time ? `EXDATE;TZID=Europe/Paris:${ex.join(",")}` : `EXDATE;VALUE=DATE:${ex.join(",")}`);
  }
  L.push("SUMMARY:" + escText(e.summary));
  if (e.description) L.push("DESCRIPTION:" + escText(e.description));
  if (e.location) L.push("LOCATION:" + escText(e.location));
  if (e.categories?.length) L.push("CATEGORIES:" + e.categories.map(escText).join(","));
  if (e.url) L.push("URL:" + e.url);
  L.push("STATUS:" + (e.status || "CONFIRMED"), "SEQUENCE:" + (e.sequence || 0), "TRANSP:OPAQUE");
  if (alarmMin && alarmMin > 0 && e.status !== "CANCELLED") {
    L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + escText(e.summary), `TRIGGER:-PT${Math.round(alarmMin)}M`, "END:VALARM");
  }
  L.push("END:VEVENT");
  return L;
}

export function calendar(name: string, events: IcsEvent[], opts: { alarmMin?: number | null; description?: string; method?: "PUBLISH" } = {}): string {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:" + PRODID, "CALSCALE:GREGORIAN", "METHOD:" + (opts.method || "PUBLISH"),
    "X-WR-CALNAME:" + escText(name), "X-WR-TIMEZONE:Europe/Paris", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  if (opts.description) L.push("X-WR-CALDESC:" + escText(opts.description));
  L.push(...VTIMEZONE_PARIS);
  for (const e of events) L.push(...eventLines(e, opts.alarmMin));
  L.push("END:VCALENDAR");
  return L.map(fold).join("\r\n") + "\r\n";
}

const RR_DAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export function weeklyRule(dow: number, until?: string | null, untilTime?: string): string {
  let r = "FREQ=WEEKLY;BYDAY=" + RR_DAY[dow];
  if (until) {
    // UNTIL en UTC (obligatoire quand DTSTART porte un TZID) : fin de journée locale, large.
    r += ";UNTIL=" + compact(until) + "T" + (untilTime ? hhmmss(untilTime) : "235959") + "Z";
  }
  return r;
}
/** Première date ≥ `from` tombant le jour `dow` (0 = dimanche). */
export function firstOnOrAfter(from: string, dow: number): string {
  const [y, m, d] = from.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + ((dow - t.getUTCDay() + 7) % 7));
  return t.toISOString().slice(0, 10);
}
