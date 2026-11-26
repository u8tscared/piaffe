import type { Env, Role } from "../env";
import { all, audit, json, one, rateLimit, run } from "../lib/db";
import { b64url, hmacSha256, randomToken, safeEqual, sha256 } from "../lib/crypto";
import { newId, nowIso } from "../lib/ids";
import { MCP_ROLES } from "./data";

/**
 * OAuth 2.1 du connecteur (le serveur d'autorisation est le Worker Stabl lui-même) :
 *  - clients publics seulement (token_endpoint_auth_method « none »), PKCE S256 obligatoire ;
 *  - enregistrement dynamique (RFC 7591) ou document de métadonnées du client (client_id = URL https) ;
 *  - indicateur de ressource (RFC 8707) accepté s'il désigne ce serveur ;
 *  - jeton d'accès 1 h, jeton de renouvellement 90 jours remplacé à chaque usage ;
 *  - l'accord est donné par la personne connectée à Stabl, pour UN club où elle est gérante ou employée.
 */
export const TTL = { request: 10 * 60e3, code: 5 * 60e3, access: 3600e3, refresh: 90 * 864e5 };
export const SCOPES = ["lecture", "ecriture"];

export class OAuthError extends Error {
  constructor(public code: string, public status: 400 | 401 | 403 | 404 | 405 | 429 = 400, public description?: string) { super(description || code); }
}

export function base(env: Env) {
  let origin = "https://app.stablapp.fr";
  try { origin = new URL(env.APP_URL).origin; } catch { /* valeur par défaut */ }
  return { origin, issuer: origin, resource: origin + "/mcp", meta: origin + "/.well-known/oauth-protected-resource/mcp" };
}

export function metaResource(env: Env) {
  const b = base(env);
  return { resource: b.resource, authorization_servers: [b.issuer], bearer_methods_supported: ["header"], scopes_supported: SCOPES, resource_name: "Stabl", resource_documentation: "https://stablapp.fr" };
}
export function metaServer(env: Env) {
  const b = base(env);
  return {
    issuer: b.issuer,
    authorization_endpoint: b.origin + "/oauth/authorize",
    token_endpoint: b.origin + "/oauth/token",
    registration_endpoint: b.origin + "/oauth/register",
    revocation_endpoint: b.origin + "/oauth/revoke",
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: SCOPES,
    authorization_response_iss_parameter_supported: true,
    client_id_metadata_document_supported: true,
    service_documentation: "https://stablapp.fr",
    ui_locales_supported: ["fr"],
  };
}

// ---------- Adresses de retour ----------
export function okRedirect(u: unknown): u is string {
  if (typeof u !== "string" || u.length > 600 || /[\s<>"]/.test(u)) return false;
  let x: URL; try { x = new URL(u); } catch { return false; }
  if (x.hash) return false;
  if (x.protocol === "https:") return !!x.hostname;
  if (x.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(x.hostname);
  // applications installées (cursor://, vscode://…) ; jamais javascript:, data:, file:…
  return /^[a-z][a-z0-9+.-]{2,40}:$/.test(x.protocol) && !["javascript:", "data:", "file:", "vbscript:", "blob:", "about:", "ftp:", "ws:", "wss:"].includes(x.protocol);
}
export function withQuery(u: string, q: Record<string, string | undefined>) {
  const x = new URL(u);
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== "") x.searchParams.set(k, v);
  return x.toString();
}
export const hostOf = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.hostname : x.protocol.replace(":", ""); } catch { return ""; } };
const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

// ---------- Clients ----------
let fetcher: typeof fetch = (...a) => fetch(...a);
/** Pour les tests : remplace fetch (lecture des documents de métadonnées des clients). */
export function setMcpFetch(f: typeof fetch) { fetcher = f; }

export async function register(env: Env, b: any, ip: string) {
  if (!(await rateLimit(env.DB, "mcp:register:" + ip, 20, 3600))) throw new OAuthError("temporarily_unavailable", 429, "Trop d'enregistrements depuis cette adresse. Réessayez dans une heure.");
  const uris: unknown[] = Array.isArray(b?.redirect_uris) ? b.redirect_uris.slice(0, 10) : [];
  if (!uris.length || !uris.every(okRedirect)) throw new OAuthError("invalid_redirect_uri", 400, "redirect_uris : adresses https (ou locales) attendues.");
  const method = b?.token_endpoint_auth_method;
  if (method && method !== "none") throw new OAuthError("invalid_client_metadata", 400, "Seuls les clients publics (token_endpoint_auth_method « none ») sont acceptés, avec PKCE.");
  const id = "stc_" + randomToken(18), name = s(b?.client_name, 80) || "Assistant";
  await run(env.DB, "INSERT INTO mcp_clients (id, name, redirect_uris, kind) VALUES (?,?,?,'dcr')", id, name, JSON.stringify(uris));
  return { client_id: id, client_id_issued_at: Math.floor(Date.now() / 1000), client_name: name, redirect_uris: uris, token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: SCOPES.join(" ") };
}

/** Client enregistré, ou décrit par son document de métadonnées (client_id = URL https), relu au plus une fois par jour. */
export async function getClient(env: Env, id: string): Promise<{ id: string; name: string; redirect_uris: string[] } | null> {
  if (!id || id.length > 300) return null;
  const row = await one<{ id: string; name: string; redirect_uris: string; kind: string; fetched_at: string | null }>(env.DB, "SELECT id, name, redirect_uris, kind, fetched_at FROM mcp_clients WHERE id = ?", id);
  const fresh = row && (row.kind !== "cimd" || (row.fetched_at && Date.now() - Date.parse(row.fetched_at) < 864e5));
  if (row && fresh) return { id: row.id, name: row.name, redirect_uris: json<string[]>(row.redirect_uris, []) };
  if (!/^https:\/\/[^/\s]+\/\S*$/.test(id)) return null;
  let doc: any = null;
  try {
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 5000);
    const r = await fetcher(id, { headers: { accept: "application/json" }, signal: ctl.signal, redirect: "error" });
    clearTimeout(tm);
    const txt = r.ok ? await r.text() : "";
    if (txt.length <= 10000) doc = JSON.parse(txt);
  } catch { doc = null; }
  if (!doc || doc.client_id !== id) return row ? { id: row.id, name: row.name, redirect_uris: json<string[]>(row.redirect_uris, []) } : null;
  const uris = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.slice(0, 10).filter(okRedirect) : [];
  if (!uris.length) return null;
  const name = s(doc.client_name, 80) || hostOf(id) || "Assistant";
  await run(env.DB, `INSERT INTO mcp_clients (id, name, redirect_uris, kind, fetched_at) VALUES (?,?,?,'cimd',?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, redirect_uris = excluded.redirect_uris, fetched_at = excluded.fetched_at`, id, name, JSON.stringify(uris), nowIso());
  return { id, name, redirect_uris: uris };
}

// ---------- Demande d'accord ----------
export interface AuthRequest { client_id: string; client_name: string; redirect_uri: string; state: string; code_challenge: string; scope: string; expires_at: string }

/**
 * Valide la demande de l'assistant. Erreur sur le client ou l'adresse de retour : on ne redirige pas (OAuthError).
 * Autre erreur : on renvoie l'assistant vers son adresse de retour avec l'erreur. Sinon : on garde la demande 10 minutes.
 */
export async function startAuthorize(env: Env, q: Record<string, string>): Promise<{ request: string } | { redirect: string }> {
  const cid = s(q.client_id, 300);
  const cl = cid ? await getClient(env, cid) : null;
  if (!cl) throw new OAuthError("invalid_client", 400, "Assistant inconnu : il doit d'abord s'enregistrer auprès de Stabl.");
  const ru = s(q.redirect_uri, 600) || (cl.redirect_uris.length === 1 ? cl.redirect_uris[0] : "");
  if (!cl.redirect_uris.includes(ru)) throw new OAuthError("invalid_request", 400, "L'adresse de retour ne correspond pas à celle enregistrée par l'assistant.");
  const state = s(q.state, 600);
  const back = (error: string, d: string) => ({ redirect: withQuery(ru, { error, error_description: d, state, iss: base(env).issuer }) });
  if (q.response_type !== "code") return back("unsupported_response_type", "response_type=code attendu");
  const cc = s(q.code_challenge, 128);
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(cc) || q.code_challenge_method !== "S256") return back("invalid_request", "PKCE S256 obligatoire");
  if (q.resource && q.resource.replace(/\/+$/, "") !== base(env).resource && q.resource.replace(/\/+$/, "") !== base(env).origin) return back("invalid_target", "Cette ressource n'est pas servie ici.");
  const asked = s(q.scope, 200).split(/\s+/).filter(Boolean);
  if (asked.some((x) => !SCOPES.includes(x) && !["openid", "profile", "email", "offline_access"].includes(x))) return back("invalid_scope", "Droits possibles : lecture, ecriture.");
  const scope = asked.includes("ecriture") ? "lecture ecriture" : "lecture";
  const id = randomToken(24);
  await run(env.DB, "INSERT INTO mcp_requests (id, client_id, redirect_uri, state, code_challenge, scope, expires_at) VALUES (?,?,?,?,?,?,?)",
    await sha256(id), cl.id, ru, state, cc, scope, new Date(Date.now() + TTL.request).toISOString());
  return { request: id };
}

export async function getRequest(env: Env, id: string): Promise<AuthRequest | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id || "")) return null;
  const r = await one<any>(env.DB, "SELECT r.*, c.name AS client_name FROM mcp_requests r JOIN mcp_clients c ON c.id = r.client_id WHERE r.id = ?", await sha256(id));
  if (!r || r.expires_at < nowIso()) return null;
  return r;
}

/** Jeton anti-falsification du formulaire d'accord : lié à la demande et à la session. */
export async function consentToken(env: Env, request: string, sessionId: string) {
  return b64url(await hmacSha256(env.SESSION_SECRET, "mcp-consent|" + request + "|" + sessionId));
}
export async function checkConsentToken(env: Env, request: string, sessionId: string, t: string) {
  return safeEqual(await consentToken(env, request, sessionId), t || "");
}

/** Clubs où cette personne peut relier un assistant. */
export async function clubsFor(env: Env, userId: string) {
  return all<{ id: string; name: string; role: Role }>(env.DB,
    `SELECT c.id, c.name, m.role FROM memberships m JOIN clubs c ON c.id = m.club_id
     WHERE m.user_id = ? AND m.status = 'active' AND m.role IN (${MCP_ROLES.map(() => "?").join(",")}) ORDER BY c.name`, userId, ...MCP_ROLES);
}

export async function approve(env: Env, request: string, user: { id: string }, clubId: string, write: boolean, ip: string | null) {
  const r = await getRequest(env, request);
  if (!r) throw new OAuthError("expired", 400, "Cette demande a expiré. Relancez la connexion depuis l'assistant.");
  const club = (await clubsFor(env, user.id)).find((c) => c.id === clubId);
  if (!club) throw new OAuthError("forbidden", 403, "Vous ne pouvez pas relier un assistant à ce club.");
  const scopes = write ? ["lecture", "ecriture"] : ["lecture"];
  const gid = newId("stg"), code = randomToken(32);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO mcp_grants (id, club_id, user_id, client_id, client_name, client_host, scopes) VALUES (?,?,?,?,?,?,?)")
      .bind(gid, club.id, user.id, r.client_id, r.client_name, hostOf(r.redirect_uri), JSON.stringify(scopes)),
    env.DB.prepare("INSERT INTO mcp_codes (id, grant_id, client_id, redirect_uri, code_challenge, expires_at) VALUES (?,?,?,?,?,?)")
      .bind(await sha256(code), gid, r.client_id, r.redirect_uri, r.code_challenge, new Date(Date.now() + TTL.code).toISOString()),
    env.DB.prepare("DELETE FROM mcp_requests WHERE id = ?").bind(await sha256(request)),
  ]);
  await audit(env.DB, { club_id: club.id, user_id: user.id, action: "mcp.grant", target: gid, data: { client: r.client_name, host: hostOf(r.redirect_uri), scopes }, ip });
  return withQuery(r.redirect_uri, { code, state: r.state, iss: base(env).issuer });
}

export async function deny(env: Env, request: string) {
  const r = await getRequest(env, request);
  if (!r) throw new OAuthError("expired", 400, "Cette demande a expiré. Relancez la connexion depuis l'assistant.");
  await run(env.DB, "DELETE FROM mcp_requests WHERE id = ?", await sha256(request));
  return withQuery(r.redirect_uri, { error: "access_denied", error_description: "La personne a refusé l'accès.", state: r.state, iss: base(env).issuer });
}

// ---------- Jetons ----------
async function grantAlive(env: Env, gid: string) {
  return one<{ id: string; scopes: string }>(env.DB, "SELECT id, scopes FROM mcp_grants WHERE id = ? AND revoked_at IS NULL", gid);
}
async function issue(env: Env, gid: string, clientId: string, scopes: string) {
  const at = "stm_at_" + randomToken(32), rt = "stm_rt_" + randomToken(32), now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO mcp_tokens (id, kind, grant_id, client_id, expires_at) VALUES (?,?,?,?,?)").bind(await sha256(at), "access", gid, clientId, new Date(now + TTL.access).toISOString()),
    env.DB.prepare("INSERT INTO mcp_tokens (id, kind, grant_id, client_id, expires_at) VALUES (?,?,?,?,?)").bind(await sha256(rt), "refresh", gid, clientId, new Date(now + TTL.refresh).toISOString()),
  ]);
  return { access_token: at, token_type: "Bearer", expires_in: TTL.access / 1000, refresh_token: rt, scope: json<string[]>(scopes, ["lecture"]).join(" ") };
}

export async function token(env: Env, b: Record<string, string>) {
  if (b.grant_type === "authorization_code") {
    const code = s(b.code, 200);
    if (!code) throw new OAuthError("invalid_grant");
    const id = await sha256(code);
    const c = await one<any>(env.DB, "SELECT * FROM mcp_codes WHERE id = ?", id);
    if (!c) throw new OAuthError("invalid_grant", 400, "Code inconnu ou déjà utilisé.");
    await run(env.DB, "DELETE FROM mcp_codes WHERE id = ?", id); // usage unique, quoi qu'il arrive ensuite
    if (c.expires_at < nowIso() || (b.client_id && c.client_id !== b.client_id) || (b.redirect_uri && b.redirect_uri !== c.redirect_uri)) throw new OAuthError("invalid_grant", 400, "Code expiré ou émis pour un autre assistant.");
    const v = s(b.code_verifier, 200);
    const enc = new TextEncoder();
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(v) || b64url(await crypto.subtle.digest("SHA-256", enc.encode(v))) !== c.code_challenge) throw new OAuthError("invalid_grant", 400, "code_verifier refusé.");
    if (b.resource && b.resource.replace(/\/+$/, "") !== base(env).resource && b.resource.replace(/\/+$/, "") !== base(env).origin) throw new OAuthError("invalid_target");
    const g = await grantAlive(env, c.grant_id);
    if (!g) throw new OAuthError("invalid_grant", 400, "L'accès a été retiré.");
    return issue(env, g.id, c.client_id, g.scopes);
  }
  if (b.grant_type === "refresh_token") {
    const rt = s(b.refresh_token, 200);
    if (!rt) throw new OAuthError("invalid_grant");
    const id = await sha256(rt);
    const t = await one<any>(env.DB, "SELECT * FROM mcp_tokens WHERE id = ? AND kind = 'refresh'", id);
    if (!t || t.expires_at < nowIso() || (b.client_id && b.client_id !== t.client_id)) throw new OAuthError("invalid_grant", 400, "Jeton de renouvellement inconnu ou expiré : reconnectez Stabl dans l'assistant.");
    await run(env.DB, "DELETE FROM mcp_tokens WHERE id = ?", id); // remplacé à chaque usage
    const g = await grantAlive(env, t.grant_id);
    if (!g) throw new OAuthError("invalid_grant", 400, "L'accès a été retiré.");
    return issue(env, g.id, t.client_id, g.scopes);
  }
  throw new OAuthError("unsupported_grant_type");
}

export async function revokeToken(env: Env, tok: string) {
  if (tok) await run(env.DB, "DELETE FROM mcp_tokens WHERE id = ?", await sha256(tok));
}

/** Jeton d'accès → accord vivant (ou null). */
export async function accessGrant(env: Env, tok: string) {
  if (!/^stm_at_[A-Za-z0-9_-]{20,80}$/.test(tok)) return null;
  const t = await one<{ grant_id: string; expires_at: string }>(env.DB, "SELECT grant_id, expires_at FROM mcp_tokens WHERE id = ? AND kind = 'access'", await sha256(tok));
  if (!t || t.expires_at < nowIso()) return null;
  return one<{ id: string; club_id: string; user_id: string; client_name: string; scopes: string; last_used_at: string | null }>(env.DB,
    "SELECT id, club_id, user_id, client_name, scopes, last_used_at FROM mcp_grants WHERE id = ? AND revoked_at IS NULL", t.grant_id);
}

export async function revokeGrant(env: Env, clubId: string, gid: string) {
  const r = await run(env.DB, "UPDATE mcp_grants SET revoked_at = ? WHERE id = ? AND club_id = ? AND revoked_at IS NULL", nowIso(), gid, clubId);
  await run(env.DB, "DELETE FROM mcp_tokens WHERE grant_id = ?", gid);
  return !!r.meta.changes;
}

export async function purge(env: Env) {
  const now = nowIso();
  await run(env.DB, "DELETE FROM mcp_requests WHERE expires_at < ?", now);
  await run(env.DB, "DELETE FROM mcp_codes WHERE expires_at < ?", now);
  await run(env.DB, "DELETE FROM mcp_tokens WHERE expires_at < ?", now);
  await run(env.DB, "DELETE FROM mcp_calls WHERE at < ?", new Date(Date.now() - 90 * 864e5).toISOString());
}
