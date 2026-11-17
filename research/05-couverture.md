# 05 — Couverture de la démo Piaffe : parité concurrents, demandes du client, manques à construire

Date : mardi 17 novembre 2026. Périmètre : les 52 écrans de `demo/modules/*.js` (10 lots), `core/data.js` et `core/engine.js`.

**Méthode.** La démo a été assemblée (`node tools/build.js --out=cov`) et ouverte dans Chromium (Playwright). Chaque écran a été affiché, chaque onglet cliqué, et le texte rendu a été relevé (52 écrans, aucune erreur console). Les fonctions cachées dans les feuilles (`P.sheet`) ont été vérifiées par recherche dans le code source. Les chiffres de la section 4 viennent du texte réellement affiché et de `window.DATA`.

**Limite.** Les feuilles et les actions n'ont pas toutes été ouvertes une à une : « Couvert » veut dire « l'écran ou la feuille existe et affiche la fonction », pas « chaque bouton a été testé ».

**Verdict en trois lignes.**
- La parité fonctionnelle avec les concurrents est très largement atteinte : sur les 85 lignes du tableau de parité (certaines lignes de la liste d'origine sont regroupées), 57 sont couvertes, 21 partielles, 7 absentes.
- Deux demandes explicites du client ne sont pas tenues : **« chacun peut déclarer quel cheval il a »** (aucun parcours de déclaration côté adhérent) et **« onboarding de bout en bout »** (seule la mise en route du gérant existe ; rien pour l'adhérent, l'employé, le coach).
- Le risque le plus visible en démonstration n'est pas un manque, ce sont les **incohérences de chiffres entre écrans** (section 4) : horaire de passage de Léa, solde de Léa, 40 chevaux pour 44 boxes occupés, reprise complète d'un côté et à 6/8 de l'autre.

Légende : **Couvert** (écran et endroit) · **Partiel** (ce qui manque) · **Absent**.

---

## 1. Couverture face aux concurrents

### 1.1 Liste de parité (01, section 5)

#### Cavaliers, familles, adhésions

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Fiche cavalier (identité, contact, responsable légal, personne à prévenir, niveau, galop) | Couvert | `adherent` (Vue d'ensemble), `adh-profil` (Profil) |
| Comptes famille, un payeur, tiers payants | Partiel | Famille et payeur : `adherents` (vue Familles), `adh-profil` (Famille, « Ajouter un tiers payeur »). Manque : la facturation réelle à un tiers (CSE, mairie) avec répartition, côté `facturation` |
| Cavaliers de passage | Absent | Seul « Client de passage » existe à la caisse (`boutique`). Pas de fiche ni de licence vacances pour un cavalier ponctuel |
| Adhésions et cotisations avec relances de fin de période | Absent | Aucune cotisation annuelle distincte du forfait ; aucune relance de fin d'adhésion |
| Inscription et réinscription en ligne | Partiel | Inscription : `adherents` (inscriptions en ligne à valider, formulaire public). Réinscription : seulement un taux dans `rapports` (Fidélité), aucune campagne |
| Documents : certificat, autorisation parentale, signature électronique | Couvert | `adherent` (Contrats et documents), `contrats`, `adh-contrats`, `adh-profil` (Licence et santé) |
| Licence FFE : prise, renouvellement, validité, transmission | Couvert | `adherents` (licences en lot, 139 sur 148), `adh-profil` (renouvellement automatique) |
| Import des adhérents depuis FFE, Excel, ancien logiciel | Couvert | `import` (Kavalog, Equimondo, Excel, FFE Club SIF, photo) |

#### Planning, reprises, montoir

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Reprises récurrentes, cours particuliers, balades, stages, baby-poney, anniversaires | Couvert | `planning` (Créer : reprise, stage, cours particulier, balade), `boutique` (Anniversaires et événements) |
| Capacité par créneau et par carrière, conditions d'accès | Partiel | Capacité et niveau : feuille Créer de `planning`. Manque : condition d'âge et condition d'adhésion |
| Montoir, assistant automatique, feuille de monte | Couvert | `planning` (feuille d'une reprise, onglet Montoir et appel, « Attribuer automatiquement », « Feuille de monte ») |
| Charge de travail par cheval, mise au repos | Couvert | `planning` (alerte « 3 reprises ce jour, limite atteinte »), `cheval` (Travail), `rapports` (Chevaux) |
| Pointage présence, clôture par le moniteur sur mobile | Couvert | `emp-jour` (profil Hugo : appel, « Clôturer l'appel »), `planning` (Montoir et appel) |
| Absences signalées par le cavalier, délai, crédits de rattrapage | Couvert | `adh-accueil` (« Signaler une absence »), `adh-reserver` (Rattrapage), `planning` (Rattrapages à placer), `reglages` (Réservation et annulation) |
| Liste d'attente automatique | Couvert | `planning` (option à la création, onglet Attente), `adh-reserver`, `reglages` (place tenue 2 h) |
| Planning généré à partir des disponibilités | Absent | Aucun générateur de planning de saison ou de semaine |
| Réservation des installations | Partiel | Vu du gérant : `planning` (Jour par piste), `coachs` (Agenda des pistes). Manque : un propriétaire ne peut pas réserver une piste ou le rond de longe depuis `adh-reserver` |
| Agenda partagé, synchronisation de calendrier | Couvert | `adh-reserver` (« Synchroniser avec mon agenda »), `coach-agenda`, `connecteurs` (ICS, Google, Outlook) |

#### Offres commerciales

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Cartes d'heures individuelles et familiales, décompte automatique | Partiel | Carte individuelle : `adh-reserver`, `adh-paiements` (« Recharger »), `facturation` (Échéanciers et cartes). Manque : carte partagée par la famille |
| Forfaits trimestriels et annuels, abonnements | Couvert | `reglages` (Tarifs et forfaits), `facturation` |
| Prix variables selon l'âge ou l'adhésion | Partiel | Seul le tarif adhérent ou extérieur d'un stage existe (`boutique`). Pas de grille par âge |
| Boutique en ligne, panier | Partiel | Gérant : `boutique` (Sellerie, Caisse avec panier, Page publique). Manque : aucun écran d'achat côté adhérent (ni sellerie, ni forfait, ni panier) |
| Bons cadeaux, acomptes | Couvert | `boutique` (Cartes cadeaux ; acompte de 30 % sur les stages et anniversaires) |
| Formulaires d'inscription personnalisables | Partiel | Un formulaire public existe (lien copiable dans `adherents`). Manque : l'éditeur de champs |

#### Chevaux et soins

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Fiche cheval : identité, SIRE, UELN, puce, propriétaire, statut | Partiel | `cheval`, `chevaux`. Manque : statuts « commodat » et « mise au pair » (trois statuts seulement : propriétaire, club, demi-pension) |
| Récupération des données SIRE / IFCE | Couvert | `chevaux` (« Ajouter un cheval avec son numéro SIRE »), `import` |
| Soins, saisie groupée, rappels automatiques | Couvert | `soins` (Calendrier, Rappels, Tournées), `emp-soins` |
| Blessures et traitements avec photos, ordonnances | Couvert | `cheval` (Santé, points sur le cheval 3D), `soins` (Pharmacie et registre), assistant (lecture d'une ordonnance photographiée) |
| Registre d'élevage et des mouvements, export PDF | Couvert | `cheval` (Santé), `soins` (Pharmacie et registre), `emp-soins` (Registre) |
| Rations et consignes alimentaires | Couvert | `alimentation` (Plan de rationnement, Tableau de distribution) |
| Planification du travail, journal de monte | Couvert | `cheval` (Travail, Journal partagé), `adh-cheval` (Journal) |
| Occupation et plan des boxes | Couvert | `ecurie3d` (Occupation, vues Perspective et Dessus, mode constructeur) |
| Gestation, poulinage | Absent | Aucun suivi de reproduction |
| Accès des intervenants extérieurs | Couvert | `cheval` (accès invité vétérinaire), `soins` (Tournées, lien invité praticien), `cameras` (lien temporaire) |

#### Pensions et propriétaires

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Contrats de pension, demi-pension, mise au pair, signés en ligne | Partiel | Pension et demi-pension : `pensions`, `contrats`, `adh-contrats`. Manque : mise au pair |
| Facturation mensuelle automatique avec suppléments | Couvert | `pensions` (Pensions du mois, à la carte), `facturation` (Facturation du mois) |
| Prélèvement automatique | Couvert | `facturation`, `adh-paiements` (mandat SEPA) |
| Espace propriétaire : factures, carnet de santé, planning | Couvert | `adh-cheval`, `adh-paiements` |
| Facturation au prorata des parts de copropriété | Absent | Un cheval n'a qu'un seul propriétaire |

#### Facturation, paiements, comptabilité

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Devis, factures, avoirs, acomptes, numérotation conforme | Partiel | Factures, avoirs, acomptes : `facturation`. Manque : les devis |
| TVA à taux multiples | Couvert | `facturation` (TVA et facture électronique), `compta` (TVA) |
| Conformité anti-fraude TVA | Partiel | Écritures et registre non modifiables. Manque : clôture de caisse journalière et attestation du logiciel de caisse dans `boutique` (Caisse) |
| Facturation électronique, émission et réception | Couvert | `facturation` (TVA et facture électronique), `connecteurs` (plateforme agréée, Chorus Pro) |
| Carte en ligne, SEPA, lien de paiement | Couvert | `facturation` (Encaissements), `adh-paiements` |
| Comptoir : espèces, chèques, chèques-vacances, coupons, TPE | Couvert | `boutique` (Caisse), `facturation` (Encaissements) |
| Paiements échelonnés, remises en banque | Couvert | `facturation` (Échéanciers et cartes ; bordereau de remise de chèques) |
| Relances automatiques, liste des impayés | Couvert | `facturation` (Relances), `cockpit`, assistant |
| Achats, factures fournisseurs, lecture d'une photo | Couvert | `compta` (Justificatifs) |
| Pointage bancaire automatique | Couvert | `compta` (Banque) |
| Export comptable, accès expert-comptable, connecteur | Couvert | `compta` (Exports et expert-comptable), `connecteurs` |
| Tableau de bord : CA par prestation, trésorerie, rentabilité | Couvert | `rapports` (Activités, Chevaux), `compta` (Trésorerie), `cheval` (Coûts) |

#### Pédagogie

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Carnet de progression validé par le moniteur | Couvert | `adh-progression`, `adherent` (Progression), `coach-eleves` |
| Objectifs, bilans et notes de séance | Couvert | `coach-eleves`, `planning` (onglet Séance : thème et notes), `adh-progression` |
| Parcours vers les galops, quiz de théorie | Partiel | Parcours des galops : `adh-progression`. Manque : le quiz |
| Fiches de contenu de reprise, programmation trimestrielle | Partiel | Thème par séance seulement. Manque : la programmation sur un trimestre |
| Bibliothèque d'exercices, créateur de parcours d'obstacles | Absent | |

#### Compétitions et événements

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Stages, concours, randonnées, inscription en ligne | Couvert | `boutique`, `competitions`, `adh-reserver` (Stages), `adh-concours` |
| Prestations additionnelles à l'inscription | Couvert | `boutique` (options de stage), `competitions` (Frais) |
| Événements qui bloquent le planning | Couvert | `planning` (Vacances et fériés, créneau d'entretien de piste) |
| Résultats en direct pour les concours organisés | Couvert | `competitions` (Hunter Club : Chronométrage, résultats en direct sur le portail) |
| Organisation des transports | Couvert | `competitions` (Qui emmène qui), `adh-concours` |

#### Équipe, stocks, communication

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Rôles et permissions par fonction | Couvert | `reglages` (Rôles et permissions), `equipe` (Droits d'accès) |
| Plannings, disponibilités, absences, réassignation | Couvert | `equipe` (Planning, Congés et absences), `emp-planning` (échanges) |
| Répartition des tâches, tableau d'écurie numérique | Partiel | Tâches : `emp-jour`, `entretien`. Le tableau d'écurie s'imprime (`alimentation`), mais « Écran de la sellerie » n'affiche qu'un message : pas de vue murale |
| Fiches du personnel, congés | Couvert | `equipe` (Salariés, Congés, Documents et entretiens), `emp-conges` |
| Messagerie interne, historique des actions | Couvert | `emp-messages`, `equipe` (journal des actions), `assistant` (Journal) |
| Stocks d'aliments, compléments, pharmacie | Couvert | `alimentation` (Stocks et prévisions), `entretien` (Stocks), `soins` (Pharmacie) |
| Commandes et fournisseurs | Couvert | `alimentation`, `entretien` |
| Suivi du matériel | Couvert | `entretien` (Matériel et véhicules) |
| E-mails groupés et ciblés, lettres d'information | Couvert | `communication` (Envois groupés) |
| Notifications automatiques | Couvert | `reglages` (Notifications), `adh-profil` (Notifications) |
| Message du cavalier au club | Couvert | `adh-messages` |
| Site web du club avec réservation, vue publique | Partiel | `boutique` (Page publique). Manque : le bloc de réservation à intégrer dans un site existant |

#### Applications, données, service, options émergentes

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Application cavalier complète | Couvert | Les 11 écrans `adh-*` |
| Application moniteur et gérant | Couvert | `emp-*`, onglets du gérant sur téléphone |
| Un compte pour plusieurs clubs, bascule entre rôles | Partiel | Le coach voit 3 écuries (`coach-eleves`). Manque : bascule de club pour un adhérent ou un gérant ; multi-sites cité seulement dans l'offre « Réseau » |
| Carnet de santé pour les propriétaires | Couvert | `adh-cheval` (Soins, PDF) |
| Import CSV / Excel, migration assistée gratuite | Couvert | `import` |
| Export complet à tout moment | Partiel | Un bouton dans la feuille d'abonnement (`reglages`) et l'export RGPD par adhérent. Manque : une section visible « Exporter toutes mes données » |
| Hébergement en France, RGPD, sauvegarde quotidienne | Partiel | Hébergement et RGPD : `reglages` (Sécurité et RGPD). La sauvegarde quotidienne n'est écrite nulle part |
| Essai gratuit, sans engagement | Partiel | Trois offres à prix public dans `reglages` (Abonnement). « Sans engagement » et « essai gratuit » ne sont pas écrits |
| Support téléphone, e-mail, messagerie, visio, tutoriels | Partiel | « Marion vous accompagne » dans `import`. Manque : centre d'aide et tutoriels |
| Assistant IA (rédaction, questions, analyse de photo) | Couvert | `assistant`, panneau flottant dans les quatre vues |
| Caméras connectées | Couvert | `cameras`, `adh-cheval` (Caméra du box) |
| Suivi GPS des balades, alerte de chute | Absent | |

### 1.2 Les 15 manques du marché (01, section 4)

| # | Manque | État | Où, ou ce qui manque |
|---|---|---|---|
| 1 | Lien FFE complet | Partiel | Licences : couvert. Engagements : `competitions` prépare tout mais renvoie vers FFE Compet (choix assumé à l'écran). Manque : import des résultats FFE et validation des galops transmise à la FFE |
| 2 | Applications mobiles de qualité | Couvert | Vues téléphone des quatre rôles, notifications |
| 3 | Hors-ligne | Partiel | `emp-tournee` et bandeau hors ligne de l'employé. Manque : l'appel du moniteur et la vue coach |
| 4 | Portabilité des données | Couvert | `import`, export, `connecteurs` (API documentée) ; voir l'export complet ci-dessus |
| 5 | Transparence commerciale | Partiel | Prix affichés, mais paliers par nombre de boxes et aucune mention « sans engagement » |
| 6 | Vraie RH | Couvert | `equipe` (7 onglets, convention IDCC 7026, export Payfit et Silae), `emp-pointage`, `emp-conges` |
| 7 | Comptabilité au-delà de l'export | Couvert | `compta` (7 onglets) |
| 8 | Bien-être et charge de la cavalerie | Couvert | `planning` (alerte au montoir), `cheval` (Travail), `rapports` (Chevaux) |
| 9 | Suivi pédagogique utilisé | Couvert | `coach-eleves` (notes, vidéos), `adh-progression`, vue parent |
| 10 | Entretien des installations | Couvert | `entretien` (4 onglets), `emp-signaler` |
| 11 | Organisation de concours par le club | Couvert | `competitions` (Hunter Club : épreuves, bénévoles, buvette, chronométrage) |
| 12 | Caméras | Couvert | `cameras` (direct, événements, règles), séance filmée dans `coach-eleves` |
| 13 | IA utile | Couvert | Montoir automatique, relances, alerte colique, dictée, automatisations |
| 14 | Intervenants extérieurs et propriétaires | Couvert | Accès invité (`cheval`, `soins`), `adh-cheval` |
| 15 | Famille et communication multicanale | Couvert | `adh-profil` (Famille), `communication` (push, SMS, e-mail, WhatsApp, « Lu par ») |

### 1.3 Les 20 idées internationales (02, section 4)

| # | Idée | État | Où, ou ce qui manque |
|---|---|---|---|
| 1 | Chevaux et utilisateurs illimités, prix simple | Partiel | Les offres de `reglages` sont limitées par nombre de boxes (20, 60) |
| 2 | Gratuité pour associations et équithérapie | Absent | |
| 3 | Alerte « une place s'est libérée » | Couvert | `adh-profil` (Notifications), `reglages`, assistant |
| 4 | Cheval favori visible à l'attribution | Absent | Seuls les coachs et les annonces peuvent être mis en favori |
| 5 | Charge du cheval visible, plafond, alerte | Couvert | `planning`, `cheval` (Travail), `adh-cheval` (7 h sur 16) |
| 6 | Compte famille, enfants sans e-mail | Couvert | `adh-profil` (Famille, « Voir son espace », personnes autorisées à venir chercher l'enfant) |
| 7 | Annulation dans les délais = crédit | Couvert | `adh-reserver`, `reglages` |
| 8 | Acompte, paiement en plusieurs fois | Couvert | `adh-paiements` (« En 3 fois sans frais »), `facturation` |
| 9 | Répartir une charge sur plusieurs factures | Partiel | La part de demi-pension est déduite de la pension. Manque : la copropriété |
| 10 | QR code sur la porte du box | Couvert | `cheval` (QR du box), `emp-jour` (« Scanner ») |
| 11 | Écran tactile d'écurie, lecteur de puce | Absent | Voir « tableau d'écurie numérique » ; aucune lecture de puce |
| 12 | Transfert de la fiche au nouveau propriétaire | Couvert | `cheval` (lien de transfert) |
| 13 | Lecture par IA des analyses de fourrage et étiquettes | Absent | `alimentation` calcule la ration mais ne lit ni étiquette ni analyse |
| 14 | Coach IA nourri par les séances | Partiel | L'assistant adhérent répond sur le coach et les réservations. Pas de conseil d'entraînement tiré des séances et du capteur |
| 15 | Sécurité en extérieur, alerte d'immobilité | Absent | |
| 16 | Commission seulement sur le premier achat | Partiel | `coachs` (Reversements : commission, forfait de passage, droit de piste). La règle « premier achat seulement » n'existe pas |
| 17 | Tarif dynamique des créneaux creux | Absent | |
| 18 | Application à la marque du club | Couvert | `reglages` (Identité du club : logo, six teintes du portail) |
| 19 | API publique documentée, webhooks | Couvert | `connecteurs` (API et webhooks, exemples cURL, JavaScript, Python) |
| 20 | MCP avec droits et journal | Couvert | `connecteurs` (Serveur MCP : 36 outils, permissions par rôle, garde-fous, journal) |

### 1.4 Moments waouh et personnalisation (04, sections 5 et 6)

| Élément | État | Où, ou ce qui manque |
|---|---|---|
| Waouh 1 à 9, 11 à 13, 15, 16, 18, 19, 21 à 24 | Couvert | Palette ⌘K, tournée à balayer, signature au doigt, résumé du matin, pointage par appui maintenu, annulation, compteurs, strass, glisser-déposer, assistant qui exécute, signalement, frise des soins, plan, journal du cheval, facturation en un geste, progression, plan 3D, caméras, cheval 3D, charge de travail |
| 10. Réservation en 3 appuis avec portefeuille mobile | Partiel | Carte poinçonnée présente. Manque : Apple Pay ou Google Pay |
| 14. Anneaux de santé qui se vident | Partiel | Présents dans `adh-cheval`. Absents de la fiche `cheval` du gérant |
| 17. Appel par balayage et chronomètre plein écran | Partiel | « Démarrer le cours » dans `coach-agenda`, appel dans `emp-jour`. Pas de chronomètre plein écran |
| 20. Activité en direct sur l'écran verrouillé | Absent | |
| 25. Mode kiosque de la sellerie | Absent | Un message seulement |
| Perso 1 à 3. Modèles, modules activables, édition sur place | Couvert | `reglages` (Modules et vues, trois modèles), « Personnaliser » sur `cockpit` et `adh-accueil` |
| Perso 5 et 6. Épingler partout, vues enregistrées | Absent | |
| Perso 7. Quatre actions rapides sur téléphone | Partiel | `adh-accueil`. Rien de réglable pour l'employé ni le coach |
| Perso 8. Raccourcis clavier documentés | Absent | Seuls ⌘K et Échap existent |
| Perso 9. Thème, teinte, densité | Partiel | Clair, sombre, système et teinte du portail. Manque : teinte personnelle et densité compacte |

---

## 2. Demandes explicites du client

| Demande | État | Où, ou ce qui manque |
|---|---|---|
| Écuries | Couvert | `ecurie3d` (plan, mode constructeur), `cameras`, `entretien` |
| Chevaux | Couvert | `chevaux`, `cheval` (7 onglets, cheval 3D) |
| Chacun peut déclarer quel cheval il a | **Absent** | Aucun bouton « Déclarer un cheval » dans la vue adhérent. Ulysse est donné d'office à Léa. Rien non plus pour un coach ou un employé qui a son propre cheval |
| Vues gérant, employé, adhérent, coach | Couvert | Sélecteur de rôle dans la barre de démo ; 23, 9, 11 et 6 écrans |
| Les adhérents créent des demi-pensions | Partiel | `adh-demipension` : annonce d'Ulysse déjà publiée, modification, candidats, contrat, planning partagé, recherche d'une demi-pension. Manque : le parcours « créer une annonce » depuis zéro |
| Les adhérents regardent leur cheval | Couvert | `adh-cheval` (caméra du box en direct, journal, « Sa journée »), `adh-accueil` |
| Ultra personnalisable : l'adhérent choisit | Couvert | `adh-profil` (Personnalisation : écrans masqués, blocs de l'accueil, apparence, profil à l'ouverture) |
| Ultra personnalisable : le gérant choisit ses fonctionnalités | Couvert | `reglages` (Modules et vues pour les quatre rôles, modèles) |
| Personnalisation pour l'employé et le coach | Partiel | Le gérant peut masquer leurs écrans, mais eux n'ont aucun réglage personnel |
| Compétitions : qui emmène qui, coachs | Couvert | `competitions` (Qui emmène qui en glisser-déposer), `adh-concours`, `coach-concours` |
| Partie coach : réserver un coach, réserver en ligne | Couvert | `adh-coachs`, `adh-reserver` (Cours particuliers), `coach-dispo` (page publique), `coachs` (gérant) |
| Signer des contrats | Couvert | `contrats`, `adh-contrats` (signature au doigt), `emp-conges` (documents) |
| Comptabilité | Couvert | `compta`, `facturation` |
| RH | Couvert | `equipe`, `emp-pointage`, `emp-planning`, `emp-conges` |
| Entretien | Couvert | `entretien`, `emp-signaler` |
| Tous les assistants IA | Partiel | Assistant dans les quatre vues (panneau flottant), écran complet pour le gérant avec automatisations et journal. Les vues adhérent, employé et coach n'ont que 4 à 6 sujets chacune et pas de dictée visible |
| MCP : connecter toute l'écurie à l'IA | Couvert | `connecteurs` (Serveur MCP) |
| Connecteurs vers tous les logiciels | Couvert | `connecteurs` (Catalogue, 70 connecteurs). Manquent seulement FFE Connect et Equionline, cités dans 03 |
| API | Couvert | `connecteurs` (API et webhooks) |
| Onboarding de bout en bout | **Partiel** | `import` : mise en route du club en 8 étapes et reprise de données en 5 étapes. Manque : le premier lancement d'un club neuf (les trois questions de 04 §6.2), et l'arrivée d'un adhérent, d'un employé et d'un coach |
| Reprise des données des logiciels existants | Couvert | `import` |
| Téléphone et tablette | Couvert | Sélecteur d'appareil ; mise en page par requêtes de conteneur |
| Icônes sur mesure | Couvert | `core/icons.js` (jeu maison, environ 170 icônes) |
| Motion design | Couvert | Cascade, compteurs, strass, 3D, glisser-déposer, visite guidée en 12 étapes |

---

## 3. Manques à construire

Chaque ligne est une consigne. Le fichier à modifier est entre parenthèses. Rien de ce qui existe déjà n'est listé.

### P0 — indispensable pour la démo

1. **Déclarer son cheval, côté adhérent** (`80-adherent.js`). Dans `adh-cheval`, ajouter en tête un sélecteur de cheval et un bouton « Déclarer un cheval ». Il ouvre une feuille en 3 étapes : saisie du numéro SIRE ou du nom avec fiche préremplie depuis l'IFCE (nom, race, robe, année, puce) ; lien avec le cheval (propriétaire, copropriétaire, demi-pensionnaire, cavalier habituel d'un cheval de club) ; hébergement (en pension aux Tilleuls avec demande de box, ou hébergé ailleurs et de passage). À la fin : toast « Déclaration envoyée à Claire », et le cheval apparaît dans le sélecteur avec la pastille « En attente de validation ». Ajouter la même entrée dans `adh-profil` (onglet Profil, carte « Mes chevaux ») et une action de palette « Déclarer un cheval ».
2. **Valider les chevaux déclarés, côté gérant** (`30-chevaux.js`). Dans `chevaux`, ajouter un bandeau « 2 chevaux déclarés par des adhérents à valider » qui ouvre une feuille : identité relue, propriétaire, box proposé, boutons « Valider et créer la fiche » et « Demander une précision ». Le compteur doit correspondre à la déclaration faite en 1.
3. **Déclarer son cheval, côté coach** (`70-coach-compet.js`). Dans `coach-profil`, ajouter une carte « Mes chevaux » (un cheval déjà déclaré, bouton « Déclarer un cheval », même feuille courte : SIRE, écurie d'accueil).
4. **Arrivée d'un adhérent de bout en bout** (`80-adherent.js`). Ajouter un écran caché `adh-bienvenue`, ouvert par un bouton « Revoir mon arrivée » dans `adh-profil` : invitation reçue du club, création du compte, famille (ajout d'un enfant sans e-mail), cheval (renvoi vers la feuille du point 1), licence et certificat, mandat SEPA, signature du règlement au doigt, choix des écrans et des notifications. Une barre de progression en 7 étapes ; chaque étape se valide et affiche un toast.
5. **Premier lancement d'un club neuf** (`95-plateforme.js`). Dans `import`, ajouter un bouton « Rejouer l'arrivée d'un nouveau club » qui ouvre une feuille large : trois questions (type : club, pension, élevage, mixte ; nombre de chevaux ; modules souhaités), puis l'aperçu du menu obtenu, puis « Appliquer » qui règle `P.prefs.setOff` comme les modèles de `reglages`. Enchaîner sur les 8 étapes existantes.
6. **Arrivée d'un employé** (`90-employe.js`). Ajouter un écran caché `emp-bienvenue`, ouvert depuis `emp-conges` (« Revoir mon arrivée ») : invitation, rôle attribué, contrat signé au doigt, consignes de sécurité lues, premier pointage d'essai, visite des 4 onglets.
7. **Arrivée d'un coach** (`70-coach-compet.js`). Ajouter dans `coach-profil` un bandeau « Profil complet à 100 % » qui rouvre le parcours : diplômes et assurance vérifiés, semaine type, tarifs, compte de versement, demande d'accueil dans une écurie, page publique en ligne.
8. **Créer une annonce de demi-pension depuis zéro** (`80-adherent.js`). Dans `adh-demipension`, onglet Mon annonce, ajouter « Nouvelle annonce » : choix du cheval, jours, niveau minimum, prix, disciplines, visibilité (club ou public), aperçu, publication. Laisser l'annonce d'Ulysse en exemple.
9. **Corriger les incohérences de la section 4** (tous les lots cités). Les lignes 1 à 8 se voient pendant la visite guidée.

### P1 — attendu par un gérant qui compare avec la concurrence

10. **Écran de la sellerie** (`30-chevaux.js` et `20-planning.js`). Remplacer les deux messages « affiché sur l'écran de la sellerie » par une vraie vue plein écran : reprises du jour, attributions cheval et cavalier, consignes, distribution, heure, mise à jour simulée toutes les 20 secondes, bouton « Quitter ».
11. **Personnaliser, côté employé et coach** (`90-employe.js`, `70-coach-compet.js`). Ajouter un bouton « Personnaliser » sur `emp-jour` et `coach-agenda` : choix des 4 raccourcis, blocs affichés et leur ordre, apparence, texte plus grand. Reprendre la feuille de `adh-accueil`.
12. **Vues enregistrées et épingles** (`50-club.js`, `30-chevaux.js`). Dans `adherents` et `chevaux`, ajouter « Enregistrer cette vue » (filtre, tri, colonnes, nom, personnelle ou partagée) et une étoile « Épingler » sur chaque fiche. Afficher les épingles dans une carte « Épinglés » en tête de liste.
13. **Raccourcis clavier, teinte et densité** (`95-plateforme.js`). Dans `reglages`, ajouter une section « Mes préférences » séparée des réglages du club : thème, teinte personnelle parmi six, densité confortable ou compacte, liste des raccourcis clavier.
14. **Boutique côté adhérent** (`80-adherent.js`). Ajouter l'écran `adh-boutique` (groupe Compte) : forfaits et cartes, cartes cadeaux à offrir, sellerie du club, panier, paiement, retrait à l'accueil. Reprendre les articles de `D.shopItems`.
15. **Réserver une installation** (`80-adherent.js`). Dans `adh-reserver`, ajouter l'onglet « Installations » pour les propriétaires : grille des 4 pistes par demi-heure, créneaux pris par les reprises grisés, réservation en un geste, règle affichée (1 h par jour, piste partagée à 4 cavaliers). Faire apparaître ces réservations dans `planning` (Jour par piste).
16. **Générer le planning** (`20-planning.js`). Dans `planning`, menu Créer, ajouter « Générer la semaine type » : disponibilités des moniteurs, pistes, niveaux demandés, puis proposition de grille avec conflits signalés, puis « Appliquer » annulable.
17. **Devis** (`60-argent.js`). Dans `facturation`, ajouter le type « Devis » à « Créer une facture », un filtre Devis, les statuts envoyé, accepté, refusé, et « Transformer en facture ».
18. **Cotisations et réinscriptions** (`50-club.js`). Dans `adherents`, ajouter une action « Campagne de réinscription 2027-2028 » : cible, forfait reconduit, cotisation annuelle, relances à J+7 et J+21, suivi (réinscrits, à relancer, partis). Afficher la cotisation dans la fiche `adherent`.
19. **Copropriété, mise au pair, commodat** (`30-chevaux.js`, `50-club.js`). Dans la feuille d'ajout d'un cheval, ajouter les statuts « Mise au pair » et « Commodat » et un champ « Copropriétaires et parts ». Dans `pensions`, répartir la facture au prorata (exemple : 60 % et 40 %) et ajouter le modèle de contrat de mise au pair.
20. **Changer d'établissement** (`95-plateforme.js`, `80-adherent.js`). Dans `reglages` et `adh-profil`, ajouter un sélecteur « Écurie des Tilleuls / Haras de la Vallée » et, pour une même personne, la bascule entre ses rôles (propriétaire et bénévole, moniteur et propriétaire).
21. **Quiz et programmation pédagogique** (`80-adherent.js`, `20-planning.js`). Dans `adh-progression`, ajouter « Réviser la théorie » (10 questions du galop en préparation, score, strass à 100 %). Dans `planning`, onglet Séance d'une reprise, ajouter « Programmation du trimestre » (12 séances, un thème par semaine).
22. **Assistants des trois autres vues** (`80-adherent.js`, `90-employe.js`, `70-coach-compet.js`). Ajouter des sujets à `P.brain` : adhérent (progression, licence, demi-pension, messages, rattrapages restants), employé (planning, congés, stock, ration d'un cheval, pointage), coach (trajets, avis, élèves à relancer, facture). Ajouter le bouton de dictée dans le panneau flottant.
23. **Résultats FFE et galops** (`70-coach-compet.js`, `50-club.js`). Dans `competitions`, ajouter « Importer les résultats FFE » (fichier, rapprochement, résultats rangés dans les fiches). Dans `adherent`, onglet Progression, ajouter « Valider le galop et le transmettre à la FFE ».
24. **Tiers payeurs** (`60-argent.js`). Dans « Créer une facture », ajouter « Facturer un tiers » (CSE, mairie, grand-parent) avec répartition en pourcentage ou en montant, et le dépôt sur Chorus Pro pour une collectivité.
25. **Anneaux de santé sur la fiche du gérant** (`30-chevaux.js`). Dans `cheval`, onglet Santé, ajouter les quatre anneaux (vaccin, vermifuge, maréchal, dentiste) déjà présents dans `adh-cheval`.

### P2 — pour dépasser tout le monde

26. **Module Élevage** (`30-chevaux.js`). Onglet « Reproduction » dans `cheval` pour les juments : chaleurs, saillie, échographies, terme, alerte de poulinage liée à la caméra. Module activable dans `reglages`.
27. **Sortie en extérieur sécurisée** (`80-adherent.js`). Dans `adh-cheval`, bouton « Partir en balade » : tracé, durée, allures, alerte après 5 minutes d'immobilité envoyée aux proches et au club.
28. **Tarif des créneaux creux** (`20-planning.js`). Dans la feuille d'une reprise, option « Prix réduit si moins de 50 % de remplissage à J-2 », avec prix plancher.
29. **Cheval favori et gabarit au montoir** (`80-adherent.js`, `20-planning.js`). Dans `adh-reserver`, « Mon cheval préféré ». Dans le montoir, afficher le favori, la taille et le poids du cavalier.
30. **Lecture d'étiquette et d'analyse de fourrage** (`30-chevaux.js`). Dans `alimentation`, « Photographier une étiquette » : valeurs lues, ration recalculée.
31. **Lecture de puce** (`90-employe.js`). Dans `emp-jour`, à côté de « Scanner », « Lire la puce » qui ouvre la fiche du cheval.
32. **Clôture de caisse** (`50-club.js`). Dans `boutique`, onglet Caisse, « Clôturer la journée » : totaux par moyen de paiement, écart, ticket de clôture non modifiable, attestation de conformité.
33. **Paiement par portefeuille mobile** (`80-adherent.js`). Ajouter Apple Pay et Google Pay dans la feuille de réservation et dans « Payer 410 € ».
34. **Activité en direct** (`80-adherent.js`). Sur `adh-accueil` en vue téléphone, un aperçu d'écran verrouillé « Reprise dans 25 min, Ulysse, carrière d'honneur ».
35. **Cavaliers de passage** (`50-club.js`). Dans `adherents`, « Ajouter un cavalier de passage » : fiche courte, décharge signée sur la tablette, licence vacances, paiement à la séance.
36. **Créateur de parcours et bibliothèque d'exercices** (`70-coach-compet.js`). Dans `coach-eleves`, onglet « Exercices » : fiches par thème et dessin d'un parcours par glisser-déposer d'obstacles.
37. **Offre et confiance** (`95-plateforme.js`). Dans `reglages`, Abonnement : écrire « sans engagement », « essai de 30 jours sans carte », « chevaux et utilisateurs illimités », l'offre solidaire, la sauvegarde quotidienne, et un bouton visible « Exporter toutes mes données ». Ajouter une section « Aide » (tutoriels, téléphone, visio).
38. **Éditeur de formulaire et bloc de site** (`50-club.js`). Dans `boutique`, Page publique : choix des champs du formulaire d'inscription et code à coller dans un site existant.
39. **Hors-ligne du moniteur et du coach** (`90-employe.js`, `70-coach-compet.js`). Étendre le bandeau hors ligne à l'appel de Hugo et à « Démarrer le cours ».
40. **Connecteurs manquants** (`95-plateforme.js`). Ajouter « FFE Connect » et « Equionline » au catalogue.
41. **Grille de prix par âge** (`95-plateforme.js`). Dans `reglages`, Tarifs et forfaits : prix par tranche d'âge et prix non-adhérent.
42. **Conditions d'accès par âge** (`20-planning.js`). Dans la feuille Créer, ajouter « Âge minimum et maximum » et « Réservé aux adhérents ».

---

## 4. Incohérences entre écrans

Classées de la plus visible à la moins visible.

| # | Sujet | Écran A | Écran B | À faire |
|---|---|---|---|---|
| 1 | Passage de Léa à Rambouillet | `adh-concours`, `adh-accueil` : passage à 11 h 42, 14e sur 32, dossard 214, reconnaissance à 11 h 10, détente à 11 h 20 au paddock B | `coach-concours` : passage à 11 h 16, n° 19 sur 24, détente à 10 h 50 au paddock A, reconnaissance Club Élite à 9 h 15 | Choisir un seul horaire et l'écrire dans les lots 70 et 80 |
| 2 | Solde de Léa | `adh-accueil`, `adh-paiements`, `adherent`, `boutique` : 410 € | `facturation` : « Léa Martin doit encore 520 € » ; `cheval` : « facture F-2026-1173 de 520 € en retard » | Écrire partout 410 € restants sur une facture de 520 € |
| 3 | Reprise Galop 6-7 CSO de 18 h | `cockpit`, `planning` : 6/8 | `adh-reserver` : complet, 8/8, 2 en attente | Aligner sur `D.lessons` (6/8) ou remplir la reprise dans les données |
| 4 | Journée de Pauline | `coach-agenda` : cours avec Léa à 11 h 15 et collectif à 12 h 15 en carrière d'honneur, 14 h libre | `planning` : hersage de la carrière d'honneur à 11 h 30, cours particulier de Pauline à 14 h (1/1, complet) ; `adh-coachs` propose encore mardi 14 h | Une seule version de la journée ; déplacer le hersage |
| 5 | Journée de Léa | `adh-accueil` : prochaine reprise demain à 16 h | `coach-agenda` : cours particulier de Léa et Ulysse aujourd'hui à 11 h 15 | Afficher ce cours dans `adh-accueil` ou le retirer de l'agenda |
| 6 | Chevaux et boxes | `chevaux`, `import`, `D.horses` : 40 chevaux | `cockpit`, `ecurie3d`, journal MCP : 44 boxes occupés ; `entretien` : « 44 chevaux présents » ; `cockpit` : 27 + 13 + 4 = 44 | Créer 4 chevaux de plus ou passer à 40 occupés et 6 libres |
| 7 | Demi-pension d'Emma | `pensions`, `adh-demipension` : en place depuis le 1er septembre, 540 € déjà déduits | `contrats`, `adh-contrats`, `adh-accueil` : contrat à signer, reçu hier, 1 signature sur 3 | Présenter le document comme un renouvellement ou un avenant |
| 8 | Reprises du jour | `cockpit` : 4 reprises, 27 cavaliers | `planning` : mardi 5 reprises ; vue Liste : 7 créneaux, 28 cavaliers | Même règle de comptage partout |
| 9 | Impayés | `cockpit`, `facturation`, assistant : 9 factures, 9 familles, 2 773 € | `adherents` : filtre « Impayés 24 » | Ramener le filtre à 9 |
| 10 | Chevaux en pension | `chevaux`, `pensions` : 21 en pension, 12 propriétaires | `alimentation` : « les 13 chevaux de propriétaires » ; `D.horses` : 13 propriétaire, 8 demi | Écrire « 21 chevaux en pension » dans `alimentation` |
| 11 | État corporel d'Ulysse | `cheval`, `alimentation` : 2,5 sur 5 | `adh-cheval` : 3 / 5 ; `core/data.js` : `bcs: 4` | Une seule valeur |
| 12 | Échelle d'état corporel | `cheval`, `adh-cheval` : sur 5 | `emp-cheval` (Xanthos) : 7 sur 9 | Une seule échelle |
| 13 | Téléphone de Léa | `adh-profil` : 06 12 34 56 78 | `core/data.js` : 06 43 69 26 83 ; `emp-cheval` donne 06 12 34 56 78 au Dr Leclerc | Deux numéros distincts |
| 14 | Année de naissance d'Ulysse | `core/data.js` : `age: 11` | `core/data.js` : `born: 2007` (soit 19 ans en 2026) | `born: 2015` (hors modules, à signaler à l'orchestrateur) |
| 15 | Semaine de Mamadou | `emp-planning` : 41 h prévues | `equipe` : CDI 39 h, 40 h 30 cette semaine | Même total |
| 16 | Effectif | `cameras` : « note signée par les 9 salariés » ; `import` : « 7 invités sur 9 » | `equipe` (Paie) : 8 salariés ; `emp-messages` : « lu par 2 sur 8 » | Préciser « 8 salariés et la gérante » |
| 17 | Contrat de Jade | `contrats` : « Convention de stage BPJEPS » | `equipe` : apprentie en 2e année, contrat d'apprentissage | Renommer en contrat d'apprentissage |
| 18 | Van de Léa | `D.vans` : van 2 places | `D.entries` : 3 chevaux affectés au van (h01, h14, h20) ; `adh-concours` en montre 2 | Réaffecter une entrée au camion |
| 19 | Engagement de Léa | `adh-concours` : « Engagement confirmé par la FFE » | `competitions` : concours « Engagements ouverts », saisie manuelle sur FFE Compet | Écrire « Engagement saisi par le club » |
| 20 | Yuma en demi-pension | `adh-demipension` (Chercher) : « Yuma, propriétaire : Léa M. » | Léa Martin est l'utilisatrice et ne possède qu'Ulysse : le lecteur croit à une erreur | Donner un autre nom au propriétaire de Yuma |
