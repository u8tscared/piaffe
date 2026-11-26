// Fonctions exécutées DANS la page de l'ancien logiciel (page.evaluate). Chacune est autonome : aucune variable
// extérieure, car elle est envoyée au navigateur sous forme de texte. Repères posés sur la page :
// data-sti (élément numéroté pour le pilote), data-stl (liste numérotée). Aucune n'écrit dans le logiciel.

/* où en est la connexion : formulaire, code de vérification, refus */
export function etatConnexion() {
  const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const ins = [...document.querySelectorAll('input')].filter(vis);
  const pass = ins.find(i => i.type === 'password');
  const otp = ins.find(i => i.autocomplete === 'one-time-code' || /otp|2fa|totp|mfa|verification|verif|one.?time/i.test(i.name + ' ' + i.id + ' ' + (i.placeholder || '')) || (i.maxLength === 6 && /numeric/.test(i.inputMode || '')));
  const user = ins.find(i => i.type === 'email' || /e.?mail|user|login|identifiant|username|account|compte|licence/i.test(i.name + ' ' + i.id + ' ' + (i.placeholder || '') + ' ' + (i.autocomplete || '')))
    || ins.find(i => ['text', 'tel', ''].includes(i.type) && i !== otp);
  const body = ((document.body && document.body.innerText) || '').toLowerCase();
  const refus = /(mot de passe|identifiant|e-?mail|password|credentials|identifiants)[^.\n]{0,40}(incorrect|invalide|erron|wrong|invalid|not match)|(incorrect|invalid|wrong)[^.\n]{0,30}(password|credentials|mot de passe)|échec de (la )?connexion|login failed/.test(body);
  const msg = [...document.querySelectorAll('[role=alert], [aria-live], .error, .alert, .toast, .invalid-feedback, .help-block')].map(e => (e.innerText || '').trim()).filter(Boolean).join(' · ').slice(0, 200);
  const cases = ins.filter(i => i.maxLength === 1).length >= 4;
  const texteCode = /code (de )?(v[ée]rification|validation|s[ée]curit[ée]|confirmation)|verification code|security code|code (re[çc]u|envoy[ée])|authentification [àa] deux|two.?factor|double authentification/.test(body) && ins.some(i => ['text', 'tel', 'number', ''].includes(i.type));
  const ecranCourt = ins.length <= 4 && document.querySelectorAll('table tr').length < 3 && document.querySelectorAll('a[href]').length < 30;
  return { pass: !!pass, user: !!user, code: (!!otp || cases || texteCode) && !pass && ecranCourt, refus, msg };
}

/* remplir l'identifiant et le mot de passe, puis envoyer (setter natif + événements pour React / Vue / Angular) */
export function remplirConnexion({ identifiant, motDePasse, etape }) {
  const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const poser = (el, v) => { el.focus(); const p = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); p.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); if (el.blur) el.blur(); };
  const ins = [...document.querySelectorAll('input')].filter(vis);
  const pw = ins.find(i => i.type === 'password');
  const user = ins.find(i => i.type === 'email' || /e.?mail|user|login|identifiant|username|account|compte|licence/i.test(i.name + ' ' + i.id + ' ' + (i.placeholder || '') + ' ' + (i.autocomplete || ''))) || ins.find(i => ['text', 'tel', ''].includes(i.type));
  if (user && user !== pw && (etape === 'identifiant' || !user.value)) poser(user, identifiant);
  if (pw && etape !== 'identifiant') poser(pw, motDePasse);
  const form = (pw || user || {}).form || null;
  const B = [...(form || document).querySelectorAll('button, input[type=submit], [role=button], a')].filter(vis);
  const lab = b => ((b.innerText || b.value || '') + ' ' + (b.getAttribute('aria-label') || '')).trim().toLowerCase();
  const go = B.find(b => b.type === 'submit' && !/google|apple|facebook|microsoft|sso/.test(lab(b)))
    || B.find(b => /^(se connecter|connexion|connecter|login|log in|sign in|accéder|valider|continuer|suivant|next|continue|entrer)\b/.test(lab(b)));
  if (go) { go.click(); return 'clic'; }
  if (form && form.requestSubmit) { form.requestSubmit(); return 'envoi'; }
  const t = pw || user; if (t) { t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); return 'entree'; }
  return 'rien';
}

/* pas de formulaire sur l'accueil : le lien « Se connecter » */
export function lienConnexion() {
  const l = [...document.querySelectorAll('a, button')].find(a => /^(se connecter|connexion|espace (pro|club|gérant|gerant)|login|log in|sign in|mon compte|accès pro|accès club)\b/i.test((a.innerText || '').trim()));
  if (l) { l.click(); return true; } return false;
}

/* taper le code de vérification donné par le gérant, cocher « se souvenir de cet appareil », valider */
export function remplirCode(code) {
  const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const poser = (el, v) => { el.focus(); const p = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); p.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const ins = [...document.querySelectorAll('input')].filter(vis).filter(i => ['text', 'tel', 'number', 'password', ''].includes(i.type));
  const cases = ins.filter(i => i.maxLength === 1);
  let dernier = null;
  if (cases.length >= 4) cases.forEach((c, k) => { poser(c, code[k] || ''); dernier = c; });
  else { dernier = ins.find(i => i.autocomplete === 'one-time-code' || /otp|2fa|totp|mfa|code|verif|token|one.?time/i.test(i.name + ' ' + i.id + ' ' + (i.placeholder || ''))) || ins.find(i => i.type !== 'password') || ins[0]; if (!dernier) return 'rien'; poser(dernier, code); }
  for (const c of document.querySelectorAll('input[type=checkbox]')) { const l = (((c.closest('label') || c.parentElement || {}).innerText) || '') + ' ' + c.name + ' ' + c.id; if (/souvenir|confiance|remember|trust|ne plus demander|don.?t ask/i.test(l) && !c.checked) c.click(); }
  const form = dernier.form || null; const lab = b => ((b.innerText || b.value || '') + ' ' + (b.getAttribute('aria-label') || '')).trim().toLowerCase();
  const B = [...(form || document).querySelectorAll('button, input[type=submit], [role=button]')].filter(vis);
  const go = B.find(b => /^(valider|v[ée]rifier|verify|confirm|continuer|continue|envoyer|submit|suivant|next|se connecter|connexion|login|sign in|ok)\b/.test(lab(b)) && !/renvoyer|resend|annuler|cancel|retour|back/.test(lab(b))) || B.find(b => b.type === 'submit');
  if (go) { go.click(); return 'clic'; }
  if (form && form.requestSubmit) { form.requestSubmit(); return 'envoi'; }
  dernier.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })); return 'entree';
}

/* ce que le pilote voit, comme une personne devant l'écran : ce qu'on peut cliquer, les champs, le texte, les listes */
export function vuePilote() {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const T = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  document.querySelectorAll('[data-sti]').forEach(e => e.removeAttribute('data-sti')); document.querySelectorAll('[data-stl]').forEach(e => e.removeAttribute('data-stl'));
  const els = []; const vus = new Set();
  const marquer = (e, o) => { e.setAttribute('data-sti', String(els.length)); els.push({ i: els.length, ...o }); };
  for (const e of document.querySelectorAll('a, button, [role=menuitem], [role=tab], [role=button], [role=link], [role=treeitem], [onclick], summary, li.ui-menuitem, .nav-item, .menu-item, .ui-button')) {
    if (els.length >= 110) break; if (!vis(e)) continue;
    const plein = T(e); const t = (plein || e.getAttribute('aria-label') || e.getAttribute('title') || '').slice(0, 50); if (!t || plein.length > 70) continue;
    const lien = e.matches('a[href]') ? e : e.querySelector('a[href]');
    let h = ''; const hr = lien ? lien.getAttribute('href') || '' : ''; try { if (hr && !/^(#|javascript:)/i.test(hr)) { const u = new URL(hr, location.href); h = u.origin === location.origin ? (u.pathname + u.search).slice(0, 90) : u.host; } } catch (er) { /* rien */ }
    const k = t.toLowerCase() + '|' + h; if (vus.has(k)) continue; vus.add(k);
    marquer(lien || e, h ? { t, h } : { t });
  }
  const libelle = e => { let l = ''; try { if (e.id) { const lb = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (lb) l = T(lb); } } catch (er) { /* rien */ } if (!l) { const p = e.closest('label'); if (p) l = T(p); } if (!l) { const pv = e.previousElementSibling || (e.parentElement && e.parentElement.previousElementSibling); const tx = pv ? T(pv) : ''; if (tx && tx.length < 40) l = tx; } return (l || e.getAttribute('aria-label') || e.placeholder || e.title || e.name || '').slice(0, 40); };
  for (const e of document.querySelectorAll('input, select, textarea')) {
    if (els.length >= 150) break; if (!vis(e)) continue; const ty = (e.type || '').toLowerCase(); if (['hidden', 'password', 'file', 'submit', 'button', 'image', 'reset'].includes(ty)) continue;
    if (e.closest('tbody tr, [role=row], [contenteditable]')) continue; // un champ dans une ligne de données modifie la donnée : jamais montré
    const o = { t: libelle(e), f: e.tagName === 'SELECT' ? 'select' : ty === 'checkbox' || ty === 'radio' ? 'case' : ty || 'text', v: ty === 'checkbox' || ty === 'radio' ? (e.checked ? 'oui' : 'non') : String(e.value || '').slice(0, 30) };
    if (e.tagName === 'SELECT') { o.v = T(e.options[e.selectedIndex] || e).slice(0, 30); o.o = [...e.options].slice(0, 14).map(x => T(x).slice(0, 24)); }
    marquer(e, o);
  }
  const dansMenu = e => !!e.closest('nav, [role=menu], [role=menubar], [role=navigation], header, footer, .sidebar, .ui-menu, .ui-paginator, [role=tablist], [role=listbox], select, .pagination');
  const feuilles = c => { const out = []; const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode()) && out.length < 14) { const x = n.nodeValue.replace(/\s+/g, ' ').trim(); if (x && n.parentElement && vis(n.parentElement)) out.push(x.slice(0, 60)); } return out; };
  const listes = [];
  for (const t of document.querySelectorAll('table')) {
    if (listes.length >= 6) break; if (!vis(t) || dansMenu(t) || t.querySelector('table')) continue;
    const rows = [...t.rows]; const hr = (t.tHead && t.tHead.rows[0]) || rows.find(r => r.querySelector('th')); const corps = rows.filter(r => r !== hr && !r.closest('thead') && !r.closest('tfoot'));
    const tete = hr ? [...hr.cells].map(c => T(c).slice(0, 24)) : []; if (!hr && corps.length < 2) continue;
    const vide = corps.length === 0 || (corps.length === 1 && corps[0].cells.length === 1);
    t.setAttribute('data-stl', String(listes.length));
    listes.push({ k: listes.length, forme: 'tableau', n: vide ? 0 : corps.length, colonnes: tete, ex: vide ? ['(vide)'] : corps.slice(0, 2).map(r => [...r.cells].map(c => T(c).slice(0, 30)).join(' | ').slice(0, 220)) });
  }
  const cand = [];
  for (const p of document.querySelectorAll('ul, ol, div, section, [role=list], [role=grid]')) {
    const ch = [...p.children]; if (ch.length < 2 || ch.length > 3000) continue; if (!vis(p) || dansMenu(p) || p.closest('[data-stl]') || p.querySelector('[data-stl]')) continue;
    const cnt = {}; for (const c of ch) { const k = c.tagName + '.' + c.className; cnt[k] = (cnt[k] || 0) + 1; } const k0 = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0][0];
    const memes = ch.filter(c => c.tagName + '.' + c.className === k0 && vis(c)); if (memes.length < 2 || memes.length < ch.length * 0.6) continue;
    const lv = feuilles(memes[0]); const len = T(memes[0]).length; if (lv.length < 2 || len < 8 || len > 600) continue;
    cand.push({ p, memes });
  }
  cand.sort((x, y) => y.memes.length - x.memes.length); const gardes = [];
  for (const c of cand) { if (gardes.length >= 6 || listes.length + gardes.length >= 10) break; if (gardes.some(o => o.p.contains(c.p) || c.p.contains(o.p))) continue; gardes.push(c); }
  for (const c of gardes) { c.p.setAttribute('data-stl', String(listes.length)); listes.push({ k: listes.length, forme: 'blocs', n: c.memes.length, colonnes: [], ex: c.memes.slice(0, 2).map(x => feuilles(x).join(' | ').slice(0, 220)) }); }
  const main = document.querySelector('main, #content, [role=main], .content') || document.body;
  return { url: location.href.split('?')[0].slice(0, 160), titre: document.title.slice(0, 80), texte: T(main).slice(0, 900), els, listes };
}

/* prendre une liste (numéro montré au pilote, ou signature quand on rejoue une recette) -> lignes */
export function prendreListe({ k, sig, cols }) {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const T = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  const SECRET = /\b(password|passwd|mot de passe|mdp|iban|token|secret|cvv|carte bancaire)\b/i;
  const uniq = F => { const c = {}; return F.map(f => { c[f] = (c[f] || 0) + 1; return c[f] > 1 ? f + ' ' + c[f] : f; }); };
  let el = null; try { el = k != null && k !== '' ? document.querySelector('[data-stl="' + k + '"]') : null; if (!el && sig) el = document.querySelector(sig); } catch (e) { /* rien */ }
  if (!el) return null;
  const chemin = e => { const parts = []; let x = e; for (let d = 0; x && x.nodeType === 1 && d < 5; d++) { if (x.id && !/\d{4,}/.test(x.id)) { parts.unshift('#' + CSS.escape(x.id)); break; } const c = [...x.classList].filter(n => /^[a-z][\w-]*$/i.test(n) && !/active|hover|focus|selected|open|ng-|css-/.test(n))[0]; parts.unshift(x.tagName.toLowerCase() + (c ? '.' + c : '')); x = x.parentElement; } return parts.join(' > '); };
  const sg = sig || chemin(el); cols = (cols || []).map(c => String(c).slice(0, 40)); let rows = [], fields = [];
  if (el.tagName === 'TABLE') {
    const all = [...el.rows]; const hr = (el.tHead && el.tHead.rows[0]) || all.find(r => r.querySelector('th')); const corps = all.filter(r => r !== hr && !r.closest('thead') && !r.closest('tfoot') && r.cells.length > 1);
    const tete = hr ? [...hr.cells].map(c => T(c).slice(0, 40)) : []; const n = corps[0] ? corps[0].cells.length : 0;
    fields = uniq(Array.from({ length: n }, (_, i) => (cols.length === n && cols[i]) || tete[i] || cols[i] || 'colonne ' + (i + 1)));
    rows = corps.map(r => { const o = {}; [...r.cells].forEach((c, i) => { if (fields[i] && !SECRET.test(fields[i])) o[fields[i]] = T(c).slice(0, 300); }); return o; });
  } else {
    const ch = [...el.children]; const cnt = {}; for (const c of ch) { const key = c.tagName + '.' + c.className; cnt[key] = (cnt[key] || 0) + 1; } const k0 = (Object.entries(cnt).sort((x, y) => y[1] - x[1])[0] || [''])[0];
    const feuilles = c => { const out = []; const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode()) && out.length < 16) { const x = n.nodeValue.replace(/\s+/g, ' ').trim(); if (x && n.parentElement && vis(n.parentElement)) out.push(x.slice(0, 300)); } return out; };
    const cu = uniq(cols); rows = ch.filter(c => c.tagName + '.' + c.className === k0).map(c => { const lv = feuilles(c); const o = {}; lv.forEach((v, i) => { const f = cu[i] || 'colonne ' + (i + 1); if (!SECRET.test(f)) o[f] = v; }); return o; });
    const m = Math.max(0, ...rows.map(r => Object.keys(r).length)); fields = Array.from({ length: m }, (_, i) => cols[i] || 'colonne ' + (i + 1));
  }
  rows = rows.filter(o => Object.values(o).some(v => v)).slice(0, 5000);
  return { sig: sg, fields, rows };
}

/* le bouton « page suivante » d'une liste, numéroté "N" */
export function marquerSuivant() {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const off = e => e.disabled || e.getAttribute('aria-disabled') === 'true' || /disabled/.test(e.className + ' ' + ((e.parentElement || {}).className || ''));
  document.querySelectorAll('[data-sti="N"]').forEach(e => e.removeAttribute('data-sti'));
  const T = e => (e.innerText || e.textContent || '').trim();
  const c = [...document.querySelectorAll(".ui-paginator-next, a[rel=next], [aria-label*='suivant' i], [aria-label*='next' i], [title*='suivant' i], .pagination .next a, li.next a")]
    .concat([...document.querySelectorAll('button, a, [role=button]')].filter(e => /^(suivant|suivante|page suivante|next|next page|›|»|>|→)$/i.test(T(e))));
  const el = c.find(e => vis(e) && !off(e)); if (!el) return false; el.setAttribute('data-sti', 'N'); return true;
}

/* régler un champ de filtre (date, recherche, liste déroulante, case d'affichage) */
export function reglerChamp({ i, valeur }) {
  const e = document.querySelector('[data-sti="' + i + '"]'); if (!e) return false; valeur = String(valeur == null ? '' : valeur);
  if (e.closest('tbody tr, [role=row], [contenteditable]')) return false;
  const lab0 = (((e.closest('label') || {}).innerText) || '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.placeholder || '') + ' ' + (e.name || '') + ' ' + (e.id || '');
  const T = x => (x.innerText || x.textContent || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (e.tagName === 'SELECT') { const o = [...e.options].find(x => T(x) === valeur.toLowerCase() || x.value === valeur) || [...e.options].find(x => T(x).includes(valeur.toLowerCase())); if (!o) return false; e.value = o.value; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; }
  const ty = (e.type || '').toLowerCase();
  if (ty === 'checkbox' || ty === 'radio') {
    let l = lab0; try { if (e.id) { const lb = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (lb) l += ' ' + lb.innerText; } } catch (er) { /* rien */ }
    if (!/tou[st]|toutes|all\b|statut|status|pass[ée]|venir|archiv|filtr|affich|inclu|show|includ|montrer|voir|inactif|ancien/i.test(l)) return false;
    if (e.checked !== /^(oui|true|1|on)$/i.test(valeur)) e.click(); return true;
  }
  if (ty === 'date') { const m = valeur.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (m) valeur = m[3] + '-' + m[2] + '-' + m[1]; }
  e.focus(); const p = Object.getOwnPropertyDescriptor(e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value'); p.set.call(e, valeur);
  e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
  if (ty === 'search' || /search|recherch|filtr|query|\bq\b/i.test(lab0) || (e.form && (e.form.method || 'get').toLowerCase() === 'get')) for (const t of ['keydown', 'keypress', 'keyup']) e.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
  e.blur(); return true;
}

/* retrouver un champ par son libellé (recette rejouée), numéroté "L" */
export function marquerChamp(lab) {
  const T = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  const libelle = e => { let l = ''; try { if (e.id) { const lb = document.querySelector('label[for="' + CSS.escape(e.id) + '"]'); if (lb) l = T(lb); } } catch (er) { /* rien */ } if (!l) { const p = e.closest('label'); if (p) l = T(p); } if (!l) { const pv = e.previousElementSibling || (e.parentElement && e.parentElement.previousElementSibling); const tx = pv ? T(pv) : ''; if (tx && tx.length < 40) l = tx; } return (l || e.getAttribute('aria-label') || e.placeholder || e.title || e.name || '').slice(0, 40); };
  document.querySelectorAll('[data-sti="L"]').forEach(e => e.removeAttribute('data-sti'));
  const el = [...document.querySelectorAll('input, select, textarea')].find(e => e.offsetWidth && !e.closest('tbody tr, [role=row], [contenteditable]') && libelle(e) === lab); if (!el) return false; el.setAttribute('data-sti', 'L'); return true;
}

/* tout ce qui dit ce que fait l'élément numéroté (texte, infobulle, adresse, code du clic) et où il est */
export function boiteElement(i) {
  const e = document.querySelector('[data-sti="' + i + '"]'); if (!e) return null;
  if (e.scrollIntoView) e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect();
  const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const top = document.elementFromPoint(x, y);
  const lien = e.closest('a[href]') || e.querySelector('a[href]') || e; let href = ''; try { const h = lien.getAttribute('href') || ''; if (h && !/^(#|javascript:)/i.test(h)) href = new URL(h, location.href).href; } catch (er) { /* rien */ }
  const f = e.closest('form'); const sub = e.closest('button[type=submit], input[type=submit], button:not([type])');
  const quoi = [(e.innerText || e.value || '').slice(0, 300), e.getAttribute('aria-label') || '', e.getAttribute('title') || '', href.replace(/^https?:\/\/[^/]+/, ''), e.getAttribute('onclick') || '', lien.getAttribute('onclick') || '', (f && f.getAttribute('action')) || ''].join(' ').replace(/\s+/g, ' ');
  return { x, y, dessus: !!top && (top === e || e.contains(top) || top.contains(e)), href, quoi, post: !!(sub && f && (f.method || 'get').toLowerCase() !== 'get'), html: e.outerHTML.replace(/\s+/g, ' ').slice(0, 220) };
}
/* le clic de secours, sans souris */
export function clicSynthetique(i) {
  const e = document.querySelector('[data-sti="' + i + '"]'); if (!e) return false;
  for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) e.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
  e.click(); return true;
}
/* numéroter "L" l'entrée de menu qui porte ce texte */
export function marquerLibelle(lab) {
  const T = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const all = [...document.querySelectorAll('a, [role=menuitem], [onclick], button, li, span')].filter(e => T(e) === lab);
  const el = all.filter(vis).sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0] || all[0];
  if (!el) return false;
  document.querySelectorAll('[data-sti="L"]').forEach(e => e.removeAttribute('data-sti'));
  (el.closest('a, [role=menuitem], button, [onclick]') || el).setAttribute('data-sti', 'L'); return true;
}

/* les entrées de menu de la même adresse qui mènent à des listes du club ; les menus JSF (lien « # » + clic) sont rendus en « clic » */
export function liensUtiles() {
  const VEUT = /cavalier|adherent|adhérent|client|eleve|élève|membre|famille|contact|cheva|equide|équidé|poney|cavalerie|pension|forfait|carte|abonnement|tarif|reprise|cours|planning|agenda|calendrier|seance|séance|reservation|réservation|inscription|facture|avoir|paiement|reglement|règlement|encaissement|licence|soin|veto|véto|marechal|maréchal|vermifuge|vaccin|sante|santé|stock|fourrage|aliment|fournisseur|equipe|équipe|moniteur|salarie|salarié|personnel|compta|ecriture|écriture|journal|grand livre|tva|export|liste|list|historique|rider|member|horse|lesson|booking|invoice|payment|staff|supplier/i;
  const EVITE = /logout|deconnex|déconnex|sign.?out|delete|supprim|remove|password|mot.?de.?passe|aide|help|support|cgu|cgv|legal|mentions|confidential|cookie|profil|parametr|paramètr|reglages|réglages|configuration|abonnement stabl|upgrade|payer|nouveau|nouvelle|ajouter|creer|créer|new|add|edit|modifier/i;
  const out = []; const vus = new Set(); const labs = new Set();
  const T = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  for (const a of document.querySelectorAll('a[href], [role=menuitem], [onclick]')) {
    const t = T(a); if (!t || t.length > 60) continue;
    const lien = a.matches('a[href]') ? a : a.querySelector('a[href]');
    const h = (lien || a).getAttribute('href') || ''; let u = null; try { if (h && !/^(#|javascript:)/i.test(h)) u = new URL(h, location.href); } catch (e) { /* rien */ }
    if (u && (u.origin !== location.origin || !/^https?:$/.test(u.protocol))) continue;
    const lab = (t + ' ' + (u ? u.pathname + ' ' + u.search : '')).toLowerCase();
    if (EVITE.test(lab) || !VEUT.test(lab) || labs.has(t.toLowerCase())) continue;
    if (u) { const k = u.pathname + u.search; if (vus.has(k)) continue; vus.add(k); labs.add(t.toLowerCase()); out.push({ href: u.href, lab: t }); }
    else { labs.add(t.toLowerCase()); out.push({ clic: t, lab: t }); }
  }
  return out.slice(0, 20);
}

/* logiciel à pages entières (JSF, PHP…) qui nomme ses listes /x/list.xhtml : les listes voisines, essayées directement */
export function listesVoisines(vues) {
  const N = ['cavaliers', 'adherents', 'clients', 'chevaux', 'equides', 'pensions', 'forfaits', 'reprises', 'cours', 'planning', 'reservations', 'factures', 'paiements', 'reglements', 'soins', 'stocks', 'fournisseurs', 'equipe'];
  const bases = new Set(); for (const a of document.querySelectorAll('a[href]')) { let u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { continue; }
    const m = u.origin === location.origin && u.pathname.match(/^(.*\/)[a-z-]+\/(list|liste)\.(xhtml|jsf|php|aspx|html?)$/i); if (m) bases.add(m[1] + '|' + m[2] + '.' + m[3]); }
  const out = []; for (const b of bases) { const [base, fichier] = b.split('|'); for (const n of N) { const u = location.origin + base + n + '/' + fichier; if (!(vues || []).includes(u)) out.push({ href: u, lab: n, devine: true }); } }
  return out.slice(0, 24);
}

/* le contenu est dans une grande page incrustée ? son adresse */
export function grandCadre() {
  const W = innerWidth * innerHeight; let best = null, ba = 0;
  for (const f of document.querySelectorAll('iframe')) { const r = f.getBoundingClientRect(); const s = getComputedStyle(f); if (s.display === 'none' || s.visibility === 'hidden') continue; const a = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)); if (a > ba && /^https?:/.test(f.src || '')) { ba = a; best = f.src; } }
  return best && ba > W * 0.3 ? best : '';
}

/* ce que le robot a sous les yeux quand il ne trouve rien (pour comprendre, sans aucune donnée de ligne) */
export function diagnosticPage() {
  const M = window.__stablMx; const t = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return { url: location.pathname.slice(0, 160), titre: document.title.slice(0, 80), robot: M ? M.st : 'absent', lectures: M && M.reqs ? M.reqs.length : -1,
    tableaux: document.querySelectorAll('table').length, lignes: document.querySelectorAll('tr, [role=row]').length, cadres: document.querySelectorAll('iframe').length,
    liens: [...document.querySelectorAll('a[href]')].map(a => t(a)).filter(x => x.length > 2).slice(0, 30) };
}
