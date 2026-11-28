/*
 * Un cavalier recommande Stabl à son écurie (public, sans compte) :
 *   POST /api/public/recommander  {to, club_name?, from_first, from_last?, from_email, message?, site_web?: ""}  → 200 {ok: true}
 *     to          : e-mail de l'écurie (destinataire)
 *     from_email  : e-mail du cavalier, mis en Reply-To (l'écurie lui répond directement)
 *     message     : 500 caractères au plus, texte brut, sans lien
 *     site_web    : champ piège invisible (robots) : réponse normale, rien n'est envoyé
 *   Garde-fous : CSRF global (Origin de l'appli ou X-Requested-With: piaffe ; CORS pour stablapp.fr),
 *   3 envois par heure et par IP, 1 par jour et par destinataire, 300 par jour en tout.
 *   E-mail : modèle club_referral, expéditeur « Stabl », catégorie « referrals » (lien de désinscription).
 */
import { Hono, type Context } from "hono";
import type { AppEnv } from "../env";
import { rateLimit } from "../lib/db";
import { ApiError, bad, body, isEmail } from "../lib/http";
import { sha256 } from "../lib/crypto";
import { clientIp } from "../auth/session";
import { sendMail } from "../mail/send";

const app = new Hono<AppEnv>();
export const RECO = { perIpHour: 3, perRecipientDay: 1, perDay: 300, messageMax: 500 };

function allowedOrigin(c: Context<AppEnv>): string | null {
  const o = c.req.header("origin");
  if (!o) return null;
  let appOrigin = "";
  try { appOrigin = new URL(c.env.APP_URL).origin; } catch { /* APP_URL invalide */ }
  return ["https://stablapp.fr", "https://www.stablapp.fr", appOrigin].includes(o) ? o : null;
}
function cors(c: Context<AppEnv>) {
  const o = allowedOrigin(c);
  if (o) { c.header("access-control-allow-origin", o); c.header("vary", "Origin"); c.header("access-control-allow-headers", "content-type, x-requested-with"); c.header("access-control-allow-methods", "POST, OPTIONS"); }
}
/** Texte d'une ligne : sans retour à la ligne ni chevrons, espaces resserrés. */
const line = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n\t<>"]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|fr|net|org|io|ru|xyz|info|biz|link|app)\b)/i;

app.options("/api/public/recommander", (c) => { cors(c); return c.body(null, 204); });
app.post("/api/public/recommander", async (c) => {
  cors(c);
  const b = await body<Record<string, unknown>>(c);
  if (String(b.site_web || "").trim()) return c.json({ ok: true }); // robot : on fait comme si
  const to = line(b.to, 254).toLowerCase();
  const fromEmail = line(b.from_email, 254).toLowerCase();
  const fromFirst = line(b.from_first, 60), fromLast = line(b.from_last, 60), clubName = line(b.club_name, 100);
  const message = typeof b.message === "string" ? b.message.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : "";
  if (!isEmail(to)) throw bad("invalid_email", "Indiquez l'adresse e-mail de votre écurie.", { field: "to" });
  if (!isEmail(fromEmail)) throw bad("invalid_email", "Indiquez votre adresse e-mail, pour que l'écurie puisse vous répondre.", { field: "from_email" });
  if (to === fromEmail) throw bad("invalid_email", "L'adresse de l'écurie doit être différente de la vôtre.", { field: "to" });
  if (!fromFirst) throw bad("missing_field", "Indiquez votre prénom.", { field: "from_first" });
  if (message.length > RECO.messageMax) throw bad("too_long", `Votre message dépasse ${RECO.messageMax} caractères.`, { field: "message", max: RECO.messageMax });
  if (LINK.test(message) || LINK.test(fromFirst + " " + fromLast + " " + clubName)) throw bad("no_links", "Retirez les liens de votre message : nous ajoutons nous-mêmes le lien vers Stabl.", { field: "message" });

  const db = c.env.DB;
  const tooMany = (msg: string) => new ApiError(429, "rate_limited", msg);
  if (!(await rateLimit(db, "reco:ip:" + clientIp(c), RECO.perIpHour, 3600))) throw tooMany("Vous avez déjà envoyé plusieurs recommandations. Réessayez dans une heure.");
  if (!(await rateLimit(db, "reco:to:" + (await sha256(to)).slice(0, 32), RECO.perRecipientDay, 86400))) throw tooMany("Cette écurie a déjà reçu une recommandation aujourd'hui. Merci pour elle !");
  if (!(await rateLimit(db, "reco:all", RECO.perDay, 86400))) throw tooMany("Trop de recommandations aujourd'hui. Réessayez demain.");

  await sendMail(c.env, {
    to, template: "club_referral", reply_to: fromEmail,
    data: { club_name: clubName, from_first: fromFirst, from_last: fromLast, message, url: "https://stablapp.fr/?ref=cavalier" },
  });
  return c.json({ ok: true });
});

export default app;
