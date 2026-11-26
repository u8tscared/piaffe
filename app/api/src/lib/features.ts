import type { Env } from "../env";

/**
 * Ce qui est réellement branché sur ce serveur. L'appli web s'en sert pour griser proprement ce qui n'est
 * pas encore activé (« paiement en ligne pas encore activé ») au lieu d'afficher une erreur.
 *  - mail     : un vrai fournisseur d'e-mail est configuré (sinon les e-mails sont seulement journalisés) ;
 *  - payments : Stripe est configuré (abonnement et paiements en ligne des adhérents) ;
 *  - google   : la connexion « Continuer avec Google » est configurée.
 */
export function features(env: Env) {
  const provider = (env.MAIL_PROVIDER || "log").toLowerCase();
  return {
    mail: provider !== "log" && !!env.MAIL_API_KEY,
    payments: !!env.STRIPE_SECRET_KEY,
    google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  };
}

/** Développement local : APP_URL en http://localhost. */
export const isLocalDev = (env: Env) => /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(env.APP_URL || "");
