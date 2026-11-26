/* Espace admin · clubs : liste, fiche, actions (essai, fondateurs, réinitialisation, suspension, vue « en tant que »). */
import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../env";
import { all, json, one, run } from "../lib/db";
import { ApiError, bad, body, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { randomToken, sha256 } from "../lib/crypto";
import { SESSION_COOKIE } from "../lib/auth";
import { isSecure } from "../auth/session";
import { issueToken, TOKEN_TTL_MIN } from "../auth/tokens";
import { appUrl, mail, WEB } from "../auth/mailer";
import { FOUNDER_OFFER } from "../billing/plans";
import { adminLog, needConfirm } from "./access";
import { clubState, extendedTrialEnd, monthlyCents } from "./metrics";
import { BACK_COOKIE, VIEW_COOKIE, VIEW_MINUTES } from "./guard";

const app = new Hono<AppEnv>();
export const VIEW_AGENT = "stabl-admin-vue";
const city = (addr: string | null) => json<{ city?: string; zip?: string }>(addr, {}).city || "";

const LIST_SQL = `
  SELECT c.id, c.name, c.slug, c.kind, c.address, c.email, c.plan, c.plan_status, c.trial_ends_at, c.created_at,
    b.founder, b.interval, b.plan AS bplan, b.status AS stripe_status, f.suspended_at,
    (SELECT COUNT(*) FROM records r WHERE r.club_id = c.id AND r.coll = 'members' AND r.deleted = 0) AS members,
    (SELECT COUNT(*) FROM records r WHERE r.club_id = c.id AND r.coll = 'horses' AND r.deleted = 0) AS horses,
    (SELECT MAX(s.created_at) FROM sessions s JOIN memberships m ON m.user_id = s.user_id
      WHERE m.club_id = c.id AND (s.user_agent IS NULL OR s.user_agent <> '${VIEW_AGENT}')) AS last_login,
    (SELECT u.email FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = c.id AND m.role = 'owner' ORDER BY m.created_at LIMIT 1) AS owner_email
  FROM clubs c LEFT JOIN billing_subscriptions b ON b.club_id = c.id LEFT JOIN admin_club_flags f ON f.club_id = c.id`;

function view(r: any, now = Date.now()) {
  return {
    id: r.id, name: r.name, slug: r.slug, kind: r.kind, city: city(r.address), email: r.email, plan: r.plan, plan_status: r.plan_status,
    trial_ends_at: r.trial_ends_at, created_at: r.created_at, founder: !!r.founder, interval: r.interval, stripe_status: r.stripe_status,
    suspended: !!r.suspended_at, members: r.members, horses: r.horses, last_login: r.last_login, owner_email: r.owner_email,
    mrr_cents: ["active", "past_due"].includes(r.plan_status) && !r.suspended_at ? monthlyCents({ plan: r.bplan || r.plan, interval: r.interval, founder: r.founder }) : 0,
    state: clubState(r, now),
  };
}

app.get("/admin/api/clubs", async (c) => {
  const q = (c.req.query("q") || "").trim().toLowerCase().slice(0, 80);
  const etat = c.req.query("etat") || "";
  const like = "%" + q.replace(/[%_]/g, "") + "%";
  const rows = await all<any>(c.env.DB, LIST_SQL + ` WHERE (? = '' OR lower(c.name) LIKE ? OR lower(c.slug) LIKE ? OR lower(COALESCE(c.email,'')) LIKE ? OR lower(COALESCE(c.address,'')) LIKE ? OR c.id = ?)
    ORDER BY c.created_at DESC LIMIT 500`, q, like, like, like, like, q);
  let list = rows.map((r) => view(r));
  if (etat === "fondateur") list = list.filter((x) => x.founder);
  else if (etat === "essai") list = list.filter((x) => x.state.key === "essai" || x.state.key === "essai_fini");
  else if (etat) list = list.filter((x) => x.state.key === etat);
  return c.json({ clubs: list.slice(0, 300), total: list.length });
});

async function loadClub(c: Context<AppEnv>) {
  const r = await one<any>(c.env.DB, LIST_SQL + " WHERE c.id = ?", c.req.param("id"));
  if (!r) throw notFound("Club introuvable.");
  return r;
}

app.get("/admin/api/clubs/:id", async (c) => {
  const db = c.env.DB;
  const r = await loadClub(c);
  const id = r.id;
  const billing = await one<any>(db, "SELECT stripe_customer_id, stripe_subscription_id, plan, interval, status, current_period_end, cancel_at_period_end, past_due_since, founder, referral_code, referred_by, last_invoice_url FROM billing_subscriptions WHERE club_id = ?", id);
  const users = await all<any>(db, `SELECT u.id, u.email, u.first, u.last, u.email_verified_at, m.role, m.status,
      (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id = u.id AND (s.user_agent IS NULL OR s.user_agent <> '${VIEW_AGENT}')) AS last_login
    FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ?
    ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 WHEN 'accountant' THEN 2 WHEN 'staff' THEN 3 WHEN 'coach' THEN 4 ELSE 5 END, u.email LIMIT 50`, id);
  const people = await one<any>(db, "SELECT COUNT(*) AS n FROM memberships WHERE club_id = ?", id);
  const colls = await all<{ coll: string; n: number }>(db, "SELECT coll, COUNT(*) AS n FROM records WHERE club_id = ? AND deleted = 0 GROUP BY coll", id);
  const jobs = await all<any>(db, "SELECT id, source, status, dry_run, item_count, report, created_at, committed_at FROM import_jobs WHERE club_id = ? ORDER BY created_at DESC LIMIT 10", id);
  const incidents = await all<any>(db, "SELECT id, software, step, message, created_at FROM migration_incidents WHERE club_id = ? ORDER BY created_at DESC LIMIT 10", id);
  const invoices = await all<any>(db, "SELECT id, number, status, total_ttc, paid_amount, issue_date, due_date FROM invoices WHERE issuer = 'platform' AND buyer_club_id = ? ORDER BY COALESCE(issue_date, created_at) DESC LIMIT 12", id);
  const clubInvoices = await one<any>(db, "SELECT COUNT(*) AS n, COALESCE(SUM(total_ttc),0) AS ttc FROM invoices WHERE club_id = ? AND issuer = 'club' AND status <> 'draft'", id);
  const flags = await one<any>(db, "SELECT suspended_at, reason FROM admin_club_flags WHERE club_id = ?", id);
  const journal = await all<any>(db, "SELECT a.action, a.at, a.data, u.email AS by FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE a.club_id = ? AND a.action LIKE 'admin.%' ORDER BY a.at DESC LIMIT 15", id);
  const full = await one<any>(db, "SELECT siren, siret, phone, ffe_number, onboarding, settings FROM clubs WHERE id = ?", id);
  const ob = json<any>(full?.onboarding, {});
  return c.json({
    club: { ...view(r), siren: full?.siren, siret: full?.siret, phone: full?.phone, ffe_number: full?.ffe_number, users_count: people?.n ?? 0,
      onboarding_done: !!(ob.completed_at || ob.done), software: ob.answers?.logiciel || ob.answers?.software || null, suspended_reason: flags?.reason || null },
    billing, users, records: Object.fromEntries(colls.map((x) => [x.coll, x.n])),
    migrations: jobs.map((j) => ({ ...j, report: undefined, totals: json<any>(j.report, {})?.totals || null, error: json<any>(j.report, {})?.error || null })),
    incidents, invoices, club_invoices: { count: clubInvoices?.n ?? 0, ttc_cents: clubInvoices?.ttc ?? 0 },
    journal: journal.map((j) => ({ ...j, data: json(j.data, null) })),
  });
});

/* ---------- Actions ---------- */

app.post("/admin/api/clubs/:id/essai", async (c) => {
  const b = await body<{ days?: unknown; confirm?: unknown }>(c);
  needConfirm(b);
  const days = Math.round(Number(b.days));
  if (!Number.isFinite(days) || days < 1 || days > 90) throw bad("invalid_field", "Indiquez un nombre de jours entre 1 et 90.", { field: "days" });
  const r = await loadClub(c);
  if (r.plan_status === "active") throw new ApiError(409, "already_paying", "Ce club a déjà un abonnement actif : il n'y a pas d'essai à prolonger.");
  const billing = await one<any>(c.env.DB, "SELECT stripe_subscription_id, status FROM billing_subscriptions WHERE club_id = ?", r.id);
  if (billing?.stripe_subscription_id && billing.status && billing.status !== "trialing")
    throw new ApiError(409, "stripe_subscription", "Ce club a un abonnement Stripe : ajustez-le dans le tableau de bord Stripe.");
  const end = extendedTrialEnd(r.trial_ends_at, days);
  await run(c.env.DB, "UPDATE clubs SET trial_ends_at = ?, plan_status = 'trialing', updated_at = ? WHERE id = ?", end, nowIso(), r.id);
  await run(c.env.DB, "UPDATE billing_subscriptions SET trial_reminders = '[]', past_due_since = NULL, updated_at = ? WHERE club_id = ?", nowIso(), r.id);
  await adminLog(c, "club.trial_extend", { club_id: r.id, target: r.id, data: { days, from: r.trial_ends_at, to: end } });
  return c.json({ ok: true, trial_ends_at: end });
});

app.post("/admin/api/clubs/:id/fondateur", async (c) => {
  const b = await body<{ founder?: unknown; confirm?: unknown }>(c);
  needConfirm(b);
  const r = await loadClub(c);
  const on = b.founder !== false;
  if (on) {
    const used = await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM billing_subscriptions WHERE founder = 1 AND club_id != ?", r.id);
    if ((used?.n || 0) >= FOUNDER_OFFER.max_clubs) throw new ApiError(409, "founder_full", `Les ${FOUNDER_OFFER.max_clubs} places de l'offre fondateurs sont toutes attribuées.`);
  }
  await run(c.env.DB, "INSERT OR IGNORE INTO billing_subscriptions (club_id) VALUES (?)", r.id);
  await run(c.env.DB, "UPDATE billing_subscriptions SET founder = ?, updated_at = ? WHERE club_id = ?", on ? 1 : 0, nowIso(), r.id);
  await adminLog(c, on ? "club.founder_grant" : "club.founder_remove", { club_id: r.id, target: r.id });
  return c.json({ ok: true, founder: on });
});

app.post("/admin/api/clubs/:id/reinitialisation", async (c) => {
  const b = await body<{ user_id?: unknown; confirm?: unknown }>(c);
  needConfirm(b);
  const r = await loadClub(c);
  const u = await one<any>(c.env.DB, `SELECT u.id, u.email, u.first FROM memberships m JOIN users u ON u.id = m.user_id
    WHERE m.club_id = ? AND (? = '' AND m.role = 'owner' OR u.id = ?) ORDER BY m.created_at LIMIT 1`, r.id, String(b.user_id || ""), String(b.user_id || ""));
  if (!u) throw notFound("Aucun compte à qui envoyer le lien dans ce club.");
  const token = await issueToken(c.env, "reset", u.id, u.email);
  await mail(c.env, { to: u.email, template: "reset_password",
    data: { first: u.first || "", email: u.email, action_url: appUrl(c.env, WEB.reset + "?token=" + token), expires_in_minutes: TOKEN_TTL_MIN.reset } });
  await adminLog(c, "club.password_reset_link", { club_id: r.id, target: u.id, data: { email: u.email } });
  return c.json({ ok: true, email: u.email });
});

app.post("/admin/api/clubs/:id/suspendre", async (c) => {
  const b = await body<{ reason?: unknown; confirm?: unknown }>(c);
  needConfirm(b);
  const reason = String(b.reason || "").trim().slice(0, 300);
  if (!reason) throw bad("missing_field", "Indiquez la raison de la suspension (elle reste dans le journal).", { field: "reason" });
  const r = await loadClub(c);
  if (r.suspended_at) throw new ApiError(409, "already_suspended", "Ce club est déjà suspendu.");
  const db = c.env.DB;
  const active = await all<{ user_id: string }>(db, "SELECT user_id FROM memberships WHERE club_id = ? AND status = 'active'", r.id);
  const ids = active.map((x) => x.user_id);
  await db.batch([
    db.prepare("UPDATE memberships SET status = 'suspended' WHERE club_id = ? AND status = 'active'").bind(r.id),
    db.prepare(`INSERT INTO admin_club_flags (club_id, suspended_at, suspended_by, reason, suspended_users, updated_at) VALUES (?,?,?,?,?,?)
      ON CONFLICT(club_id) DO UPDATE SET suspended_at = excluded.suspended_at, suspended_by = excluded.suspended_by, reason = excluded.reason, suspended_users = excluded.suspended_users, updated_at = excluded.updated_at`)
      .bind(r.id, nowIso(), c.get("user")!.id, reason, JSON.stringify(ids), nowIso()),
  ]);
  await adminLog(c, "club.suspend", { club_id: r.id, target: r.id, data: { reason, users: ids.length } });
  return c.json({ ok: true, suspended_users: ids.length });
});

app.post("/admin/api/clubs/:id/reactiver", async (c) => {
  const b = await body<{ confirm?: unknown }>(c);
  needConfirm(b);
  const r = await loadClub(c);
  const db = c.env.DB;
  const f = await one<{ suspended_users: string; suspended_at: string | null }>(db, "SELECT suspended_users, suspended_at FROM admin_club_flags WHERE club_id = ?", r.id);
  if (!f?.suspended_at) throw new ApiError(409, "not_suspended", "Ce club n'est pas suspendu.");
  const ids = json<string[]>(f.suspended_users, []);
  const st = ids.map((u) => db.prepare("UPDATE memberships SET status = 'active' WHERE club_id = ? AND user_id = ? AND status = 'suspended'").bind(r.id, u));
  st.push(db.prepare("UPDATE admin_club_flags SET suspended_at = NULL, suspended_by = NULL, reason = NULL, suspended_users = '[]', updated_at = ? WHERE club_id = ?").bind(nowIso(), r.id));
  await db.batch(st);
  await adminLog(c, "club.reactivate", { club_id: r.id, target: r.id, data: { users: ids.length } });
  return c.json({ ok: true, restored_users: ids.length });
});

/* ---------- Vue « en tant que » (lecture seule) ---------- */

function rawSessionToken(c: Context<AppEnv>) {
  const a = c.req.header("authorization") || "";
  return a.startsWith("Bearer ") ? a.slice(7).trim() : getCookie(c, SESSION_COOKIE) || "";
}

app.post("/admin/api/clubs/:id/vue", async (c) => {
  const b = await body<{ confirm?: unknown }>(c);
  needConfirm(b);
  const r = await loadClub(c);
  if (r.suspended_at) throw new ApiError(409, "suspended", "Ce club est suspendu : réactivez-le avant de l'ouvrir.");
  const db = c.env.DB;
  const target = await one<{ user_id: string; email: string }>(db, `SELECT m.user_id, u.email FROM memberships m JOIN users u ON u.id = m.user_id
    WHERE m.club_id = ? AND m.status = 'active' AND m.role IN ('owner','manager') ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.created_at LIMIT 1`, r.id);
  if (!target) throw notFound("Ce club n'a aucun gérant actif à afficher.");
  const back = rawSessionToken(c);
  if (!back) throw new ApiError(409, "no_session", "Ouvrez l'espace admin depuis votre navigateur pour utiliser la vue.");
  const token = randomToken(32), sid = await sha256(token);
  const expires = new Date(Date.now() + VIEW_MINUTES * 6e4).toISOString();
  const id = newId("imv");
  await db.batch([
    db.prepare("INSERT INTO sessions (id, user_id, club_id, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)").bind(sid, target.user_id, r.id, expires, VIEW_AGENT, null),
    db.prepare("INSERT INTO admin_impersonations (id, admin_user_id, target_user_id, club_id, session_id, expires_at) VALUES (?,?,?,?,?,?)").bind(id, c.get("user")!.id, target.user_id, r.id, sid, expires),
  ]);
  const secure = isSecure(c.env), maxAge = VIEW_MINUTES * 60;
  setCookie(c, BACK_COOKIE, back, { httpOnly: true, secure, sameSite: "Strict", path: "/admin", maxAge: maxAge + 600 });
  setCookie(c, VIEW_COOKIE, id, { httpOnly: true, secure, sameSite: "Lax", path: "/", maxAge });
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "Lax", path: "/", maxAge });
  await adminLog(c, "club.view_start", { club_id: r.id, target: target.user_id, data: { as: target.email, minutes: VIEW_MINUTES, view: id } });
  return c.json({ ok: true, url: "/", expires_at: expires, as: target.email });
});

export default app;
