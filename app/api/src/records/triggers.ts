import type { Env } from "../env";
import { on, type PiaffeEvent } from "../lib/events";
import { json, one, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { isEmail } from "../lib/http";
import { createInvitation, type InvitationRow } from "../auth/invitations";
import { appUrl, mail, WEB } from "../auth/mailer";
import { mergeRefs, normEmail } from "../auth/users";

/**
 * Déclencheurs sur les données du club (record.saved / record.deleted) :
 *  - nouvel adhérent avec e-mail → invitation à l'espace adhérent et e-mail de bienvenue (welcome_member),
 *    si l'option du club settings.welcome_member_email n'est pas désactivée. Ignoré pour les imports (via: "import").
 *    Un parent qui a déjà un compte dans le club est simplement relié à la nouvelle fiche ; un parent déjà invité
 *    voit la fiche ajoutée à son invitation en attente (pas de second e-mail).
 *  - cavalier ajouté à une reprise → booking_confirmed ;
 *  - place libérée dans une reprise qui a une liste d'attente → waitlist_spot au premier de la liste.
 */
type Row = Record<string, any>;
const DAYS: Record<string, string> = { Lun: "lundi", Mar: "mardi", Mer: "mercredi", Jeu: "jeudi", Ven: "vendredi", Sam: "samedi", Dim: "dimanche" };

async function rec(env: Env, clubId: string, coll: string, id: string): Promise<Row | null> {
  const r = await one<{ data: string }>(env.DB, "SELECT data FROM records WHERE club_id = ? AND coll = ? AND id = ? AND deleted = 0", clubId, coll, id);
  return r ? json<Row | null>(r.data, null) : null;
}
async function clubOf(env: Env, id: string) {
  return one<{ name: string; settings: string }>(env.DB, "SELECT name, settings FROM clubs WHERE id = ?", id);
}

export async function onMemberCreated(env: Env, e: PiaffeEvent) {
  if (e.coll !== "members" || e.previous || e.via === "import" || e.silent) return;
  const m = e.data as Row;
  const email = typeof m?.email === "string" ? normEmail(m.email) : "";
  if (!email || !isEmail(email)) return;
  const club = await clubOf(env, e.club_id as string);
  if (!club) return;
  const settings = json<Row>(club.settings, {});
  if (settings.welcome_member_email === false) return;
  const clubId = e.club_id as string;

  // Déjà un compte relié au club (parent d'un autre cavalier) : on relie la nouvelle fiche, sans nouvel e-mail.
  const existing = await one<{ user_id: string; person_ref: string | null }>(env.DB,
    "SELECT m.user_id, m.person_ref FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? AND u.email = ? COLLATE NOCASE", clubId, email);
  if (existing) {
    await run(env.DB, "UPDATE memberships SET person_ref = ? WHERE user_id = ? AND club_id = ?", mergeRefs(existing.person_ref, m.id), existing.user_id, clubId);
    return;
  }
  // Invitation d'adhérent déjà en attente pour cette adresse : on y ajoute la fiche.
  const pending = await one<InvitationRow>(env.DB,
    "SELECT * FROM invitations WHERE club_id = ? AND email = ? COLLATE NOCASE AND role = 'member' AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
    clubId, email, nowIso());
  if (pending) {
    await run(env.DB, "UPDATE invitations SET person_ref = ? WHERE id = ?", mergeRefs(pending.person_ref, m.id), pending.id);
    return;
  }
  await createInvitation(env, {
    club_id: clubId, email, role: "member", person_ref: m.id, first: m.first || null, last: m.last || null,
    invited_by: (e.user_id as string) || null, source: "auto", template: "welcome_member",
    extra: { member_first: m.first || "", member_last: m.last || "", minor: !!m.minor, account_exists: !!(await one(env.DB, "SELECT 1 AS x FROM users WHERE email = ? COLLATE NOCASE", email)) },
  });
}

function lessonData(l: Row, club: string, coach: Row | null, arena: string) {
  return {
    lesson_id: l.id, lesson_title: l.title || "Reprise", day: DAYS[l.day] || l.day || "", date: l.date || null, start: l.start || "", dur: l.dur || null,
    coach_name: coach ? [coach.first, coach.last].filter(Boolean).join(" ") : "", arena_name: arena, club_name: club,
  };
}

async function lessonContext(env: Env, clubId: string, l: Row) {
  const club = await clubOf(env, clubId);
  const coach = l.coach ? (await rec(env, clubId, "staff", l.coach)) || (await rec(env, clubId, "coaches", l.coach)) : null;
  const info = await rec(env, clubId, "club", "_");
  const arena = (Array.isArray(info?.arenas) ? info!.arenas.find((a: Row) => a.id === l.arena)?.name : "") || "";
  return lessonData(l, club?.name || "", coach, arena);
}

export async function onLessonSaved(env: Env, e: PiaffeEvent) {
  if (e.coll !== "lessons" || e.via === "import" || e.silent) return;
  const l = e.data as Row, prev = (e.previous as Row) || null;
  const clubId = e.club_id as string;
  const before: string[] = Array.isArray(prev?.riders) ? prev!.riders : [];
  const after: string[] = Array.isArray(l?.riders) ? l.riders : [];
  const added = prev ? after.filter((x) => !before.includes(x)) : [];
  const removed = before.filter((x) => !after.includes(x));
  if (!added.length && !removed.length) return;
  const base = await lessonContext(env, clubId, l);
  for (const id of added) {
    const m = await rec(env, clubId, "members", id);
    if (!m?.email || !isEmail(m.email)) continue;
    await mail(env, { to: m.email, club_id: clubId, template: "booking_confirmed",
      data: { ...base, first: m.first || "", rider_first: m.first || "", rider_last: m.last || "", action_url: appUrl(env, WEB.home) } });
  }
  const wl: string[] = Array.isArray(l.waitlist) ? l.waitlist : [];
  const cap = typeof l.cap === "number" ? l.cap : Infinity;
  if (removed.length && wl.length && after.length < cap) {
    const free = Math.min(cap - after.length, wl.length);
    for (const id of wl.slice(0, free)) {
      const m = await rec(env, clubId, "members", id);
      if (!m?.email || !isEmail(m.email)) continue;
      await mail(env, { to: m.email, club_id: clubId, template: "waitlist_spot",
        data: { ...base, first: m.first || "", rider_first: m.first || "", rider_last: m.last || "", action_url: appUrl(env, WEB.home) } });
    }
  }
}

let registered = false;
export function registerTriggers() {
  if (registered) return;
  registered = true;
  on("record.saved", onMemberCreated);
  on("record.saved", onLessonSaved);
}
