import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv, Env } from "./env";
import { errorHandler } from "./lib/http";
import { loadAuth } from "./lib/auth";
import * as R from "./routes-registry";
import { cron as authCron } from "./auth/routes";
import { cron as recordsCron } from "./records/routes";
import { cron as billingCron } from "./billing/routes";
import { cron as invoicingCron } from "./invoicing/routes";
import { cron as mailCron } from "./mail/routes";
import { cron as icsCron } from "./ics/routes";
import { cron as importCron } from "./import/routes";
import { cron as onboardingCron } from "./onboarding/routes";
import { cron as robotCron } from "./robot/routes";
import { cron as mcpCron } from "./mcp/routes";

/*
 * Plan des URL :
 *   /auth/*      connexion, inscription, Google, vérification, mot de passe   (lot auth)
 *   /api/*       API JSON de l'application (session) et API publique /api/v1 (clés pk_live_)
 *   /ics/*       flux de calendrier ICS à jeton                                 (lot ics)
 *   /webhooks/*  Stripe, plateforme de facturation, fournisseur d'e-mail
 *   /mcp, /oauth/*, /.well-known/*  connecteur MCP pour Claude, ChatGPT…            (lot mcp)
 *   le reste     application web statique (../web/dist)
 */
const app = new Hono<AppEnv>();
app.onError(errorHandler);
app.use("*", secureHeaders({ crossOriginResourcePolicy: false }));
app.use("*", loadAuth);

app.get("/api/health", (c) => c.json({ ok: true, service: "piaffe", time: new Date().toISOString() }));

app.route("/", R.authRoutes);
app.route("/", R.recordsRoutes);
app.route("/", R.billingRoutes);
app.route("/", R.invoicingRoutes);
app.route("/", R.mailRoutes);
app.route("/", R.icsRoutes);
app.route("/", R.importRoutes);
app.route("/", R.onboardingRoutes);
app.route("/", R.robotRoutes);
app.route("/", R.mcpRoutes);

app.all("/api/*", (c) => c.json({ error: { code: "not_found", message: "Route d'API inconnue." } }, 404));
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: app.fetch,
  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext) {
    for (const f of [authCron, recordsCron, billingCron, invoicingCron, mailCron, icsCron, importCron, onboardingCron, robotCron, mcpCron]) {
      ctx.waitUntil(f(env, ev.cron).catch((e) => console.error("cron", e)));
    }
  },
} satisfies ExportedHandler<Env>;
export { app };
export { RobotSession } from "./robot/session";
