// Décodage des fichiers texte exportés par les anciens logiciels.
// Les logiciels Windows exportent souvent en Windows-1252 (ANSI), parfois en UTF-16 (Excel « texte Unicode »).

export function decoder(octets) {
  const b = octets instanceof Uint8Array ? octets : new Uint8Array(octets);
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return { texte: new TextDecoder('utf-8').decode(b.subarray(3)), encodage: 'utf-8' };
  if (b[0] === 0xff && b[1] === 0xfe) return { texte: new TextDecoder('utf-16le').decode(b.subarray(2)), encodage: 'utf-16le' };
  if (b[0] === 0xfe && b[1] === 0xff) return { texte: new TextDecoder('utf-16be').decode(b.subarray(2)), encodage: 'utf-16be' };
  try {
    return { texte: new TextDecoder('utf-8', { fatal: true }).decode(b), encodage: 'utf-8' };
  } catch {
    return { texte: new TextDecoder('windows-1252').decode(b), encodage: 'windows-1252' };
  }
}

// Forme comparable d'un libellé : minuscules, sans accents, sans ponctuation.
export function cle(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/n°|no\b|num\b/g, 'numero')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

export function vide(v) {
  return v === undefined || v === null || String(v).trim() === '' || /^(null|n\/a|-+|\.)$/i.test(String(v).trim());
}
