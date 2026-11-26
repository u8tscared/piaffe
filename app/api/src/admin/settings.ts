/* Espace admin · réglages (lecture seule) et journal des actions admin. Aucun secret n'est jamais renvoyé. */
import { Hono } from "hono";
import type { AppEnv, Env } from "../env";
import { all, json, one } from "../lib/db";
import { APPLICATION_FEE_PERCENT, COUPONS, FOUNDER_OFFER, PLANS, REFERRAL, TRIAL_DAYS, TRIAL_REMINDER_DAYS, WRITE_GRACE_DAYS } from "../billing/plans";
import { adminEmails } from "./access";

const app = new Hono<AppEnv>();
type St = "ok" | "test" | "missing";

export function integrations(env: Env) {
  const e = env as any;
  const has = (k: string) => typeof e[k] === "string" && e[k].length > 0;
  const sk = String(e.STRIPE_SECRET_KEY || "");
  const stripe: St = !sk ? "missing" : /^(sk|rk)_live_/.test(sk) ? "ok" : "test";
  const mailP = String(env.MAIL_PROVIDER || "log");
  const einv = String(env.EINVOICE_PROVIDER || "sandbox");
  return [
    { key: "stripe", name: "Stripe (abonnements et paiements)", status: stripe,
      detail: stripe === "missing" ? "Clé secrète absente." : stripe === "test" ? "Clé de test : aucun vrai paiement." : "Clé de production.",
      checks: [["Clé secrète", !!sk], ["Webhook plateforme", has("STRIPE_WEBHOOK_SECRET")], ["Webhook Connect", has("STRIPE_CONNECT_WEBHOOK_SECRET")], ["Secret d'administration", has("BILLING_ADMIN_SECRET")]] },
    { key: "mail", name: "E-mails", status: (mailP === "log" ? "test" : has("MAIL_API_KEY") ? "ok" : "missing") as St,
      detail: mailP === "log" ? "Mode journal : les e-mails sont écrits dans la file sans partir." : `Fournisseur : ${mailP}.`,
      checks: [["Fournisseur", mailP !== "log"], ["Clé d'API", has("MAIL_API_KEY")], ["Webhook des rebonds", has("MAIL_WEBHOOK_SECRET")], ["Expéditeur", has("MAIL_FROM")]] },
    { key: "google", name: "Connexion Google", status: (has("GOOGLE_CLIENT_ID") && has("GOOGLE_CLIENT_SECRET") ? "ok" : "missing") as St,
      detail: has("GOOGLE_CLIENT_ID") ? "Identifiants OAuth présents." : "Identifiants OAuth absents : le bouton Google ne marche pas.",
      checks: [["Identifiant client", has("GOOGLE_CLIENT_ID")], ["Secret client", has("GOOGLE_CLIENT_SECRET")]] },
    { key: "einvoice", name: "Facture électronique", status: (einv === "sandbox" ? "test" : has("EINVOICE_API_KEY") ? "ok" : "missing") as St,
      detail: einv === "sandbox" ? "Plateforme de test (sandbox) : rien n'est transmis." : `Plateforme : ${einv}.`,
      checks: [["Plateforme agréée", einv !== "sandbox"], ["Clé d'API", has("EINVOICE_API_KEY")]] },
    { key: "robot", name: "Robot de migration", status: (env.BROWSER && env.ROBOT ? "ok" : "missing") as St,
      detail: env.BROWSER && env.ROBOT ? "Navigateur et sessions disponibles." : "Browser Rendering ou Durable Object absent.",
      checks: [["Navigateur (Browser Rendering)", !!env.BROWSER], ["Sessions (Durable Object)", !!env.ROBOT]] },
    { key: "files", name: "Fichiers (R2)", status: (env.FILES ? "ok" : "missing") as St, detail: env.FILES ? "Stockage des PDF et des captures disponible." : "Stockage absent.", checks: [["Bucket R2", !!env.FILES]] },
  ].map((x) => ({ ...x, checks: x.checks.map(([label, ok]) => ({ label, ok })) }));
}

app.get("/admin/api/reglages", async (c) => {
  const env = c.env;
  const founders = await one<{ n: number }>(env.DB, "SELECT COUNT(*) AS n FROM billing_subscriptions WHERE founder = 1");
  return c.json({
    plans: PLANS.map((p) => ({ key: p.key, name: p.name, tagline: p.tagline, month_cents: p.month_cents, year_cents: p.year_cents, limits: p.limits })),
    founder: { ...FOUNDER_OFFER, used: founders?.n ?? 0 },
    coupons: COUPONS, referral: REFERRAL,
    rules: { trial_days: TRIAL_DAYS, trial_reminders: TRIAL_REMINDER_DAYS, write_grace_days: WRITE_GRACE_DAYS, application_fee_percent: APPLICATION_FEE_PERCENT },
    platform: {
      APP_URL: env.APP_URL, MAIL_FROM: env.MAIL_FROM, MAIL_PROVIDER: env.MAIL_PROVIDER, EINVOICE_PROVIDER: env.EINVOICE_PROVIDER,
      PLATFORM_LEGAL_NAME: env.PLATFORM_LEGAL_NAME, PLATFORM_TRADE_NAME: env.PLATFORM_TRADE_NAME, PLATFORM_SIREN: env.PLATFORM_SIREN,
      PLATFORM_SIRET: env.PLATFORM_SIRET, PLATFORM_ADDRESS: env.PLATFORM_ADDRESS, PLATFORM_VAT_REGIME: env.PLATFORM_VAT_REGIME,
    },
    integrations: integrations(env),
    admins: { count: adminEmails(env).length },
  });
});

app.get("/admin/api/journal", async (c) => {
  const rows = await all<any>(c.env.DB, `SELECT a.id, a.action, a.target, a.data, a.at, a.club_id, cl.name AS club_name, u.email AS by
    FROM audit_log a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN clubs cl ON cl.id = a.club_id
    WHERE a.action LIKE 'admin.%' ORDER BY a.at DESC LIMIT 100`);
  return c.json({ entries: rows.map((r) => ({ ...r, data: json(r.data, null) })) });
});

export default app;
