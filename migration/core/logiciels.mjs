// Ce que l'on sait de chaque logiciel du marché : comment le club sort ses données, et à quoi reconnaître ses fichiers.
// « confirme: false » = déduit de sources publiques, à vérifier sur un vrai export de club.

export const LOGICIELS = {
  kavalog: {
    nom: 'Kavalog', editeur: 'AEXAE',
    reconnaitre: { fichier: /kavalog|aexae|kvl/i, entetes: ['code cavalier', 'cavalier', 'reprise'] },
    voies: [
      { mode: 'export', titre: 'Exports intégrés', etapes: ['Dans Kavalog, ouvrez la liste des cavaliers, puis Exporter (Excel ou CSV).', 'Faites de même pour les équidés, les forfaits et les factures de la saison.', 'Déposez les fichiers dans la passerelle Piaffe.'] },
      { mode: 'base_locale', titre: 'Pas d’export sous la main ? (version bureau, bientôt)', etapes: ['Le petit robot Piaffe pour Windows repère tout seul les exports et le dossier de données de Kavalog sur cet ordinateur.', 'Il ne lit qu’une copie, avec votre accord, et ne modifie rien.'] },
    ],
    confirme: false,
  },
  equimondo: {
    nom: 'Equimondo', editeur: 'Equimondo',
    reconnaitre: { fichier: /equimondo/i, entetes: [] },
    voies: [{ mode: 'export', titre: 'Export standard', etapes: ['Depuis Equimondo, téléchargez l’export standard (clients, chevaux, factures).', 'Déposez les fichiers dans la passerelle Piaffe.'] }],
    confirme: false,
  },
  cavasoft: {
    nom: 'Cavasoft', editeur: 'Cavasoft',
    reconnaitre: { fichier: /cavasoft/i, entetes: [] },
    voies: [{ mode: 'export', titre: 'Export Excel', etapes: ['Exportez les listes (cavaliers, chevaux, factures) au format Excel.', 'Déposez-les dans la passerelle Piaffe.'] }],
    confirme: false,
  },
  gecurie: {
    nom: 'Gecurie', editeur: 'Gecurie',
    reconnaitre: { fichier: /gecurie/i, entetes: [] },
    voies: [{ mode: 'export', titre: 'Export complet Excel', etapes: ['Utilisez « export complet des données » en Excel.', 'Déposez le fichier dans la passerelle Piaffe.'] }],
    confirme: false,
  },
  hoofplanner: {
    nom: 'HoofPlanner', editeur: 'HoofPlanner',
    reconnaitre: { fichier: /hoof/i, entetes: [] },
    voies: [{ mode: 'export', titre: 'Export CSV', etapes: ['Exportez chaque liste en CSV.', 'Déposez les fichiers dans la passerelle Piaffe.'] }],
    confirme: false,
  },
  ffe: {
    nom: 'FFE Club SIF', editeur: 'Fédération française d’équitation',
    reconnaitre: { fichier: /ffe|sif|licenci/i, entetes: ['numero licence', 'licence', 'millesime'] },
    voies: [{ mode: 'export', titre: 'Liste des licenciés', etapes: ['Dans FFE Club SIF, exportez la liste des licenciés de la saison (Excel).', 'Déposez-la avec les autres fichiers : Piaffe rapproche les licences des fiches adhérents.'] }],
    confirme: false,
  },
  tableur: {
    nom: 'Tableur (Excel, Google Sheets, Numbers)', editeur: '',
    reconnaitre: { fichier: /./, entetes: [] },
    voies: [{ mode: 'export', titre: 'Votre fichier', etapes: ['Enregistrez chaque onglet en .xlsx ou .csv (Google Sheets : Fichier, Télécharger).', 'Une ligne par personne ou par cheval, une ligne de titres en haut.'] }],
    confirme: true,
  },
};

export function reconnaitreLogiciel(nomFichier, entetes = []) {
  for (const [id, l] of Object.entries(LOGICIELS)) {
    if (id === 'tableur') continue;
    if (l.reconnaitre.fichier.test(nomFichier)) return id;
  }
  return null;
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
