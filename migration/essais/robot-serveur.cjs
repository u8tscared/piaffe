// Essai de bout en bout du robot sans installation.
//   node migration/essais/robot-serveur.cjs
// Démarre le faux ancien logiciel (4799) et le robot local (4800), ouvre la passerelle dans un navigateur
// « gérant », se connecte à travers la vue en direct (clic, Tab, saisie, Entrée), attend la copie
// automatique et vérifie la capture reçue par la page.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const ici = __dirname;
const attendre = ms => new Promise(r => setTimeout(r, ms));
function lancer(fichier, env = {}) {
  const p = spawn(process.execPath, [path.join(ici, fichier)], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  p.journal = ''; p.stdout.on('data', d => p.journal += d); p.stderr.on('data', d => p.journal += d);
  return p;
}

(async () => {
  const ancien = lancer('ancien-logiciel.mjs', { JOURNAL_ACCES: '1' });
  const robot = lancer('../robot/serveur-local.mjs', { PIAFFE_ROBOT_LOCAL: '1' });
  await attendre(1500);
  const nav = await chromium.launch();
  const ok = [], ko = [];
  const verifier = (cond, msg) => (cond ? ok : ko).push(msg);
  try {
    const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => ko.push('Erreur JS : ' + e.message));
    await page.goto('http://localhost:4800/');
    verifier(await page.evaluate(() => !!globalThis.PiaffeRobot?.disponible()), 'PiaffeRobot disponible');
    await page.evaluate(() => {
      let z = document.getElementById('robot-distant');
      if (!z) { z = document.createElement('div'); z.id = 'robot-distant'; document.body.prepend(z); }
      window.__capture = null;
      window.addEventListener('piaffe:capture', async e => { window.__capture = JSON.parse(await e.detail.fichier.text()); });
      PiaffeRobot.ouvrir('http://localhost:4799/', { nom: 'Ancien logiciel' });
    });
    await page.waitForSelector('.rd-ecran img[src^="data:image/jpeg"]', { timeout: 15000 });
    verifier(true, 'image de l’écran distant reçue');
    const ecran = page.locator('.rd-ecran');
    await ecran.click({ position: { x: 600, y: 300 } });      // donne le focus à la page distante
    const touche = k => page.keyboard.press(k);
    await touche('Tab'); await page.keyboard.type('demo'); await attendre(200);
    await touche('Tab'); await page.keyboard.type('secret-qui-ne-doit-pas-fuiter'); await attendre(200);
    await touche('Enter');
    await page.waitForFunction(() => document.querySelector('.rd')?.dataset.phase === 'copie', null, { timeout: 15000 });
    verifier(true, 'copie démarrée toute seule après la connexion');
    const suivi = setInterval(async () => console.log('  …', await page.evaluate(() => document.querySelector('.rd-titre')?.textContent + ' | ' + document.querySelector('.rd-voile')?.textContent).catch(() => '')), 5000);
    await page.waitForFunction(() => window.__capture, null, { timeout: 240000 }).finally(() => clearInterval(suivi));
    const c = await page.evaluate(() => window.__capture);
    const noms = (c.tables || []).map(t => `${t.titre}:${t.lignes.length}`);
    console.log('Tables capturées :', noms.join(', '), '· fiches :', (c.fiches || []).length);
    const total = (c.tables || []).reduce((a, t) => a + t.lignes.length, 0);
    verifier(total >= 62 + 12 + 34, `au moins 108 lignes copiées (${total})`);
    verifier(/ACCES GET \/cavaliers/.test(ancien.journal), 'journal d’accès lu'); verifier(!/supprimer-tout|deconnexion/.test(ancien.journal), 'aucune page dangereuse visitée');
    verifier(!/secret-qui-ne-doit-pas-fuiter/.test(robot.journal + ancien.journal), 'mot de passe jamais journalisé');
    verifier(!/secret-qui-ne-doit-pas-fuiter/.test(JSON.stringify(c)), 'mot de passe absent de la capture');
  } catch (err) { ko.push('Échec : ' + err.message); }
  finally {
    await nav.close(); ancien.kill(); robot.kill();
  }
  for (const m of ok) console.log('  ✓', m);
  for (const m of ko) console.log('  ✗', m);
  if (ko.length) { console.log('--- journal robot ---\n' + robot.journal.slice(-2000)); process.exit(1); }
})();
