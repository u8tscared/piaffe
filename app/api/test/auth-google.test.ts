import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { api, signup, uniq, env, sessionCookie } from "./auth-kit";
import { setFetch } from "../src/auth/google";
import { b64url } from "../src/lib/crypto";

let keys: CryptoKeyPair;
let kid = "kid-test-1";
let claims: Record<string, unknown> = {};
let tokenCalls: URLSearchParams[] = [];

async function sign(payload: Record<string, unknown>, k = keys.privateKey, kidH = kid) {
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const head = enc({ alg: "RS256", kid: kidH, typ: "JWT" }), body = enc(payload);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, new TextEncoder().encode(head + "." + body));
  return head + "." + body + "." + b64url(sig);
}

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", keys.publicKey)) as JsonWebKey;
  setFetch((async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://www.googleapis.com/oauth2/v3/certs")) {
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid, alg: "RS256", use: "sig" }] }), { headers: { "cache-control": "public, max-age=3600" } });
    }
    if (url === "https://oauth2.googleapis.com/token") {
      const p = new URLSearchParams(String(init?.body));
      tokenCalls.push(p);
      if (p.get("code") === "bad-code") return new Response('{"error":"invalid_grant"}', { status: 400 });
      const now = Math.floor(Date.now() / 1000);
      return Response.json({ id_token: await sign({ iss: "https://accounts.google.com", aud: env.GOOGLE_CLIENT_ID, iat: now, exp: now + 3600, email_verified: true, ...claims }) });
    }
    return new Response("inattendu", { status: 500 });
  }) as typeof fetch);
});
afterAll(() => setFetch(null));

/** Démarre la connexion Google et renvoie { state, nonce, cookie de state }. */
async function start(next = "/planning") {
  const r = await api("/auth/google/start?next=" + encodeURIComponent(next), { redirect: "manual" });
  expect(r.status).toBe(302);
  const loc = new URL(r.headers.get("location")!);
  const gs = (r.headers.getSetCookie().find((c: string) => c.startsWith("piaffe_gs=")) || "").split(";")[0];
  return { loc, state: loc.searchParams.get("state")!, nonce: loc.searchParams.get("nonce")!, gs };
}
const callback = (q: string, cookie: string) => api("/auth/google/callback?" + q, { cookie, redirect: "manual" });

describe("connexion Google (OpenID Connect)", () => {
  it("redirige vers Google avec state, PKCE S256, nonce et la bonne URI de retour", async () => {
    const { loc, gs } = await start();
    expect(loc.origin + loc.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(loc.searchParams.get("client_id")).toBe("google-client-test");
    expect(loc.searchParams.get("redirect_uri")).toBe("http://piaffe.test/auth/google/callback");
    expect(loc.searchParams.get("code_challenge_method")).toBe("S256");
    expect(loc.searchParams.get("code_challenge")!.length).toBe(43);
    expect(loc.searchParams.get("scope")).toBe("openid email profile");
    expect(gs).toMatch(/^piaffe_gs=/);
  });

  it("crée le compte, ouvre la session et redirige vers next ; envoie le vérificateur PKCE", async () => {
    const { state, nonce, gs } = await start("/planning?jour=mardi");
    const email = uniq("g");
    claims = { sub: "g-" + email, email, nonce, given_name: "Léa", family_name: "Martin" };
    const r = await callback(`code=ok&state=${state}`, gs);
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("http://piaffe.test/planning?jour=mardi");
    const cookie = sessionCookie(r);
    expect(cookie).toBeTruthy();
    expect(tokenCalls.at(-1)!.get("code_verifier")!.length).toBeGreaterThan(40);
    const me = (await (await api("/api/me", { cookie })).json()) as any;
    expect(me.user).toMatchObject({ email, first: "Léa", email_verified: true, google_linked: true, has_password: false });
  });

  it("relie un compte existant par e-mail vérifié, puis retrouve par google_sub", async () => {
    const { email, body } = await signup();
    await env.DB.prepare("UPDATE users SET email_verified_at = ? WHERE email = ?").bind(new Date().toISOString(), email).run();
    let s = await start();
    claims = { sub: "sub-lie-" + email, email, nonce: s.nonce };
    const r = await callback(`code=ok&state=${s.state}`, s.gs);
    const me = (await (await api("/api/me", { cookie: sessionCookie(r) })).json()) as any;
    expect(me.user.id).toBe(body.user.id);
    expect(me.user.has_password).toBe(true);
    s = await start();
    claims = { sub: "sub-lie-" + email, email: "autre-" + email, nonce: s.nonce };
    const r2 = await callback(`code=ok&state=${s.state}`, s.gs);
    expect(((await (await api("/api/me", { cookie: sessionCookie(r2) })).json()) as any).user.id).toBe(body.user.id);
  });

  it("compte existant jamais vérifié : retire le mot de passe et les sessions de l'occupant avant de lier", async () => {
    const { email, cookie: squatter } = await signup();
    const s = await start();
    claims = { sub: "sub-vrai-" + email, email, nonce: s.nonce };
    await callback(`code=ok&state=${s.state}`, s.gs);
    expect((await api("/api/me", { cookie: squatter })).status).toBe(401);
    const row = await env.DB.prepare("SELECT password_hash FROM users WHERE email = ?").bind(email).first<any>();
    expect(row.password_hash).toBeNull();
  });

  it("refuse : state absent du cookie, state rejoué, nonce faux, e-mail non vérifié, mauvaise audience, code refusé", async () => {
    let s = await start();
    claims = { sub: "x1", email: uniq(), nonce: s.nonce };
    expect((await callback(`code=ok&state=${s.state}`, "")).headers.get("location")).toContain("erreur=google_session");
    const ok = await callback(`code=ok&state=${s.state}`, s.gs);
    expect(ok.headers.get("location")).toBe("http://piaffe.test/planning");
    expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google_session");

    s = await start();
    claims = { sub: "x2", email: uniq(), nonce: "autre" };
    expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google");

    s = await start();
    claims = { sub: "x3", email: uniq(), nonce: s.nonce, email_verified: false };
    expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google_email");

    s = await start();
    claims = { sub: "x4", email: uniq(), nonce: s.nonce, aud: "autre-client" };
    const r4 = await callback(`code=ok&state=${s.state}`, s.gs);
    expect(r4.headers.get("location")).toContain("erreur=google");
    expect(sessionCookie(r4)).toBe("");

    s = await start();
    expect((await callback(`code=bad-code&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google");
    s = await start();
    expect((await callback(`error=access_denied&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google_annule");
  });

  it("refuse un jeton expiré, d'un autre émetteur ou mal signé", async () => {
    let s = await start();
    claims = { sub: "y1", email: uniq(), nonce: s.nonce, exp: Math.floor(Date.now() / 1000) - 3600 };
    expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google");
    s = await start();
    claims = { sub: "y2", email: uniq(), nonce: s.nonce, iss: "https://pirate.example" };
    expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toContain("erreur=google");
    // clé d'un attaquant avec le même kid
    const evil = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const { verifyIdToken } = await import("../src/auth/google");
    const now = Math.floor(Date.now() / 1000);
    const forged = await sign({ iss: "https://accounts.google.com", aud: env.GOOGLE_CLIENT_ID, exp: now + 60, sub: "z", email: "z@exemple.fr", email_verified: true, nonce: "n" }, evil.privateKey);
    await expect(verifyIdToken(env, forged, "n")).rejects.toThrow("jwt_signature");
    const good = await sign({ iss: "accounts.google.com", aud: env.GOOGLE_CLIENT_ID, exp: now + 60, sub: "z", email: "z@exemple.fr", email_verified: true, nonce: "n" });
    await expect(verifyIdToken(env, good, "n")).resolves.toMatchObject({ sub: "z" });
  });

  it("n'accepte que des redirections relatives", async () => {
    for (const next of ["https://pirate.example", "//pirate.example", "/\\pirate.example"]) {
      const s = await start(next);
      claims = { sub: "n-" + Math.random(), email: uniq(), nonce: s.nonce };
      expect((await callback(`code=ok&state=${s.state}`, s.gs)).headers.get("location")).toBe("http://piaffe.test/");
    }
  });
});
