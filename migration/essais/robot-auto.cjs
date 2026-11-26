// Essai de bout en bout du robot SANS recette, connexion automatique comprise.
//   node migration/essais/robot-auto.cjs
// Démarre le faux ancien logiciel, puis, dans un vrai navigateur (Playwright) :
//   1. compte « a2f » : identifiant + mot de passe confiés, code de vérification demandé puis tapé par le robot ;
//      le robot récupère tout (tableaux paginés, grille, factures paginées en JavaScript, listes JSON paginées,
//      reprises chargées semaine par semaine sur 24 mois, menu JSF) sans jamais ouvrir une page dangereuse ;
//   2. la recette apprise ne contient aucune donnée du club, et rejouée sur une nouvelle session elle suffit ;
//   3. compte « refus » : l'identifiant refusé est signalé simplement ;
//   4. un faux pilote qui demande des clics dangereux : le code refuse, rien n'est supprimé ni déconnecté.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 4797, BASE = `http://localhost:${PORT}`;
const attendre = ms => new Promise(r => setTimeout(r, ms));
const MDP = 'mot-de-passe-qui-ne-doit-pas-fuiter';

function adapter(p) {
  return {
    goto: (u, o) => p.goto(u, o), url: () => p.url(), evaluate: (fn, arg) => p.evaluate(fn, arg),
    mouse: { click: (x, y) => p.mouse.click(x, y), wheel: o => p.mouse.wheel(o.deltaX || 0, o.deltaY || 0) },
    keyboard: { type: t => p.keyboard.type(t), press: k => p.keyboard.press(k) },
  };
}

(async () => {
  const ancien = spawn(process.execPath, [path.join(__dirname, 'ancien-logiciel.mjs'), String(PORT)], { env: { ...process.env, JOURNAL_ACCES: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let journal = ''; ancien.stdout.on('data', d => journal += d); ancien.stderr.on('data', d => journal += d);
  await attendre(800);
  const { migrerAvecAcces } = await import('../robot/entree.mjs');
  const nav = await chromium.launch();
  const ok = [], ko = [];
  const verifier = (c, m) => (c ? ok : ko).push(m);
  const session = async () => {
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR' });
    const p = await ctx.newPage();
    p.on('pageerror', e => ko.push('Erreur JS dans la page : ' + e.message));
    return { ctx, p, page: adapter(p), ajouterScript: s => p.addInitScript(s) };
  };
  try {
    // 1. connexion automatique avec code de vérification
    const s1 = await session(); let codeDemande = 0;
    const t0 = Date.now();
    const r = await migrerAvecAcces(s1.page, {
      adresse: BASE + '/', identifiant: 'a2f', motDePasse: MDP, ajouterScript: s1.ajouterScript, pause: 300, fiches: false,
      demanderCode: async () => { codeDemande++; return '246 810'; }, limiteMs: 6 * 60e3,
    });
    console.log('  durée', Math.round((Date.now() - t0) / 1000), 's');
    verifier(r.ok, 'copie réussie (' + (r.message || 'ok') + ')');
    verifier(codeDemande === 1, 'code de vérification demandé une fois au gérant');
    const c = r.paquet?.controle || {};
    console.log('  contrôle :', JSON.stringify(c));
    if (process.env.ROBOT_DETAIL) require('node:fs').writeFileSync(process.env.ROBOT_DETAIL, JSON.stringify(r, null, 1));
    console.log('  par type :', (r.resume || []).map(x => x.genre + ' ' + x.lignes).join(', '));
    verifier(c.personnes >= 62, `cavaliers repris (${c.personnes})`);
    verifier(c.chevaux >= 12, `chevaux repris (${c.chevaux})`);
    verifier((r.paquet.factures || []).length >= 34, `factures reprises, toutes les pages (${(r.paquet.factures || []).length})`);
    const soins = (r.resume || []).find(x => x.genre === 'soins');
    verifier(soins?.lignes === 27, `soins lus en JSON, pages suivantes comprises (${soins?.lignes})`);
    const pensions = (r.resume || []).find(x => x.genre === 'pensions');
    verifier(pensions?.lignes === 14, `pensions lues en JSON, par décalage (${pensions?.lignes})`);
    const rep = (r.resume || []).filter(x => x.genre === 'reprises').reduce((a, x) => a + x.lignes, 0);
    verifier(rep >= 60, `reprises redemandées de 24 mois en arrière à 12 mois devant (${rep})`);
    verifier(c.soins === 27, `soins rangés sur les chevaux dans le paquet (${c.soins})`);
    verifier(c.reprises >= 8, `créneaux du planning dans le paquet (${c.reprises})`);
    verifier((r.paquet.chevaux || []).filter(x => x.pension).length >= 10, 'formule de pension posée sur les chevaux');
    verifier((r.paquet.stocks || []).length === 4, `stocks lus dans le menu JSF (${(r.paquet.stocks || []).length})`);
    verifier((r.paquet.fournisseurs || []).length >= 2, `fournisseurs lus dans le menu JSF (${(r.paquet.fournisseurs || []).length})`);
    verifier(!/supprimer|deconnexion|PURGE/.test(journal), 'aucune page dangereuse ouverte, « Vider la corbeille » jamais cliqué');
    verifier(!JSON.stringify(r).includes(MDP), 'mot de passe absent du résultat');
    const rec = JSON.stringify(r.recette || {});
    verifier(!!r.recette && r.recette.etapes.length > 3, 'recette apprise');
    verifier(!/Vanille|MARTIN|cavalier\d+@|F-50|Dr Morel|246810|a2f/.test(rec), 'la recette ne contient aucune donnée du club');
    await s1.ctx.close();

    // 2. la recette rejouée pour une nouvelle session
    const s2 = await session();
    const r2 = await migrerAvecAcces(s2.page, { adresse: BASE + '/', identifiant: 'demo', motDePasse: MDP, ajouterScript: s2.ajouterScript, pause: 300, fiches: false, recette: r.recette, limiteMs: 5 * 60e3 });
    verifier(r2.ok && r2.paquet.controle.personnes >= 62 && r2.paquet.controle.chevaux >= 12, 'recette rejouée : même résultat');
    await s2.ctx.close();

    // 3. identifiant refusé
    const s3 = await session();
    const r3 = await migrerAvecAcces(s3.page, { adresse: BASE + '/', identifiant: 'refus', motDePasse: MDP, ajouterScript: s3.ajouterScript });
    verifier(!r3.ok && r3.pourquoi === 'codes' && /refusé/.test(r3.message), 'identifiant refusé : message simple');
    await s3.ctx.close();

    // 4. un pilote qui demande des clics dangereux : refusés par le code
    const avant = journal.length;
    const s4 = await session(); const vus = [];
    const ia = async vue => {
      vus.push(vue);
      const i = vue.page.els.findIndex(e => /Supprimer toutes|Déconnexion/.test(e.t));
      if (vus.length <= 2 && i >= 0) return { action: 'click', i, value: '', k: 0, kind: '', cols: [], more: false, url: '', params: [], why: 'essai' };
      if (vus.length === 3) return { action: 'goto', i: 0, value: '', k: 0, kind: '', cols: [], more: false, url: '/parametres/supprimer-tout', params: [], why: 'essai' };
      return { action: 'stop', i: 0, value: '', k: 0, kind: '', cols: [], more: false, url: '', params: [], why: 'fin' };
    };
    const r4 = await migrerAvecAcces(s4.page, { adresse: BASE + '/', identifiant: 'demo', motDePasse: MDP, ajouterScript: s4.ajouterScript, ia, attendus: ['cavaliers', 'licences'], pause: 200, fiches: false, maxPages: 3, limiteMs: 3 * 60e3 });
    verifier(vus.length >= 3, `pilote consulté (${vus.length} fois)`);
    verifier(!/supprimer|deconnexion/.test(journal.slice(avant)), 'clics et adresses dangereux du pilote refusés par le code');
    verifier(r4.ok, 'la copie continue malgré le pilote');
    await s4.ctx.close();
  } catch (err) { ko.push('Échec : ' + (err.stack || err.message)); }
  finally { await nav.close(); ancien.kill(); }
  for (const m of ok) console.log('  ✓', m);
  for (const m of ko) console.log('  ✗', m);
  console.log(ko.length ? `${ko.length} contrôle(s) en échec.` : `${ok.length} contrôles réussis (robot sans recette).`);
  process.exit(ko.length ? 1 : 0);
})();
