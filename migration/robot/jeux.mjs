// Jeux lus par le robot sans recette (window.__stablMx.collect()) -> tableaux pour la passerelle.
// Chaque jeu est classé dans un type du monde équestre d'après l'adresse lue, le titre de l'écran et ses champs ;
// la passerelle range ensuite les colonnes (champs.mjs). Les écritures comptables passent par la lecture du FEC.
import { cle } from '../core/texte.mjs';
import { analyserFEC, COLONNES_FEC } from '../core/fec.mjs';

// genre -> type de la passerelle (null : gardé à part, rien n'est importé sans le gérant)
export const GENRES = [
  { genre: 'cavaliers', type: 'adherents', libelle: 'Cavaliers et adhérents', adresse: /cavalier|rider|member|adherent|client|customer|contact|eleve|student|famil|person/, champs: /prenom|first name|galop|licen|birth|naissance|niveau/ },
  { genre: 'licences', type: 'adherents', libelle: 'Licences FFE', adresse: /licen|ffe/, champs: /licen|galop|ffe/ },
  { genre: 'chevaux', type: 'chevaux', libelle: 'Chevaux', adresse: /horse|cheva|equid|poney|pony|cavalerie|stable|ecurie/, champs: /sire|ueln|puce|chip|robe|coat|race|breed|garrot|height|transpond/ },
  { genre: 'pensions', type: 'chevaux', libelle: 'Pensions', adresse: /pension|board|livery|hebergement/, champs: /pension|box|board/ },
  { genre: 'forfaits', type: 'prestations', libelle: 'Forfaits et cartes', adresse: /forfait|package|carte|card|abonn|subscription|tarif|price|product|prestation|article|formule/, champs: /prix|price|tarif|tva|vat|seances|sessions|validit/ },
  { genre: 'reprises', type: 'reprises', libelle: 'Reprises et planning', adresse: /reprise|lesson|cours|planning|agenda|calend|seance|session|creneau|slot|event|schedule/, champs: /moniteur|instructor|coach|debut|start|fin|end|heure|time|jour|day|niveau|level/ },
  { genre: 'reservations', type: 'reprises', libelle: 'Réservations', adresse: /booking|reserv|inscription|attendance|presence/, champs: /reserv|booking|present|inscrit/ },
  { genre: 'factures', type: 'factures', libelle: 'Factures', adresse: /factur|invoice|avoir|credit.?note|bill/, champs: /ttc|total|echeance|due|facture|invoice|numero|number|ht\b/ },
  { genre: 'reglements', type: 'reglements', libelle: 'Paiements et règlements', adresse: /paiement|payment|reglement|encaiss|transaction|receipt|remise/, champs: /moyen|method|mode|montant|amount|paye|paid/ },
  { genre: 'soins', type: 'soins', libelle: 'Soins (véto, maréchal, vermifuges, vaccins)', adresse: /soin|care|vet|sante|health|marechal|farrier|vermif|deworm|vaccin|traitement|treatment/, champs: /vaccin|vermif|marechal|farrier|vet|traitement|treatment|prochain|next/ },
  { genre: 'stocks', type: 'stocks', libelle: 'Stocks et fourrage', adresse: /stock|inventor|fourrage|feed|foin|hay|paille|straw|aliment|pharmac/, champs: /quantit|qty|stock|seuil|unite|unit/ },
  { genre: 'fournisseurs', type: 'fournisseurs', libelle: 'Fournisseurs', adresse: /fournisseur|supplier|vendor|provider|prestataire/, champs: /siret|supplier|fournisseur/ },
  { genre: 'equipe', type: 'equipe', libelle: 'Équipe', adresse: /staff|employ|equipe|team|salarie|moniteur|instructor|user/, champs: /poste|role|contrat|contract|diplome|salaire/ },
  { genre: 'comptabilite', type: null, libelle: 'Comptabilité (écritures, plan de comptes, journaux, TVA)', adresse: /ecriture|journal|ledger|entries|account|compte|compta|tva|vat|grand.?livre|balance/, champs: /debit|credit|compte|account|journal|lettrage/ },
];

// Classe un jeu : l'adresse et le titre pèsent plus que les champs (un « nom » est partout).
export function classerJeu(jeu) {
  const impose = jeu.genre && GENRES.find(g => g.genre === jeu.genre);
  if (impose) return { genre: impose.genre, type: impose.type, libelle: impose.libelle, note: 9 };
  const ou = cle([jeu.key, jeu.where, jeu.page].join(' ')), titre = cle(jeu.label || ''), champs = cle((jeu.fields || []).join(' '));
  const notes = GENRES.map(g => {
    let n = 0;
    if (g.adresse.test(ou)) n += 3;
    if (g.adresse.test(titre)) n += 2;
    n += Math.min(3, (champs.match(new RegExp(g.champs.source, 'g')) || []).length);
    return { ...g, note: n };
  }).sort((a, b) => b.note - a.note);
  const g = notes[0];
  return g.note >= 2 ? { genre: g.genre, type: g.type, libelle: g.libelle, note: g.note } : { genre: null, type: undefined, libelle: 'Liste', note: g.note };
}

const valeur = v => (v == null ? '' : typeof v === 'boolean' ? (v ? 'oui' : 'non') : String(v));
// Colonnes vides partout ou de simples identifiants techniques : écartées.
const inutile = (f, lignes) => /^(id|uuid|guid|key|etag|version|created by|updated by|tenant|__)/.test(f) && !/numero|number|ref/.test(f) || lignes.every(l => valeur(l[f]).trim() === '');

// Écritures comptables lues en JSON -> texte FEC -> même lecture que l'import FEC.
function versFEC(jeu) {
  const f = jeu.fields;
  const trouve = re => f.find(x => re.test(cle(x)));
  const carte = {
    JournalCode: trouve(/^(journal( code)?|journal|code journal|jnl)$/) || trouve(/journal/), EcritureNum: trouve(/^(ecriture num|entry (id|number)|numero|piece|number)$/) || trouve(/piece|entry/),
    EcritureDate: trouve(/^(date|ecriture date|entry date)$/) || trouve(/date/), CompteNum: trouve(/^(compte|compte num|account( number| num)?|numero de compte)$/) || trouve(/account|compte/),
    CompteLib: trouve(/(compte|account) (lib|label|name)/), CompAuxNum: trouve(/aux/), CompAuxLib: trouve(/aux (lib|label|name)|tiers|third/),
    PieceRef: trouve(/piece|reference|ref/), EcritureLib: trouve(/^(libelle|label|description|ecriture lib)$/), Debit: trouve(/debit/), Credit: trouve(/credit/), EcritureLet: trouve(/lettr|letter|reconcil/),
  };
  if (!carte.CompteNum || !(carte.Debit || carte.Credit)) return null;
  const lignes = jeu.rows.map((r, i) => COLONNES_FEC.map(c => {
    if (c === 'JournalCode') return valeur(r[carte.JournalCode]) || 'OD';
    if (c === 'EcritureNum') return valeur(r[carte.EcritureNum]) || String(i + 1);
    if (c === 'EcritureDate') return valeur(r[carte.EcritureDate]).slice(0, 10);
    return carte[c] ? valeur(r[carte[c]]).replace(/[\t\r\n]/g, ' ') : '';
  }).join('\t'));
  return [COLONNES_FEC.join('\t'), ...lignes].join('\n');
}

// jeux -> { tables (pour construirePaquet), resume (par genre), comptabilite }
export function tablesDesJeux(jeux, logiciel = 'robot') {
  const groupes = new Map();
  for (const j of jeux || []) {
    if (!j?.rows?.length || (j.fields || []).length < 2) continue;
    const c = classerJeu(j);
    const k = (c.genre || 'liste') + '#' + [...j.fields].sort().join('|');
    const g = groupes.get(k) || { ...c, fields: [], rows: [], vus: new Set(), label: j.label, page: j.page, key: j.key, where: j.where };
    for (const f of j.fields) if (!g.fields.includes(f)) g.fields.push(f);
    for (const r of j.rows) { const s = JSON.stringify(r); if (!g.vus.has(s)) { g.vus.add(s); g.rows.push(r); } }
    groupes.set(k, g);
  }
  const tables = [], resume = [];
  let comptabilite = null;
  for (const g of groupes.values()) {
    if (g.genre === 'comptabilite') {
      const fec = versFEC(g);
      if (fec) { const a = analyserFEC(fec, `${logiciel} › écritures`); comptabilite = a.comptabilite; for (const t of a.tables) tables.push({ ...t, logiciel, robot: true }); }
      resume.push({ genre: g.genre, libelle: g.libelle, lignes: g.rows.length });
      continue;
    }
    const champs = g.fields.filter(f => !inutile(f, g.rows)).slice(0, 40);
    if (champs.length < 2) continue;
    const t = { fichier: `${logiciel} › ${g.libelle}`, feuille: (g.page || '').replace(/[/_-]+/g, ' ').trim(), lignes: [champs, ...g.rows.map(r => champs.map(f => valeur(r[f])))], robot: true, logiciel };
    if (g.type) t.type = g.type;
    tables.push(t);
    resume.push({ genre: g.genre, libelle: g.libelle, lignes: g.rows.length });
  }
  return { tables, resume, comptabilite };
}

// Ce que la recette retient d'un jeu : l'adresse (sans identifiants ni valeurs) et le genre. Jamais une ligne.
export function adresseDeJeu(jeu) {
  const m = /^api:[^/]*(\/[^#]*)#?(.*)$/.exec(jeu.key || '');
  return m ? { chemin: m[1].slice(0, 160), liste: m[2].slice(0, 80), genre: classerJeu(jeu).genre } : null;
}
