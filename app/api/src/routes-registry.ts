/* Point de montage unique : chaque lot possède son fichier routes.ts et ne touche pas aux autres. */
export { default as authRoutes } from "./auth/routes";
export { default as recordsRoutes } from "./records/routes";
export { default as billingRoutes } from "./billing/routes";
export { default as invoicingRoutes } from "./invoicing/routes";
export { default as mailRoutes } from "./mail/routes";
export { default as icsRoutes } from "./ics/routes";
export { default as importRoutes } from "./import/routes";
export { default as onboardingRoutes } from "./onboarding/routes";
