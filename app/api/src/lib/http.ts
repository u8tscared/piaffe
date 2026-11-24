import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

/** Erreur métier renvoyée en JSON : { error: { code, message } }. Messages en français, lisibles par l'utilisateur. */
export class ApiError extends HTTPException {
  constructor(status: 400 | 401 | 402 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503, public code: string, message: string, public details?: unknown) {
    super(status, { message });
  }
}
export const bad = (code: string, msg: string, details?: unknown) => new ApiError(400, code, msg, details);
export const unauthorized = (msg = "Connectez-vous pour continuer.") => new ApiError(401, "unauthorized", msg);
export const forbidden = (msg = "Vous n'avez pas accès à cette action.") => new ApiError(403, "forbidden", msg);
export const notFound = (msg = "Introuvable.") => new ApiError(404, "not_found", msg);

export function errorHandler(err: Error, c: Context) {
  if (err instanceof ApiError) return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
  if (err instanceof HTTPException) return c.json({ error: { code: "http_" + err.status, message: err.message } }, err.status);
  console.error("Erreur non gérée", err);
  return c.json({ error: { code: "internal", message: "Une erreur est survenue. Réessayez dans un instant." } }, 500);
}

/** Lit un corps JSON objet, ou lève 400. */
export async function body<T = Record<string, unknown>>(c: Context): Promise<T> {
  try {
    const b = await c.req.json();
    if (!b || typeof b !== "object") throw 0;
    return b as T;
  } catch {
    throw bad("invalid_json", "Le corps de la requête doit être un objet JSON.");
  }
}
export function str(v: unknown, field: string, opts: { min?: number; max?: number; optional?: boolean } = {}): string {
  if (v == null || v === "") {
    if (opts.optional) return "";
    throw bad("missing_field", `Le champ « ${field} » est obligatoire.`, { field });
  }
  if (typeof v !== "string") throw bad("invalid_field", `Le champ « ${field} » doit être un texte.`, { field });
  const s = v.trim();
  if (opts.min && s.length < opts.min) throw bad("invalid_field", `Le champ « ${field} » est trop court.`, { field });
  if (s.length > (opts.max ?? 2000)) throw bad("invalid_field", `Le champ « ${field} » est trop long.`, { field });
  return s;
}
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
