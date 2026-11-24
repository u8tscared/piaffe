const { chromium } = require('playwright');
// node migration/test/parcours.playwright.cjs [dossier-captures] : parcours complet (clair, sombre, 390 px) et mode intégré ?source=kavalog.
const url = 'file://' + require('path').join(__dirname, '../dist/passerelle.html');
const S = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch();
  for (const [nom, opts] of [['clair', { viewport: { width: 1100, height: 900 } }], ['sombre', { viewport: { width: 1100, height: 900 }, colorScheme: 'dark' }], ['mobile', { viewport: { width: 390, height: 844 } }]]) {
    const pg = await b.newPage(opts); const err = [];
    pg.on('pageerror', e => err.push(e.message)); pg.on('console', m => m.type() === 'error' && err.push(m.text()));
    await pg.goto(url); await pg.waitForTimeout(400);
    const scroll = async () => pg.evaluate(() => document.documentElement.scrollWidth);
    const shot = async n => { await pg.waitForTimeout(900); await pg.screenshot({ path: `${S}/${nom}-${n}.png`, fullPage: true }); };
    const sw = [];
    await shot('1-depart'); sw.push(await scroll());
    await pg.click('[data-depart=oui]'); await pg.waitForSelector('[data-ecran=principal]:not([hidden])');
    const nPrinc = await pg.locator('#catalogue .carte-l').count();
    await shot('2-principal'); sw.push(await scroll());
    await pg.click('#catalogue [data-l=kavalog]'); await pg.waitForSelector('[data-ecran=outils]:not([hidden])');
    for (const id of ['pennylane', 'sumup', 'helloasso', 'google-agenda', 'ffe']) await pg.click(`#outils [data-l="${id}"]`);
    await shot('3-outils'); sw.push(await scroll());
    await pg.click('#continuer'); await pg.waitForSelector('[data-ecran=choix]:not([hidden])');
    const effetH1 = await pg.textContent('#effet-helloasso');
    await pg.click('[data-id=helloasso][data-d=changer]'); await pg.waitForTimeout(300);
    const effetH2 = await pg.textContent('#effet-helloasso');
    const segFfe = await pg.locator('[data-id=ffe]').count();
    await shot('4-choix'); sw.push(await scroll());
    await pg.click('#continuer'); await pg.waitForSelector('[data-ecran=plan]:not([hidden])');
    const plan = await pg.evaluate(() => [...document.querySelectorAll('.col')].map(c => [...c.querySelectorAll('li b')].map(b => b.textContent)));
    await shot('5-plan'); sw.push(await scroll());
    await pg.click('[data-lettre=kavalog]'); await pg.fill('[name=club]', 'Écurie test'); await pg.click('#resiliation button'); const lettre = (await pg.inputValue('#lettre')).length;
    await pg.click('#continuer'); await pg.waitForSelector('[data-ecran=recuperation]:not([hidden])');
    const modes = await pg.locator('.mode h3').allTextContents();
    await pg.click('#ouvrir-robot'); await pg.waitForTimeout(500);
    const robot = await pg.textContent('[data-ecran=recuperation]').then(t => /bientôt/i.test(t));
    await pg.click('#exemple'); await pg.waitForSelector('#etape-resultat:not([hidden])');
    const cav = await pg.textContent('#tuiles .t .big');
    await shot('6-recup'); sw.push(await scroll());
    console.log(nom, JSON.stringify({ nPrinc, effetH1, effetH2, segFfe, plan, lettre, modes, robot, cav, sw, err }));
    await pg.close();
  }
  // Mode intégré
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); const err = [];
  pg.on('pageerror', e => err.push(e.message));
  await pg.goto(url + '?source=kavalog&adresse=https%3A%2F%2Fapp.kavalog.com&outils=google-agenda,calendly&retour=%2Fonboarding');
  await pg.waitForTimeout(800);
  const r = await pg.evaluate(() => ({ ecran: [...document.querySelectorAll('.ecran')].find(e => !e.hidden).dataset.ecran, titre: document.querySelector('#guide-titre').textContent,
    hero: getComputedStyle(document.querySelector('.hero')).display, importer: !document.querySelector('#importer-zone').hidden, resil: [...document.querySelectorAll('#resil-integre li b')].map(b => b.textContent), adr: document.querySelector('#ouvrir-robot')?.dataset.adresse, sw: document.documentElement.scrollWidth }));
  await pg.screenshot({ path: `${S}/integre.png`, fullPage: true });
  console.log('integre', JSON.stringify({ ...r, err }));
  await b.close();
})();
