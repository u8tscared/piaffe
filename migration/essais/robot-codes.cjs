// Essai de bout en bout de « Donnez-nous vos codes » dans la passerelle (robot local) :
//   node migration/essais/robot-codes.cjs [dossier-captures]
// Le gérant confie identifiant + mot de passe ; le robot se connecte seul au faux ancien logiciel (compte « a2f »),
// la page lui demande le code de vérification, puis la copie arrive dans la passerelle.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const attendre = ms => new Promise(r => setTimeout(r, ms));
const MDP = 'mot-de-passe-qui-ne-doit-pas-fuiter';
function lancer(fichier, args = [], env = {}) {
  const p = spawn(process.execPath, [path.join(__dirname, fichier), ...args], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.journal = ''; p.stdout.on('data', d => p.journal += d); p.stderr.on('data', d => p.journal += d);
  return p;
}

(async () => {
  const captures = process.argv[2] || null;
  const ancien = lancer('ancien-logiciel.mjs', ['4796'], { JOURNAL_ACCES: '1' });
  const robot = lancer('../robot/serveur-local.mjs', [], { PIAFFE_ROBOT_LOCAL: '1', PORT: '4795' });
  await attendre(1500);
  const nav = await chromium.launch();
  const ok = [], ko = [], erreurs = [];
  const verifier = (c, m) => (c ? ok : ko).push(m);
  try {
    const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    await page.goto('http://localhost:4795/');
    await page.waitForFunction(() => globalThis.PiaffeRobot?.disponible(), null, { timeout: 15000 });
    await page.evaluate(({ MDP }) => {
      const z = document.createElement('div'); z.id = 'zone-codes'; document.body.prepend(z);
      window.__capture = null;
      window.addEventListener('piaffe:capture', async e => { window.__capture = JSON.parse(await e.detail.fichier.text()); });
      PiaffeRobot.ouvrir('http://localhost:4796/', { nom: 'Ancien logiciel', cible: z, acces: { identifiant: 'a2f', mot_de_passe: MDP } });
    }, { MDP });
    await page.waitForSelector('.rd-code:not([hidden]) input', { timeout: 60000 });
    verifier(true, 'la page demande le code de vérification');
    if (captures) await page.screenshot({ path: path.join(captures, 'robot-code.png') });
    await page.fill('.rd-code input', '246810');
    await page.click('.rd-code button');
    await page.waitForFunction(() => document.querySelector('.rd')?.dataset.phase === 'copie', null, { timeout: 60000 });
    verifier(true, 'connecté, copie démarrée');
    if (captures) await page.screenshot({ path: path.join(captures, 'robot-copie.png') });
    await page.waitForFunction(() => window.__capture, null, { timeout: 480000 });
    const c = await page.evaluate(() => window.__capture);
    const lignes = (c.tables || []).reduce((a, t) => a + t.lignes.length, 0) + (c.listes || []).reduce((a, t) => a + t.lignes.length - 1, 0);
    verifier(lignes >= 108 + 27 + 14, `capture complète (${lignes} lignes, dont ${(c.listes || []).length} listes JSON)`);
    verifier(!JSON.stringify(c).includes(MDP) && !robot.journal.includes(MDP) && !ancien.journal.includes(MDP), 'mot de passe absent de la capture et des journaux');
    verifier(!/supprimer|deconnexion|PURGE/.test(ancien.journal), 'aucune page dangereuse ouverte');
    verifier(!erreurs.length, 'aucune erreur dans la console' + (erreurs.length ? ' : ' + erreurs.join(' | ') : ''));
  } catch (err) { ko.push('Échec : ' + err.message + (erreurs.length ? ' / erreurs : ' + erreurs.join(' | ') : '')); }
  finally { await nav.close(); ancien.kill(); robot.kill(); }
  for (const m of ok) console.log('  ✓', m);
  for (const m of ko) console.log('  ✗', m);
  if (ko.length) { console.log('--- journal robot ---\n' + robot.journal.slice(-1500)); process.exit(1); }
})();
