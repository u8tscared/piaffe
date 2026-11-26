import { Hono } from "hono";
import type { AppEnv } from "../env";
import subscriptionRoutes, { subscriptionCron } from "./subscription";
import connectRoutes, { chargeDueInstallments } from "./connect";
import webhookRoutes from "./webhooks";
import { installBillingHooks } from "./hooks";

/*
 * Lot B · Stripe
 *  - abonnement des clubs à Stabl (vendeur : Marceau Ruis EI) : /api/billing/*, /admin/billing/*
 *  - paiements des adhérents vers leur club (Stripe Connect, direct charges) : /api/connect/*, /api/pay/*
 *  - webhooks : /webhooks/stripe (plateforme), /webhooks/stripe-connect (comptes connectés)
 * Pour les autres lots : requireActivePlan et planAccess dans ./access.
 */
installBillingHooks();

const app = new Hono<AppEnv>();
app.route("/", webhookRoutes);
app.route("/", subscriptionRoutes);
app.route("/", connectRoutes);
export default app;

export { requireActivePlan, planAccess } from "./access";

/** Cron : toutes les 10 minutes, prélèvements des échéances ; chaque matin, rappels de fin d'essai. */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  if (expr === "0 6 * * *") await subscriptionCron(env);
  else await chargeDueInstallments(env);
}
