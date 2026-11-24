import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv, Role } from "../env";
import { one, run } from "./db";
import { sha256 } from "./crypto";
import { forbidden, unauthorized, ApiError } from "./http";

export const SESSION_COOKIE = "piaffe_s";
export const SESSION_DAYS = 30;

/**
 * Charge la session (cookie piaffe_s ou Authorization: Bearer <jeton de session>) ou la clé d'API
 * (Authorization: Bearer pk_live_…). Pose user, sessionId, club, membership, apiKey. Ne bloque jamais :
 * utilisez requireUser / requireRole / requireScope pour protéger une route.
 * Le club courant vient de l'en-tête X-Piaffe-Club si présent, sinon de la session.
 */
export const loadAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("user", null); c.set("sessionId", null); c.set("club", null); c.set("membership", null); c.set("apiKey", null);
  const authz = c.req.header("authorization") || "";
  const bearer = authz.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  const db = c.env.DB;

  if (bearer.startsWith("pk_")) {
    const k = await one<{ id: string; club_id: string; scopes: string; revoked_at: string | null }>(db,
      "SELECT id, club_id, scopes, revoked_at FROM api_keys WHERE hash = ?", await sha256(bearer));
    if (!k || k.revoked_at) throw unauthorized("Clé d'API invalide ou révoquée.");
    c.set("apiKey", { id: k.id, club_id: k.club_id, scopes: JSON.parse(k.scopes) });
    const club = await one<any>(db, "SELECT id, name, slug, plan, plan_status FROM clubs WHERE id = ?", k.club_id);
    c.set("club", club);
    c.executionCtx.waitUntil(run(db, "UPDATE api_keys SET last_used_at = ? WHERE id = ?", new Date().toISOString(), k.id).then(() => {}));
    return next();
  }

  const token = bearer || getCookie(c, SESSION_COOKIE) || "";
  if (token) {
    const sid = await sha256(token);
    const s = await one<any>(db,
      `SELECT s.id, s.club_id, s.expires_at, u.id AS uid, u.email, u.first, u.last, u.email_verified_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`, sid);
    if (s && s.expires_at > new Date().toISOString()) {
      c.set("user", { id: s.uid, email: s.email, first: s.first, last: s.last, email_verified_at: s.email_verified_at });
      c.set("sessionId", s.id);
      const clubId = c.req.header("x-piaffe-club") || s.club_id;
      if (clubId) {
        const m = await one<any>(db,
          `SELECT m.role, m.person_ref, c.id, c.name, c.slug, c.plan, c.plan_status FROM memberships m JOIN clubs c ON c.id = m.club_id
           WHERE m.user_id = ? AND m.club_id = ? AND m.status = 'active'`, s.uid, clubId);
        if (m) {
          c.set("club", { id: m.id, name: m.name, slug: m.slug, plan: m.plan, plan_status: m.plan_status });
          c.set("membership", { role: m.role, person_ref: m.person_ref });
        }
      }
    }
  }
  return next();
};

export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get("user")) throw unauthorized();
  return next();
};

/** Exige un club courant et un des rôles donnés (owner passe partout où manager passe). */
export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!c.get("user")) throw unauthorized();
    const m = c.get("membership");
    if (!c.get("club") || !m) throw new ApiError(403, "no_club", "Choisissez d'abord un club.");
    const ok = roles.includes(m.role) || (m.role === "owner" && roles.includes("manager"));
    if (!ok) throw forbidden();
    return next();
  };
}

/** Pour les routes ouvertes aux clés d'API : accepte une session gérant ou une clé portant le scope. */
export function requireScope(scope: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const k = c.get("apiKey");
    if (k) { if (!k.scopes.includes(scope) && !k.scopes.includes("*")) throw forbidden("Cette clé d'API n'a pas le droit « " + scope + " »."); return next(); }
    return requireRole("owner", "manager")(c, next);
  };
}
