/**
 * Charte des e-mails : UN SEUL endroit à modifier quand le nom ou le logo changent.
 * - BRAND.name : nom de marque affiché (expéditeur « <club> via Piaffe », signature, pied de page).
 * - BRAND.logoUrl : URL absolue d'une image PNG (hauteur affichée 28 px, prévoir 2x : 56 px de haut).
 *   Vide = mot-symbole texte, qui s'affiche partout sans image distante.
 * - Les e-mails d'un club affichent le logo du club s'il en a un (clubs.logo_key dans R2), sinon celui de la marque.
 */
export const BRAND = {
  name: "Piaffe",
  tagline: "Le logiciel des écuries et centres équestres",
  logoUrl: "",            // ex. "https://app.piaffe.fr/brand/logo-mail@2x.png"
  logoWidth: 112,
  logoHeight: 28,
  colors: {
    ink: "#0a1636",       // encre marine : titres, texte fort, bouton
    sapphire: "#1f4fd1",  // saphir : liens, accents
    sapphireSoft: "#e8eefc",
    text: "#2b3550",
    muted: "#6b7390",
    line: "#e3e6ee",
    bg: "#f4f5f9",
    card: "#ffffff",
    ok: "#127a4b",
    warn: "#9a5b00",
    bad: "#b42318",
    darkBg: "#0b1020",
    darkCard: "#141a2e",
    darkText: "#e6e9f2",
    darkMuted: "#a3abc2",
    darkLine: "#2a3350",
    darkLink: "#8fb0ff",
  },
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  legal: "Marceau Ruis (EI), SIREN 934 733 122",
  supportEmail: "bonjour@piaffe.fr",
};

/** Nom d'expéditeur : « Écurie des Tilleuls via Piaffe », ou « Piaffe » pour les e-mails de la plateforme. */
export function senderName(clubName?: string | null): string {
  const clean = (s: string) => s.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  return clubName ? `${clean(clubName)} via ${BRAND.name}` : BRAND.name;
}

/** Adresse d'envoi extraite de MAIL_FROM (« Piaffe <bonjour@piaffe.fr> » ou « bonjour@piaffe.fr »). */
export function senderAddress(mailFrom: string | undefined): string {
  const m = /<([^>]+)>/.exec(mailFrom || "");
  return (m ? m[1] : (mailFrom || "")).trim() || BRAND.supportEmail;
}

/** En-tête From prêt à l'emploi (nom entre guillemets pour supporter les virgules et accents). */
export function formatFrom(name: string, address: string): string {
  return `"${name.replace(/["\\]/g, "")}" <${address}>`;
}
