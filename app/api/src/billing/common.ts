import type { Env } from "../env";
import { all } from "../lib/db";

/**
 * Pages de retour de Stripe vers l'application web (lot E). Chemins de la SPA : à aligner avec
 * les écrans du lot E si besoin, ici seulement. {CHECKOUT_SESSION_ID} est remplacé par Stripe.
 */
export const RETURN_PATHS = {
  subscriptionSuccess: "/abonnement?checkout=success&session_id={CHECKOUT_SESSION_ID}",
  subscriptionCancel: "/abonnement?checkout=cancel",
  portalReturn: "/abonnement",
  connectReturn: "/paiements-en-ligne?stripe=retour",
  connectRefresh: "/paiements-en-ligne?stripe=relancer",
  invoiceSuccess: (invoiceId: string) => `/mes-factures?paiement=succes&facture=${encodeURIComponent(invoiceId)}`,
  invoiceCancel: (invoiceId: string) => `/mes-factures?paiement=annule&facture=${encodeURIComponent(invoiceId)}`,
  mandateSuccess: "/mes-factures?prelevement=succes",
  mandateCancel: "/mes-factures?prelevement=annule",
  linkSuccess: "/paiement/merci",
  linkCancel: "/paiement/annule",
};

export function appUrl(env: Env, path: string) {
  return (env.APP_URL || "").replace(/\/+$/, "") + path;
}

const nf = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
/** 14900 → « 149,00 € » (espace insécable fine avant €). */
export function euros(cents: number) { return nf.format((cents || 0) / 100); }

/** Destinataires d'un club par rôle (titulaires par défaut), avec leur prénom pour les e-mails. */
export async function ownerEmails(db: D1Database, clubId: string, roles = ["owner"]): Promise<{ email: string; first: string | null }[]> {
  const ph = roles.map(() => "?").join(",");
  return all<{ email: string; first: string | null }>(db,
    `SELECT u.email, u.first FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? AND m.status = 'active' AND m.role IN (${ph})`, clubId, ...roles);
}

export const METHOD_LABEL: Record<string, string> = { card: "Carte bancaire", sepa_debit: "Prélèvement SEPA" };

export function isoFromUnix(s: unknown): string | null {
  return typeof s === "number" && s > 0 ? new Date(s * 1000).toISOString() : null;
}

export const vatRegime = (env: Env) => (env.PLATFORM_VAT_REGIME === "normal" ? "normal" : "franchise");
export const VAT_FRANCHISE_NOTE = "TVA non applicable, article 293 B du CGI.";
