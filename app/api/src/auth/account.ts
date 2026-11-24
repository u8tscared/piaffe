import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../env";
import { requireUser } from "../lib/auth";
import { audit, one, rateLimit, run } from "../lib/db";
import { emit } from "../lib/events";
import { ApiError, bad, body, isEmail, str, unauthorized } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { csrf } from "./csrf";
import { checkPasswordPolicy, dummyVerify, hashPassword, verifyPassword } from "./password";
import { clientIp, closeSession, isSecure, openSession, revokeSessions, slideSession, tokenForClient, tooMany } from "./session";
import { consumeToken, issueToken, TOKEN_TTL_MIN } from "./tokens";
import { appUrl, mail, WEB } from "./mailer";
import { clubsOf, getUser, getUserByEmail, normEmail, publicUser, type UserRow } from "./users";
import { exchangeCode, safeNext, startGoogle, takeState } from "./google";

const app = new Hono<AppEnv>();
app.use("/auth/*", csrf);
app.use("/api/me", csrf);
app.use("/api/me/*", csrf);

const MIN15 = 15 * 60, HOUR = 3600;
async function limit(c: Context<AppEnv>, key: string, max: number, win: number) {
  if (!(await rateLimit(c.env.DB, key, max, win))) throw tooMany();
}
const ip = (c: Context) => clientIp(c);

async function session(c: Context<AppEnv>, u: UserRow, status: 200 | 201 = 200, extra: Record<string, unknown> = {}) {
  const token = await openSession(c, u.id);
  const clubs = await clubsOf(c.env, u.id);
  const cur = await one<{ club_id: string | null }>(c.env.DB, "SELECT club_id FROM sessions WHERE id = ?", c.get("sessionId"));
  return c.json({ user: publicUser(u), clubs, current_club_id: cur?.club_id ?? null, ...extra, ...tokenForClient(c, token) }, status);
}

async function sendVerify(c: Context<AppEnv>, u: UserRow) {
  const token = await issueToken(c.env, "verify", u.id, u.email);
  await mail(c.env, { to: u.email, template: "verify_email",
    data: { first: u.first || "", email: u.email, action_url: appUrl(c.env, WEB.verify + "?token=" + token), expires_in_hours: TOKEN_TTL_MIN.verify / 60 } });
}

function nameField(v: unknown, f: string) { return str(v, f, { max: 80, optional: true }) || null; }

// ---------- Inscription, connexion ----------
app.post("/auth/signup", async (c) => {
  const b = await body<any>(c);
  const email = normEmail(str(b.email, "email", { max: 254 }));
  if (!isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  await limit(c, "signup:ip:" + ip(c), 10, HOUR);
  const password = checkPasswordPolicy(b.password, email);
  const first = nameField(b.first, "first"), last = nameField(b.last, "last");
  if (await getUserByEmail(c.env, email)) {
    throw new ApiError(409, "email_taken", "Un compte existe déjà avec cette adresse. Connectez-vous ou utilisez « Mot de passe oublié ».", { field: "email" });
  }
  const id = newId("usr");
  await run(c.env.DB, "INSERT INTO users (id, email, password_hash, first, last) VALUES (?,?,?,?,?)", id, email, await hashPassword(password), first, last);
  const u = (await getUser(c.env, id))!;
  await sendVerify(c, u);
  await audit(c.env.DB, { user_id: id, action: "auth.signup", ip: ip(c) });
  await emit(c.env, c.executionCtx, { type: "user.signed_up", user_id: id, email, via: "password" });
  return session(c, u, 201);
});

app.post("/auth/login", async (c) => {
  const b = await body<any>(c);
  const email = normEmail(str(b.email, "email", { max: 254 }));
  const password = typeof b.password === "string" ? b.password : "";
  if (!password) throw bad("missing_field", "Le champ « password » est obligatoire.", { field: "password" });
  await limit(c, "login:ip:" + ip(c), 10, MIN15);
  await limit(c, "login:email:" + email, 10, MIN15);
  const u = await getUserByEmail(c.env, email);
  if (!u || !u.password_hash) {
    await dummyVerify(password);
    throw new ApiError(401, "invalid_credentials", u && u.google_sub
      ? "Ce compte utilise la connexion Google. Cliquez sur « Continuer avec Google » ou demandez un lien de connexion."
      : "Adresse e-mail ou mot de passe incorrect.");
  }
  const v = await verifyPassword(password, u.password_hash);
  if (!v.ok) {
    await audit(c.env.DB, { user_id: u.id, action: "auth.login_failed", ip: ip(c) });
    throw new ApiError(401, "invalid_credentials", "Adresse e-mail ou mot de passe incorrect.");
  }
  if (v.needsRehash) await run(c.env.DB, "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", await hashPassword(password), nowIso(), u.id);
  await audit(c.env.DB, { user_id: u.id, action: "auth.login", ip: ip(c) });
  return session(c, u);
});

app.post("/auth/logout", async (c) => {
  const b = await c.req.json().catch(() => ({})) as any;
  const u = c.get("user");
  if (u && b && b.all === true) await revokeSessions(c.env, u.id);
  await closeSession(c);
  return c.json({ ok: true });
});

// ---------- Google (OpenID Connect) ----------
const GSTATE = "piaffe_gs";
app.get("/auth/google/start", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) return c.redirect(appUrl(c.env, WEB.login + "?erreur=google_indisponible"), 302);
  if (!(await rateLimit(c.env.DB, "google:ip:" + ip(c), 30, MIN15))) return c.redirect(appUrl(c.env, WEB.login + "?erreur=trop_de_tentatives"), 302);
  const { url, state } = await startGoogle(c.env, safeNext(c.req.query("next")));
  // Lie le state au navigateur : un lien de rappel volé ne peut pas ouvrir une session ailleurs.
  setCookie(c, GSTATE, state, { httpOnly: true, secure: isSecure(c.env), sameSite: "Lax", path: "/auth/google", maxAge: 600 });
  return c.redirect(url, 302);
});

app.get("/auth/google/callback", async (c) => {
  const fail = (code: string) => { deleteCookie(c, GSTATE, { path: "/auth/google" }); return c.redirect(appUrl(c.env, WEB.login + "?erreur=" + code), 302); };
  const q = c.req.query();
  if (q.error) return fail(q.error === "access_denied" ? "google_annule" : "google");
  const state = q.state || "", code = q.code || "";
  const cookieState = getCookie(c, GSTATE) || "";
  if (!state || !code || state !== cookieState) return fail("google_session");
  const st = await takeState(c.env, state);
  if (!st) return fail("google_session");
  let g;
  try { g = await exchangeCode(c.env, code, st.verifier, st.nonce); }
  catch (e) { console.error("Google OIDC", (e as Error).message); return fail((e as Error).message === "email_not_verified" ? "google_email" : "google"); }
  const db = c.env.DB;
  const email = normEmail(g.email);
  let u = await one<UserRow>(db, "SELECT * FROM users WHERE google_sub = ?", g.sub);
  let created = false;
  if (!u) {
    u = await getUserByEmail(c.env, email);
    if (u) {
      if (u.google_sub && u.google_sub !== g.sub) return fail("google_autre_compte");
      if (!u.email_verified_at) {
        // Compte créé avec cette adresse mais jamais vérifié : quelqu'un d'autre a pu le créer. On retire son mot de passe
        // et ses sessions avant de le confier au vrai titulaire de l'adresse.
        await run(db, "UPDATE users SET password_hash = NULL WHERE id = ?", u.id);
        await revokeSessions(c.env, u.id);
      }
      await run(db, "UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, ?), avatar_url = COALESCE(avatar_url, ?), updated_at = ? WHERE id = ?",
        g.sub, nowIso(), g.picture || null, nowIso(), u.id);
    } else {
      const id = newId("usr");
      await run(db, "INSERT INTO users (id, email, email_verified_at, google_sub, first, last, avatar_url) VALUES (?,?,?,?,?,?,?)",
        id, email, nowIso(), g.sub, (g.given_name || "").slice(0, 80) || null, (g.family_name || "").slice(0, 80) || null, g.picture || null);
      created = true;
    }
    u = (await one<UserRow>(db, "SELECT * FROM users WHERE google_sub = ?", g.sub))!;
  }
  await audit(db, { user_id: u.id, action: created ? "auth.signup" : "auth.login", data: { via: "google" }, ip: ip(c) });
  if (created) await emit(c.env, c.executionCtx, { type: "user.signed_up", user_id: u.id, email, via: "google" });
  deleteCookie(c, GSTATE, { path: "/auth/google" });
  await openSession(c, u.id);
  return c.redirect(appUrl(c.env, safeNext(st.next)), 302);
});

// ---------- Vérification de l'adresse ----------
app.post("/auth/verify", async (c) => {
  const b = await body<any>(c);
  const t = await consumeToken(c.env, ["verify", "email_change"], b.token);
  const u = await getUser(c.env, t.user_id);
  if (!u) throw bad("invalid_token", "Ce lien n'est pas valide.");
  if (t.kind === "verify") {
    if (normEmail(u.email) !== normEmail(t.email)) throw bad("token_stale", "Votre adresse a changé depuis l'envoi de ce lien. Demandez-en un nouveau.");
    await run(c.env.DB, "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?", nowIso(), nowIso(), u.id);
  } else {
    const other = await getUserByEmail(c.env, t.email);
    if (other && other.id !== u.id) throw new ApiError(409, "email_taken", "Cette adresse est déjà utilisée par un autre compte.");
    await run(c.env.DB, "UPDATE users SET email = ?, email_verified_at = ?, updated_at = ? WHERE id = ?", t.email, nowIso(), nowIso(), u.id);
    await audit(c.env.DB, { user_id: u.id, action: "auth.email_changed", ip: ip(c) });
  }
  return c.json({ ok: true, user: publicUser((await getUser(c.env, u.id))!) });
});

app.post("/auth/verify/resend", requireUser, async (c) => {
  const u = (await getUser(c.env, c.get("user")!.id))!;
  if (u.email_verified_at) return c.json({ ok: true, already_verified: true });
  await limit(c, "verify:user:" + u.id, 5, HOUR);
  await sendVerify(c, u);
  return c.json({ ok: true });
});

// ---------- Mot de passe oublié ----------
app.post("/auth/password/forgot", async (c) => {
  const b = await body<any>(c);
  const email = normEmail(str(b.email, "email", { max: 254 }));
  if (!isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  await limit(c, "forgot:ip:" + ip(c), 20, HOUR);
  const allowed = await rateLimit(c.env.DB, "forgot:email:" + email, 5, HOUR);
  const u = await getUserByEmail(c.env, email);
  if (u && allowed) {
    const token = await issueToken(c.env, "reset", u.id, u.email);
    await mail(c.env, { to: u.email, template: "reset_password",
      data: { first: u.first || "", email: u.email, action_url: appUrl(c.env, WEB.reset + "?token=" + token), expires_in_minutes: TOKEN_TTL_MIN.reset } });
  }
  return c.json({ ok: true, message: "Si un compte existe avec cette adresse, vous allez recevoir un e-mail pour choisir un nouveau mot de passe." });
});

app.post("/auth/password/reset", async (c) => {
  const b = await body<any>(c);
  await limit(c, "reset:ip:" + ip(c), 20, HOUR);
  if (typeof b.password !== "string" || !b.password) throw bad("missing_field", "Le champ « password » est obligatoire.", { field: "password" });
  // On vérifie la règle avant de consommer le jeton, pour qu'une faute de frappe ne grille pas le lien.
  checkPasswordPolicy(b.password);
  const t = await consumeToken(c.env, ["reset"], b.token);
  const u = await getUser(c.env, t.user_id);
  if (!u) throw bad("invalid_token", "Ce lien n'est pas valide.");
  checkPasswordPolicy(b.password, u.email);
  await run(c.env.DB, "UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), updated_at = ? WHERE id = ?",
    await hashPassword(b.password), nowIso(), nowIso(), u.id);
  await revokeSessions(c.env, u.id);
  await audit(c.env.DB, { user_id: u.id, action: "auth.password_reset", ip: ip(c) });
  return session(c, (await getUser(c.env, u.id))!);
});

// ---------- Lien magique ----------
app.post("/auth/magic", async (c) => {
  const b = await body<any>(c);
  const email = normEmail(str(b.email, "email", { max: 254 }));
  if (!isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
  await limit(c, "magic:ip:" + ip(c), 20, HOUR);
  const allowed = await rateLimit(c.env.DB, "magic:email:" + email, 5, HOUR);
  const u = await getUserByEmail(c.env, email);
  if (u && allowed) {
    const token = await issueToken(c.env, "magic", u.id, u.email, { next: safeNext(b.next) });
    await mail(c.env, { to: u.email, template: "magic_link",
      data: { first: u.first || "", email: u.email, action_url: appUrl(c.env, "/auth/magic/callback?token=" + token), expires_in_minutes: TOKEN_TTL_MIN.magic } });
  }
  return c.json({ ok: true, message: "Si un compte existe avec cette adresse, vous allez recevoir un lien de connexion valable 15 minutes." });
});

/**
 * Page intermédiaire : les antivirus des messageries ouvrent les liens des e-mails pour les analyser. Un simple GET
 * ne consomme donc pas le jeton ; la page envoie un POST (automatiquement, ou par le bouton si JavaScript est coupé).
 */
app.get("/auth/magic/callback", (c) => {
  const token = (c.req.query("token") || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 200);
  c.header("cache-control", "no-store");
  return c.html(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="same-origin"><title>Connexion à Piaffe</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f7f5f0;color:#1d1b16}form{text-align:center}button{font:inherit;padding:12px 22px;border-radius:10px;border:0;background:#1d1b16;color:#fff;cursor:pointer}</style></head>
<body><form method="post" action="/auth/magic/callback"><input type="hidden" name="token" value="${token}"><p>Connexion à votre espace Piaffe…</p><button type="submit">Me connecter</button></form>
<script>document.forms[0].submit()</script></body></html>`);
});

app.post("/auth/magic/callback", async (c) => {
  const isJson = (c.req.header("content-type") || "").includes("application/json");
  let token: unknown;
  if (isJson) token = (await body<any>(c)).token;
  else token = (await c.req.parseBody().catch(() => ({} as any)))["token"];
  await limit(c, "magiccb:ip:" + ip(c), 30, MIN15);
  let t;
  try { t = await consumeToken(c.env, ["magic"], token); }
  catch (e) { if (isJson) throw e; return c.redirect(appUrl(c.env, WEB.login + "?erreur=lien_invalide"), 303); }
  const u = await getUser(c.env, t.user_id);
  if (!u || normEmail(u.email) !== normEmail(t.email)) {
    if (isJson) throw bad("invalid_token", "Ce lien n'est pas valide.");
    return c.redirect(appUrl(c.env, WEB.login + "?erreur=lien_invalide"), 303);
  }
  await run(c.env.DB, "UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?", nowIso(), u.id);
  await audit(c.env.DB, { user_id: u.id, action: "auth.login", data: { via: "magic" }, ip: ip(c) });
  const next = safeNext(t.data.next);
  if (isJson) return session(c, (await getUser(c.env, u.id))!, 200, { next });
  await openSession(c, u.id);
  return c.redirect(appUrl(c.env, next), 303);
});

// ---------- Mon compte ----------
app.get("/api/me", requireUser, slideSession, async (c) => {
  const u = await getUser(c.env, c.get("user")!.id);
  if (!u) throw unauthorized();
  const m = c.get("membership");
  return c.json({ user: publicUser(u), clubs: await clubsOf(c.env, u.id), current_club_id: c.get("club")?.id ?? null,
    role: m?.role ?? null, person_ref: m?.person_ref ?? null });
});

app.patch("/api/me", requireUser, async (c) => {
  const b = await body<any>(c);
  const u = (await getUser(c.env, c.get("user")!.id))!;
  const sets: string[] = [], args: unknown[] = [];
  for (const f of ["first", "last", "phone"] as const) if (f in b) { sets.push(f + " = ?"); args.push(str(b[f], f, { max: f === "phone" ? 30 : 80, optional: true }) || null); }
  if ("locale" in b) { if (!["fr", "en"].includes(b.locale)) throw bad("invalid_field", "Langue non prise en charge.", { field: "locale" }); sets.push("locale = ?"); args.push(b.locale); }
  let pendingEmail: string | null = null;
  if (b.new_password !== undefined) {
    if (u.password_hash) {
      await limit(c, "pwchange:user:" + u.id, 10, MIN15);
      const v = await verifyPassword(typeof b.current_password === "string" ? b.current_password : "", u.password_hash);
      if (!v.ok) throw new ApiError(403, "invalid_credentials", "Le mot de passe actuel est incorrect.", { field: "current_password" });
    }
    checkPasswordPolicy(b.new_password, u.email);
    sets.push("password_hash = ?"); args.push(await hashPassword(b.new_password));
  }
  if (b.email !== undefined && normEmail(String(b.email)) !== normEmail(u.email)) {
    const email = normEmail(str(b.email, "email", { max: 254 }));
    if (!isEmail(email)) throw bad("invalid_email", "Cette adresse e-mail n'est pas valide.", { field: "email" });
    if (await getUserByEmail(c.env, email)) throw new ApiError(409, "email_taken", "Cette adresse est déjà utilisée par un autre compte.", { field: "email" });
    await limit(c, "emailchange:user:" + u.id, 5, HOUR);
    const token = await issueToken(c.env, "email_change", u.id, email);
    await mail(c.env, { to: email, template: "verify_email",
      data: { first: u.first || "", email, change: true, action_url: appUrl(c.env, WEB.verify + "?token=" + token), expires_in_hours: TOKEN_TTL_MIN.email_change / 60 } });
    pendingEmail = email;
  }
  if (sets.length) {
    await run(c.env.DB, `UPDATE users SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`, ...args, nowIso(), u.id);
  }
  if (b.new_password !== undefined) {
    await revokeSessions(c.env, u.id, c.get("sessionId"));
    await audit(c.env.DB, { user_id: u.id, action: "auth.password_changed", ip: ip(c) });
  }
  return c.json({ user: publicUser((await getUser(c.env, u.id))!), pending_email: pendingEmail });
});

app.post("/api/me/club", requireUser, async (c) => {
  const b = await body<any>(c);
  const clubId = str(b.club_id, "club_id", { max: 64 });
  const userId = c.get("user")!.id;
  const m = await one(c.env.DB, "SELECT role FROM memberships WHERE user_id = ? AND club_id = ? AND status = 'active'", userId, clubId);
  if (!m) throw new ApiError(403, "not_member", "Vous n'avez pas accès à ce club.");
  if (c.get("sessionId")) await run(c.env.DB, "UPDATE sessions SET club_id = ? WHERE id = ?", clubId, c.get("sessionId"));
  await run(c.env.DB, "UPDATE users SET last_club_id = ? WHERE id = ?", clubId, userId);
  return c.json({ ok: true, current_club_id: clubId, clubs: await clubsOf(c.env, userId) });
});

export default app;
