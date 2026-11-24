// Lecteur XLSX minimal sans dépendance. Un .xlsx est un zip de fichiers XML.
// `inflate(octets) -> Promise<Uint8Array>` est fourni par l'hôte : zlib sous Node, DecompressionStream dans le navigateur.

export async function lireXLSX(octets, inflate) {
  const zip = lireZip(octets);
  const lire = async nom => {
    const e = zip.get(nom);
    if (!e) return null;
    const brut = e.methode === 0 ? e.donnees : await inflate(e.donnees);
    return new TextDecoder('utf-8').decode(brut);
  };
  const partages = [];
  const ss = await lire('xl/sharedStrings.xml');
  if (ss) for (const si of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    partages.push([...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => xml(m[1])).join(''));
  }
  const classeur = (await lire('xl/workbook.xml')) || '';
  const liens = (await lire('xl/_rels/workbook.xml.rels')) || '';
  const cibles = {};
  for (const r of liens.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = attr(r[0], 'Id'), t = attr(r[0], 'Target');
    if (id && t) cibles[id] = t.replace(/^\/?(xl\/)?/, 'xl/');
  }
  const styles = (await lire('xl/styles.xml')) || '';
  const stylesDate = stylesDeDate(styles);
  const feuilles = [];
  for (const s of classeur.matchAll(/<sheet\b[^>]*>/g)) {
    const nom = xml(attr(s[0], 'name') || 'Feuille');
    const rid = attr(s[0], 'r:id');
    const chemin = cibles[rid] || `xl/worksheets/sheet${feuilles.length + 1}.xml`;
    const x = await lire(chemin);
    if (x) feuilles.push({ nom, lignes: lireFeuille(x, partages, stylesDate) });
  }
  return feuilles;
}

function lireFeuille(x, partages, stylesDate) {
  const lignes = [];
  for (const r of x.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const ligne = [];
    for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = c[1], corps = c[2] || '';
      const ref = attr(a, 'r') || '';
      const col = colonne(ref.replace(/\d+/g, '')) ?? ligne.length;
      const t = attr(a, 't'), s = Number(attr(a, 's') || -1);
      let v = (corps.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      if (t === 's') v = partages[Number(v)];
      else if (t === 'inlineStr') v = [...corps.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => xml(m[1])).join('');
      else if (t === 'b') v = v === '1' ? 'oui' : 'non';
      else if (v !== undefined && stylesDate.has(s)) v = dateExcel(Number(v));
      else if (v !== undefined) v = xml(v);
      ligne[col] = v ?? '';
    }
    for (let i = 0; i < ligne.length; i++) if (ligne[i] === undefined) ligne[i] = '';
    if (ligne.some(v => String(v).trim() !== '')) lignes.push(ligne);
  }
  return lignes;
}

function stylesDeDate(styles) {
  const formatsDate = new Set([14, 15, 16, 17, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
  for (const f of styles.matchAll(/<numFmt\b[^>]*>/g)) {
    const code = (attr(f[0], 'formatCode') || '').toLowerCase().replace(/"[^"]*"|\[[^\]]*\]/g, '');
    if (/[dy]/.test(code) || /m{1,4}[\/\-.]/.test(code)) formatsDate.add(Number(attr(f[0], 'numFmtId')));
  }
  const res = new Set();
  const xfs = (styles.match(/<cellXfs\b[\s\S]*?<\/cellXfs>/) || [''])[0];
  let i = 0;
  for (const xf of xfs.matchAll(/<xf\b[^>]*>/g)) { if (formatsDate.has(Number(attr(xf[0], 'numFmtId')))) res.add(i); i++; }
  return res;
}

export function dateExcel(n) {
  const d = new Date(Math.round((n - 25569) * 86400000));
  return d.toISOString().slice(0, 10);
}

function colonne(lettres) {
  if (!lettres) return null;
  let n = 0;
  for (const ch of lettres) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
function attr(tag, nom) {
  const m = tag.match(new RegExp('\\b' + nom.replace(':', '\\:') + '="([^"]*)"'));
  return m ? m[1] : null;
}
function xml(s) {
  return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
}

// Lecture du répertoire central d'un zip (suffisant pour les fichiers Office).
function lireZip(octets) {
  const b = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let fin = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('Fichier zip illisible');
  const n = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);
  const entrees = new Map();
  for (let k = 0; k < n; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const methode = v.getUint16(p + 10, true), taille = v.getUint32(p + 20, true);
    const ln = v.getUint16(p + 28, true), le = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nom = new TextDecoder().decode(b.subarray(p + 46, p + 46 + ln));
    const debut = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    entrees.set(nom, { methode, donnees: b.subarray(debut, debut + taille) });
    p += 46 + ln + le + lc;
  }
  return entrees;
}
