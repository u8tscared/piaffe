import { Hono, type Context } from "hono";
import type { AppEnv, Role } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { all, audit, one, rateLimit, run } from "../lib/db";
import { emit } from "../lib/events";
import { ApiError, bad, body, forbidden, isEmail, notFound, str } from "../lib/http";
import { newId, nowIso, slugify } from "../lib/ids";
import { randomToken, sha256, hex } from "../lib/crypto";
import { csrf } from "./csrf";
import { checkPasswordPolicy, hashPassword } from "./password";
import { clientIp, openSession, tokenForClient, tooMany } from "./session";
import { createInvitation, INVITABLE_ROLES, invitationStatus, publicInvitation, upsertMembership, type InvitationRow } from "./invitations";
import { clubsOf, getUser, getUserByEmail, normEmail, normRefs, publicUser } from "./users";
import { ROLE_LABEL } from "./mailer";

const app = new Hono<AppEnv>();
app.use("/api/clubs", csrf);
app.use("/api/invitations", csrf);
app.use("/api/invitations/*", csrf);
app.use("/api/club/users", csrf);
app.use("/api/club/users/*", csrf);
app.use("/api/api-keys", csrf);
app.use("/api/api-keys/*", csrf);

export const CLUB_KINDS = ["centre", "ecurie_pension", "ecurie_proprietaires", "poney_club", "coach_independant", "association"];
const LEGAL_FORMS = ["association", "ei", "eurl", "sarl", "sas", "sasu", "earl", "gaec", "scea", "autre"];
export const TRIAL_DAYS = 30;
export const API_SCOPES = ["import", "read", "write", "invoices", "accounting", "ics"];
const ALL_ROLES: Role[] = ["owner", "manager", "staff", "coach", "member", "accountant", "provider"];

const ip = (c: Context) => clientIp(c);
const isOwner = (c: Context<AppEnv>) => c.get("membership")?.role === "owner";

function publicClub(r: any) {
  return { id: r.id, name: r.name, slug: r.slug, kind: r.kind, legal_form: r.legal_form, siren: r.siren, siret: r.siret,
    email: r.email, phone: r.phone, timezone: r.timezone, plan: r.plan, plan_status: r.plan_status, trial_ends_at: r.trial_ends_at, created_at: r.created_at };
}

// ---------- Création d'un club ----------
app.post("/api/clubs", requireUser, async (c) => {
  const b = await body<any>(c);
  const user = c.get("user")!;
  if (!(await rateLimit(c.env.DB, "club:create:" + user.id, 5, 86400))) throw tooMany();
  const name = str(b.name, "name", { min: 2, max: 120 });
  const kind = b.kind == null || b.kind === "" ? "centre" : String(b.kind);
  if (!CLUB_KINDS.includes(kind)) throw bad("invalid_field", "Type de structure inconnu.", { field: "kind", allowed: CLUB_KINDS });
  const legal = b.legal_form ? String(b.legal_form) : null;
  if (legal && !LEGAL_FORMS.includes(legal)) throw bad("invalid_field", "Forme juridique inconnue.", { field: "legal_form", allowed: LEGAL_FORMS });
  const siren = b.siren ? String(b.siren).replace(/\s/g, "") : null;
  if (siren && !/^\d{9}$/.test(siren)) throw bad("invalid_field", "Le SIREN doit compter 9 chiffres.", { field: "siren" });
  const siret = b.siret ? String(b.siret).replace(/\s/g, "") : null;
  if (siret && !/^\d{14}$/.test(siret)) throw bad("invalid_field", "Le SIRET doit compter 14 chiffres.", { field: "siret" });
  const email = b.email ? normEmail(String(b.email)) : null;
  if (email && !isEmail(email)) throw bad("invalid_email", "L'adresse e-mail du club n'est pas valide.", { field: "email" });
  const phone = str(b.phone, "phone", { max: 30, optional: true }) || null;
  const address = b.address && typeof b.address === "object" ? JSON.stringify(b.address).slice(0, 2000) : null;
  const tz = typeof b.timezone === "string" && /^[A-Za-z_]+\/[A-Za-z_]+$/.test(b.timezone) ? b.timezone : "Europe/Paris";

  const base = slugify(name);
  let slug = base;
  for (let i = 0; i < 20 && await one(c.env.DB, "SELECT 1 AS x FROM clubs WHERE slug = ?", slug); i++) {
    slug = `${base.slice(0, 40)}-${hex(crypto.getRandomValues(new Uint8Array(3)))}`;
  }
  const id = newId("clb");
  const trialEnds = new Date(Date.now() + TRIAL_DAYS * 864e5).toISOString();
  await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO clubs (id, name, slug, kind, legal_form, siren, siret, email, phone, address, timezone, plan, plan_status, trial_ends_at, settings)
      VALUES (?,?,?,?,?,?,?,?,?,?,?, 'trial', 'trialing', ?, ?)`).bind(id, name, slug, kind, legal, siren, siret, email, phone, address, tz, trialEnds,
      JSON.stringify({ welcome_member_email: true })),
    c.env.DB.prepare("INSERT INTO memberships (user_id, club_id, role, status) VALUES (?,?, 'owner', 'active')").bind(user.id, id),
    c.env.DB.prepare("UPDATE users SET last_club_id = ? WHERE id = ?").bind(id, user.id),
  ]);
  if (c.get("sessionId")) await run(c.env.DB, "UPDATE sessions SET club_id = ? WHERE id = ?", id, c.get("sessionId"));
  await audit(c.env.DB, { club_id: id, user_id: user.id, action: "club.create", target: id, ip: ip(c) });
  await emit(c.env, c.executionCtx, { type: "club.created", club_id: id, user_id: user.id });
  const club = await one<any>(c.env.DB, "SELECT * FROM clubs WHERE id = ?", id);
  return c.json({ club: publicClub(club), role: "owner" }, 201);
});

// ---------- Invitations ----------
app.post("/api/invitations", requireRole("manager"), async (c) => {
  const b = await body<any>(c);
  const club = c.get("club")!, me = c.get("user")!;
  if (!(await rateLimit(c.env.DB, "invite:club:" + club.id, 200, 86400))) throw tooMany();
  const email = normEmail(str(b.email, "email", { max: 254 }));
  if (!isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  const role = String(b.role || "member") as Role;
  if (!INVITABLE_ROLES.includes(role)) throw bad("invalid_field", "Rôle inconnu.", { field: "role", allowed: INVITABLE_ROLES });
  if (role === "manager" && !isOwner(c) && c.get("membership")!.role !== "manager") throw forbidden();
  const ref = normRefs(b.person_ref);
  if (ref === "invalid") throw bad("invalid_field", "Référence de fiche invalide.", { field: "person_ref" });
  const existing = await one<{ role: string; status: string }>(c.env.DB,
    "SELECT m.role, m.status FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? AND u.email = ? COLLATE NOCASE", club.id, email);
  if (existing && existing.status === "active" && existing.role === role && !ref) {
    throw new ApiError(409, "already_member", "Cette personne a déjà accès au club avec ce rôle.");
  }
  const { invitation, url } = await createInvitation(c.env, {
    club_id: club.id, email, role, person_ref: ref, first: str(b.first, "first", { max: 80, optional: true }) || null,
    last: str(b.last, "last", { max: 80, optional: true }) || null, invited_by: me.id, source: "manual", template: "invitation",
  });
  await audit(c.env.DB, { club_id: club.id, user_id: me.id, action: "invitation.create", target: invitation.id, data: { role, person_ref: invitation.person_ref }, ip: ip(c) });
  return c.json({ invitation: publicInvitation(invitation), invitation_url: url }, 201);
});

app.get("/api/invitations", requireRole("manager"), async (c) => {
  const rows = await all<InvitationRow>(c.env.DB, "SELECT * FROM invitations WHERE club_id = ? ORDER BY created_at DESC LIMIT 500", c.get("club")!.id);
  const status = c.req.query("status");
  const list = rows.map(publicInvitation).filter((i) => !status || i.status === status);
  return c.json({ invitations: list });
});

app.delete("/api/invitations/:id", requireRole("manager"), async (c) => {
  const club = c.get("club")!;
  const r = await run(c.env.DB, "UPDATE invitations SET revoked_at = ? WHERE id = ? AND club_id = ? AND accepted_at IS NULL AND revoked_at IS NULL", nowIso(), c.req.param("id"), club.id);
  if (!r.meta.changes) throw notFound("Invitation introuvable ou déjà utilisée.");
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "invitation.revoke", target: c.req.param("id"), ip: ip(c) });
  return c.json({ ok: true });
});

/** Renvoie l'invitation : un nouveau lien remplace l'ancien. */
app.post("/api/invitations/:id/resend", requireRole("manager"), async (c) => {
  const club = c.get("club")!;
  const inv = await one<InvitationRow>(c.env.DB, "SELECT * FROM invitations WHERE id = ? AND club_id = ?", c.req.param("id"), club.id);
  if (!inv || inv.accepted_at) throw notFound("Invitation introuvable ou déjà utilisée.");
  if (!(await rateLimit(c.env.DB, "invite:resend:" + inv.id, 5, 86400))) throw tooMany();
  const { invitation, url } = await createInvitation(c.env, { club_id: club.id, email: inv.email, role: inv.role, person_ref: inv.person_ref,
    first: inv.first, last: inv.last, invited_by: c.get("user")!.id, source: inv.source as any, template: inv.source === "auto" ? "welcome_member" : "invitation" });
  return c.json({ invitation: publicInvitation(invitation), invitation_url: url });
});

async function loadInvitation(c: Context<AppEnv>) {
  const token = c.req.param("token") || "";
  if (!(await rateLimit(c.env.DB, "invite:view:" + ip(c), 60, 900))) throw tooMany();
  if (token.length < 20 || token.length > 200) throw notFound("Cette invitation n'existe pas.");
  const inv = await one<InvitationRow>(c.env.DB, "SELECT * FROM invitations WHERE token_hash = ?", await sha256(token));
  if (!inv) throw notFound("Cette invitation n'existe pas ou a été remplacée par une plus récente.");
  return inv;
}

app.get("/auth/invitations/:token", async (c) => {
  const inv = await loadInvitation(c);
  const club = await one<any>(c.env.DB, "SELECT id, name, slug, logo_key FROM clubs WHERE id = ?", inv.club_id);
  const inviter = inv.invited_by ? await one<any>(c.env.DB, "SELECT first, last FROM users WHERE id = ?", inv.invited_by) : null;
  return c.json({ invitation: {
    club: club && { id: club.id, name: club.name, slug: club.slug, logo_key: club.logo_key },
    email: inv.email, role: inv.role, role_label: ROLE_LABEL[inv.role] || inv.role, first: inv.first, last: inv.last,
    inviter_name: inviter ? [inviter.first, inviter.last].filter(Boolean).join(" ") : null,
    status: invitationStatus(inv), expires_at: inv.expires_at, account_exists: !!(await getUserByEmail(c.env, inv.email)),
  } });
});

app.post("/auth/invitations/:token/accept", async (c) => {
  const inv = await loadInvitation(c);
  const st = invitationStatus(inv);
  if (st === "accepted") throw new ApiError(409, "invitation_used", "Cette invitation a déjà été acceptée. Connectez-vous pour accéder au club.");
  if (st === "revoked") throw new ApiError(409, "invitation_revoked", "Cette invitation a été annulée par le club.");
  if (st === "expired") throw new ApiError(409, "invitation_expired", "Cette invitation a expiré. Demandez au club de vous en renvoyer une.");
  let userId = c.get("user")?.id || null;
  let newToken: string | null = null;
  if (!userId) {
    const b = await c.req.json().catch(() => ({})) as any;
    if (await getUserByEmail(c.env, inv.email)) {
      throw new ApiError(409, "account_exists", "Un compte existe déjà avec cette adresse. Connectez-vous, puis acceptez l'invitation.");
    }
    if (typeof b.password !== "string") throw bad("missing_field", "Choisissez un mot de passe pour créer votre compte.", { field: "password" });
    checkPasswordPolicy(b.password, inv.email);
    userId = newId("usr");
    // L'adresse est vérifiée : le lien d'invitation a été reçu dessus.
    await run(c.env.DB, "INSERT INTO users (id, email, email_verified_at, password_hash, first, last) VALUES (?,?,?,?,?,?)",
      userId, normEmail(inv.email), nowIso(), await hashPassword(b.password),
      str(b.first, "first", { max: 80, optional: true }) || inv.first, str(b.last, "last", { max: 80, optional: true }) || inv.last);
    await emit(c.env, c.executionCtx, { type: "user.signed_up", user_id: userId, email: inv.email, via: "invitation" });
  }
  const r = await run(c.env.DB, "UPDATE invitations SET accepted_at = ?, accepted_by = ? WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL", nowIso(), userId, inv.id);
  if (!r.meta.changes) throw new ApiError(409, "invitation_used", "Cette invitation a déjà été acceptée.");
  await upsertMembership(c.env, userId, inv.club_id, inv.role, inv.person_ref);
  await run(c.env.DB, "UPDATE users SET last_club_id = ? WHERE id = ?", inv.club_id, userId);
  if (c.get("sessionId")) await run(c.env.DB, "UPDATE sessions SET club_id = ? WHERE id = ?", inv.club_id, c.get("sessionId"));
  else newToken = await openSession(c, userId, inv.club_id);
  await audit(c.env.DB, { club_id: inv.club_id, user_id: userId, action: "invitation.accept", target: inv.id, data: { role: inv.role }, ip: ip(c) });
  const m = await one<{ role: string; person_ref: string | null }>(c.env.DB, "SELECT role, person_ref FROM memberships WHERE user_id = ? AND club_id = ?", userId, inv.club_id);
  return c.json({ user: publicUser((await getUser(c.env, userId))!), clubs: await clubsOf(c.env, userId), current_club_id: inv.club_id,
    role: m?.role, person_ref: m?.person_ref, ...(newToken ? tokenForClient(c, newToken) : {}) });
});

// ---------- Équipe d'accès ----------
app.get("/api/club/users", requireRole("manager"), async (c) => {
  const rows = await all<any>(c.env.DB, `SELECT u.id AS user_id, u.email, u.first, u.last, u.avatar_url, m.role, m.person_ref, m.status, m.created_at,
      (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id = u.id) AS last_login_at
    FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? ORDER BY m.role, u.last, u.first`, c.get("club")!.id);
  return c.json({ users: rows });
});

async function targetMembership(c: Context<AppEnv>) {
  const t = await one<{ role: Role; status: string; person_ref: string | null }>(c.env.DB,
    "SELECT role, status, person_ref FROM memberships WHERE user_id = ? AND club_id = ?", c.req.param("userId"), c.get("club")!.id);
  if (!t) throw notFound("Cette personne n'a pas accès au club.");
  return t;
}
async function activeOwners(c: Context<AppEnv>) {
  return (await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM memberships WHERE club_id = ? AND role = 'owner' AND status = 'active'", c.get("club")!.id))!.n;
}

app.patch("/api/club/users/:userId", requireRole("manager"), async (c) => {
  const b = await body<any>(c);
  const club = c.get("club")!, me = c.get("user")!, targetId = c.req.param("userId");
  const t = await targetMembership(c);
  const self = targetId === me.id;
  const role = b.role === undefined ? t.role : (String(b.role) as Role);
  const status = b.status === undefined ? t.status : String(b.status);
  if (!ALL_ROLES.includes(role)) throw bad("invalid_field", "Rôle inconnu.", { field: "role" });
  if (!["active", "suspended"].includes(status)) throw bad("invalid_field", "Statut inconnu.", { field: "status" });
  if ((t.role === "owner" || role === "owner") && !isOwner(c)) throw forbidden("Seul le gérant titulaire peut modifier ce rôle.");
  if (self && !isOwner(c) && (role !== t.role || status !== t.status)) throw forbidden("Vous ne pouvez pas modifier votre propre rôle.");
  if (t.role === "owner" && (role !== "owner" || status !== "active") && (await activeOwners(c)) <= 1) {
    throw new ApiError(409, "last_owner", "Le club doit garder au moins un gérant titulaire. Nommez-en un autre d'abord.");
  }
  let ref = t.person_ref;
  if (b.person_ref !== undefined) { const r = normRefs(b.person_ref); if (r === "invalid") throw bad("invalid_field", "Référence de fiche invalide.", { field: "person_ref" }); ref = r; }
  await run(c.env.DB, "UPDATE memberships SET role = ?, status = ?, person_ref = ? WHERE user_id = ? AND club_id = ?", role, status, ref, targetId, club.id);
  await audit(c.env.DB, { club_id: club.id, user_id: me.id, action: "member.access_change", target: targetId, data: { from: { role: t.role, status: t.status }, to: { role, status, person_ref: ref } }, ip: ip(c) });
  return c.json({ ok: true, user: { user_id: targetId, role, status, person_ref: ref } });
});

app.delete("/api/club/users/:userId", requireRole("manager"), async (c) => {
  const club = c.get("club")!, me = c.get("user")!, targetId = c.req.param("userId");
  const t = await targetMembership(c);
  if (t.role === "owner" && !isOwner(c)) throw forbidden("Seul le gérant titulaire peut retirer ce rôle.");
  if (t.role === "owner" && t.status === "active" && (await activeOwners(c)) <= 1) {
    throw new ApiError(409, "last_owner", "Le club doit garder au moins un gérant titulaire.");
  }
  await run(c.env.DB, "DELETE FROM memberships WHERE user_id = ? AND club_id = ?", targetId, club.id);
  await run(c.env.DB, "UPDATE sessions SET club_id = NULL WHERE user_id = ? AND club_id = ?", targetId, club.id);
  await audit(c.env.DB, { club_id: club.id, user_id: me.id, action: "member.access_remove", target: targetId, data: { role: t.role }, ip: ip(c) });
  return c.json({ ok: true });
});

// ---------- Clés d'API ----------
app.get("/api/api-keys", requireRole("manager"), async (c) => {
  const rows = await all<any>(c.env.DB, "SELECT id, name, prefix, scopes, created_by, created_at, last_used_at, revoked_at FROM api_keys WHERE club_id = ? ORDER BY created_at DESC", c.get("club")!.id);
  return c.json({ api_keys: rows.map((r) => ({ ...r, scopes: JSON.parse(r.scopes) })) });
});

app.post("/api/api-keys", requireRole("manager"), async (c) => {
  const b = await body<any>(c);
  const club = c.get("club")!;
  const name = str(b.name, "name", { min: 1, max: 80 });
  const scopes = Array.isArray(b.scopes) && b.scopes.length ? [...new Set(b.scopes.map(String))] as string[] : ["import"];
  const badScope = scopes.find((s) => !API_SCOPES.includes(s));
  if (badScope) throw bad("invalid_field", `Droit inconnu : « ${badScope} ».`, { field: "scopes", allowed: API_SCOPES });
  const n = (await one<{ n: number }>(c.env.DB, "SELECT COUNT(*) AS n FROM api_keys WHERE club_id = ? AND revoked_at IS NULL", club.id))!.n;
  if (n >= 20) throw new ApiError(409, "too_many_keys", "Ce club a déjà 20 clés actives. Révoquez celles qui ne servent plus.");
  const prefix = hex(crypto.getRandomValues(new Uint8Array(4)));
  const token = `pk_live_${prefix}_${randomToken(32)}`;
  const id = newId("key");
  await run(c.env.DB, "INSERT INTO api_keys (id, club_id, name, prefix, hash, scopes, created_by) VALUES (?,?,?,?,?,?,?)",
    id, club.id, name, prefix, await sha256(token), JSON.stringify(scopes), c.get("user")!.id);
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "apikey.create", target: id, data: { name, scopes }, ip: ip(c) });
  return c.json({ api_key: { id, name, prefix, scopes, created_at: nowIso(), last_used_at: null, revoked_at: null }, token,
    message: "Copiez cette clé maintenant : elle ne sera plus jamais affichée." }, 201);
});

app.delete("/api/api-keys/:id", requireRole("manager"), async (c) => {
  const club = c.get("club")!;
  const r = await run(c.env.DB, "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND club_id = ? AND revoked_at IS NULL", nowIso(), c.req.param("id"), club.id);
  if (!r.meta.changes) throw notFound("Clé introuvable ou déjà révoquée.");
  await audit(c.env.DB, { club_id: club.id, user_id: c.get("user")!.id, action: "apikey.revoke", target: c.req.param("id"), ip: ip(c) });
  return c.json({ ok: true });
});

export default app;
