// Point d'entrée commun : un fichier (nom + octets) -> liste de tables.
import { decoder } from './texte.mjs';
import { lireCSV } from './csv.mjs';
import { lireXLSX } from './xlsx.mjs';
import { estCapture, tablesDeCapture } from './capture.mjs';
import { estICS, tableDeICS } from './ics.mjs';

export async function lireFichier(nom, octets, { inflate } = {}) {
  const ext = (nom.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  const b = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  if (ext === 'xlsx' || ext === 'xlsm' || (b[0] === 0x50 && b[1] === 0x4b)) {
    const feuilles = await lireXLSX(b, inflate);
    return feuilles.map(f => ({ fichier: nom, feuille: feuilles.length > 1 ? f.nom : null, lignes: f.lignes }));
  }
  if (ext === 'xls' && b[0] === 0xd0 && b[1] === 0xcf) {
    return [{ fichier: nom, lignes: [], erreur: 'Ancien format Excel (.xls) : ouvrez-le dans Excel ou LibreOffice et enregistrez-le en .xlsx ou .csv.' }];
  }
  const { texte, encodage } = decoder(b);
  if (estCapture(texte)) return tablesDeCapture(JSON.parse(texte), nom);
  if (estICS(texte)) return [{ fichier: nom, lignes: tableDeICS(texte), encodage, type: 'reprises' }];
  if (ext === 'json') return [{ fichier: nom, lignes: [], erreur: 'Fichier JSON qui ne vient pas du robot Stabl : ignoré.' }];
  if (/^\s*<(\?xml|html|table)/i.test(texte) && /<table/i.test(texte)) return [{ fichier: nom, lignes: tableauHTML(texte), encodage }];
  const { lignes, separateur } = lireCSV(texte);
  return [{ fichier: nom, lignes, encodage, separateur }];
}

// Beaucoup de vieux logiciels « exportent en Excel » un tableau HTML renommé en .xls.
function tableauHTML(t) {
  const lignes = [];
  for (const tr of t.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)) {
    lignes.push([...tr[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()));
  }
  return lignes;
}
