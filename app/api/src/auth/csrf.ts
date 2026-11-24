import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";
import { ApiError } from "../lib/http";

/**
 * Protection CSRF, réutilisable par tous les lots : `import { csrf } from "../auth/csrf"`.
 * Pour toute méthode qui change l'état (POST, PUT, PATCH, DELETE) sans en-tête Authorization
 * (donc authentifiée par cookie ou anonyme), exige :
 *   - un en-tête Origin égal à l'origine de APP_URL, ou
 *   - l'en-tête X-Requested-With: piaffe (que l'appli web ajoute à chaque fetch).
 * Les appels avec Authorization: Bearer (applis natives, clés d'API) ne sont pas concernés :
 * un site tiers ne peut pas poser cet en-tête. Les webhooks ne doivent pas utiliser ce middleware.
 */
export const csrf: MiddlewareHandler<AppEnv> = async (c, next) => {
  const m = c.req.method;
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return next();
  if ((c.req.header("authorization") || "").startsWith("Bearer ")) return next();
  if (c.req.header("x-requested-with") === "piaffe") return next();
  const origin = c.req.header("origin");
  let expected = "";
  try { expected = new URL(c.env.APP_URL).origin; } catch { /* APP_URL invalide : on refuse */ }
  if (origin && expected && origin === expected) return next();
  throw new ApiError(403, "csrf", "Requête refusée par la protection de sécurité. Rechargez la page et réessayez.");
};
