/**
 * Référentiel métier des centres équestres : catégories de lignes, taux de TVA par défaut, comptes du plan
 * comptable, moyens de paiement, régimes de TVA et mentions. Tout est documenté dans REGLES.md.
 */

export type VatRegime = "normal" | "franchise" | "association_exoneree";
export type OpKind = "services" | "goods";

export interface Category {
  label: string;
  rate_bp: number;          // taux par défaut (régime normal), en points de base
  account: string;          // compte de produit (classe 7) ou de tiers pour les débours
  kind: OpKind;             // pour la catégorie de l'opération (livraison de biens ou prestation de services)
  exempt?: string;          // si renseigné : ligne exonérée (catégorie E) avec ce motif, quel que soit le régime
}

/** Taux réduit de 5,5 % : art. 278-0 bis O du CGI (activités équestres, depuis le 1er janvier 2024). */
export const CATEGORIES: Record<string, Category> = {
  lesson:      { label: "Enseignement et pratique de l'équitation", rate_bp: 550, account: "706100", kind: "services" },
  boarding:    { label: "Pension en établissement équestre",          rate_bp: 550, account: "706200", kind: "services" },
  boarding_std:{ label: "Pension, hébergement et soins (taux normal)", rate_bp: 2000, account: "706210", kind: "services" },
  facilities:  { label: "Accès aux installations sportives",          rate_bp: 550, account: "706300", kind: "services" },
  course:      { label: "Stages, animations et randonnées",           rate_bp: 550, account: "706400", kind: "services" },
  competition: { label: "Compétitions et engagements",                rate_bp: 550, account: "706500", kind: "services" },
  horse_lease: { label: "Mise à disposition d'équidés",               rate_bp: 550, account: "706600", kind: "services" },
  transport:   { label: "Transport d'équidés",                        rate_bp: 2000, account: "706700", kind: "services" },
  service:     { label: "Autres prestations de services",             rate_bp: 2000, account: "706800", kind: "services" },
  goods:       { label: "Ventes de marchandises (sellerie, boutique)", rate_bp: 2000, account: "707000", kind: "goods" },
  food:        { label: "Buvette et alimentation",                    rate_bp: 1000, account: "707200", kind: "goods" },
  horse_sale:  { label: "Ventes d'équidés",                           rate_bp: 2000, account: "707100", kind: "goods" },
  horse_sale_breeding: { label: "Ventes d'équidés pour la reproduction", rate_bp: 550, account: "707110", kind: "goods" },
  rebilling:   { label: "Refacturations (maréchal, vétérinaire, fournitures)", rate_bp: 2000, account: "708000", kind: "services" },
  disbursement:{ label: "Débours (licence FFE, engagements reversés)", rate_bp: 0, account: "467100", kind: "services",
                 exempt: "Débours refacturés à l'euro près, exclus de la base d'imposition (art. 267 II-2° du CGI)" },
  membership:  { label: "Cotisations et adhésions",                   rate_bp: 0, account: "756000", kind: "services",
                 exempt: "Cotisation hors du champ de la TVA (absence de contrepartie individualisée)" },
  other:       { label: "Autres produits",                            rate_bp: 2000, account: "708800", kind: "services" },
};

export const ALLOWED_RATES_BP = [0, 210, 550, 1000, 2000];

export const REGIME_MENTION: Record<VatRegime, string | null> = {
  normal: null,
  franchise: "TVA non applicable, art. 293 B du CGI",
  association_exoneree: "Exonération de TVA, art. 261, 7-1° du CGI (organisme sans but lucratif)",
};
/** Codes VATEX (EN 16931, liste CEF) utilisés pour les motifs d'exonération. */
export const REGIME_VATEX: Record<VatRegime, string | null> = {
  normal: null,
  franchise: "VATEX-FR-FRANCHISE",
  association_exoneree: "VATEX-EU-132",
};

export type PayMethod = "card" | "sepa" | "transfer" | "check" | "cash" | "ancv" | "pass_sport" | "other";
export const PAY_METHODS: Record<PayMethod, { label: string; account: string; untdid: string; journal: string }> = {
  card:       { label: "Carte bancaire",        account: "511500", untdid: "48", journal: "BQ" },
  sepa:       { label: "Prélèvement SEPA",      account: "512000", untdid: "59", journal: "BQ" },
  transfer:   { label: "Virement",              account: "512000", untdid: "58", journal: "BQ" },
  check:      { label: "Chèque",                account: "511200", untdid: "20", journal: "BQ" },
  cash:       { label: "Espèces",               account: "530000", untdid: "10", journal: "CA" },
  ancv:       { label: "Chèques-vacances ANCV", account: "511300", untdid: "1",  journal: "BQ" },
  pass_sport: { label: "Pass'Sport",            account: "441000", untdid: "1",  journal: "BQ" },
  other:      { label: "Autre moyen",           account: "471000", untdid: "1",  journal: "BQ" },
};
/** Normalise un moyen de paiement venant de Stripe ou de l'interface. */
export function normMethod(m: unknown): PayMethod {
  const s = String(m || "").toLowerCase();
  if (s in PAY_METHODS) return s as PayMethod;
  if (/sepa|debit|prélèvement|prelevement/.test(s)) return "sepa";
  if (/card|carte|cb/.test(s)) return "card";
  if (/virement|transfer|bank/.test(s)) return "transfer";
  if (/ancv|vacances/.test(s)) return "ancv";
  if (/pass/.test(s)) return "pass_sport";
  if (/chèque|cheque|check/.test(s)) return "check";
  if (/esp|cash/.test(s)) return "cash";
  return "other";
}

/** Plan de comptes proposé (modifiable dans les réglages : settings.accounts). */
export const ACCOUNTS: Record<string, string> = {
  "411000": "Clients",
  "419100": "Clients, avances et acomptes reçus",
  "401000": "Fournisseurs",
  "445711": "TVA collectée 5,5 %",
  "445712": "TVA collectée 10 %",
  "445713": "TVA collectée 20 %",
  "445714": "TVA collectée 2,1 %",
  "445660": "TVA déductible sur biens et services",
  "467100": "Débours pour le compte des clients",
  "441000": "État, aides à recevoir (Pass'Sport)",
  "471000": "Compte d'attente",
  "511200": "Chèques à encaisser",
  "511300": "Chèques-vacances ANCV à encaisser",
  "511500": "Paiements en ligne à recevoir (Stripe)",
  "512000": "Banque",
  "530000": "Caisse",
  "606000": "Achats non stockés de matières et fournitures",
  "622600": "Honoraires",
  "651000": "Redevances pour logiciels",
  "706100": "Enseignement de l'équitation",
  "706200": "Pensions",
  "706210": "Pensions, part hébergement au taux normal",
  "706300": "Accès aux installations",
  "706400": "Stages et animations",
  "706500": "Compétitions et engagements",
  "706600": "Mise à disposition d'équidés",
  "706700": "Transport d'équidés",
  "706800": "Autres prestations de services",
  "707000": "Ventes de marchandises",
  "707100": "Ventes d'équidés",
  "707110": "Ventes d'équidés pour la reproduction",
  "707200": "Buvette",
  "708000": "Refacturations",
  "708800": "Autres produits des activités annexes",
  "756000": "Cotisations",
};
export function vatAccount(rate_bp: number): string {
  return rate_bp === 550 ? "445711" : rate_bp === 1000 ? "445712" : rate_bp === 210 ? "445714" : "445713";
}

/** Statuts internes → libellés de l'interface (format de la démo). */
export const STATUS_FR: Record<string, string> = {
  draft: "brouillon", issued: "émise", sent: "envoyée", partially_paid: "partiellement payée",
  paid: "payée", overdue: "en retard", cancelled: "annulée",
};

/** Codes normés du cycle de vie (norme XP Z12-012, annexe de la réforme). */
export const LIFECYCLE: Record<string, string> = {
  "200": "Déposée", "201": "Émise par la plateforme", "202": "Reçue par la plateforme", "203": "Mise à disposition",
  "204": "Prise en charge", "205": "Approuvée", "206": "Approuvée partiellement", "207": "En litige",
  "208": "Suspendue", "209": "Complétée", "210": "Refusée", "211": "Paiement transmis", "212": "Encaissée",
  "213": "Rejetée",
};

export function fmtEur(cents: number): string {
  const neg = cents < 0; const a = Math.abs(cents);
  const ent = Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (neg ? "−" : "") + ent + "," + String(a % 100).padStart(2, "0") + " €";
}
export function fmtRate(bp: number): string {
  const s = (bp / 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
  return s + " %";
}
export function fmtDateFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
