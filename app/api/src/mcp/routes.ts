import { Hono, type Context } from "hono";
import type { AppEnv, Env, Role } from "../env";
import { all, audit, json, one, rateLimit } from "../lib/db";
import { randomToken } from "../lib/crypto";
import { requireRole } from "../lib/auth";
import { notFound } from "../lib/http";
import { csrf } from "../auth/csrf";
import { MCP_ROLES, type Caller } from "./data";
import {
  approve, accessGrant, base, checkConsentToken, clubsFor, consentToken, deny, getRequest, hostOf, metaResource, metaServer,
  OAuthError, purge, register, revokeGrant, revokeToken, startAuthorize, token,
} from "./oauth";
import { consentPage, csp, errorPage, loginPage, noClubPage } from "./page";
import { rpc, RATE_PER_MIN, SERVER_INFO } from "./protocol";
import { listTools, TOOLS } from "./tools";

/*
 * Connecteur MCP de Stabl (Claude, ChatGPT, et tout client MCP) :
 *   GET  /.well-known/oauth-protected-resource[/mcp]     la ressource et son serveur d'autorisation
 *   GET  /.well-known/oauth-authorization-server[/mcp]   adresses OAuth (aussi /.well-known/openid-configuration)
 *   POST /oauth/register                                 enregistrement dynamique d'un assistant (RFC 7591)
 *   GET  /oauth/authorize                                demande de l'assistant → page d'accord (connexion Stabl si besoin)
 *   POST /oauth/authorize                                décision de la personne (autoriser / refuser)
 *   POST /oauth/token                                    code + code_verifier → jetons ; renouvellement
 *   POST /oauth/revoke                                   retrait d'un jeton (RFC 7009)
 *   POST /mcp                                            MCP (JSON-RPC) : initialize, tools/list, tools/call…
 *   GET  /api/mcp/tools · /api/mcp/grants · /api/mcp/calls, DELETE /api/mcp/grants/:id   pour l'écran Connecteurs
 * Authentification de /mcp : jeton OAuth (stm_at_…) ou clé d'API du club (pk_live_…, droits read et write).
 */
const app = new Hono<AppEnv>();

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id, accept",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};
const H = (extra: Record<string, string> = {}) => ({ ...CORS, "Cache-Control": "no-store", ...extra });
const ip = (c: Context<AppEnv>) => c.req.header("cf-connecting-ip") || "local";
const oauthErr = (c: Context<AppEnv>, e: OAuthError) =>
  c.json({ error: e.code, ...(e.description ? { error_description: e.description } : {}) }, e.status, H(e.status === 429 ? { "Retry-After": "60" } : {}));

// ---------- Préflight CORS ----------
for (const p of ["/mcp", "/mcp/*", "/oauth/*", "/.well-known/*"]) app.options(p, (c) => c.body(null, 204, H()));

// ---------- Métadonnées ----------
app.get("/.well-known/oauth-protected-resource", (c) => c.json(metaResource(c.env), 200, H()));
app.get("/.well-known/oauth-protected-resource/mcp", (c) => c.json(metaResource(c.env), 200, H()));
for (const p of ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/mcp", "/.well-known/openid-configuration", "/.well-known/openid-configuration/mcp", "/mcp/.well-known/oauth-authorization-server"])
  app.get(p, (c) => c.json(metaServer(c.env), 200, H()));

// ---------- Enregistrement ----------
app.post("/oauth/register", async (c) => {
  try {
    const b = await c.req.json().catch(() => null);
    return c.json(await register(c.env, b, ip(c)), 201, H());
  } catch (e) { if (e instanceof OAuthError) return oauthErr(c, e); throw e; }
});

// ---------- Page d'accord ----------
function html(c: Context<AppEnv>, body: string, nonce: string, status: 200 | 400 | 403 = 200) {
  return c.html(body, status, { "Content-Security-Policy": csp(nonce), "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" });
}

app.get("/oauth/authorize", async (c) => {
  const nonce = randomToken(12);
  const q = c.req.query();
  let req = q.demande || "";
  if (!req) {
    try {
      const r = await startAuthorize(c.env, q);
      if ("redirect" in r) return c.redirect(r.redirect, 302);
      req = r.request;
      return c.redirect("/oauth/authorize?demande=" + encodeURIComponent(req), 302);
    } catch (e) {
      if (e instanceof OAuthError) return html(c, errorPage(e.description || e.code, nonce), nonce, 400);
      throw e;
    }
  }
  const r = await getRequest(c.env, req);
  if (!r) return html(c, errorPage("Cette demande de connexion a expiré (10 minutes).", nonce), nonce, 400);
  const user = c.get("user"), sid = c.get("sessionId");
  if (!user || !sid) return html(c, loginPage({ client: r.client_name, request: req, nonce }), nonce);
  const clubs = await clubsFor(c.env, user.id);
  if (!clubs.length) return html(c, noClubPage({ client: r.client_name, email: user.email, nonce }), nonce, 403);
  const cur = c.get("club")?.id;
  clubs.sort((a, b) => (a.id === cur ? -1 : b.id === cur ? 1 : 0));
  return html(c, consentPage({ client: r.client_name, host: hostOf(r.redirect_uri), request: req, token: await consentToken(c.env, req, sid), email: user.email, clubs, wantsWrite: /ecriture/.test(r.scope), nonce }), nonce);
});

app.post("/oauth/authorize", async (c) => {
  const nonce = randomToken(12);
  const origin = c.req.header("origin");
  if (origin && origin !== "null" && origin !== base(c.env).origin) return html(c, errorPage("Requête refusée par la protection de sécurité.", nonce), nonce, 403);
  const f = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
  const req = String(f.demande || ""), tok = String(f.jeton || "");
  const user = c.get("user"), sid = c.get("sessionId");
  if (!user || !sid) return c.redirect("/oauth/authorize?demande=" + encodeURIComponent(req), 303);
  if (!(await checkConsentToken(c.env, req, sid, tok))) return html(c, errorPage("Le formulaire a expiré. Relancez la connexion depuis l'assistant.", nonce), nonce, 403);
  try {
    const to = f.decision === "autoriser" ? await approve(c.env, req, user, String(f.club || ""), f.ecriture === "1", ip(c)) : await deny(c.env, req);
    return c.redirect(to, 302);
  } catch (e) {
    if (e instanceof OAuthError) return html(c, errorPage(e.description || e.code, nonce), nonce, e.status === 403 ? 403 : 400);
    throw e;
  }
});

// ---------- Jetons ----------
async function form(c: Context<AppEnv>): Promise<Record<string, string>> {
  const ct = c.req.header("content-type") || "";
  if (ct.includes("application/json")) { const j = await c.req.json().catch(() => ({})); return j && typeof j === "object" ? Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v ?? "")])) : {}; }
  const b = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
}
app.post("/oauth/token", async (c) => {
  try {
    if (!(await rateLimit(c.env.DB, "mcp:token:" + ip(c), 60, 60))) throw new OAuthError("temporarily_unavailable", 429);
    return c.json(await token(c.env, await form(c)), 200, H({ Pragma: "no-cache" }));
  } catch (e) { if (e instanceof OAuthError) return oauthErr(c, e); throw e; }
});
app.post("/oauth/revoke", async (c) => {
  const b = await form(c);
  await revokeToken(c.env, b.token || "");
  return c.body(null, 200, H());
});

// ---------- MCP ----------
async function callerOf(c: Context<AppEnv>): Promise<Caller | null> {
  const k = c.get("apiKey");
  if (k) {
    const scopes = [...(k.scopes.includes("read") || k.scopes.includes("*") ? ["lecture"] : []), ...(k.scopes.includes("write") || k.scopes.includes("*") ? ["ecriture"] : [])];
    if (!scopes.includes("lecture")) return null;
    return { clubId: k.club_id, role: "manager", personRef: null, userId: null, scopes, grantId: null, apiKeyId: k.id, clientName: "Clé d'API" };
  }
  const authz = c.req.header("authorization") || "";
  const tok = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  const g = tok ? await accessGrant(c.env, tok) : null;
  if (!g) return null;
  // La personne doit être toujours membre active du club, avec un rôle qui a le connecteur.
  const m = await one<{ role: Role; person_ref: string | null }>(c.env.DB, "SELECT role, person_ref FROM memberships WHERE user_id = ? AND club_id = ? AND status = 'active'", g.user_id, g.club_id);
  if (!m || !MCP_ROLES.includes(m.role)) return null;
  return { clubId: g.club_id, role: m.role, personRef: m.person_ref, userId: g.user_id, scopes: json<string[]>(g.scopes, ["lecture"]), grantId: g.id, apiKeyId: null, clientName: g.client_name };
}

function unauthorized(c: Context<AppEnv>, keyWithoutRead = false) {
  const b = base(c.env);
  return c.json({ error: "invalid_token", error_description: keyWithoutRead ? "Cette clé d'API n'a pas le droit « read »." : "Connexion à Stabl demandée." }, 401,
    H({ "WWW-Authenticate": `Bearer resource_metadata="${b.meta}", scope="lecture"` }));
}

app.get("/mcp", (c) => c.json({ error: "method_not_allowed", error_description: "Ce serveur répond en JSON aux requêtes POST (pas de flux d'événements)." }, 405, H({ Allow: "POST, OPTIONS" })));
app.delete("/mcp", (c) => c.body(null, 405, H({ Allow: "POST, OPTIONS" })));
app.post("/mcp", async (c) => {
  const caller = await callerOf(c);
  if (!caller) return unauthorized(c, !!c.get("apiKey"));
  let b: unknown;
  try { b = await c.req.json(); } catch { return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400, H()); }
  const msgs = Array.isArray(b) ? b : [b];
  if (!msgs.length || msgs.length > 20) return c.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, 400, H());
  const calls = msgs.filter((m: any) => m && m.method === "tools/call").length;
  if (calls) {
    const key = "mcp:call:" + (caller.grantId || caller.apiKeyId);
    for (let i = 0; i < calls; i++) if (!(await rateLimit(c.env.DB, key, RATE_PER_MIN, 60)))
      return c.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Trop d'appels : 60 par minute au plus. Réessayez dans une minute." } }, 429, H({ "Retry-After": "60" }));
  }
  let ctx: { waitUntil(p: Promise<unknown>): void } | null = null;
  try { ctx = c.executionCtx; } catch { ctx = null; }
  const out = [];
  for (const m of msgs) { const x = await rpc(c.env, caller, m, ctx); if (x) out.push(x); }
  if (!out.length) return c.body(null, 202, H());
  return c.json(Array.isArray(b) ? out : out[0], 200, H());
});

// ---------- Pour l'écran Connecteurs de l'appli ----------
app.use("/api/mcp/*", csrf);
app.get("/api/mcp/tools", requireRole("owner", "manager", "staff"), (c) => {
  const role = c.get("membership")!.role;
  return c.json({
    server_url: base(c.env).resource, server: SERVER_INFO,
    tools: listTools(role, ["lecture", "ecriture"]).map((t) => ({ name: t.name, title: t.title, description: t.description, write: !t.annotations.readOnlyHint })),
    all_tools: TOOLS.map((t) => ({ name: t.name, title: t.title, write: !!t.write, for: t.public === "gerant" ? "gérant" : "gérant et équipe" })),
  });
});
app.get("/api/mcp/grants", requireRole("owner", "manager", "staff"), async (c) => {
  const club = c.get("club")!, me = c.get("user")!, mgr = c.get("membership")!.role !== "staff";
  const rows = await all<any>(c.env.DB,
    `SELECT g.id, g.client_name, g.client_host, g.scopes, g.calls, g.last_used_at, g.created_at, g.revoked_at, g.user_id, u.email, u.first, u.last
     FROM mcp_grants g JOIN users u ON u.id = g.user_id WHERE g.club_id = ? ${mgr ? "" : "AND g.user_id = ?"} ORDER BY g.created_at DESC LIMIT 100`,
    ...(mgr ? [club.id] : [club.id, me.id]));
  return c.json({ grants: rows.map((r) => ({ ...r, scopes: json<string[]>(r.scopes, []), user: { id: r.user_id, email: r.email, first: r.first, last: r.last } })) });
});
app.delete("/api/mcp/grants/:id", requireRole("owner", "manager", "staff"), async (c) => {
  const club = c.get("club")!, me = c.get("user")!;
  const g = await one<{ user_id: string }>(c.env.DB, "SELECT user_id FROM mcp_grants WHERE id = ? AND club_id = ?", c.req.param("id"), club.id);
  if (!g || (c.get("membership")!.role === "staff" && g.user_id !== me.id)) throw notFound("Connexion introuvable.");
  await revokeGrant(c.env, club.id, c.req.param("id"));
  await audit(c.env.DB, { club_id: club.id, user_id: me.id, action: "mcp.revoke", target: c.req.param("id"), ip: ip(c) });
  return c.json({ ok: true });
});
app.get("/api/mcp/calls", requireRole("owner", "manager"), async (c) => {
  const lim = Math.max(1, Math.min(200, Number(c.req.query("limit")) || 50));
  const rows = await all<any>(c.env.DB, "SELECT id, client_name, user_id, api_key_id, tool, args, ok, summary, ms, at FROM mcp_calls WHERE club_id = ? ORDER BY at DESC LIMIT ?", c.get("club")!.id, lim);
  return c.json({ calls: rows.map((r) => ({ ...r, ok: !!r.ok })) });
});

export default app;

/** Purge des demandes, codes et jetons expirés, et du journal de plus de 90 jours. */
export async function cron(env: Env, _cron: string): Promise<void> {
  await purge(env);
}
