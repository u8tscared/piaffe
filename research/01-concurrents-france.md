# Audit concurrentiel — logiciels de gestion équestre français et francophones

*Piaffe — recherche produit n° 01 — rédigé le 17/11/2026*

**Accès web : disponible.** Les informations ci-dessous viennent de pages consultées le 17/11/2026. Trois limites à connaître avant de lire :

- **Sites non consultables** (robots.txt interdit la lecture automatique) : `kavalog.com`, `horse-manager.com`, `staffequestre.com`, `equirank.fr`. Pour Kavalog, les faits viennent donc de sources tierces (stores d'applications, forums, comparatif Equirider, titres de pages de l'éditeur renvoyés par le moteur de recherche). C'est le concurrent le plus important et le moins bien documenté de ce rapport : **à compléter par une démo commerciale**.
- **Convention de marquage** : **[V]** = vérifié sur la page citée (affirmation de l'éditeur ou d'un store, pas un test du produit) ; **[V2]** = lu dans une source secondaire (comparatif, annuaire), non recoupé sur le site de l'éditeur ; **[S]** = supposé / déduit ; « non trouvé » = cherché, rien de public.
- **Aucun produit n'a été testé en main.** Un ✓ dans la matrice signifie « l'éditeur l'annonce », pas « ça marche bien ». La qualité du design est jugée d'après les pages marketing et les avis, donc toujours [S].

---

## 1. Synthèse

1. Le marché français est **très fragmenté** : plus de 25 éditeurs identifiés, presque tous de très petites structures (souvent un développeur seul), aucun acteur dominant en image de marque moderne.
2. **Kavalog** (AEXAE, Les Ulis) reste l'historique installé : agréé FFE, partenaire GHN, télétransmission des licences. Mais il traîne une réputation de logiciel « vieux et lourd », d'engagement de 24 mois et de frais d'entrée (forum Cheval Annonce, 2025), et son application cavalier est notée 3,6/5.
3. **L'entrée de gamme s'est effondrée** : Equimondo offre gratuitement chevaux, planning, réservation et site web et ne facture que la facturation (19 à 45 € HT/mois) ; Mes-écuries.com est à 20 € HT/mois tout compris ; VITEcurie facture 0,83 à 1,50 € HT par cheval. Le prix n'est plus un terrain de différenciation.
4. Le **lien FFE** est le vrai fossé : seuls Kavalog et Cavasoft se déclarent agréés avec transfert des licences. Les autres importent au mieux un fichier FFE. Aucun n'annonce d'engagement en concours depuis le logiciel.
5. La **facturation électronique** (Factur-X, Peppol) est devenue l'argument commercial n° 1 de 2026 : Equimondo, Equionline, Mes-écuries, VITEcurie, Céléris, Cavalio, GestEquit, Ecurios la mettent tous en avant.
6. Les **applications mobiles natives sont rares et mal notées** : la plupart sont des sites responsive ou des PWA. Les rares applications en store ont peu ou pas d'avis ; l'application FFE Compétition est à 1,8/5 sur 329 notes.
7. **Personne ne couvre vraiment** la paie/RH, la comptabilité complète (au-delà de l'export), l'entretien des installations, ni la gestion de concours organisés par le club. Ce sont des cases cochées en une ligne, sans profondeur.
8. **Caméras et IA** n'existent que chez des nouveaux entrants peu diffusés (Equestrions, StillHorse, Equicty « Hoofy », Equimondo analyse de photo). Rien de mûr.
9. La **portabilité des données** est quasi absente du discours : seuls HoofPlanner et Gecurie annoncent un import/export CSV ou Excel en libre-service (Cavalio promet un export à tout moment, mais l'import est fait par son équipe). Aucune API publique trouvée.
10. Les clubs qui n'ont pas de logiciel métier bricolent avec Excel, HelloAsso (gratuit, mais ni planning ni présences) et le site FFE Club SIF (non adapté au mobile). La place à prendre est celle d'un produit **complet, moderne, sans engagement, réellement connecté à la FFE et honnête sur l'export des données**.

---

## 2. Fiches concurrents

### A. Logiciels métier « club » (concurrents directs)

#### 2.1 Kavalog (AEXAE) — France

- **Cible** : centres équestres, poney-clubs, écuries de propriétaires [V2 — equids.com, equirider.fr].
- **Modules** : inscriptions, facturation, suivi d'activité, registre d'élevage, versions bureau et web [V2 — equirider.fr]. « Kavalog Web » = extranet / inscriptions en ligne [V — titre de page éditeur]. Télétransmission des licences à la FFE [V — titre d'article éditeur du 04/09/2024]. Paiement en ligne « dès la gamme Basic » [V — titre d'article éditeur du 16/06/2021]. Liste détaillée des modules : non trouvée (site non consultable).
- **Mobile** :
  - Cavalier — « Kavalog - Espace Cavalier » / iKavalog (iOS et Android) : inscription et annulation de cours, stages, consultation et paiement des factures, achat et consultation de cartes, message au club, bons de récupération, contrôle de validité de licence [V — Google Play, App Store].
  - Moniteur — « iKavalog-Moniteur » (iOS, sorti le 06/10/2025) : reprises et inscrits, affectation des équidés, pointage présence/absence, clôture des reprises [V — App Store].
  - Gérant : pas d'application dédiée trouvée.
- **Prix** : « dès 39 € HT/mois (Start), autres offres sur devis » [V2 — equirider.fr, relevé du 11/10/2026]. Historique forum : 3 000 € ou 150 €/mois sur 48 mois en 2007 ; « environ 3 000 € » en 2012 [V — Cheval Annonce]. Grille actuelle complète : non trouvée.
- **Points forts** : agrément FFE et partenariat GHN [V — titres éditeur] ; plus de 900 structures revendiquées [V2 — logiciels.pro, annuaire peu fiable] ; application cavalier diffusée (10 000+ téléchargements Android) [V] ; application moniteur récente et mise à jour toutes les deux semaines fin 2025 [V].
- **Points faibles (avis)** :
  - « surtout pas KAVALOG si vous signez vous êtes mariés » ; frais de mise à disposition, logiciel jugé vieux et lourd, pas de suivi pédagogique, contrat de 24 mois difficile à résilier — Harasmoulinneuf, 06/02/2025 [V — Cheval Annonce].
  - Application cavalier : 3,6/5 sur environ 110 notes Android et 3,6/5 sur 96 notes iOS [V]. Avis iOS : « on ne peut pas voir les chevaux qui sont montés dans la reprise précédente » (02/10/2025) ; « On ne peut pas mettre à jour l application !!! Je n ai donc plus accès du tout » (29/02/2024) ; paiement impossible depuis Safari mobile, « page blanche » [V — App Store FR].
- **Import/export** : non trouvé. Un annuaire indique « pas d'API ouverte » [V2 — logiciels.pro, fiabilité faible].
- **Intégrations** : FFE (licences) [V] ; paiement en ligne [V] ; prestataire de paiement, SEPA, export comptable : non trouvés.
- **Design perçu** : daté [S, d'après les avis].
- Sources : [Google Play](https://play.google.com/store/apps/details?id=fr.aexae.ikavalog&hl=en_US), [App Store FR](https://apps.apple.com/fr/app/ikavalog/id1074608107), [iKavalog-Moniteur](https://apps.apple.com/fr/app/ikavalog-moniteur/id6748355529), [Cheval Annonce](https://www.chevalannonce.com/forums-65806-logiciels-de-gestion-de-centre-equestre), [Equirider](https://www.equirider.fr/logiciel-gestion-equestre/).

#### 2.2 Equimondo — France (Courseulles-sur-Mer)

- **Cible** : centres équestres, poney-clubs, écuries de propriétaires, haras, moniteurs indépendants, maréchaux, cavaliers [V].
- **Modules** [V — equimondo.fr] :
  - Chevaux et soins : rappels par cheval, registre d'élevage, rations, historique, identification via le fichier SIRE, visites inscrites par les cavaliers, analyse d'une photo par IA (plaie, aplomb, dos).
  - Planning et réservations : reprises, stages, balades, cours particuliers, réservation 24 h/24, listes d'attente automatiques, attribution automatique du cheval en balade selon le gabarit, boutique de forfaits et cartes, occupation des boxes, réservation des installations.
  - Pédagogie : carnet de progression validé par les moniteurs, objectifs et bilans de séance, quiz (EquiQuiz), parcours vers les galops.
  - Site internet inclus avec réservation intégrée.
  - Facturation : devis, factures, signature électronique, paiement par carte et prélèvement SEPA, relances d'impayés, export comptable, réception des factures fournisseurs (Factur-X, UBL, CII), lecture automatique d'une facture photographiée.
  - Pensions : prélèvement mensuel, suppléments, contrats signés électroniquement, espace propriétaire.
  - E-mails groupés aux cavaliers.
  - Hébergement de chevaux de passage (place de marché sur equimondo.com, sans commission).
- **Mobile** : application web installable sur l'écran d'accueil ; liens App Store et Google Play en pied de page, mais la page d'accueil ne cite que Google Play [V, incohérence relevée]. Gérant : planning du jour, pointage, saisie des soins, occupation des boxes, messages de groupe. Cavalier : planning, réservation et annulation, factures, progression. Pas de mode hors ligne ; notifications push non décrites [V].
- **Prix** [V — equimondo.fr] : gestion des chevaux, soins, planning, réservation, progression, e-mails et site web à 0 €/mois sans limite de durée. Facturation (avec devis, pensions, encaissement) : 19 € HT/mois jusqu'à 35 cavaliers, 29 € de 36 à 80, 45 € au-delà. Sans engagement.
- **Points forts** : périmètre fonctionnel le plus large du marché sur le papier ; gratuité du socle ; migration des données faite gratuitement par l'éditeur ; plus de 950 structures et 4,7/5 sur 55 avis Google revendiqués — **attention**, le bas de page précise que les chiffres et captures sont « des exemples de maquette » [V].
- **Points faibles** : « zéro bug contrairement à equimondo » — Marktwain, 26/03/2019 [V — Cheval Annonce] ; à l'inverse, un utilisateur de 4 ans juge la facturation « facile et instinctif » (07/04/2019) [V]. Aucun avis sur Capterra [V]. Pas de RH, pas de concours, pas de SMS mentionnés ; stocks cités sans détail [V]. Beaucoup de liens morts sur equimondo.com [V].
- **Import/export** : import assisté depuis un ancien logiciel, un export FFE ou des fiches papier [V]. Export général des données : non trouvé. API : non trouvée.
- **Intégrations** : SIRE/IFCE [V] ; import d'un fichier FFE et niveaux FFE, mais pas de télétransmission de licences annoncée [V] ; carte bancaire et SEPA, prestataire non nommé [V] ; export comptable [V].
- **Design perçu** : site marketing récent et dense ; produit non vu [S].
- Sources : [equimondo.fr](https://equimondo.fr/), [fonctionnalités](https://equimondo.fr/fonctionnalites.php), [application](https://equimondo.fr/application-mobile-centre-equestre.php), [Capterra](https://www.capterra.fr/software/1033887/equimondo).

#### 2.3 Cavasoft — France

- **Cible** : centres équestres et écuries [V].
- **Modules** [V — cavasoft.fr] : cavaliers (fiches) ; chevaux (registre des équidés, suivi d'activité) ; reprises (feuilles de monte, cartes d'heures, forfaits) ; facturation et comptes clients ; activités (stages, journées découverte) ; salariés (plannings, répartition des tâches) ; contacts (campagnes e-mail) ; plateforme cavaliers. Produit séparé « Cavasoft Web » : site internet et module compétition avec résultats en direct via WinJump. Boutique textile.
- **Espace cavalier** [V — guide cavalier PDF] : un compte pour plusieurs cavaliers ; crédits de cartes et de rattrapage ; signalement d'absence validé par le club ; désinscription avec crédit de rattrapage si délai respecté ; inscription avec carte, crédit ou article ; boutique ; panier générant une facture ; paiement en ligne « quand il est proposé ».
- **Mobile** : pas d'application native ; web responsive [V].
- **Prix** [V] : Cavasoft Gestion 39 € HT/mois, sans engagement, sans frais de mise en place, cavaliers et chevaux illimités, accès cavalier inclus. Cavasoft Web à partir de 49 € HT/mois plus frais de création non indiqués.
- **Points forts** : agréé FFE avec transfert des licences [V] ; mécanique de rattrapage aboutie ; prix clair. Trustpilot : 1 seul avis, 5/5, « efficace et en permanente évolution […] équipe d'assistance facilement joignable » (09/09/2024) [V].
- **Points faibles** : « occasional technical issues » reconnus dans un témoignage publié par l'éditeur lui-même [V — cavasoft.fr/clients] ; pas d'application ; SEPA, export comptable, facturation électronique non mentionnés [V].
- **Import/export** : non trouvé.
- **Intégrations** : FFE [V], WinJump [V]. Paiement : prestataire non trouvé.
- **Design perçu** : sobre, fonctionnel [S].
- Sources : [cavasoft.fr/solution](https://cavasoft.fr/solution), [guide cavalier](https://pc-des-ecureuils.cavasoft.fr/assets/guide-cavalier.pdf), [Trustpilot](https://fr.trustpilot.com/review/cavasoft.fr), [clients](https://cavasoft.fr/clients).

#### 2.4 Equionline — France (vendu aussi en Belgique, Luxembourg, Suisse)

- **Cible** : écuries de propriétaires, centres équestres, élevages, cavaliers professionnels [V].
- **Modules** [V — equionline.fr] : facturation (devis, factures, avoirs, encaissements, paiement en ligne, relances) ; clientèle (familles, tiers payants) ; chevaux (soins, mouvements, SIRE et IFCE) ; planning des reprises et montoir (inscriptions récurrentes, suivi de présence) ; espace cavalier (site dédié) ; registre d'élevage ; facturation électronique incluse ; médiathèque.
- **Mobile** : aucune application mentionnée [V].
- **Prix** : « à partir de 7,70 € HT/mois », tarif selon le nombre de chevaux, utilisateurs illimités ; trois offres Essentiel / Avancé (planning) / Complet (site web) ; −8 % en annuel, −10 % pour les associations ; essai de 31 jours sans carte ; sans engagement [V — equionline.fr/tarifs]. Détail : 7,70 € HT pour 10 chevaux puis +0,77 € par cheval [V2 — equirider.fr]. Capterra affiche « à partir de 11,04 € » [V].
- **Points forts** : plus de 500 structures et 18 000 chevaux revendiqués [V] ; prix très bas ; données hébergées en France selon l'éditeur [V].
- **Points faibles** : aucun avis sur Capterra [V] ; cartes, forfaits, rattrapages, FFE, SEPA, import et pédagogie absents des pages consultées [V] ; pas d'application.
- **Import/export** : non trouvé.
- **Intégrations** : SIRE/IFCE [V] ; paiement en ligne, prestataire non nommé [V] ; FFE non trouvé.
- **Design perçu** : site marketing soigné et moderne [S].
- Sources : [equionline.fr](https://www.equionline.fr/), [tarifs](https://www.equionline.fr/tarifs), [centre équestre](https://www.equionline.fr/structure/centre-equestre), [Capterra](https://www.capterra.fr/software/1015367/equionline).

#### 2.5 Céléris — France (Grenoble)

- **Cible** : centres équestres et écuries de propriétaires [V].
- **Modules** [V] : cours, stages, plannings ; cavaliers et licences (familles, cavaliers de passage, collectivités) ; cavalerie et pensions ; réservations et ventes en ligne avec accès selon niveau, âge ou adhésion et prix variables ; facturation et devis (comptes comptables, TVA, acomptes, facturation automatique des pensions et abonnements) ; paiements échelonnés (carte, chèques, chèques vacances, espèces), relances, remises en banque ; abonnements et adhésions ; événements avec inscription en ligne ; permissions par fonction ; e-mails et lettres d'information ; tableau de bord (chiffre d'affaires, trésorerie) ; site web ; facturation électronique ; conformité anti-fraude TVA.
- **Mobile** : pas d'application native, interface adaptée mobile [V].
- **Prix** : non public ; test gratuit sur demande ; « satisfait ou remboursé » après un mois [V].
- **Points forts** : « Je recommande sans hésitation […] tout est automatisé » — Marktwain, 26/03/2019 ; « très perfomant » — Stephaniegb66 [V — Cheval Annonce ; certains messages du fil ont un ton promotionnel]. Gestion financière la plus détaillée des pages consultées.
- **Points faibles** : prix cachés ; site vieillissant (SPIP) [S] ; télémaintenance par AnyDesk [V] ; FFE non mentionné [V].
- **Import/export** : export comptable [V] ; import non trouvé.
- **Intégrations** : carte bancaire et SEPA [V] ; export vers le logiciel du comptable [V].
- **Design perçu** : daté [S].
- Source : [gestion-equestre-celeris.fr](https://www.gestion-equestre-celeris.fr/).

#### 2.6 Mes-écuries.com — France (éditeur : Stéphane Dupas)

- **Cible** : centres équestres et écuries de propriétaires [V].
- **Modules** [V] : planning, reprises, stages, concours ; cartes de séances individuelles ou familiales avec décompte automatique, absences signalées par les clients, rattrapages ; chevaux (soins, vaccins, rappels par e-mail, registre d'élevage, statistiques de travail par équidé, journal de monte tenu par les clients) ; cavaliers (familles, licences) ; facturation manuelle ou automatique, devis, achats, ventilation de TVA, chiffre d'affaires par prestation ; paiement en ligne et impayés ; exports comptables et accès expert-comptable ; Factur-X et Peppol.
- **Mobile** : application iOS et Android ; sur l'App Store, aucune note ni avis [V].
- **Prix** : 20 € HT/mois tout compris, chevaux et cavaliers illimités, sans engagement, essai gratuit [V].
- **Points forts** : meilleur rapport prix/périmètre affiché ; import des cavaliers depuis la FFE et des chevaux depuis Excel [V — App Store] ; « +300 centres équestres » revendiqués [V].
- **Points faibles** : éditeur individuel (risque de pérennité) [S] ; aucun avis public ; chiffres marketing peu crédibles (« +500M factures », « 100 % clients satisfaits ») [V] ; envoi des licences à la FFE non mentionné [V].
- **Import/export** : import FFE et Excel [V] ; export comptable [V].
- **Design perçu** : non évalué.
- Sources : [mes-ecuries.com](https://www.mes-ecuries.com/), [App Store](https://apps.apple.com/gh/app/mes-ecuries-com/id6476379250).

#### 2.7 VITEcurie (« Vite ») — France (Idéateur, Lormont)

- **Cible** : poney-clubs, centres équestres, écuries de propriétaires, élevages, écuries de commerce [V].
- **Modules** [V] : blessures et traitements (avec photos), planification du travail des chevaux, gestation, registre d'élevage, stock de grain et CMV ; réservation en ligne, montoir, annulation et rattrapage en autonomie, notes de séance, progression des cavaliers ; demi-pensions, facturation automatique, paiement en ligne, TPE mobile, SEPA, attribution automatique des virements ; agenda partagé, notifications, formulaires personnalisables, accès moniteur, messagerie interne, rédaction assistée par IA, e-mails groupés, accès propriétaire ; TVA, dépenses et justificatifs, synthèse analytique, coût moyen et rentabilité par cheval, pointage bancaire automatique, export et accès expert-comptable ; facturation électronique (Peppol pour la Belgique) ; site internet.
- **Mobile** : utilisable « depuis votre téléphone » ; application native non confirmée [V].
- **Prix** [V] : 1,50 € HT/mois par cheval au montoir, 0,83 € HT/mois par cheval en pension, élevage ou retraite, calculé au jour près ; cavaliers illimités ; sans engagement ; essai de 30 jours.
- **Points forts** : meilleure profondeur financière (pointage bancaire, rentabilité par cheval) ; tarification à l'usage ; « plus de 100 écuries » revendiquées [V].
- **Points faibles** : FFE non mentionné [V] ; un seul avis de forum, neutre (février 2025) [V].
- **Import/export** : export comptable [V] ; import non trouvé.
- **Design perçu** : non évalué.
- Sources : [vitecurie.fr](https://vitecurie.fr/), [tarif](https://www.vitecurie.fr/tarif).

#### 2.8 Equicentre (ISI-LINE) — France

- **Cible** : centres équestres [V].
- **Modules** [V] : Montoir (reprises, stages, randonnées, concours, adhésions, licences, forfaits, cartes, passages, absences et rattrapages, assistant de montoir automatique, feuille de monte) ; Soins (registre, pension, commodat, mise au repos, maréchalerie, vaccins, déplacements) ; Rentabilité (revenus et coûts par activité et par équidé) ; Facturation (pensions automatiques, relances, export comptable) ; Communication (e-mails ciblés) ; Pédagogie (fiches de contenu, évaluation des acquis, programmation trimestrielle).
- **Mobile** : pas d'application native ; montoir sur tablette et smartphone via jaicheval.net (version 10) [V].
- **Prix** : non trouvé.
- **Points forts** : seul à combiner pédagogie structurée et rentabilité par équidé ; 15 témoignages de clubs nommés [V, publiés par l'éditeur].
- **Points faibles** : « pas facile de tout piger au début » — ln49, 2007, à propos d'« Equi-Centre » [V — Cheval Annonce] ; site avec coordonnées de gabarit non remplacées (numéro +1-800, adresse webriti.com) [V], signe d'un produit peu entretenu [S].
- **Import/export** : export comptable [V].
- Source : [logiciel-equicentre.fr](https://www.logiciel-equicentre.fr/).

#### 2.9 StillHorse (MLT Software) — France (Vendée)

- **Cible** : centres équestres ; application distincte pour cavaliers et propriétaires [V].
- **Modules** [V] : cavaliers, chevaux, planning et réservations, facturation et comptabilité, RH (fiches, horaires, salaires, congés), stocks (aliments, matériel, médicaments, commandes, fournisseurs), matériel et installations, communication, statistiques, documents et contrats. Capterra indique au contraire que facturation et dossiers médicaux ne sont pas inclus [V — contradiction à lever].
- **Mobile** : application adhérents et « StillHorse Manager » [V]. Application grand public (annoncée pour mars 2026) : gratuite, Premium 4,99 € TTC/mois, Gold 9,99 € TTC/mois avec coach IA et assistant « Horsy », SMS d'urgence, détection de chute [V ; V2 pour la détection de chute].
- **Prix** : 49 € HT/mois tout inclus, sans engagement, essai de 30 jours [V].
- **Points forts** : seul à annoncer RH, stocks et objets connectés (caméras sport, van, surveillance, montres) [V].
- **Points faibles** : aucun avis [V — Capterra] ; aucun nombre de clients ; FFE, paiement en ligne, export non mentionnés [V].
- Sources : [tarifs](https://www.stillhorse.fr/index.php?page=TARIF), [solution](https://www.stillhorse.fr/index.php?page=SOLUTION), [Capterra](https://www.capterra.com/p/10037837/StillHorse/).

#### 2.10 Nouveaux entrants (2024-2026)

| Produit | Ce qui est vérifié | Prix public | Source |
|---|---|---|---|
| **HoofPlanner** | Planning généré à partir des disponibilités des cavaliers, niveaux, charge des chevaux ; liste d'attente ; contrats ; devis et factures PDF ; import/export CSV de toutes les données ; web uniquement ; pas de paiement en ligne ni de FFE annoncés | 59 €/mois ou 590 €/an, tout illimité, essai 14 jours | [hoofplanner.fr](https://www.hoofplanner.fr/) |
| **Gecurie** | Chevaux, soins, registre PDF, cours, présences, factures et avoirs, remises en banque, export comptable, import Excel, export Excel et PDF ; web responsive ; un seul client témoin | 39 €/mois tout inclus, sans engagement | [gecurie.com](https://www.gecurie.com/) |
| **Cavalio** | Plan interactif des boxes, stocks, personnel, concours, créateur de parcours d'obstacles, exercices de carrière, PWA cavalier, accès intervenants sans compte (maréchal, ostéopathe), Factur-X ; réservation et paiement seulement dans l'offre haute ; migration faite par l'éditeur | 59 à 179 €/mois + 400 à 800 € de frais de lancement | [cavalio.fr](https://www.cavalio.fr/) |
| **Equestrions** (Enjoy'Up) | Planning, pensions, contrats, facturation, galops FFE, carnet de santé, balades GPS, alerte de chute, caméras et assistant vocal « selon l'offre » ; application Android (50+ téléchargements, sans note) | Non trouvé ; essai 60 jours | [equestrions.fr](https://equestrions.fr/), [Google Play](https://play.google.com/store/apps/details?id=fr.equestrions.app&hl=en_US) |
| **Ecurios** | Planning, soins et rappels au propriétaire, « coach intelligent », feuilles de présence qui facturent, rattrapages, Factur-X ; web | 19 €/mois (écurie), dès 29 €/mois (club) | [ecurios.fr](https://ecurios.fr/) |
| **Horsing Up** | Suivi cavaliers et chevaux, cours, événements, messagerie ; application mobile gratuite ; facturation et santé en modules sur devis | À partir de 50 €/mois (HT ou TTC selon la section) | [horsingup.com](https://www.horsingup.com/offre-de-gestion-equestre/) |
| **GestEquit / Mon Club Équitation** | Facturation électronique via la plateforme IOPOLE ; reste non documenté | Non trouvé | [gestequit.com](https://gestequit.com/) |
| **MonHaras** | Planning, pensions, demi-pensions avec annonces, élevage, paiement carte / virement / SEPA ; socle « gratuit à vie » | Grille non trouvée | [monharas.fr](https://monharas.fr/) |
| **Ekurie** | Pensions, prestations, planning, facturation, santé, équipe ; gratuit pour les cavaliers | Sans abonnement, commission de 5 à 300 €/mois [V2] | [ekurie.fr](https://ekurie.fr/), [Equirider](https://www.equirider.fr/logiciel-gestion-equestre/) |
| **Izidoor** (Rennes, multi-activités) | Réservation en ligne, acomptes, caisse, bons cadeaux, galops en prérequis, export comptable, Stripe | 19 à 749 € HT/mois selon le chiffre d'affaires, sans commission ; frais Stripe 1,5 % + 0,25 € | [izidoor.io](https://izidoor.io/activites/equitation) |
| **Horsio, Cavalisio, Equirol, MyStableOS** | Seulement cités par Equirider : Horsio 15 à 40 € ; Cavalisio 49 / 89 / 149 € HT ; Equirol 49,99 à 199,99 € HT ; MyStableOS 79 à 139 € | [V2] | [Equirider](https://www.equirider.fr/logiciel-gestion-equestre/) |

### B. Écuries de sport, élevage, courses (concurrents adjacents)

- **Equicty** — Belgique. Tableau digital remplaçant le tableau blanc, tâches d'équipe, santé, facturation (Peppol), assistant IA « Hoofy », 9 langues dont le français [V]. Prix : 30 € par utilisateur et par mois (offre Basic), version gratuite [V — Capterra]. Capterra : 4,7/5 sur 22 avis ; négatifs : « It was not possible to use it when offline », « There's no way to manage horse's feed program » [V]. App Store US : 1,8/5 sur 5 notes, problèmes de connexion [V]. Pas orienté cours ni adhérents [S]. Sources : [Capterra](https://www.capterra.com/p/160502/Equicty/), [App Store](https://apps.apple.com/us/app/equicty/id1155555430).
- **Equideclic : Groomy, Gynebase, Stallion CRM, Cryobank, O'Haras** — France. Élevage et étalonnage : lien SIRE, soins groupés, mouvements, ordonnances en photo, contrats de saillie, paillettes, facturation automatique [V]. Groomy sur iOS, Android et web ; « 6 000+ utilisateurs » [V2]. Prix sur devis. Ne gère pas les cours. Source : [equideclic.com](https://www.equideclic.com/en/solutions/logiciel.html).
- **Equitop (A.B.S.I., groupe Pigeon)** — France. Écuries de courses et de propriétaires : facturation au prorata des parts, SIRE par scan du livret, déplacements en course ; modules Élevage et Sport « bientôt disponibles » ; prix non publics [V]. Source : [equitop-solutions.com](https://www.equitop-solutions.com/).
- **Horsey** — France. Écuries (lots de travail, transport) ; seul éditeur trouvé avec **intégration Pennylane**, export **CSV et FEC** [V]. Prix non trouvés. Source : [horsey.fr](http://horsey.fr/).
- **Smart Jack, Kataklop (caméra au box), Equidocs** — cités par le Pôle Hippolia en 2023 [V2] ; non approfondis. Source : [Grand Prix](https://grandprix.info/fr/65184/La-rubrique-du-Pole-Hippolia--la-filiere-equine-a-lheure-du-numerique-partie-2--les-outils-daide-a-la-gestion-decurie/).
- **Hippovibe** — Allemagne, interface en français. Pensions et écuries de concours, dès 3 € par cheval et par mois [V]. Source : [hippovibe.io](https://www.hippovibe.io/).

### C. Pistes de départ non confirmées

| Nom fourni | Résultat |
|---|---|
| GCE / Gestion Centre Équestre | Non trouvé comme produit distinct |
| Horse-Manager | Site existant mais non consultable (robots.txt) ; « HorseManager » cité comme outil néerlandais par Equirider [V2] |
| Equideclic | Confirmé, mais orienté élevage (voir B) |
| Stable Up, Equiclic, Hop'Equi, Hippologic, Cheval Planner, CLUBéo | Non trouvés |
| Equisoft | Cité comme outil espagnol par Equirider [V2] ; pas d'acteur français trouvé |

**Suisse romande et Québec** : aucune solution locale francophone trouvée ; les recherches renvoient vers les éditeurs français (Equionline se déclare disponible en Suisse et en Belgique) et vers des outils anglophones (Stable Secretary, BarnManager, EC Pro). Deux marchés apparemment sans acteur natif francophone [S, recherche non exhaustive].

### D. Outils génériques utilisés à défaut

| Outil | Usage en club | Prix | Limites | Source |
|---|---|---|---|---|
| **Excel / Google Sheets / papier** | Feuilles de monte, listes de cavaliers, suivi des cartes | Gratuit | Pas de réservation, pas de facturation liée, erreurs de décompte [S] | — |
| **HelloAsso** | Adhésions, stages, billetterie, paiement en plusieurs fois | Gratuit pour l'association, financé par la contribution volontaire du payeur | Ni planning, ni présences, ni CRM, ni comptabilité ; plafond de 2 500 € avant validation du compte | [independant.io](https://independant.io/avis/helloasso/), [BeeNet](https://beenet.app/fr/blog/logiciel-gestion-club-sportif-gratuit/) ; exemples de clubs : [Orée du bois](https://www.helloasso.com/associations/ecurie-de-l-oree-du-bois/adhesions/adhesion-2026-2027-poney-club-ecurie-de-l-oree-du-bois-2-1) |
| **AssoConnect** | CRM membres, cotisations, comptabilité, site | Gratuit sous 30 membres ; offre complète sans grille publique | Aucune notion de cheval ni de reprise [S] | [BeeNet](https://beenet.app/fr/blog/logiciel-gestion-club-sportif-gratuit/) |
| **SimpliAsso** | Gestion d'association | 19 à 159 € TTC/mois selon le nombre d'adhérents [V2] | Idem | [Equirider](https://www.equirider.fr/logiciel-gestion-equestre/) |
| **MonClub** | Club sportif | 39,60 € TTC/mois de 100 à 250 adhérents (annuel) [V2] | Idem | [Equirider](https://www.equirider.fr/logiciel-gestion-equestre/) |
| **SportEasy, Planity** | Convocations d'équipe ; prise de rendez-vous | Non trouvé | Usage en club équestre non confirmé par les sources | — |

### E. Outils FFE

Source principale : guide Equirider (non officiel) et fiches App Store. Tarifs de licence et d'engagement : non trouvés. Existence d'une API ou de services web ouverts aux éditeurs tiers : non trouvée dans les sources publiques — mais Kavalog et Cavasoft se disent « agréés » et transmettent les licences, ce qui prouve qu'une voie technique existe [S].

- **SIF** : base centrale (licences, engagements, résultats, chevaux). Résultats disponibles 24 à 72 h après le concours [V2].
- **FFE Club SIF** : back-office du club (adhérents, prise et renouvellement de licences, galops, documents). « Non optimisé pour téléphone » : menus serrés, tableaux à défilement horizontal, lenteur [V2].
- **FFE Compet** : recherche de concours, engagements, listes de départ, résultats, classements ; côté organisateur, déclaration des concours et saisie des résultats [V2].
- **Application « FFE Compétition »** : résultats, concours à venir, performances, règlements. **1,8/5 sur 329 notes** ; « Pas possibilité de s'engager » (2018), « L'application crash souvent » (2024) ; dernière mise à jour le 18/05/2025 [V — [App Store](https://apps.apple.com/fr/app/ffe-comp%C3%A9tition/id1092492360)].
- **Application FFE généraliste** : actualités et recherche de clubs ; ne gère ni licences ni engagements [V2].
- Source : [Equirider — guide FFE SIF](https://www.equirider.fr/compte-ffe-sif-gestion-connexion/).

---

## 3. Matrice fonctionnalités × concurrents

Légende : ✓ annoncé par l'éditeur · partiel · ✗ absence constatée ou reprochée · ? non documenté. Rappel : rien n'a été testé.

### 3a. Acteurs installés

| Fonctionnalité | Kavalog | Equimondo | Cavasoft | Equionline | Céléris | Mes-écuries | VITEcurie | Equicentre |
|---|---|---|---|---|---|---|---|---|
| Planning des reprises / montoir | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Attribution des chevaux, charge de travail | ✓ | partiel | partiel | ? | ? | ✓ | ✓ | ✓ |
| Cartes et forfaits | ✓ | ✓ | ✓ | ? | ✓ | ✓ | ? | ✓ |
| Absences et rattrapages | ✓ | ? | ✓ | ? | ? | ✓ | ✓ | ✓ |
| Réservation en ligne par le cavalier | ✓ | ✓ | ✓ | partiel | ✓ | ✓ | ✓ | ? |
| Liste d'attente | ? | ✓ | ? | ? | ? | ? | ? | ? |
| Stages et événements | ✓ | ✓ | ✓ | ? | ✓ | ✓ | ✓ | ✓ |
| Paiement en ligne par carte | ✓ | ✓ | partiel | ✓ | ✓ | ✓ | ✓ | ? |
| Prélèvement SEPA | ? | ✓ | ? | ? | ✓ | ? | ✓ | ? |
| Facturation et devis | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pensions facturées automatiquement | ? | ✓ | ? | ✓ | ✓ | partiel | ✓ | ✓ |
| Facturation électronique (Factur-X / Peppol) | ? | ✓ | ? | ✓ | ✓ | ✓ | ✓ | ? |
| Export comptable | ? | ✓ | ? | partiel | ✓ | ✓ | ✓ | ✓ |
| Pointage bancaire, rentabilité par cheval | ? | ? | ? | ? | partiel | partiel | ✓ | ✓ |
| Licences FFE transmises depuis le logiciel | ✓ | ✗ | ✓ | ? | ? | ✗ | ? | ? |
| Import de données FFE | ✓ | ✓ | ✓ | ? | ? | ✓ | ? | ? |
| Engagement en concours FFE | ? | ? | ? | ? | ? | ? | ? | ? |
| Fiche cheval, soins, rappels | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registre d'élevage / SIRE | ✓ | ✓ | ✓ | ✓ | ? | ✓ | ✓ | ✓ |
| Suivi pédagogique, galops | ✗ | ✓ | ? | ? | ? | ? | ✓ | ✓ |
| RH : plannings du personnel | ? | ? | ✓ | ? | partiel | ? | partiel | ? |
| RH : paie, congés, contrats | ? | ? | ? | ? | ? | ? | ? | ? |
| Stocks (aliments, pharmacie) | ? | partiel | ? | ? | ? | ? | ✓ | ? |
| Entretien des installations | ? | ? | ? | ? | ? | ? | ? | ? |
| Site web du club | ? | ✓ | ✓ | ✓ | ✓ | ? | ✓ | ? |
| E-mails groupés | ? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SMS, notifications push | ? | ? | ? | ? | ? | ? | partiel | ? |
| Application native cavalier | ✓ | partiel | ✗ | ? | ✗ | ✓ | ? | ✗ |
| Application native gérant / moniteur | partiel | partiel | ✗ | ? | ✗ | ✓ | ? | partiel |
| Mode hors ligne | ? | ✗ | ? | ? | ? | ? | ? | ? |
| Caméras | ? | ? | ? | ? | ? | ? | ? | ? |
| IA | ? | partiel | ? | ? | ? | ? | partiel | ? |
| Import en libre-service (CSV / Excel) | ? | partiel | ? | ? | ? | partiel | ? | ? |
| Export complet des données | ? | ? | ? | ? | ? | ? | ? | ? |
| API publique | ? | ? | ? | ? | ? | ? | ? | ? |
| Prix public, sans engagement | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |

### 3b. Nouveaux entrants et adjacents

| Fonctionnalité | StillHorse | HoofPlanner | Gecurie | Cavalio | Equestrions | Equicty (BE) |
|---|---|---|---|---|---|---|
| Planning des reprises | ✓ | ✓ | ✓ | ✓ | ✓ | partiel |
| Planning généré automatiquement | ? | ✓ | ? | ? | ? | ? |
| Cartes, forfaits, rattrapages | ? | partiel | ? | ? | ? | ✗ |
| Réservation en ligne | ✓ | ✓ | partiel | partiel | ? | ? |
| Paiement en ligne | ? | ? | ? | partiel | ? | ? |
| Facturation | partiel | ✓ | ✓ | ✓ | ✓ | ✓ |
| Facturation électronique | ? | ? | ? | ✓ | ? | ✓ |
| Export comptable | ? | ? | ✓ | ? | ? | ? |
| Lien FFE | ? | ? | ? | ? | partiel | ✗ |
| Soins, registre | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pensions | ? | partiel | partiel | ✓ | ✓ | ✓ |
| Pédagogie | ? | ? | ? | partiel | partiel | partiel |
| RH (personnel, congés) | ✓ | partiel | ? | partiel | ? | partiel |
| Stocks | ✓ | ? | ? | ✓ | ? | ? |
| Plan des boxes | ? | ? | ? | ✓ | ? | ? |
| Concours | ? | partiel | partiel | ✓ | partiel | partiel |
| Application native | ✓ | ✗ | ✗ | partiel | ✓ | ✓ |
| Hors ligne | ? | ? | ? | ? | ? | ✗ |
| Caméras | partiel | ? | ? | ? | ✓ | ? |
| IA | partiel | ? | ? | ? | partiel | ✓ |
| Import / export CSV ou Excel | ? | ✓ | ✓ | ✓ | ? | ? |
| Prix public | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

---

## 4. Les 15 manques du marché

1. **Un lien FFE complet.** Deux éditeurs transmettent les licences ; aucun n'annonce l'engagement en concours, la validation des galops ni la synchronisation des résultats. L'application fédérale est à 1,8/5. → Licences, galops, engagements et résultats depuis Piaffe, dès le lancement ; c'est le critère d'achat qui protège Kavalog.
2. **Des applications mobiles natives de qualité.** Notes de 3,6/5 au mieux, mises à jour qui bloquent l'accès, paiement impossible sur mobile. → Deux applications (cavalier, équipe) soignées, avec notifications push.
3. **Le hors-ligne.** Equimondo le reconnaît : sans réseau, « la saisie se fait plus tard ». Les écuries captent mal. → Pointage, soins et feuille de monte utilisables sans réseau, synchronisés ensuite.
4. **La portabilité des données.** Presque personne ne documente d'export complet ; aucune API publique. → Import CSV/Excel/FFE en libre-service, export intégral en un clic, API documentée. Argument direct contre l'enfermement reproché à Kavalog.
5. **La transparence commerciale.** Engagement de 24 à 48 mois, frais de mise à disposition, prix sur devis. → Prix publics, mensuel sans engagement, pas de frais d'entrée.
6. **Une vraie RH.** Au mieux un planning du personnel. → Planning, pointage, congés, heures supplémentaires, contrats, export vers la paie, convention collective des centres équestres.
7. **Une comptabilité qui va au-delà de l'export.** Seul VITEcurie fait le pointage bancaire ; seul Horsey se connecte à Pennylane. → Rapprochement bancaire, TVA à taux multiples, FEC, connecteurs comptables, facturation électronique en émission et réception.
8. **Le bien-être et la charge de travail de la cavalerie.** Suivi des heures par cheval cité chez trois éditeurs, sans alerte. → Limites de charge par cheval, repos imposés, alertes au moment de composer la reprise, visibilité des chevaux de la reprise précédente (demande explicite d'un avis App Store).
9. **Un suivi pédagogique que les moniteurs utilisent.** Reproché à Kavalog, présent chez trois acteurs seulement. → Progression par galop, bilans de séance en dix secondes sur le téléphone, vidéo, visible par les parents.
10. **L'entretien des installations.** Aucun acteur ne le traite. → Carrières, clôtures, véhicules, matériel : tâches récurrentes, signalements avec photo, contrôles réglementaires.
11. **L'organisation de concours et d'événements par le club.** Seul Cavasoft va jusqu'aux résultats en direct. → Inscriptions, listes de départ, bénévoles, buvette, lien avec FFE Compet.
12. **Les caméras.** Seulement des promesses chez de nouveaux entrants. → Caméras de box et de carrière intégrées : surveillance de poulinage et de coliques, vidéo de séance rattachée au cavalier.
13. **Une IA utile plutôt que décorative.** Assistants génériques, analyse de photo. → Composition du montoir, relances d'impayés, détection d'anomalies de santé, saisie vocale des soins, réponses aux parents.
14. **Les intervenants extérieurs et les propriétaires.** Seul Cavalio donne un accès sans compte au maréchal ou à l'ostéopathe. → Accès invité pour vétérinaire, maréchal, dentiste ; espace propriétaire avec carnet de santé, factures et journal du cheval.
15. **La famille comme unité de base et la communication multicanale.** Comptes famille chez quelques-uns ; SMS et push presque jamais décrits. → Un payeur, plusieurs cavaliers, autorisations parentales, documents signés, messages par push, SMS et e-mail avec accusé de lecture.

Deux opportunités de marché en plus : **la Suisse romande et le Québec** n'ont pas d'acteur francophone natif repéré, et **la Belgique** impose déjà Peppol (VITEcurie et Equicty s'y positionnent).

---

## 5. Fonctionnalités que Piaffe doit avoir pour être à parité

Chaque ligne existe aujourd'hui chez au moins un concurrent cité.

### Cavaliers, familles, adhésions
- [ ] Fiche cavalier : identité, contact, responsable légal, personne à prévenir, niveau, galop
- [ ] Comptes famille : un payeur, plusieurs cavaliers, tiers payants (collectivités, comités d'entreprise)
- [ ] Cavaliers de passage
- [ ] Adhésions et cotisations avec relances de fin de période
- [ ] Inscription et réinscription en ligne
- [ ] Documents : certificat médical, autorisation parentale, signature électronique des contrats
- [ ] Licence FFE : prise, renouvellement, contrôle de validité, transmission à la FFE
- [ ] Import des adhérents depuis la FFE, Excel ou un ancien logiciel

### Planning, reprises, montoir
- [ ] Reprises récurrentes, cours particuliers, balades, stages, baby-poney, anniversaires
- [ ] Capacité par créneau et par carrière, conditions d'accès par niveau, âge ou adhésion
- [ ] Montoir : attribution des chevaux, assistant automatique, feuille de monte imprimable et à l'écran
- [ ] Charge de travail par cheval, mise au repos
- [ ] Pointage présence / absence, clôture de la reprise par le moniteur sur mobile
- [ ] Absences signalées par le cavalier, délai paramétrable, crédits de rattrapage
- [ ] Liste d'attente automatique
- [ ] Planning généré à partir des disponibilités
- [ ] Réservation des installations
- [ ] Agenda partagé, synchronisation de calendrier

### Offres commerciales
- [ ] Cartes d'heures individuelles et familiales avec décompte automatique
- [ ] Forfaits trimestriels et annuels, abonnements
- [ ] Prix variables selon l'âge ou l'adhésion
- [ ] Boutique en ligne (cartes, forfaits, stages), panier
- [ ] Bons cadeaux, acomptes
- [ ] Formulaires d'inscription personnalisables

### Chevaux et soins
- [ ] Fiche cheval : identité, SIRE, UELN, puce, propriétaire, statut (club, pension, commodat)
- [ ] Récupération des données SIRE / IFCE
- [ ] Soins : vaccins, vermifuges, maréchal, dentiste, ostéopathe, saisie groupée, rappels automatiques
- [ ] Blessures et traitements avec photos, ordonnances photographiées
- [ ] Registre d'élevage et registre des mouvements, export PDF
- [ ] Rations et consignes alimentaires
- [ ] Planification du travail, journal de monte
- [ ] Occupation et plan des boxes
- [ ] Gestation, poulinage (élevage)
- [ ] Accès des intervenants extérieurs

### Pensions et propriétaires
- [ ] Contrats de pension, demi-pension, mise au pair, signés en ligne
- [ ] Facturation mensuelle automatique avec suppléments variables
- [ ] Prélèvement automatique
- [ ] Espace propriétaire : factures, carnet de santé, planning du cheval
- [ ] Facturation au prorata des parts de copropriété

### Facturation, paiements, comptabilité
- [ ] Devis, factures, avoirs, factures d'acompte, numérotation conforme
- [ ] TVA à taux multiples, ventilation par prestation
- [ ] Conformité anti-fraude TVA (inaltérabilité, archivage)
- [ ] Facturation électronique : émission et réception (Factur-X, UBL, CII), Peppol
- [ ] Paiement en ligne par carte, prélèvement SEPA, lien de paiement
- [ ] Encaissement au comptoir : espèces, chèques, chèques vacances, coupons sport, TPE mobile
- [ ] Paiements échelonnés, remises en banque
- [ ] Relances automatiques d'impayés, liste des impayés
- [ ] Achats et factures fournisseurs, lecture automatique d'une facture photographiée
- [ ] Pointage bancaire automatique
- [ ] Export comptable (CSV, FEC), accès expert-comptable, connecteur comptable
- [ ] Tableau de bord : chiffre d'affaires par prestation, trésorerie, rentabilité par cheval et par activité

### Pédagogie
- [ ] Carnet de progression par cavalier, validé par le moniteur
- [ ] Objectifs et bilans de séance, notes de séance
- [ ] Parcours vers les galops, quiz de théorie
- [ ] Fiches de contenu de reprise, programmation trimestrielle
- [ ] Bibliothèque d'exercices, créateur de parcours d'obstacles

### Compétitions et événements
- [ ] Stages, concours, randonnées avec inscription en ligne et gestion des places
- [ ] Prestations additionnelles à l'inscription
- [ ] Événements qui bloquent le planning
- [ ] Résultats en direct pour les concours organisés
- [ ] Organisation des transports

### Équipe
- [ ] Rôles et permissions par fonction
- [ ] Plannings des salariés, disponibilités, absences, réassignation
- [ ] Répartition des tâches quotidiennes, tableau d'écurie numérique
- [ ] Fiches du personnel, congés
- [ ] Messagerie interne, historique des actions par utilisateur

### Stocks et matériel
- [ ] Stocks d'aliments, de compléments, de pharmacie
- [ ] Commandes et fournisseurs
- [ ] Suivi du matériel

### Communication
- [ ] E-mails groupés et ciblés, lettres d'information
- [ ] Notifications automatiques (confirmation, rappel, annulation)
- [ ] Message du cavalier au club
- [ ] Site web du club avec réservation intégrée, vue publique des événements

### Applications et portail
- [ ] Application cavalier iOS et Android : planning, réservation, annulation, cartes, factures, paiement, progression
- [ ] Application moniteur / gérant : planning du jour, pointage, soins, messages
- [ ] Un compte pour plusieurs clubs, bascule entre rôles
- [ ] Carnet de santé pour les propriétaires

### Données, sécurité, service
- [ ] Import CSV / Excel, migration assistée gratuite
- [ ] Export complet (CSV, Excel, PDF) à tout moment
- [ ] Hébergement en France, RGPD, sauvegarde quotidienne
- [ ] Essai gratuit sans carte, sans engagement
- [ ] Support par téléphone, e-mail et messagerie, formation en visio, tutoriels

### Options émergentes
- [ ] Assistant IA (rédaction, questions, analyse de photo)
- [ ] Caméras connectées
- [ ] Suivi GPS des balades, alerte de chute

---

## 6. Sources

**Sites des éditeurs**
- Equimondo : https://equimondo.fr/ · https://equimondo.fr/fonctionnalites.php · https://equimondo.fr/application-mobile-centre-equestre.php · https://www.equimondo.com/
- Cavasoft : https://cavasoft.fr/solution · https://cavasoft.fr/clients · https://pc-des-ecureuils.cavasoft.fr/assets/guide-cavalier.pdf
- Equionline : https://www.equionline.fr/ · https://www.equionline.fr/tarifs · https://www.equionline.fr/structure/centre-equestre
- Céléris : https://www.gestion-equestre-celeris.fr/
- Mes-écuries.com : https://www.mes-ecuries.com/
- VITEcurie : https://vitecurie.fr/ · https://www.vitecurie.fr/tarif
- Equicentre : https://www.logiciel-equicentre.fr/
- StillHorse : https://www.stillhorse.fr/index.php?page=TARIF · https://www.stillhorse.fr/index.php?page=SOLUTION
- HoofPlanner : https://www.hoofplanner.fr/
- Gecurie : https://www.gecurie.com/
- Cavalio : https://www.cavalio.fr/
- Equestrions : https://equestrions.fr/
- Ecurios : https://ecurios.fr/
- Horsing Up : https://www.horsingup.com/logiciel-de-gestion-pour-centre-equestre/ · https://www.horsingup.com/offre-de-gestion-equestre/
- GestEquit : https://gestequit.com/
- MonHaras : https://monharas.fr/
- Ekurie : https://ekurie.fr/
- Izidoor : https://izidoor.io/activites/equitation
- Equideclic : https://www.equideclic.com/en/solutions/logiciel.html
- Equitop : https://www.equitop-solutions.com/
- Horsey : http://horsey.fr/
- Hippovibe : https://www.hippovibe.io/
- Kavalog (non consultable ; titres de pages seulement) : https://www.kavalog.com/ · https://www.kavalog.com/2024/09/04/teletransmission-ffe-optimisez-la-gestion-des-licences-cavaliers-avec-kavalog/ · https://www.kavalog.com/2021/06/16/le-paiement-en-ligne-accessible-des-la-gamme-basic-de-kavalog/ · https://www.kavalog.com/2023/05/03/lapplication-ikavalog-disponible-avec-les-offres-start-et-basic/

**Stores d'applications**
- Kavalog Espace Cavalier (Google Play) : https://play.google.com/store/apps/details?id=fr.aexae.ikavalog&hl=en_US
- iKavalog (App Store FR) : https://apps.apple.com/fr/app/ikavalog/id1074608107
- iKavalog-Moniteur : https://apps.apple.com/fr/app/ikavalog-moniteur/id6748355529
- Mes-écuries.com : https://apps.apple.com/gh/app/mes-ecuries-com/id6476379250
- Equestrions : https://play.google.com/store/apps/details?id=fr.equestrions.app&hl=en_US
- Equicty : https://apps.apple.com/us/app/equicty/id1155555430
- FFE Compétition : https://apps.apple.com/fr/app/ffe-comp%C3%A9tition/id1092492360

**Avis, forums, annuaires**
- Cheval Annonce, « logiciels de gestion de centre équestre » (2007-2025) : https://www.chevalannonce.com/forums-65806-logiciels-de-gestion-de-centre-equestre
- Cheval Annonce, « Recherche logiciel de gestion centre équestre » (2019-2025) : https://www.chevalannonce.com/forums-12007154-recherche-logiciel-de-gestion-centre-equestre
- Cheval Annonce, « Site web de gestion de centre équestre » (2012) : https://www.chevalannonce.com/forums-5725493-site-web-de-gestion-de-centre-equestre?p=1
- Trustpilot Cavasoft : https://fr.trustpilot.com/review/cavasoft.fr
- Capterra : https://www.capterra.fr/directory/30570/horse/software · https://www.capterra.fr/software/1033887/equimondo · https://www.capterra.fr/software/1015367/equionline · https://www.capterra.com/p/160502/Equicty/ · https://www.capterra.com/p/10037837/StillHorse/
- Equids (annuaire) : https://www.equids.com/fr/logiciel-app-metier-cheval

**Comparatifs et presse**
- Equirider, comparatif 2026 (média indépendant, relevé de prix du 11/10/2026) : https://www.equirider.fr/logiciel-gestion-equestre/
- Equirider, guide FFE SIF : https://www.equirider.fr/compte-ffe-sif-gestion-connexion/
- Grand Prix / Pôle Hippolia (24/02/2023) : https://grandprix.info/fr/65184/La-rubrique-du-Pole-Hippolia--la-filiere-equine-a-lheure-du-numerique-partie-2--les-outils-daide-a-la-gestion-decurie/
- HelloAsso : https://independant.io/avis/helloasso/ · https://beenet.app/fr/blog/logiciel-gestion-club-sportif-gratuit/

**Sources écartées pour manque de fiabilité** : logiciels.pro (classe Kavalog en « pet sitting », annonce une offre gratuite et un hébergement aux États-Unis sans preuve) et societe.tech (annonce Equionline à 42,99 € par licence, en contradiction avec le site de l'éditeur). Leurs chiffres ne sont repris qu'avec la mention [V2, fiabilité faible].

**À faire pour compléter** : démo Kavalog (grille de prix, durée d'engagement, modules), démo Céléris (prix), vérification auprès de la FFE des conditions d'agrément des logiciels tiers, test en main des cinq premiers concurrents, lecture des avis Google Play d'Equimondo (page non accessible lors de cette recherche).
