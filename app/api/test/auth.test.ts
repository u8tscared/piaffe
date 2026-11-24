import { describe, it, expect } from "vitest";
import { api, post, signup, uniq, PW, lastMail, tokenFrom, sessionCookie, env, mails } from "./auth-kit";
import { hashPassword, verifyPassword, checkPasswordPolicy } from "../src/auth/password";
import { seed } from "./helpers";

describe("mots de passe", () => {
  it("hache en PBKDF2-SHA256 au format attendu et vérifie", async () => {
    const h = await hashPassword("un mot de passe solide");
    expect(h).toMatch(/^pbkdf2\$sha256\$100000\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
    expect((await verifyPassword("un mot de passe solide", h)).ok).toBe(true);
    expect((await verifyPassword("un mot de passe faux", h)).ok).toBe(false);
    expect((await verifyPassword("x", null)).ok).toBe(false);
  });
  it("signale qu'un ancien hachage doit être mis à niveau", async () => {
    const old = await hashPassword("ancien-mot-de-passe", 20000);
    const v = await verifyPassword("ancien-mot-de-passe", old);
    expect(v).toEqual({ ok: true, needsRehash: true });
  });
  it("refuse les mots de passe trop courts ou trop courants", () => {
    expect(() => checkPasswordPolicy("court")).toThrow(/10 caractères/);
    expect(() => checkPasswordPolicy("azertyuiop")).toThrow(/courant/);
    expect(() => checkPasswordPolicy("aaaaaaaaaaaa")).toThrow(/courant/);
    expect(checkPasswordPolicy("galop sept au soleil")).toBe("galop sept au soleil");
  });
});

describe("inscription et connexion", () => {
  it("inscrit, ouvre la session par cookie et envoie verify_email", async () => {
    const email = uniq("lea");
    const { r, cookie, body } = await signup(email);
    expect(r.status).toBe(201);
    expect(body.user.email).toBe(email);
    expect(body.user.email_verified).toBe(false);
    expect(body.user).not.toHaveProperty("password_hash");
    expect(body.session_token).toBeUndefined();
    const sc = r.headers.get("set-cookie")!;
    expect(sc).toMatch(/piaffe_s=/);
    expect(sc).toMatch(/HttpOnly/i);
    expect(sc).toMatch(/SameSite=Lax/i);
    expect(sc).toMatch(/Max-Age=2592000/);
    expect(sc).not.toMatch(/Secure/); // APP_URL de test en http
    const m = lastMail("verify_email", email)!;
    expect(String(m.data.action_url)).toMatch(/^http:\/\/piaffe\.test\/verifier-email\?token=/);
    expect(m.data.first).toBe("Léa");
    const me = await api("/api/me", { cookie });
    expect(me.status).toBe(200);
    expect(((await me.json()) as any).user.email).toBe(email);
  });

  it("refuse une adresse déjà prise, un mot de passe faible, un e-mail invalide", async () => {
    const { email } = await signup();
    expect((await post("/auth/signup", { email, password: PW })).status).toBe(409);
    expect(((await (await post("/auth/signup", { email: uniq(), password: "123456789" })).json()) as any).error.code).toBe("weak_password");
    expect((await post("/auth/signup", { email: "pas-un-email", password: PW })).status).toBe(400);
  });

  it("connecte avec le bon mot de passe, refuse le mauvais avec le même message", async () => {
    const { email } = await signup();
    const ok = await post("/auth/login", { email: email.toUpperCase(), password: PW });
    expect(ok.status).toBe(200);
    const b = (await ok.json()) as any;
    expect(b.user.email).toBe(email);
    expect(Array.isArray(b.clubs)).toBe(true);
    const bad = await post("/auth/login", { email, password: "mauvais mot de passe" });
    const nobody = await post("/auth/login", { email: uniq(), password: "mauvais mot de passe" });
    expect(bad.status).toBe(401);
    expect(nobody.status).toBe(401);
    expect(((await bad.json()) as any).error.message).toBe(((await nobody.json()) as any).error.message);
  });

  it("renvoie le jeton aux applis natives et l'accepte en Bearer", async () => {
    const { email } = await signup();
    const r = await post("/auth/login", { email, password: PW }, { headers: { "x-piaffe-client": "native" } });
    const b = (await r.json()) as any;
    expect(b.session_token).toBeTruthy();
    const me = await api("/api/me", { token: b.session_token });
    expect(me.status).toBe(200);
  });

  it("limite les tentatives de connexion par adresse (10 / 15 min)", async () => {
    const { email } = await signup();
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await post("/auth/login", { email, password: "faux-mot-de-passe" })).status;
    expect(last).toBe(429);
  });

  it("met à niveau un hachage aux anciens paramètres à la connexion", async () => {
    const { email } = await signup();
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE email = ?").bind(await hashPassword(PW, 20000), email).run();
    expect((await post("/auth/login", { email, password: PW })).status).toBe(200);
    const row = await env.DB.prepare("SELECT password_hash FROM users WHERE email = ?").bind(email).first<any>();
    expect(row.password_hash).toMatch(/^pbkdf2\$sha256\$100000\$/);
  });

  it("déconnecte : la session ne marche plus", async () => {
    const { cookie } = await signup();
    expect((await post("/auth/logout", {}, { cookie })).status).toBe(200);
    expect((await api("/api/me", { cookie })).status).toBe(401);
  });

  it("protection CSRF : un POST par cookie sans Origin ni X-Requested-With est refusé", async () => {
    const { cookie } = await signup();
    const r = await api("/api/me", { method: "PATCH", json: { first: "Zoé" }, cookie, noCsrf: true });
    expect(r.status).toBe(403);
    expect(((await r.json()) as any).error.code).toBe("csrf");
    const r2 = await api("/api/me", { method: "PATCH", json: { first: "Zoé" }, cookie, noCsrf: true, headers: { origin: "http://piaffe.test" } });
    expect(r2.status).toBe(200);
    const r3 = await api("/api/me", { method: "PATCH", json: { first: "Zoé" }, cookie, noCsrf: true, headers: { origin: "https://pirate.example" } });
    expect(r3.status).toBe(403);
  });
});

describe("vérification, mot de passe oublié, lien magique", () => {
  it("vérifie l'adresse avec le jeton, une seule fois", async () => {
    const { email } = await signup();
    const token = tokenFrom(lastMail("verify_email", email));
    const r = await post("/auth/verify", { token });
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).user.email_verified).toBe(true);
    const again = await post("/auth/verify", { token });
    expect(((await again.json()) as any).error.code).toBe("token_used");
    expect(((await (await post("/auth/verify", { token: "x".repeat(43) })).json()) as any).error.code).toBe("invalid_token");
  });

  it("renvoie l'e-mail de vérification à la demande", async () => {
    const { email, cookie } = await signup();
    const before = mails.length;
    expect((await post("/auth/verify/resend", {}, { cookie })).status).toBe(200);
    expect(mails.length).toBe(before + 1);
    expect((await post("/auth/verify/resend", {})).status).toBe(401);
    expect(lastMail("verify_email", email)).toBeTruthy();
  });

  it("mot de passe oublié : même réponse que l'adresse existe ou non, puis réinitialisation", async () => {
    const { email, cookie: oldCookie } = await signup();
    const a = await post("/auth/password/forgot", { email });
    const b = await post("/auth/password/forgot", { email: uniq() });
    expect(a.status).toBe(200);
    expect(await a.text()).toBe(await b.text());
    const m = lastMail("reset_password", email)!;
    expect(m.data.expires_in_minutes).toBe(60);
    const token = tokenFrom(m);
    // un mot de passe trop faible ne consomme pas le lien
    expect((await post("/auth/password/reset", { token, password: "court" })).status).toBe(400);
    const r = await post("/auth/password/reset", { token, password: "Nouveau-mot-de-passe-42" });
    expect(r.status).toBe(200);
    expect(sessionCookie(r)).toBeTruthy();
    expect((await api("/api/me", { cookie: oldCookie })).status).toBe(401); // anciennes sessions révoquées
    expect((await post("/auth/login", { email, password: "Nouveau-mot-de-passe-42" })).status).toBe(200);
    expect((await post("/auth/password/reset", { token, password: "Encore-un-autre-42" })).status).toBe(400);
  });

  it("refuse un jeton de réinitialisation expiré", async () => {
    const { email } = await signup();
    await post("/auth/password/forgot", { email });
    const token = tokenFrom(lastMail("reset_password", email));
    await env.DB.prepare("UPDATE auth_tokens SET expires_at = '2000-01-01T00:00:00.000Z' WHERE kind = 'reset'").run();
    const r = await post("/auth/password/reset", { token, password: "Nouveau-mot-de-passe-42" });
    expect(((await r.json()) as any).error.code).toBe("token_expired");
  });

  it("lien magique : le GET ne consomme pas le jeton, le POST ouvre la session et redirige vers next", async () => {
    const { email } = await signup();
    expect((await post("/auth/magic", { email, next: "/planning" })).status).toBe(200);
    const m = lastMail("magic_link", email)!;
    expect(String(m.data.action_url)).toMatch(/^http:\/\/piaffe\.test\/auth\/magic\/callback\?token=/);
    const token = tokenFrom(m);
    const page = await api("/auth/magic/callback?token=" + token);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('method="post"');
    const r = await api("/auth/magic/callback", { method: "POST", body: new URLSearchParams({ token }), headers: { "content-type": "application/x-www-form-urlencoded" }, redirect: "manual" });
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://piaffe.test/planning");
    expect(sessionCookie(r)).toBeTruthy();
    const again = await post("/auth/magic/callback", { token });
    expect(again.status).toBe(400);
  });

  it("lien magique : next absolu ignoré, réponse identique pour une adresse inconnue", async () => {
    const { email } = await signup();
    const a = await post("/auth/magic", { email, next: "//pirate.example/x" });
    const b = await post("/auth/magic", { email: uniq() });
    expect(await a.text()).toBe(await b.text());
    const r = await post("/auth/magic/callback", { token: tokenFrom(lastMail("magic_link", email)) });
    expect(((await r.json()) as any).next).toBe("/");
  });
});

describe("mon compte", () => {
  it("modifie le profil et change le mot de passe en révoquant les autres sessions", async () => {
    const { email, cookie } = await signup();
    const other = sessionCookie(await post("/auth/login", { email, password: PW }));
    const r = await api("/api/me", { method: "PATCH", json: { first: "Chloé", phone: "06 12 34 56 78", current_password: PW, new_password: "Un-autre-mot-de-passe-7" }, cookie });
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).user.first).toBe("Chloé");
    expect((await api("/api/me", { cookie })).status).toBe(200);
    expect((await api("/api/me", { cookie: other })).status).toBe(401);
    const wrong = await api("/api/me", { method: "PATCH", json: { current_password: "faux", new_password: "Encore-un-autre-7" }, cookie });
    expect(wrong.status).toBe(403);
  });

  it("change l'adresse e-mail après confirmation sur la nouvelle adresse", async () => {
    const { cookie } = await signup();
    const neu = uniq("new");
    const r = await api("/api/me", { method: "PATCH", json: { email: neu }, cookie });
    expect(((await r.json()) as any).pending_email).toBe(neu);
    const v = await post("/auth/verify", { token: tokenFrom(lastMail("verify_email", neu)) });
    expect(((await v.json()) as any).user.email).toBe(neu);
  });

  it("change de club courant seulement vers un club dont on est membre", async () => {
    const a = await seed("owner");
    const b = await seed("member", { email: a.email + ".x" });
    await env.DB.prepare("INSERT INTO memberships (user_id, club_id, role) VALUES (?,?, 'coach')").bind(a.userId, b.clubId).run();
    const r = await post("/api/me/club", { club_id: b.clubId }, { token: a.token });
    expect(r.status).toBe(200);
    const me = (await (await api("/api/me", { token: a.token })).json()) as any;
    expect(me.current_club_id).toBe(b.clubId);
    expect(me.role).toBe("coach");
    expect(me.clubs.length).toBe(2);
    const c = await seed("owner");
    expect((await post("/api/me/club", { club_id: c.clubId }, { token: a.token })).status).toBe(403);
  });

  it("session glissante : l'échéance est repoussée", async () => {
    const s = await seed("owner");
    await api("/api/me", { token: s.token });
    const row = await env.DB.prepare("SELECT expires_at FROM sessions WHERE user_id = ?").bind(s.userId).first<any>();
    expect(Date.parse(row.expires_at) - Date.now()).toBeGreaterThan(29 * 864e5);
  });

  it("le cron purge sessions et jetons expirés", async () => {
    const s = await seed("owner");
    await env.DB.prepare("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z' WHERE user_id = ?").bind(s.userId).run();
    const { cron } = await import("../src/auth/routes");
    await cron(env, "*/10 * * * *");
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ?").bind(s.userId).first<any>();
    expect(n.n).toBe(0);
  });
});
