/* Pages publiques d'un club, servies par le Worker (mobile d'abord, DA Stabl « Paddock » : marine, Bricolage Grotesque 800 + Inter).
   Aucune dépendance : HTML + CSS en ligne, un petit script par page (nonce CSP). Les textes viennent du club : toujours échappés. */
import { LOGO_SVG } from "../mcp/logo";

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const NB = "\u202f";
/** valeur sûre dans un script en ligne : pas de « </script> » possible */
const js = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
export const eur = (n: number) => (Math.round(n * 100) % 100 ? n.toFixed(2).replace(".", ",") : String(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NB) + NB + "€";

export interface PubClub { id: string; name: string; slug: string; city?: string | null; phone?: string | null; email?: string | null }

const CSS = `
:root{--bg:#f2f4f8;--card:#fff;--soft:#f6f7fb;--line:#e6e9f0;--line2:#d6dbe6;--ink:#0a1636;--text:#27314f;--mut:#59627c;--navy:#0a1636;--navy-ink:#fff;--acc:#2448d8;--acc-pale:#e7ecff;
--ok:#11864f;--ok-pale:#dcf3e4;--bad:#cc3a24;--bad-pale:#ffe3de;--mo:#ef9f2c;--mo-bg:#ffedcf;--mo-ink:#7a4a00;--hz:#2aa86a;--hz-bg:#dcf3e4;--star:#f2a516;
--fd:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;--ft:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;--focus:0 0 0 3px rgba(36,72,216,.3);--e:cubic-bezier(.16,1,.3,1)}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#141a2e;--soft:#19203a;--line:#26304d;--line2:#33406a;--ink:#eef1f8;--text:#d4d8e6;--mut:#a3abc2;--navy:#1b2550;--acc:#8fb0ff;--acc-pale:#1b2747;
--ok:#6fd3a3;--ok-pale:#12352a;--bad:#ff9b8c;--bad-pale:#3d1d19;--mo-bg:#3a2a10;--mo-ink:#ffd08a;--hz-bg:#12352a}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.5 var(--ft);-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}
.wrap{max-width:560px;margin:0 auto;padding:20px 16px 40px}
.top{display:flex;align-items:center;gap:12px;margin:4px 0 18px}
.mono{flex:none;width:44px;height:44px;border-radius:14px;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;font:800 17px var(--fd);letter-spacing:-.02em}
.top b{display:block;font:800 19px/1.15 var(--fd);color:var(--ink);letter-spacing:-.02em}
.top div span{font-size:14px;color:var(--mut)}
h1{font:800 32px/1.08 var(--fd);color:var(--ink);letter-spacing:-.035em;margin:0 0 10px}
h2{font:800 21px/1.2 var(--fd);color:var(--ink);letter-spacing:-.02em;margin:0 0 12px}
p{margin:0 0 14px}
.mut{color:var(--mut)}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px;margin-bottom:14px;box-shadow:0 1px 2px rgba(10,22,54,.04),0 6px 24px -8px rgba(10,22,54,.08)}
.hero{background:var(--navy);color:var(--navy-ink);border:0;padding:22px}
.hero h1{color:inherit}
.hero p{color:rgba(255,255,255,.82)}
@media (prefers-reduced-motion:no-preference){.card{animation:rise .42s var(--e) both}.card:nth-child(2){animation-delay:.05s}.card:nth-child(3){animation-delay:.1s}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 4px}
.opt{position:relative;display:flex;flex-direction:column;gap:4px;min-height:84px;padding:14px;border:1.5px solid var(--line);border-radius:16px;background:var(--card);cursor:pointer;text-align:left;font:inherit;color:inherit;transition:border-color .15s,background .15s}
.opt b{font:800 20px/1 var(--fd);color:var(--ink);letter-spacing:-.02em}
.opt span{font-size:14px;line-height:1.3;color:var(--text)}
.opt[aria-pressed=true]{border-color:var(--acc);background:var(--acc-pale)}
.opt:focus-visible,.btn:focus-visible,.in:focus,.star:focus-visible,.yn:focus-visible{outline:none;box-shadow:var(--focus)}
label.f.free{display:none;margin-top:10px}label.f.free.on{display:block}
label.f{display:block;margin:0 0 12px;font-size:15px;font-weight:600;color:var(--ink)}
label.f small{font-weight:400;color:var(--mut)}
.in{display:block;width:100%;margin-top:6px;font:inherit;font-size:16px;color:var(--ink);background:var(--card);border:1.5px solid var(--line2);border-radius:14px;padding:12px 14px;min-height:48px}
textarea.in{min-height:96px;resize:vertical}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:420px){.row2{grid-template-columns:1fr}}
.btn{appearance:none;border:0;border-radius:14px;padding:14px 20px;min-height:52px;width:100%;font:700 17px/1.2 var(--ft);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:var(--acc);color:#fff}
.btn.ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line2)}
.btn[disabled]{opacity:.6;cursor:default}
.note{display:flex;gap:10px;padding:12px 14px;border-radius:14px;background:var(--soft);color:var(--text);font-size:14.5px;line-height:1.45;margin:0 0 14px}
.note.warn{background:var(--mo-bg);color:var(--mo-ink)}
.err{color:var(--bad);font-size:15px;margin:0 0 12px;min-height:0}
.err:empty{display:none}
.done{text-align:center;padding:28px 20px}
.done .ic{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:var(--ok-pale);color:var(--ok)}
.done .ic svg{width:32px;height:32px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:var(--soft);font-size:14px;color:var(--text);border:1px solid var(--line)}
.chip.ok{background:var(--hz-bg);color:var(--ok);border-color:transparent}
.chip.warn{background:var(--mo-bg);color:var(--mo-ink);border-color:transparent}
.price{font:800 34px/1 var(--fd);color:var(--ink);letter-spacing:-.03em;margin:0 0 14px}
.ph{aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:var(--hz-bg);margin:0 0 16px;display:grid;place-items:center;color:var(--hz)}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph svg{width:96px;height:auto;opacity:.7}
.list{margin:0 0 14px;padding:0;list-style:none;display:grid;gap:8px}
.list li{display:flex;gap:10px;align-items:flex-start;font-size:15px}
.list li:before{content:"";flex:none;width:18px;height:18px;margin-top:2px;border-radius:50%;background:var(--ok-pale) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2311864f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center/12px no-repeat}
.stars{display:flex;justify-content:center;gap:6px;margin:6px 0 10px}
.star{appearance:none;border:0;background:none;padding:4px;cursor:pointer;color:var(--line2);border-radius:12px;transition:transform .15s var(--e),color .15s}
.star svg{width:44px;height:44px;display:block}
.star.on{color:var(--star)}
@media (prefers-reduced-motion:no-preference){.star:active{transform:scale(.9)}}
.lab{text-align:center;font-size:15px;color:var(--mut);min-height:22px;margin:0 0 12px}
.q{margin:0 0 18px}.q>b{display:block;color:var(--ink);font-size:16px;margin-bottom:4px}
.yns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.yn{appearance:none;border:1.5px solid var(--line);border-radius:14px;background:var(--card);padding:13px;font:600 16px var(--ft);color:var(--ink);cursor:pointer}
.yn[aria-pressed=true]{border-color:var(--acc);background:var(--acc-pale)}
.hp{position:absolute;left:-5000px;width:1px;height:1px;overflow:hidden}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:22px;font-size:13px;color:var(--mut)}
.foot svg{width:14px;height:auto;color:var(--ink)}
.foot b{font:800 14px var(--fd);color:var(--ink);letter-spacing:-.02em}
.sk{height:16px;border-radius:8px;background:var(--soft);margin:0 0 10px}
@media (prefers-reduced-motion:no-preference){.sk{animation:pulse 1.2s ease-in-out infinite alternate}@keyframes pulse{to{opacity:.45}}}
`;

const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
export const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
export const HORSE = LOGO_SVG;

function initials(name: string) {
  const w = name.replace(/^(les|le|la|l’|l')\s+/i, "").split(/[\s-]+/).filter((x) => x && !/^(de|du|des|d’|d')$/i.test(x));
  return ((w[0] || "S")[0] + (w[1] ? w[1][0] : "")).toUpperCase();
}
export function head(club: PubClub, sub: string) {
  return `<div class="top"><span class="mono" aria-hidden="true">${esc(initials(club.name))}</span><div><b>${esc(club.name)}</b><span>${esc(sub)}</span></div></div>`;
}
export function shell(o: { title: string; body: string; nonce: string; script?: string; desc?: string }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)}</title>${o.desc ? `<meta name="description" content="${esc(o.desc)}">` : ""}<meta name="theme-color" content="#0a1636"><link rel="icon" href="/icon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><main class="wrap">${o.body}<div class="foot">Propulsé par ${LOGO_SVG}<b>stabl</b></div></main>${o.script ? `<script nonce="${o.nonce}">${o.script}</script>` : ""}</body></html>`;
}
export function csp(nonce: string) {
  return `default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`;
}
export function messagePage(nonce: string, title: string, text: string, club?: PubClub | null) {
  return shell({ title: title + (club ? " · " + club.name : " · Stabl"), nonce,
    body: (club ? head(club, "Page du club") : "") + `<div class="card done"><h2>${esc(title)}</h2><p class="mut" style="margin:0">${esc(text)}</p></div>` });
}
const doneBlock = (title: string, text: string) => `<div class="card done" data-done hidden><div class="ic">${ICON_OK}</div><h2 data-done-t>${esc(title)}</h2><p class="mut" data-done-p style="margin:0">${esc(text)}</p></div>`;

/* petit noyau commun aux scripts : envoi JSON avec l'en-tête anti-CSRF de l'appli */
const JS_CORE = `var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function send(url,data){return fetch(url,{method:'POST',headers:{'content-type':'application/json','x-requested-with':'piaffe',accept:'application/json'},body:JSON.stringify(data),credentials:'same-origin'}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok){var e=new Error(j&&j.error&&j.error.message||'Une erreur est survenue. Réessayez dans un instant.');throw e}return j})},function(){throw new Error('Pas de connexion. Vérifiez votre réseau et réessayez.')})}
function busy(b,on,t){b.disabled=on;if(t)b.textContent=t}
function done(t,p){var f=$('[data-form]');if(f)f.hidden=true;var d=$('[data-done]');if(t)$('[data-done-t]').textContent=t;if(p)$('[data-done-p]').textContent=p;d.hidden=false;try{d.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}}
var T0=Date.now();`;

/* ---------- Carte cadeau : /c/:club/offrir ---------- */
export function giftPage(o: { club: PubClub; products: [string, number][]; validity: number; online: boolean; thanks: boolean; nonce: string }) {
  const c = o.club;
  if (o.thanks) return shell({ title: "Merci · " + c.name, nonce: o.nonce, body: head(c, "Carte cadeau") +
    `<div class="card done"><div class="ic">${ICON_OK}</div><h2>Merci pour votre achat</h2><p class="mut" style="margin:0">Le paiement est confirmé. La carte cadeau et son code arrivent par e-mail dans quelques minutes.</p></div>` });
  const prods = o.products.map(([n, p], i) => `<button type="button" class="opt" data-p="${i}" data-amt="${p}" aria-pressed="${i === 0}"><b>${eur(p)}</b><span>${esc(n)}</span></button>`).join("");
  const body = head(c, "Carte cadeau") +
    `<div class="card hero"><h1>Offrez un moment à cheval</h1><p style="margin:0">Baptême, balade, séances : choisissez, ${o.online ? "payez en ligne" : "envoyez votre demande"}, et la carte arrive par e-mail avec son code. Valable ${o.validity} mois.</p></div>
<form class="card" data-form novalidate>
<h2>Que voulez-vous offrir ?</h2>
<div class="opts">${prods}<button type="button" class="opt" data-p="-1" aria-pressed="${o.products.length ? "false" : "true"}"><b>Montant</b><span>libre, de 10 à 1\u202f000\u202f€</span></button></div>
<label class="f free${o.products.length ? "" : " on"}" data-free>Montant en euros<input class="in" id="g-amt" type="number" inputmode="numeric" min="10" max="1000" step="1" placeholder="50"></label>
<h2 style="margin-top:22px">Vos coordonnées</h2>
<label class="f">Votre nom<input class="in" id="g-buyer" autocomplete="name" placeholder="Sophie Martin"></label>
<label class="f">Votre e-mail <small>(la carte y sera envoyée)</small><input class="in" id="g-email" type="email" inputmode="email" autocomplete="email" placeholder="sophie@exemple.fr"></label>
<div class="row2"><label class="f">Pour qui ? <small>(facultatif)</small><input class="in" id="g-to" placeholder="Jules"></label><label class="f">Téléphone <small>(facultatif)</small><input class="in" id="g-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78"></label></div>
<label class="f">Message sur la carte <small>(facultatif)</small><input class="in" id="g-msg" maxlength="140" placeholder="Joyeux Noël, à toi les poneys !"></label>
<div class="hp" aria-hidden="true"><label>Site web<input id="g-site" tabindex="-1" autocomplete="off"></label></div>
${o.online ? "" : `<div class="note warn">Le paiement en ligne n’est pas encore ouvert. ${esc(c.name)} reçoit votre demande et vous recontacte pour le règlement, puis vous envoie la carte.</div>`}
<p class="err" data-err role="alert"></p>
<button class="btn" type="submit" data-go>${o.online ? "Payer" : "Envoyer ma demande"}</button>
</form>` + doneBlock("Demande envoyée", `${c.name} a bien reçu votre demande et vous recontacte très vite pour le règlement. La carte vous sera ensuite envoyée par e-mail.`);
  const script = JS_CORE + `var sel=${o.products.length ? 0 : -1},online=${o.online ? "true" : "false"},CLUB=${js(c.slug)};
function amount(){if(sel>=0)return +$('[data-p="'+sel+'"]').getAttribute('data-amt');return Math.round(+$('#g-amt').value||0)}
function eur(n){return (n>0?String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u202f')+'\\u202f€':'')}
function lbl(){var a=amount();$('[data-go]').textContent=online?(a>0?'Payer '+eur(a):'Payer'):'Envoyer ma demande'}
$$('[data-p]').forEach(function(b){b.onclick=function(){sel=+b.getAttribute('data-p');$$('[data-p]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('[data-free]').classList.toggle('on',sel<0);if(sel<0)$('#g-amt').focus();lbl()}});
$('#g-amt').oninput=lbl;lbl();
$('[data-form]').onsubmit=function(e){e.preventDefault();var err=$('[data-err]'),b=$('[data-go]');err.textContent='';
  var d={product:sel,amount:amount(),buyer:$('#g-buyer').value.trim(),email:$('#g-email').value.trim(),to:$('#g-to').value.trim(),phone:$('#g-phone').value.trim(),msg:$('#g-msg').value.trim(),site:$('#g-site').value,t:T0};
  if(sel<0&&(d.amount<10||d.amount>1000)){err.textContent='Choisissez un montant entre 10 et 1\\u202f000\\u202f€.';return}
  if(d.buyer.length<2){err.textContent='Indiquez votre nom.';$('#g-buyer').focus();return}
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(d.email)){err.textContent='Indiquez une adresse e-mail valide : la carte y sera envoyée.';$('#g-email').focus();return}
  var t=b.textContent;busy(b,true,online?'Ouverture du paiement…':'Envoi…');
  send('/api/public/gifts/'+encodeURIComponent(CLUB),d).then(function(j){if(j.url){location.href=j.url;return}done()},function(x){busy(b,false,t);err.textContent=x.message})};`;
  return shell({ title: "Offrir une carte cadeau · " + c.name, nonce: o.nonce, body, script, desc: `Offrez un baptême, une balade ou des séances à cheval chez ${c.name}.` });
}

/* ---------- Annonce d'un cheval à vendre : /c/:club/cheval/:ad (données lues par l'API publique) ---------- */
export function adPage(o: { club: PubClub; adId: string; nonce: string }) {
  const c = o.club;
  const body = head(c, "Cheval à vendre") +
    `<div class="card" data-ad><div class="ph" aria-hidden="true">${HORSE}</div><div class="sk" style="width:60%;height:28px"></div><div class="sk" style="width:40%"></div><div class="sk"></div><div class="sk" style="width:80%"></div></div>
<form class="card" data-form novalidate hidden>
<h2>Demander un essai</h2><p class="mut">${esc(c.name)} vous répond directement. Vos coordonnées ne servent qu’à cela.</p>
<label class="f">Votre nom<input class="in" id="l-name" autocomplete="name" placeholder="Camille Durand"></label>
<div class="row2"><label class="f">E-mail<input class="in" id="l-email" type="email" inputmode="email" autocomplete="email" placeholder="camille@exemple.fr"></label><label class="f">Téléphone<input class="in" id="l-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78"></label></div>
<label class="f">Votre niveau <small>(facultatif)</small><select class="in" id="l-level"><option value="">Choisir</option><option>Débutant</option><option>Galop 1 à 3</option><option>Galop 4 à 5</option><option>Galop 6 et plus</option><option>Compétition</option><option>Professionnel</option></select></label>
<label class="f">Message <small>(facultatif)</small><textarea class="in" id="l-msg" maxlength="2000" placeholder="Bonjour, je cherche un cheval pour…"></textarea></label>
<div class="hp" aria-hidden="true"><label>Site<input id="l-site" tabindex="-1" autocomplete="off"></label></div>
<p class="err" data-err role="alert"></p>
<button class="btn" type="submit" data-go>Envoyer ma demande</button>
</form>` + doneBlock("Demande envoyée", `${c.name} a bien reçu votre demande d’essai et vous répond très vite.`);
  const script = JS_CORE + `var API='/api/public/horse-ads/'+encodeURIComponent(${js(c.id)})+'/'+encodeURIComponent(${js(o.adId)});
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function eur(n){return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,'\\u202f')+'\\u202f€'}
fetch(API,{headers:{accept:'application/json'}}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j&&j.error&&j.error.message||'Annonce introuvable.');return j})}).then(function(j){
  var a=j.ad||{},h=j.horse||{},box=$('[data-ad]'),age=h.age||(h.born?(new Date().getFullYear()-(+h.born)):null),name=a.title||h.name||'Cheval à vendre';
  document.title=name+' · '+${js(c.name)};
  var chips=[h.breed,age?age+' ans':'',h.sex,h.height?(String(h.height).replace('.',',')+(/m$/.test(String(h.height))?'':' m')):'',h.coat,h.level].filter(Boolean).map(function(x){return '<span class="chip">'+e(x)+'</span>'}).join('');
  var inc=[a.health?'Carnet de santé à jour, consultable':'',a.vet?'Visite vétérinaire d’achat possible':'',a.results?'Résultats en concours sur demande':''].filter(Boolean);
  box.innerHTML=(h.photo?'<div class="ph"><img src="'+API+'/photo" alt="Photo de '+e(h.name||name)+'"></div>':'<div class="ph" aria-hidden="true">'+${js(HORSE)}+'</div>')+
    (a.status==='sous option'?'<div class="chips"><span class="chip warn">Sous option : vous pouvez encore demander un essai</span></div>':'')+
    '<h1>'+e(name)+'</h1>'+(chips?'<div class="chips">'+chips+'</div>':'')+(a.price?'<div class="price">'+eur(a.price)+'</div>':'')+
    (a.text?'<p style="white-space:pre-line">'+e(a.text)+'</p>':'')+(inc.length?'<ul class="list">'+inc.map(function(x){return '<li>'+e(x)+'</li>'}).join('')+'</ul>':'');
  var img=$('img',box);if(img)img.onerror=function(){img.parentNode.innerHTML=${js(HORSE)}};
  $('[data-form]').hidden=false;T0=Date.now()},function(x){$('[data-ad]').innerHTML='<div class="done"><h2>Annonce indisponible</h2><p class="mut" style="margin:0">'+e(x.message)+'</p></div>'});
$('[data-form]').onsubmit=function(ev){ev.preventDefault();var err=$('[data-err]'),b=$('[data-go]');err.textContent='';
  var d={name:$('#l-name').value.trim(),email:$('#l-email').value.trim(),phone:$('#l-phone').value.trim(),level:$('#l-level').value,msg:$('#l-msg').value.trim(),site:$('#l-site').value,t:T0};
  if(d.name.length<2){err.textContent='Indiquez votre nom.';$('#l-name').focus();return}
  if(!d.email&&d.phone.replace(/\\D/g,'').length<8){err.textContent='Indiquez un e-mail ou un téléphone pour que l’écurie puisse vous répondre.';return}
  if(Date.now()-T0<3000){err.textContent='Encore une petite seconde, puis renvoyez.';return}
  busy(b,true,'Envoi…');send(API+'/leads',d).then(function(){done()},function(x){busy(b,false,'Envoyer ma demande');err.textContent=x.message})};`;
  return shell({ title: "Cheval à vendre · " + c.name, nonce: o.nonce, body, script, desc: `Cheval à vendre chez ${c.name}.` });
}

/* ---------- Avis : /c/:club/avis ---------- */
export function reviewPage(o: { club: PubClub; token: string; first?: string; nonce: string }) {
  const c = o.club;
  const stars = [1, 2, 3, 4, 5].map((i) => `<button type="button" class="star" data-s="${i}" aria-label="${i} étoile${i > 1 ? "s" : ""} sur 5">${STAR}</button>`).join("");
  const body = head(c, "Votre avis") +
    `<form class="card" data-form novalidate><h1 style="font-size:28px">${o.first ? esc(o.first) + ", comment" : "Comment"} s’est passée votre visite ?</h1><p class="mut">Une note suffit. Elle arrive directement à l’équipe de ${esc(c.name)}.</p>
<div class="stars" role="group" aria-label="Votre note">${stars}</div><div class="lab" data-lab aria-live="polite"></div>
<div data-more hidden><label class="f" data-tlab>Un mot pour l’équipe <small>(facultatif)</small><textarea class="in" id="r-text" maxlength="2000"></textarea></label></div>
<div class="hp" aria-hidden="true"><label>Site<input id="r-site" tabindex="-1" autocomplete="off"></label></div>
<p class="err" data-err role="alert"></p><button class="btn" type="submit" data-go disabled>Envoyer</button></form>
<div class="card done" data-done hidden><div class="ic">${ICON_OK}</div><h2 data-done-t>Merci</h2><p class="mut" data-done-p></p><div data-g style="margin-top:16px" hidden><a class="btn" data-gl rel="noopener" target="_blank">Publier mon avis sur Google</a><p class="mut" style="font-size:14px;margin:10px 0 0">Deux minutes, et le club vous en sera très reconnaissant.</p></div></div>`;
  const script = JS_CORE + `var R=0,TOK=${js(o.token)},CLUB=${js(c.slug)},L=['','Très déçu','Déçu','Moyen','Bien','Excellent'];
$$('[data-s]').forEach(function(b){b.onclick=function(){R=+b.getAttribute('data-s');$$('[data-s]').forEach(function(x){x.classList.toggle('on',+x.getAttribute('data-s')<=R);x.setAttribute('aria-pressed',+x.getAttribute('data-s')===R)});
  $('[data-lab]').textContent=L[R];$('[data-more]').hidden=false;$('[data-go]').disabled=false;
  $('[data-tlab]').firstChild.textContent=R<=3?'Dites-nous ce qui n’a pas été ':'Un mot pour l’équipe ';
  $('#r-text').placeholder=R<=3?'Votre message reste privé : seul le club le lira.':'Ce qui vous a plu…'}});
$('[data-form]').onsubmit=function(e){e.preventDefault();if(!R)return;var b=$('[data-go]'),err=$('[data-err]');err.textContent='';busy(b,true,'Envoi…');
  send('/api/public/reviews/'+encodeURIComponent(CLUB),{rating:R,text:$('#r-text').value.trim(),t:TOK,shown:T0,site:$('#r-site').value}).then(function(j){
    if(R>=4){done('Merci beaucoup !',j.google_url?'Votre note est bien arrivée. Un avis sur Google aide d’autres familles à trouver le club.':'Votre note est bien arrivée. Toute l’équipe vous remercie.');
      if(j.google_url){$('[data-g]').hidden=false;$('[data-gl]').href=j.google_url;$('[data-gl]').onclick=function(){if(j.ack)send('/api/public/reviews/'+encodeURIComponent(CLUB)+'/google',{ack:j.ack}).catch(function(){})}}}
    else done('Merci de nous l’avoir dit','Votre message est arrivé au club, et à lui seul. Quelqu’un de l’équipe vous recontacte rapidement.')},
  function(x){busy(b,false,'Envoyer');err.textContent=x.message})};`;
  return shell({ title: "Votre avis · " + c.name, nonce: o.nonce, body, script });
}

/* ---------- Sondage : /s/:token ---------- */
export function surveyPage(o: { club: PubClub; title: string; coach: boolean; first?: string; token: string; nonce: string; already?: boolean }) {
  const c = o.club;
  if (o.already) return messagePage(o.nonce, "Déjà répondu", "Votre réponse à ce sondage est déjà enregistrée. Merci !", c);
  const st = (k: string) => `<div class="stars" role="group" data-q="${k}">${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="star" data-v="${i}" aria-label="${i} sur 5">${STAR}</button>`).join("")}</div>`;
  const body = head(c, "Sondage de satisfaction") +
    `<form class="card" data-form novalidate><h1 style="font-size:28px">${esc(o.title)}</h1><p class="mut">${o.first ? esc(o.first) + ", trois" : "Trois"} questions, une minute. Vos réponses aident le club à s’améliorer.</p>
<div class="q"><b>Dans l’ensemble, êtes-vous satisfait ?</b>${st("global")}</div>
${o.coach ? `<div class="q"><b>Et de l’encadrement ?</b>${st("coach")}</div>` : ""}
<div class="q"><b>Reviendriez-vous ?</b><div class="yns"><button type="button" class="yn" data-again="1" aria-pressed="false">Oui</button><button type="button" class="yn" data-again="0" aria-pressed="false">Non</button></div></div>
<label class="f">Un commentaire ? <small>(facultatif)</small><textarea class="in" id="s-text" maxlength="2000" placeholder="Ce qui vous a plu, ce qu’on peut améliorer…"></textarea></label>
<div class="hp" aria-hidden="true"><label>Site<input id="s-site" tabindex="-1" autocomplete="off"></label></div>
<p class="err" data-err role="alert"></p><button class="btn" type="submit" data-go>Envoyer mes réponses</button></form>` + doneBlock("Merci pour vos réponses", `${c.name} les lit avec attention.`);
  const script = JS_CORE + `var A={global:0,coach:0,again:null},TOK=${js(o.token)},COACH=${o.coach ? "true" : "false"};
$$('[data-q]').forEach(function(g){var k=g.getAttribute('data-q');$$('[data-v]',g).forEach(function(b){b.onclick=function(){A[k]=+b.getAttribute('data-v');$$('[data-v]',g).forEach(function(x){x.classList.toggle('on',+x.getAttribute('data-v')<=A[k]);x.setAttribute('aria-pressed',+x.getAttribute('data-v')===A[k])})}})});
$$('[data-again]').forEach(function(b){b.onclick=function(){A.again=b.getAttribute('data-again')==='1';$$('[data-again]').forEach(function(x){x.setAttribute('aria-pressed',x===b)})}});
$('[data-form]').onsubmit=function(e){e.preventDefault();var b=$('[data-go]'),err=$('[data-err]');err.textContent='';
  if(!A.global){err.textContent='Donnez une note à la première question.';return}
  busy(b,true,'Envoi…');send('/api/public/surveys/'+encodeURIComponent(TOK),{global:A.global,coach:COACH?A.coach||undefined:undefined,again:A.again,text:$('#s-text').value.trim(),site:$('#s-site').value,shown:T0}).then(function(){done()},function(x){busy(b,false,'Envoyer mes réponses');err.textContent=x.message})};`;
  return shell({ title: o.title + " · " + c.name, nonce: o.nonce, body, script });
}
