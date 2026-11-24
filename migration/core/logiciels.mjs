// Catalogue des logiciels qu'un club peut quitter, rangés par famille, et façons d'en sortir les données.
// Modes, du plus magique au plus sûr :
//   robot      extension navigateur : le gérant se connecte, le robot copie les pages (logiciels web)
//   ordinateur robot pour poste Windows : repère les exports et la base locale (logiciels bureau)
//   codes      le gérant confie ses identifiants chiffrés, Piaffe fait la migration puis les efface
//   export     fichier CSV / Excel déposé dans la passerelle
// « confirme: false » = étapes déduites de sources publiques, à vérifier sur un vrai compte.
// `site` sert au logo et à l'adresse officielle ; `domaines` reconnaît l'adresse collée par le gérant.

export const FAMILLES = [
  { id: 'equestre', nom: 'Gestion équestre' },
  { id: 'federation', nom: 'Fédération et État' },
  { id: 'adhesions', nom: 'Adhésions et paiements' },
  { id: 'agenda', nom: 'Agenda et réservation' },
  { id: 'compta', nom: 'Comptabilité et facturation' },
  { id: 'rh', nom: 'RH, planning et paie' },
  { id: 'tableurs', nom: 'Tableurs et contacts' },
  { id: 'papier', nom: 'Papier' },
];

const EXPORT_EQUESTRE = ['Dans votre logiciel, ouvrez la liste des cavaliers (ou clients) et cherchez Exporter, Excel ou CSV.', 'Faites de même pour les chevaux, les forfaits ou tarifs, les factures de la saison et le planning.', 'Déposez tous les fichiers ici, en une fois.'];
const EXPORT_COMPTA = ['Exportez la liste des clients (tiers) en Excel ou CSV.', 'Exportez les factures ou le grand livre clients de l’exercice, et si possible le FEC.', 'Déposez les fichiers ici : Piaffe reprend les clients, les factures et ce qui reste dû.'];
const EXPORT_PAIEMENT = ['Dans votre espace, exportez la liste des membres ou clients en CSV.', 'Exportez aussi les paiements ou commandes de la saison.', 'Déposez les fichiers ici.'];
const EXPORT_RH = ['Exportez la liste des salariés (nom, poste, contrat, heures) en Excel ou CSV.', 'Déposez le fichier ici : Piaffe crée l’équipe et ses accès.'];

// [id, nom, famille, forme, site, domaines (regex source) | null, confirme, étapes d'export | null, éditeur?]
const L = [
  // ---- Gestion équestre (research/01-concurrents-france.md) ----
  ['kavalog', 'Kavalog', 'equestre', 'les-deux', 'kavalog.com', 'kavalog\\.(com|fr)', false, null, 'AEXAE'],
  ['equimondo', 'Equimondo', 'equestre', 'web', 'equimondo.fr', 'equimondo\\.', true, ['Dans Equimondo, téléchargez l’export standard : clients, chevaux, factures.', 'Déposez les fichiers ici.']],
  ['cavasoft', 'Cavasoft', 'equestre', 'web', 'cavasoft.fr', 'cavasoft\\.fr', false, null],
  ['equionline', 'Equionline', 'equestre', 'web', 'equionline.fr', 'equionline\\.fr', false, null],
  ['celeris', 'Céléris', 'equestre', 'web', null, null, false, null],
  ['mes-ecuries', 'Mes-écuries.com', 'equestre', 'web', 'mes-ecuries.com', 'mes-ecuries\\.com', false, null],
  ['vitecurie', 'VITEcurie', 'equestre', 'web', 'vitecurie.fr', 'vitecurie\\.fr', false, null],
  ['equicentre', 'Equicentre', 'equestre', null, null, null, false, null, 'ISI-LINE'],
  ['stillhorse', 'StillHorse', 'equestre', null, 'stillhorse.fr', 'stillhorse\\.fr', false, null, 'MLT Software'],
  ['hoofplanner', 'HoofPlanner', 'equestre', 'web', 'hoofplanner.fr', 'hoofplanner\\.fr', true, ['Dans HoofPlanner, exportez chaque liste en CSV (cavaliers, chevaux, factures).', 'Déposez les fichiers ici.']],
  ['gecurie', 'Gecurie', 'equestre', 'web', 'gecurie.com', 'gecurie\\.com', true, ['Utilisez « export complet des données » au format Excel.', 'Déposez le fichier ici.']],
  ['cavalio', 'Cavalio', 'equestre', 'web', 'cavalio.fr', 'cavalio\\.fr', false, null],
  ['equestrions', 'Equestrions', 'equestre', 'web', 'equestrions.fr', 'equestrions\\.fr', false, null, 'Enjoy’Up'],
  ['ecurios', 'Ecurios', 'equestre', 'web', 'ecurios.fr', 'ecurios\\.fr', false, null],
  ['horsingup', 'Horsing Up', 'equestre', 'web', 'horsingup.com', 'horsingup\\.com', false, null],
  ['monharas', 'MonHaras', 'equestre', 'web', 'monharas.fr', 'monharas\\.fr', false, null],
  ['ekurie', 'Ekurie', 'equestre', 'web', 'ekurie.fr', 'ekurie\\.fr', false, null],
  ['izidoor', 'Izidoor', 'equestre', 'web', 'izidoor.io', 'izidoor\\.io', false, null],
  ['gestequit', 'GestEquit', 'equestre', 'web', 'gestequit.com', 'gestequit\\.com', false, null],
  // ---- Fédération et État ----
  ['ffe', 'FFE Club SIF', 'federation', 'web', 'ffe.com', 'ffe\\.com', false, ['Dans FFE Club SIF, exportez la liste des licenciés de la saison (Excel).', 'Déposez-la avec les autres fichiers : Piaffe rapproche les licences des fiches adhérents.'], 'Fédération française d’équitation'],
  ['ffecompet', 'FFE Compet', 'federation', 'web', 'ffe.com', null, true, ['Dans FFE Compet, exportez les engagements et résultats au format CSV ou XLS.', 'Déposez le fichier ici.'], 'Fédération française d’équitation'],
  ['sire', 'SIRE / IFCE', 'federation', 'web', 'ifce.fr', 'ifce\\.fr', false, ['Piaffe pré-remplit chaque cheval depuis son numéro SIRE (données publiques) : il suffit que vos fichiers contiennent ce numéro.'], 'Institut français du cheval et de l’équitation'],
  // ---- Adhésions et paiements ----
  ['helloasso', 'HelloAsso', 'adhesions', 'web', 'helloasso.com', 'helloasso\\.com', false, EXPORT_PAIEMENT],
  ['assoconnect', 'AssoConnect', 'adhesions', 'web', 'assoconnect.com', 'assoconnect\\.com', false, EXPORT_PAIEMENT],
  ['simpliasso', 'SimpliAsso', 'adhesions', 'web', 'simpliasso.fr', 'simpliasso\\.', false, EXPORT_PAIEMENT],
  ['stripe', 'Stripe', 'adhesions', 'web', 'stripe.com', 'stripe\\.com', true, ['Dans le tableau de bord Stripe, ouvrez Clients puis Exporter (CSV).', 'Faites de même pour Paiements et, si vous en avez, Abonnements.', 'Déposez les fichiers ici.']],
  ['sumup', 'SumUp', 'adhesions', 'web', 'sumup.com', 'sumup\\.(com|fr)', false, ['Dans votre espace SumUp, exportez l’historique des transactions (CSV ou Excel).', 'Déposez le fichier ici : Piaffe le rapproche des factures.']],
  ['gocardless', 'GoCardless', 'adhesions', 'web', 'gocardless.com', 'gocardless\\.com', false, ['Dans GoCardless, exportez les clients et les mandats (CSV).', 'Déposez les fichiers ici : les mandats de prélèvement restent à faire signer de nouveau ou à transférer avec l’accord de GoCardless.']],
  ['paypal', 'PayPal', 'adhesions', 'web', 'paypal.com', 'paypal\\.com', false, ['Dans PayPal, Activité puis Relevés : téléchargez l’historique en CSV.', 'Déposez le fichier ici.']],
  // ---- Agenda et réservation ----
  ['google-agenda', 'Google Agenda', 'agenda', 'web', 'calendar.google.com', 'calendar\\.google\\.com', true, ['Google Agenda : Paramètres, Importer et exporter, Exporter (fichier .ics dans un .zip).', 'Déposez le fichier ici, ou abonnez Piaffe à l’agenda (lien iCal) pour une reprise en continu.']],
  ['outlook', 'Outlook', 'agenda', 'les-deux', 'outlook.com', 'outlook\\.(live|office)\\.com', false, ['Outlook : exportez le calendrier (fichier .ics, ou CSV dans la version bureau).', 'Déposez le fichier ici.'], 'Microsoft'],
  ['apple-calendrier', 'Calendrier Apple', 'agenda', 'bureau', 'apple.com', null, true, ['Dans Calendrier sur Mac : Fichier, Exporter, Exporter (fichier .ics).', 'Déposez le fichier ici.'], 'Apple'],
  ['calendly', 'Calendly', 'agenda', 'web', 'calendly.com', 'calendly\\.com', false, ['Dans Calendly, exportez les rendez-vous ou les contacts (CSV).', 'Déposez le fichier ici.']],
  ['planity', 'Planity', 'agenda', 'web', 'planity.com', 'planity\\.com', false, null],
  // ---- Comptabilité et facturation ----
  ['pennylane', 'Pennylane', 'compta', 'web', 'pennylane.com', 'pennylane\\.com', false, EXPORT_COMPTA],
  ['tiime', 'Tiime', 'compta', 'web', 'tiime.fr', 'tiime\\.fr', false, EXPORT_COMPTA],
  ['indy', 'Indy', 'compta', 'web', 'indy.fr', 'indy\\.fr', false, EXPORT_COMPTA],
  ['sage', 'Sage', 'compta', 'les-deux', 'sage.com', 'sage\\.com', false, EXPORT_COMPTA],
  ['ebp', 'EBP', 'compta', 'les-deux', 'ebp.com', 'ebp\\.com', false, EXPORT_COMPTA],
  ['cegid', 'Cegid (Loop, Quadra)', 'compta', 'les-deux', 'cegid.com', 'cegid\\.(com|fr)', false, EXPORT_COMPTA],
  ['ciel', 'Ciel', 'compta', 'bureau', null, null, false, EXPORT_COMPTA, 'Sage'],
  ['quickbooks', 'QuickBooks', 'compta', 'web', 'quickbooks.intuit.com', 'quickbooks\\.intuit\\.com', false, EXPORT_COMPTA, 'Intuit'],
  ['axonaut', 'Axonaut', 'compta', 'web', 'axonaut.com', 'axonaut\\.com', false, EXPORT_COMPTA],
  ['henrri', 'Henrri', 'compta', 'web', 'henrri.com', 'henrri\\.com', false, EXPORT_COMPTA],
  ['isagri', 'Isagri', 'compta', 'bureau', 'isagri.fr', 'isagri\\.fr', false, EXPORT_COMPTA],
  // ---- RH, planning et paie ----
  ['payfit', 'PayFit', 'rh', 'web', 'payfit.com', 'payfit\\.com', false, EXPORT_RH],
  ['silae', 'Silae', 'rh', 'les-deux', 'silae.fr', 'silae\\.fr', false, EXPORT_RH],
  ['skello', 'Skello', 'rh', 'web', 'skello.io', 'skello\\.io', false, EXPORT_RH],
  ['combo', 'Combo', 'rh', 'web', 'combohr.com', 'combohr\\.com', false, EXPORT_RH],
  // ---- Tableurs et contacts ----
  ['excel', 'Excel', 'tableurs', 'les-deux', 'microsoft.com', null, true, ['Une ligne par personne ou par cheval, une ligne de titres en haut.', 'Enregistrez en .xlsx (tous les onglets sont lus) ou en .csv.', 'Déposez le fichier ici.'], 'Microsoft'],
  ['google-sheets', 'Google Sheets', 'tableurs', 'web', 'sheets.google.com', 'docs\\.google\\.com\\/spreadsheets', true, ['Fichier, Télécharger, Microsoft Excel (.xlsx) : tous les onglets suivent.', 'Déposez le fichier ici.'], 'Google'],
  ['numbers', 'Numbers', 'tableurs', 'bureau', 'apple.com', null, true, ['Fichier, Exporter vers, Excel.', 'Déposez le fichier ici.'], 'Apple'],
  ['libreoffice', 'LibreOffice Calc', 'tableurs', 'bureau', 'libreoffice.org', null, true, ['Fichier, Enregistrer sous, format Excel 2007-365 (.xlsx).', 'Déposez le fichier ici.'], 'The Document Foundation'],
  ['google-contacts', 'Contacts Google', 'tableurs', 'web', 'contacts.google.com', 'contacts\\.google\\.com', true, ['Dans Contacts Google : Exporter, au format CSV Google.', 'Déposez le fichier ici : Piaffe propose de rattacher chaque contact à un cavalier.'], 'Google'],
  ['outlook-contacts', 'Contacts Outlook', 'tableurs', 'les-deux', 'outlook.com', null, false, ['Dans Outlook : Contacts, Gérer, Exporter les contacts (CSV).', 'Déposez le fichier ici.'], 'Microsoft'],
  // ---- Papier ----
  ['papier', 'Cahier ou fiches papier', 'papier', null, null, null, true, ['Pas de fichier ? Remplissez le modèle Excel Piaffe (une ligne par cavalier, une par cheval), ou photographiez vos fiches : vous pourrez les saisir à l’écran pendant l’accueil dans Piaffe.']],
];

function modesPour(forme, id) {
  if (id === 'papier') return ['export'];
  if (['excel', 'numbers', 'libreoffice', 'apple-calendrier', 'sire'].includes(id)) return ['export'];
  if (forme === 'web') return ['robot', 'codes', 'export'];
  if (forme === 'bureau') return ['ordinateur', 'export'];
  if (forme === 'les-deux') return ['robot', 'ordinateur', 'codes', 'export'];
  return ['robot', 'ordinateur', 'export'];       // forme inconnue : on propose ce qui marche dans les deux cas
}

export const LOGICIELS = {};
for (const [id, nom, famille, forme, site, domaines, confirme, etapes, editeur] of L) {
  const modes = modesPour(forme, id);
  LOGICIELS[id] = {
    id, nom, famille, forme, site, editeur: editeur || null, modes, confirme,
    domaines: domaines ? new RegExp(domaines, 'i') : null,
    reconnaitre: { fichier: id === 'ffe' ? /ffe|sif|licenci/i : new RegExp('(^|[^a-z])' + id.replace(/-/g, '.?') + '([^a-z]|$)', 'i') },
    voies: [{ mode: 'export', titre: 'Export de fichier', etapes: etapes || EXPORT_EQUESTRE }],
  };
}

export function reconnaitreLogiciel(nomFichier, entetes = []) {
  for (const [id, l] of Object.entries(LOGICIELS)) {
    if (['excel', 'papier', 'numbers', 'libreoffice'].includes(id)) continue;
    if (l.reconnaitre.fichier.test(nomFichier)) return id;
  }
  return null;
}

// Adresse collée par le gérant -> logiciel du catalogue, ou null.
export function reconnaitreAdresse(adresse) {
  let hote = '';
  try { hote = new URL(/^https?:\/\//i.test(adresse) ? adresse : 'https://' + adresse).href; } catch { return null; }
  return Object.values(LOGICIELS).find(l => l.domaines && l.domaines.test(hote)) || null;
}

// Fichiers de base de données qu'un ancien logiciel peut laisser sur le poste. On les signale, on ne les ouvre qu'en lecture.
export const BASES_LOCALES = [
  { ext: /\.(fic|ndx|mmo)$/i, moteur: 'HFSQL (WINDEV)', lecture: 'Pilote ODBC HFSQL gratuit de PC SOFT, en lecture seule, sur une copie.' },
  { ext: /\.(mdb|accdb)$/i, moteur: 'Microsoft Access', lecture: 'Lecture d’une copie avec mdb-tools ou le pilote Access de Windows.' },
  { ext: /\.(fdb|gdb)$/i, moteur: 'Firebird / InterBase', lecture: 'Lecture d’une copie avec le client Firebird.' },
  { ext: /\.(sqlite|sqlite3|db3)$/i, moteur: 'SQLite', lecture: 'Lue directement par la passerelle (copie en lecture seule).' },
  { ext: /\.(mdf)$/i, moteur: 'SQL Server', lecture: 'Export depuis SQL Server Express (sauvegarde .bak ou requête), avec l’accord du club.' },
  { ext: /\.(dbf)$/i, moteur: 'dBase / FoxPro', lecture: 'Lisible directement (format ouvert), à ajouter à la passerelle si un club en a.' },
];
