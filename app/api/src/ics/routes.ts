import { Hono, type Context } from "hono";
import type { AppEnv, Env, Role } from "../env";
import { requireUser } from "../lib/auth";
import { csrf } from "../auth/csrf";
import { all, one, rateLimit, run, audit } from "../lib/db";
import { ApiError, bad, body, forbidden, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { b64url, hmacSha256, sha256 } from "../lib/crypto";
import { calendar, type IcsEvent } from "./ics";
import { audience, buildEvents, loadClubData, SCOPE_LABEL, type Scope } from "./feeds";

const app = new Hono<AppEnv>();
app.use("/api/calendars", csrf);
app.use("/api/calendars/*", csrf);
const MAX_FEEDS = 20;
const SCOPES: Scope[] = ["member", "coach", "club", "horse"];

/** Jeton d'URL dérivé de l'id et du secret du serveur : on peut réafficher le lien, la base ne garde que son empreinte. */
export async function feedToken(env: Env, id: string): Promise<string> {
  return "cal_" + b64url(await hmacSha256(env.SESSION_SECRET, "ics-feed:" + id)).slice(0, 40);
}
export function feedLinks(env: Env, token: string, name: string) {
  const https = `${(env.APP_URL || "").replace(/\/$/, "")}/ics/${token}.ics`;
  const webcal = https.replace(/^https?:\/\//, "webcal://");
  return {
    url: https, webcal,
    google: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal),
    apple: webcal,
    outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`,
    outlook365: `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`,
  };
}

/** Le rôle et la fiche de l'utilisateur permettent-ils ce flux ? Renvoie la cible (fiche ou cheval). */
async function authorize(env: Env, clubId: string, role: Role, personRef: string | null, scope: Scope, horseId?: string | null): Promise<string | null> {
  const manager = role === "owner" || role === "manager";
  if (scope === "club") { if (manager || role === "staff") return null; throw forbidden("Le planning du club est réservé à l'équipe."); }
  if (scope === "member") { if (role === "member" && personRef) return personRef; throw forbidden("Ce calendrier est réservé aux adhérents rattachés à une fiche."); }
  if (scope === "coach") { if ((role === "coach" || role === "staff" || manager) && personRef) return personRef; throw forbidden("Ce calendrier est réservé aux coachs rattachés à une fiche."); }
  if (!horseId) throw bad("missing_field", "Indiquez le cheval (horse_id).", { field: "horse_id" });
  const d = await loadClubData(env, clubId);
  if (!d.find("horses", horseId)) throw notFound("Cheval introuvable.");
  if (manager || role === "staff") return horseId;
  if (role === "member" && personRef && audience(d, "member", personRef).horses.has(horseId)) return horseId;
  throw forbidden("Vous ne pouvez suivre que vos propres chevaux.");
}

interface FeedRow { id: string; club_id: string; user_id: string; scope: Scope; target: string | null; name: string; alarm_minutes: number | null; created_at: string; last_used_at: string | null; revoked_at: string | null }
async function view(env: Env, f: FeedRow) {
  return { id: f.id, scope: f.scope, horse_id: f.scope === "horse" ? f.target : null, name: f.name, alarm_minutes: f.alarm_minutes, created_at: f.created_at, last_used_at: f.last_used_at, links: feedLinks(env, await feedToken(env, f.id), f.name) };
}
const ctxClub = (c: Context<AppEnv>) => { const cl = c.get("club"), m = c.get("membership"); if (!cl || !m) throw new ApiError(403, "no_club", "Choisissez d'abord un club."); return { club: cl, m }; };

app.get("/api/calendars", requireUser, async (c) => {
  const { club } = ctxClub(c);
  const rows = await all<FeedRow>(c.env.DB, "SELECT * FROM calendar_feeds WHERE user_id = ? AND club_id = ? AND revoked_at IS NULL ORDER BY created_at", c.get("user")!.id, club.id);
  const out = [];
  for (const r of rows) out.push(await view(c.env, r));
  return c.json({ calendars: out });
});

app.post("/api/calendars", requireUser, async (c) => {
  const { club, m } = ctxClub(c);
  const b = await body<{ scope?: string; horse_id?: string; alarm_minutes?: number; name?: string }>(c);
  const scope = String(b.scope || "") as Scope;
  if (!SCOPES.includes(scope)) throw bad("invalid_field", "« scope » doit valoir member, coach, club ou horse.", { field: "scope", allowed: SCOPES });
  const target = await authorize(c.env, club.id, m.role, m.person_ref, scope, b.horse_id ?? null);
  const n = (await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM calendar_feeds WHERE user_id = ? AND revoked_at IS NULL", c.get("user")!.id))!.n;
  if (n >= MAX_FEEDS) throw bad("too_many_calendars", `${MAX_FEEDS} calendriers au maximum : supprimez-en un avant d'en créer un nouveau.`);
  let alarm: number | null = null;
  if (b.alarm_minutes != null) { alarm = Math.round(Number(b.alarm_minutes)); if (!(alarm >= 0 && alarm <= 10080)) throw bad("invalid_field", "« alarm_minutes » doit être compris entre 0 et 10080.", { field: "alarm_minutes" }); }
  let name = `${club.name} · ${SCOPE_LABEL[scope]}`;
  if (scope === "horse") { const d = await loadClubData(c.env, club.id); name = `${d.find("horses", target)?.name || "Cheval"} · ${club.name}`; }
  if (b.name) name = String(b.name).slice(0, 80);
  const id = newId("cal");
  await run(c.env.DB, "INSERT INTO calendar_feeds (id, club_id, user_id, scope, target, name, alarm_minutes, token_hash) VALUES (?,?,?,?,?,?,?,?)",
    id, club.id, c.get("user")!.id, scope, target, name, alarm || null, await sha256(await feedToken(c.env, id)));
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "calendar.create", target: id, data: { scope } });
  const row = (await one<FeedRow>(c.env.DB, "SELECT * FROM calendar_feeds WHERE id = ?", id))!;
  return c.json(await view(c.env, row), 201);
});

app.delete("/api/calendars/:id", requireUser, async (c) => {
  const r = await run(c.env.DB, "UPDATE calendar_feeds SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL", nowIso(), c.req.param("id"), c.get("user")!.id);
  if (!r.meta.changes) throw notFound("Calendrier introuvable.");
  return c.json({ ok: true });
});

/** Un seul événement en .ics (bouton « Ajouter à mon agenda »). Pour une reprise : la prochaine séance, ou la série avec ?serie=1. */
app.get("/api/calendars/event/:coll/:file", requireUser, async (c) => {
  const { club, m } = ctxClub(c);
  const coll = c.req.param("coll"), id = c.req.param("file").replace(/\.ics$/, "");
  const prefix: Record<string, string> = { lessons: "lesson", coachBookings: "booking", trackBookings: "track", care: "care", competitions: "competition" };
  if (!prefix[coll]) throw bad("invalid_coll", "Collection non prise en charge : lessons, coachBookings, trackBookings, care ou competitions.");
  if (m.role === "accountant") throw forbidden();
  const d = await loadClubData(c.env, club.id);
  const scope: Scope = m.role === "owner" || m.role === "manager" || m.role === "staff" ? "club" : m.role === "coach" ? "coach" : "member";
  if (scope !== "club" && !m.person_ref) throw forbidden();
  const uid = `${prefix[coll]}-${id}@${club.id}.piaffe.app`;
  let ev = buildEvents(d, scope, m.person_ref).find((e) => e.uid === uid);
  if (!ev) throw notFound("Événement introuvable ou non accessible.");
  if (ev.rrule && c.req.query("serie") !== "1") {
    const today = new Date(Date.now() + 3600e3 * 1).toISOString().slice(0, 10);
    let date = ev.date;
    const ex = new Set(ev.exdates || []);
    let guard = 0;
    while ((date < today || ex.has(date)) && guard++ < 120) date = new Date(Date.parse(date + "T12:00:00Z") + 7 * 864e5).toISOString().slice(0, 10);
    ev = { ...ev, uid: ev.uid.replace("@", "-" + date.replace(/-/g, "") + "@"), date, rrule: undefined, exdates: undefined } as IcsEvent;
  }
  const ics = calendar(club.name, [ev]);
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${coll}-${id}.ics"`, "cache-control": "private, no-store" } });
});

/** Flux public à jeton : GET /ics/<jeton>.ics */
app.get("/ics/:file", async (c) => {
  const file = c.req.param("file");
  if (!/^cal_[A-Za-z0-9_-]{20,60}\.ics$/.test(file)) throw notFound("Calendrier introuvable.");
  const token = file.slice(0, -4);
  const h = await sha256(token);
  const ip = c.req.header("cf-connecting-ip") || "local";
  if (!(await rateLimit(c.env.DB, "ics:" + h.slice(0, 24), 120, 3600)) || !(await rateLimit(c.env.DB, "icsip:" + ip, 600, 3600)))
    return c.text("Trop de requêtes, réessayez plus tard.", 429, { "retry-after": "600" });
  const f = await one<FeedRow>(c.env.DB, "SELECT * FROM calendar_feeds WHERE token_hash = ?", h);
  if (!f || f.revoked_at) throw notFound("Calendrier introuvable ou révoqué.");
  // L'accès est revérifié à chaque lecture : un utilisateur retiré du club ne voit plus rien.
  const mem = await one<{ role: Role; person_ref: string | null }>(c.env.DB, "SELECT role, person_ref FROM memberships WHERE user_id = ? AND club_id = ? AND status = 'active'", f.user_id, f.club_id);
  if (!mem) throw notFound("Calendrier introuvable ou révoqué.");
  try { await authorize(c.env, f.club_id, mem.role, mem.person_ref, f.scope, f.target); } catch { throw notFound("Calendrier introuvable ou révoqué."); }
  if (f.scope === "member" && mem.person_ref !== f.target) throw notFound("Calendrier introuvable ou révoqué.");
  const d = await loadClubData(c.env, f.club_id);
  const events = buildEvents(d, f.scope, f.target);
  c.executionCtx.waitUntil(run(c.env.DB, "UPDATE calendar_feeds SET last_used_at = ? WHERE id = ?", nowIso(), f.id).then(() => {}));
  return new Response(calendar(f.name, events, { alarmMin: f.alarm_minutes, description: `${d.clubName}, calendrier Piaffe` }), {
    headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=300", "content-disposition": `inline; filename="piaffe.ics"`, "x-robots-tag": "noindex" },
  });
});

export default app;
/** Ménage : les jetons révoqués depuis plus de 90 jours sont supprimés. */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  if (expr === "0 6 * * *") await run(env.DB, "DELETE FROM calendar_feeds WHERE revoked_at IS NOT NULL AND revoked_at < ?", new Date(Date.now() - 90 * 864e5).toISOString());
}
