import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireRole, requireUser } from "../lib/auth";
import { csrf } from "../auth/csrf";
import { all, one, rateLimit, run } from "../lib/db";
import { ApiError, bad, body, notFound } from "../lib/http";
import { BRAND } from "./brand";
import { esc } from "./layout";
import { processQueue, purge } from "./outbox";
import { runDailyReminders } from "./reminders";
import { CATEGORY_LABEL, loadClub, readUnsubToken, renderTemplate } from "./render";
import { TEMPLATES } from "./templates";
import { handleMailWebhook } from "./webhook";
import { sendMail } from "./send";
import "./hooks";

const app = new Hono<AppEnv>();
for (const p of ["/api/mail/preferences", "/api/mail/test/*", "/api/mail/outbox/*"]) app.use(p, csrf);
const OPTIONAL = ["bookings", "reminders", "waitlist"] as const;

/* ---------- Modèles : liste et aperçu (gérant) ---------- */
app.get("/api/mail/templates", requireRole("owner", "manager"), (c) =>
  c.json({ templates: Object.entries(TEMPLATES).map(([k, t]) => ({ key: k, name: t.name, description: t.description, category: t.category, essential: t.category === "essential", fields: t.fields, sample: t.sample })) }));

app.get("/api/mail/preview/:template", requireRole("owner", "manager"), async (c) => {
  const k = c.req.param("template");
  const def = TEMPLATES[k];
  if (!def) throw notFound("Modèle d'e-mail inconnu.");
  const club = await loadClub(c.env, c.get("club")!.id);
  const r = await renderTemplate(c.env, k, def.sample, ["welcome_owner", "trial_ending", "subscription_receipt", "verify_email", "reset_password"].includes(k) ? null : club, c.get("user")!.email);
  const fmt = c.req.query("format");
  if (fmt === "text") return c.text(r.text);
  if (fmt === "json") return c.json({ subject: r.subject, html: r.html, text: r.text, category: r.category });
  return c.html(r.html, 200, { "content-security-policy": "default-src 'none'; img-src * data:; style-src 'unsafe-inline'", "x-frame-options": "SAMEORIGIN" });
});

/** Envoie l'exemple d'un modèle à l'adresse du gérant connecté (pour vérifier le rendu dans sa messagerie). */
app.post("/api/mail/test/:template", requireRole("owner", "manager"), async (c) => {
  const k = c.req.param("template");
  if (!TEMPLATES[k]) throw notFound("Modèle d'e-mail inconnu.");
  if (!(await rateLimit(c.env.DB, "mailtest:" + c.get("user")!.id, 10, 3600))) throw new ApiError(429, "rate_limited", "10 e-mails de test par heure au maximum.");
  const id = await sendMail(c.env, { to: c.get("user")!.email, template: k, data: TEMPLATES[k].sample, club_id: c.get("club")!.id });
  return c.json({ id });
});

/* ---------- Journal d'envoi du club (gérant) ---------- */
app.get("/api/mail/outbox", requireRole("owner", "manager"), async (c) => {
  const status = c.req.query("status");
  const rows = await all(c.env.DB, `SELECT id, to_email, template, subject, status, delivery, attempts, last_error, created_at, sent_at FROM email_outbox
    WHERE club_id = ? ${status ? "AND status = ?" : ""} ORDER BY created_at DESC LIMIT 200`, ...(status ? [c.get("club")!.id, status] : [c.get("club")!.id]));
  return c.json({ emails: rows });
});
app.post("/api/mail/outbox/:id/retry", requireRole("owner", "manager"), async (c) => {
  const r = await run(c.env.DB, "UPDATE email_outbox SET status='queued', attempts=0, next_attempt_at=?, last_error=NULL WHERE id=? AND club_id=? AND status='failed' AND html IS NOT NULL",
    new Date().toISOString(), c.req.param("id"), c.get("club")!.id);
  if (!r.meta.changes) throw new ApiError(409, "not_retryable", "Cet e-mail ne peut pas être renvoyé (déjà envoyé, ou contenu effacé).");
  return c.json({ ok: true });
});

/* ---------- Préférences de notification (utilisateur connecté) ---------- */
app.get("/api/mail/preferences", requireUser, async (c) => {
  const email = c.get("user")!.email.toLowerCase(), club = c.get("club")?.id || "";
  const rows = await all<{ club_id: string; category: string; enabled: number }>(c.env.DB, "SELECT club_id, category, enabled FROM notification_prefs WHERE email = ? AND club_id IN (?, '')", email, club);
  const sup = await one<{ reason: string }>(c.env.DB, "SELECT reason FROM email_suppressions WHERE email = ?", email);
  return c.json({
    email, club_id: club || null,
    categories: OPTIONAL.map((k) => ({ key: k, label: CATEGORY_LABEL[k], enabled: !rows.some((r) => r.category === k && !r.enabled) })),
    essential: CATEGORY_LABEL.essential, blocked: sup ? sup.reason : null,
  });
});
app.put("/api/mail/preferences", requireUser, async (c) => {
  const b = await body<{ categories?: Record<string, boolean>; all_clubs?: boolean; resubscribe?: boolean }>(c);
  const email = c.get("user")!.email.toLowerCase(), club = b.all_clubs ? "" : c.get("club")?.id || "";
  for (const [k, v] of Object.entries(b.categories || {})) {
    if (!(OPTIONAL as readonly string[]).includes(k)) throw bad("invalid_field", `Catégorie inconnue : ${k}.`, { field: "categories" });
    await run(c.env.DB, `INSERT INTO notification_prefs (email, club_id, category, enabled, updated_at) VALUES (?,?,?,?,?)
      ON CONFLICT(email, club_id, category) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`, email, club, k, v ? 1 : 0, new Date().toISOString());
    if (v && club) await run(c.env.DB, "DELETE FROM notification_prefs WHERE email = ? AND club_id = '' AND category = ? AND enabled = 0", email, k);
  }
  // L'utilisateur, connecté donc propriétaire de l'adresse, peut lever un blocage dû à une plainte ou à un rebond.
  if (b.resubscribe) await run(c.env.DB, "DELETE FROM email_suppressions WHERE email = ?", email);
  return c.json({ ok: true });
});

/* ---------- Désinscription en un clic (public, lien signé) ---------- */
function page(title: string, text: string, form?: string) {
  const C = BRAND.colors;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;font-family:${BRAND.font};background:${C.bg};color:${C.text};display:flex;min-height:100vh;align-items:center;justify-content:center}main{background:#fff;border:1px solid ${C.line};border-radius:16px;padding:32px;max-width:440px;margin:16px}
h1{color:${C.ink};font-size:22px;margin:0 0 12px}button{background:${C.ink};color:#fff;border:0;border-radius:10px;padding:12px 24px;font-size:16px;font-weight:600;cursor:pointer}
@media (prefers-color-scheme:dark){body{background:${C.darkBg};color:${C.darkText}}main{background:${C.darkCard};border-color:${C.darkLine}}h1{color:#fff}button{background:#fff;color:${C.ink}}}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(text)}</p>${form || ""}</main></body></html>`;
}
app.get("/api/mail/unsubscribe", async (c) => {
  const t = c.req.query("t") || "";
  const tok = await readUnsubToken(c.env, t);
  if (!tok) return c.html(page("Lien invalide", "Ce lien de désinscription est invalide. Vous pouvez gérer vos notifications depuis l'application, dans Réglages."), 400);
  const label = CATEGORY_LABEL[tok.c as keyof typeof CATEGORY_LABEL] || "ces e-mails";
  return c.html(page("Se désinscrire", `Vous ne recevrez plus : ${label.toLowerCase()}. Les e-mails essentiels (factures, paiements, sécurité du compte) continueront d'arriver.`,
    `<form method="post" action="/api/mail/unsubscribe?t=${encodeURIComponent(t)}"><button type="submit">Confirmer la désinscription</button></form>`));
});
app.post("/api/mail/unsubscribe", async (c) => {
  const tok = await readUnsubToken(c.env, c.req.query("t") || "");
  if (!tok) return c.html(page("Lien invalide", "Ce lien de désinscription est invalide."), 400);
  await run(c.env.DB, `INSERT INTO notification_prefs (email, club_id, category, enabled, updated_at) VALUES (?,?,?,0,?)
    ON CONFLICT(email, club_id, category) DO UPDATE SET enabled = 0, updated_at = excluded.updated_at`, tok.e, tok.k, tok.c, new Date().toISOString());
  return c.html(page("C'est fait", "Votre désinscription est enregistrée. Vous pouvez changer d'avis à tout moment depuis l'application, dans Réglages, Notifications."));
});

/* ---------- Logo du club pour les e-mails (public) ---------- */
app.get("/api/mail/logo/:clubId", async (c) => {
  const club = await one<{ logo_key: string | null }>(c.env.DB, "SELECT logo_key FROM clubs WHERE id = ?", c.req.param("clubId"));
  if (!club?.logo_key) throw notFound();
  const obj = await c.env.FILES.get(club.logo_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType || "image/png", "cache-control": "public, max-age=86400" } });
});

/* ---------- Webhook du fournisseur ---------- */
app.post("/webhooks/mail", async (c) => c.json(await handleMailWebhook(c.env, c.req.raw)));

export default app;
/** Cron : reprise de la file toutes les 10 minutes ; rappels et ménage chaque matin. */
export async function cron(env: AppEnv["Bindings"], expr: string): Promise<void> {
  await processQueue(env);
  if (expr === "0 6 * * *") {
    await runDailyReminders(env);
    await processQueue(env, 200);
    await purge(env);
  }
}
