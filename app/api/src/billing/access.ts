import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";
import { one } from "../lib/db";
import { ApiError } from "../lib/http";
import { WRITE_GRACE_DAYS } from "./plans";

const DAY = 864e5;

export interface PlanAccess {
  read: true;
  write: boolean;
  /** ok | trial | trial_grace | past_due_grace | blocked_trial | blocked_unpaid | blocked_canceled */
  reason: string;
  /** Date à laquelle l'écriture sera (ou a été) bloquée, si un blocage approche. */
  write_blocked_at: string | null;
}

/**
 * Règle d'accès selon l'abonnement : la lecture est toujours permise. L'écriture est bloquée
 * WRITE_GRACE_DAYS jours après le début d'un impayé ou après la fin de l'essai sans abonnement,
 * et dès qu'un abonnement résilié arrive à son terme.
 */
export function computeAccess(s: { plan_status: string; trial_ends_at: string | null; past_due_since: string | null; current_period_end?: string | null }, now = Date.now()): PlanAccess {
  const grace = WRITE_GRACE_DAYS * DAY;
  const at = (iso: string | null, add = 0) => (iso ? new Date(Date.parse(iso) + add).toISOString() : null);
  switch (s.plan_status) {
    case "active":
      return { read: true, write: true, reason: "ok", write_blocked_at: null };
    case "trialing": {
      if (!s.trial_ends_at || Date.parse(s.trial_ends_at) > now) return { read: true, write: true, reason: "trial", write_blocked_at: at(s.trial_ends_at, grace) };
      const until = Date.parse(s.trial_ends_at) + grace;
      return until > now ? { read: true, write: true, reason: "trial_grace", write_blocked_at: at(s.trial_ends_at, grace) }
        : { read: true, write: false, reason: "blocked_trial", write_blocked_at: at(s.trial_ends_at, grace) };
    }
    case "past_due":
    case "unpaid": {
      const since = s.past_due_since || s.trial_ends_at;
      if (!since) return { read: true, write: true, reason: "past_due_grace", write_blocked_at: null };
      const until = Date.parse(since) + grace;
      return until > now ? { read: true, write: true, reason: "past_due_grace", write_blocked_at: at(since, grace) }
        : { read: true, write: false, reason: "blocked_unpaid", write_blocked_at: at(since, grace) };
    }
    case "canceled":
    default: {
      if (s.current_period_end && Date.parse(s.current_period_end) > now) return { read: true, write: true, reason: "ok", write_blocked_at: s.current_period_end };
      return { read: true, write: false, reason: "blocked_canceled", write_blocked_at: s.current_period_end || null };
    }
  }
}

export async function planAccess(db: D1Database, clubId: string, now = Date.now()): Promise<PlanAccess> {
  const r = await one<any>(db,
    `SELECT c.plan_status, c.trial_ends_at, b.past_due_since, b.current_period_end
     FROM clubs c LEFT JOIN billing_subscriptions b ON b.club_id = c.id WHERE c.id = ?`, clubId);
  if (!r) return { read: true, write: false, reason: "blocked_canceled", write_blocked_at: null };
  return computeAccess(r, now);
}

const WRITE_BLOCKED_MSG = {
  blocked_trial: "Votre période d'essai est terminée. Choisissez une offre pour continuer à modifier vos données\u00a0; elles restent consultables.",
  blocked_unpaid: "Le paiement de votre abonnement Stabl n'a pas abouti. Mettez à jour votre moyen de paiement pour continuer à modifier vos données\u00a0; elles restent consultables.",
  blocked_canceled: "Votre abonnement Stabl est résilié. Réabonnez-vous pour continuer à modifier vos données\u00a0; elles restent consultables.",
} as Record<string, string>;

/**
 * Middleware pour les autres lots : laisse passer toute lecture (GET, HEAD, OPTIONS) et bloque
 * l'écriture (402 plan_inactive) quand l'abonnement du club ne le permet plus.
 * Usage : app.post("/api/…", requireRole("owner","manager"), requireActivePlan, handler)
 * Sans club courant, ne bloque pas (les routes sans club gèrent leurs droits elles-mêmes).
 */
export const requireActivePlan: MiddlewareHandler<AppEnv> = async (c, next) => {
  const m = c.req.method;
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return next();
  const club = c.get("club");
  if (!club) return next();
  const a = await planAccess(c.env.DB, club.id);
  if (!a.write) throw new ApiError(402, "plan_inactive", WRITE_BLOCKED_MSG[a.reason] || WRITE_BLOCKED_MSG.blocked_canceled, { reason: a.reason });
  return next();
};
