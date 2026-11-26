/*
 * Espace admin : qui y a droit.
 * Un admin = un compte Stabl ordinaire, connecté par session (cookie ou Bearer de session, jamais une clé d'API),
 * e-mail vérifié, dont l'adresse figure dans le secret ADMIN_EMAILS (adresses séparées par des virgules,
 * des points-virgules ou des espaces). La liste n'est jamais écrite dans le code.
 * Toute autre personne reçoit la même réponse qu'une page inexistante (404).
 */
import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, Env } from "../env";
import { audit } from "../lib/db";
import { ApiError } from "../lib/http";
import { clientIp } from "../auth/session";

export function adminEmails(env: Env): string[] {
  const raw = String((env as any).ADMIN_EMAILS || "");
  return raw.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes("@"));
}

export function isAdmin(c: Context<AppEnv>): boolean {
  const u = c.get("user");
  if (!u || c.get("apiKey") || !u.email_verified_at) return false;
  return adminEmails(c.env).includes(u.email.toLowerCase());
}

export const notFoundJson = () => new ApiError(404, "not_found", "Route d'API inconnue.");

/** Garde des routes /admin/api/* : 404 pour tout le monde sauf les admins. */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!isAdmin(c)) throw notFoundJson();
  return next();
};

/** Les actions qui changent quelque chose exigent { confirm: true } dans le corps (en plus de la fenêtre de confirmation). */
export function needConfirm(b: { confirm?: unknown }) {
  if (b.confirm !== true) throw new ApiError(409, "confirm_required", "Confirmez l'action pour continuer.");
}

/** Journal des actions admin : audit_log, action « admin.<quoi> ». */
export async function adminLog(c: Context<AppEnv>, action: string, e: { club_id?: string | null; target?: string; data?: unknown } = {}) {
  await audit(c.env.DB, { club_id: e.club_id ?? null, user_id: c.get("user")?.id ?? null, action: "admin." + action, target: e.target, data: e.data, ip: clientIp(c) });
}
