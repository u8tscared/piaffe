/*
 * Middleware global de l'espace admin, posé juste après loadAuth (src/index.ts) :
 *  1. vue « en tant que » : la session de vue est en LECTURE SEULE (toute écriture est refusée, sauf la sortie
 *     de la vue et la déconnexion), elle expire au bout de VIEW_MINUTES et ne glisse jamais ;
 *  2. club suspendu : ses clés d'API sont refusées (les sessions le sont déjà, ses accès étant suspendus) ;
 *  3. santé du service : chaque réponse 5xx est notée dans admin_errors (tableau de bord admin).
 */
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../env";
import { one, run } from "../lib/db";
import { ApiError } from "../lib/http";
import { newId, nowIso } from "../lib/ids";

export const VIEW_COOKIE = "stabl_vue";
export const BACK_COOKIE = "stabl_admin_retour";
export const VIEW_MINUTES = 60;
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_IN_VIEW = new Set(["/admin/vue/fin", "/auth/logout"]);
/** Routes qui font glisser la session (slideSession) : la vue y est toujours vérifiée, pour qu'elle ne dépasse jamais son heure. */
const SLIDING = new Set(["/api/me", "/api/club/bootstrap", "/api/records/changes"]);

export interface ViewRow { id: string; admin_user_id: string; target_user_id: string; club_id: string; session_id: string; expires_at: string; ended_at: string | null }

export async function activeView(db: D1Database, sessionId: string | null): Promise<ViewRow | null> {
  if (!sessionId) return null;
  return one<ViewRow>(db, "SELECT * FROM admin_impersonations WHERE session_id = ? AND ended_at IS NULL", sessionId);
}

export const adminGuard: MiddlewareHandler<AppEnv> = async (c, next) => {
  const db = c.env.DB;
  const sid = c.get("sessionId");
  const unsafe = !SAFE.has(c.req.method);
  let view: ViewRow | null = null;
  if (sid && (unsafe || SLIDING.has(c.req.path) || getCookie(c, VIEW_COOKIE))) {
    view = await activeView(db, sid);
    if (view && view.expires_at <= nowIso()) {
      await run(db, "UPDATE admin_impersonations SET ended_at = ? WHERE id = ?", nowIso(), view.id);
      await run(db, "DELETE FROM sessions WHERE id = ?", sid);
      c.set("user", null); c.set("sessionId", null); c.set("club", null); c.set("membership", null);
      view = null;
    }
  }
  if (view && unsafe && !ALLOWED_IN_VIEW.has(c.req.path))
    throw new ApiError(403, "admin_view_readonly", "Vue admin en lecture seule : aucune modification n'est possible. Quittez la vue depuis le bandeau pour revenir à l'espace admin.");

  const key = c.get("apiKey");
  if (key) {
    const f = await one(db, "SELECT 1 AS x FROM admin_club_flags WHERE club_id = ? AND suspended_at IS NOT NULL", key.club_id);
    if (f) throw new ApiError(403, "club_suspended", "Ce club est suspendu. Contactez l'équipe Stabl à bonjour@stablapp.fr.");
  }

  await next();

  // La session de vue ne glisse jamais (slideSession la repousserait à 30 jours).
  if (view) await run(db, "UPDATE sessions SET expires_at = ? WHERE id = ? AND expires_at > ?", view.expires_at, view.session_id, view.expires_at);

  if (c.res.status >= 500) {
    const err = c.error as Error | undefined;
    const write = run(db, "INSERT INTO admin_errors (id, method, path, status, message, club_id, user_id) VALUES (?,?,?,?,?,?,?)",
      newId("err"), c.req.method, c.req.path.slice(0, 200), c.res.status, String(err?.message || "").slice(0, 300) || null,
      c.get("club")?.id ?? null, c.get("user")?.id ?? null)
      .then(() => run(db, "DELETE FROM admin_errors WHERE at < ?", new Date(Date.now() - 30 * 864e5).toISOString()))
      .catch(() => {});
    try { c.executionCtx.waitUntil(write); } catch { await write; }
  }
};
