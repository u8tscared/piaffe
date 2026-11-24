#!/usr/bin/env node
// Passerelle Piaffe, version ordinateur.
//   node passerelle.mjs chercher [dossier…]          repère les exports et les bases d'un ancien logiciel sur ce poste
//   node passerelle.mjs convertir <fichiers|dossier…> [--sortie dossier]   fabrique le paquet Piaffe + le rapport
// Rien n'est envoyé sur Internet. Les fichiers d'origine ne sont jamais modifiés.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { lireFichier } from '../core/lire.mjs';
import { construirePaquet } from '../core/paquet.mjs';
import { rapportHTML, resumeTexte } from '../core/rapport.mjs';
import { BASES_LOCALES, LOGICIELS } from '../core/logiciels.mjs';
import { decoder } from '../core/texte.mjs';
import { devinerType, ligneEntete } from '../core/champs.mjs';
import { lireCSV } from '../core/csv.mjs';

const inflate = async b => new Uint8Array(zlib.inflateRawSync(b));
const EXT_TABLES = /\.(csv|txt|tsv|xlsx|xlsm|xls|json|ics)$/i;
const [, , commande, ...reste] = process.argv;

const opts = { sortie: null }, cibles = [];
for (let i = 0; i < reste.length; i++) {
  if (reste[i] === '--sortie') opts.sortie = reste[++i];
  else cibles.push(reste[i]);
}

if (commande === 'chercher') await chercher(cibles);
else if (commande === 'convertir') await convertir(cibles);
else if (commande === 'envoyer') { /* plus bas */ }
else {
  console.log(`Passerelle Piaffe : changer de logiciel sans rien ressaisir.

  chercher [dossier…]            repère les exports et les bases d'un ancien logiciel (Kavalog, Equimondo…)
  convertir <fichiers|dossier…>  fabrique paquet-piaffe.json et rapport-migration.html
     --sortie <dossier>          où écrire le résultat (par défaut : le dossier courant)

Tout se passe sur cet ordinateur. Rien n'est envoyé.`);
}

function lister(cible, profondeur = 0, acc = []) {
  let st; try { st = fs.statSync(cible); } catch { return acc; }
  if (st.isFile()) { acc.push(cible); return acc; }
  if (!st.isDirectory() || profondeur > 6) return acc;
  let entrees = []; try { entrees = fs.readdirSync(cible, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    if (e.name.startsWith('.') || /^(node_modules|windows|\$recycle\.bin|appdata|library|system32)$/i.test(e.name)) continue;
    lister(path.join(cible, e.name), profondeur + 1, acc);
  }
  return acc;
}

function dossiersParDefaut() {
  const h = os.homedir();
  const d = ['Documents', 'Desktop', 'Bureau', 'Downloads', 'Téléchargements', 'OneDrive'].map(x => path.join(h, x));
  if (process.platform === 'win32') {
    for (const pf of [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env['ProgramData'], 'C:\\']) {
      if (!pf) continue;
      for (const nom of Object.values(LOGICIELS).map(l => l.nom).concat(['AEXAE'])) d.push(path.join(pf, nom));
    }
  }
  return d.filter(x => fs.existsSync(x));
}

async function chercher(cibles) {
  const racines = cibles.length ? cibles : dossiersParDefaut();
  console.log('Je regarde dans :\n  ' + racines.join('\n  ') + '\n');
  const exports = [], bases = [];
  for (const r of racines) for (const f of lister(r)) {
    const b = BASES_LOCALES.find(x => x.ext.test(f));
    if (b) { bases.push({ f, ...b }); continue; }
    if (!EXT_TABLES.test(f)) continue;
    try {
      const st = fs.statSync(f); if (st.size > 50e6) continue;
      const tables = await lireFichier(path.basename(f), fs.readFileSync(f), { inflate });
      for (const t of tables) {
        if (!t.lignes?.length) continue;
        const h = ligneEntete(t.lignes);
        const [meilleur] = devinerType(t.lignes[h], f);
        if (meilleur.score >= 3) exports.push({ f, feuille: t.feuille, type: meilleur.type, lignes: t.lignes.length - h - 1 });
      }
    } catch { /* fichier illisible : on passe */ }
  }
  if (exports.length) {
    console.log('Fichiers utilisables :');
    for (const e of exports) console.log(`  ${e.f}${e.feuille ? ' › ' + e.feuille : ''}  →  ${e.type} (${e.lignes} lignes)`);
  } else console.log('Aucun export trouvé. Faites un export depuis votre ancien logiciel (voir le guide), puis relancez.');
  if (bases.length) {
    console.log('\nBases de données repérées (lecture seule, avec votre accord) :');
    const parDossier = new Map();
    for (const b of bases) { const k = path.dirname(b.f) + ' — ' + b.moteur; parDossier.set(k, (parDossier.get(k) || 0) + 1); }
    for (const [k, n] of parDossier) console.log(`  ${k} (${n} fichiers)`);
    console.log('  Ces bases ne sont pas encore lues automatiquement par ce prototype : passez par les exports.');
  }
  console.log(`\nPour convertir : node passerelle.mjs convertir ${exports.map(e => JSON.stringify(e.f)).filter((v, i, a) => a.indexOf(v) === i).join(' ') || '<fichiers>'}`);
}

async function convertir(cibles) {
  if (!cibles.length) { console.error('Indiquez au moins un fichier ou un dossier.'); process.exit(1); }
  const fichiers = cibles.flatMap(c => lister(c)).filter(f => EXT_TABLES.test(f));
  const tables = [];
  for (const f of fichiers) {
    const t = await lireFichier(path.basename(f), fs.readFileSync(f), { inflate });
    for (const x of t) { if (x.erreur) console.warn('! ' + x.fichier + ' : ' + x.erreur); else tables.push(x); }
  }
  const paquet = construirePaquet(tables);
  const sortie = opts.sortie || process.cwd();
  fs.mkdirSync(sortie, { recursive: true });
  const fj = path.join(sortie, 'paquet-piaffe.json'), fr = path.join(sortie, 'rapport-migration.html');
  fs.writeFileSync(fj, JSON.stringify(paquet, null, 2));
  fs.writeFileSync(fr, rapportHTML(paquet));
  console.log(resumeTexte(paquet));
  console.log(`\nÉcrit : ${fj}\n       ${fr}`);
}

// ---------- envoi vers Piaffe ----------
async function envoyerCmd(args) {
  const { envoyer, versLots } = await import('../core/vers-api.mjs');
  const o = { essai: true };
  const fichiers = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') o.url = args[++i];
    else if (args[i] === '--cle') o.cle = args[++i];
    else if (args[i] === '--pour-de-vrai') o.essai = false;
    else if (args[i] === '--apercu') o.apercu = true;
    else fichiers.push(args[i]);
  }
  const paquet = JSON.parse(fs.readFileSync(fichiers[0] || 'paquet-piaffe.json', 'utf8'));
  if (o.apercu) { for (const l of versLots(paquet)) console.log(l.coll, l.items.length, JSON.stringify(l.items[0])); return; }
  o.cle = o.cle || process.env.PIAFFE_CLE_API; o.url = o.url || process.env.PIAFFE_URL;
  if (!o.cle || !o.url) { console.error('Il faut --url https://… et --cle pk_live_… (Réglages › Clés d’API, droit « import »).'); process.exit(1); }
  const r = await envoyer(paquet, { ...o, journal: console.log });
  console.log(JSON.stringify(r, null, 2));
  if (o.essai) console.log('\nC’était un essai. Relancez avec --pour-de-vrai pour enregistrer.');
}
if (commande === 'envoyer') await envoyerCmd(reste);
