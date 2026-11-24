import type { Env } from "../env";
import { json, one, run } from "../lib/db";
import { randomToken, sha256 } from "../lib/crypto";
import { nowIso } from "../lib/ids";
import { bad } from "../lib/http";

export type TokenKind = "verify" | "email_change" | "reset" | "magic";
/** Durées de vie en minutes. */
export const TOKEN_TTL_MIN: Record<TokenKind, number> = { verify: 3 * 24 * 60, email_change: 24 * 60, reset: 60, magic: 15 };
export const INVITATION_DAYS = 14;

/** Crée un jeton à usage unique (stocké haché). Les jetons précédents du même type pour cet utilisateur sont invalidés. */
export async function issueToken(env: Env, kind: TokenKind, userId: string, email: string, data?: Record<string, unknown>): Promise<string> {
  const token = randomToken(32);
  await run(env.DB, "UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND kind = ? AND used_at IS NULL", nowIso(), userId, kind);
  await run(env.DB, "INSERT INTO auth_tokens (id, kind, user_id, email, data, expires_at) VALUES (?,?,?,?,?,?)",
    await sha256(token), kind, userId, email, data ? JSON.stringify(data) : null, new Date(Date.now() + TOKEN_TTL_MIN[kind] * 6e4).toISOString());
  return token;
}

/**
 * Consomme un jeton : vérifie le type, l'échéance, l'usage unique (UPDATE conditionnel, donc sûr en cas de double clic).
 * Lève 400 invalid_token sinon.
 */
export async function consumeToken(env: Env, kinds: TokenKind[], token: unknown): Promise<{ user_id: string; email: string; kind: TokenKind; data: Record<string, unknown> }> {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) throw invalidToken();
  const id = await sha256(token);
  const row = await one<{ kind: TokenKind; user_id: string; email: string; data: string | null; expires_at: string; used_at: string | null }>(env.DB,
    "SELECT kind, user_id, email, data, expires_at, used_at FROM auth_tokens WHERE id = ?", id);
  if (!row || !kinds.includes(row.kind)) throw invalidToken();
  if (row.used_at) throw bad("token_used", "Ce lien a déjà été utilisé. Demandez-en un nouveau.");
  if (row.expires_at < nowIso()) throw bad("token_expired", "Ce lien a expiré. Demandez-en un nouveau.");
  const r = await run(env.DB, "UPDATE auth_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL", nowIso(), id);
  if (!r.meta.changes) throw bad("token_used", "Ce lien a déjà été utilisé. Demandez-en un nouveau.");
  return { user_id: row.user_id, email: row.email, kind: row.kind, data: json(row.data, {}) };
}

export function invalidToken() { return bad("invalid_token", "Ce lien n'est pas valide. Vérifiez qu'il est complet ou demandez-en un nouveau."); }

export async function purgeTokens(env: Env) {
  const now = nowIso();
  const old = new Date(Date.now() - 30 * 864e5).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_tokens WHERE expires_at < ? OR (used_at IS NOT NULL AND used_at < ?)").bind(now, old),
    env.DB.prepare("DELETE FROM oauth_states WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM invitations WHERE accepted_at IS NULL AND expires_at < ?").bind(old),
    env.DB.prepare("DELETE FROM rate_limits WHERE reset_at < ?").bind(Math.floor(Date.now() / 1000) - 3600),
  ]);
}
