// Recettes apprises : ce qui a marché sur un logiciel, rejoué pour le club suivant. Une recette ne contient AUCUNE
// donnée de club : seulement des chemins (sans filtres ni identifiants), des libellés de menu, des en-têtes de colonnes
// et des dates rangées en écart par rapport au jour. Tout pas qui reprend une valeur lue chez le club est retiré.
import { GENRES_PILOTE } from './pilote.mjs';
import { INTERDIT, interdit, ecartDate } from './garde-fous.mjs';
import { cle } from '../core/texte.mjs';

const txt = (v, n) => String(v ?? '').slice(0, n);
const chemin = p => typeof p === 'string' && /^\/[^/]/.test(p) && !INTERDIT.test(p) && !/@|\d{6,}|[0-9a-f]{16,}/i.test(p);

// valeursClub : Set des valeurs lues chez le club (forme cle()), pour retirer tout pas qui en reprend une.
export function valeursDuClub(jeux, tables = []) {
  const s = new Set();
  const add = v => { const k = cle(v); if (k.length >= 3) s.add(k); };
  for (const j of jeux || []) for (const r of (j.rows || []).slice(0, 5000)) for (const v of Object.values(r)) add(v);
  for (const t of tables || []) for (const l of (t.lignes || []).slice(1, 5000)) for (const v of l) add(v);
  return s;
}

export function nettoyerRecette(r, { valeursClub = new Set() } = {}) {
  if (!r) return null;
  const club = v => valeursClub.has(cle(v));
  const G = new Set(GENRES_PILOTE);
  const script = (Array.isArray(r.script) ? r.script : []).slice(0, 40).map(x => {
    if (!x) return null;
    if (x.a === 'accueil') return { a: 'accueil' };
    if (x.a === 'aller' && chemin(String(x.url || '').split('?')[0])) return { a: 'aller', url: txt(String(x.url).split('?')[0], 200) };
    if (x.a === 'clic' && x.t && !interdit(x.t) && !club(x.t)) return { a: 'clic', t: txt(x.t, 60), ...(chemin(String(x.h || '').split('?')[0]) ? { h: txt(String(x.h).split('?')[0], 120) } : {}) };
    if (x.a === 'champ' && x.t && !club(x.t)) {
      const d = x.d || ecartDate(String(x.v ?? ''));
      if (d && Number.isFinite(d.ecart)) return { a: 'champ', t: txt(x.t, 60), d: { ecart: Math.round(d.ecart), f: d.f === 'fr' ? 'fr' : 'iso', fin: txt(d.fin, 20) } };
      const v = String(x.v ?? '');
      // un filtre d'affichage (« Tous », « Actifs et inactifs », « oui »), jamais un nom, un e-mail ou un numéro
      if (v.length <= 24 && !/[@\d]/.test(v) && !club(v)) return { a: 'champ', t: txt(x.t, 60), v };
      return null;
    }
    if (x.a === 'prendre' && x.sig && G.has(x.genre)) return { a: 'prendre', sig: txt(x.sig, 200), genre: x.genre, cols: (x.cols || []).slice(0, 16).map(c => txt(c, 40)).filter(c => !club(c)) };
    if (x.a === 'lecture' && G.has(x.genre) && chemin(x.chemin) && Array.isArray(x.filtres)) {
      const filtres = x.filtres.slice(0, 10).filter(p => p && /^[\w.\-[\]]{1,40}$/.test(p.n || '')).map(p => (p.d && Number.isFinite(p.d.ecart) ? { n: p.n, d: { ecart: Math.round(p.d.ecart), f: p.d.f === 'fr' ? 'fr' : 'iso', fin: txt(p.d.fin, 20) } } : { n: p.n, v: txt(p.v, 40) }))
        .filter(p => p.d || (!club(p.v) && !/@/.test(p.v)));
      return { a: 'lecture', chemin: txt(x.chemin, 120), genre: x.genre, filtres };
    }
    if (x.a === 'vide' && G.has(x.genre)) return { a: 'vide', genre: x.genre };
    return null;
  }).filter(Boolean);
  // étapes de l'explorateur (écrans lus) : chemin sans filtres, titre et en-têtes de colonnes
  const etapes = (Array.isArray(r.etapes) ? r.etapes : []).slice(0, 60).map(e => {
    const c = String(e?.chemin || '').split('?')[0];
    if (!chemin(c) || club(e.titre)) return null;
    return { chemin: txt(c, 200), titre: txt(e.titre, 80), selecteur: txt(e.selecteur, 200), signature: txt(e.signature, 400) };
  }).filter(Boolean);
  const lectures = (Array.isArray(r.lectures) ? r.lectures : []).slice(0, 30).filter(l => l && chemin(l.chemin)).map(l => ({ chemin: txt(l.chemin, 160), liste: txt(l.liste, 80).replace(/[^\w.[\]]/g, ''), genre: G.has(l.genre) ? l.genre : null }));
  const genres = (r.genres || []).filter(g => G.has(g));
  let origine = null; try { origine = new URL(r.origine).origin; } catch { /* rien */ }
  if (!origine || (!script.length && !etapes.length && !lectures.length)) return null;
  return { version: 2, origine, script, etapes, lectures, genres, apprise_le: new Date().toISOString() };
}
