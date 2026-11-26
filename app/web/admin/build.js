/* Assemble la page de l'espace admin : node app/web/admin/build.js
   Lit index.html, admin.css, admin.js (ce dossier) et le logo blanc (brand/stabl/logo), puis écrit
   app/api/src/admin/page.gen.ts (chaînes servies par le Worker sur /admin, jamais dans les assets publics).
   À relancer après chaque modification de la page ; le test admin vérifie que le fichier généré est à jour. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const rd = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const OUT = path.join(ROOT, 'app', 'api', 'src', 'admin', 'page.gen.ts');

function guard(src, label) {
  if (/<\/script/i.test(src)) throw new Error(label + ' contient la chaîne interdite </script>');
  return src;
}
const logo = fs.readFileSync(path.join(ROOT, 'brand', 'stabl', 'logo', 'stabl-logo-blanc.svg'), 'utf8')
  .replace(/<\?xml[^>]*>/, '').replace(/<svg /, '<svg aria-hidden="true" focusable="false" ').trim();

const page = rd('index.html')
  .replace('{{CSS}}', () => rd('admin.css'))
  .replace('{{LOGO}}', () => logo)
  .replace('{{JS}}', () => guard(rd('admin.js'), 'admin.js'));

const mini = (title, body) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f4f8;color:#0a1636;font:16px/1.5 Inter,system-ui,-apple-system,'Segoe UI',sans-serif;padding:16px;box-sizing:border-box}main{text-align:center;max-width:420px}h1{font:800 34px/1.1 'Bricolage Grotesque',system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 8px}p{color:#59627c;margin:0 0 20px}a,button{display:inline-block;background:#0a1636;color:#fff;border:0;border-radius:999px;padding:11px 20px;font:600 15px Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer}</style></head><body><main>${body}</main></body></html>`;

const notFound = mini('Page introuvable · Stabl', '<h1>Page introuvable</h1><p>Cette page n’existe pas ou a été déplacée.</p><a href="/">Revenir à Stabl</a>');
const view = mini('Vue admin en cours · Stabl', '<h1>Vue admin en cours</h1><p>Vous regardez Stabl comme le gérant d’un club, en lecture seule. Quittez la vue pour revenir à l’espace admin.</p>' +
  '<button id="q" type="button">Quitter la vue</button><script>document.getElementById("q").onclick=function(){fetch("/admin/vue/fin",{method:"POST",headers:{"x-requested-with":"piaffe"},credentials:"same-origin"}).then(function(r){return r.json()}).then(function(b){location.href=b.url||"/admin"},function(){location.href="/admin"})}</script>');

const ts = '/* Fichier généré par app/web/admin/build.js : ne pas modifier à la main. */\n' +
  'export const ADMIN_HTML = ' + JSON.stringify(page) + ';\n' +
  'export const NOT_FOUND_HTML = ' + JSON.stringify(notFound) + ';\n' +
  'export const VIEW_HTML = ' + JSON.stringify(view) + ';\n';
fs.writeFileSync(OUT, ts);
console.log('Espace admin : ' + path.relative(ROOT, OUT) + ' (' + Math.round(ts.length / 1024) + ' Ko)');
