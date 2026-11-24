import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv, Env } from "../env";
import { SESSION_COOKIE, SESSION_DAYS } from "../lib/auth";
import { all, one, run } from "../lib/db";
import { randomToken, sha256 } from "../lib/crypto";
import { ApiError } from "../lib/http";
import { nowIso } from "../lib/ids";

const DAY = 864e5;
/** On ne réécrit l'échéance qu'une fois par jour au plus (session glissante sans écriture à chaque requête). */
const SLIDE_AFTER_MS = DAY;

export function isSecure(env: Env) { return !(env.APP_URL || "").startsWith("http://"); }
export function clientIp(c: Context) { return c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || "local"; }

function cookieOpts(env: Env) {
  return { httpOnly: true, secure: isSecure(env), sameSite: "Lax" as const, path: "/", maxAge: SESSION_DAYS * 86400 };
}

/** Ouvre une session pour l'utilisateur : cookie piaffe_s + jeton renvoyé (pour l'en-tête Bearer des applis natives). */
export async function openSession(c: Context<AppEnv>, userId: string, clubId?: string | null): Promise<string> {
  const db = c.env.DB;
  let club = clubId ?? null;
  if (!club) {
    const u = await one<{ last_club_id: string | null }>(db, "SELECT last_club_id FROM users WHERE id = ?", userId);
    const ok = u?.last_club_id && await one(db, "SELECT 1 AS x FROM memberships WHERE user_id = ? AND club_id = ? AND status = 'active'", userId, u.last_club_id);
    if (ok) club = u!.last_club_id;
    else club = (await one<{ club_id: string }>(db, "SELECT club_id FROM memberships WHERE user_id = ? AND status = 'active' ORDER BY created_at LIMIT 1", userId))?.club_id ?? null;
  }
  const token = randomToken(32);
  await run(db, "INSERT INTO sessions (id, user_id, club_id, expires_at, user_agent, ip) VALUES (?,?,?,?,?,?)",
    await sha256(token), userId, club, new Date(Date.now() + SESSION_DAYS * DAY).toISOString(),
    (c.req.header("user-agent") || "").slice(0, 200), clientIp(c));
  setCookie(c, SESSION_COOKIE, token, cookieOpts(c.env));
  c.set("sessionId", await sha256(token));
  return token;
}

export async function closeSession(c: Context<AppEnv>) {
  const sid = c.get("sessionId");
  if (sid) await run(c.env.DB, "DELETE FROM sessions WHERE id = ?", sid);
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: isSecure(c.env) });
}

/** Révoque toutes les sessions d'un utilisateur, sauf éventuellement la session courante. */
export async function revokeSessions(env: Env, userId: string, exceptId?: string | null) {
  if (exceptId) await run(env.DB, "DELETE FROM sessions WHERE user_id = ? AND id <> ?", userId, exceptId);
  else await run(env.DB, "DELETE FROM sessions WHERE user_id = ?", userId);
}

/** Session glissante : repousse l'échéance à 30 jours (au plus une écriture par jour) et rafraîchit le cookie. */
export const slideSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  const sid = c.get("sessionId");
  if (!sid) return;
  const s = await one<{ expires_at: string }>(c.env.DB, "SELECT expires_at FROM sessions WHERE id = ?", sid);
  if (!s) return;
  const target = Date.now() + SESSION_DAYS * DAY;
  if (target - Date.parse(s.expires_at) < SLIDE_AFTER_MS) return;
  await run(c.env.DB, "UPDATE sessions SET expires_at = ? WHERE id = ?", new Date(target).toISOString(), sid);
  const tok = getCookie(c, SESSION_COOKIE);
  if (tok && (await sha256(tok)) === sid) setCookie(c, SESSION_COOKIE, tok, cookieOpts(c.env));
};

/** Jeton de session renvoyé dans le JSON seulement pour les clients natifs (le navigateur n'en a pas besoin : cookie HttpOnly). */
export function tokenForClient(c: Context, token: string): { session_token?: string } {
  return c.req.header("x-piaffe-client") === "native" ? { session_token: token } : {};
}

export async function purgeSessions(env: Env) {
  await run(env.DB, "DELETE FROM sessions WHERE expires_at < ?", nowIso());
}

/** Liste brute (utile aux tests et au support). */
export async function sessionsOf(env: Env, userId: string) { return all(env.DB, "SELECT id, expires_at FROM sessions WHERE user_id = ?", userId); }

export function tooMany(): ApiError {
  return new ApiError(429, "rate_limited", "Trop de tentatives. Patientez quelques minutes avant de réessayer.");
}
