// Assemble la version navigateur en un seul fichier : dist/passerelle.html (aucune dépendance, aucun serveur).
import fs from 'node:fs';
import path from 'node:path';
const ici = path.dirname(new URL(import.meta.url).pathname), racine = path.join(ici, '..');
const ordre = ['core/texte.mjs', 'core/csv.mjs', 'core/xlsx.mjs', 'core/valeurs.mjs', 'core/champs.mjs', 'core/logiciels.mjs', 'core/lire.mjs', 'core/paquet.mjs', 'core/rapport.mjs', 'core/vers-api.mjs', 'web/app.mjs'];
let js = 'const __m = {};\n';
for (const f of ordre) {
  let src = fs.readFileSync(path.join(racine, f), 'utf8');
  const noms = [];
  src = src.replace(/^import \* as (\w+) from '(.+?)';$/gm, (_, n, p) => `const ${n} = __m[${JSON.stringify(path.basename(p))}];`);
  src = src.replace(/^import \{([^}]+)\} from '(.+?)';$/gm, (_, n, p) => `const {${n.replace(/ as /g, ': ')}} = __m[${JSON.stringify(path.basename(p))}];`);
  src = src.replace(/^export (async function|function|const|class|let) (\w+)/gm, (_, k, n) => { noms.push(n); return `${k} ${n}`; });
  js += `__m[${JSON.stringify(path.basename(f))}] = (() => {\n${src}\nreturn { ${noms.join(', ')} };\n})();\n`;
}
const exemples = Object.fromEntries(fs.readdirSync(path.join(racine, 'fixtures')).map(n => [n, fs.readFileSync(path.join(racine, 'fixtures', n)).toString('base64')]));
let html = fs.readFileSync(path.join(racine, 'web/index.html'), 'utf8');
html = html.replace('<script type="module" src="app.mjs"></script>', () => `<script>globalThis.EXEMPLES=${JSON.stringify(exemples)}</script>\n<script type="module">\n${js.replace(/<\/script/g, '<\\/script')}\n</script>`);
fs.mkdirSync(path.join(racine, 'dist'), { recursive: true });
fs.writeFileSync(path.join(racine, 'dist/passerelle.html'), html);
console.log('dist/passerelle.html', Math.round(html.length / 1024) + ' Ko');
