/*
 * Espace admin de Stabl (l'équipe Stabl, pas un club). Voir app/ARCHITECTURE.md, section « Admin ».
 *   GET  /admin                  page de l'espace admin (404 pour qui n'est pas admin)
 *   GET  /admin/bandeau.js       bandeau de la vue « en tant que », chargé par l'appli web (vide hors vue)
 *   POST /admin/vue/fin          quitte la vue « en tant que » et rouvre la session admin
 *   /admin/api/*                 API JSON de l'espace admin (admins seulement, 404 sinon)
 *   POST /api/contact            formulaire de contact public (site et appli) → boîte Support
 */
import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../env";
import { csrf } from "../auth/csrf";
import { audit, one, run } from "../lib/db";
import { sha256 } from "../lib/crypto";
import { nowIso } from "../lib/ids";
import { SESSION_COOKIE, SESSION_DAYS } from "../lib/auth";
import { isSecure } from "../auth/session";
import { isAdmin, notFoundJson, requireAdmin } from "./access";
import { activeView, BACK_COOKIE, VIEW_COOKIE } from "./guard";
import { ADMIN_HTML, NOT_FOUND_HTML, VIEW_HTML } from "./page.gen";
import dashboard from "./dashboard";
import clubs from "./clubs";
import migrations from "./migrations";
import prospects from "./prospects";
import settings from "./settings";
import { adminSupport, publicSupport } from "./support";

export { adminGuard } from "./guard";

const app = new Hono<AppEnv>();

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
function html(c: Context<AppEnv>, body: string, status: 200 | 404 = 200) {
  c.header("content-security-policy", CSP);
  c.header("cache-control", "no-store");
  c.header("x-robots-tag", "noindex, nofollow");
  return c.html(body, status);
}

app.route("/", publicSupport);

const page = async (c: Context<AppEnv>) => {
  if (isAdmin(c)) return html(c, ADMIN_HTML);
  // En vue « en tant que », on propose seulement de revenir à l'espace admin.
  if (getCookie(c, VIEW_COOKIE) && (await activeView(c.env.DB, c.get("sessionId")))) return html(c, VIEW_HTML);
  return html(c, NOT_FOUND_HTML, 404);
};
app.get("/admin", page);
app.get("/admin/", page);

/* ---------- Vue « en tant que » ---------- */

app.get("/admin/bandeau.js", async (c) => {
  c.header("content-type", "text/javascript; charset=utf-8");
  c.header("cache-control", "no-store");
  const v = getCookie(c, VIEW_COOKIE) ? await activeView(c.env.DB, c.get("sessionId")) : null;
  if (!v) return c.body("/* aucune vue admin */");
  const club = await one<{ name: string }>(c.env.DB, "SELECT name FROM clubs WHERE id = ?", v.club_id);
  const info = { club: club?.name || "", as: c.get("user")?.email || "", until: v.expires_at };
  return c.body(`(function(){var I=${JSON.stringify(info).replace(/</g, "\\u003c")};
if(document.getElementById('stabl-vue-admin'))return;
var b=document.createElement('div');b.id='stabl-vue-admin';b.setAttribute('role','status');
b.style.cssText='position:fixed;left:0;right:0;top:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;padding:8px 16px;background:#0a1636;color:#fff;font:600 14px/1.3 Inter,system-ui,sans-serif;box-shadow:0 2px 12px rgba(10,22,54,.35)';
var h=new Date(I.until).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
var t=document.createElement('span');t.textContent='Vue admin, lecture seule \\u00b7 '+I.club+' \\u00b7 '+I.as+' \\u00b7 jusqu\\u2019\\u00e0 '+h;
var q=document.createElement('button');q.type='button';q.textContent='Quitter la vue';
q.style.cssText='border:0;border-radius:999px;padding:6px 14px;background:#fff;color:#0a1636;font:700 13px Inter,system-ui,sans-serif;cursor:pointer';
q.onclick=function(){q.disabled=true;fetch('/admin/vue/fin',{method:'POST',headers:{'x-requested-with':'piaffe'},credentials:'same-origin'}).then(function(){location.href='/admin'},function(){location.href='/admin'})};
b.appendChild(t);b.appendChild(q);document.documentElement.appendChild(b);
document.documentElement.style.setProperty('padding-top','40px');})();`);
});

app.post("/admin/vue/fin", csrf, async (c) => {
  const db = c.env.DB, secure = isSecure(c.env);
  const v = await activeView(db, c.get("sessionId"));
  const back = getCookie(c, BACK_COOKIE) || "";
  deleteCookie(c, VIEW_COOKIE, { path: "/", secure });
  deleteCookie(c, BACK_COOKIE, { path: "/admin", secure });
  if (!v) return c.json({ ok: true, url: "/admin" });
  await run(db, "UPDATE admin_impersonations SET ended_at = ? WHERE id = ?", nowIso(), v.id);
  await run(db, "DELETE FROM sessions WHERE id = ?", v.session_id);
  // On ne rouvre la session de retour que si elle appartient bien à l'admin qui a ouvert la vue.
  let restored = false;
  if (back) {
    const s = await one<{ user_id: string; expires_at: string }>(db, "SELECT user_id, expires_at FROM sessions WHERE id = ?", await sha256(back));
    if (s && s.user_id === v.admin_user_id && s.expires_at > nowIso()) {
      setCookie(c, SESSION_COOKIE, back, { httpOnly: true, secure, sameSite: "Lax", path: "/", maxAge: SESSION_DAYS * 86400 });
      restored = true;
    }
  }
  if (!restored) deleteCookie(c, SESSION_COOKIE, { path: "/", secure });
  await audit(db, { club_id: v.club_id, user_id: v.admin_user_id, action: "admin.club.view_end", target: v.target_user_id, data: { view: v.id } });
  return c.json({ ok: true, url: restored ? "/admin" : "/connexion" });
});

/* ---------- API admin ---------- */

app.use("/admin/api/*", requireAdmin, csrf);
app.get("/admin/api/me", (c) => {
  const u = c.get("user")!;
  return c.json({ email: u.email, first: u.first, last: u.last });
});
app.route("/", dashboard);
app.route("/", clubs);
app.route("/", migrations);
app.route("/", adminSupport);
app.route("/", prospects);
app.route("/", settings);
app.all("/admin/api/*", () => { throw notFoundJson(); });

export default app;

/** Rien à planifier : les vues expirent d'elles-mêmes (adminGuard), les erreurs de plus de 30 jours sont effacées à l'écriture. */
export async function cron(_env: AppEnv["Bindings"], _expr: string): Promise<void> {}
