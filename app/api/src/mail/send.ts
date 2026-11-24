import type { Env } from "../env";
/**
 * CONTRAT (lot mail) : met un e-mail transactionnel en file et tente l'envoi.
 * template : clé d'un modèle de src/mail/templates (welcome_member, invitation, verify_email, reset_password,
 * magic_link, invoice_issued, payment_receipt, payment_reminder, payment_failed, booking_confirmed,
 * booking_cancelled, waitlist_spot, trial_ending, subscription_receipt, accountant_invite, export_ready…).
 * Ne lève jamais d'erreur bloquante : renvoie l'id de l'outbox.
 */
export interface MailInput {
  to: string; template: string; data: Record<string, unknown>;
  club_id?: string | null; reply_to?: string; attachments?: { filename: string; content_b64: string; type: string }[];
}
export async function sendMail(env: Env, m: MailInput): Promise<string> {
  console.log("[mail:stub]", m.template, "→", m.to);
  return "stub";
}
