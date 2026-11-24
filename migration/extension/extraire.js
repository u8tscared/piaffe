// Fonctions injectées dans la page de l'ancien logiciel. Elles LISENT la page et ne modifient rien.
// Elles doivent rester autonomes (aucune variable extérieure) : chrome.scripting les sérialise.

export function extrairePage() {
  const txt = el => (el ? (el.innerText ?? el.textContent ?? '') : '').replace(/\s+/g, ' ').trim();
  const chemin = el => {
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    const p = [];
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (e.id && document.querySelectorAll('#' + CSS.escape(e.id)).length === 1) { p.unshift('#' + CSS.escape(e.id)); break; }
      let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
      p.unshift(e.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
    }
    return p.join(' > ');
  };
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const titreProche = el => {
    const cap = el.querySelector?.('caption'); if (cap && txt(cap)) return txt(cap);
    const lab = el.getAttribute?.('aria-label'); if (lab) return lab;
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,legend,[role=heading]')].filter(h => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    return txt(hs[hs.length - 1]) || txt(document.querySelector('h1')) || document.title;
  };
  const DANGER = /d[ée]connex|logout|sign.?out|supprim|delete|remove|effacer|annul|r[ée]sili|d[ée]sinscri|archiver|payer|valider|envoyer|imprimer|print|export|t[ée]l[ée]charg|download|\.pdf|mailto:|tel:|javascript:/i;
  const out = { url: location.href, titre: document.title, tables: [], fiches: [], suivant: null, liens: [], connexion: false };

  // 1. Tableaux HTML
  for (const t of document.querySelectorAll('table')) {
    if (!visible(t) || t.querySelector('table')) continue;
    const lignes = [...t.rows].map(r => [...r.cells].map(c => txt(c)));
    if (lignes.length < 2) continue;
    const larg = Math.max(...lignes.map(l => l.length));
    if (larg < 2) continue;
    // Tableau « libellé : valeur » sans en-tête = fiche
    const enteteTh = t.tHead ? [...t.tHead.rows].pop() : (t.rows[0] && [...t.rows[0].cells].every(c => c.tagName === 'TH') ? t.rows[0] : null);
    if (!enteteTh && larg === 2 && [...t.rows].every(r => r.cells[0]?.tagName === 'TH' || /:\s*$/.test(txt(r.cells[0])))) {
      out.fiches.push({ titre: titreProche(t), selecteur: chemin(t), champs: Object.fromEntries(lignes.map(l => [l[0].replace(/\s*:\s*$/, ''), l[1] ?? ''])) });
      continue;
    }
    const iE = enteteTh ? [...t.rows].indexOf(enteteTh) : 0;
    const entetes = lignes[iE];
    const corps = lignes.slice(iE + 1).filter(l => l.some(Boolean) && !(t.tFoot && t.tFoot.contains(t.rows[lignes.indexOf(l)])));
    // liens de détail dans les lignes (fiche cavalier, fiche cheval…)
    const details = [...t.tBodies].flatMap(b => [...b.rows]).map(r => r.querySelector('a[href]')).filter(Boolean).map(a => a.href).filter(h => h.startsWith(location.origin) && !DANGER.test(h));
    out.tables.push({ titre: titreProche(t), selecteur: chemin(t), entetes, lignes: corps, details: [...new Set(details)].slice(0, 500) });
  }
  // 2. Grilles ARIA (applications modernes)
  for (const g of document.querySelectorAll('[role=grid],[role=table],[role=treegrid]')) {
    if (g.tagName === 'TABLE' || !visible(g)) continue;
    const rows = [...g.querySelectorAll('[role=row]')].map(r => [...r.querySelectorAll('[role=columnheader],[role=cell],[role=gridcell],[role=rowheader]')].map(c => txt(c)));
    if (rows.length < 2) continue;
    out.tables.push({ titre: titreProche(g), selecteur: chemin(g), entetes: rows[0], lignes: rows.slice(1).filter(l => l.some(Boolean)), details: [] });
  }
  // 3. Fiches : listes de définitions et formulaires remplis (lecture des valeurs seulement)
  for (const dl of document.querySelectorAll('dl')) {
    const champs = {}; let k = null;
    for (const c of dl.children) { if (c.tagName === 'DT') k = txt(c).replace(/\s*:\s*$/, ''); else if (c.tagName === 'DD' && k) champs[k] = txt(c); }
    if (Object.keys(champs).length >= 2) out.fiches.push({ titre: titreProche(dl), selecteur: chemin(dl), champs });
  }
  for (const f of document.querySelectorAll('form')) {
    const champs = {};
    for (const el of f.querySelectorAll('input,select,textarea')) {
      if (/^(hidden|password|submit|button|file|search)$/i.test(el.type)) continue;
      const lab = (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest('label');
      const k = txt(lab) || el.getAttribute('aria-label') || el.placeholder || el.name; if (!k) continue;
      const v = el.tagName === 'SELECT' ? txt(el.selectedOptions[0]) : el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? 'oui' : (el.type === 'checkbox' ? 'non' : undefined)) : el.value;
      if (v !== undefined && v !== '') champs[k.replace(/\s*[:*]\s*$/, '')] = v;
    }
    if (f.querySelector('input[type=password]')) out.connexion = true;
    else if (Object.keys(champs).length >= 3) out.fiches.push({ titre: titreProche(f), selecteur: chemin(f), champs });
  }
  // 4. Bouton « page suivante »
  const SUIV = /^(suivant[e]?|suiv\.?|page suivante|next|›|»|>|→)$/i;
  const cands = [...document.querySelectorAll('a,button,[role=button],[role=link]')].filter(e => visible(e) && !e.disabled && e.getAttribute('aria-disabled') !== 'true' && !/disabled/.test(e.className) &&
    (SUIV.test(txt(e)) || /suivant|next/i.test((e.getAttribute('aria-label') || '') + ' ' + (e.title || '') + ' ' + (e.getAttribute('rel') || ''))));
  if (cands.length) out.suivant = chemin(cands[0]);
  // 5. Liens du menu (même site, sans action dangereuse)
  const zones = document.querySelectorAll('nav,[role=navigation],aside,header,[class*=menu],[class*=sidebar],[class*=nav]');
  const vus = new Set();
  for (const z of zones.length ? zones : [document.body]) for (const a of z.querySelectorAll('a[href]')) {
    const h = a.href.split('#')[0];
    if (!h.startsWith(location.origin) || DANGER.test(h) || DANGER.test(txt(a)) || vus.has(h)) continue;
    vus.add(h); out.liens.push({ href: h, texte: txt(a).slice(0, 60) });
  }
  out.connexion = out.connexion || !!document.querySelector('input[type=password]');
  return out;
}

// Clique sur un élément (le bouton « suivant ») et renvoie une empreinte pour savoir si la page a changé.
export function cliquer(selecteur) {
  const e = document.querySelector(selecteur);
  if (!e) return false;
  e.click();
  return true;
}
export function empreinte() {
  const t = document.querySelector('table tbody tr, [role=row]:nth-of-type(2)');
  return location.href + '|' + (t ? t.textContent.slice(0, 200) : document.body.textContent.length);
}
