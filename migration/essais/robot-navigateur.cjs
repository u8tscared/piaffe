// Essai de bout en bout du robot navigateur sur le faux ancien logiciel.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const { demarrer, journalAcces } = await import(path.join(__dirname, 'ancien-logiciel.mjs'));
  const srv = await demarrer(4799);
  // copie de l'extension avec l'accès à localhost déjà accordé (en vrai, le gérant l'accorde d'un clic)
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'ext-'));
  fs.cpSync(path.join(__dirname, '../extension'), ext, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'))); m.host_permissions = ['http://localhost/*']; fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(m));
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'prof-')), { headless: true, channel: 'chromium', args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`], acceptDownloads: true });
  let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = new URL(sw.url()).host;
  const site = await ctx.newPage();
  await site.goto('http://localhost:4799/cavaliers');
  await site.fill('input[name=u]', 'demo'); await site.fill('input[name=p]', 'demo'); await site.click('button');
  await site.waitForURL('**/accueil');
  const tabId = await sw.evaluate(async () => (await chrome.tabs.query({ url: 'http://localhost/*' }))[0].id);
  const pop = await ctx.newPage();
  await pop.goto(`chrome-extension://${id}/popup.html?onglet=${tabId}`);
  console.log('popup :', (await pop.innerText('.site')).replace(/\n/g, ' | '));
  const t0 = Date.now();
  await pop.click('#explorer');
  for (let i = 0; i < 240; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const e = await sw.evaluate(async () => (await chrome.storage.local.get('etat')).etat);
    if (e && !e.progression && e.journal.some(j => /Exploration terminée|Déconnecté|Connectez/.test(j))) break;
  }
  console.log('durée', Math.round((Date.now() - t0) / 1000) + ' s');
  await pop.screenshot({ path: '/tmp/claude-0/popup.png' });
  const etat = await sw.evaluate(async () => (await chrome.storage.local.get(['etat', 'recettes'])));
  console.log('journal :\n  ' + etat.etat.journal.join('\n  '));
  console.log('tables :', etat.etat.tables.map(t => `${t.titre}=${t.lignes.length}`).join(', '), '| fiches', etat.etat.fiches.length);
  console.log('recette :', Object.values(etat.recettes)[0]?.etapes.map(s => s.chemin).join(' '));
  const [dl] = await Promise.all([pop.waitForEvent('download'), pop.click('#telecharger')]);
  const out = '/tmp/claude-0/capture-piaffe.json'; await dl.saveAs(out);
  console.log('pages dangereuses visitées :', journalAcces.filter(a => /supprim|deconnexion/.test(a)));
  // rejouer le chemin appris après changement d'écran ? (on le teste en vidant puis rejouant)
  await pop.click('#vider'); await pop.reload();
  await pop.click('#rejouer');
  for (let i = 0; i < 120; i++) { await new Promise(r => setTimeout(r, 1000)); const e = await sw.evaluate(async () => (await chrome.storage.local.get('etat')).etat); if (e && !e.progression && e.journal.some(j => /Chemin connu terminé/.test(j))) { console.log('rejeu :', e.tables.map(t => `${t.titre}=${t.lignes.length}`).join(', '), 'incidents', e.incidents.length); break; } }
  await ctx.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
