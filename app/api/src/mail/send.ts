import type { Env } from "../env";
import { enqueue } from "./outbox";
/**
 * CONTRAT (lot mail) : met un e-mail transactionnel en file et tente l'envoi.
 * template : clé d'un modèle de src/mail/templates.ts (welcome_member, invitation, verify_email, reset_password,
 * magic_link, invoice_issued, payment_receipt, payment_reminder, payment_failed, booking_confirmed,
 * booking_cancelled, waitlist_spot, lesson_reminder, trial_ending, subscription_receipt, accountant_invite,
 * export_ready, document_to_sign, horse_care_reminder, welcome_owner). Les données attendues par chaque modèle
 * sont listées dans son champ `fields` (et par GET /api/mail/templates).
 * club_id : l'expéditeur devient « <club> via Stabl », Reply-To l'e-mail du club (sauf reply_to explicite).
 * attachments : contenu en base64 (10 Mo au total au maximum).
 * Ne lève jamais d'erreur bloquante : renvoie l'id de l'outbox (eml_…), même si l'envoi est différé ou refusé.
 */
export interface MailInput {
  to: string; template: string; data: Record<string, unknown>;
  club_id?: string | null; reply_to?: string;
  /** Nom d'expéditeur à la place de celui du club (« Dr Leclerc via Stabl » pour les factures d'un praticien). */
  from_name?: string | null; attachments?: { filename: string; content_b64: string; type: string }[];
}
export async function sendMail(env: Env, m: MailInput): Promise<string> {
  return enqueue(env, m);
}
