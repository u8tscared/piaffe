import { LOGO_SVG } from "./logo";

/** Page d'accord affichée par le Worker lui-même (même origine que l'appli : la session Stabl est déjà là). */
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const ROLE: Record<string, string> = { owner: "Propriétaire", manager: "Gérant", staff: "Employé" };

const CSS = `
:root{--ink:#0a1636;--text:#2b3550;--muted:#5d6684;--line:#e3e6ee;--bg:#f4f5f9;--card:#fff;--acc:#1f4fd1;--acc-soft:#e8eefc;--bad:#b42318;--ok:#127a4b;--focus:0 0 0 3px rgba(31,79,209,.28)}
@media (prefers-color-scheme:dark){:root{--ink:#e6e9f2;--text:#d4d8e6;--muted:#a3abc2;--line:#2a3350;--bg:#0b1020;--card:#141a2e;--acc:#8fb0ff;--acc-soft:#1b2747;--bad:#ff8a80;--ok:#6fd3a3}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%}
main{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px}
.card{width:100%;max-width:460px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:28px 28px 24px;box-shadow:0 12px 40px rgba(10,22,54,.08)}
@media (prefers-reduced-motion:no-preference){.card{animation:in .32s cubic-bezier(.2,.7,.2,1)}@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}
.brand{display:flex;align-items:center;gap:10px;color:var(--ink);margin-bottom:22px}
.brand svg{width:30px;height:auto;display:block}
.brand b{font:800 24px/1 "Bricolage Grotesque",Inter,sans-serif;letter-spacing:-.02em}
h1{font:800 24px/1.2 "Bricolage Grotesque",Inter,sans-serif;color:var(--ink);margin:0 0 8px;letter-spacing:-.01em}
p{margin:0 0 14px}
.muted{color:var(--muted);font-size:15px}
ul.can{margin:0 0 18px;padding:0;list-style:none;display:grid;gap:8px}
ul.can li{display:flex;gap:10px;font-size:15px}
ul.can li:before{content:"";flex:none;width:8px;height:8px;margin-top:8px;border-radius:50%;background:var(--acc)}
fieldset{border:0;margin:0 0 16px;padding:0}
legend{font-weight:600;color:var(--ink);margin-bottom:8px;font-size:15px}
label.opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;cursor:pointer;font-size:15px}
label.opt:has(input:checked){border-color:var(--acc);background:var(--acc-soft)}
label.opt small{display:block;color:var(--muted);font-size:13px}
input[type=radio],input[type=checkbox]{width:18px;height:18px;accent-color:var(--acc);flex:none;margin:0}
label.check{display:flex;gap:12px;align-items:flex-start;font-size:15px;margin:4px 0 20px;cursor:pointer}
label.check input{margin-top:3px}
.field{display:block;margin-bottom:12px;font-size:15px;font-weight:600;color:var(--ink)}
.field input{display:block;width:100%;margin-top:6px;font:inherit;font-weight:400;color:var(--text);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px 13px}
.field input:focus,button:focus-visible,a:focus-visible,label.opt:focus-within{outline:none;box-shadow:var(--focus)}
.row{display:flex;gap:10px;flex-wrap:wrap}
button,.btn{appearance:none;border:0;border-radius:12px;padding:12px 18px;font:600 16px/1.2 Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:1 1 140px;min-height:46px}
.primary{background:var(--ink);color:var(--card)}
.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
button[disabled]{opacity:.6;cursor:default}
.err{color:var(--bad);font-size:15px;min-height:1em;margin:0 0 10px}
.foot{margin:18px 0 0;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
a{color:var(--acc)}
.sep{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px;margin:14px 0}
.sep:before,.sep:after{content:"";flex:1;height:1px;background:var(--line)}
`;

function shell(title: string, body: string, nonce: string, script = "") {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="icon" href="/icon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><main><div class="card"><div class="brand" aria-label="Stabl">${LOGO_SVG}<b>stabl</b></div>${body}</div></main>${script ? `<script nonce="${nonce}">${script}</script>` : ""}</body></html>`;
}

export function csp(nonce: string) {
  return `default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'nonce-${nonce}'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'`;
}

export function errorPage(message: string, nonce: string) {
  return shell("Connexion impossible · Stabl", `<h1>Connexion impossible</h1><p>${esc(message)}</p><p class="muted">Revenez dans l'assistant (Claude, ChatGPT…) et relancez la connexion à Stabl.</p>`, nonce);
}

export function loginPage(o: { client: string; request: string; nonce: string; error?: string }) {
  const next = "/oauth/authorize?demande=" + encodeURIComponent(o.request);
  const body = `<h1>Connectez-vous pour relier ${esc(o.client)}</h1>
<p class="muted">${esc(o.client)} demande à lire les données de votre club. Connectez-vous d'abord à Stabl.</p>
<form id="lf" novalidate>
<label class="field">Adresse e-mail<input id="em" type="email" autocomplete="email" required></label>
<label class="field">Mot de passe<input id="pw" type="password" autocomplete="current-password" required></label>
<p class="err" id="er" role="alert">${esc(o.error || "")}</p>
<div class="row"><button class="primary" id="go" type="submit">Se connecter</button></div>
</form>
<div class="sep">ou</div>
<div class="row"><a class="btn ghost" href="/auth/google/start?next=${esc(encodeURIComponent(next))}">Continuer avec Google</a></div>
<p class="foot"><a href="/mot-de-passe-oublie">Mot de passe oublié&nbsp;?</a></p>`;
  const js = `document.getElementById('lf').addEventListener('submit',function(e){e.preventDefault();var b=document.getElementById('go'),er=document.getElementById('er');
var em=document.getElementById('em').value.trim(),pw=document.getElementById('pw').value;if(!em||!pw){er.textContent='Indiquez votre e-mail et votre mot de passe.';return}
b.disabled=true;er.textContent='';fetch('/auth/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-requested-with':'piaffe'},body:JSON.stringify({email:em,password:pw})})
.then(function(r){if(r.ok){location.reload();return}return r.json().then(function(j){throw j})}).catch(function(j){b.disabled=false;er.textContent=(j&&j.error&&j.error.message)||'La connexion n\\u2019a pas abouti. Vérifiez votre réseau et réessayez.'})});`;
  return shell("Relier un assistant · Stabl", body, o.nonce, js);
}

export function noClubPage(o: { client: string; email: string; nonce: string }) {
  return shell("Relier un assistant · Stabl", `<h1>Aucun club à relier</h1>
<p>Vous êtes connecté avec ${esc(o.email)}, mais vous n'êtes ni gérant ni employé d'un club dans Stabl.</p>
<p class="muted">Seuls l'équipe et les gérants d'un club peuvent y relier ${esc(o.client)}. Si vous pensez que c'est une erreur, demandez une invitation au gérant de votre club.</p>`, o.nonce);
}

export function consentPage(o: { client: string; host: string; request: string; token: string; email: string; clubs: { id: string; name: string; role: string }[]; wantsWrite: boolean; nonce: string }) {
  const clubs = o.clubs.map((c, i) => `<label class="opt"><input type="radio" name="club" value="${esc(c.id)}"${i === 0 ? " checked" : ""} required><span>${esc(c.name)}<small>${esc(ROLE[c.role] || c.role)}</small></span></label>`).join("");
  const body = `<h1>Relier ${esc(o.client)} à votre club</h1>
<p class="muted">${esc(o.client)}${o.host ? ` (${esc(o.host)})` : ""} demande à lire les données de votre club dans Stabl.</p>
<form method="post" action="/oauth/authorize">
<input type="hidden" name="demande" value="${esc(o.request)}"><input type="hidden" name="jeton" value="${esc(o.token)}">
<fieldset><legend>Club</legend>${clubs}</fieldset>
<ul class="can"><li>Lire les chevaux, les soins, le planning, les stocks et l'équipe.</li><li>Pour un gérant&nbsp;: aussi les adhérents, les pensions, les factures et le chiffre d'affaires.</li><li>Ce que vous ne voyez pas dans Stabl, l'assistant ne le voit pas non plus.</li></ul>
<label class="check"><input type="checkbox" name="ecriture" value="1"${o.wantsWrite ? " checked" : ""}><span>Permettre aussi les ajouts&nbsp;: un soin, une place dans une reprise, une tâche cochée. L'assistant vous demandera votre accord à chaque fois.</span></label>
<div class="row"><button class="primary" type="submit" name="decision" value="autoriser">Autoriser</button><button class="ghost" type="submit" name="decision" value="refuser" formnovalidate>Refuser</button></div>
</form>
<p class="foot">Connecté avec ${esc(o.email)}. Vous pourrez retirer cet accès à tout moment dans Stabl, Réglages › Connecteurs.</p>`;
  return shell("Relier un assistant · Stabl", body, o.nonce);
}
