/**
 * Charte des e-mails : UN SEUL endroit à modifier quand le nom ou le logo changent.
 * - BRAND.name : nom de marque affiché (expéditeur « <club> via Stabl », signature, pied de page).
 * - BRAND.assetsUrl : dossier des images des e-mails (PNG @2x, fond transparent), servi par GitHub Pages
 *   depuis brand/stabl/mail/ (voir tools-pages.sh). Les fichiers sont listés dans BRAND.img.
 * - BRAND.logoUrl : logo blanc affiché sur le bandeau marine des e-mails de la plateforme.
 *   Vide = mot-symbole texte, qui s'affiche partout sans image distante.
 * - Les e-mails d'un club affichent le logo du club s'il en a un (clubs.logo_key dans R2), sinon sa pastille (initiale).
 */
const ASSETS = "https://stablapp.fr/brand/mail";
export const BRAND = {
  name: "Stabl",
  tagline: "Le logiciel des écuries et centres équestres",
  short: "Le logiciel des écuries",
  site: "https://stablapp.fr",
  assetsUrl: ASSETS,
  logoUrl: `${ASSETS}/stabl-logo-blanc@2x.png`,
  /** Logo affiché : 28 px de haut, proportions du fichier officiel (207 × 88). */
  logoWidth: 66,
  logoHeight: 28,
  img: {
    logoWhite: `${ASSETS}/stabl-logo-blanc@2x.png`,
    logoNavy: `${ASSETS}/stabl-logo-marine@2x.png`,
    logoSapphire: `${ASSETS}/stabl-logo-saphir@2x.png`,
    symbolSapphire: `${ASSETS}/stabl-symbole-saphir@2x.png`,
    symbolWhite: `${ASSETS}/stabl-symbole-blanc@2x.png`,
    /** En-tête « Nuit au box » : tête de cheval en filigrane sur fond box (600 × 520, opaque). */
    watermark: `${ASSETS}/filigrane-nuit@2x.png`,
  },
  /** DA « Nuit au box » (choisie le 28/11/2026) : tout le mail en marine, titres blancs énormes, accents strass. */
  night: {
    page: "#060e26",      // autour du mail et pied de page
    body: "#0a1636",      // corps du mail
    box: "#0e1d4a",       // en-tête et panneaux
    watermark: "#1a3172", // filigrane, fonds de pastilles
    line: "#22356f",      // filets
    edge: "#2a3f80",      // bordure basse de l'en-tête, boutons secondaires
    strass: "#6d8bff",    // étiquettes, boutons, liens
    lead: "#c6cfec",      // texte courant
    soft: "#aeb9de",      // texte secondaire
    faint: "#7f8cb8",     // pied de page
  },
  colors: {
    ink: "#0a1636",       // encre marine : titres, texte fort, bandeau
    navy: "#0a1636",
    navy2: "#141f45",     // marine éclairci (pastilles, filets sur le bandeau)
    sapphire: "#2448d8",  // saphir : boutons, liens, accents
    sapphireDark: "#1834b0",
    strass: "#6d8bff",    // bleu clair : accents sur fond marine
    sapphireSoft: "#e7ecff",
    heroText: "#c9d3f5",  // sous-titre sur le bandeau marine
    text: "#2b3550",
    muted: "#646d88",
    line: "#e3e6ee",
    bg: "#f4f5f9",
    card: "#ffffff",
    panel: "#f6f7fb",
    ok: "#11864f",
    okSoft: "#dcf3e4",
    warn: "#a85d00",
    warnSoft: "#ffedcf",
    bad: "#cc3a24",
    badSoft: "#ffe3de",
    darkBg: "#070d1f",
    darkCard: "#111831",
    darkPanel: "#18203d",
    darkText: "#e6e9f2",
    darkMuted: "#a3abc2",
    darkLine: "#27304f",
    darkLink: "#8fa6ff",
  },
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Texte : Inter si le client de messagerie charge les polices web (Apple Mail, iOS), sinon police système. */
  fontText: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Titres : Bricolage Grotesque 800 (DA de l'app), repli sur la police système en gras. */
  fontDisplay: "'Bricolage Grotesque', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontsHref: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600;700&display=swap",
  legal: "Marceau Ruis (EI), SIREN 934 733 122",
  supportEmail: "bonjour@stablapp.fr",
};

/** Nom d'expéditeur : « Écurie des Tilleuls via Stabl », ou « Stabl » pour les e-mails de la plateforme. */
export function senderName(clubName?: string | null): string {
  const clean = (s: string) => s.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  return clubName ? `${clean(clubName)} via ${BRAND.name}` : BRAND.name;
}

/** Adresse d'envoi extraite de MAIL_FROM (« Stabl <bonjour@stablapp.fr> » ou « bonjour@stablapp.fr »). */
export function senderAddress(mailFrom: string | undefined): string {
  const m = /<([^>]+)>/.exec(mailFrom || "");
  return (m ? m[1] : (mailFrom || "")).trim() || BRAND.supportEmail;
}

/** En-tête From prêt à l'emploi (nom entre guillemets pour supporter les virgules et accents). */
export function formatFrom(name: string, address: string): string {
  return `"${name.replace(/["\\]/g, "")}" <${address}>`;
}
