// HelloAsso : export CSV des adhésions et des paiements (Administration › Adhésions › Exporter, ou Paiements › Exporter).
// HelloAsso reste branché à Stabl (relation « Intégrer ») : on reprend l'historique sans rien ressaisir.
// Un export mélange l'adhérent, le payeur (souvent un parent), la formule et le paiement sur la même ligne :
// on en fait trois tables propres (adhérents, formules, règlements) que la passerelle range ensuite comme les autres.
import { cle } from './texte.mjs';

// Rangement des colonnes : chaque colonne HelloAsso -> un rôle. L'ordre compte (le plus précis d'abord).
const ROLES = [
  ['payeur_prenom', /^prenom (du )?payeur$/], ['payeur_nom', /^nom (du )?payeur$/], ['payeur_email', /^(e ?mail|courriel) (du )?payeur$/],
  ['reference', /^(numero|reference|ref)( de (la )?commande| commande| du paiement| paiement)?$|^numero$/],
  ['formule', /^(formule|tarif|nom (du |de la )?(tarif|formule)|type d adhesion|campagne|nom de la campagne)$/],
  ['montant', /^(montant( du tarif| tarif| total| paye| de la commande| du paiement)?|prix|total)$/],
  ['date', /^(date( de la commande| du paiement| d adhesion| de paiement)?)$/],
  ['statut', /^(statut|etat)( de la commande| du paiement| de l adhesion)?$/],
  ['moyen', /^(moyen|mode)( de paiement| de reglement)?$/],
  ['prenom', /^(prenom|prenom (de l )?adherent|prenom du participant|first name)$/], ['nom', /^(nom|nom (de l )?adherent|nom du participant|last name)$/],
  ['email', /^(e ?mail|courriel|adresse e ?mail|e ?mail (de l )?adherent)$/], ['naissance', /^date de naissance$/],
  ['telephone', /^(telephone|numero de telephone|portable|mobile)$/], ['adresse', /^adresse$/], ['code_postal', /^code postal$/], ['ville', /^ville$/],
  ['licence', /licence/], ['code_promo', /code promo/],
];
export function rangerColonnes(entetes) {
  const r = {}, pris = new Set();
  entetes.forEach((h, i) => {
    const k = cle(h);
    for (const [role, re] of ROLES) if (!pris.has(role) && re.test(k)) { r[i] = role; pris.add(role); return; }
  });
  return r;
}
export function estHelloAsso(entetes, nomFichier = '') {
  const k = entetes.map(cle);
  const signes = [k.some(x => /payeur/.test(x)), k.some(x => /^formule$|^tarif$|nom du tarif/.test(x)), k.some(x => /statut (de la )?commande|reference commande|numero de commande/.test(x)), /helloasso/i.test(nomFichier)];
  return signes.filter(Boolean).length >= 2;
}
const PAYE = /valid|pay|autoris|effectu|regle|confirm|succes|^ok$/;
const REFUSE = /refus|annul|rembours|echou|abandon|attente|en cours/;

export function tablesHelloAsso(lignes, nom = 'helloasso.csv') {
  const h = lignes.findIndex(l => estHelloAsso(l, nom)); if (h < 0) return null;
  const entetes = lignes[h].map(String), roles = rangerColonnes(entetes);
  const col = role => { const i = Object.keys(roles).find(i => roles[i] === role); return i === undefined ? -1 : +i; };
  const v = (l, role) => { const i = col(role); return i >= 0 ? String(l[i] ?? '').trim() : ''; };
  const adh = [['Nom', 'Prénom', 'Date de naissance', 'Email', 'Téléphone', 'Adresse', 'Code postal', 'Ville', 'Licence', 'Forfait', 'Responsable', 'Email responsable']];
  const reg = [['Date', 'Client', 'Montant', 'Mode de paiement', 'Référence']];
  const formules = new Map();
  let ignores = 0;
  for (const l of lignes.slice(h + 1)) {
    if (!l.some(x => String(x).trim())) continue;
    const statut = cle(v(l, 'statut'));
    const nomA = v(l, 'nom') || v(l, 'payeur_nom'), prenomA = v(l, 'prenom') || v(l, 'payeur_prenom');
    if (!nomA && !prenomA) continue;
    const payeur = [v(l, 'payeur_nom').toUpperCase(), v(l, 'payeur_prenom')].filter(Boolean).join(' ');
    const autrePayeur = payeur && cle(payeur) !== cle(nomA + ' ' + prenomA);
    const formule = v(l, 'formule');
    adh.push([nomA, prenomA, v(l, 'naissance'), v(l, 'email') || (autrePayeur ? '' : v(l, 'payeur_email')), v(l, 'telephone'), v(l, 'adresse'), v(l, 'code_postal'), v(l, 'ville'),
      v(l, 'licence'), formule, autrePayeur ? payeur : '', autrePayeur ? v(l, 'payeur_email') : '']);
    if (formule && !formules.has(cle(formule))) formules.set(cle(formule), [formule, v(l, 'montant')]);
    if (statut && (REFUSE.test(statut) || !PAYE.test(statut))) { ignores++; continue; }
    if (v(l, 'montant')) reg.push([v(l, 'date'), autrePayeur ? payeur : `${nomA.toUpperCase()} ${prenomA}`.trim(), v(l, 'montant'), v(l, 'moyen') || 'Paiement en ligne', v(l, 'reference')]);
  }
  const tables = [
    { fichier: nom, feuille: 'adhérents', lignes: adh, type: 'adherents', logiciel: 'helloasso' },
    { fichier: nom, feuille: 'formules', lignes: [['Libellé', 'Prix TTC'], ...formules.values()], type: 'prestations', logiciel: 'helloasso' },
    { fichier: nom, feuille: 'paiements', lignes: reg, type: 'reglements', logiciel: 'helloasso' },
  ].filter(t => t.lignes.length > 1);
  return { tables, ignores, colonnes: Object.fromEntries(Object.entries(roles).map(([i, r]) => [entetes[i], r])) };
}
