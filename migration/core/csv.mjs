// Lecture CSV tolérante : séparateur deviné (; , tabulation |), guillemets RFC 4180, fins de ligne mixtes.

const SEPARATEURS = [';', ',', '\t', '|'];

export function devinerSeparateur(texte) {
  const lignes = texte.split(/\r?\n/).filter(l => l.trim()).slice(0, 20);
  let meilleur = ';', score = -1;
  for (const s of SEPARATEURS) {
    const n = lignes.map(l => compterHorsGuillemets(l, s));
    if (!n.length || n[0] === 0) continue;
    const reguliers = n.filter(x => x === n[0]).length;
    const sc = reguliers * 100 + n[0];
    if (sc > score) { score = sc; meilleur = s; }
  }
  return meilleur;
}

function compterHorsGuillemets(l, s) {
  let n = 0, q = false;
  for (const c of l) { if (c === '"') q = !q; else if (c === s && !q) n++; }
  return n;
}

export function lireCSV(texte, sep = devinerSeparateur(texte)) {
  const lignes = [];
  let ligne = [], champ = '', q = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (q) {
      if (c === '"') { if (texte[i + 1] === '"') { champ += '"'; i++; } else q = false; }
      else champ += c;
    } else if (c === '"' && champ === '') q = true;
    else if (c === sep) { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(champ); champ = '';
      if (ligne.some(x => x.trim() !== '')) lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some(x => x.trim() !== '')) lignes.push(ligne);
  return { separateur: sep, lignes };
}
