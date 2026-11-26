// Le robot sans recette, de bout en bout, sur un navigateur donné (Browser Rendering en ligne, Playwright en essai) :
//   1. connexion : identifiant et mot de passe confiés une fois par le gérant (jamais journalisés), code de vérification
//      demandé au gérant s'il y en a un ; ou bien le gérant s'est connecté lui-même (connexion assistée) ;
//   2. recette du logiciel, si un autre club l'a déjà apprise : rejouée sans rien demander ;
//   3. le robot de la page (ecoute.mjs) écoute ce que le logiciel charge, tourne les pages, refait les dates, pendant que
//      l'explorateur lit les écrans (tableaux, grilles, fiches) et suit les menus du même site ;
//   4. le pilote (facultatif, un modèle Claude) cherche ce qui manque encore ; garde-fous décidés par le code ;
//   5. le tour du menu, page par page (menus JSF ou PHP à pages entières) ;
//   6. tout devient un paquet Stabl ; ce qui a marché devient la recette du logiciel (sans aucune donnée du club).
import { Explorateur } from './explorateur.mjs';
import * as D from './dans-la-page.mjs';
import { scriptRobot } from './ecoute.mjs';
import { tablesDesJeux, classerJeu, adresseDeJeu } from './jeux.mjs';
import { Sites, adressePermise, cheminSur } from './garde-fous.mjs';
import { sur, aller, appuyer, apresClic, ajouterJeux, piloter, rejouerScript } from './pilote.mjs';
import { nettoyerRecette, valeursDuClub } from './recettes.mjs';
import { tablesDeCapture } from '../core/capture.mjs';
import { construirePaquet } from '../core/paquet.mjs';

const dormir = ms => new Promise(r => setTimeout(r, ms));

export const POURQUOI = {
  codes: "L'identifiant ou le mot de passe a été refusé par votre ancien logiciel.",
  bloque: "Le logiciel n'a pas accepté la connexion. Vérifiez l'identifiant (nom d'utilisateur ou e-mail ?).",
  '2fa': 'Le logiciel demande un code de vérification, et nous ne l’avons pas reçu à temps.',
  code: "Le code de vérification n'a pas été accepté.",
  connexion: "La page de connexion n'a pas été trouvée à cette adresse.",
  vide: 'Connecté, mais aucune liste trouvée.',
};

// Ce qu'on cherche selon la famille du logiciel quitté.
export function genresAttendus(famille) {
  return ({
    equestre: ['cavaliers', 'chevaux', 'forfaits', 'reprises', 'factures', 'reglements'],
    adhesions: ['cavaliers', 'forfaits', 'reglements'],
    agenda: ['reprises', 'cavaliers'],
    compta: ['factures', 'reglements', 'fournisseurs', 'comptabilite'],
    rh: ['equipe'],
  })[famille] || ['cavaliers', 'chevaux', 'reprises', 'factures'];
}

async function attendreEtat(page, ok, ms) {
  const fin = Date.now() + ms; let s = null;
  while (Date.now() < fin) { s = await sur(page, D.etatConnexion); if (s && ok(s)) return s; await dormir(400); }
  return s;
}

// Connexion automatique. Les identifiants ne quittent cette fonction que vers la page du logiciel.
export async function seConnecter(page, { adresse, identifiant, motDePasse, demanderCode = null, journal = () => {} }) {
  await page.goto(adresse, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  const hotes = [page.url()];
  let s = await attendreEtat(page, x => x.pass || x.user, 10000);
  if (!s || (!s.pass && !s.user)) { if (await sur(page, D.lienConnexion)) s = await attendreEtat(page, x => x.pass || x.user, 10000); }
  hotes.push(page.url());
  if (!s || (!s.pass && !s.user)) return { ok: false, pourquoi: 'connexion', hotes };
  if (!s.pass) { await sur(page, D.remplirConnexion, { identifiant, motDePasse: '', etape: 'identifiant' }); s = await attendreEtat(page, x => x.pass || x.code || x.refus, 12000); }
  if (s?.pass) { journal('Connexion à votre ancien logiciel…'); await sur(page, D.remplirConnexion, { identifiant, motDePasse, etape: 'mot_de_passe' }); }
  s = await attendreEtat(page, x => !x.pass || x.code || x.refus, 20000);
  if (s?.code) {
    if (!demanderCode) return { ok: false, pourquoi: '2fa', hotes };
    journal('Le logiciel demande un code de vérification.');
    const code = String((await demanderCode()) || '').replace(/\s+/g, '').slice(0, 12);
    if (!code) return { ok: false, pourquoi: '2fa', hotes };
    await sur(page, D.remplirCode, code); await dormir(1200);
    s = await attendreEtat(page, x => (!x.code && !x.pass) || x.refus, 25000);
    if (s && (s.code || s.refus)) return { ok: false, pourquoi: 'code', msg: s.msg || '', hotes };
  }
  if (s && (s.pass || s.refus)) return { ok: false, pourquoi: s.refus ? 'codes' : 'bloque', msg: s.msg || '', hotes };
  await dormir(1500); hotes.push(page.url());
  return { ok: true, hotes };
}

/**
 * Copie depuis une page déjà connectée (par le robot ou par le gérant).
 * o : { logiciel, famille, recette, ia, historiqueJours, surEtat, signal, limiteMs, hotes, pause, fiches, maxPages }
 */
export async function copier(page, o = {}) {
  const t0 = Date.now(), limite = o.limiteMs ?? 12 * 60e3;
  const accueil = page.url();
  const sites = new Sites(accueil); for (const h of o.hotes || []) sites.ajouter(h);
  const trace = [];
  const ctx = { page, sites, accueil, jeux: new Map(), trace, pause: o.pause ?? 1000, tropTard: (marge = 0) => Date.now() - t0 > limite - marge || !!o.signal?.arret };
  const attendus = o.attendus || genresAttendus(o.famille);
  const faits = new Set(), vides = new Set();
  const surEtat = o.surEtat || (() => {});
  const mx = !!(await sur(page, () => !!window.__stablMx));

  const ex = new Explorateur(page, {
    surEtat: e => surEtat({ ...e, jeux: lignesJeux() }), signal: o.signal, fiches: o.fiches ?? true, maxPages: o.maxPages ?? 150, pause: o.pause ?? 700,
    permis: u => adressePermise(u, sites), surPage: async url => { if (mx) await lireMx(); await noterClics(url); },
  });
  // Entrées de menu qui naviguent au clic (lien « # », JSF) : notées page par page, visitées au tour du menu.
  const clics = [];
  async function noterClics(url) {
    const l = await sur(page, D.liensUtiles);
    if (Array.isArray(l)) for (const x of l) if (x.clic && !clics.some(c => c.clic === x.clic)) clics.push({ url, clic: x.clic, lab: x.lab });
  }
  function lignesJeux() { return [...ctx.jeux.values()].reduce((a, x) => a + (x.n || 0), 0); }
  // Le robot de la page lit ce qui vient d'arriver : on attend qu'il ait fini (60 s au plus).
  async function lireMx() {
    if (!mx || ctx.tropTard(10e3)) return [];
    await sur(page, () => { const M = window.__stablMx; if (M && !M.busy) M.run({ maxPages: 60 }); return 1; });
    const t1 = Date.now(); let calme = 0, avant = -1, ici = [];
    while (Date.now() - t1 < 60e3 && !ctx.tropTard(10e3)) {
      await dormir(1200);
      const r = await sur(page, () => { const M = window.__stablMx; return M ? { st: M.st, busy: !!M.busy, jeux: M.collect() } : null; });
      if (!r) { if (Date.now() - t1 > 10e3) break; continue; }
      ici = (r.jeux || []).filter(x => x.n); ajouterJeux(ctx, r.jeux);
      const n = ici.reduce((a, x) => a + x.n, 0);
      if (!r.busy && r.st === 'fini' && n === avant) { if (++calme >= 1) break; } else calme = 0;
      avant = n;
    }
    return ici;
  }
  async function lireIci() {
    const ici = await lireMx();
    const r = await ex.copierListe(cheminSur(page.url()) + ' · ').catch(() => null);
    const parts = ici.map(x => (classerJeu(x).genre || 'liste') + ' ' + x.n);
    if (r?.total) parts.push('écran ' + r.total);
    return parts.join(' + ');
  }
  const present = g => [...ctx.jeux.values()].some(x => x.n && classerJeu(x).genre === g)
    || ex.tables.some(t => t.lignes.length && classerJeu({ key: t.url, label: t.titre, fields: t.entetes }).genre === g);
  const manquants = () => attendus.filter(g => !faits.has(g) && !present(g));

  // 2. recette apprise
  let recetteOk = false;
  const rec = o.recette && (!o.recette.origine || o.recette.origine === new URL(accueil).origin) ? o.recette : null;
  if (rec?.script?.length) recetteOk = await rejouerScript(ctx, rec.script, { lireIci, faits, vides });
  if (rec?.etapes?.length) await ex.rejouer(rec);
  // 3. le robot de la page + l'explorateur (écrans, menus du même site)
  if (mx) { await lireMx(); trace.push(`1er tour : ${lignesJeux()} lignes lues par le robot de la page`); }
  if (!rec?.etapes?.length || ex.incidents.length || !ex.tables.length || manquants().length) {
    if (page.url() !== accueil) await aller(ctx, accueil);
    await ex.explorer();
  }
  // 4. le pilote
  let script = recetteOk ? rec.script : [], questions = 0;
  if (o.ia && manquants().length && !ctx.tropTard(60e3)) {
    surEtat({ progression: 'Le pilote cherche ce qui manque…', jeux: lignesJeux() });
    const p = await piloter(ctx, { ia: o.ia, manquants, lireIci, faits, vides, historiqueJours: o.historiqueJours ?? 730 });
    questions = p.questions; if (p.script.length) script = p.script;
  }
  // 5. le tour du menu (gratuit)
  if (!ctx.tropTard(30e3)) await tourDuMenu(ctx, lireIci, clics, manquants().length > 0);

  // 6. paquet + recette
  // Une même liste lue deux fois (le logiciel en JSON, puis l'écran qui en montre une partie) ne part qu'une fois.
  const api = [...ctx.jeux.values()].filter(x => x.n && x.src === 'api');
  const doublon = (page0, n, genre) => api.some(a => a.page === page0 && a.n >= n && (!genre || classerJeu(a).genre === genre));
  const jeux = [...ctx.jeux.values()].filter(x => x.n && !(x.src === 'ecran' && doublon(x.page, x.n))).map(({ _vus, ...x }) => x);
  ex.tables = ex.tables.filter(t => { let p0 = ''; try { p0 = new URL(t.url).pathname; } catch { /* rien */ } return !doublon(p0, t.lignes.length, classerJeu({ key: t.url, label: t.titre, fields: t.entetes }).genre); });
  const capture = ex.capture(o.logiciel);
  const lu = tablesDesJeux(jeux, o.logiciel || new URL(accueil).hostname);
  // La capture porte aussi les listes lues en JSON (déjà rangées par type) : la passerelle les relit telles quelles.
  if (lu.tables.length) capture.listes = lu.tables;
  const tables = tablesDeCapture(capture);
  const paquet = construirePaquet(tables);
  const recette = nettoyerRecette({ origine: accueil, script, etapes: capture.recette?.etapes || [], lectures: jeux.map(adresseDeJeu).filter(Boolean), genres: attendus.filter(g => present(g) || vides.has(g)) }, { valeursClub: valeursDuClub(jeux, tables) });
  capture.recette = recette;
  const contrat = mx ? await sur(page, () => (window.__stablMx?.contratLu ? window.__stablMx.contratLu() : null)) : null;
  const diagnostic = tables.length ? null : await sur(page, D.diagnosticPage);
  return {
    ok: tables.length > 0, pourquoi: tables.length ? null : 'vide', paquet, capture, recette, incidents: capture.incidents, contrat,
    resume: lu.resume, manquants: manquants(), vides: [...vides], questions, trace: trace.slice(-60), diagnostic,
  };
}

// Menus que l'explorateur ne suit pas : entrées « # » qui naviguent au clic (JSF / PrimeFaces), listes voisines /x/list.xhtml.
async function tourDuMenu(ctx, lireIci, clics, manque) {
  if (ctx.page.url() !== ctx.accueil) await aller(ctx, ctx.accueil);
  const ici = (await sur(ctx.page, D.liensUtiles)) || [];
  for (const x of Array.isArray(ici) ? ici : []) if (x.clic && !clics.some(c => c.clic === x.clic)) clics.push({ url: ctx.accueil, clic: x.clic, lab: x.lab });
  let voisines = [];
  if (manque) { const v = await sur(ctx.page, D.listesVoisines, []); voisines = Array.isArray(v) ? v : []; }
  const tous = [...clics, ...voisines];
  if (tous.length) ctx.trace.push('tour du menu : ' + tous.map(l => l.lab).join(', ').slice(0, 300));
  for (const l of tous) {
    if (ctx.tropTard(25e3)) break;
    try {
      if (l.href) { if (!adressePermise(l.href, ctx.sites)) continue; await aller(ctx, l.href); if (l.devine && !ctx.page.url().includes('/' + l.lab + '/')) continue; }
      else {
        await aller(ctx, l.url || ctx.accueil); const u0 = ctx.page.url();
        if (!(await sur(ctx.page, D.marquerLibelle, l.clic))) { ctx.trace.push(l.lab + ' : introuvable'); continue; }
        if (!(await appuyer(ctx, 'L'))) { ctx.trace.push(l.lab + ' : refusé par les garde-fous'); continue; }
        await apresClic(ctx, u0);
      }
      const m = await lireIci(); ctx.trace.push(`${l.lab} → ${cheminSur(ctx.page.url())} : ${m || 'rien'}`);
    } catch { /* entrée suivante */ }
  }
}

// Tout en un : connexion avec les identifiants confiés, puis copie.
export async function migrerAvecAcces(page, { adresse, identifiant, motDePasse, demanderCode, ajouterScript, historiqueJours = 730, ...o }) {
  if (ajouterScript) await ajouterScript(scriptRobot({ historiqueJours }));
  const c = await seConnecter(page, { adresse, identifiant, motDePasse, demanderCode, journal: m => o.surEtat?.({ progression: m }) });
  if (!c.ok) return { ok: false, pourquoi: c.pourquoi, message: POURQUOI[c.pourquoi] + (c.msg ? ' (' + c.msg + ')' : '') };
  return copier(page, { ...o, historiqueJours, hotes: c.hotes });
}
