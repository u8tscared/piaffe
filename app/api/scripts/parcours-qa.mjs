/* Robot QA de bout en bout : joue les vrais parcours d'un centre équestre dans un navigateur et vérifie chaque
   résultat dans la base locale. À lancer contre `npx wrangler dev` (sans secrets) :
     cd app/api && npx wrangler dev &   puis   node scripts/parcours-qa.mjs [--url=http://localhost:8787] [--shots=DOSSIER]
   Échoue (code 1) à la première vérification fausse, à toute erreur console ou réponse 500. */
import { createRequire } from "node:module";
import { readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require("/opt/node-tools/node_modules/playwright"); }
const { DatabaseSync } = require("node:sqlite");

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "").split("=").slice(1).join("=") || d;
const URL0 = arg("url", "http://localhost:8787");
const SHOTS = arg("shots", "");
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const ONLY = arg("only", "");

/* ---------- Base locale (lecture seule) ---------- */
const D1DIR = join(HERE, "..", ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const dbFile = readdirSync(D1DIR).find((f) => /^[0-9a-f]{64}\.sqlite$/.test(f));
const db = new DatabaseSync(join(D1DIR, dbFile), { readOnly: true });
const q1 = (sql, ...a) => db.prepare(sql).get(...a);
const qa = (sql, ...a) => db.prepare(sql).all(...a);

/* ---------- Outils ---------- */
const problems = [];
let step = "";
const ok = (cond, what) => { if (!cond) { console.error("✗ " + step + " : " + what); throw new Error(what); } console.log("  ✓ " + what); };
const RUN = Date.now().toString(36);
const mail = (who) => `${who}.${RUN}@exemple.fr`;
const PASS = "Cheval-Bai-2026!";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(page, label) {
  page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); if (!/net::ERR_INTERNET_DISCONNECTED|ERR_TUNNEL_CONNECTION_FAILED|Failed to load resource: net::ERR_FAILED|ERR_NAME_NOT_RESOLVED|fonts\.g|open-meteo|api-adresse|cdnjs/.test(t)) problems.push(`[${label}] console : ${t}`); } });
  page.on("pageerror", (e) => problems.push(`[${label}] exception : ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 500 && r.url().startsWith(URL0)) problems.push(`[${label}] ${r.status()} ${r.request().method()} ${r.url()}`); });
}
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: join(SHOTS, name + ".png") }); }
async function api(page, method, path, body) {
  return page.evaluate(async ([m, p, b]) => {
    const h = { accept: "application/json", "x-requested-with": "piaffe" };
    if (b !== undefined) h["content-type"] = "application/json";
    if (window.PL && PL.clubId) h["x-piaffe-club"] = PL.clubId;
    const r = await fetch(p, { method: m, headers: h, body: b === undefined ? undefined : JSON.stringify(b), credentials: "same-origin" });
    const ct = r.headers.get("content-type") || "";
    return { status: r.status, json: ct.includes("json") ? await r.json() : null, headers: Object.fromEntries(r.headers) };
  }, [method, path, body]);
}
/* l'appli enregistre en tâche de fond : on attend que la file soit vide */
async function synced(page, ms = 15000) {
  await page.waitForFunction(() => window.PL && PL.sync && (PL.sync.flush(), PL.sync.pending() === 0 && !PL.sync.busy), null, { timeout: ms, polling: 300 });
}
async function appReady(page) { await page.waitForFunction(() => window.PL && PL.ready === true, null, { timeout: 30000 }); await sleep(300); }
const lastMail = (to, tpl) => q1("SELECT * FROM email_outbox WHERE to_email = ? " + (tpl ? "AND template = ? " : "") + "ORDER BY created_at DESC LIMIT 1", ...(tpl ? [to, tpl] : [to]));
const linkIn = (m, re) => { const s = (m && (m.html || m.text || m.data || "")) + ""; const x = s.match(re); return x && x[0]; };


const say = (t) => { step = t; console.log("\n▶ " + t); };
const rec = (club, coll) => qa("SELECT id, data, version, deleted FROM records WHERE club_id = ? AND coll = ? AND deleted = 0", club, coll).map((r) => ({ ...JSON.parse(r.data), _v: r.version }));

async function onboarding(page, o) {
  for (let i = 0; i < 25; i++) {
    const id = await page.evaluate(() => { const s = document.querySelector("[data-step]"); return s && s.getAttribute("data-step"); });
    if (!id) { const c = await page.$("[data-cont]"); if (c) { await c.click(); await sleep(1200); continue; } await sleep(500); continue; }
    if (id === "hello") await page.click("[data-start]");
    else if (id === "kind") await page.click('[data-v="centre"]');
    else if (id === "name") {
      await page.fill("#ob-name", o.name); await page.fill("#ob-siret", o.siret);
      await page.fill("#ob-line1", o.line1); await page.fill("#ob-zip", o.zip); await page.fill("#ob-city", o.city);
      await shot(page, "02-onboarding-nom"); await page.click("[data-next]");
    }
    else if (id === "sizes") { await page.fill("#ob-horses", "24"); await page.fill("#ob-boxes", "30"); await page.fill("#ob-members", "180"); await page.fill("#ob-staff", "3"); await page.click("[data-next]"); }
    else if (id === "uses") { await page.click('[data-b="true"]'); await sleep(300); if (await page.$('[data-step="uses"]')) await page.click("[data-next]"); }
    else if (id === "tools") { await page.fill("#ob-other", "Kavalog"); await sleep(300); await page.click("[data-next]"); }
    else if (id === "toolsplan") { await shot(page, "03-onboarding-outils"); await page.click("[data-next]"); }
    else if (id === "recuperer") await page.click('[data-w="later"]');
    else if (id === "accountant") { await page.click('[data-b="false"]'); await page.click("[data-next]"); }
    else if (id === "payments") { await page.click('[data-b="false"]'); await page.click("[data-next]"); }
    else if (id === "vat") await page.click('[data-v="normal"]');
    else if (id === "recap") { await page.click("[data-next]"); break; }
    else await page.click("[data-next]");
    await sleep(700);
  }
  await appReady(page);
}
async function form(page, kind, fill) {
  await page.evaluate((k) => PL.forms[k](), kind);
  await page.waitForSelector(".sheet [data-save]");
  for (const [sel, v] of Object.entries(fill)) {
    const tag = await page.$eval(sel, (e) => e.tagName);
    if (tag === "SELECT") await page.selectOption(sel, v); else await page.fill(sel, String(v));
  }
  await page.click(".sheet [data-save]");
  await sleep(400);
  await synced(page);
}
async function invite(page, role, email, first, last) {
  await page.evaluate((r) => PL.inviteSheet(r), role);
  await page.waitForSelector("#iv-email");
  await page.fill("#iv-email", email); await page.fill("#iv-first", first); await page.fill("#iv-last", last);
  await page.click(".sheet [data-s]");
  /* e-mails réels : la feuille se ferme ; mode journal : la feuille montre le lien à copier */
  await page.waitForFunction(() => !document.querySelector("#iv-email") || document.querySelector(".sheet [data-cp]"), null, { timeout: 10000 });
  await page.evaluate(() => P.closeSheets && P.closeSheets()); await sleep(500);
}
async function acceptInvite(browser, email, first, label) {
  const m = lastMail(email);
  ok(m, "e-mail reçu par " + email + " (" + (m && m.template) + ")");
  const link = linkIn(m, /https?:\/\/[^"'\s<>]+\/invitation\/[A-Za-z0-9_\-]+/);
  ok(link, "lien d'invitation dans l'e-mail");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); watch(page, label);
  await page.goto(link.replace(/^https?:\/\/[^/]+/, URL0));
  await page.waitForSelector("#lv-pass");
  if (first) await page.fill("#lv-first", first);
  await page.fill("#lv-pass", PASS);
  await page.click("button[type=submit]");
  await appReady(page);
  return { ctx, page };
}

async function main() {
  const browser = await playwright.chromium.launch();
  const ctxA = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const g = await ctxA.newPage(); watch(g, "gérant");
  const E = { gerant: mail("gerant"), adh: mail("adherent"), emp: mail("employe"), coach: mail("coach") };

  say("Inscription du gérant (e-mail + mot de passe)");
  await g.goto(URL0 + "/");
  await g.waitForSelector("#lv-email");
  await shot(g, "00-connexion");
  await g.click('[data-view="signup"]');
  await g.waitForSelector("#lv-first");
  await g.fill("#lv-first", "Claire"); await g.fill("#lv-last", "Martin"); await g.fill("#lv-email", E.gerant); await g.fill("#lv-pass", PASS);
  await shot(g, "01-inscription");
  await g.click("button[type=submit]");
  await g.waitForSelector("[data-cont], [data-step]", { timeout: 15000 });
  const u = q1("SELECT * FROM users WHERE email = ?", E.gerant);
  ok(u, "utilisateur créé en base");
  ok(/^pbkdf2\$sha256\$\d+\$/.test(u.password_hash), "mot de passe haché (PBKDF2), jamais en clair");
  ok(lastMail(E.gerant, "verify_email"), "e-mail de vérification mis en file");

  say("Onboarding : nom, adresse, SIRET, outils à remplacer");
  await onboarding(g, { name: "Écurie du Moulin " + RUN, siret: "93473312200014", line1: "12 chemin des Prés", zip: "69380", city: "Lozanne" });
  const club = q1("SELECT * FROM clubs WHERE id = (SELECT club_id FROM memberships WHERE user_id = ?)", u.id);
  ok(club && club.name === "Écurie du Moulin " + RUN, "club créé avec son nom");
  ok(club.siret === "93473312200014", "SIRET enregistré");
  ok(JSON.parse(club.address || "{}").city === "Lozanne", "adresse enregistrée (saisie à la main)");
  const onb = JSON.parse(club.onboarding || "{}");
  ok(onb.completed || onb.completed_at, "onboarding terminé");
  ok(JSON.stringify(onb).includes("Kavalog"), "outil à remplacer mémorisé (Kavalog)");
  await shot(g, "04-tableau-de-bord");

  say("Ajout de chevaux");
  await form(g, "horse", { "#fh-name": "Ulysse de la Roche", "#fh-box": "b01", "#fh-breed": "Selle Français", "#fh-born": "2015", "#fh-worm": "2026-10-01" });
  await form(g, "horse", { "#fh-name": "Quartz", "#fh-box": "B02", "#fh-breed": "Connemara", "#fh-born": "2012" });
  let horses = rec(club.id, "horses");
  ok(horses.length === 2 && horses.some((h) => h.name === "Ulysse de la Roche" && h.box === "B01"), "2 chevaux en base (box en majuscules)");

  say("Ajout d'adhérents (e-mail de bienvenue en mode journal)");
  await form(g, "member", { "#fm-first": "Léa", "#fm-last": "Durand", "#fm-email": E.adh, "#fm-age": "16", "#fm-galop": "3" });
  await form(g, "member", { "#fm-first": "Hugo", "#fm-last": "Petit", "#fm-age": "12" });
  const members = rec(club.id, "members");
  ok(members.length === 2, "2 adhérents en base");
  await sleep(1500);
  ok(lastMail(E.adh, "welcome_member"), "e-mail de bienvenue mis en file pour l'adhérente");
  ok(q1("SELECT 1 AS x FROM invitations WHERE email = ? AND club_id = ?", E.adh, club.id), "invitation adhérent créée");

  say("Pension : cheval de propriétaire");
  const lea = members.find((m) => m.first === "Léa");
  await form(g, "horse", { "#fh-name": "Tornade", "#fh-kind": "proprietaire", "#fh-owner": lea.id, "#fh-box": "B03" });
  horses = rec(club.id, "horses");
  ok(horses.some((h) => h.name === "Tornade" && h.kind === "proprietaire" && h.owner === lea.id), "cheval en pension relié à sa propriétaire");

  say("Création d'une reprise au planning");
  const dow = new Date().getDay();
  await form(g, "lesson", { "#fl-title": "Galop 3-4", "#fl-dow": String(dow), "#fl-start": "23:30", "#fl-cap": "6" });
  let lessons = rec(club.id, "lessons");
  ok(lessons.length === 1 && lessons[0].title === "Galop 3-4" && lessons[0].cap === 6, "reprise enregistrée");
  await g.evaluate(() => P.go("planning")); await sleep(600); await shot(g, "05-planning");

  say("Réservation par la cavalière invitée");
  const A = await acceptInvite(browser, E.adh, null, "adhérente");
  ok(q1("SELECT 1 AS x FROM memberships m JOIN users u ON u.id = m.user_id WHERE u.email = ? AND m.club_id = ? AND m.role = 'member'", E.adh, club.id), "compte adhérent relié au club");
  await A.page.evaluate(() => P.go("adh-reserver")); await sleep(800);
  await shot(A.page, "06-adherent-reserver");
  await A.page.click("[data-book]");
  await A.page.waitForSelector(".sheet [data-ok]"); await A.page.click(".sheet [data-ok]");
  await sleep(1500); await synced(A.page);
  lessons = rec(club.id, "lessons");
  ok(lessons[0].riders.includes(lea.id), "réservation enregistrée en base (cavalière dans la reprise)");
  await sleep(1000);
  ok(lastMail(E.adh, "booking_confirmed"), "confirmation de réservation envoyée");

  say("Facture, PDF Factur-X, paiement reçu");
  await g.evaluate(() => PL.invoiceForm());
  await g.waitForSelector("#iv-c");
  await g.selectOption("#iv-c", lea.id); await g.fill("#iv-l", "Forfait de décembre");
  await g.fill('[data-l="label"]', "Forfait annuel, mensualité"); await g.fill('[data-l="price"]', "120"); await g.press('[data-l="price"]', "Tab");
  await sleep(300);
  await g.click(".sheet [data-is]");
  await g.waitForFunction(() => !document.querySelector("#iv-c"), null, { timeout: 20000 });
  const inv = q1("SELECT * FROM invoices WHERE club_id = ? ORDER BY created_at DESC LIMIT 1", club.id);
  ok(inv && inv.number && inv.status !== "draft", "facture émise et numérotée (" + (inv && inv.number) + ")");
  const pdf = await api(g, "GET", "/api/invoices/" + inv.id + "/pdf");
  ok(pdf.status === 200 && /pdf/.test(pdf.headers["content-type"] || ""), "PDF Factur-X téléchargeable");
  /* encaissement depuis la fiche de la facture, comme le gérant */
  const full = (await api(g, "GET", "/api/invoices/" + inv.id)).json;
  await g.evaluate((x) => PL.invoiceSheet(x.invoice || x), full);
  await g.waitForSelector(".sheet [data-cash]"); await shot(g, "06b-facture"); await g.click(".sheet [data-cash]");
  await g.waitForSelector("#cs-m"); await g.selectOption("#cs-m", "check"); await g.click("[data-cs]");
  await sleep(1500);
  const inv2 = q1("SELECT status FROM invoices WHERE id = ?", inv.id);
  ok(inv2.status === "paid", "facture passée à « payée » (" + inv2.status + ")");
  const lp = await api(g, "POST", "/api/pay/link", { invoice_id: inv.id });
  ok(lp.status >= 400 && lp.status < 500, "sans Stripe : refus propre (" + lp.status + " " + (lp.json?.error?.message || "") + ")");

  say("Export comptable et calendrier ICS");
  const fec = await api(g, "GET", "/api/accounting/exports/fec?year=" + new Date().getFullYear());
  ok(fec.status === 200, "export FEC (" + fec.status + ")");
  const csv = await api(g, "GET", "/api/accounting/exports/sales.csv");
  ok(csv.status === 200, "export des ventes CSV");
  const cal = await api(g, "POST", "/api/calendars", { scope: "club" });
  ok(cal.status < 300, "lien de calendrier créé (" + cal.status + " " + JSON.stringify(cal.json).slice(0, 150) + ")");
  const icsUrl = JSON.stringify(cal.json).match(/\/ics\/[^"]+/);
  ok(icsUrl, "URL ICS fournie");
  const ics = await (await fetch(URL0 + icsUrl[0])).text();
  ok(/BEGIN:VCALENDAR/.test(ics) && /Galop 3-4/.test(ics), "flux ICS lisible, avec la reprise");

  say("Invitation d'un employé et d'un coach, connexion de chacun");
  await invite(g, "staff", E.emp, "Paul", "Leroy");
  await invite(g, "coach", E.coach, "Inès", "Moreau");
  ok(q1("SELECT 1 AS x FROM invitations WHERE email = ? AND role = 'staff'", E.emp), "invitation employé");
  ok(q1("SELECT 1 AS x FROM invitations WHERE email = ? AND role = 'coach'", E.coach), "invitation coach");
  const Emp = await acceptInvite(browser, E.emp, "Paul", "employé");
  ok(await Emp.page.evaluate(() => PL.view === "employe"), "l'employé arrive dans son espace");
  await shot(Emp.page, "07-employe");
  const Co = await acceptInvite(browser, E.coach, "Inès", "coach");
  ok(await Co.page.evaluate(() => PL.view === "coach"), "le coach arrive dans son espace");
  await shot(Co.page, "08-coach");
  const empSees = await api(Emp.page, "GET", "/api/invoices");
  ok(empSees.status === 403, "l'employé ne voit pas les factures (" + empSees.status + ")");

  say("Déconnexion, reconnexion");
  await Emp.page.evaluate(() => PL.logout());
  await Emp.page.waitForSelector("#lv-email", { timeout: 15000 });
  ok(!(await api(Emp.page, "GET", "/api/me?soft=1")).json.user, "session fermée après déconnexion");
  await Emp.page.fill("#lv-email", E.emp); await Emp.page.fill("#lv-pass", PASS); await Emp.page.click("button[type=submit]");
  await appReady(Emp.page);
  ok(await Emp.page.evaluate(() => PL.view === "employe"), "reconnexion de l'employé");

  say("Mot de passe oublié");
  const P2 = await (await browser.newContext()).newPage(); watch(P2, "oubli");
  await P2.goto(URL0 + "/mot-de-passe-oublie"); await P2.waitForSelector("#lv-email");
  await P2.fill("#lv-email", E.coach); await P2.click("button[type=submit]"); await sleep(1500);
  const rm = qa("SELECT * FROM email_outbox WHERE to_email = ? ORDER BY created_at DESC", E.coach).find((m) => /reset|password/.test(m.template));
  ok(rm, "e-mail de réinitialisation mis en file");
  const rl = linkIn(rm, /https?:\/\/[^"'\s<>]+(\/reset\/|nouveau-mot-de-passe\?token=)[A-Za-z0-9_\-]+/);
  ok(rl, "lien de réinitialisation");
  await P2.goto(rl.replace(/^https?:\/\/[^/]+/, URL0)); await P2.waitForSelector("#lv-pass2");
  await P2.fill("#lv-pass", PASS + "x"); await P2.fill("#lv-pass2", PASS + "x"); await P2.click("button[type=submit]");
  await appReady(P2);
  ok(await P2.evaluate(() => PL.view === "coach"), "nouveau mot de passe enregistré, coach connecté");

  say("Hors ligne puis retour du réseau (sans perte ni doublon)");
  await offlineScenario(g, Emp, club);

  say("Deux onglets simultanés");
  const g2 = await ctxA.newPage(); watch(g2, "gérant-onglet2");
  await g2.goto(URL0 + "/"); await appReady(g2);
  await g.evaluate(() => { const h = DATA.horses.find((x) => x.name === "Quartz"); h.paddock = "Pré du bas"; P.rerender(); });
  await g2.evaluate(() => { const h = DATA.horses.find((x) => x.name === "Ulysse de la Roche"); h.coat = "Bai"; P.rerender(); });
  await synced(g); await synced(g2);
  await g.evaluate(() => PL.sync.pull()); await g2.evaluate(() => PL.sync.pull()); await sleep(800);
  horses = rec(club.id, "horses");
  ok(horses.find((h) => h.name === "Quartz").paddock === "Pré du bas" && horses.find((h) => h.name === "Ulysse de la Roche").coat === "Bai", "les deux onglets ont enregistré leurs changements");
  ok(await g2.evaluate(() => DATA.horses.find((x) => x.name === "Quartz").paddock === "Pré du bas"), "l'onglet 2 voit le changement de l'onglet 1");

  console.log("\n" + (problems.length ? "✗ Problèmes relevés :\n  " + problems.join("\n  ") : "✓ Zéro erreur console, zéro 500."));
  await browser.close();
  if (problems.length) process.exit(1);
}

async function offlineScenario(g, Emp, club) {
  const pe = Emp.page;
  const before = rec(club.id, "care").length;
  await Emp.ctx.setOffline(true); await g.context().setOffline(true);
  await sleep(300);
  /* 5 actions sur chaque appareil, sans réseau */
  for (let i = 0; i < 5; i++) {
    await pe.evaluate((i) => { DATA.care.push(PL.make.care({ id: "soin_off_e" + i, horse: DATA.horses[0].id, kind: "Surveillance", note: "Hors ligne employé " + i, status: "fait" })); P.rerender(); }, i);
    await g.evaluate((i) => { DATA.care.push(PL.make.care({ id: "soin_off_g" + i, horse: DATA.horses[1].id, kind: "Vétérinaire", note: "Hors ligne gérant " + i })); P.rerender(); }, i);
  }
  await g.evaluate(() => { const l = DATA.lessons[0]; l.cap = 7; P.rerender(); });
  await sleep(1200);
  const ind = await pe.evaluate(() => (document.querySelector(".lv-sync") || {}).innerText || "");
  await shot(pe, "09-hors-ligne");
  ok(/hors ligne/i.test(ind) && /attente/i.test(ind), "indicateur « Hors ligne · changements en attente » (" + ind.replace(/\s+/g, " ") + ")");
  ok(rec(club.id, "care").length === before, "rien n'est parti tant que le réseau est coupé");
  /* rechargement hors ligne : l'appli s'ouvre quand même et garde la file */
  await pe.reload(); await appReady(pe);
  ok(await pe.evaluate(() => PL.sync.pending() > 0 && DATA.care.some((c) => c.id === "soin_off_e4")), "après rechargement hors ligne : appli ouverte, changements toujours là");
  await Emp.ctx.setOffline(false); await g.context().setOffline(false);
  await pe.evaluate(() => window.dispatchEvent(new Event("online"))); await g.evaluate(() => window.dispatchEvent(new Event("online")));
  await synced(pe, 20000); await synced(g, 20000);
  const care = rec(club.id, "care");
  ok(care.length === before + 10, "10 actions arrivées en base, sans doublon (" + (care.length - before) + ")");
  ok(new Set(care.map((c) => c.id)).size === care.length, "aucun doublon");
  ok(rec(club.id, "lessons")[0].cap === 7, "modification de la reprise arrivée");
  const ind2 = await pe.evaluate(() => (document.querySelector(".lv-sync") || {}).innerText || "");
  ok(/à jour/i.test(ind2), "indicateur « Tout est à jour » (" + ind2.replace(/\s+/g, " ") + ")");
}

main().catch(async (e) => { console.error("\n✗ ÉCHEC : " + (e && e.stack || e)); if (problems.length) console.error(problems.join("\n")); process.exit(1); });
