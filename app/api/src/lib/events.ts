import type { Env } from "../env";

/**
 * Bus d'événements interne. Un module publie (emit), d'autres réagissent (on) sans dépendre de lui.
 * Les gestionnaires tournent après la réponse (waitUntil) ; une erreur est journalisée, jamais propagée.
 * Événements connus (ajoutez les vôtres ici, en commentaire) :
 *  - record.saved    {club_id, coll, id, data, previous|null, user_id}
 *  - record.deleted  {club_id, coll, id, previous, user_id}
 *  - user.signed_up  {user_id, email, via:'password'|'google'}
 *  - member.invited  {club_id, email, role, invitation_url, inviter_name}
 *  - invoice.issued  {club_id, invoice_id}
 *  - invoice.paid    {club_id, invoice_id, amount_cents, method}
 *  - payment.failed  {club_id, invoice_id|null, reason}
 *  - club.created    {club_id, user_id}
 *  - subscription.changed {club_id, plan, status}
 */
export type PiaffeEvent = { type: string; [k: string]: unknown };
type Handler = (env: Env, e: PiaffeEvent) => Promise<void> | void;
const handlers: Record<string, Handler[]> = {};

export function on(type: string, h: Handler) { (handlers[type] ||= []).push(h); }

export function emit(env: Env, ctx: { waitUntil(p: Promise<unknown>): void } | null, e: PiaffeEvent): Promise<void> {
  const p = (async () => {
    for (const h of handlers[e.type] || []) {
      try { await h(env, e); } catch (err) { console.error("Gestionnaire " + e.type, err); }
    }
  })();
  if (ctx) ctx.waitUntil(p);
  return p;
}
