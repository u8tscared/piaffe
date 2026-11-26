/* Assemble l'application web vendue : node app/web/build.js [--probe]
   Sortie : app/web/dist/ (index.html, manifest, icônes, service worker), servie par le Worker (wrangler.jsonc, assets).

   Ordre d'exécution dans la page :
     1. demo/core : brand.js (s'il existe), horse.inc.js, icons.js, data.js, engine.js
     2. live/00-pre.js : garde-fous posés AVANT les modules (P.mod enveloppé, valeurs sûres, coque sans cadre de démo)
     3. demo/modules/*.js : chaque module est mis en file (PL.modq) et ne s'exécute qu'une fois les vraies
        données du club chargées, pour que leurs valeurs « D.x = D.x || [...] » voient les données réelles
     4. live/*.js (sauf 00-pre et 99-boot) : couche « live » (API, authentification, onboarding, synchro, écrans)
     5. live/99-boot.js : démarrage (GET /api/me, authentification ou onboarding, bootstrap, P.start)

   Le build lit demo/ au moment de l'exécution : l'application profite des changements de design de la démo. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), DEMO = path.join(ROOT, 'demo'), WEB = __dirname, DIST = path.join(WEB, 'dist');
const rd = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => { try { fs.accessSync(p); return true; } catch (e) { return false; } };
const PROBE = process.argv.includes('--probe');

const VERSION = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const coreFiles = ['brand.js', 'horse.inc.js', 'icons.js', 'data.js', 'engine.js'].filter((f) => exists(path.join(DEMO, 'core', f)));
const mods = fs.readdirSync(path.join(DEMO, 'modules')).filter((f) => f.endsWith('.js')).sort();
const liveAll = fs.readdirSync(path.join(WEB, 'live')).filter((f) => f.endsWith('.js')).sort();
const livePre = liveAll.filter((f) => f.startsWith('00-'));
const liveBoot = liveAll.filter((f) => f.startsWith('99-'));
const liveMid = liveAll.filter((f) => !livePre.includes(f) && !liveBoot.includes(f));

function guardScript(src, label) {
  if (/<\/script/i.test(src)) throw new Error(label + ' contient la chaîne interdite </script>');
  return src;
}
const css = ['tokens.css', 'shell.css'].map((f) => rd(path.join(DEMO, 'core', f))).join('\n') +
  '\n' + fs.readdirSync(path.join(WEB, 'live')).filter((f) => f.endsWith('.css')).sort().map((f) => rd(path.join(WEB, 'live', f))).join('\n');

const core = coreFiles.map((f) => '/* ===== demo/core/' + f + ' ===== */\n' + guardScript(rd(path.join(DEMO, 'core', f)), f)).join('\n;\n');
const pre = livePre.map((f) => '/* ===== live/' + f + ' ===== */\n' + guardScript(rd(path.join(WEB, 'live', f)), f)).join('\n;\n');
/* un <script> par module : une erreur de syntaxe dans un module n'arrête pas les autres */
const modScripts = mods.map((f) => '<script>/* ===== demo/modules/' + f + ' ===== */\nPL.modq.push({file:' + JSON.stringify(f) + ',run:function(){\n' +
  guardScript(rd(path.join(DEMO, 'modules', f)), f) + '\n}});\n</script>').join('\n');
const liveScripts = liveMid.concat(liveBoot).map((f) => '<script>/* ===== live/' + f + ' ===== */\ntry{\n' + guardScript(rd(path.join(WEB, 'live', f)), f) +
  '\n}catch(e){console.error("live/' + f + '",e)}\n</script>').join('\n');

/* Catalogue et questions du fil migration (migration/core/*.mjs, JS pur) : modules ES transformés en
   fonctions, exposés sous window.PIAFFE_MIG = {LOGICIELS, FAMILLES, QUESTIONS?, planDeBascule?, LOGOS?}.
   Absents : l'onboarding prend son catalogue de repli. */
const MIG = path.join(ROOT, 'migration');
/* Source : migration/ local ; en attendant la fusion, la version de origin/main si elle est plus complète
   (lecture seule par git show, rien n'est modifié dans le dépôt). --local-mig force le local. */
const migCache = {};
function migRead(rel) {
  if (rel in migCache) return migCache[rel];
  let out = null;
  if (!process.argv.includes('--local-mig')) {
    try { out = require('child_process').execFileSync('git', ['show', 'origin/main:migration/' + rel], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }); } catch (e) { out = null; }
  }
  if (!out && exists(path.join(MIG, rel))) out = fs.readFileSync(path.join(MIG, rel));
  return (migCache[rel] = out);
}
const migHas = (rel) => !!migRead(rel);
function bundleMig() {
  const want = ['logiciels.mjs', 'parcours.mjs', 'logos.mjs'].filter((f) => migHas('core/' + f));
  if (!want.length) return '';
  const done = {}, order = [];
  const visit = (f) => {
    if (done[f] !== undefined) return; done[f] = false;
    const src = migRead('core/' + f).toString('utf8');
    for (const m of src.matchAll(/^\s*import\s+[^;]*?from\s+['"]\.\/([\w.-]+\.mjs)['"]/gm)) if (migHas('core/' + m[1])) visit(m[1]);
    done[f] = true; order.push(f);
  };
  want.forEach(visit);
  const parts = order.map((f) => {
    let src = migRead('core/' + f).toString('utf8');
    const names = [];
    src = src.replace(/^\s*import\s+\{([^}]*)\}\s*from\s+['"]\.\/([\w.-]+\.mjs)['"];?/gm, (_, list, dep) =>
      list.split(',').map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b] = x.split(/\s+as\s+/); return 'const ' + (b || a) + ' = M[' + JSON.stringify(dep) + '].' + a + ';'; }).join(' '));
    src = src.replace(/^\s*import\s+\*\s+as\s+(\w+)\s+from\s+['"]\.\/([\w.-]+\.mjs)['"];?/gm, (_, n, dep) => 'const ' + n + ' = M[' + JSON.stringify(dep) + '];');
    src = src.replace(/^\s*import\s+[^;]*;?$/gm, '');
    src = src.replace(/^export\s+(async\s+function|function\*?|const|let|var|class)\s+([\w$]+)/gm, (_, k, n) => { names.push(n); return k + ' ' + n; });
    src = src.replace(/^export\s+default\s+/gm, () => { names.push('default:__def'); return 'const __def = '; });
    src = src.replace(/^export\s*\{([^}]*)\};?/gm, (_, list) => { list.split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => { const [a, b] = x.split(/\s+as\s+/); names.push(b ? b + ':' + a : a); }); return ''; });
    return 'M[' + JSON.stringify(f) + '] = (function(){\n' + guardScript(src, 'migration/core/' + f) + '\nreturn {' + names.join(',') + '};\n})();';
  });
  return '<script>/* ===== migration/core (' + order.join(', ') + ') ===== */\ntry{(function(){var M={};\n' + parts.join('\n') +
    '\nvar o={};for(var k in M)for(var n in M[k])o[n]=M[k][n];window.PIAFFE_MIG=o;})()}catch(e){console.error("migration/core",e)}\n</script>';
}
const migScript = bundleMig();

const THREE = PROBE && exists(path.join(DEMO, 'tools', 'three.min.js'))
  ? '<script>' + rd(path.join(DEMO, 'tools', 'three.min.js')) + '</script>'
  : '<script src="/vendor/three-r128.min.js" defer></script>'; /* servi par l'appli et gardé hors ligne (écuries sans wifi) */

/* écrans de démarrage iOS (app/web/static/splash, générés depuis le logo officiel) */
let SPLASH = '';
try {
  const list = JSON.parse(rd(path.join(WEB, 'static', 'splash', 'splash.json')));
  SPLASH = list.map((x) => `<link rel="apple-touch-startup-image" media="(device-width: ${x.w}px) and (device-height: ${x.h}px) and (-webkit-device-pixel-ratio: ${x.d}) and (orientation: ${x.land ? 'landscape' : 'portrait'})" href="/splash/${x.name}">`).join('\n');
} catch (e) { SPLASH = ''; }
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Stabl</title>
<meta name="description" content="Stabl, le logiciel de gestion des centres équestres et des écuries.">
<meta name="theme-color" content="#0a1636" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Stabl">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="robots" content="noindex">
<meta name="piaffe-version" content="${VERSION}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/icon-180.png">
${SPLASH}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${css}</style>
${THREE}
</head>
<body class="lv-booting">
<div id="lv-root" aria-live="polite"></div>
<noscript><p style="padding:24px;font:16px system-ui">Stabl a besoin de JavaScript pour fonctionner. Activez-le dans votre navigateur puis rechargez la page.</p></noscript>
<script>window.PIAFFE_LIVE={version:${JSON.stringify(VERSION)},probe:${PROBE}};
${core}
;
${pre}
</script>
${migScript}
${modScripts}
${liveScripts}
<script src="/admin/bandeau.js" defer></script>
</body>
</html>
`;

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html);

/* fichiers statiques : icônes, manifest, service worker */
const STATIC = path.join(WEB, 'static');
if (exists(STATIC)) fs.cpSync(STATIC, DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(DEMO, 'tools', 'three.min.js'), path.join(DIST, 'vendor', 'three-r128.min.js'));
const manifest = {
  name: 'Stabl', short_name: 'Stabl', lang: 'fr', dir: 'ltr',
  description: 'Le logiciel de gestion des centres équestres et des écuries.',
  id: '/', start_url: '/?source=pwa', scope: '/', display: 'standalone', display_override: ['standalone', 'minimal-ui'], orientation: 'any',
  prefer_related_applications: false,
  background_color: '#ffffff', theme_color: '#0a1636', categories: ['business', 'productivity', 'sports'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ],
  shortcuts: [
    { name: 'Planning', url: '/#planning' },
    { name: 'Chevaux', url: '/#chevaux' },
    { name: 'Adhérents', url: '/#adherents' },
  ],
};
fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
/* précache du service worker : la page (tout le code), le manifeste et les icônes. Les écrans de démarrage
   ne sont lus par iOS qu'à l'installation : inutile de les garder hors ligne. */
const PRECACHE = ['/', '/manifest.webmanifest', '/vendor/three-r128.min.js'].concat(fs.readdirSync(DIST).filter((f) => /^icon.*\.(png|svg)$/.test(f)).map((f) => '/' + f));
fs.writeFileSync(path.join(DIST, 'sw.js'), rd(path.join(WEB, 'sw.js')).replace('__VERSION__', VERSION).replace('__PRECACHE__', JSON.stringify(PRECACHE)));
/* passerelle de migration (fil migration) servie sur /migration/ */
/* le robot à distance prend globalThis.PIAFFE_ROBOT comme base d'URL */
const PASS = migRead('dist/passerelle.html');
if (PASS) {
  let ph = PASS.toString('utf8');
  const robot = '<script>globalThis.PIAFFE_ROBOT=location.origin;</script>';
  ph = /<head[^>]*>/i.test(ph) ? ph.replace(/<head[^>]*>/i, (m) => m + robot) : robot + ph;
  fs.mkdirSync(path.join(DIST, 'migration'), { recursive: true }); fs.writeFileSync(path.join(DIST, 'migration', 'index.html'), ph);
}
for (const f of fs.readdirSync(DIST)) if (/^\.|^404\.html$/.test(f)) fs.rmSync(path.join(DIST, f));

/* En-têtes de sécurité des fichiers statiques (servis par Cloudflare sans passer par le Worker) : _headers.
   CSP stricte pour l'appli : seuls les scripts intégrés à cette version (empreintes SHA-256) s'exécutent,
   plus three.js sur cdnjs ; réseau limité au serveur Stabl et aux deux services publics utilisés
   (géocodage api-adresse.data.gouv.fr, météo open-meteo.com). */
const crypto = require('crypto');
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => "'sha256-" + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
const CSP_COMMON = "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https:; media-src 'self' blob:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; " +
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com https://connect.stripe.com https://accounts.google.com; " +
  "connect-src 'self' https://api-adresse.data.gouv.fr https://api.open-meteo.com https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com";
const SEC = ['  Strict-Transport-Security: max-age=31536000; includeSubDomains', '  X-Content-Type-Options: nosniff', '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY', '  Permissions-Policy: camera=(self), microphone=(), geolocation=(self), payment=(), usb=()', '  Cross-Origin-Opener-Policy: same-origin'];
fs.writeFileSync(path.join(DIST, '_headers'), [
  '/*', ...SEC, "  Content-Security-Policy: " + CSP_COMMON + "; script-src 'self' https://cdnjs.cloudflare.com " + hashes.join(' '),
  '/migration/*', '  ! Content-Security-Policy', "  Content-Security-Policy: " + CSP_COMMON + "; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
  '/sw.js', '  Cache-Control: no-cache',
  '/index.html', '  Cache-Control: no-cache',
  '/', '  Cache-Control: no-cache',
  '/splash/*', '  Cache-Control: public, max-age=604800',
  ''].join('\n'));
console.log('OK', 'app/web/dist/index.html', (html.length / 1024).toFixed(0) + ' Ko', coreFiles.length + ' fichiers du socle,', mods.length + ' modules,', liveAll.length + ' scripts live,', migScript ? 'catalogue migration intégré,' : 'sans catalogue migration,', PASS ? 'passerelle /migration/' : 'sans passerelle', PROBE ? '(sonde : three.js local)' : '');
