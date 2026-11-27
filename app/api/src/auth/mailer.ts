import type { Env } from "../env";
import { sendMail, type MailInput } from "../mail/send";

/**
 * Passage obligé des e-mails du lot A vers sendMail (contrat du lot mail).
 * setMailer permet aux tests de capturer les e-mails sans dépendre de l'implémentation du lot mail.
 */
type Mailer = (env: Env, m: MailInput) => Promise<string>;
let override: Mailer | null = null;
export function setMailer(f: Mailer | null) { override = f; }

export async function mail(env: Env, m: MailInput): Promise<void> {
  try { await (override || sendMail)(env, m); } catch (e) { console.error("Envoi d'e-mail impossible", m.template, (e as Error)?.message); }
}

/** Chemins de l'application web vers lesquels pointent les e-mails (modifiables ici si l'appli web change ses routes). */
export const WEB = {
  verify: "/verifier-email",          // ?token=
  reset: "/nouveau-mot-de-passe",     // ?token=
  invitation: "/invitation/",         // + token
  login: "/connexion",                // ?erreur=
  home: "/",
};
export function appUrl(env: Env, path: string): string {
  return (env.APP_URL || "").replace(/\/+$/, "") + path;
}

export const ROLE_LABEL: Record<string, string> = {
  owner: "gérant titulaire", manager: "gérant", staff: "employé", coach: "coach", member: "adhérent", accountant: "comptable", provider: "praticien (vétérinaire, maréchal…)",
};
