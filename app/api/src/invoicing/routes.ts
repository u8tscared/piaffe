import type { AppEnv } from "../env";
import app, { cronImpl } from "./routes-impl";
import { registerHooks } from "./hooks";

/*
 * Lot C : factures, avoirs, acomptes, paiements, PDF Factur-X, facture électronique (plateforme agréée),
 * accès comptable et exports, factures de Piaffe aux clubs. Détails métier et sources : REGLES.md.
 */
registerHooks();
export default app;

/** Cron : toutes les 10 minutes (envoi B2B, statuts), et chaque jour à 6 h UTC (retards, relances, e-reporting, réception). */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  await cronImpl(env, expr);
}
