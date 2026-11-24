import type { Env } from "../env";
import { b64url, b64urlDecode, randomToken, sha256 } from "../lib/crypto";
import { one, run } from "../lib/db";
import { nowIso } from "../lib/ids";

/** Appels sortants vers Google, remplaçables dans les tests. */
let fetcher: typeof fetch = (...a) => fetch(...a);
export function setFetch(f: typeof fetch | null) { fetcher = f || ((...a) => fetch(...a)); jwksCache = null; }

export const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const STATE_TTL_MS = 10 * 6e4;

export const redirectUri = (env: Env) => (env.APP_URL || "").replace(/\/+$/, "") + "/auth/google/callback";

/** next accepté seulement s'il est relatif au site (/chemin), jamais //hote ni \\hote ni URL absolue. */
export function safeNext(n: unknown): string {
  if (typeof n !== "string" || !n.startsWith("/") || n.startsWith("//") || n.startsWith("/\\") || n.length > 500) return "/";
  if (/[\u0000-\u001f\\]/.test(n)) return "/";
  return n;
}

/** Prépare l'URL d'autorisation Google : state + PKCE (S256) + nonce, stockés hachés 10 minutes. */
export async function startGoogle(env: Env, next: string): Promise<{ url: string; state: string }> {
  const state = randomToken(24), verifier = randomToken(48), nonce = randomToken(24);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  await run(env.DB, "INSERT INTO oauth_states (id, verifier, nonce, next, expires_at) VALUES (?,?,?,?,?)",
    await sha256(state), verifier, nonce, safeNext(next), new Date(Date.now() + STATE_TTL_MS).toISOString());
  const p = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || "", redirect_uri: redirectUri(env), response_type: "code", scope: "openid email profile",
    state, nonce, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account", access_type: "online",
  });
  return { url: GOOGLE_AUTH + "?" + p.toString(), state };
}

/** Consomme le state (usage unique). */
export async function takeState(env: Env, state: string) {
  const id = await sha256(state);
  const row = await one<{ verifier: string; nonce: string; next: string | null; expires_at: string }>(env.DB, "SELECT verifier, nonce, next, expires_at FROM oauth_states WHERE id = ?", id);
  if (!row) return null;
  const r = await run(env.DB, "DELETE FROM oauth_states WHERE id = ?", id);
  if (!r.meta.changes || row.expires_at < nowIso()) return null;
  return row;
}

export interface GoogleIdentity { sub: string; email: string; email_verified: boolean; given_name?: string; family_name?: string; name?: string; picture?: string }

/** Échange le code contre les jetons, puis vérifie l'id_token. Lève une Error au message technique (jamais montré tel quel). */
export async function exchangeCode(env: Env, code: string, verifier: string, nonce: string): Promise<GoogleIdentity> {
  const res = await fetcher(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID || "", client_secret: env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri(env), grant_type: "authorization_code", code_verifier: verifier,
    }).toString(),
  });
  if (!res.ok) throw new Error("token_exchange_" + res.status);
  const j = (await res.json()) as { id_token?: string };
  if (!j.id_token) throw new Error("no_id_token");
  return verifyIdToken(env, j.id_token, nonce);
}

let jwksCache: { keys: Record<string, CryptoKey>; exp: number } | null = null;

async function loadJwks(force = false): Promise<Record<string, CryptoKey>> {
  if (!force && jwksCache && jwksCache.exp > Date.now()) return jwksCache.keys;
  const res = await fetcher(GOOGLE_JWKS, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("jwks_" + res.status);
  const j = (await res.json()) as { keys: (JsonWebKey & { kid: string; alg?: string })[] };
  const keys: Record<string, CryptoKey> = {};
  for (const k of j.keys || []) {
    if (k.kty !== "RSA" || !k.kid) continue;
    keys[k.kid] = await crypto.subtle.importKey("jwk", { kty: "RSA", n: k.n, e: k.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  }
  const m = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  const ttl = Math.min(Math.max(m ? parseInt(m[1], 10) : 3600, 60), 86400) * 1000;
  jwksCache = { keys, exp: Date.now() + ttl };
  return keys;
}

const dec = new TextDecoder();
export async function verifyIdToken(env: Env, jwt: string, nonce: string): Promise<GoogleIdentity> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("jwt_format");
  const header = JSON.parse(dec.decode(b64urlDecode(parts[0])));
  const payload = JSON.parse(dec.decode(b64urlDecode(parts[1])));
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("jwt_alg");
  let keys = await loadJwks();
  if (!keys[header.kid]) keys = await loadJwks(true); // rotation des clés de Google
  const key = keys[header.kid];
  if (!key) throw new Error("jwt_kid");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlDecode(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!ok) throw new Error("jwt_signature");
  const now = Math.floor(Date.now() / 1000);
  if (!ISSUERS.includes(payload.iss)) throw new Error("jwt_iss");
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!env.GOOGLE_CLIENT_ID || !aud.includes(env.GOOGLE_CLIENT_ID)) throw new Error("jwt_aud");
  if (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== env.GOOGLE_CLIENT_ID) throw new Error("jwt_azp");
  if (typeof payload.exp !== "number" || payload.exp < now - 60) throw new Error("jwt_exp");
  if (typeof payload.iat === "number" && payload.iat > now + 300) throw new Error("jwt_iat");
  if (payload.nonce !== nonce) throw new Error("jwt_nonce");
  if (typeof payload.sub !== "string" || !payload.sub) throw new Error("jwt_sub");
  if (payload.email_verified !== true && payload.email_verified !== "true") throw new Error("email_not_verified");
  if (typeof payload.email !== "string") throw new Error("jwt_email");
  return { sub: payload.sub, email: payload.email, email_verified: true, given_name: payload.given_name, family_name: payload.family_name, name: payload.name, picture: payload.picture };
}
