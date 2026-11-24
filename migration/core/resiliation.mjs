// Lettre de résiliation de l'ancien abonnement, à envoyer en recommandé avec accusé de réception.
// Prudente : on ne cite pas d'article précis ; le gérant relit avant envoi.

const dateFr = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

export function lettreResiliation(f = {}) {
  const auj = dateFr(new Date().toISOString().slice(0, 10));
  const club = f.club || '[Nom du club]';
  const effet = f.date_effet ? `à compter du ${dateFr(f.date_effet)}, ou à défaut à la première échéance permise par notre contrat` : 'à la prochaine échéance permise par notre contrat';
  const lignes = [
    club,
    f.adresse || '[Adresse du club]',
    f.siret ? `SIRET : ${f.siret}` : null,
    '',
    '',
    f.editeur ? `${f.editeur}` : '[Éditeur du logiciel]',
    f.adresse_editeur || '[Adresse de l’éditeur]',
    '',
    `${f.ville ? f.ville + ', le ' : 'Le '}${auj}`,
    '',
    'Lettre recommandée avec accusé de réception',
    '',
    `Objet : résiliation de notre abonnement${f.logiciel ? ' au logiciel ' + f.logiciel : ''}${f.numero_client ? ` (client n° ${f.numero_client})` : ''}`,
    '',
    'Madame, Monsieur,',
    '',
    `Par la présente, nous vous informons de notre décision de résilier notre abonnement${f.logiciel ? ' à ' + f.logiciel : ''} ${effet}.`,
    '',
    'Afin d’assurer la continuité de notre activité, nous vous demandons de nous transmettre, avant la date de fin du contrat, une copie complète de nos données dans un format lisible et réutilisable (CSV ou Excel) : fiches des cavaliers et de leurs responsables, chevaux, forfaits et cartes, planning, factures, règlements et soldes, ainsi que tout historique utile.',
    '',
    'Le cas échéant, nous entendons bénéficier des dispositions du règlement (UE) 2023/2854 sur les données relatives au changement de fournisseur de services de traitement de données.',
    '',
    'Une fois ces données restituées, nous vous remercions de procéder à leur suppression et de nous le confirmer par écrit, conformément au règlement général sur la protection des données.',
    '',
    'Nous vous prions également de bien vouloir nous confirmer par retour la date effective de la résiliation ainsi que l’arrêt de tout prélèvement à compter de cette date.',
    '',
    'Nous vous prions d’agréer, Madame, Monsieur, l’expression de nos salutations distinguées.',
    '',
    f.signataire || '[Nom et qualité du signataire]',
    club,
  ];
  return lignes.filter(l => l !== null).join('\n');
}
