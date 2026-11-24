/*
 * Construction des événements d'un flux à partir de la table records (format des données de la démo) :
 *  - lessons : reprises hebdomadaires (dow 0 = dimanche, start "HH:MM", dur en minutes) → RRULE + EXDATE
 *    (dates annulées dans data.cancelled ou data.exdates ; data.from / data.until bornent la série) ;
 *  - coachBookings : cours particuliers (date, t, dur) ; trackBookings : réservations de piste (date, from, to) ;
 *  - care : soins (date, time) ; competitions : concours (journée entière) et entries : engagés.
 */
import type { Env } from "../env";
import { all, json } from "../lib/db";
import { firstOnOrAfter, weeklyRule, addLocal, type IcsEvent } from "./ics";

export type Scope = "member" | "coach" | "club" | "horse";
type Rec = Record<string, any> & { id: string; _created: string; _updated: string; _version: number };

const COLLS = ["lessons", "coachBookings", "trackBookings", "care", "competitions", "entries", "horses", "members", "staff", "coaches", "halfboard"];

export interface ClubData {
  clubId: string; clubName: string;
  arenas: Map<string, string>;
  by: Record<string, Rec[]>;
  find(coll: string, id: unknown): Rec | undefined;
}

export async function loadClubData(env: Env, clubId: string): Promise<ClubData> {
  const club = await all<{ name: string; settings: string }>(env.DB, "SELECT name, settings FROM clubs WHERE id = ?", clubId);
  const rows = await all<{ coll: string; id: string; data: string; version: number; created_at: string; updated_at: string }>(env.DB,
    `SELECT coll, id, data, version, created_at, updated_at FROM records WHERE club_id = ? AND deleted = 0 AND coll IN (${COLLS.map(() => "?").join(",")}, 'club')`, clubId, ...COLLS);
  const by: Record<string, Rec[]> = {};
  for (const r of rows) (by[r.coll] ||= []).push({ ...json<Record<string, any>>(r.data, {}), id: r.id, _created: r.created_at, _updated: r.updated_at, _version: r.version });
  const arenas = new Map<string, string>();
  for (const a of json<any>(club[0]?.settings, {}).arenas || []) if (a?.id) arenas.set(a.id, a.name);
  for (const a of by.club?.[0]?.arenas || []) if (a?.id) arenas.set(a.id, a.name);
  const idx = new Map<string, Rec>();
  for (const [c, list] of Object.entries(by)) for (const x of list) idx.set(c + "/" + x.id, x);
  return { clubId, clubName: club[0]?.name || "Club", arenas, by, find: (c, id) => idx.get(c + "/" + String(id)) };
}

const name = (p?: Rec) => (p ? [p.first, p.last].filter(Boolean).join(" ") : "");
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: unknown): s is string => typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s);
const pad5 = (t: string) => t.padStart(5, "0");
function minutesBetween(a: string, b: string) { const [h1, m1] = a.split(":").map(Number), [h2, m2] = b.split(":").map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); }

export interface Who { members: Set<string>; coachIds: Set<string>; staffIds: Set<string>; horses: Set<string>; firstOf: Map<string, string> }

/** Personnes et chevaux couverts par un flux. */
export function audience(d: ClubData, scope: Scope, target: string | null): Who {
  const w: Who = { members: new Set(), coachIds: new Set(), staffIds: new Set(), horses: new Set(), firstOf: new Map() };
  if (scope === "member" && target) {
    const me = d.find("members", target);
    w.members.add(target);
    // La famille : même foyer, ou responsables / enfants déclarés.
    for (const m of d.by.members || []) {
      if ((me?.fam && m.fam === me.fam) || (Array.isArray(m.guardians) && m.guardians.includes(target)) || (Array.isArray(me?.guardians) && me.guardians.includes(m.id))) w.members.add(m.id);
    }
    if (w.members.size > 1) for (const id of w.members) w.firstOf.set(id, d.find("members", id)?.first || "");
    for (const h of d.by.horses || []) if (w.members.has(h.owner)) w.horses.add(h.id);
    for (const hb of d.by.halfboard || []) if (w.members.has(hb.rider) && !/fin|termin/i.test(hb.status || "")) w.horses.add(hb.horse);
  }
  if (scope === "coach" && target) {
    const c = d.find("coaches", target), s = d.find("staff", target);
    if (c) { w.coachIds.add(c.id); if (c.staff) w.staffIds.add(c.staff); }
    if (s) { w.staffIds.add(s.id); for (const x of d.by.coaches || []) if (x.staff === s.id) w.coachIds.add(x.id); }
  }
  if (scope === "horse" && target) w.horses.add(target);
  return w;
}

export function buildEvents(d: ClubData, scope: Scope, target: string | null, today = new Date()): IcsEvent[] {
  const w = audience(d, scope, target);
  const all = scope === "club";
  const ev: IcsEvent[] = [];
  const uid = (c: string, id: string, extra = "") => `${c}-${id}${extra}@${d.clubId}.piaffe.app`;
  const arena = (id: unknown) => d.arenas.get(String(id)) || "";
  const loc = (id: unknown) => [arena(id), d.clubName].filter(Boolean).join(", ");
  const t0 = new Date(today.getTime() - 120 * 864e5).toISOString().slice(0, 10), t1 = new Date(today.getTime() + 400 * 864e5).toISOString().slice(0, 10);
  const inWindow = (s: string) => s >= t0 && s <= t1;
  const prefix = (ids: string[]) => { const f = ids.map((i) => w.firstOf.get(i)).filter(Boolean); return f.length ? f.join(", ") + " : " : ""; };

  // Reprises hebdomadaires.
  for (const l of d.by.lessons || []) {
    if (!isTime(l.start) || l.dow == null || !(Number(l.dow) >= 0 && Number(l.dow) <= 6)) continue;
    const riders: string[] = (l.riders || []).filter((r: string) => w.members.has(r));
    const mine = all || riders.length > 0 || w.staffIds.has(l.coach) || w.coachIds.has(l.coach);
    if (!mine || scope === "horse") continue;
    const dow = Number(l.dow);
    const from = isDate(l.from) ? l.from : isDate(l.since) ? l.since : String(l._created).slice(0, 10);
    const start = firstOnOrAfter(from, dow);
    const coach = name(d.find("staff", l.coach) || d.find("coaches", l.coach));
    const horseNames = riders.map((r) => d.find("horses", l.horses?.[r])?.name).filter(Boolean);
    const desc = [
      coach && "Avec " + coach,
      scope === "member" && horseNames.length ? "Cheval : " + horseNames.join(", ") : "",
      scope !== "member" ? `${(l.riders || []).length} cavalier${(l.riders || []).length > 1 ? "s" : ""} sur ${l.cap || "?"} places` : "",
      l.level ? "Niveau : " + l.level : "",
    ].filter(Boolean).join("\n");
    const cancelledAll = /annul/i.test(l.status || "");
    ev.push({
      uid: uid("lesson", l.id), summary: (scope === "member" ? prefix(riders) : "") + (l.title || "Reprise"), description: desc, location: loc(l.arena),
      date: start, time: pad5(l.start), durationMin: Number(l.dur) || 60,
      rrule: weeklyRule(dow, isDate(l.until) ? l.until : null),
      exdates: [...(Array.isArray(l.cancelled) ? l.cancelled : []), ...(Array.isArray(l.exdates) ? l.exdates : [])].filter(isDate),
      status: cancelledAll ? "CANCELLED" : "CONFIRMED", sequence: l._version, updatedAt: l._updated, categories: ["Reprise"],
    });
  }
  // Cours particuliers.
  for (const b of d.by.coachBookings || []) {
    const date = isDate(b.date) ? b.date : typeof b.d === "number" ? addLocal(String(b._created).slice(0, 10), "00:00", b.d * 1440).date : null;
    const time = isTime(b.t) ? b.t : isTime(b.time) ? b.time : null;
    if (!date || !time || !inWindow(date)) continue;
    const riders: string[] = (b.riders || []).filter((r: string) => w.members.has(r));
    const mine = all || riders.length || w.coachIds.has(b.coach) || w.staffIds.has(b.coach) || w.horses.has(b.horse);
    if (!mine) continue;
    const coach = name(d.find("coaches", b.coach) || d.find("staff", b.coach));
    const who = (b.riders || []).map((r: string) => name(d.find("members", r))).filter(Boolean).join(", ");
    ev.push({
      uid: uid("booking", b.id), summary: (scope === "member" ? prefix(riders) : "") + (b.type || "Cours particulier") + (scope === "coach" && who ? " · " + who : ""),
      description: [coach && "Avec " + coach, d.find("horses", b.horse)?.name ? "Cheval : " + d.find("horses", b.horse)!.name : "", scope !== "member" && who ? "Cavaliers : " + who : ""].filter(Boolean).join("\n"),
      location: loc(b.arena), date, time: pad5(time), durationMin: Number(b.dur) || 60,
      status: /annul/i.test(b.status || "") ? "CANCELLED" : /confirm/i.test(b.status || "") && !/à confirmer/i.test(b.status || "") ? "CONFIRMED" : "TENTATIVE",
      sequence: b._version, updatedAt: b._updated, categories: ["Cours particulier"],
    });
  }
  // Réservations de piste.
  for (const t of d.by.trackBookings || []) {
    if (!isDate(t.date) || !isTime(t.from) || !inWindow(t.date)) continue;
    if (!(all || w.members.has(t.who) || w.horses.has(t.horse))) continue;
    if (scope === "coach") continue;
    const h = d.find("horses", t.horse)?.name;
    ev.push({
      uid: uid("track", t.id), summary: `${arena(t.arena) || "Piste"} réservée${h ? " · " + h : ""}${scope === "club" ? " · " + name(d.find("members", t.who)) : ""}`,
      location: loc(t.arena), date: t.date, time: pad5(t.from), durationMin: isTime(t.to) ? Math.max(15, minutesBetween(t.from, t.to)) : 60,
      sequence: t._version, updatedAt: t._updated, categories: ["Installation"],
    });
  }
  // Soins (vétérinaire, maréchal, vaccins, vermifuge…).
  if (scope !== "coach") for (const c of d.by.care || []) {
    if (!(all || w.horses.has(c.horse))) continue;
    const date = isDate(c.date) ? c.date : null;
    if (!date || !inWindow(date)) continue;
    const h = d.find("horses", c.horse);
    ev.push({
      uid: uid("care", c.id), summary: `${c.kind || "Soin"} · ${h?.name || "Cheval"}`,
      description: [c.who && "Intervenant : " + c.who, c.note, h?.box ? "Box " + h.box : ""].filter(Boolean).join("\n"),
      location: d.clubName, date, time: isTime(c.time) ? pad5(c.time) : null, durationMin: 60,
      status: /annul/i.test(c.status || "") ? "CANCELLED" : "CONFIRMED", sequence: c._version, updatedAt: c._updated, categories: ["Soins", String(c.kind || "Soin")],
    });
    // Prochaine échéance (rappel de vaccin, vermifuge…), en journée entière.
    if (isDate(c.next) && inWindow(c.next) && c.next > date) ev.push({
      uid: uid("care", c.id, "-next"), summary: `À prévoir : ${String(c.kind || "soin").toLowerCase()} · ${h?.name || "Cheval"}`, date: c.next,
      sequence: c._version, updatedAt: c._updated, categories: ["Soins"],
    });
  }
  // Concours.
  for (const k of d.by.competitions || []) {
    if (!isDate(k.date) || !inWindow(k.date)) continue;
    const entries = (d.by.entries || []).filter((e) => e.comp === k.id);
    const mine = entries.filter((e) => w.members.has(e.rider) || w.horses.has(e.horse) || w.coachIds.has(e.coach) || w.staffIds.has(e.coach));
    if (!all && !mine.length) continue;
    const lines = (all ? entries : mine).map((e) => [name(d.find("members", e.rider)), d.find("horses", e.horse)?.name, e.class].filter(Boolean).join(" · "));
    ev.push({
      uid: uid("competition", k.id), summary: `${k.disc ? k.disc + " · " : ""}${k.name || "Concours"}`,
      description: [k.level, lines.length ? (all ? `${lines.length} engagé${lines.length > 1 ? "s" : ""} :\n` : "") + lines.join("\n") : "", isDate(k.closes) ? "Clôture des engagements : " + k.closes.split("-").reverse().join("/") : ""].filter(Boolean).join("\n"),
      location: k.place || "", date: k.date, days: Number(k.days) > 1 ? Number(k.days) : 1,
      status: /annul/i.test(k.status || "") ? "CANCELLED" : "CONFIRMED", sequence: k._version, updatedAt: k._updated, categories: ["Concours"],
    });
  }
  return ev;
}

export const SCOPE_LABEL: Record<Scope, string> = { member: "Mes cours et mes chevaux", coach: "Mon agenda de coach", club: "Planning du club", horse: "Agenda du cheval" };
