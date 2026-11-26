// Fichier produit par le robot navigateur (format piaffe-capture 1.0) -> tableaux lisibles par la passerelle.
export function estCapture(texte) { return /^\s*\{\s*"format"\s*:\s*"piaffe-capture"/.test(texte); }

export function tablesDeCapture(c, nomFichier = 'capture-piaffe.json') {
  const logiciel = c.logiciel && !/non répertorié/i.test(c.logiciel) ? c.logiciel : (c.origine ? new URL(c.origine).hostname : 'robot');
  const tables = (c.tables || []).filter(t => t.lignes?.length).map(t => ({
    fichier: `${logiciel} › ${t.titre || t.url}`, lignes: [t.entetes, ...t.lignes], robot: true, url: t.url,
  }));
  // Les fiches détaillées qui ont les mêmes libellés forment un tableau (une ligne par fiche).
  const groupes = new Map();
  for (const f of c.fiches || []) {
    const cles = Object.keys(f.champs || {});
    if (cles.length < 2) continue;
    const sig = [...cles].sort().join('|');
    if (!groupes.has(sig)) groupes.set(sig, { titre: f.titre, cles, lignes: [] });
    groupes.get(sig).lignes.push(cles.map(k => f.champs[k]));
  }
  for (const g of groupes.values()) if (g.lignes.length) tables.push({ fichier: `${logiciel} › fiches ${g.titre || ''}`.trim(), lignes: [g.cles, ...g.lignes], robot: true });
  // Listes lues en JSON par le robot sans recette (robot/jeux.mjs) : déjà rangées par type.
  for (const t of c.listes || []) if (Array.isArray(t?.lignes) && t.lignes.length > 1) tables.push({ ...t, robot: true });
  return tables;
}
