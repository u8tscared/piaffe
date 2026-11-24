import type { Env } from "../env";
import { all, one } from "../lib/db";

export interface UserRow {
  id: string; email: string; email_verified_at: string | null; password_hash: string | null; google_sub: string | null;
  first: string | null; last: string | null; phone: string | null; avatar_url: string | null; locale: string; last_club_id: string | null; created_at: string;
}

export const getUser = (env: Env, id: string) => one<UserRow>(env.DB, "SELECT * FROM users WHERE id = ?", id);
export const getUserByEmail = (env: Env, email: string) => one<UserRow>(env.DB, "SELECT * FROM users WHERE email = ? COLLATE NOCASE", email.trim());

/** Forme publique d'un utilisateur (jamais le hachage ni google_sub). */
export function publicUser(u: UserRow) {
  return {
    id: u.id, email: u.email, first: u.first, last: u.last, phone: u.phone, avatar_url: u.avatar_url, locale: u.locale,
    email_verified: !!u.email_verified_at, has_password: !!u.password_hash, google_linked: !!u.google_sub, created_at: u.created_at,
  };
}

export async function clubsOf(env: Env, userId: string) {
  return all<{ id: string; name: string; slug: string; role: string; person_ref: string | null; plan: string; plan_status: string; trial_ends_at: string | null; logo_key: string | null }>(env.DB,
    `SELECT c.id, c.name, c.slug, m.role, m.person_ref, c.plan, c.plan_status, c.trial_ends_at, c.logo_key
     FROM memberships m JOIN clubs c ON c.id = m.club_id WHERE m.user_id = ? AND m.status = 'active' ORDER BY c.name`, userId);
}

export const normEmail = (s: string) => s.trim().toLowerCase();
export const fullName = (u: { first?: string | null; last?: string | null; email?: string }) =>
  [u.first, u.last].filter(Boolean).join(" ") || (u.email || "").split("@")[0];

/** Liste d'ids de fiches (person_ref) : « m012,m013 » → ["m012","m013"]. */
export function refs(personRef: string | null | undefined): string[] {
  return (personRef || "").split(",").map((s) => s.trim()).filter(Boolean);
}
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
/** Valide et normalise un person_ref (texte ou tableau). Renvoie null si vide. */
export function normRefs(v: unknown): string | null | "invalid" {
  if (v == null || v === "") return null;
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : null;
  if (!list) return "invalid";
  const out = [...new Set(list.map((s) => String(s).trim()).filter(Boolean))];
  if (out.length > 20 || out.some((s) => !REF_RE.test(s))) return "invalid";
  return out.length ? out.join(",") : null;
}
export function mergeRefs(a: string | null | undefined, b: string | null | undefined): string | null {
  const s = [...new Set([...refs(a), ...refs(b)])];
  return s.length ? s.join(",") : null;
}
