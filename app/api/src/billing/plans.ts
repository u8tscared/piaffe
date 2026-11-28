/**
 * Offres de Stabl vendues aux clubs (vendeur : Marceau Ruis EI, SIREN 934 733 122).
 * FICHIER SANS IMPORT : il est aussi lu par scripts/setup-stripe.mjs (Node, suppression des types).
 *
 * Pour changer un prix : modifiez amount_cents ici, puis relancez le script de catalogue. Stripe ne permet
 * pas de modifier le montant d'un Price : le script crée un nouveau Price, lui transfère la lookup_key
 * (transfer_lookup_key) et archive l'ancien. Les abonnements existants gardent leur ancien prix
 * jusqu'à ce que vous les migriez dans le tableau de bord Stripe.
 *
 * Prix alignés sur le business plan du projet (Essentiel 59 €, centre complet 149 €, plusieurs sites
 * 289 €, fondateurs 99 € à vie). Montants HT en centimes. Annuel = 10 mois (2 mois offerts).
 */

export type PlanKey = "essentiel" | "club" | "domaine";
export type Interval = "month" | "year";

export interface Plan {
  key: PlanKey;
  name: string;
  tagline: string;
  month_cents: number;
  /** Prix annuel : 10 fois le mensuel par défaut (2 mois offerts). */
  year_cents: number;
  features: string[];
  /** Limites indicatives affichées dans l'interface (null = illimité). */
  limits: { horses: number | null; sites: number };
  highlighted?: boolean;
}

export const CURRENCY = "eur";
export const TRIAL_DAYS = 30;
/** Jours de grâce après un impayé (ou la fin de l'essai) avant de bloquer l'écriture. La lecture reste permise. */
export const WRITE_GRACE_DAYS = 7;
/** Rappels de fin d'essai, en jours avant la fin. */
export const TRIAL_REMINDER_DAYS = [7, 3, 1];

export const PLANS: Plan[] = [
  {
    key: "essentiel", name: "Essentiel", tagline: "Poney-club et petite écurie",
    month_cents: 5900, year_cents: 59000,
    features: ["Adhérents, chevaux et planning", "Facturation et facture électronique", "Paiement en ligne des adhérents", "Calendriers synchronisés"],
    limits: { horses: 30, sites: 1 },
  },
  {
    key: "club", name: "Club", tagline: "Le centre équestre complet",
    month_cents: 14900, year_cents: 149000, highlighted: true,
    features: ["Tout Essentiel, sans limite de chevaux", "Pensions, soins et maréchalerie", "Prélèvements SEPA automatiques", "Accès comptable et exports FEC", "Reprise des données offerte"],
    limits: { horses: null, sites: 1 },
  },
  {
    key: "domaine", name: "Domaine", tagline: "Plusieurs sites, grandes structures",
    month_cents: 28900, year_cents: 289000,
    features: ["Tout Club", "Plusieurs sites", "Accompagnement prioritaire", "API et intégrations"],
    limits: { horses: null, sites: 10 },
  },
];

/**
 * Offre fondateurs : les 30 premiers clubs, prix garanti à vie. Accordée club par club par Marceau
 * (route d'administration /admin/billing/founder). Donne les fonctions du plan Club.
 */
export const FOUNDER_OFFER = { plan: "club" as PlanKey, name: "Club fondateur", month_cents: 9900, year_cents: 99000, max_clubs: 30 };

/** Parrainage : le filleul reçoit un bon sur sa première facture, le parrain un crédit sur son compte. */
export const REFERRAL = {
  coupon_id: "piaffe_parrainage",
  coupon_name: "Parrainage Stabl",
  /** Remise du filleul, une seule fois. */
  referee_amount_off_cents: 5000,
  /** Crédit offert au parrain sur sa prochaine facture, après le premier paiement du filleul. */
  referrer_credit_cents: 5000,
};

/** Coupons créés par le script de catalogue (les codes promo se créent ensuite dans Stripe sur ces coupons). */
export const COUPONS = [
  { id: REFERRAL.coupon_id, name: REFERRAL.coupon_name, amount_off: REFERRAL.referee_amount_off_cents, currency: CURRENCY, duration: "once" },
  { id: "piaffe_lancement", name: "Lancement Stabl", percent_off: 20, duration: "repeating", duration_in_months: 3 },
];

/** Clé de recherche du Price Stripe (lookup_key). */
export function lookupKey(plan: PlanKey | "fondateur", interval: Interval): string {
  return `piaffe_${plan}_${interval}`;
}

/** Catalogue complet attendu dans Stripe : un produit par offre, deux prix par produit. */
export function catalog() {
  const items = PLANS.map((p) => ({
    product_id: "piaffe_" + p.key,
    product_name: "Stabl " + p.name,
    description: p.tagline,
    prices: [
      { lookup_key: lookupKey(p.key, "month"), interval: "month" as Interval, amount: p.month_cents },
      { lookup_key: lookupKey(p.key, "year"), interval: "year" as Interval, amount: p.year_cents },
    ],
  }));
  items.push({
    product_id: "piaffe_fondateur",
    product_name: "Stabl " + FOUNDER_OFFER.name,
    description: "Offre des clubs fondateurs, prix garanti à vie",
    prices: [
      { lookup_key: lookupKey("fondateur", "month"), interval: "month", amount: FOUNDER_OFFER.month_cents },
      { lookup_key: lookupKey("fondateur", "year"), interval: "year", amount: FOUNDER_OFFER.year_cents },
    ],
  });
  return { currency: CURRENCY, products: items, coupons: COUPONS };
}

export function findPlan(key: unknown): Plan | undefined {
  return PLANS.find((p) => p.key === key);
}

/** Retrouve l'offre à partir d'une lookup_key Stripe (piaffe_club_month → club). */
export function planFromLookupKey(k: string | null | undefined): { plan: PlanKey; interval: Interval; founder: boolean } | null {
  const m = /^piaffe_(essentiel|club|domaine|fondateur)_(month|year)$/.exec(k || "");
  if (!m) return null;
  const founder = m[1] === "fondateur";
  return { plan: founder ? FOUNDER_OFFER.plan : (m[1] as PlanKey), interval: m[2] as Interval, founder };
}

/* ---------- Paiements des adhérents vers leur club (Stripe Connect) ---------- */

/** Commission de Stabl sur les paiements encaissés par les clubs, en pourcentage (0 = aucune). */
export const APPLICATION_FEE_PERCENT = 0;
/** Délai entre l'avis de prélèvement et le prélèvement automatique d'une facture (jours). */
export const AUTOPAY_NOTICE_DAYS = 3;
/** Nouvelles tentatives d'un prélèvement échoué avant de prévenir le gérant. */
export const MAX_CHARGE_ATTEMPTS = 3;
/** Durée de validité d'un lien de paiement envoyé par le gérant (jours). */
export const PAY_LINK_DAYS = 30;
