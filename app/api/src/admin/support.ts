/*
 * Support : boîte « contact » alimentée par le formulaire du site (stablapp.fr) et de l'appli.
 *   POST /api/contact  {name?, email (ou phone seul pour une demande de rappel), phone?, subject?, message, source?: "site"|"app", site_web?: ""}  (public)
 *     JSON ou formulaire classique ; « site_web » est un champ piège invisible (robots) ; 5 messages par heure et par adresse IP.
 *     Connecté, le message est rattaché au compte et au club courant.
 *   GET  /admin/api/support?etat=nouveau|en_cours|traite     PATCH /admin/api/support/:id {status?, note?}
 */
import { Hono, type Context } from "hono";
import type { AppEnv } from "../env";
import { all, one, rateLimit, run } from "../lib/db";
import { ApiError, bad, body, isEmail, notFound } from "../lib/http";
import { newId, nowIso } from "../lib/ids";
import { clientIp } from "../auth/session";
import { adminLog } from "./access";
import { sendMail } from "../mail/send";
import { appUrl } from "../auth/mailer";

export const publicSupport = new Hono<AppEnv>();
export const adminSupport = new Hono<AppEnv>();
const STATUSES = ["nouveau", "en_cours", "traite"];

function allowedOrigin(c: Context<AppEnv>): string | null {
  const o = c.req.header("origin");
  if (!o) return null;
  let app = "";
  try { app = new URL(c.env.APP_URL).origin; } catch { /* APP_URL invalide */ }
  return ["https://stablapp.fr", "https://www.stablapp.fr", app].includes(o) ? o : null;
}
function cors(c: Context<AppEnv>) {
  const o = allowedOrigin(c);
  if (o) { c.header("access-control-allow-origin", o); c.header("vary", "Origin"); c.header("access-control-allow-headers", "content-type, x-requested-with"); c.header("access-control-allow-methods", "POST, OPTIONS"); }
}

publicSupport.options("/api/contact", (c) => { cors(c); return c.body(null, 204); });
publicSupport.post("/api/contact", async (c) => {
  cors(c);
  // Un autre site ne peut pas déposer de message au nom d'un visiteur connecté : seule l'origine de l'appli rattache le compte.
  const origin = c.req.header("origin");
  if (origin && !allowedOrigin(c)) throw new ApiError(403, "csrf", "Envoyez votre message depuis stablapp.fr.");
  const ct = c.req.header("content-type") || "";
  let b: Record<string, unknown>;
  if (ct.includes("application/json")) b = await body(c);
  else if (ct.includes("form")) b = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  else throw bad("invalid_body", "Envoyez le formulaire en JSON ou en formulaire classique.");
  if (String(b.site_web || "").trim()) return c.json({ ok: true }, 201); // robot : on fait comme si
  const txt = (k: string, max: number) => String(b[k] ?? "").trim().slice(0, max);
  const email = txt("email", 254).toLowerCase(), message = txt("message", 5000);
  const phone = txt("phone", 40);
  // Une demande de rappel peut ne donner qu'un numéro de téléphone.
  const hasPhone = /\d{2}.*\d{2}.*\d{2}/.test(phone);
  if (!isEmail(email) && !(hasPhone && !email)) throw bad("invalid_email", "Indiquez une adresse e-mail valide pour qu'on puisse vous répondre.", { field: "email" });
  if (message.length < 5) throw bad("missing_field", "Écrivez votre message.", { field: "message" });
  if (!(await rateLimit(c.env.DB, "contact:" + clientIp(c), 5, 3600))) throw new ApiError(429, "rate_limited", "Vous avez déjà envoyé plusieurs messages. Réessayez dans une heure ou écrivez à bonjour@stablapp.fr.");
  const user = c.get("user"), club = c.get("club");
  const source = b.source === "app" || user ? "app" : "site";
  const id = newId("sup");
  await run(c.env.DB, "INSERT INTO support_messages (id, source, club_id, user_id, name, email, phone, subject, message, ip) VALUES (?,?,?,?,?,?,?,?,?,?)",
    id, source, club?.id ?? null, user?.id ?? null, txt("name", 120) || [user?.first, user?.last].filter(Boolean).join(" ") || null, email,
    phone || null, txt("subject", 160) || null, message, clientIp(c));
  // Prévient l'équipe Stabl (SUPPORT_EMAILS, sinon ADMIN_EMAILS) : une demande de rappel ne doit pas dormir dans la base.
  const name = txt("name", 120) || [user?.first, user?.last].filter(Boolean).join(" ");
  const subject = txt("subject", 160);
  const rows: [string, string][] = [["Nom", name], ["E-mail", email], ["Téléphone", phone], ["Objet", subject], ["Club", club?.name || ""], ["Message", message.slice(0, 1200)]];
  const notified: string[] = [];
  for (const to of supportRecipients(c.env)) {
    await sendMail(c.env, { to, template: "club_notice", ...(email ? { reply_to: email } : {}), data: {
      title: (phone ? "Demande de rappel" : "Nouveau message") + (source === "site" ? " depuis stablapp.fr" : " depuis l'appli") + (name ? " : " + name : ""),
      intro: phone ? `${name || email || "Un visiteur"} demande à être rappelé au ${phone}.` : `${name || email || "Un visiteur"} vous a écrit.`,
      rows: rows.filter(([, v]) => v), note: email ? "Répondez directement à cet e-mail : la réponse part à " + email + "." : "Pas d'adresse e-mail : rappelez au numéro indiqué.",
      action_label: "Ouvrir la boîte Support", action_url: appUrl(c.env, "/admin#support"),
    } });
    notified.push(to);
  }
  if (!notified.length) console.warn("contact : aucun destinataire (SUPPORT_EMAILS ou ADMIN_EMAILS) pour", id);
  return c.json({ ok: true, id, message: "Merci, votre message est bien arrivé. Nous vous répondons sous 24 heures ouvrées." }, 201);
});

adminSupport.get("/admin/api/support", async (c) => {
  const etat = c.req.query("etat") || "";
  const rows = await all<any>(c.env.DB, `SELECT s.id, s.source, s.club_id, c.name AS club_name, s.name, s.email, s.phone, s.subject, s.message, s.status, s.note, s.created_at, s.updated_at
    FROM support_messages s LEFT JOIN clubs c ON c.id = s.club_id WHERE (? = '' OR s.status = ?)
    ORDER BY CASE s.status WHEN 'nouveau' THEN 0 WHEN 'en_cours' THEN 1 ELSE 2 END, s.created_at DESC LIMIT 200`, etat, etat);
  const counts = await all<{ status: string; n: number }>(c.env.DB, "SELECT status, COUNT(*) AS n FROM support_messages GROUP BY status");
  return c.json({ messages: rows, counts: Object.fromEntries(counts.map((x) => [x.status, x.n])) });
});
adminSupport.patch("/admin/api/support/:id", async (c) => {
  const b = await body<{ status?: unknown; note?: unknown }>(c);
  const row = await one<any>(c.env.DB, "SELECT id, status, club_id FROM support_messages WHERE id = ?", c.req.param("id"));
  if (!row) throw notFound("Message introuvable.");
  const status = b.status === undefined ? row.status : String(b.status);
  if (!STATUSES.includes(status)) throw bad("invalid_field", "Statut inconnu.", { field: "status", allowed: STATUSES });
  const note = b.note === undefined ? undefined : String(b.note || "").slice(0, 4000);
  await run(c.env.DB, "UPDATE support_messages SET status = ?, note = COALESCE(?, note), updated_at = ? WHERE id = ?", status, note ?? null, nowIso(), row.id);
  await adminLog(c, "support.update", { club_id: row.club_id, target: row.id, data: { status, note: note !== undefined } });
  return c.json({ ok: true, status });
});

/** Adresses qui reçoivent les messages du formulaire de contact : SUPPORT_EMAILS, sinon ADMIN_EMAILS. */
export function supportRecipients(env: { SUPPORT_EMAILS?: string; ADMIN_EMAILS?: string }): string[] {
  const raw = (env.SUPPORT_EMAILS || env.ADMIN_EMAILS || "").split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(isEmail);
  return [...new Set(raw)].slice(0, 5);
}
