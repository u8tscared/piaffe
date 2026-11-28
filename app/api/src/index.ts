import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv, Env } from "./env";
import { errorHandler } from "./lib/http";
import { loadAuth } from "./lib/auth";
import { csrf } from "./auth/csrf";
import { setPasswordIterations } from "./auth/password";
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
import { cron as mediaCron } from "./media/routes";
import { cron as proCron } from "./pro/routes";

/*
 * Plan des URL :
 *   /auth/*      connexion, inscription, Google, vérification, mot de passe   (lot auth)
 *   /api/*       API JSON de l'application (session) et API publique /api/v1 (clés pk_live_)
 *   /ics/*       flux de calendrier ICS à jeton                                 (lot ics)
 *   /webhooks/*  Stripe, plateforme de facturation, fournisseur d'e-mail
 *   /mcp, /oauth/*, /.well-known/*  connecteur MCP pour Claude, ChatGPT…            (lot mcp)
 *   /admin/*     espace admin de l'équipe Stabl                                  (src/admin)
 *   le reste     application web statique (../web/dist)
 */
const app = new Hono<AppEnv>();
app.onError(errorHandler);
app.use("*", secureHeaders({ crossOriginResourcePolicy: false }));
/* CSP des réponses du Worker (JSON, PDF, ICS, petites pages HTML de désinscription ou d'activation) : rien ne s'exécute.
   Les pages statiques de l'appli ont leur propre CSP (app/web/dist/_headers, empreintes des scripts). */
const API_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data: https:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
for (const p of ["/api/*", "/auth/*", "/ics/*", "/webhooks/*"]) app.use(p, async (c, next) => { await next(); if (!c.res.headers.has("content-security-policy")) c.res.headers.set("content-security-policy", API_CSP); });
/* Limite de taille des requêtes : 1 Mo pour le JSON (les imports et fichiers ont leurs routes et leurs limites). */
const BIG = /^\/api\/(records\/batch|v1\/import|migration|media|medias|files|uploads?|einvoicing\/sandbox)|^\/webhooks\//;
app.use("*", async (c, next) => {
  const len = parseInt(c.req.header("content-length") || "0", 10);
  if (len > 1_048_576 && !BIG.test(c.req.path) && (c.req.header("content-type") || "").includes("json"))
    return c.json({ error: { code: "too_large", message: "Requête trop volumineuse (1 Mo au plus)." } }, 413);
  return next();
});
app.use("*", loadAuth);
app.use("*", R.adminGuard); // vue admin en lecture seule, clubs suspendus, journal des erreurs 5xx (src/admin/guard.ts)
/* Protection CSRF sur toute l'API et l'authentification (chaque lot la pose aussi sur ses routes, mais
   plusieurs routes de paiement et de facturation l'avaient oubliée). Exceptions : la désinscription en un clic
   (RFC 8058, envoyée par le client de messagerie sans en-tête Origin), protégée par son jeton signé. */
const CSRF_EXEMPT = /^\/api\/(mail\/unsubscribe|contact)$/; // + formulaire de contact du site stablapp.fr (champ piège, limite de débit)
app.use("/api/*", async (c, next) => (CSRF_EXEMPT.test(c.req.path) ? next() : csrf(c, next)));
app.use("/auth/*", csrf);

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
app.route("/", R.adminRoutes);
app.route("/", R.mediaRoutes);
app.route("/", R.publicRoutes);
app.route("/", R.proRoutes);

app.all("/api/*", (c) => c.json({ error: { code: "not_found", message: "Route d'API inconnue." } }, 404));
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));

/**
 * SESSION_SECRET signe les liens de désinscription, d'activation et de calendrier. Absent, ces liens seraient
 * falsifiables : en local (APP_URL en http://localhost) on prend une valeur de développement, en production
 * on refuse de servir l'API avec un message clair (scripts/deployer.sh le crée automatiquement).
 */
const DEV_SECRET = "dev-local-uniquement-0123456789abcdef0123456789";
let warned = false;
export function withSecrets(env: Env): Env | null {
  if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 32) return env;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(env.APP_URL || "")) {
    if (!warned) { warned = true; console.warn("SESSION_SECRET absent : valeur de développement utilisée (local seulement)."); }
    return { ...env, SESSION_SECRET: DEV_SECRET };
  }
  return null;
}

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    setPasswordIterations(env.PASSWORD_ITERATIONS);
    const e = withSecrets(env);
    if (!e) {
      const p = new URL(req.url).pathname;
      if (/^\/(api|auth|ics|webhooks|mcp|oauth|admin)(\/|$)/.test(p)) {
        console.error("SESSION_SECRET manquant ou trop court : lancez « npx wrangler secret put SESSION_SECRET » (32 caractères ou plus).");
        return Response.json({ error: { code: "misconfigured", message: "Le service est en cours de configuration. Réessayez dans quelques minutes." } }, { status: 503 });
      }
      return app.fetch(req, env, ctx);
    }
    return app.fetch(req, e, ctx);
  },
  async scheduled(ev: ScheduledController, rawEnv: Env, ctx: ExecutionContext) {
    const env = withSecrets(rawEnv);
    if (!env) { console.error("cron ignoré : SESSION_SECRET manquant"); return; }
    for (const f of [authCron, recordsCron, billingCron, invoicingCron, mailCron, icsCron, importCron, onboardingCron, robotCron, mcpCron, mediaCron, proCron]) {
      ctx.waitUntil(f(env, ev.cron).catch((e) => console.error("cron", e)));
    }
  },
} satisfies ExportedHandler<Env>;
export { app };
export { RobotSession } from "./robot/session";
