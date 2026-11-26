// Parcours « Passer à Stabl » : les questions posées une à une et le plan de bascule qui en découle.
// Partagé par la page autonome (web/app.mjs) et l'onboarding de l'appli : même logique, mêmes réponses.
//
// reponses = {
//   depart: 'oui' | 'zero' | 'tableur',
//   principal: id du catalogue | null,     // logiciel qui gère le club aujourd'hui
//   adresse: 'https://…' | null,           // adresse collée (logiciel inconnu ou connu)
//   outils: [id…],                          // autres outils cochés
//   choix: { id: 'changer' | 'integrer' },  // décision par outil ; absente = recommandée
// }
import { LOGICIELS, PRINCIPAUX } from './logiciels.mjs';

export const FAMILLES_OUTILS = ['federation', 'adhesions', 'agenda', 'compta', 'rh', 'tableurs'];

export const QUESTIONS = [
  { id: 'depart', titre: 'Venez-vous d’un autre logiciel ?', sous: 'On adapte la suite à votre point de départ.', type: 'choix', options: [
    { valeur: 'oui', libelle: 'Oui', detail: 'Un logiciel de gestion équestre gère le club aujourd’hui.' },
    { valeur: 'zero', libelle: 'Non, je pars de zéro', detail: 'Nouveau club, ou rien à reprendre.' },
    { valeur: 'tableur', libelle: 'J’utilise surtout Excel ou du papier', detail: 'Tableurs, cahiers, fiches.' },
  ] },
  { id: 'principal', titre: 'Lequel gère votre club aujourd’hui ?', sous: 'C’est celui qu’on vide entièrement, puis que vous résiliez.', type: 'logiciel',
    si: r => r.depart && r.depart !== 'zero', familles: r => PRINCIPAUX[r.depart] || PRINCIPAUX.oui, adresse: true },
  { id: 'outils', titre: 'Quels autres outils utilisez-vous ?', sous: 'Cochez tout ce qui sert au club : paiements, comptabilité, fédération, agenda…', type: 'cases', familles: FAMILLES_OUTILS },
  { id: 'choix', titre: 'Pour chacun : on change ou on intègre ?', sous: 'Le choix recommandé est déjà fait. « Changer » : Stabl le remplace. « Intégrer » : vous le gardez, on le branche.', type: 'decisions',
    si: r => (r.outils || []).length > 0 },
  { id: 'plan', titre: 'Votre plan de bascule', sous: 'Voici exactement ce qui va se passer.', type: 'plan' },
  { id: 'recuperation', titre: 'Récupération', sous: 'Choisissez comment on sort vos données.', type: 'recuperation' },
];

export function questionsActives(reponses = {}) { return QUESTIONS.filter(q => !q.si || q.si(reponses)); }

export function decisionsPossibles(id) {
  const l = LOGICIELS[id]; if (!l) return [];
  return ['changer', 'integrer'].filter(d => l.effets?.[d]);
}
export function decisionRecommandee(id) {
  const l = LOGICIELS[id]; if (!l) return null;
  const possibles = decisionsPossibles(id);
  const voulu = l.relation === 'remplace' ? 'changer' : 'integrer';
  return possibles.includes(voulu) ? voulu : possibles[0] || null;
}
export function decision(reponses, id) {
  const d = reponses.choix?.[id];
  return d && decisionsPossibles(id).includes(d) ? d : decisionRecommandee(id);
}
export function effetPour(id, d) { return LOGICIELS[id]?.effets?.[d] || ''; }

const QUOI = { equestre: 'cavaliers, familles, chevaux, forfaits, factures, planning', adhesions: 'membres et paiements', agenda: 'événements et reprises',
  compta: 'clients et factures', rh: 'équipe', tableurs: 'lignes du tableau', papier: 'fiches à saisir', federation: 'licenciés' };

// Le plan : ce qu'on récupère, ce qu'on branche, ce que le club résilie.
export function planDeBascule(reponses = {}) {
  const recuperer = [], brancher = [], resilier = [];
  const p = reponses.principal && LOGICIELS[reponses.principal];
  if (p) {
    recuperer.push({ id: p.id, nom: p.nom, quoi: QUOI[p.famille] || 'données', principal: true });
    resilier.push({ id: p.id, nom: p.nom, editeur: p.editeur || p.nom, lettre: p.lettre, principal: true });
  } else if (reponses.depart !== 'zero' && reponses.adresse) {
    recuperer.push({ id: null, nom: 'Votre logiciel', adresse: reponses.adresse, quoi: QUOI.equestre, principal: true });
    resilier.push({ id: null, nom: 'Votre logiciel', editeur: '', lettre: true, principal: true });
  }
  for (const id of [...new Set(reponses.outils || [])]) {
    const l = LOGICIELS[id]; if (!l || id === reponses.principal) continue;
    const d = decision(reponses, id);
    if (d === 'changer') {
      recuperer.push({ id, nom: l.nom, quoi: QUOI[l.famille] || 'données' });
      resilier.push({ id, nom: l.nom, editeur: l.editeur || l.nom, lettre: l.lettre });
    } else if (d === 'integrer') {
      brancher.push({ id, nom: l.nom, effet: l.effets.integrer });
      if (l.historique) recuperer.push({ id, nom: l.nom, quoi: l.historique, garde: true });
    }
  }
  return { recuperer, brancher, resilier };
}

// Réponses toutes faites pour le mode intégré (?source=…&outils=…) : les outils listés sont remplacés.
export function reponsesDepuisLien(params) {
  const g = k => params.get(k) || null;
  const source = g('source');
  const outils = (g('outils') || '').split(',').map(s => s.trim()).filter(id => LOGICIELS[id]);
  return {
    depart: source && LOGICIELS[source]?.famille !== 'equestre' ? 'tableur' : 'oui',
    principal: LOGICIELS[source] ? source : null, adresse: g('adresse'),
    outils, choix: Object.fromEntries(outils.filter(id => decisionsPossibles(id).includes('changer')).map(id => [id, 'changer'])),
  };
}
