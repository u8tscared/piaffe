/*
 * Rappels automatiques (cron quotidien de 6 h UTC, soit 7 h ou 8 h à Paris) :
 *  - lesson_reminder : la veille de chaque reprise et cours particulier, à chaque cavalier qui a une adresse.
 *    Désactivé par défaut (volume élevé) : réglage du club settings.mail.lesson_reminder = true.
 *  - horse_care_reminder : 2 jours avant un vaccin, un maréchal, un vermifuge, le dentiste ou l'ostéopathe,
 *    au propriétaire du cheval. Activé par défaut : settings.mail.care_reminder = false pour couper.
 * Chaque e-mail a une clé de déduplication : relancer le cron ne renvoie rien en double.
 */
import type { Env } from "../env";
import { all, json } from "../lib/db";
import { toParis } from "./fmt";
import { enqueue } from "./outbox";

type Rec = Record<string, any>;
const pad = (n: number) => String(n).padStart(2, "0");
export function parisDay(offsetDays = 0, now = new Date()): { iso: string; dow: number } {
  const p = toParis(now);
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + offsetDays));
  return { iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, dow: d.getUTCDay() };
}

async function coll(env: Env, clubId: string, c: string): Promise<Rec[]> {
  const rows = await all<{ id: string; data: string }>(env.DB, "SELECT id, data FROM records WHERE club_id = ? AND coll = ? AND deleted = 0", clubId, c);
  return rows.map((r) => ({ ...json<Rec>(r.data, {}), id: r.id }));
}
const byId = (list: Rec[]) => new Map(list.map((x) => [x.id, x]));
const fullName = (p?: Rec) => (p ? [p.first, p.last].filter(Boolean).join(" ") : "");

const CARE_KINDS = ["Vaccin", "Maréchal", "Vermifuge", "Dentiste", "Ostéopathe"];

export async function runDailyReminders(env: Env, now = new Date()): Promise<{ lessons: number; care: number }> {
  const clubs = await all<{ id: string; settings: string; plan_status: string }>(env.DB,
    "SELECT id, settings, plan_status FROM clubs WHERE plan_status IN ('trialing','active','past_due')");
  let nL = 0, nC = 0;
  const tomorrow = parisDay(1, now), inTwo = parisDay(2, now);
  for (const club of clubs) {
    const s = json<Rec>(club.settings, {}).mail || {};
    const wantLessons = s.lesson_reminder === true, wantCare = s.care_reminder !== false;
    if (!wantLessons && !wantCare) continue;
    const members = byId(await coll(env, club.id, "members"));
    const horses = byId(await coll(env, club.id, "horses"));
    if (wantLessons) {
      const staff = byId(await coll(env, club.id, "staff")), coaches = byId(await coll(env, club.id, "coaches"));
      const clubRec = (await coll(env, club.id, "club"))[0];
      const arenas = byId([...(json<Rec>(club.settings, {}).arenas || []), ...(clubRec?.arenas || [])]);
      for (const l of await coll(env, club.id, "lessons")) {
        if (Number(l.dow) !== tomorrow.dow || /annul/i.test(l.status || "")) continue;
        if ((l.cancelled || l.exdates || []).includes(tomorrow.iso)) continue;
        if (l.until && l.until < tomorrow.iso) continue;
        for (const rid of l.riders || []) {
          const m = members.get(rid);
          if (!m?.email) continue;
          await enqueue(env, { to: m.email, template: "lesson_reminder", club_id: club.id, data: {
            first: m.first, title: l.title, date: tomorrow.iso, time: l.start, dur: l.dur,
            coach: fullName(staff.get(l.coach) || coaches.get(l.coach)), arena: arenas.get(l.arena)?.name || "",
            horse: horses.get(l.horses?.[rid])?.name || "", cancel_url: (env.APP_URL || "") + "/reservations",
          } }, { dedupe_key: `lesson_reminder:${club.id}:${l.id}:${tomorrow.iso}:${rid}` });
          nL++;
        }
      }
      for (const b of await coll(env, club.id, "coachBookings")) {
        if (b.date !== tomorrow.iso || /annul/i.test(b.status || "")) continue;
        for (const rid of b.riders || []) {
          const m = members.get(rid);
          if (!m?.email) continue;
          await enqueue(env, { to: m.email, template: "lesson_reminder", club_id: club.id, data: {
            first: m.first, title: b.type || "Cours particulier", date: b.date, time: b.t, dur: b.dur,
            coach: fullName(coaches.get(b.coach)), arena: arenas.get(b.arena)?.name || "", horse: horses.get(b.horse)?.name || "",
          } }, { dedupe_key: `lesson_reminder:${club.id}:${b.id}:${b.date}:${rid}` });
          nL++;
        }
      }
    }
    if (wantCare) {
      for (const c of await coll(env, club.id, "care")) {
        if (c.date !== inTwo.iso || !CARE_KINDS.includes(c.kind) || /fait/i.test(c.status || "")) continue;
        const h = horses.get(c.horse);
        const owner = h?.owner ? members.get(h.owner) : null;
        if (!h || !owner?.email) continue;
        await enqueue(env, { to: owner.email, template: "horse_care_reminder", club_id: club.id, data: {
          first: owner.first, horse_name: h.name, kind: c.kind, date: c.date, time: /^\d{1,2}:\d{2}$/.test(c.time || "") ? c.time : "", who: c.who, note: c.note,
        } }, { dedupe_key: `horse_care_reminder:${club.id}:${c.id}:${c.date}` });
        nC++;
      }
    }
  }
  return { lessons: nL, care: nC };
}
