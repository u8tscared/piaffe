/**
 * Limites des formules (plans.ts › limits) appliquées par le serveur.
 * Seule la formule Essentiel en a aujourd'hui : 25 chevaux et 2 comptes pour l'équipe (titulaire compris).
 * Pendant l'essai (plan « trial » ou abonnement « trialing »), le club a tout Club : aucune limite.
 */
import { one } from "../lib/db";
import { findPlan } from "./plans";

/** Rôles qui comptent comme « compte de l'équipe ». Cavaliers, comptable et praticiens n'en font pas partie. */
export const TEAM_ROLES = ["owner", "manager", "staff", "coach"];

export interface ClubLimits { plan: string; plan_name: string; horses: number | null; users: number | null; sites: number }

export async function clubLimits(db: D1Database, clubId: string): Promise<ClubLimits | null> {
  const c = await one<{ plan: string | null; plan_status: string | null }>(db, "SELECT plan, plan_status FROM clubs WHERE id = ?", clubId);
  if (!c || c.plan_status === "trialing") return null;
  const p = findPlan(c.plan);
  if (!p) return null;
  return { plan: p.key, plan_name: p.name, ...p.limits };
}

export function horseLimitMessage(l: ClubLimits) {
  return `La formule ${l.plan_name} compte ${l.horses} chevaux au plus. Passez à la formule Club (chevaux illimités) pour en ajouter d'autres.`;
}
export function userLimitMessage(l: ClubLimits) {
  return `La formule ${l.plan_name} compte ${l.users} comptes pour l'équipe, vous compris. Passez à la formule Club (équipe illimitée) pour inviter d'autres salariés ou coachs.`;
}

/** Nombre de comptes de l'équipe : membres actifs et invitations en attente. */
export async function teamCount(db: D1Database, clubId: string, now: string): Promise<number> {
  const marks = TEAM_ROLES.map(() => "?").join(",");
  const m = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM memberships WHERE club_id = ? AND status = 'active' AND role IN (${marks})`, clubId, ...TEAM_ROLES);
  const i = await one<{ n: number }>(db, `SELECT COUNT(*) AS n FROM invitations WHERE club_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ? AND role IN (${marks})`, clubId, now, ...TEAM_ROLES);
  return (m?.n || 0) + (i?.n || 0);
}
