#!/usr/bin/env node
/*
 * Galerie d'aperçu des e-mails transactionnels de Stabl.
 *
 *   node app/api/scripts/apercu-mails.mjs                rend tous les modèles → site/mails/ (index.html, m/<clé>.html, img/)
 *   node app/api/scripts/apercu-mails.mjs --captures     + captures PNG (Playwright) → site/mails/captures/
 *   node app/api/scripts/apercu-mails.mjs --assets       régénère d'abord les PNG des e-mails → brand/stabl/mail/
 *
 * Les modèles TypeScript (src/mail) sont empaquetés avec esbuild (installé avec wrangler) dans un fichier
 * temporaire puis importés ; chaque modèle est rendu avec son exemple (`sample`) et le club fictif
 * « Écurie du Moulin » (Lozanne). Les images hébergées (https://stablapp.fr/brand/mail/…) sont remplacées
 * par la copie locale img/ pour que la galerie s'affiche aussi hors ligne et avant la mise en ligne.
 */
import { build } from "esbuild";
import { mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const API = resolve(HERE, "..");
const ROOT = resolve(API, "../..");
const OUT = join(ROOT, "site/mails");
const ASSETS_DIR = join(ROOT, "brand/stabl/mail");
const args = new Set(process.argv.slice(2));

/* ---------- 1. Images des e-mails (PNG @2x, fond transparent) ---------- */
const ICON_PATHS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  invoice: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8M8 17h5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sparkles: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0Z"/><path d="M20 3v4M22 5h-4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
};

async function makeAssets(chromium) {
  mkdirSync(ASSETS_DIR, { recursive: true });
  const svg = (p) => readFileSync(join(ROOT, "brand/stabl", p), "utf8");
  const recolor = (s, c) => s.replace(/fill="#[0-9a-fA-F]{3,6}"/g, `fill="${c}"`);
  const viewBox = (s) => s.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const jobs = [];
  for (const [name, src, color] of [
    ["stabl-logo-blanc", "logo/stabl-logo-blanc.svg", "#ffffff"],
    ["stabl-logo-marine", "logo/stabl-logo-marine.svg", "#0a1636"],
    ["stabl-logo-saphir", "logo/stabl-logo-marine.svg", "#2448d8"],
    ["stabl-symbole-saphir", "symbole/stabl-symbole-marine.svg", "#2448d8"],
    ["stabl-symbole-blanc", "symbole/stabl-symbole-blanc.svg", "#ffffff"],
  ]) {
    const s = recolor(svg(src), color);
    const [, , w, h] = viewBox(s);
    const H = 56, W = Math.round((w / h) * H);
    jobs.push({ file: `${name}@2x.png`, w: W, h: H, html: s.replace("<svg ", `<svg width="${W}" height="${H}" `) });
  }
  for (const [n, d] of Object.entries(ICON_PATHS)) {
    jobs.push({ file: `icone-${n}@2x.png`, w: 56, h: 56, html: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>` });
  }
  // Pictogramme « cheval » : la silhouette officielle, centrée dans un carré de 24.
  {
    const s = recolor(svg("symbole/stabl-symbole-blanc.svg"), "#ffffff");
    jobs.push({ file: "icone-horse@2x.png", w: 56, h: 56, html: `<div style="width:56px;height:56px;padding:4px;box-sizing:border-box">${s.replace("<svg ", '<svg width="48" height="48" preserveAspectRatio="xMidYMid meet" ')}</div>` });
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const j of jobs) {
    await page.setViewportSize({ width: j.w, height: j.h });
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${j.html}</body></html>`);
    await page.screenshot({ path: join(ASSETS_DIR, j.file), omitBackground: true, clip: { x: 0, y: 0, width: j.w, height: j.h } });
  }
  await browser.close();
  console.log(`${jobs.length} images → brand/stabl/mail/`);
}

/* ---------- 2. Rendu des modèles ---------- */
async function loadRenderer() {
  const out = join(tmpdir(), `stabl-mails-${process.pid}.mjs`);
  await build({
    stdin: { contents: 'export { renderTemplate } from "./src/mail/render.ts"; export { TEMPLATES } from "./src/mail/templates.ts"; export { BRAND } from "./src/mail/brand.ts";', resolveDir: API, loader: "ts" },
    bundle: true, format: "esm", platform: "node", target: "node20", outfile: out, logLevel: "error",
  });
  const mod = await import(pathToFileURL(out).href);
  rmSync(out, { force: true });
  return mod;
}

const CLUB = {
  id: "clb_demo_moulin", name: "Écurie du Moulin", email: "contact@ecuriedumoulin.fr", phone: null,
  address: JSON.stringify({ line1: "Chemin du Moulin", zip: "69380", city: "Lozanne" }), logo_key: null, settings: null,
};
const ENV = { APP_URL: "https://app.stablapp.fr", SESSION_SECRET: "apercu-local-uniquement-0123456789abcdef", MAIL_FROM: "Stabl <bonjour@stablapp.fr>" };
const PLATFORM = new Set(["welcome_owner", "trial_ending", "subscription_receipt", "verify_email", "reset_password", "club_referral"]);

const GROUPS = [
  ["onboarding", "Arrivée et onboarding"],
  ["acces", "Compte et accès"],
  ["planning", "Planning"],
  ["finances", "Finances"],
  ["club", "Club, chevaux et équipe"],
];
const GROUP_OF = {
  invitation: "onboarding", welcome_member: "onboarding", welcome_owner: "onboarding", club_referral: "onboarding",
  migration_announce: "onboarding", migration_activate: "onboarding", migration_reminder: "onboarding",
  verify_email: "acces", magic_link: "acces", reset_password: "acces", accountant_invite: "acces", trial_ending: "acces",
  booking_confirmed: "planning", booking_cancelled: "planning", waitlist_spot: "planning", lesson_reminder: "planning",
  invoice_issued: "finances", payment_receipt: "finances", payment_reminder: "finances", payment_failed: "finances",
  subscription_receipt: "finances", gift_card: "finances", pro_invoice: "finances", pro_invoice_copy: "finances", export_ready: "finances",
};
const ORDER = ["invitation_member", "invitation_parent", "invitation_owner_horse", "welcome_member", "welcome_owner", "club_referral", "migration_announce", "migration_activate", "migration_reminder",
  "verify_email", "magic_link", "reset_password"];
const ROLE_LABEL = { member: "adhérent", parent: "parent", owner_horse: "propriétaire", staff: "équipe", coach: "coach", accountant: "comptable", provider: "praticien", manager: "co-gérant" };

function entries(TEMPLATES) {
  const list = [];
  for (const [k, t] of Object.entries(TEMPLATES)) {
    const data = { ...t.sample };
    if ("club_name" in data && k !== "club_referral" && !/^pro_/.test(k)) data.club_name = CLUB.name;
    if (k === "invitation") {
      for (const role of ["member", "parent", "owner_horse", "coach", "staff", "provider", "manager"]) {
        const extra = role === "parent" ? { first: "Sophie", child_first: "Jules" } : role === "owner_horse" ? { first: "Marc", horse_name: "Ulysse de la Roche" } : role === "coach" ? { first: "Hugo" } : {};
        list.push({ key: `invitation_${role}`, template: k, name: `Invitation ${ROLE_LABEL[role]}`, description: t.description, group: "onboarding", data: { ...data, role, ...extra } });
      }
      continue;
    }
    list.push({ key: k, template: k, name: t.name, description: t.description, group: GROUP_OF[k] || "club", data });
  }
  const rank = (e) => { const i = ORDER.indexOf(e.key); return i < 0 ? 100 + GROUPS.findIndex(([g]) => g === e.group) : i; };
  return list.sort((a, b) => rank(a) - rank(b));
}

/* ---------- 3. Galerie ---------- */
const escH = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const darkOf = (html) => html.replace("@media (prefers-color-scheme:dark){", "@media all{").replace('<meta name="color-scheme" content="light dark">', '<meta name="color-scheme" content="dark">');

function galleryHtml(items, BRAND, logoSvg, symbolSvg) {
  const data = items.map(({ key, name, description, group, sender, subject, preheader, html, text, category }) => ({ key, name, description, group, sender, subject, preheader, html, text, category }));
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const nav = GROUPS.map(([g, label]) => {
    const its = items.filter((i) => i.group === g);
    if (!its.length) return "";
    return `<div class="grp"><p class="grp-t">${escH(label)}</p>${its.map((i) => `<button class="it" data-k="${i.key}" type="button"><span class="it-n">${escH(i.name)}</span><span class="it-s">${escH(i.subject)}</span></button>`).join("")}</div>`;
  }).join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Stabl · les e-mails</title>
<link rel="icon" href="../../icons/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${BRAND.fontsHref}" rel="stylesheet">
<style>
:root{--navy:#0a1636;--navy2:#141f45;--navy3:#1e2a57;--sap:#2448d8;--strass:#6d8bff;--pale:#e7ecff;--bg:#f4f5f9;--line:#e3e6ee;--ink:#0a1636;--text:#2b3550;--mut:#646d88;--card:#fff;
--fd:'Bricolage Grotesque',Inter,system-ui,sans-serif;--ft:Inter,system-ui,-apple-system,'Segoe UI',sans-serif}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--text);font-family:var(--ft);-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit}
.top{background:var(--navy);color:#fff;position:relative;overflow:hidden}
.top::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,var(--sap) 0 62%,var(--strass) 62% 86%,#c9d3f5 86%)}
.top-in{max-width:1320px;margin:0 auto;padding:28px 24px 34px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.brand svg{height:30px;width:auto;display:block}
.top h1{font-family:var(--fd);font-weight:800;font-size:clamp(30px,4.4vw,48px);line-height:1;letter-spacing:-1.6px;margin:22px 0 10px}
.top p{margin:0;color:#c9d3f5;font-size:16px;line-height:1.5;max-width:620px}
.legend{display:flex;gap:8px;flex-wrap:wrap}
.chip{font-size:12px;font-weight:600;color:#c9d3f5;border:1px solid var(--navy3);background:var(--navy2);border-radius:999px;padding:6px 12px}
.wrap{max-width:1320px;margin:0 auto;padding:24px;display:grid;grid-template-columns:300px minmax(0,1fr);gap:24px;align-items:start}
nav{position:sticky;top:16px;max-height:calc(100vh - 32px);overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:10px}
.grp{padding:6px 0 8px}
.grp-t{margin:6px 10px 6px;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:var(--mut)}
.it{display:block;width:100%;text-align:left;border:0;background:transparent;border-radius:12px;padding:9px 10px;cursor:pointer;transition:background .15s}
.it:hover{background:var(--bg)}
.it[aria-current="true"]{background:var(--pale)}
.it-n{display:block;font-weight:600;font-size:14px;color:var(--ink)}
.it-s{display:block;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
main{min-width:0}
.inbox{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:16px 18px;display:flex;gap:14px;align-items:flex-start}
.av{flex:none;width:44px;height:44px;border-radius:14px;background:var(--sap);color:#fff;display:grid;place-items:center;font-family:var(--fd);font-weight:800;font-size:20px}
.av.stabl{background:var(--navy)}
.av svg{width:22px;height:auto}
.meta{min-width:0;flex:1}
.from{display:flex;justify-content:space-between;gap:12px;font-size:14px;color:var(--ink);font-weight:700}
.from time{font-weight:500;color:var(--mut);font-size:13px;white-space:nowrap}
.subj{margin-top:3px;font-size:15px;font-weight:600;color:var(--ink)}
.pre{margin-top:2px;font-size:14px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:16px 0}
.desc{font-size:14px;color:var(--mut);margin:0;flex:1;min-width:220px}
.seg{display:inline-flex;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:3px}
.seg button{border:0;background:transparent;border-radius:9px;padding:7px 12px;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer}
.seg button[aria-pressed="true"]{background:var(--navy);color:#fff}
.open{font-size:13px;font-weight:600;color:var(--sap);text-decoration:none;padding:8px 4px}
.stage{background:#e9ecf3;border:1px solid var(--line);border-radius:24px;padding:28px 16px;display:flex;justify-content:center;min-height:400px;transition:background .25s}
.stage.dark{background:#03060f}
.device{background:#fff;border-radius:16px;box-shadow:0 30px 60px -30px rgba(10,22,54,.35),0 2px 8px rgba(10,22,54,.08);overflow:hidden;width:min(700px,100%);transition:width .35s cubic-bezier(.2,.8,.2,1)}
.device.phone{width:390px;max-width:100%;border-radius:44px;border:10px solid #0a0f1f;box-shadow:0 30px 60px -30px rgba(10,22,54,.5)}
.device iframe{display:block;width:100%;border:0;height:900px;background:transparent}
.device.text{padding:24px}
.device pre{margin:0;white-space:pre-wrap;font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;color:var(--text)}
.chrome{display:flex;gap:6px;padding:12px 14px;background:#f6f7fb;border-bottom:1px solid var(--line)}
.chrome i{width:11px;height:11px;border-radius:50%;background:#d6dbe6;display:block}
.device.phone .chrome,.device.text .chrome{display:none}
footer{max-width:1320px;margin:0 auto;padding:8px 24px 40px;color:var(--mut);font-size:13px}
@media (max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;max-height:none;display:flex;overflow-x:auto;gap:4px;padding:8px}.grp{display:flex;gap:4px;padding:0;align-items:center}.grp-t{display:none}.it{white-space:nowrap;width:auto}.it-s{display:none}.stage{padding:16px 8px}}
</style>
</head>
<body>
<header class="top"><div class="top-in">
<div><div class="brand">${logoSvg}</div>
<h1>Les e-mails de Stabl</h1>
<p>Tous les e-mails transactionnels, tels qu'ils arrivent chez les cavaliers, les familles et les gérants. Exemple : l'Écurie du Moulin, à Lozanne.</p></div>
<div class="legend"><span class="chip">${items.length} e-mails</span><span class="chip">Gmail · Outlook · Apple Mail</span><span class="chip">Clair et sombre</span></div>
</div></header>
<div class="wrap">
<nav aria-label="E-mails">${nav}</nav>
<main>
<div class="inbox" aria-label="Aperçu dans la boîte de réception"><div class="av" id="av"></div><div class="meta"><div class="from"><span id="from"></span><time>09:41</time></div><div class="subj" id="subj"></div><div class="pre" id="pre"></div></div></div>
<div class="bar"><p class="desc" id="desc"></p>
<div class="seg" role="group" aria-label="Format"><button type="button" data-v="desktop" aria-pressed="true">Ordinateur</button><button type="button" data-v="phone" aria-pressed="false">Téléphone</button><button type="button" data-v="text" aria-pressed="false">Texte brut</button></div>
<div class="seg" role="group" aria-label="Thème"><button type="button" data-t="light" aria-pressed="true">Clair</button><button type="button" data-t="dark" aria-pressed="false">Sombre</button></div>
<a class="open" id="open" href="#" target="_blank" rel="noopener">Ouvrir seul ↗</a></div>
<div class="stage" id="stage"><div class="device" id="device"><div class="chrome"><i></i><i></i><i></i></div><iframe id="frame" title="Aperçu de l'e-mail"></iframe><pre id="text" hidden></pre></div></div>
</main>
</div>
<footer>Généré par app/api/scripts/apercu-mails.mjs à partir des modèles de app/api/src/mail. Les images des e-mails sont servies depuis stablapp.fr/brand/mail.</footer>
<script>
const MAILS = ${json};
const SYMBOL = ${JSON.stringify(symbolSvg).replace(/</g, "\\u003c")};
const $ = (id) => document.getElementById(id);
const state = { k: MAILS[0].key, v: "desktop", t: "light" };
try { const s = JSON.parse(localStorage.getItem("stabl-mails") || "{}"); Object.assign(state, s); } catch (e) {}
if (location.hash && MAILS.some((m) => m.key === location.hash.slice(1))) state.k = location.hash.slice(1);
const dark = (h) => h.replace("@media (prefers-color-scheme:dark){", "@media all{");
function fit() {
  const f = $("frame");
  try { const d = f.contentDocument; if (d && d.body) f.style.height = Math.max(400, d.documentElement.scrollHeight) + "px"; } catch (e) {}
}
function show() {
  const m = MAILS.find((x) => x.key === state.k) || MAILS[0];
  document.querySelectorAll(".it").forEach((b) => b.setAttribute("aria-current", String(b.dataset.k === m.key)));
  document.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === state.v)));
  document.querySelectorAll("[data-t]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === state.t)));
  $("from").textContent = m.sender;
  $("subj").textContent = m.subject;
  $("pre").textContent = m.preheader;
  $("desc").textContent = m.description;
  const av = $("av");
  const club = m.sender !== "Stabl";
  av.className = "av" + (club ? "" : " stabl");
  if (club) av.textContent = m.sender.replace(/^(Écurie|Centre équestre|Club)\s+(du|de la|des|de)?\s*/i, "").charAt(0).toUpperCase(); else av.innerHTML = SYMBOL;
  $("open").href = "m/" + m.key + ".html";
  $("stage").classList.toggle("dark", state.t === "dark");
  const dev = $("device");
  dev.className = "device" + (state.v === "phone" ? " phone" : state.v === "text" ? " text" : "");
  $("frame").hidden = state.v === "text";
  $("text").hidden = state.v !== "text";
  if (state.v === "text") $("text").textContent = m.text;
  else { $("frame").srcdoc = state.t === "dark" ? dark(m.html) : m.html; }
  try { localStorage.setItem("stabl-mails", JSON.stringify({ v: state.v, t: state.t })); } catch (e) {}
  if (location.hash.slice(1) !== m.key) history.replaceState(null, "", "#" + m.key);
}
$("frame").addEventListener("load", () => { fit(); setTimeout(fit, 400); setTimeout(fit, 1500); });
window.addEventListener("resize", fit);
document.querySelectorAll(".it").forEach((b) => b.addEventListener("click", () => { state.k = b.dataset.k; show(); if (innerWidth < 900) $("stage").scrollIntoView({ behavior: "smooth", block: "start" }); }));
document.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => { state.v = b.dataset.v; show(); }));
document.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { state.t = b.dataset.t; show(); }));
document.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  if (!(e.target === document.body || (e.target.classList && e.target.classList.contains("it")))) return;
  const i = MAILS.findIndex((m) => m.key === state.k);
  const n = MAILS[(i + (e.key === "ArrowDown" ? 1 : MAILS.length - 1)) % MAILS.length];
  state.k = n.key; show(); e.preventDefault();
  document.querySelector('.it[data-k="' + n.key + '"]')?.focus();
});
show();
</script>
</body>
</html>`;
}

/* ---------- 4. Captures ---------- */
const SHOTS = ["invitation_member", "welcome_member", "welcome_owner", "verify_email", "club_referral", "booking_confirmed", "invoice_issued", "payment_receipt"];
const PLANCHE = ["invitation_member", "welcome_owner", "booking_confirmed", "invoice_issued", "payment_receipt", "club_referral"];

async function captures(chromium, items) {
  const dir = join(OUT, "captures");
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  for (const [w, suffix] of [[390, "telephone"], [700, "ordinateur"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: "light" });
    const page = await ctx.newPage();
    for (const k of SHOTS) {
      await page.goto(pathToFileURL(join(OUT, "m", k + ".html")).href, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.screenshot({ path: join(dir, `${k}-${suffix}.png`), fullPage: true });
    }
    await ctx.close();
  }
  // Mode sombre (téléphone) pour deux e-mails
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
    const page = await ctx.newPage();
    for (const k of ["invitation_member", "invoice_issued"]) {
      await page.goto(pathToFileURL(join(OUT, "m", k + ".html")).href, { waitUntil: "networkidle" }).catch(() => {});
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.screenshot({ path: join(dir, `${k}-telephone-sombre.png`), fullPage: true });
    }
    await ctx.close();
  }
  // Planche : 6 e-mails côte à côte (téléphone, haut de l'e-mail)
  const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
  const cols = PLANCHE.map((k) => `<figure><div class="ph"><img src="${k}-telephone.png" alt=""></div><figcaption><b>${escH(byKey[k].name)}</b><span>${escH(byKey[k].subject)}</span></figcaption></figure>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><link href="${byKey[PLANCHE[0]].fontsHref}" rel="stylesheet"><style>
  body{margin:0;background:#0a1636;font-family:Inter,system-ui,sans-serif;color:#fff}
  .w{padding:72px 64px 64px;position:relative}
  .w::after{content:"";position:absolute;left:0;right:0;bottom:0;height:8px;background:linear-gradient(90deg,#2448d8 0 62%,#6d8bff 62% 86%,#c9d3f5 86%)}
  h1{font-family:'Bricolage Grotesque',Inter,sans-serif;font-weight:800;font-size:64px;letter-spacing:-2px;margin:0 0 10px}
  p.s{margin:0 0 48px;color:#c9d3f5;font-size:22px}
  .g{display:flex;gap:32px}
  figure{margin:0;width:390px}
  .ph{height:760px;overflow:hidden;border-radius:40px;border:10px solid #050914;background:#f4f5f9;box-shadow:0 40px 80px -30px rgba(0,0,0,.6);position:relative}
  .ph::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(rgba(244,245,249,0),#f4f5f9)}
  .ph img{width:370px;display:block}
  figcaption{margin-top:18px;font-size:15px;line-height:1.4}
  figcaption b{display:block;font-size:17px}
  figcaption span{color:#c9d3f5}
  </style></head><body><div class="w"><h1>Les e-mails de Stabl</h1><p class="s">Invitation, bienvenue, réservation, facture, reçu, recommandation : une seule direction artistique.</p><div class="g">${cols}</div></div></body></html>`;
  writeFileSync(join(dir, "_planche.html"), html);
  const ctx = await browser.newContext({ viewport: { width: 6 * 390 + 5 * 32 + 128, height: 1200 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(join(dir, "_planche.html")).href, { waitUntil: "networkidle" }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.screenshot({ path: join(dir, "planche.png"), fullPage: true });
  await browser.close();
  rmSync(join(dir, "_planche.html"), { force: true });
  console.log(`captures → site/mails/captures/ (${SHOTS.length * 2 + 2} + planche.png)`);
}

/* ---------- Programme ---------- */
const needPlaywright = args.has("--captures") || args.has("--assets") || !existsSync(join(ASSETS_DIR, "stabl-logo-blanc@2x.png"));
let chromium = null;
if (needPlaywright) {
  try { ({ chromium } = await import("playwright")); } catch { try { ({ chromium } = createRequire(import.meta.url)("playwright")); } catch { /* absent */ } }
  if (!chromium) { console.error("Playwright est nécessaire pour --assets et --captures (npm i -g playwright)."); process.exit(1); }
}
if (args.has("--assets") || !existsSync(join(ASSETS_DIR, "stabl-logo-blanc@2x.png"))) await makeAssets(chromium);

const { renderTemplate, TEMPLATES, BRAND } = await loadRenderer();
const list = entries(TEMPLATES);
const items = [];
for (const e of list) {
  const club = PLATFORM.has(e.template) ? null : CLUB;
  const r = await renderTemplate(ENV, e.template, e.data, club, "lea.martin@exemple.fr");
  const local = (h, prefix) => h.split(BRAND.assetsUrl + "/").join(prefix);
  const pre = /<div style="display:none[^>]*>([^<&]*)/.exec(r.html)?.[1] || "";
  items.push({ ...e, sender: club ? `${club.name} via ${BRAND.name}` : BRAND.name, subject: r.subject, preheader: pre.trim(), category: r.category,
    html: local(r.html, "img/"), htmlStandalone: local(r.html, "../img/"), text: r.text, fontsHref: BRAND.fontsHref });
}

rmSync(join(OUT, "m"), { recursive: true, force: true });
mkdirSync(join(OUT, "m"), { recursive: true });
mkdirSync(join(OUT, "img"), { recursive: true });
for (const f of readdirSync(ASSETS_DIR)) if (f.endsWith(".png")) copyFileSync(join(ASSETS_DIR, f), join(OUT, "img", f));
for (const i of items) writeFileSync(join(OUT, "m", i.key + ".html"), i.htmlStandalone);
const logoSvg = readFileSync(join(ROOT, "brand/stabl/logo/stabl-logo-blanc.svg"), "utf8").replace(/<svg /, '<svg role="img" aria-label="Stabl" ');
const symbolSvg = readFileSync(join(ROOT, "brand/stabl/symbole/stabl-symbole-blanc.svg"), "utf8");
writeFileSync(join(OUT, "index.html"), galleryHtml(items, BRAND, logoSvg, symbolSvg));
console.log(`${items.length} e-mails → site/mails/index.html et site/mails/m/`);
if (args.has("--captures")) await captures(chromium, items);
