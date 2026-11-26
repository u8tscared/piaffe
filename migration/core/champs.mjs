// Dictionnaire des colonnes : pour chaque type de fichier, les champs Stabl et les intitulés qu'on rencontre
// dans les exports (Kavalog, Equimondo, Cavasoft, FFE, tableurs maison). Les intitulés sont comparés après `cle()`.
import { cle } from './texte.mjs';

export const TYPES = {
  adherents: {
    libelle: 'Adhérents et cavaliers',
    indices: ['cavalier', 'adherent', 'licence', 'galop', 'eleve', 'client'],
    champs: {
      id_source: ['id', 'numero', 'code', 'code client', 'code cavalier', 'numero client', 'numero adherent', 'ref', 'reference', 'identifiant', 'id client'],
      nom_complet: ['cavalier', 'nom prenom', 'nom et prenom', 'adherent', 'client', 'eleve', 'nom complet'],
      nom: ['nom', 'nom cavalier', 'nom de famille', 'nom adherent', 'last name', 'nom usage'],
      prenom: ['prenom', 'prenom cavalier', 'first name', 'prenom adherent'],
      naissance: ['date de naissance', 'naissance', 'ne le', 'nee le', 'ne e le', 'ne e', 'nee', 'date naissance', 'ddn', 'birth', 'date de naiss'],
      sexe: ['sexe', 'civilite', 'genre'],
      email: ['email', 'e mail', 'mail', 'courriel', 'adresse mail', 'adresse email', 'email cavalier'],
      telephone: ['telephone', 'tel', 'portable', 'mobile', 'tel portable', 'gsm', 'tel mobile', 'telephone portable', 'telephone 1'],
      telephone2: ['telephone 2', 'tel fixe', 'fixe', 'tel domicile', 'telephone fixe', 'autre telephone'],
      adresse: ['adresse', 'adresse 1', 'rue', 'adresse postale', 'voie'],
      adresse2: ['adresse 2', 'complement adresse', 'complement'],
      code_postal: ['code postal', 'cp', 'cp ville'],
      ville: ['ville', 'commune', 'localite'],
      licence: ['licence', 'numero licence', 'numero de licence', 'licence ffe', 'n licence', 'num licence', 'numero ffe'],
      licence_annee: ['millesime', 'annee licence', 'saison licence', 'licence valide', 'validite licence', 'licence 2027', 'licence 2026'],
      licence_type: ['type licence', 'categorie licence', 'type de licence'],
      galop: ['galop', 'niveau', 'niveau galop', 'galop obtenu', 'degre'],
      certificat: ['certificat medical', 'certificat', 'date certificat', 'certif medical', 'qs sport', 'questionnaire sante'],
      droit_image: ['droit image', 'droit a l image', 'autorisation photo', 'photo'],
      responsable_nom: ['responsable', 'nom responsable', 'responsable legal', 'parent', 'nom parent', 'representant legal', 'payeur', 'nom du payeur', 'contact'],
      responsable_email: ['email responsable', 'mail parent', 'email parent', 'mail responsable', 'email payeur'],
      responsable_telephone: ['tel responsable', 'telephone responsable', 'tel parent', 'telephone parent', 'portable parent', 'tel payeur'],
      famille: ['famille', 'code famille', 'foyer', 'groupe familial', 'numero famille'],
      forfait: ['forfait', 'formule', 'abonnement', 'carte', 'prestation', 'cours'],
      solde: ['solde', 'reste du', 'reste a payer', 'du', 'impaye', 'balance', 'solde du'],
      inscription: ['date inscription', 'inscrit le', 'date adhesion', 'adherent depuis', 'date creation', 'premiere inscription'],
      notes: ['notes', 'remarques', 'commentaire', 'commentaires', 'observations', 'info'],
    },
  },
  chevaux: {
    libelle: 'Chevaux et poneys',
    indices: ['cheval', 'equide', 'poney', 'sire', 'robe', 'race', 'box'],
    champs: {
      id_source: ['id', 'code', 'code cheval', 'ref', 'reference', 'identifiant', 'numero cheval'],
      nom: ['nom', 'nom cheval', 'nom du cheval', 'cheval', 'equide', 'nom equide', 'poney', 'nom poney', 'monture'],
      sire: ['sire', 'numero sire', 'n sire', 'numero sire ifce', 'immatriculation'],
      ueln: ['ueln', 'numero ueln'],
      puce: ['puce', 'transpondeur', 'numero transpondeur', 'puce electronique', 'microchip'],
      naissance: ['date de naissance', 'naissance', 'annee', 'annee de naissance', 'ne en', 'age'],
      sexe: ['sexe'],
      race: ['race', 'stud book', 'studbook', 'origine'],
      robe: ['robe', 'couleur'],
      taille: ['taille', 'toise', 'hauteur', 'taille cm'],
      type: ['type', 'statut', 'categorie', 'utilisation', 'type de cheval', 'appartenance'],
      proprietaire: ['proprietaire', 'nom proprietaire', 'owner', 'propriétaire'],
      box: ['box', 'numero box', 'boxe', 'stalle', 'logement', 'pre'],
      arrivee: ['date arrivee', 'arrive le', 'entree', 'date entree'],
      pension: ['pension', 'formule pension', 'type pension', 'tarif pension'],
      notes: ['notes', 'remarques', 'commentaire', 'observations', 'caractere'],
    },
  },
  prestations: {
    libelle: 'Forfaits, cartes et tarifs',
    indices: ['tarif', 'forfait', 'prix', 'tva', 'prestation', 'article'],
    champs: {
      id_source: ['id', 'code', 'code article', 'ref', 'reference', 'code prestation'],
      libelle: ['libelle', 'designation', 'nom', 'prestation', 'article', 'forfait', 'intitule', 'produit'],
      categorie: ['categorie', 'famille', 'type', 'rubrique'],
      prix_ttc: ['prix ttc', 'tarif ttc', 'prix', 'tarif', 'montant ttc', 'pu ttc', 'montant'],
      prix_ht: ['prix ht', 'tarif ht', 'pu ht', 'montant ht'],
      tva: ['tva', 'taux tva', 'taux', 'tx tva'],
      seances: ['nombre de seances', 'seances', 'nb seances', 'nb cours', 'nombre cours', 'unites'],
      duree_validite: ['validite', 'duree validite', 'valable', 'duree'],
      compte: ['compte', 'compte comptable', 'compte produit', 'imputation'],
    },
  },
  factures: {
    libelle: 'Factures et lignes de facture',
    indices: ['facture', 'avoir', 'ttc', 'echeance', 'piece'],
    champs: {
      numero: ['numero facture', 'facture', 'n facture', 'numero', 'num facture', 'piece', 'numero piece', 'ref facture'],
      date: ['date', 'date facture', 'date piece', 'date emission', 'emise le'],
      echeance: ['echeance', 'date echeance', 'a payer avant', 'date limite'],
      client_id: ['code client', 'id client', 'numero client', 'code cavalier', 'code adherent'],
      client_nom: ['client', 'nom client', 'cavalier', 'adherent', 'destinataire', 'tiers', 'payeur'],
      libelle: ['libelle', 'designation', 'prestation', 'article', 'detail', 'description', 'objet'],
      quantite: ['quantite', 'qte', 'qt', 'nombre'],
      prix_unitaire: ['prix unitaire', 'pu', 'pu ttc', 'prix'],
      tva: ['tva', 'taux tva', 'taux'],
      total_ht: ['total ht', 'montant ht', 'ht'],
      total_ttc: ['total ttc', 'montant ttc', 'ttc', 'montant', 'total'],
      paye: ['regle', 'paye', 'montant regle', 'deja paye', 'encaisse', 'reglement'],
      reste: ['reste du', 'reste a payer', 'solde', 'du', 'restant'],
      statut: ['statut', 'etat', 'situation'],
      moyen: ['mode de reglement', 'mode reglement', 'moyen de paiement', 'mode paiement', 'reglement par'],
    },
  },
  reglements: {
    libelle: 'Règlements et encaissements',
    indices: ['reglement', 'encaissement', 'paiement', 'remise', 'banque'],
    champs: {
      date: ['date', 'date reglement', 'date encaissement', 'date paiement', 'encaisse le'],
      client_id: ['code client', 'id client', 'numero client'],
      client_nom: ['client', 'nom client', 'cavalier', 'adherent', 'tiers', 'payeur', 'tireur'],
      montant: ['montant', 'montant regle', 'somme', 'credit', 'encaisse'],
      moyen: ['mode', 'mode de reglement', 'moyen', 'moyen de paiement', 'type reglement', 'mode paiement'],
      facture: ['facture', 'numero facture', 'piece', 'n facture'],
      reference: ['numero cheque', 'reference', 'n cheque', 'banque', 'ref'],
      remise: ['remise', 'bordereau', 'numero remise', 'date remise'],
    },
  },
  reprises: {
    libelle: 'Planning des reprises',
    indices: ['reprise', 'cours', 'creneau', 'jour', 'heure', 'moniteur'],
    champs: {
      id_source: ['id', 'code', 'code reprise', 'ref'],
      libelle: ['reprise', 'cours', 'libelle', 'intitule', 'activite', 'nom reprise', 'creneau'],
      jour: ['jour', 'jour semaine', 'jour de la semaine'],
      date: ['date', 'date cours', 'le'],
      debut: ['heure', 'debut', 'heure debut', 'de', 'horaire'],
      fin: ['fin', 'heure fin', 'a', 'jusqu a'],
      duree: ['duree', 'duree min', 'temps'],
      moniteur: ['moniteur', 'monitrice', 'enseignant', 'prof', 'coach', 'encadrant', 'animateur'],
      niveau: ['niveau', 'galop', 'public', 'groupe'],
      lieu: ['lieu', 'carriere', 'manege', 'piste', 'terrain'],
      places: ['places', 'capacite', 'nb places', 'effectif max', 'max'],
      inscrits: ['inscrits', 'cavaliers', 'participants', 'eleves'],
      cavalier: ['cavalier', 'nom cavalier', 'eleve', 'adherent'],
      cheval: ['cheval', 'poney', 'monture', 'equide'],
    },
  },
  equipe: {
    libelle: 'Équipe',
    indices: ['salarie', 'employe', 'poste', 'contrat', 'diplome'],
    champs: {
      nom: ['nom', 'nom salarie'],
      prenom: ['prenom'],
      poste: ['poste', 'fonction', 'emploi', 'role'],
      email: ['email', 'mail', 'courriel'],
      telephone: ['telephone', 'tel', 'portable', 'mobile'],
      contrat: ['contrat', 'type contrat', 'type de contrat'],
      heures: ['heures', 'heures hebdo', 'duree hebdomadaire', 'temps de travail'],
      diplome: ['diplome', 'diplomes', 'qualification'],
      entree: ['date entree', 'embauche', 'date embauche'],
    },
  },
  soins: {
    libelle: 'Soins et registre d’élevage',
    indices: ['soin', 'vaccin', 'vermifuge', 'marechal', 'veterinaire', 'traitement'],
    champs: {
      cheval: ['cheval', 'nom cheval', 'equide', 'poney'],
      date: ['date', 'date soin', 'date intervention', 'fait le'],
      type: ['type', 'soin', 'intervention', 'acte', 'nature', 'type de soin'],
      detail: ['detail', 'produit', 'description', 'libelle', 'traitement', 'medicament'],
      intervenant: ['intervenant', 'veterinaire', 'praticien', 'marechal', 'par'],
      prochain: ['prochain', 'rappel', 'prochaine date', 'a refaire le', 'date rappel'],
      cout: ['cout', 'montant', 'prix', 'tarif'],
    },
  },
};

// Index des synonymes, comparés sous leur forme `cle()`.
const INDEX = {};
for (const [t, def] of Object.entries(TYPES)) {
  INDEX[t] = [];
  for (const [champ, syn] of Object.entries(def.champs)) {
    for (const s of [champ.replace(/_/g, ' '), ...syn]) INDEX[t].push({ champ, s: cle(s) });
  }
}

// Associe chaque colonne à un champ. Correspondance exacte d'abord, puis « contient », puis mots en commun.
export function associer(type, entetes) {
  const res = {}, pris = new Set(), confiance = {};
  const cles = entetes.map(cle);
  const passes = [
    (h, s) => h === s ? 1 : 0,
    (h, s) => (s.length > 3 && (h.startsWith(s + ' ') || h.endsWith(' ' + s))) ? 0.8 : 0,
    (h, s) => (s.length > 4 && h.includes(s)) ? 0.6 : 0,
  ];
  for (const passe of passes) {
    cles.forEach((h, i) => {
      if (i in res || !h) return;
      for (const { champ, s } of INDEX[type]) {
        if (pris.has(champ)) continue;
        const sc = passe(h, s);
        if (sc) { res[i] = champ; pris.add(champ); confiance[i] = sc; break; }
      }
    });
  }
  return { colonnes: res, confiance };
}

// Devine le type d'un tableau à partir de ses en-têtes et du nom du fichier.
export function devinerType(entetes, nomFichier = '') {
  const nf = cle(nomFichier);
  const scores = Object.entries(TYPES).map(([t, def]) => {
    const { colonnes, confiance } = associer(t, entetes);
    let sc = Object.values(confiance).reduce((a, b) => a + b, 0);
    const champs = new Set(Object.values(colonnes));
    for (const i of def.indices) { if (nf.includes(i)) sc += 2; if (entetes.some(e => cle(e).includes(i))) sc += 0.5; }
    // champs qui signent un type
    const signes = { adherents: ['licence', 'galop', 'prenom'], chevaux: ['sire', 'robe', 'race', 'puce'], factures: ['numero', 'total_ttc'],
      reglements: ['moyen', 'montant'], prestations: ['prix_ttc', 'tva'], reprises: ['jour', 'debut', 'moniteur'], equipe: ['poste', 'contrat'], soins: ['cheval', 'type'] }[t];
    sc += signes.filter(c => champs.has(c)).length * 1.5;
    return { type: t, score: sc, colonnes };
  }).sort((a, b) => b.score - a.score);
  return scores;
}

// Trouve la ligne d'en-tête : les exports ont parfois un titre, une date ou des lignes vides au-dessus.
export function ligneEntete(lignes) {
  let meilleure = 0, score = -1;
  for (let i = 0; i < Math.min(lignes.length, 15); i++) {
    const l = lignes[i];
    const remplies = l.filter(v => String(v).trim()).length;
    const textes = l.filter(v => /[a-zA-Zéè]/.test(String(v)) && !/@/.test(String(v)) && String(v).length < 40).length;
    const sc = textes * 2 + remplies - (i * 0.1);
    if (remplies >= 2 && sc > score) { score = sc; meilleure = i; }
  }
  return meilleure;
}
