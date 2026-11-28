/* Démo des parcours d'inscription : node app/web/demo-onboarding/build.js
   Sortie : app/web/demo-onboarding/dist/index.html (publiée sur stablapp.fr/onboarding/ par tools-pages.sh).
   Même code que le logiciel (demo/core + live/ d'authentification et d'onboarding) + un faux serveur (mock.js). */
const fs = require('fs'), path = require('path');
const HERE = __dirname, WEB = path.join(HERE, '..'), ROOT = path.join(WEB, '..', '..'), DEMO = path.join(ROOT, 'demo');
const rd = (p) => fs.readFileSync(p, 'utf8');
const core = ['brand.js', 'horse.inc.js', 'icons.js', 'data.js', 'engine.js'].filter((f) => fs.existsSync(path.join(DEMO, 'core', f))).map((f) => rd(path.join(DEMO, 'core', f)));
const live = ['00-pre.js', '10-api.js', '15-store.js', '20-data.js', '50-auth.js', '55-migration.js', '60-onboarding.js', '62-bienvenue.js'].map((f) => 'try{\n' + rd(path.join(WEB, 'live', f)) + '\n}catch(e){console.error("' + f + '",e)}');
const css = [path.join(DEMO, 'core', 'tokens.css'), path.join(DEMO, 'core', 'shell.css')].concat(fs.readdirSync(path.join(WEB, 'live')).filter((f) => f.endsWith('.css')).sort().map((f) => path.join(WEB, 'live', f))).concat([path.join(HERE, 'demo.css')]).map(rd).join('\n');
const js = core.join('\n;\n') + '\n;\n' + live.join('\n;\n') + '\n;\n' + rd(path.join(HERE, 'mock.js'));
if (/<\/script/i.test(js)) throw new Error('</script> interdit');
new (require('vm').Script)(js);
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Créer son compte · Stabl</title><meta name="description" content="Démo interactive des parcours d'inscription de Stabl : écurie, adhérent invité, cavalier.">
<meta name="theme-color" content="#0a1636"><link rel="icon" href="../icons/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body class="lv-booting"><div id="lv-root" aria-live="polite"></div>
<script>window.PIAFFE_LIVE={version:"demo-onboarding",probe:false};
${js}
</script></body></html>
`;
fs.mkdirSync(path.join(HERE, 'dist'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'dist', 'index.html'), html);
console.log('OK demo-onboarding/dist/index.html', Math.round(html.length / 1024) + ' Ko');
