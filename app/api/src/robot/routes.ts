/*
 * Lot F : robot de migration hébergé (connexion assistée sans installation).
 * Même contrat HTTP que migration/robot/serveur-local.mjs, sous /api/v1/migration/robot :
 *   POST   /api/v1/migration/robot              {adresse, logiciel?, acces?: {identifiant, mot_de_passe}, consentement?}
 *                                                → 201 {id, largeur, hauteur, auto}
 *          avec « acces » (option « Donnez-nous vos codes ») le robot se connecte seul : les identifiants sont scellés
 *          ici même (coffre.ts, AES-GCM, clé du Worker), jamais écrits en base ni journalisés, effacés après la connexion.
 *   POST   /api/v1/migration/robot/:id/code     {code} : code de vérification demandé par l'ancien logiciel
 *   GET    /api/v1/migration/robot/:id/flux     SSE : événements « image » (JPEG base64) et « etat »
 *   POST   /api/v1/migration/robot/:id/entree   {type: clic|texte|touche|defiler, …} (phase connexion seulement)
 *   POST   /api/v1/migration/robot/:id/demarrer lance la copie sans attendre la détection
 *   GET    /api/v1/migration/robot/:id/capture  capture piaffe-capture (puis la session est fermée)
 *   DELETE /api/v1/migration/robot/:id          abandon
 * Réservé au gérant (owner ou manager) connecté par session ; une session n'est visible que de son créateur.
 */
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv, Env } from "../env";
import { requireRole, SESSION_COOKIE } from "../lib/auth";
import { csrf } from "../auth/csrf";
import { audit, rateLimit } from "../lib/db";
import { ApiError, bad, body, forbidden } from "../lib/http";
import { adresseAutorisee } from "./migration";
import { accesValide, sceller, type EnvRobot } from "./coffre";
import { SESSIONS_PAR_HEURE } from "./reglages";

export { setBrowserFactory } from "./navigateur";
export { setRobotTiming } from "./reglages";

const app = new Hono<AppEnv>();
const BASE = "/api/v1/migration/robot";

const gerantParSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.get("apiKey")) throw forbidden("La connexion assistée se pilote depuis la session du gérant, pas avec une clé d'API.");
  return requireRole("owner", "manager")(c, next);
};
app.use(BASE, csrf, gerantParSession);
app.use(BASE + "/*", csrf, gerantParSession);

function espace(env: Env) {
  if (!env.ROBOT || !env.BROWSER) throw new ApiError(503, "robot_indisponible", "La connexion assistée n'est pas encore activée. Déposez un export de votre logiciel en attendant.");
  return env.ROBOT;
}
function idValide(id: string | undefined) {
  id = id ?? "";
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(id)) throw new ApiError(404, "session", "Cette session de connexion assistée est terminée. Relancez-la depuis la page de migration.");
  return id;
}
function relayer(c: Context<AppEnv>, action: string, method: string, id: string | undefined, corps?: string) {
  const ns = espace(c.env);
  const stub = ns.get(ns.idFromName(idValide(id)));
  return stub.fetch("https://robot/" + action, {
    method, body: corps,
    headers: { "x-robot-club": c.get("club")!.id, "x-robot-user": c.get("user")!.id, "content-type": "application/json" },
  }).then((r) => new Response(r.body, r)); // en-têtes modifiables pour les middlewares (secureHeaders)
}
function jetonDeSession(c: Context<AppEnv>) {
  const a = c.req.header("authorization") || "";
  return a.startsWith("Bearer ") ? a.slice(7).trim() : getCookie(c, SESSION_COOKIE) || "";
}
function identifiant() {
  const b = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

app.post(BASE, async (c) => {
  const ns = espace(c.env);
  const b = await body<{ adresse?: unknown; logiciel?: unknown; acces?: unknown; consentement?: unknown }>(c);
  if (!adresseAutorisee(b.adresse)) throw bad("adresse", "Adresse refusée : indiquez l'adresse https de votre logiciel (par exemple https://app.monlogiciel.fr).", { field: "adresse" });
  const acces = b.acces === undefined || b.acces === null ? null : accesValide(b.acces);
  if (b.acces != null && !acces) throw bad("acces", "Indiquez l'identifiant et le mot de passe de votre ancien logiciel.", { field: "acces" });
  if (acces && b.consentement !== true) throw bad("consentement", "Cochez la case qui autorise Stabl à se connecter à votre logiciel.", { field: "consentement" });
  const logiciel = typeof b.logiciel === "string" && /^[a-z0-9][a-z0-9_.-]{0,39}$/.test(b.logiciel) ? b.logiciel : null;
  const club = c.get("club")!.id, user = c.get("user")!.id;
  if (!(await rateLimit(c.env.DB, "robot:" + club, SESSIONS_PAR_HEURE, 3600)))
    throw new ApiError(429, "rate_limited", `Vous avez ouvert ${SESSIONS_PAR_HEURE} sessions de connexion assistée cette heure-ci. Réessayez un peu plus tard.`);
  const id = identifiant();
  let scelle: string | null = null;
  if (acces) {
    try { scelle = await sceller(c.env as EnvRobot, acces, id); }
    catch { throw new ApiError(503, "robot_indisponible", "La connexion automatique n'est pas encore activée. Connectez-vous vous-même dans l'écran du robot."); }
    finally { acces.identifiant = ""; acces.mot_de_passe = ""; }
  }
  const r = await ns.get(ns.idFromName(id)).fetch("https://robot/creer", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, adresse: b.adresse, club_id: club, user_id: user, jeton: jetonDeSession(c), logiciel, scelle }),
  });
  // L'audit garde l'origine visitée, jamais le chemin complet (il peut contenir un jeton) ni ce qui est tapé.
  // Avec des identifiants confiés : le consentement du gérant est noté (date, utilisateur), jamais les identifiants.
  if (r.ok) await audit(c.env.DB, { club_id: club, user_id: user, action: acces ? "migration.robot.acces" : "migration.robot.open", target: id, data: { origine: new URL(String(b.adresse)).origin, logiciel, ...(acces ? { consentement: true } : {}) } });
  return new Response(r.body, r);
});
app.get(BASE + "/:id/flux", (c) => relayer(c, "flux", "GET", c.req.param("id")));
app.post(BASE + "/:id/entree", async (c) => {
  const t = await c.req.text();
  if (t.length > 4096) throw bad("entree", "Saisie trop longue.");
  return relayer(c, "entree", "POST", c.req.param("id"), t);
});
app.post(BASE + "/:id/demarrer", (c) => relayer(c, "demarrer", "POST", c.req.param("id")));
app.post(BASE + "/:id/code", async (c) => {
  const t = await c.req.text();
  if (t.length > 512) throw bad("code", "Code trop long.");
  return relayer(c, "code", "POST", c.req.param("id"), t);
});
app.get(BASE + "/:id/capture", (c) => relayer(c, "capture", "GET", c.req.param("id")));
app.delete(BASE + "/:id", (c) => relayer(c, "fermer", "DELETE", c.req.param("id")));

export default app;

/** Rien à planifier : chaque session se ferme elle-même par l'alarme de son Durable Object. */
export async function cron(_env: Env, _expr: string): Promise<void> {}
