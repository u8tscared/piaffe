/** Version en vigueur des textes légaux publiés sur stablapp.fr (legal/build.js, VERSION). À changer en même temps. */
export const LEGAL_VERSION = "2026-11-28";
export const LEGAL_URLS = {
  cgu: "https://stablapp.fr/cgu/",
  cgv: "https://stablapp.fr/cgv/",
  confidentialite: "https://stablapp.fr/confidentialite/",
  sous_traitance: "https://stablapp.fr/sous-traitance/",
  mentions: "https://stablapp.fr/mentions-legales/",
} as const;
/** Version annoncée par le client si elle a la bonne forme, sinon la version en vigueur. */
export const legalVersion = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : LEGAL_VERSION);
