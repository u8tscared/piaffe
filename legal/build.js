#!/usr/bin/env node
/*
 * Textes légaux de Stabl : CGU, CGV, politique de confidentialité, accord de sous-traitance (RGPD art. 28), mentions légales.
 * Sources : legal/src/<slug>.html (fragments). Sortie : legal/dist/<slug>/index.html (pages autonomes, servies sur stablapp.fr/<slug>/).
 * Les faits communs (éditeur, adresse, sous-traitants) sont ici, une seule fois.
 * Changer un texte : modifier la source, changer VERSION si le changement est important, relancer `node legal/build.js` (ou `sh tools-pages.sh`).
 * La version acceptée est aussi enregistrée côté serveur : app/api/src/lib/legal.ts (LEGAL_VERSION) et app/web/live (PL.LEGAL).
 */
const fs = require("fs"), path = require("path");
const ROOT = __dirname, SRC = path.join(ROOT, "src"), OUT = path.join(ROOT, "dist");

const VERSION = "2026-11-28";
const DATE = "28 novembre 2026";
const EMAIL = "contact@stablapp.fr";
const ADRESSE = "36 rue Jacques-Louis Hénon, 69004 Lyon";
const EDITEUR_COURT = "Marceau Ruis, entrepreneur individuel (nom commercial Ruis Global), SIREN 934 733 122";
const EDITEUR_BLOC = `<b>Marceau Ruis</b>, entrepreneur individuel (micro-entreprise), nom commercial Ruis Global, exploitant la marque Stabl<br>
SIREN 934 733 122 · SIRET 934 733 122 00014<br>Dispensé d’immatriculation au registre du commerce et des sociétés<br>
${ADRESSE}, France<br>E-mail : <a href="mailto:${EMAIL}">${EMAIL}</a>`;
const TVA = "TVA non applicable, article 293 B du Code général des impôts : les prix hors taxes sont aussi les prix payés.";

/* club: true = traite des données des clubs (annexe 3 de l'accord de sous-traitance). */
const SOUS_TRAITANTS = [
  { club: true, nom: "Cloudflare, Inc.", pays: "États-Unis", role: "Hébergement de l’application, base de données, fichiers et photos, robot de reprise de données, protection contre les attaques", lieu: "Union européenne pour le stockage ; réseau mondial pour l’acheminement" },
  { club: true, nom: "Resend", pays: "États-Unis", role: "Envoi des e-mails (invitations, factures, rappels) et suivi de leur remise", lieu: "Irlande (région Europe de l’Ouest)" },
  { club: true, nom: "Stripe Payments Europe, Ltd.", pays: "Irlande", role: "Paiement de l’abonnement Stabl ; paiements en ligne des cavaliers au club, sur le compte Stripe du club", lieu: "Union européenne, transferts encadrés" },
  { club: true, nom: "Google Ireland Limited", pays: "Irlande", role: "Connexion avec un compte Google, si vous la choisissez ; polices de caractères des pages publiques", lieu: "Union européenne, transferts encadrés" },
  { club: true, nom: "SUPER PDP", pays: "France", role: "Transmission des factures électroniques, si le club active ce service", lieu: "France" },
  { club: true, nom: "Anthropic, PBC", pays: "États-Unis", role: "Lecture assistée des écrans de l’ancien logiciel pendant une reprise de données, seulement si le club lance une reprise et que cette option est active", lieu: "États-Unis, transferts encadrés ; aucune conservation pour entraînement" },
  { club: false, nom: "GitHub, Inc.", pays: "États-Unis", role: "Hébergement du site de présentation stablapp.fr (aucune donnée des clubs)", lieu: "Réseau mondial" },
];
const row = (s) => `<tr><td><b>${s.nom}</b><br><small>${s.pays}</small></td><td>${s.role}</td><td>${s.lieu}</td></tr>`;

const DOCS = [
  { slug: "cgu", court: "CGU" },
  { slug: "cgv", court: "CGV clubs" },
  { slug: "confidentialite", court: "Confidentialité" },
  { slug: "sous-traitance", court: "Contrat RGPD" },
  { slug: "mentions-legales", court: "Mentions légales" },
];

const LOGO = fs.readFileSync(path.join(ROOT, "..", "brand/stabl/symbole/stabl-symbole-marine.svg"), "utf8")
  .replace(/<\?xml[^>]*>/, "").replace(/fill="#0[aA]1636"/g, 'fill="currentColor"').replace(/<svg /, '<svg aria-hidden="true" ');

const CSS = `
:root{--bg:#f4f6fa;--card:#fff;--ink:#0a1636;--text:#2a3452;--mut:#5c6580;--line:#e3e7ef;--acc:#2448d8;--pale:#eef2ff;--fd:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;--ft:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#131a2e;--ink:#eef1f8;--text:#d2d7e5;--mut:#a0a8bf;--line:#27304b;--acc:#8fb0ff;--pale:#18213d}}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:20px}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.65 var(--ft);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
a{color:var(--acc)}a:hover{text-decoration-thickness:2px}
.top{max-width:1080px;margin:0 auto;padding:20px 20px 0;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.brand{display:inline-flex;align-items:center;gap:9px;color:var(--ink);text-decoration:none;font:800 24px/1 var(--fd);letter-spacing:-.045em}
.brand svg{width:30px;height:30px}
.top .back{margin-left:auto;font-size:14.5px;font-weight:600;text-decoration:none}
.tabs{max-width:1080px;margin:18px auto 0;padding:0 20px;display:flex;gap:6px;flex-wrap:wrap}
.tabs a{padding:7px 13px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--text);font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap}
.tabs a[aria-current=page]{background:var(--ink);color:var(--card);border-color:var(--ink)}
.wrap{max-width:1080px;margin:0 auto;padding:22px 20px 56px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:28px;align-items:start}
@media (max-width:860px){.wrap{grid-template-columns:minmax(0,1fr)}.toc{position:static!important}}
.toc{position:sticky;top:20px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 16px 12px;font-size:14px}
.toc b{display:block;font:800 15px var(--fd);color:var(--ink);margin-bottom:6px}
.toc ol{list-style:none;margin:0;padding:0}.toc li{margin:0}.toc a{display:block;padding:4px 0;color:var(--text);text-decoration:none;line-height:1.35}.toc a:hover{color:var(--acc)}
@media (max-width:860px){.toc{display:none}}
article{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:34px 38px 40px;min-width:0}
@media (max-width:560px){article{padding:24px 18px 28px;border-radius:18px}}
h1{font:800 clamp(30px,5vw,42px)/1.08 var(--fd);color:var(--ink);letter-spacing:-.035em;margin:0 0 8px}
.meta{color:var(--mut);font-size:14.5px;margin:0 0 22px;display:flex;gap:6px 14px;flex-wrap:wrap;align-items:center}
.meta button{font:600 14px var(--ft);color:var(--acc);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline}
h2{font:800 22px/1.25 var(--fd);color:var(--ink);letter-spacing:-.02em;margin:34px 0 10px}
p,ul,ol{margin:0 0 12px}li{margin:0 0 6px}ul,ol{padding-left:22px}
.resume{background:var(--pale);border-radius:16px;padding:16px 20px 6px;margin:0 0 8px}
.resume b{display:block;font:800 16px var(--fd);color:var(--ink);margin-bottom:6px}
.fiche{background:var(--bg);border-radius:14px;padding:14px 18px}
.tbl{overflow-x:auto;margin:0 0 14px;border:1px solid var(--line);border-radius:14px}
table{border-collapse:collapse;width:100%;font-size:14.5px;line-height:1.5}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border-bottom:1px solid var(--line)}
thead th{background:var(--bg);color:var(--ink);font-weight:700}
tbody th{color:var(--ink);width:26%}
tr:last-child>*{border-bottom:0}
small{color:var(--mut)}
footer{max-width:1080px;margin:0 auto;padding:0 20px 40px;color:var(--mut);font-size:14px;display:flex;gap:8px 18px;flex-wrap:wrap}
footer a{color:var(--mut)}
@media print{body{background:#fff;color:#000;font-size:11pt}.tabs,.toc,.top .back,.meta button,footer{display:none}.wrap{display:block;padding:0}article{border:0;padding:0}a{color:#000}.resume{border:1px solid #ccc}h2{break-after:avoid}tr{break-inside:avoid}}
`;

function fill(s) {
  return s.replace(/\{\{EDITEUR_BLOC\}\}/g, EDITEUR_BLOC).replace(/\{\{EDITEUR_COURT\}\}/g, EDITEUR_COURT).replace(/\{\{ADRESSE\}\}/g, ADRESSE)
    .replace(/\{\{EMAIL\}\}/g, EMAIL).replace(/\{\{TVA\}\}/g, TVA).replace(/\{\{DATE\}\}/g, DATE)
    .replace(/\{\{SOUS_TRAITANTS\}\}/g, SOUS_TRAITANTS.map(row).join("\n"))
    .replace(/\{\{SOUS_TRAITANTS_CLUB\}\}/g, SOUS_TRAITANTS.filter((s) => s.club).map(row).join("\n"));
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const d of DOCS) {
  let src = fs.readFileSync(path.join(SRC, d.slug + ".html"), "utf8");
  const m = src.match(/^<!--\s*titre:\s*(.+?)\s*\|\s*resume:\s*(.+?)\s*-->/);
  if (!m) throw new Error("en-tête manquant : " + d.slug);
  const [titre, resume] = [m[1], m[2]];
  src = fill(src.slice(m[0].length));
  const left = src.match(/\{\{[A-Z_]+\}\}/);
  if (left) throw new Error(`variable inconnue ${left[0]} dans ${d.slug}`);
  src = src.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="tbl"><table>$1</table></div>');
  const toc = [...src.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map((h) => `<li><a href="#${h[1]}">${h[2]}</a></li>`).join("");
  const tabs = DOCS.map((x) => `<a href="/${x.slug}/"${x.slug === d.slug ? ' aria-current="page"' : ""}>${x.court}</a>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre} · Stabl</title><meta name="description" content="${resume}"><meta name="theme-color" content="#0a1636"><meta name="robots" content="index,follow">
<link rel="canonical" href="https://stablapp.fr/${d.slug}/"><link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>
<header class="top"><a class="brand" href="/" aria-label="Stabl, accueil">${LOGO}stabl</a><a class="back" href="/">Retour au site</a></header>
<nav class="tabs" aria-label="Documents légaux">${tabs}</nav>
<div class="wrap"><aside class="toc" aria-label="Sommaire"><b>Sommaire</b><ol>${toc}</ol></aside>
<article><h1>${titre}</h1><p class="meta"><span>Version en vigueur du ${DATE}</span><button type="button" onclick="print()">Imprimer ou enregistrer en PDF</button></p>
${src.trim()}
</article></div>
<footer><span>© 2026 Stabl · Marceau Ruis EI</span>${DOCS.map((x) => `<a href="/${x.slug}/">${x.court}</a>`).join("")}<a href="mailto:${EMAIL}">${EMAIL}</a></footer>
</body></html>`;
  fs.mkdirSync(path.join(OUT, d.slug), { recursive: true });
  fs.writeFileSync(path.join(OUT, d.slug, "index.html"), html);
}
fs.writeFileSync(path.join(OUT, "version.json"), JSON.stringify({ version: VERSION, date: DATE, docs: DOCS.map((d) => d.slug) }) + "\n");
console.log("legal/dist : " + DOCS.map((d) => d.slug).join(", ") + " (version " + VERSION + ")");
