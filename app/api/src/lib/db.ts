import { newId, nowIso } from "./ids";

export async function one<T = Record<string, unknown>>(db: D1Database, sql: string, ...args: unknown[]): Promise<T | null> {
  return (await db.prepare(sql).bind(...args).first<T>()) ?? null;
}
export async function all<T = Record<string, unknown>>(db: D1Database, sql: string, ...args: unknown[]): Promise<T[]> {
  return (await db.prepare(sql).bind(...args).all<T>()).results ?? [];
}
export async function run(db: D1Database, sql: string, ...args: unknown[]) {
  return db.prepare(sql).bind(...args).run();
}
export function json<T = unknown>(s: unknown, fallback: T): T {
  if (typeof s !== "string") return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
export async function audit(db: D1Database, e: { club_id?: string | null; user_id?: string | null; action: string; target?: string; data?: unknown; ip?: string | null }) {
  await run(db, "INSERT INTO audit_log (id, club_id, user_id, action, target, data, ip, at) VALUES (?,?,?,?,?,?,?,?)",
    newId("aud"), e.club_id ?? null, e.user_id ?? null, e.action, e.target ?? null, e.data === undefined ? null : JSON.stringify(e.data), e.ip ?? null, nowIso());
}
/** Limite simple : max requêtes par fenêtre (secondes) pour une clé. Renvoie false si dépassé. */
export async function rateLimit(db: D1Database, key: string, max: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const r = await one<{ count: number; reset_at: number }>(db, "SELECT count, reset_at FROM rate_limits WHERE key = ?", key);
  if (!r || r.reset_at <= now) {
    await run(db, "INSERT INTO rate_limits (key, count, reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=1, reset_at=excluded.reset_at", key, now + windowSec);
    return true;
  }
  if (r.count >= max) return false;
  await run(db, "UPDATE rate_limits SET count = count + 1 WHERE key = ?", key);
  return true;
}
