/*
 * Campagne d'accueil des adhérents après une migration :
 *  annonce (migration_announce) à la date choisie, lien d'activation (migration_activate) à date_activation
 *  ou directement dans l'annonce, relances J+3 et J+7 (migration_reminder) tant que l'espace n'est pas activé.
 * Le lien d'activation connecte directement l'adhérent (création du compte si besoin, adhésion au club rattachée
 * à sa fiche) puis l'envoie sur sa fiche pré-remplie à vérifier : ${APP_URL}/bienvenue?migration=1.
 * Suivi : envoyés, ouverts (pixel), activés, rebonds.
 */
import { Hono, type Context } from "hono";
import { openSession } from "../auth/session";
import { upsertMembership } from "../auth/invitations";
import type { AppEnv, Env } from "../env";
import { requireRole } from "../lib/auth";
import { csrf } from "../auth/csrf";
import { all, json, one, rateLimit, run, audit } from "../lib/db";
import { ApiError, bad, body, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { b64url, hmacSha256, sha256 } from "../lib/crypto";
import { enqueue } from "../mail/outbox";
import { DAY_SHORT } from "./normalize";
import { hour } from "../mail/fmt";
import { esc } from "../mail/layout";
import { BRAND } from "../mail/brand";

const app = new Hono<AppEnv>();
app.use("/api/migration/campagne", csrf);
app.use("/api/migration/campagne/*", csrf);
const BATCH = 100;
export const TOKEN_DAYS = 30;
const appUrl = (env: Env) => (env.APP_URL || "").replace(/\/$/, "");

/** Jeton d'activation dérivé (réutilisable dans les relances) ; seule son empreinte est stockée. */
async function activationToken(env: Env, rid: string) {
  return "act_" + b64url(await hmacSha256(env.SESSION_SECRET, "migration-activate:" + rid)).slice(0, 40);
}

function parseWhen(v: unknown, field: string): string {
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + "T08:00:00.000Z"; // 9 h à Paris l'hiver, 10 h l'été
  const d = new Date(s);
  if (!s || isNaN(d.getTime())) throw bad("invalid_field", `Le champ « ${field} » doit être une date (AAAA-MM-JJ) ou une date et heure ISO.`, { field });
  return d.toISOString();
}

app.post("/api/migration/campagne", requireRole("owner", "manager"), async (c) => {
  const club = c.get("club")!.id;
  const b = await body<{ date_envoi?: string; date_activation?: string; cibles?: unknown; logiciel_precedent?: string }>(c);
  const sendAt = b.date_envoi ? parseWhen(b.date_envoi, "date_envoi") : nowIso();
  const activateAt = b.date_activation ? parseWhen(b.date_activation, "date_activation") : null;
  if (activateAt && activateAt < sendAt) throw bad("invalid_field", "La date d'activation doit suivre la date d'annonce.", { field: "date_activation" });
  const members = await all<{ id: string; data: string }>(c.env.DB, "SELECT id, data FROM records WHERE club_id = ? AND coll = 'members' AND deleted = 0", club);
  const linked = new Set((await all<{ person_ref: string }>(c.env.DB, "SELECT person_ref FROM memberships WHERE club_id = ? AND person_ref IS NOT NULL", club)).map((r) => r.person_ref));
  let ids: Set<string> | null = null;
  if (Array.isArray(b.cibles)) ids = new Set(b.cibles.map(String));
  else if (b.cibles != null && !["tous", "all", "sans_compte"].includes(String(b.cibles))) throw bad("invalid_field", "« cibles » doit valoir « tous » ou être une liste d'identifiants d'adhérents.", { field: "cibles" });
  const targets: { id: string; email: string; first: string }[] = [];
  let noEmail = 0, already = 0;
  for (const m of members) {
    if (ids && !ids.has(m.id)) continue;
    if (!ids && linked.has(m.id)) { already++; continue; }
    const d = json<Record<string, any>>(m.data, {});
    if (!d.email) { noEmail++; continue; }
    targets.push({ id: m.id, email: String(d.email).toLowerCase(), first: d.first || "" });
  }
  if (!targets.length) throw bad("no_targets", "Aucun adhérent à contacter : il faut une adresse e-mail sur la fiche.");
  const id = newId("cmp");
  const st = [c.env.DB.prepare("INSERT INTO migration_campaigns (id, club_id, send_at, activate_at, previous_software, created_by) VALUES (?,?,?,?,?,?)")
    .bind(id, club, sendAt, activateAt, b.logiciel_precedent ? String(b.logiciel_precedent).slice(0, 60) : null, c.get("user")!.id)];
  for (const t of targets) {
    const rid = newId("mrc");
    const tok = await activationToken(c.env, rid);
    st.push(c.env.DB.prepare("INSERT INTO migration_recipients (id, campaign_id, club_id, member_id, email, first, token_hash, token_expires_at) VALUES (?,?,?,?,?,?,?,?)")
      .bind(rid, id, club, t.id, t.email, t.first, await sha256(tok), new Date(Date.parse(activateAt || sendAt) + TOKEN_DAYS * 864e5).toISOString()));
  }
  for (let i = 0; i < st.length; i += 100) await c.env.DB.batch(st.slice(i, i + 100));
  await audit(c.env.DB, { club_id: club, user_id: c.get("user")!.id, action: "migration.campaign.create", target: id, data: { targets: targets.length } });
  return c.json({ campagne: { id, date_envoi: sendAt, date_activation: activateAt, cibles: targets.length, sans_email: noEmail, deja_actives: already, statut: "scheduled" } }, 201);
});

async function stats(env: Env, campaignId: string) {
  return (await one<Record<string, number>>(env.DB, `SELECT COUNT(*) AS cibles,
      SUM(r.announced_at IS NOT NULL) AS envoyes, SUM(r.opened_at IS NOT NULL) AS ouverts, SUM(r.activated_at IS NOT NULL) AS actives,
      SUM(EXISTS (SELECT 1 FROM email_outbox o WHERE o.id IN (r.announce_mail, r.activate_mail, r.reminder1_mail, r.reminder2_mail)
                  AND (o.delivery = 'bounced' OR o.status IN ('failed','suppressed')))) AS rebonds
    FROM migration_recipients r WHERE r.campaign_id = ?`, campaignId))!;
}

app.get("/api/migration/campagne", requireRole("owner", "manager"), async (c) => {
  const rows = await all<any>(c.env.DB, "SELECT * FROM migration_campaigns WHERE club_id = ? ORDER BY created_at DESC LIMIT 20", c.get("club")!.id);
  const out = [];
  for (const r of rows) out.push({ id: r.id, date_envoi: r.send_at, date_activation: r.activate_at, statut: r.status, logiciel_precedent: r.previous_software, created_at: r.created_at, suivi: await stats(c.env, r.id) });
  return c.json({ campagnes: out });
});
app.get("/api/migration/campagne/:id", requireRole("owner", "manager"), async (c) => {
  const r = await one<any>(c.env.DB, "SELECT * FROM migration_campaigns WHERE id = ? AND club_id = ?", c.req.param("id"), c.get("club")!.id);
  if (!r) throw notFound("Campagne introuvable.");
  const rec = await all<any>(c.env.DB, `SELECT member_id, email, announced_at, activate_sent_at, reminder1_at, reminder2_at, opened_at, activated_at FROM migration_recipients WHERE campaign_id = ? ORDER BY email LIMIT 2000`, r.id);
  return c.json({ id: r.id, date_envoi: r.send_at, date_activation: r.activate_at, statut: r.status, suivi: await stats(c.env, r.id), destinataires: rec });
});
app.delete("/api/migration/campagne/:id", requireRole("owner", "manager"), async (c) => {
  const r = await run(c.env.DB, "UPDATE migration_campaigns SET status = 'canceled' WHERE id = ? AND club_id = ? AND status IN ('scheduled','sending')", c.req.param("id"), c.get("club")!.id);
  if (!r.meta.changes) throw new ApiError(409, "not_cancelable", "Cette campagne est déjà terminée ou introuvable.");
  return c.json({ ok: true });
});

/* ---------- Pixel d'ouverture (public) ---------- */
const GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (x) => x.charCodeAt(0));
app.get("/api/migration/o/:rid{[a-z0-9_]+\\.gif}", async (c) => {
  const rid = c.req.param("rid").replace(/\.gif$/, "");
  await run(c.env.DB, "UPDATE migration_recipients SET opened_at = ? WHERE id = ? AND opened_at IS NULL", nowIso(), rid);
  return new Response(GIF, { headers: { "content-type": "image/gif", "cache-control": "no-store, max-age=0" } });
});

/* ---------- Activation en un clic (public) ---------- */
// GET n'active rien : les antivirus de messagerie ouvrent les liens. La page affiche un bouton qui envoie un POST.
app.get("/api/migration/activer/:token", async (c) => {
  const t = esc(c.req.param("token"));
  return c.html(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Activer mon espace</title><style>body{margin:0;font-family:${BRAND.font};background:${BRAND.colors.bg};color:${BRAND.colors.text};display:flex;min-height:100vh;align-items:center;justify-content:center}
main{background:#fff;border:1px solid ${BRAND.colors.line};border-radius:16px;padding:32px;max-width:420px;margin:16px;text-align:center}h1{color:${BRAND.colors.ink};font-size:22px}
button{background:${BRAND.colors.ink};color:#fff;border:0;border-radius:10px;padding:14px 28px;font-size:16px;font-weight:600;cursor:pointer}
@media (prefers-color-scheme:dark){body{background:${BRAND.colors.darkBg};color:${BRAND.colors.darkText}}main{background:${BRAND.colors.darkCard};border-color:${BRAND.colors.darkLine}}h1{color:#fff}button{background:#fff;color:${BRAND.colors.ink}}}</style></head>
<body><main><h1>Activer mon espace</h1><p>Un clic et vous êtes connecté. Vous pourrez ensuite vérifier votre fiche.</p>
<form method="post" action="/api/migration/activer/${t}"><button type="submit">Activer mon espace</button></form></main></body></html>`, 200, { "cache-control": "no-store", "referrer-policy": "no-referrer" });
});
app.post("/api/migration/activer/:token", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || "local";
  if (!(await rateLimit(c.env.DB, "activate:" + ip, 30, 900))) throw new ApiError(429, "rate_limited", "Trop de tentatives. Réessayez dans quelques minutes.");
  const tok = c.req.param("token");
  const r = await one<any>(c.env.DB, "SELECT * FROM migration_recipients WHERE token_hash = ?", await sha256(tok));
  const base = appUrl(c.env);
  if (!r) return c.redirect(base + "/connexion?activation=invalide", 303);
  if (r.activated_at) return c.redirect(base + "/connexion?activation=deja&email=" + encodeURIComponent(r.email), 303);
  if (r.token_expires_at < nowIso()) return c.redirect(base + "/connexion?activation=expiree&email=" + encodeURIComponent(r.email), 303);
  const db = c.env.DB;
  const m = await one<{ data: string }>(db, "SELECT data FROM records WHERE club_id = ? AND coll = 'members' AND id = ? AND deleted = 0", r.club_id, r.member_id);
  if (!m) return c.redirect(base + "/connexion?activation=invalide", 303);
  const d = json<Record<string, any>>(m.data, {});
  const now = nowIso();
  let user = await one<{ id: string }>(db, "SELECT id FROM users WHERE email = ?", r.email);
  if (!user) {
    user = { id: newId("usr") };
    await run(db, "INSERT INTO users (id, email, email_verified_at, first, last, phone, last_club_id) VALUES (?,?,?,?,?,?,?)", user.id, r.email, now, d.first || null, d.last || null, d.phone || null, r.club_id);
  } else {
    await run(db, "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), last_club_id = ? WHERE id = ?", now, r.club_id, user.id);
  }
  await upsertMembership(c.env, user.id, r.club_id, "member", r.member_id);
  await openSession(c, user.id, r.club_id);
  await run(db, "UPDATE migration_recipients SET activated_at = ?, user_id = ?, opened_at = COALESCE(opened_at, ?) WHERE id = ?", now, user.id, now, r.id);
  await audit(db, { club_id: r.club_id, user_id: user.id, action: "migration.activate", target: r.member_id, ip });
  return c.redirect(base + "/bienvenue?migration=1", 303);
});

/* ---------- Envois programmés ---------- */
async function memberSummary(env: Env, clubId: string, memberId: string) {
  const rows = await all<{ coll: string; id: string; data: string }>(env.DB,
    "SELECT coll, id, data FROM records WHERE club_id = ? AND coll IN ('members','forfaits','lessons','horses') AND deleted = 0", clubId);
  const by = (c: string): Record<string, any>[] => rows.filter((r) => r.coll === c).map((r) => ({ ...json<Record<string, any>>(r.data, {}), id: r.id }));
  const me: Record<string, any> = by("members").find((x) => x.id === memberId) || {};
  const forfait = by("forfaits").find((f) => f.id === me.forfait)?.name || "";
  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const lessons = by("lessons").filter((l) => (l.riders || []).includes(memberId)).sort((a, b) => ((a.dow + 6) % 7) - ((b.dow + 6) % 7) || String(a.start).localeCompare(b.start))
    .map((l) => `${DAYS[l.dow] ?? DAY_SHORT[l.dow] ?? ""} ${hour(l.start)}, ${l.title}`);
  const horses = by("horses").filter((h) => h.owner === memberId).map((h) => h.name);
  return { forfait, balance: typeof me.balance === "number" ? me.balance : null, lessons, horses, first: me.first };
}

export async function runCampaigns(env: Env, now = new Date()) {
  const t = now.toISOString(), db = env.DB;
  const camps = await all<any>(db, "SELECT * FROM migration_campaigns WHERE status IN ('scheduled','sending') AND send_at <= ?", t);
  let sent = 0;
  for (const cp of camps) {
    if (cp.status === "scheduled") await run(db, "UPDATE migration_campaigns SET status = 'sending' WHERE id = ?", cp.id);
    const pixel = (rid: string) => `${appUrl(env)}/api/migration/o/${rid}.gif`;
    const link = async (rid: string) => `${appUrl(env)}/api/migration/activer/${await activationToken(env, rid)}`;
    // 1. Annonces.
    const todo = await all<any>(db, "SELECT * FROM migration_recipients WHERE campaign_id = ? AND announced_at IS NULL LIMIT ?", cp.id, BATCH);
    for (const r of todo) {
      const s = await memberSummary(env, cp.club_id, r.member_id);
      const mail = await enqueue(env, { to: r.email, template: "migration_announce", club_id: cp.club_id, data: {
        first: s.first || r.first, previous_software: cp.previous_software, switch_date: cp.activate_at || cp.send_at, forfait: s.forfait, balance: s.balance,
        lessons: s.lessons, horses: s.horses, activate_url: cp.activate_at ? null : await link(r.id), tracking_pixel: pixel(r.id),
      } }, { dedupe_key: `mig:${r.id}:announce` });
      await run(db, "UPDATE migration_recipients SET announce_mail = ?, announced_at = ? WHERE id = ?", mail, t, r.id);
      sent++;
    }
    // 2. Liens d'activation envoyés à part.
    if (cp.activate_at && cp.activate_at <= t) {
      const act = await all<any>(db, "SELECT * FROM migration_recipients WHERE campaign_id = ? AND announced_at IS NOT NULL AND activate_sent_at IS NULL AND activated_at IS NULL LIMIT ?", cp.id, BATCH);
      for (const r of act) {
        const s = await memberSummary(env, cp.club_id, r.member_id);
        const mail = await enqueue(env, { to: r.email, template: "migration_activate", club_id: cp.club_id, data: {
          first: s.first || r.first, activate_url: await link(r.id), forfait: s.forfait, lessons: s.lessons, horses: s.horses, expires_days: TOKEN_DAYS, tracking_pixel: pixel(r.id),
        } }, { dedupe_key: `mig:${r.id}:activate` });
        await run(db, "UPDATE migration_recipients SET activate_mail = ?, activate_sent_at = ? WHERE id = ?", mail, t, r.id);
        sent++;
      }
    }
    // 3. Relances J+3 et J+7 après l'envoi du lien.
    for (const [lvl, days, col] of [[1, 3, "reminder1"], [2, 7, "reminder2"]] as const) {
      const ref = cp.activate_at ? "activate_sent_at" : "announced_at";
      const due = new Date(now.getTime() - days * 864e5).toISOString();
      const list = await all<any>(db, `SELECT * FROM migration_recipients WHERE campaign_id = ? AND activated_at IS NULL AND ${col}_at IS NULL AND ${ref} IS NOT NULL AND ${ref} <= ? AND token_expires_at > ? LIMIT ?`, cp.id, due, t, BATCH);
      for (const r of list) {
        const mail = await enqueue(env, { to: r.email, template: "migration_reminder", club_id: cp.club_id, data: { level: lvl, first: r.first, activate_url: await link(r.id), tracking_pixel: pixel(r.id) } },
          { dedupe_key: `mig:${r.id}:${col}` });
        await run(db, `UPDATE migration_recipients SET ${col}_mail = ?, ${col}_at = ? WHERE id = ?`, mail, t, r.id);
        sent++;
      }
    }
    const left = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM migration_recipients WHERE campaign_id = ? AND activated_at IS NULL AND token_expires_at > ?
      AND (announced_at IS NULL OR reminder2_at IS NULL)`, cp.id, t);
    if (!left?.n) await run(db, "UPDATE migration_campaigns SET status = 'sent' WHERE id = ?", cp.id);
  }
  return { sent };
}

export async function cron(env: Env, expr: string) {
  if (expr === "*/10 * * * *") await runCampaigns(env);
}
export default app;
export type { Context };
