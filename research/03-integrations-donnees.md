# 03 — Intégrations et données : à quoi Piaffe doit se connecter

> Recherche réalisée le 17 novembre 2026. Le web était accessible : les points marqués **VÉRIFIÉ** renvoient à une page lue ce jour-là ; les points marqués **SUPPOSÉ** viennent de la connaissance générale du rédacteur et n'ont pas été recoupés (à confirmer avant de s'y engager).
>
> Limites de la vérification à connaître :
> - Le site de Kavalog refuse la lecture automatisée (robots) : ses fonctions ne sont connues que par les titres de ses pages et par un comparatif tiers.
> - Aucune page officielle FFE décrivant une API n'a été trouvée ; aucune page publique n'a été trouvée pour GCE ni Horse-Manager.
> - Les capteurs (Seaver, Equisense, Arioneo, Nightwatch) n'ont pas pu être vérifiés : tout y est SUPPOSÉ.
> - Les chiffres réglementaires (TVA, calendrier de facturation électronique, Pass'Sport) sont datés : ils doivent être relus par l'expert-comptable ou le juriste avant mise en production.

Légende des priorités : **P0** = indispensable au lancement, **P1** = dans les 6 à 12 mois, **P2** = opportuniste.
Légende du mode de branchement : **API** = API officielle documentée ; **Fichier** = import ou export de fichier ; **Agrément** = accès réservé par convention ; **Aucun** = pas d'accès connu.

## Ce qu'il faut retenir

1. **La FFE n'a pas d'API publique connue.** Le seul canal automatisé repéré est la « télétransmission » des licences, réservée aux « solutions techniques agréées FFE » (Kavalog s'en réclame). Piaffe doit donc (a) demander cet agrément tôt, (b) vivre en attendant avec les exports de fichiers FFE et une saisie assistée.
2. **L'IFCE n'a pas d'API officielle de démarches.** Les données publiques d'équidés sont en open data, et un service tiers gratuit (API Équidés) les expose : suffisant pour pré-remplir une fiche cheval à partir du numéro SIRE.
3. **La convention collective a changé** : l'IDCC 7012 (centres équestres) est remplacée par l'IDCC 7026 (personnels des activités hippiques), étendue en mai 2024. Tout module RH doit viser 7026.
4. **Facturation électronique** : recevoir des factures électroniques est obligatoire depuis le 1er septembre 2026 ; les PME et TPE devront en émettre, et faire l'e-reporting de leurs ventes aux particuliers, au 1er septembre 2027. Piaffe doit se raccorder à une plateforme agréée plutôt que le devenir.
5. **TVA** : 5,5 % sur l'enseignement, la pratique, les animations et l'accès aux installations depuis le 1er janvier 2024 ; la pension n'est pas dans ce texte. Le moteur de facturation doit ventiler une même facture sur plusieurs taux.
6. **MCP** : la spécification en vigueur est la révision **2026-07-28**, sans session ni poignée de main, avec OAuth 2.1. Le serveur MCP Piaffe doit être conçu sans état dès le départ.

---

## 1. Écosystème fédéral et public

### 1.1 FFE (Fédération Française d'Équitation)

| Brique FFE | À quoi elle sert dans Piaffe | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| SIF (système d'information fédéral) | Base centrale : licences, équidés, engagements, résultats. Référence pour vérifier qu'un cavalier est licencié. | Pas d'API publique connue. Accès par l'espace web du club. | P0 | VÉRIFIÉ pour le rôle du SIF (https://www.equirider.fr/compte-ffe-sif-gestion-connexion/, source tierce) ; absence d'API = constat de recherche, pas une confirmation FFE |
| FFE Club SIF (espace club) | Prise et renouvellement des licences, galops, cotisation, statistiques. | Deux voies : (1) télétransmission réservée aux éditeurs agréés ; (2) à défaut, préparation d'un lot dans Piaffe puis saisie par le club dans son espace. | P0 | VÉRIFIÉ pour l'existence d'un agrément « solution technique agréée FFE » avec télétransmission des licences (titres des pages https://www.kavalog.com/2024/09/04/teletransmission-ffe-optimisez-la-gestion-des-licences-cavaliers-avec-kavalog/ et comparatif https://www.equirider.fr/logiciel-gestion-equestre/). Conditions d'agrément : SUPPOSÉ, à demander à la FFE |
| Licences et galops | Numéro de licence, type (pratiquant, compétition), millésime, niveau de galop sur la fiche adhérent. | Saisie manuelle ou import du fichier exporté par le club ; contrôle du format du numéro. | P0 | SUPPOSÉ |
| FFE Compet (engagements, résultats) | Préparer les engagements des cavaliers du club, importer les listes de départ et les résultats, refacturer les engagements. | Import de fichier : export CSV ou XLS depuis FFE Compet. Pas d'API publique connue. | P1 | VÉRIFIÉ pour l'export CSV/XLS (https://www.paddockroom.app/fonctionnalites/import-ffeccompet-club-sif/, source tierce) |
| Club SIF, concours club et poney | Listes de concours club. | Import de fichier XML exporté depuis l'espace officiel. | P1 | VÉRIFIÉ (même source tierce) |
| DUC (déclaration unique de concours) | Déclarer un concours organisé par le club. | Pas d'API publique connue ; Piaffe prépare les données, la déclaration se fait sur le site FFE. | P2 | SUPPOSÉ |
| FFE Connect (identifiant fédéral unique) | Connexion du cavalier avec son compte fédéral dans le portail adhérent. | Pas d'accès tiers connu. À demander en même temps que l'agrément. | P2 | SUPPOSÉ |
| Certificat médical de la licence | Savoir si le cavalier est en règle pour la compétition. | Pas d'échange automatique ; Piaffe ne stocke qu'un indicateur et une date (voir point 10). | P1 | SUPPOSÉ (règle FFE 2026-2027 non retrouvée) |

**Recommandation.** Ouvrir dès maintenant un dossier d'agrément auprès de la FFE (et se rapprocher du GHN, dont Kavalog est partenaire). Sans agrément, promettre « synchronisation FFE » serait faux : dire « import des fichiers FFE et préparation des licences ».

### 1.2 IFCE / SIRE

| Sujet | À quoi il sert dans Piaffe | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Fiche publique d'un équidé (nom, race, robe, sexe, année, généalogie) | Pré-remplir la fiche cheval à partir du numéro SIRE ou du nom. | **API** tierce gratuite « API Équidés » (https://api-equides.org/), sans clé, 50 appels par seconde et par IP, plus de 4,4 millions de fiches, aucune donnée personnelle. Service indépendant de l'IFCE, qui réutilise son open data ; les fiches en ligne IFCE font seules autorité. Alternative : charger directement le jeu « Fichier des équidés » de data.gouv.fr. | P0 | VÉRIFIÉ (https://www.data.gouv.fr/dataservices/api-equides) |
| Démarches SIRE (changement de propriétaire, lieu de détention, déclaration de mort) | Rappeler au gérant et au propriétaire ce qui est à faire, avec les délais. | Pas d'API publique connue pour les démarches : elles se font dans l'espace personnel SIRE. Piaffe génère un récapitulatif et un lien. | P1 | SUPPOSÉ pour l'absence d'API |
| Déclaration du lieu de détention | Obligatoire dès le premier équidé accueilli, gratuite, à mettre à jour. Piaffe stocke le numéro de détenteur. | Champ de saisie et rappel. | P0 | VÉRIFIÉ (guide du détenteur SIRE, https://www.aqps.fr/wp-content/uploads/2023/03/SIRE-Guide-Detenteur-WEB.pdf) |
| Changement de propriétaire | À déclarer par le nouveau propriétaire dans les 30 jours. | Rappel automatique à l'arrivée d'un cheval en pension. | P1 | VÉRIFIÉ (même guide) |
| Équidé introduit ou importé | À enregistrer dans les 30 jours. | Rappel. | P1 | VÉRIFIÉ (même guide) |

### 1.3 Registre d'élevage et obligations sanitaires

Règles vérifiées dans le guide du détenteur SIRE (https://www.aqps.fr/wp-content/uploads/2023/03/SIRE-Guide-Detenteur-WEB.pdf) :

- Le **registre d'élevage** est obligatoire pour tout détenteur, particulier compris. Il recense les équidés présents, leurs mouvements (naissances et décès compris), les soins et interventions vétérinaires, et les caractéristiques de l'exploitation.
- Tenu sous forme informatique, il doit être **imprimé au moins une fois par trimestre et à chaque visite vétérinaire**, ou faire l'objet de **sauvegardes trimestrielles non modifiables**. Conservation : **5 ans**, sur place.
- Un **vétérinaire sanitaire** doit être déclaré à la DDPP dès **3 équidés** ; visite sanitaire tous les deux ans.
- Chaque équidé doit avoir un transpondeur, un document d'identification avec feuillet de traitement médicamenteux, et un numéro SIRE.
- L'**exclusion de la consommation humaine** est décidée par le vétérinaire et enregistrée dans SIRE.
- Le décès se déclare au SIRE ; l'enfouissement est interdit.

Conséquences pour Piaffe (P0) :
- le module santé **est** le registre d'élevage : chaque soin, vaccin, vermifuge, ordonnance et mouvement y est une écriture datée, signée par un utilisateur, non modifiable après clôture trimestrielle ;
- export PDF trimestriel horodaté, archivé 5 ans, téléchargeable lors d'un contrôle ;
- pharmacie : stock de médicaments, ordonnances numérisées, délais d'attente — SUPPOSÉ pour le détail des règles de pharmacie vétérinaire (une plaquette IFCE existe : https://www.france-galop.com/sites/default/files/ifce_dep_pharmacie_veto_web.pdf, non lue) ;
- vaccins : calendrier par cheval avec rappels. Les règles exactes de vaccination grippe pour les compétitions FFE sont SUPPOSÉES ; un comparatif tiers indique que l'enregistrement électronique des vaccins grippe dans l'application FEI est obligatoire depuis janvier 2026 pour les chevaux FEI (https://www.equirider.fr/logiciel-gestion-equestre/, à recouper).

### 1.4 Transport d'équidés

| Règle | Effet dans Piaffe | Statut |
|---|---|---|
| Un certificat de compétence des conducteurs et convoyeurs (ancien CAPTAV) est requis pour transporter des animaux vivants **à des fins économiques au-delà de 65 km**. Formation d'environ 2 jours par espèce. | Champ « certificat transport » sur la fiche salarié avec date et pièce jointe ; alerte quand un déplacement planifié dépasse 65 km sans conducteur certifié. | VÉRIFIÉ (https://www.mapa-assurances.fr/marchand-bestiaux/certificat-competences-conducteurs-convoyeurs) |
| Autorisations de transporteur (type 1 moins de 8 heures, type 2 plus de 8 heures), registre de transport, règlement européen n° 1/2005. | Registre de transport généré depuis le planning des concours. | SUPPOSÉ (guide FNCH non lu : https://www.fnch.fr/sites/default/files/2024-09/FNCH_Guide_Transport_2024_VF.pdf) |
| TVA récupérable sur les véhicules aménagés pour le transport d'équidés (article 89 de la loi de finances pour 2024). | Information pour le module comptable. | VÉRIFIÉ (https://www.legifiscal.fr/actualites-fiscales/3783-taux-reduit-tva-55-etablissements-equestres.html) |

Branchement : aucun système externe, c'est de la donnée interne. Priorité P2.

### 1.5 TVA de la filière équine (état au 17 novembre 2026)

| Prestation | Taux | Depuis | Statut |
|---|---|---|---|
| Enseignement et pratique de l'équitation | 5,5 % (2,10 % en Guadeloupe, Martinique, La Réunion) | 1er janvier 2024 | VÉRIFIÉ (BOFiP du 15 mai 2024, https://bofip.impots.gouv.fr/doctrine/pgp/14203-PGP ; article 278-0 bis O du CGI, article 88 de la loi de finances pour 2024) |
| Animations et démonstrations de découverte de l'environnement équestre | 5,5 % | 1er janvier 2024 | VÉRIFIÉ (même source) |
| Accès aux installations sportives destinées aux équidés | 5,5 % | 1er janvier 2024 | VÉRIFIÉ (même source) |
| Pension (hébergement, nourriture, soins) | 20 % en principe ; la part « accès aux installations » d'une pension peut relever de 5,5 % si elle est ventilée | — | SUPPOSÉ : la pension n'est pas citée dans le texte lu. À faire valider par l'expert-comptable |
| Vente de chevaux | 20 % en règle générale, avec des cas particuliers à taux réduit | — | SUPPOSÉ (une évolution a été discutée : https://www.weblex.fr/weblex-actualite/vente-de-chevaux-vivants-une-baisse-du-taux-de-tva-en-vue, non lue) |

Point d'attention daté : les clubs qui ont appliqué un taux trop élevé depuis 2024 peuvent régulariser par réclamation ou imputation **jusqu'au 31 décembre 2026** (VÉRIFIÉ, BOFiP ci-dessus). C'est dans six semaines : argument commercial possible, mais à manier avec l'expert-comptable.

Effet dans Piaffe (P0) : taux de TVA porté par chaque ligne de prestation et non par la facture ; clé de ventilation paramétrable pour la pension ; table des taux datée (un changement de loi ne doit pas réécrire les factures passées) ; cas des associations non assujetties.

### 1.6 Convention collective

| Point | Contenu | Statut |
|---|---|---|
| Ancienne convention | IDCC 7012, « personnel des centres équestres », du 11 juillet 1975. Statut : remplacée. Dernier avenant salaires cité : n° 109 du 21 septembre 2023. | VÉRIFIÉ (https://www.legisocial.fr/conventions-collectives-nationales/7012-personnel-des-centres-equestres/) |
| Convention en vigueur | **IDCC 7026**, « personnels des activités hippiques », accord du 16 novembre 2023, **étendue par arrêté du 5 mai 2024 (JORF du 16 mai 2024)**. Les centres équestres y figurent dans l'annexe n° 4 (ex-IDCC 7012). Des avenants ont encore été étendus en novembre 2026. | VÉRIFIÉ (https://www.legisocial.fr/conventions-collectives-nationales/7026-personnel-des-activites-hippiques/) |
| Grilles de salaires 2026 | Non relevées. | SUPPOSÉ (piste : https://www.juristique.org/conventionnel/salaires-centres-equestres-2026, non lue) |
| Régime agricole (MSA et non URSSAF) | Les salariés relèvent de la MSA. | SUPPOSÉ |

Effet dans Piaffe : le planning et le pointage portent les catégories et coefficients de l'annexe 4 de l'IDCC 7026 ; Piaffe **ne calcule pas la paie**, il exporte les heures vers un logiciel de paie (point 5).

### 1.7 DSN

La DSN (déclaration sociale nominative) est produite par le logiciel de paie, pas par Piaffe. Rôle de Piaffe : fournir au logiciel de paie les variables du mois (heures, absences, primes) et signaler les événements (arrêt, fin de contrat). Branchement : aucun avec net-entreprises ou la MSA ; passage par le connecteur paie. Priorité P1. Statut : SUPPOSÉ (non vérifié sur une source officielle, mais c'est le fonctionnement standard de la DSN).

---

## 2. Paiement et encaissement

| Intégration | À quoi elle sert dans Piaffe | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Stripe (carte, prélèvement SEPA, liens de paiement, Connect) | Paiement en ligne des forfaits, cartes de cours, stages ; encaissement pour le compte de chaque écurie (modèle place de marché avec Stripe Connect). | API officielle et webhooks. | P0 | VÉRIFIÉ pour le prélèvement SEPA (https://docs.stripe.com/payments/sepa-debit) ; Connect : SUPPOSÉ |
| GoCardless (prélèvement SEPA) | Pensions et forfaits mensuels par mandat, relances automatiques des rejets. | API officielle (mandats, paiements, webhooks). | P0 | VÉRIFIÉ (https://developer.gocardless.com/api-reference) |
| Mollie | Alternative européenne à Stripe, prélèvement SEPA compris. | API officielle. | P2 | VÉRIFIÉ (https://docs.mollie.com/docs/sepa-direct-debit) |
| SumUp (terminal de paiement) | Encaissement par carte à l'accueil ou au club-house, rapproché de la facture. | API et SDK officiels. | P1 | SUPPOSÉ |
| Zettle par PayPal (terminal) | Même usage. | API officielle. | P2 | SUPPOSÉ |
| Chèque-Vacances Connect (ANCV) | Payer stages et forfaits en chèques-vacances dématérialisés. | Pas en direct : par un prestataire de paiement qui le propose (HiPay, Lyra/PayZen, Scellius). Chez HiPay : redirection, validation dans l'application ANCV, France et euro uniquement, **pas de remboursement**, déploiement encadré. Un kit d'intégration ANCV existe aussi. Le club doit être conventionné ANCV. | P1 | VÉRIFIÉ pour HiPay (https://developer.hipay.com/online-payments/payment-means/cheque-vacances-connect) ; kit ANCV repéré, non lu (https://static.ancv.com/ddmc/connect/spectechniques/Kit_Integration_par_API_du_CVCo.pdf) ; conventionnement : SUPPOSÉ |
| Chèques-vacances papier, coupons sport | Saisie comme moyen de paiement, bordereau de remise. | Aucun système externe : saisie manuelle. | P0 | SUPPOSÉ |
| Pass'Sport | Déduction de **50 €** à l'inscription pour la saison 2026-2027 (6 à 17 ans avec quotient familial de 699 € au plus, jeunes en situation de handicap, boursiers de moins de 28 ans). Campagne du 1er septembre au 31 décembre 2026. Le jeune présente un code individuel ; le club se fait rembourser via Le Compte Asso. | Pas d'API publique connue. Piaffe enregistre le code, applique la remise, et produit la liste des codes à déclarer. | P0 (saisonnier) | VÉRIFIÉ (https://www.sports.gouv.fr/le-dispositif-pass-sport-de-retour-pour-la-rentree-2026-10272). Éligibilité des structures commerciales : non précisée par la source, SUPPOSÉ à vérifier sur la cartographie officielle |
| Chèques bancaires | Encore très utilisés : saisie, échéancier de chèques différés, bordereau de remise en banque. | Aucun système externe. | P0 | SUPPOSÉ |
| Espèces | Journal de caisse (voir 3.5). | Aucun système externe. | P0 | SUPPOSÉ |
| Paiement en plusieurs fois | Forfait annuel en 3, 4 ou 10 fois. | Échéancier interne adossé à un mandat SEPA ou à une carte enregistrée ; pas de crédit à la consommation. Les offres de paiement fractionné des prestataires (Alma, Klarna) sont une option P2. | P0 pour l'échéancier | SUPPOSÉ |
| Portefeuille de cartes de cours | Carte de 10 séances, crédits, validité, report. | Fonction interne, pas d'intégration : grand livre de crédits par adhérent, débité à la présence. | P0 | Conception Piaffe |
| Virement | Rapprochement automatique par la banque (voir 3.3). | Via agrégation bancaire. | P1 | SUPPOSÉ |

Règle de conception : Piaffe ne détient jamais de fonds et ne voit jamais de numéro de carte (les prestataires portent la conformité PCI DSS). Un seul modèle « encaissement » interne, quel que soit le moyen.

---

## 3. Comptabilité et facturation

### 3.1 Exports comptables

| Intégration | À quoi elle sert | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| FEC (fichier des écritures comptables) | Format légal remis à l'administration en cas de contrôle ; lu par tous les logiciels comptables. Piaffe produit un **export d'écritures au format FEC** (journal de ventes et de banque), pas le FEC légal de l'entreprise, qui reste celui du logiciel comptable. | Export de fichier. | P0 | SUPPOSÉ (format défini à l'article A47 A-1 du livre des procédures fiscales, non relu) |
| Pennylane | Pousser factures clients, clients et encaissements ; lire l'état de paiement. | API officielle v2 avec jetons et scopes. Pennylane a aussi un serveur MCP officiel, en lecture seule (https://mcp.pennylane.com/mcp) : précédent utile pour Piaffe. | P0 | VÉRIFIÉ (https://pennylane.readme.io/docs/getting-started, https://www.pennylane.com/fr/mcp) |
| Tiime | Export pour les petits clubs. | Pas d'API publique connue ; export de fichier. | P1 | SUPPOSÉ |
| Cegid (Loop, Quadra), Sage, EBP | Logiciels des cabinets comptables. | Export de fichier au format d'import de chaque logiciel, ou FEC. | P0 pour le format générique, P1 pour les formats dédiés | SUPPOSÉ |
| QuickBooks | QuickBooks France a été arrêté ; à ne traiter que sur demande. | Export de fichier. | P2 | SUPPOSÉ (arrêt à vérifier) |
| Isagri, Agiris | Comptabilité agricole, fréquente dans les écuries au régime agricole. | Export de fichier. | P1 | SUPPOSÉ |

Paramétrage requis : plan comptable modifiable par écurie, comptes par famille de prestation et par taux de TVA, journal, code analytique.

### 3.2 Facturation électronique (réforme française)

| Point | État au 17 novembre 2026 | Statut |
|---|---|---|
| Réception | Toutes les entreprises doivent pouvoir recevoir des factures électroniques **depuis le 1er septembre 2026**. | VÉRIFIÉ (https://entreprendre.service-public.gouv.fr/actualites/A15683, page mise à jour le 27 février 2026) |
| Émission | Grandes entreprises et ETI depuis le 1er septembre 2026 ; **PME, TPE et micro-entreprises au 1er septembre 2027**. | VÉRIFIÉ (même source) |
| Plateformes agréées | Passage obligatoire par une plateforme agréée privée. 149 immatriculées au moment de l'article lu, dont Pennylane, Qonto, Sage, Cegid, Tiime. | VÉRIFIÉ (https://www.presse-citron.net/facturation-electronique-entre-vigueur-aujourdhui-voici-149-plateformes-agreees-france/) ; la liste officielle évolue |
| Formats | Factur-X, UBL, CII. | VÉRIFIÉ (même source) |
| E-reporting | Les ventes aux particuliers et à l'international sont transmises en montants globalisés (pas de nom de client), avec date et montant d'encaissement pour les services. Même calendrier : 1er septembre 2027 pour les PME et TPE. Fréquence selon le régime de TVA (de trois fois par mois à une fois tous les deux mois). Amende indiquée : 500 € par transmission manquante. | VÉRIFIÉ sur une source bancaire (https://pro.credit-agricole.fr/comptabilite/facture/electronique/e-reporting) ; fréquences et plafond à recouper sur impots.gouv.fr |

Ce que cela implique pour un centre équestre : la plupart de ses ventes vont à des particuliers, donc relèvent de l'**e-reporting** et non de la facture électronique ; les factures électroniques concernent ses achats (réception, déjà obligatoire) et ses ventes à des professionnels (propriétaires en société, comités d'entreprise, collectivités via Chorus Pro).

Stratégie Piaffe :
- P0 : générer des factures **Factur-X** (PDF lisible avec données structurées) et les mentions obligatoires (SIREN du client professionnel, catégorie d'opération) ;
- P1, à livrer avant septembre 2027 : raccordement à **une** plateforme agréée par API (émission, statuts, e-reporting des ventes aux particuliers et des encaissements) ; ne pas devenir plateforme agréée ;
- distinguer dans le modèle de données client « particulier » et « professionnel avec SIREN ».

### 3.3 Banques

| Intégration | À quoi elle sert | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Qonto | Lire les transactions pour rapprocher virements et prélèvements des factures. | API officielle « Business API », OAuth avec scopes. | P1 | VÉRIFIÉ (https://docs.qonto.com/get-started/business-api/overview) |
| Bridge, Powens (agrégation bancaire) | Même besoin pour toutes les autres banques (Crédit Agricole très présent dans la filière). | API officielles d'agrégateurs agréés ; Piaffe passe par leur agrément et ne devient pas prestataire de paiement. | P1 | SUPPOSÉ |
| Relevés bancaires en fichier | Solution de repli. | Import CSV, OFX, CAMT.053. | P1 | SUPPOSÉ |
| Remises SEPA en fichier (pain.008) | Clubs qui prélèvent par leur propre banque. | Export de fichier à déposer sur le site de la banque. | P1 | SUPPOSÉ |

### 3.4 Logiciel de caisse et obligations

- L'obligation d'utiliser un logiciel de caisse sécurisé (inaltérabilité, sécurisation, conservation, archivage) vise les assujettis à la TVA qui encaissent des particuliers. SUPPOSÉ pour le rappel du principe.
- La fin de l'attestation de l'éditeur, qui devait imposer une certification par un tiers au 1er septembre 2026, a été **annulée** : l'article 125 de la loi de finances pour 2026 (loi n° 2026-103 du 19 février 2026) rétablit l'attestation par l'éditeur. VÉRIFIÉ (https://entreprendre.service-public.gouv.fr/actualites/A18087).

Effet dans Piaffe (P0 si Piaffe encaisse au comptoir) : journal d'encaissements chaîné et non modifiable (une erreur se corrige par une écriture d'annulation), clôtures journalières, mensuelles et annuelles, archives signées, puis attestation individuelle remise à chaque client. La certification NF525 reste un argument commercial possible (P2).

---

## 4. Signature électronique

| Intégration | À quoi elle sert | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Yousign | Prestataire français : contrats de pension, de demi-pension, inscriptions, mandats. | API officielle, niveaux simple, avancé et qualifié. | P0 | VÉRIFIÉ (https://yousign.com/fr-fr/api, https://yousign.com/fr-fr/niveaux-de-signature-electronique) |
| Docusign | Clients qui l'ont déjà. | API officielle. | P2 | SUPPOSÉ |
| Dropbox Sign | Alternative. | API officielle. | P2 | SUPPOSÉ |
| Mandat SEPA | Signature du mandat de prélèvement. | Portée par GoCardless ou Stripe dans leur parcours. | P0 | SUPPOSÉ |

Niveau eIDAS recommandé par document (avis de conception, SUPPOSÉ, à valider par un juriste) :

| Document | Niveau | Pourquoi |
|---|---|---|
| Inscription annuelle, règlement intérieur, droit à l'image | Simple (code par SMS ou email) | Faible enjeu, gros volume |
| Décharge, autorisation parentale, autorisation de soins | Simple avec identification renforcée du signataire | Pour un mineur, c'est le titulaire de l'autorité parentale qui signe. Une décharge ne supprime pas la responsabilité du club : ne pas la présenter comme telle |
| Contrat de demi-pension | Simple ou avancée | Enjeu financier moyen |
| Contrat de pension (dépôt d'un cheval) | Avancée | Enjeu élevé (valeur du cheval, responsabilité du dépositaire) |
| Contrat de vente d'un cheval, contrat de travail | Avancée | Enjeu élevé |
| Qualifiée | Non nécessaire | Coût et friction sans rapport avec le besoin |

Piaffe conserve le document signé et son fichier de preuve, liés à la fiche adhérent et à la fiche cheval.

---

## 5. RH et paie

| Intégration | À quoi elle sert | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| PayFit | Envoyer absences et temps travaillé, récupérer salariés, contrats et écritures de paie. | API partenaire officielle (salariés, contrats, absences, bulletins, écritures comptables), OAuth 2, sous programme partenaire. | P1 | VÉRIFIÉ (https://developers.payfit.io/llms.txt). Prise en charge du régime agricole MSA par PayFit : SUPPOSÉ, à vérifier avant tout |
| Silae | Logiciel de paie de beaucoup de cabinets comptables. | API réservée aux partenaires ; à défaut export de fichier des variables de paie. | P1 | SUPPOSÉ |
| Isagri, Agiris (paie agricole) | Paie au régime MSA, fréquente dans la filière. | Export de fichier des variables. | P1 | SUPPOSÉ |
| Lucca | Congés et absences. | API officielle. | P2 | SUPPOSÉ |
| Combo, Skello | Plannings du personnel. Piaffe a son propre planning (cours, écurie, astreintes) : l'intégration sert surtout à migrer ou à cohabiter. | API officielles, accès partenaire. | P2 | SUPPOSÉ (pages d'intégration repérées : https://en.skello.io/landing/integrations) |
| Pointage | Badgeuse sur mobile ou tablette à l'écurie, géolocalisation optionnelle. | Fonction interne. Décompte du temps de travail obligatoire, fiable et consultable ; biométrie à écarter. | P1 | SUPPOSÉ |
| Export générique des variables de paie | Tout autre logiciel ou cabinet. | Fichier CSV ou Excel mensuel : heures normales, supplémentaires, dimanches et jours fériés, absences, primes. | **P0** | Conception Piaffe |
| DSN | Voir 1.7. | Par le logiciel de paie. | — | SUPPOSÉ |

---

## 6. Communication

| Intégration | À quoi elle sert | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Brevo (email et SMS) | Emails transactionnels (factures, confirmations), campagnes, SMS d'annulation de cours. Prestataire français. | API officielle et webhooks. | P0 | SUPPOSÉ |
| Twilio (SMS, voix) | Alternative ou secours pour les SMS. | API officielle. | P2 | SUPPOSÉ |
| Email | Envoi depuis un domaine Piaffe ou le domaine du club. | SPF, DKIM, DMARC configurés par club. | P0 | SUPPOSÉ |
| WhatsApp Business | Canal préféré de nombreux clubs (groupes de reprises). | API officielle de Meta (Cloud API), facturée au message selon la catégorie du modèle (marketing, utilitaire, authentification) ; modèles à faire approuver. On ne peut pas piloter les groupes WhatsApp existants par l'API. | P1 | VÉRIFIÉ pour le principe de tarification (https://developers.facebook.com/docs/whatsapp/pricing) ; tarifs France non relevés |
| Notifications push | Application mobile et web (annulation, cheval à voir, facture). | Services officiels d'Apple (APNs) et de Google (FCM), Web Push. | P0 | SUPPOSÉ |
| Google Agenda | Synchroniser les cours du coach et les séances du cavalier. | API officielle, OAuth. | P1 | SUPPOSÉ |
| Outlook, Microsoft 365 | Même usage. | API officielle Microsoft Graph. | P2 | SUPPOSÉ |
| Apple Calendrier | Même usage. | Pas d'API web : abonnement à un flux ICS. | P0 via ICS | SUPPOSÉ |
| Flux ICS | Un lien d'abonnement par personne (cavalier, coach, propriétaire, maréchal). | Fonction interne : lien secret, révocable. | **P0** | Conception Piaffe |

Règles : consentement distinct pour les messages commerciaux, lien de désinscription, plages horaires pour les SMS commerciaux ; pour un mineur, les messages vont aux parents.

---

## 7. Matériel

### 7.1 Caméras IP

Faits techniques (SUPPOSÉ sauf mention) : les caméras IP exposent un flux **RTSP** (vidéo H.264 ou H.265) et se découvrent et se pilotent par **ONVIF**. Un navigateur ne lit pas le RTSP : il faut une passerelle.

| Élément | Choix proposé | Statut |
|---|---|---|
| Passerelle | Un petit boîtier ou logiciel sur le réseau de l'écurie, qui lit le RTSP en local et ouvre une connexion sortante vers Piaffe : aucun port ouvert chez le client. Logiciels libres candidats : go2rtc, MediaMTX. | VÉRIFIÉ pour l'existence de go2rtc (https://github.com/AlexxIT/go2rtc) ; MediaMTX : SUPPOSÉ |
| Direct à faible latence | **WebRTC** (moins d'une seconde) pour surveiller un poulinage ou un cheval malade. | SUPPOSÉ |
| Diffusion large et relecture | **HLS** (quelques secondes de retard) pour le propriétaire qui regarde son cheval, et pour les enregistrements. | SUPPOSÉ |
| Codec | Demander du H.264 : le H.265 n'est pas lu partout en WebRTC. | SUPPOSÉ |
| Marques | Compatibilité annoncée « ONVIF et RTSP » plutôt qu'une liste de marques ; tester Reolink, Hikvision, Dahua, Axis, Ubiquiti. | SUPPOSÉ |
| IA | Détection de coliques, de poulinage, de cheval couché trop longtemps : analyse sur la passerelle ou dans le cloud. | Conception Piaffe |

Priorité : P1 pour la visualisation, P2 pour l'IA. Les contraintes RGPD (point 10) conditionnent tout : droits par box, journal des accès, durée de conservation.

### 7.2 Capteurs et objets connectés

| Produit | Usage | Comment s'y brancher | Priorité | Statut |
|---|---|---|---|---|
| Seaver (sangle et protège-sangle connectés) | Données de travail du cheval. | Pas d'API publique connue. Import de fichier ou partenariat. | P2 | SUPPOSÉ |
| Equisense (capteur de séance) | Données de travail. | Pas d'API publique connue. Pérennité de l'entreprise à vérifier. | P2 | SUPPOSÉ |
| Arioneo (Equimetre) | Suivi d'entraînement, surtout chevaux de course. | Pas d'API publique connue ; partenariat à explorer. | P2 | SUPPOSÉ |
| Nightwatch (licol connecté) | Alerte de détresse. | Pas d'API publique connue. Disponibilité en France à vérifier. | P2 | SUPPOSÉ |
| Garmin Blaze (capteur équin) | Suivi de bien-être et d'effort. | À étudier : Garmin a des programmes d'API pour ses autres produits. | P2 | Existence VÉRIFIÉE par un titre de résultat (https://www.garmin.com/fr-BE/blog/?p=3779, non lu) ; API : SUPPOSÉ |
| Balances et bascules | Poids du cheval, pesée des rations. | Pas de standard : saisie manuelle, ou lecture série ou Bluetooth par la passerelle. | P2 | SUPPOSÉ |
| Abreuvoirs connectés, distributeurs d'aliment | Consommation d'eau, rations. | Pas d'API publique connue ; au cas par cas. | P2 | SUPPOSÉ |
| Sondes (température, humidité, ammoniac) | Ambiance de l'écurie. | Protocoles ouverts (MQTT, LoRaWAN, Zigbee) via la passerelle. | P2 | SUPPOSÉ |
| Contrôle d'accès (portail, sellerie, manège) | Ouvrir selon l'abonnement et l'horaire. | Fabricants avec API (Nuki, Akuvox, Salto, selon modèle) ; ou relais piloté par la passerelle. | P2 | SUPPOSÉ |
| Domotique (éclairage de carrière, arrosage, marcheur) | Allumer la carrière à la réservation, facturer l'éclairage. | Home Assistant ou relais (Shelly) sur la passerelle, MQTT. | P2 | SUPPOSÉ |

Stratégie : ne pas développer vingt connecteurs propriétaires. Une **API d'ingestion de mesures** générique (un cheval ou un lieu, une grandeur, une valeur, une date, une source), plus l'import de fichiers, plus une passerelle locale qui parle MQTT. Les fabricants se branchent ensuite sur l'API publique.

---

## 8. Reprise de données

### 8.1 Ce que l'on sait des logiciels en place

| Logiciel | Exports connus | Statut |
|---|---|---|
| Kavalog | Présenté comme « solution technique agréée FFE » avec télétransmission des licences ; à partir de 39 € par mois. Formats d'export : non vérifiables (site fermé à la lecture automatisée). | Positionnement VÉRIFIÉ par source tierce (https://www.equirider.fr/logiciel-gestion-equestre/) ; exports SUPPOSÉS (Excel et export comptable probables) |
| Equimondo | Gestion gratuite, facturation payante (19 à 45 € par mois) ; réservations, paiements, SMS, registre d'élevage. Aucune intégration, API ni export documenté sur la fiche lue. | VÉRIFIÉ pour les fonctions (https://www.capterra.fr/software/1033887/equimondo) ; exports : non documentés |
| GCE | Aucune page publique trouvée. | Non vérifié |
| Horse-Manager | Aucune page publique trouvée. | Non vérifié |
| Autres acteurs repérés | Equionline, Mes-écuries.com, Horsio, Ekurie, Gecurie, StillHorse, ISI-LINE Equicentre, EC Pro, et les logiciels d'associations (AssoConnect, HelloAsso, SimpliAsso, MonClub). | VÉRIFIÉ pour leur existence (comparatif Equirider et résultats de recherche) ; exports non étudiés |
| Excel, Google Sheets, cahier papier | Cas le plus fréquent chez les petites écuries. | SUPPOSÉ |
| FFE | Export CSV ou XLS de FFE Compet, XML de Club SIF. | VÉRIFIÉ (source tierce, voir 1.1) |

À faire avant de promettre une « migration en un clic » : obtenir de trois clubs pilotes par logiciel un jeu d'exports réels. Levier juridique : le droit à la portabilité du RGPD ne vaut que pour les personnes physiques, mais le règlement européen sur les données (Data Act) impose aux éditeurs de faciliter le changement de fournisseur — SUPPOSÉ, à confirmer par un juriste. Aucune connexion automatisée au compte du client chez un concurrent sans son accord écrit et sans vérifier les conditions d'utilisation de ce concurrent.

### 8.2 Plan d'import générique

1. **Modèles de fichiers Piaffe** (Excel et CSV, avec onglet d'exemples) : adhérents, familles et payeurs, chevaux, propriétaires et contrats de pension, forfaits et cartes en cours (soldes), reprises et inscriptions, factures ouvertes et soldes clients, salariés, historique de santé.
2. **Import libre** : le client dépose n'importe quel fichier (Excel, CSV, PDF, photo d'un cahier). Piaffe détecte l'encodage, le séparateur, la ligne d'en-tête, les formats de date et de téléphone.
3. **Mapping de colonnes** : proposition automatique (par nom de colonne et par contenu), corrigée par l'utilisateur ; le mapping est mémorisé par logiciel source, de sorte que le deuxième client venant de Kavalog n'a plus rien à régler.
4. **Normalisation** : noms (casse, accents), téléphones au format international, dates, codes postaux, numéro SIRE, numéro de licence FFE, IBAN.
5. **Détection de doublons** : clé forte quand elle existe (numéro de licence FFE pour un cavalier, numéro SIRE ou de transpondeur pour un cheval, email), sinon rapprochement approché (nom, prénom, date de naissance ; nom du cheval et année). Trois issues : fusion automatique, création, ou file « à vérifier ».
6. **Regroupement en familles** : même adresse, même email ou même payeur.
7. **Essai à blanc** : rapport avant écriture (créations, mises à jour, rejets avec motif ligne par ligne), fichier des rejets téléchargeable et réimportable.
8. **Import réel réversible** : chaque import porte un identifiant de lot et peut être annulé en bloc pendant 30 jours.
9. **Reprise des soldes** : cartes de cours restantes, avoirs, impayés, échéanciers en cours, repris à une date de bascule, avec une écriture d'ouverture.
10. **Double fonctionnement court** : une à deux semaines, puis bascule ; import différentiel possible.

### 8.3 Import assisté par IA

- **Depuis Excel ou CSV** : un modèle de langage lit les en-têtes et un échantillon, propose le mapping et les règles de transformation ; il n'écrit rien lui-même.
- **Depuis des photos ou des PDF** (cahier de reprises, registre papier, livret, factures, ordonnances) : extraction vers un tableau structuré, avec un indice de confiance par cellule ; tout ce qui est incertain passe en validation humaine.
- **Documents d'identification des chevaux** : lecture du numéro SIRE, puis complément par l'API Équidés (point 1.2).
- Garde-fous : l'IA propose, l'humain valide ; pas de données de santé humaines envoyées à un modèle sans base légale ; traitement dans l'Union européenne ; journal de chaque import.

Priorité : modèles, mapping et doublons en P0 ; IA sur fichiers en P1 ; IA sur photos en P1 à P2.

---

## 9. MCP et API

### 9.1 État de la spécification MCP (novembre 2026)

Révision en vigueur : **2026-07-28**, qui succède à 2025-11-25. VÉRIFIÉ : https://modelcontextprotocol.io/specification/2026-07-28/changelog et https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization.

| Sujet | État | Statut |
|---|---|---|
| Primitives serveur | **Outils** (actions appelées par le modèle), **ressources** (données lisibles identifiées par une URI), **prompts** (modèles de demande proposés à l'utilisateur). | SUPPOSÉ pour la définition (inchangée de longue date) |
| Protocole sans état | Plus de poignée de main `initialize` ; chaque requête porte la version du protocole et les capacités du client. Plus de session ni d'en-tête `Mcp-Session-Id`. Un état entre appels passe par des identifiants créés par le serveur et transmis comme arguments d'outil. | VÉRIFIÉ |
| Découverte | Nouvelle méthode obligatoire `server/discover` (versions, capacités, identité). | VÉRIFIÉ |
| Transport | **Streamable HTTP** (requêtes POST, réponse éventuellement en flux) et STDIO pour le local. L'ancien transport HTTP+SSE est déprécié. Reprise de flux supprimée : une requête interrompue est réémise. En-têtes `Mcp-Method` et `Mcp-Name` requis. | VÉRIFIÉ |
| Notifications | `subscriptions/listen` remplace le point GET et les abonnements aux ressources. | VÉRIFIÉ |
| Demandes du serveur à l'utilisateur | Modèle **MRTR** : le serveur répond `input_required` avec ses questions, le client rejoue la requête avec les réponses. Tout résultat porte un champ `resultType`. C'est le mécanisme à utiliser pour confirmer une écriture. | VÉRIFIÉ |
| Tâches longues | Sorties du cœur, devenues une extension officielle (`io.modelcontextprotocol/tasks`) avec interrogation par `tasks/get`. | VÉRIFIÉ |
| Dépréciations | Roots, Sampling, Logging ; fenêtre de dépréciation d'au moins douze mois. | VÉRIFIÉ |
| Cache | `ttlMs` et `cacheScope` obligatoires sur les listes et lectures de ressources ; ordre déterministe recommandé pour `tools/list`. | VÉRIFIÉ |
| Schémas | Entrées et sorties d'outil en JSON Schema 2020-12 ; `structuredContent` libre. | VÉRIFIÉ |
| Autorisation | Optionnelle, mais en HTTP : **OAuth 2.1** avec PKCE ; le serveur MCP est un serveur de ressources et **doit** publier ses métadonnées (RFC 9728) ; le client **doit** envoyer le paramètre `resource` (RFC 8707) ; le serveur **doit** vérifier que le jeton lui est destiné et **ne doit pas** relayer de jeton vers un autre service ; enregistrement du client par **Client ID Metadata Documents** (l'enregistrement dynamique RFC 7591 est déprécié) ; scopes annoncés dans `WWW-Authenticate`, avec élévation progressive (403 `insufficient_scope`) ; validation du paramètre `iss` (RFC 9207). | VÉRIFIÉ |
| Annotations d'outil | `readOnlyHint`, `destructiveHint`, `idempotentHint` : indications pour le client, pas une garantie de sécurité. | SUPPOSÉ (introduites en 2025, non relues) |

Conséquences pour Piaffe : serveur MCP distant en Streamable HTTP, sans état, à une adresse par environnement (par exemple `https://mcp.piaffe.fr/mcp`) ; serveur d'autorisation OAuth 2.1 commun à l'API REST et au MCP ; compatibilité descendante avec 2025-11-25 tant que les assistants du marché n'ont pas tous migré (à mesurer).

### 9.2 Serveur MCP Piaffe : principes

- **Une seule couche métier** : chaque outil MCP appelle la même logique que l'API REST et que l'application ; aucun droit propre au MCP.
- **L'assistant agit au nom d'un utilisateur** : il hérite de son rôle et de son écurie, jamais plus.
- **Lecture par défaut** : à la connexion, seuls les scopes de lecture sont demandés ; l'écriture s'obtient par élévation.
- **Peu d'outils, bien nommés** : 36 outils, préfixés par domaine, plutôt qu'un outil par point d'API.
- **Réponses sobres** : identifiants stables, montants en centimes et en euros, dates ISO, pagination, et un champ `donnees_au` indiquant la fraîcheur.

### 9.3 Liste des outils (36)

L = lecture, E = écriture. Confirmation : « non » (lecture), « oui » (aperçu puis validation par l'utilisateur), « double » (validation plus ressaisie d'un élément, pour l'argent et l'irréversible).

| # | Outil | Description | Périmètre | Confirmation | Rôles |
|---|---|---|---|---|---|
| 1 | `ecurie_apercu` | Carte d'identité de l'écurie : sites, effectifs, taux d'occupation des boxes, modules actifs. Premier outil à appeler. | L | non | tous |
| 2 | `ecurie_tableau_de_bord` | Indicateurs sur une période : chiffre d'affaires, impayés, remplissage des cours, adhérents actifs. | L | non | gérant, comptable |
| 3 | `adherents_rechercher` | Recherche par nom, famille, niveau, statut de licence, forfait. | L | non | gérant, accueil, coach (ses élèves) |
| 4 | `adherent_fiche` | Fiche complète : famille, forfaits, crédits, solde, galop, documents à jour ou manquants. | L | non | gérant, accueil, coach (limité) |
| 5 | `adherent_creer_ou_modifier` | Crée ou modifie un adhérent ou un représentant légal. | E | oui | gérant, accueil |
| 6 | `adherent_documents_manquants` | Liste les pièces manquantes ou expirées (licence, autorisation parentale, contrat signé). | L | non | gérant, accueil |
| 7 | `chevaux_rechercher` | Recherche par nom, SIRE, propriétaire, box, statut (club, pension, demi-pension). | L | non | gérant, soigneur, coach, propriétaire (les siens) |
| 8 | `cheval_fiche` | Identité, propriétaire, pension, ration, charge de travail récente, prochains soins. | L | non | idem |
| 9 | `cheval_creer_ou_modifier` | Crée ou modifie un cheval ; pré-remplit depuis le numéro SIRE. | E | oui | gérant |
| 10 | `cheval_sante_historique` | Registre d'élevage du cheval : vaccins, vermifuges, maréchal, dentiste, vétérinaire, traitements. | L | non | gérant, soigneur, propriétaire (les siens) |
| 11 | `cheval_soin_enregistrer` | Ajoute un soin au registre (écriture datée, non supprimable). | E | oui | gérant, soigneur |
| 12 | `sante_echeances` | Soins à venir ou en retard pour toute l'écurie, sur N jours. | L | non | gérant, soigneur |
| 13 | `cheval_charge_travail` | Heures de travail par cheval sur une période, alertes de surcharge ou de repos insuffisant. | L | non | gérant, coach |
| 14 | `boxes_occupation` | Plan d'occupation des boxes et paddocks, disponibilités à une date. | L | non | gérant, soigneur |
| 15 | `pension_contrats_lister` | Contrats de pension et de demi-pension : tarif, échéance, état de signature. | L | non | gérant, comptable |
| 16 | `pension_contrat_creer` | Prépare un contrat et l'envoie en signature électronique. | E | oui | gérant |
| 17 | `planning_consulter` | Cours, stages, réservations d'installations et soins sur une période. | L | non | tous (filtré) |
| 18 | `cours_places_disponibles` | Créneaux où il reste des places, par niveau et discipline. | L | non | tous |
| 19 | `cours_inscrire` | Inscrit un cavalier à une séance ou une reprise ; débite sa carte si besoin. | E | oui | gérant, accueil, adhérent (lui-même ou son enfant) |
| 20 | `cours_annuler_ou_reporter` | Annule ou reporte une séance et prépare le message aux inscrits. | E | oui | gérant, coach (ses cours) |
| 21 | `cours_presences_saisir` | Enregistre les présences et la monte (quel cavalier sur quel cheval). | E | oui | coach, accueil |
| 22 | `cartes_solde` | Soldes des cartes de cours et crédits, cartes bientôt expirées. | L | non | gérant, accueil, adhérent (les siens) |
| 23 | `factures_rechercher` | Factures et avoirs par client, période, statut. | L | non | gérant, comptable, adhérent (les siennes) |
| 24 | `facture_creer_brouillon` | Prépare une facture en brouillon (jamais émise directement). | E | oui | gérant, comptable |
| 25 | `facture_emettre` | Émet un brouillon : numérotation définitive, irréversible. | E | double | gérant, comptable |
| 26 | `impayes_lister` | Impayés par ancienneté, avec historique des relances. | L | non | gérant, comptable |
| 27 | `relance_preparer` | Rédige les relances d'impayés ; envoi seulement après validation. | E | oui | gérant, comptable |
| 28 | `encaissement_enregistrer` | Enregistre un chèque, des espèces ou un virement reçu. Ne déclenche jamais de débit de carte ni de prélèvement. | E | oui | gérant, accueil, comptable |
| 29 | `prelevements_prochains` | Échéancier des prélèvements à venir et des rejets récents. | L | non | gérant, comptable |
| 30 | `compta_export_generer` | Génère un export d'écritures (FEC ou format du logiciel) pour une période. | L (produit un fichier) | non | gérant, comptable |
| 31 | `equipe_planning` | Planning du personnel, absences, heures pointées. | L | non | gérant ; salarié (le sien) |
| 32 | `equipe_heures_exporter` | Prépare l'export mensuel des variables de paie. | L (produit un fichier) | non | gérant |
| 33 | `concours_engagements` | Concours à venir, cavaliers et chevaux engagés, frais à refacturer. | L | non | gérant, coach |
| 34 | `taches_lister_ou_creer` | Tâches d'entretien et de maintenance (curage, clôtures, matériel) ; création d'une tâche. | L et E | oui pour la création | gérant, soigneur |
| 35 | `message_preparer` | Rédige un email, SMS ou notification pour un groupe ciblé ; renvoie un aperçu et le nombre de destinataires. | E | oui | gérant, accueil, coach (ses élèves) |
| 36 | `message_envoyer` | Envoie un message préparé et validé. Plafond de destinataires par appel. | E | double au-delà de 20 destinataires | gérant, accueil |

Volontairement **hors MCP** : supprimer un adhérent, un cheval ou une facture ; rembourser ; déclencher un prélèvement ; modifier un IBAN ; gérer les droits et les utilisateurs ; accéder aux flux vidéo ; lire le contenu d'un certificat médical ; exporter en masse des données personnelles.

### 9.4 Ressources

| URI | Contenu |
|---|---|
| `piaffe://ecurie/profil` | Fiche de l'écurie, sites, horaires |
| `piaffe://ecurie/tarifs` | Grille tarifaire et taux de TVA par prestation |
| `piaffe://ecurie/reglement-interieur` | Règlement intérieur en vigueur |
| `piaffe://ecurie/modeles-contrats/{type}` | Modèles : pension, demi-pension, inscription |
| `piaffe://planning/semaine/{date}` | Planning de la semaine |
| `piaffe://chevaux/{id}/fiche` | Fiche synthétique d'un cheval |
| `piaffe://adherents/{id}/fiche` | Fiche synthétique d'un adhérent |
| `piaffe://rapports/mensuel/{aaaa-mm}` | Rapport mensuel d'activité |
| `piaffe://referentiels/galops` | Référentiel des niveaux |
| `piaffe://aide/glossaire` | Vocabulaire Piaffe (reprise, monte, forfait, carte) pour guider le modèle |

Chaque lecture renvoie `ttlMs` et `cacheScope: "private"` (exigé par la révision 2026-07-28).

### 9.5 Prompts proposés

`point_du_matin` (ce qui demande une action aujourd'hui), `bilan_du_mois`, `preparer_la_rentree` (réinscriptions, licences, Pass'Sport), `relancer_les_impayes`, `bilan_sante_ecurie`, `equilibrer_la_cavalerie` (charge de travail), `preparer_un_concours`.

### 9.6 Garde-fous

| Garde-fou | Mise en œuvre |
|---|---|
| Permissions par rôle | Rôles : gérant, accueil, coach, soigneur, comptable, propriétaire, adhérent ou parent. Contrôle fait côté serveur à chaque appel ; les outils interdits au rôle sont absents de `tools/list`. |
| Scopes OAuth | `lecture:club`, `lecture:finance`, `lecture:sante`, `lecture:rh`, `ecriture:planning`, `ecriture:club`, `ecriture:finance`, `ecriture:messages`. Lecture seule par défaut, élévation à la demande. |
| Confirmation des écritures | Toute écriture renvoie d'abord un **aperçu** (ce qui va changer, pour qui, pour combien) via le mécanisme `input_required` ; rien n'est écrit sans validation par l'utilisateur. Si l'assistant ne gère pas ce mécanisme, repli sur deux appels : aperçu avec jeton à durée courte, puis validation. |
| Double confirmation | Émission de facture, envoi à plus de 20 personnes. |
| Jamais par IA | Mouvements d'argent sortants, suppressions, droits d'accès, IBAN. |
| Idempotence | Clé d'idempotence sur chaque écriture ; un rejeu ne crée pas de doublon. |
| Plafonds | Nombre d'écritures et de messages par heure et par jour, par utilisateur et par écurie. |
| Minimisation | Pas de certificats médicaux ni d'IBAN complets ; mineurs : prénom et initiale par défaut hors rôle gérant ; pas d'export en masse. |
| Injection de consignes | Les textes libres (notes, messages reçus) sont renvoyés marqués comme données, jamais comme instructions. |
| Journal | Chaque appel est tracé (qui, quel assistant, quel outil, quels arguments, quel résultat), consultable par le gérant ; les écritures portent la mention « via assistant ». |
| Révocation | Le gérant voit et coupe les assistants connectés depuis Piaffe. |
| Jeton | Vérification de l'audience ; aucun jeton relayé à un service tiers. |

### 9.7 API REST publique

| Élément | Conception proposée |
|---|---|
| Base | `https://api.piaffe.fr/v1`, JSON, description OpenAPI 3.1 publiée, bac à sable avec écurie fictive |
| Ressources | `/ecuries`, `/sites`, `/adherents`, `/familles`, `/chevaux`, `/proprietaires`, `/boxes`, `/contrats`, `/prestations`, `/forfaits`, `/cartes`, `/cours`, `/seances`, `/inscriptions`, `/presences`, `/factures`, `/avoirs`, `/encaissements`, `/mandats`, `/soins`, `/registre-elevage`, `/mesures` (ingestion capteurs), `/taches`, `/salaries`, `/pointages`, `/concours`, `/engagements`, `/documents`, `/messages`, `/exports`, `/imports`, `/webhooks` |
| Authentification | OAuth 2.1 avec PKCE pour les applications tierces agissant pour un utilisateur ; identifiants client pour les échanges de serveur à serveur ; jetons personnels à périmètre restreint pour les scripts d'une écurie. Mêmes scopes que le MCP. |
| Conventions | Pagination par curseur ; filtres et `modifie_depuis` pour la synchronisation ; en-tête `Idempotency-Key` ; erreurs au format RFC 9457 ; version dans le chemin, 12 mois de préavis avant retrait ; identifiants externes (`ref_externe`) sur chaque objet pour les reprises de données. |
| Limites | Par défaut 120 requêtes par minute et par jeton, 10 000 par jour et par écurie ; rafale tolérée ; en-têtes `RateLimit-*` ; réponse 429 avec `Retry-After`. Valeurs de départ à ajuster à l'usage. |
| Webhooks | Événements : `adherent.cree`, `adherent.modifie`, `cheval.arrive`, `cheval.parti`, `inscription.creee`, `inscription.annulee`, `seance.annulee`, `presence.saisie`, `facture.emise`, `facture.payee`, `paiement.echoue`, `prelevement.rejete`, `contrat.signe`, `soin.enregistre`, `soin.en_retard`, `carte.epuisee`, `document.expire`, `mesure.alerte`. Signature HMAC avec horodatage, reprises pendant 72 heures avec délais croissants, identifiant d'événement pour dédoublonner, journal et rejeu manuel. |
| Automatisation sans code | Connecteurs Zapier, Make et n8n bâtis sur l'API et les webhooks (P2). |

### 9.8 Questions qu'un gérant poserait à son IA

1. « Qui n'a pas payé sa pension de novembre, et depuis quand ? »
2. « Quels chevaux doivent être vaccinés ou vermifugés dans les trois prochaines semaines ? »
3. « Est-ce que Quartz travaille trop ? Combien d'heures cette semaine par rapport à la moyenne ? »
4. « Il me reste combien de places dans les reprises galop 3 du mercredi ? »
5. « Prépare un message aux cavaliers du cours de 17 h : annulé pour gel, report samedi 10 h. »
6. « Quel est mon chiffre d'affaires d'octobre par activité, comparé à l'an dernier ? »
7. « Quelles cartes de 10 séances expirent avant Noël ? »
8. « Quels adhérents n'ont pas encore leur licence pour 2027 ? »
9. « J'ai un box libre à partir de quand, et qui est sur liste d'attente ? »
10. « Sors-moi les heures de l'équipe pour la paie de novembre. »
11. « Combien de Pass'Sport ai-je acceptés cette saison, et lesquels restent à déclarer ? »
12. « Quels propriétaires n'ont pas signé leur nouveau contrat de pension ? »
13. « Prépare les factures de pension de décembre en brouillon et montre-moi le total. »
14. « Quels cavaliers sont engagés au concours de dimanche, sur quels chevaux, et qu'est-ce que je dois refacturer ? »
15. « Quel est mon taux de remplissage des cours du samedi matin depuis la rentrée ? »

---

## 10. RGPD

Vérifié sur le site de la CNIL : les règles de vidéosurveillance au travail (https://www.cnil.fr/fr/node/998). Le reste de cette section est SUPPOSÉ (règles connues mais non relues ce jour) et doit être validé par un juriste ou un délégué à la protection des données.

| Sujet | Règle | Effet dans Piaffe | Statut |
|---|---|---|---|
| Rôles | L'écurie est responsable de traitement, Piaffe est sous-traitant. | Contrat de sous-traitance (article 28) dans les conditions générales, liste des sous-traitants ultérieurs, registre des traitements pré-rempli pour le club. | SUPPOSÉ |
| Mineurs | Majorité numérique à 15 ans en France pour le consentement en ligne ; en dessous, consentement conjoint avec le titulaire de l'autorité parentale. La plupart des traitements d'un club reposent sur le contrat signé par le parent, pas sur le consentement. | Compte « famille » : le parent est titulaire, l'enfant est un profil rattaché ; compte autonome possible à partir de 15 ans ; droit à l'image demandé séparément, facultatif, révocable ; pas de profilage ni de publicité ciblée sur des mineurs ; informations rédigées simplement. | SUPPOSÉ |
| Données de santé | Catégorie particulière (article 9). | **Ne pas stocker le certificat médical** : enregistrer « présenté le », « valable jusqu'au », et l'attestation du questionnaire de santé. Les informations utiles en urgence (allergies, personne à prévenir) sont facultatives, chiffrées, visibles des seuls rôles habilités, avec consentement explicite. Aucune de ces données dans le MCP ni dans les exports. | SUPPOSÉ |
| Hébergement de données de santé | La certification HDS vise les données de santé recueillies lors d'activités de soin ; un club n'en relève pas en principe. | Ne pas se créer l'obligation : s'en tenir à l'indicateur. À confirmer par un juriste si un jour Piaffe stocke les certificats. | SUPPOSÉ |
| Données de santé des chevaux | Pas des données personnelles en soi, mais reliées à un propriétaire identifié. | Droits d'accès par cheval ; le propriétaire ne voit que les siens. | SUPPOSÉ |
| Vidéosurveillance : salariés | Finalité légitime définie à l'avance (sécurité des biens et des personnes). **Interdit de filmer un salarié en continu à son poste**, de filmer les lieux de pause, toilettes, locaux syndicaux. L'accès à distance doit être sécurisé et **ne doit pas servir à surveiller le travail**. Seules les personnes habilitées voient les images. | Une caméra de box filme un cheval mais aussi le soigneur qui y travaille : cadrage serré, plages horaires, masquage de zones, pas de son par défaut ; droits par caméra ; **journal de chaque visionnage** ; interdiction contractuelle d'usage disciplinaire hors incident. | VÉRIFIÉ (CNIL) |
| Vidéosurveillance : conservation | Durée fixée par le responsable selon la finalité, **en principe pas plus d'un mois** ; la capacité de stockage ne justifie pas une durée. | Durée réglable, 30 jours au plus par défaut, purge automatique ; extraction tracée en cas d'incident. | VÉRIFIÉ (CNIL) |
| Vidéosurveillance : information | Panneaux visibles et permanents (finalités, durée, contact, droits, réclamation à la CNIL). Consultation des représentants du personnel avant installation. | Modèle de panneau et de note d'information fournis ; case de conformité à cocher avant d'activer une caméra. | VÉRIFIÉ (CNIL) |
| Vidéosurveillance : lieux ouverts au public | Autorisation préfectorale préalable pour les zones accessibles au public (accueil, club-house, parking) ; analyse d'impact en cas de surveillance systématique à grande échelle. | Type de zone demandé à l'ajout d'une caméra, avec rappel de la formalité. | VÉRIFIÉ (CNIL) |
| Vidéo partagée aux propriétaires | Un propriétaire qui regarde son cheval peut voir des salariés, d'autres clients, des mineurs. | Accès limité à la caméra de son box, pas d'enregistrement téléchargeable par défaut, pas de caméra sur les aires où montent des mineurs sans analyse d'impact. | Conception Piaffe |
| IA | Analyse vidéo et assistants. | Analyse d'impact pour l'analyse vidéo ; pas d'entraînement de modèles sur les données des clients sans accord ; traitement dans l'Union européenne ; information des personnes ; suivi du règlement européen sur l'IA. | SUPPOSÉ |
| Hébergement en France | Pas d'obligation légale générale pour un club, mais argument commercial fort et simplification des transferts. | Hébergement en France ou dans l'Union européenne chez un fournisseur européen (OVHcloud, Scaleway, Clever Cloud ; qualification SecNumCloud en option) ; sous-traitants américains (Stripe, Twilio, Meta) listés, avec clauses contractuelles types ou cadre transatlantique ; préférer Brevo et Yousign quand c'est possible. | SUPPOSÉ |
| Durées de conservation | Pièces comptables 10 ans ; registre d'élevage 5 ans (vérifié, point 1.3) ; images un mois au plus (vérifié) ; prospects 3 ans après le dernier contact. | Politique de purge par type de donnée, paramétrable et documentée. | SUPPOSÉ sauf mentions |
| Droits des personnes | Accès, rectification, effacement, portabilité. | Export de ses données par l'adhérent depuis le portail ; anonymisation au lieu de suppression quand une facture doit être conservée. | SUPPOSÉ |
| Sécurité | Chiffrement en transit et au repos, double authentification pour les gérants, cloisonnement strict par écurie, sauvegardes testées, notification de violation sous 72 heures. | Exigences de base, P0. | SUPPOSÉ |
| Prospection | Consentement préalable pour les emails et SMS commerciaux aux particuliers. | Consentements distincts et horodatés par canal. | SUPPOSÉ |

---

## Catalogue de connecteurs Piaffe

Sens des données : **Entrant** = vers Piaffe ; **Sortant** = depuis Piaffe ; **Bidirectionnel**.

| # | Connecteur | Catégorie | Sens des données | Priorité |
|---|---|---|---|---|
| 1 | FFE Club SIF — licences (télétransmission sous agrément) | Fédéral | Bidirectionnel | P0 (dossier), P1 (livraison) |
| 2 | FFE Club SIF — import de fichier (licenciés, XML concours club) | Fédéral | Entrant | P0 |
| 3 | FFE Compet — import des engagements et résultats (CSV, XLS) | Fédéral | Entrant | P1 |
| 4 | FFE — DUC (préparation de la déclaration de concours) | Fédéral | Sortant | P2 |
| 5 | FFE Connect — connexion du cavalier | Fédéral | Entrant | P2 |
| 6 | API Équidés / open data IFCE — fiche cheval par SIRE | Public | Entrant | P0 |
| 7 | SIRE — rappels de démarches (lieu de détention, propriétaire) | Public | Sortant (liens, récapitulatifs) | P1 |
| 8 | Registre d'élevage — export PDF trimestriel archivé | Réglementaire | Sortant | P0 |
| 9 | Pass'Sport — codes et liste de déclaration | Aides | Bidirectionnel (manuel) | P0 |
| 10 | Chèque-Vacances Connect via prestataire de paiement | Paiement | Bidirectionnel | P1 |
| 11 | Chèques-vacances papier et coupons sport — bordereaux | Paiement | Sortant | P0 |
| 12 | Stripe (carte, SEPA, Connect) | Paiement | Bidirectionnel | P0 |
| 13 | GoCardless (mandats et prélèvements SEPA) | Paiement | Bidirectionnel | P0 |
| 14 | Mollie | Paiement | Bidirectionnel | P2 |
| 15 | SumUp (terminal de paiement) | Paiement | Bidirectionnel | P1 |
| 16 | Zettle par PayPal (terminal) | Paiement | Bidirectionnel | P2 |
| 17 | Remise de prélèvements SEPA en fichier (pain.008) | Paiement | Sortant | P1 |
| 18 | Remise de chèques — bordereau | Paiement | Sortant | P0 |
| 19 | Paiement fractionné (Alma ou équivalent) | Paiement | Bidirectionnel | P2 |
| 20 | Export d'écritures au format FEC | Comptabilité | Sortant | P0 |
| 21 | Pennylane | Comptabilité | Bidirectionnel | P0 |
| 22 | Tiime | Comptabilité | Sortant | P1 |
| 23 | Cegid (Loop, Quadra) | Comptabilité | Sortant | P1 |
| 24 | Sage | Comptabilité | Sortant | P1 |
| 25 | EBP | Comptabilité | Sortant | P1 |
| 26 | Isagri / Agiris (comptabilité et paie agricoles) | Comptabilité et paie | Sortant | P1 |
| 27 | QuickBooks | Comptabilité | Sortant | P2 |
| 28 | Plateforme agréée de facturation électronique (Factur-X, e-reporting) | Facturation | Bidirectionnel | P1 (avant septembre 2027) |
| 29 | Chorus Pro (factures aux collectivités), via la plateforme agréée | Facturation | Sortant | P2 |
| 30 | Qonto | Banque | Entrant | P1 |
| 31 | Bridge ou Powens (agrégation bancaire) | Banque | Entrant | P1 |
| 32 | Relevés bancaires en fichier (CSV, OFX, CAMT.053) | Banque | Entrant | P1 |
| 33 | Yousign | Signature | Bidirectionnel | P0 |
| 34 | Docusign | Signature | Bidirectionnel | P2 |
| 35 | Dropbox Sign | Signature | Bidirectionnel | P2 |
| 36 | Export générique des variables de paie (CSV, Excel) | RH et paie | Sortant | P0 |
| 37 | PayFit | RH et paie | Bidirectionnel | P1 |
| 38 | Silae | RH et paie | Sortant | P1 |
| 39 | Lucca | RH | Bidirectionnel | P2 |
| 40 | Combo | RH (planning) | Bidirectionnel | P2 |
| 41 | Skello | RH (planning) | Bidirectionnel | P2 |
| 42 | Brevo (email et SMS) | Communication | Sortant (plus statuts de remise) | P0 |
| 43 | Twilio (SMS) | Communication | Sortant | P2 |
| 44 | WhatsApp Business (Cloud API) | Communication | Bidirectionnel | P1 |
| 45 | Notifications push (APNs, FCM, Web Push) | Communication | Sortant | P0 |
| 46 | Flux ICS par personne (dont Apple Calendrier) | Calendrier | Sortant | P0 |
| 47 | Google Agenda | Calendrier | Bidirectionnel | P1 |
| 48 | Outlook / Microsoft 365 | Calendrier | Bidirectionnel | P2 |
| 49 | Passerelle caméras (RTSP et ONVIF vers WebRTC et HLS) | Matériel | Entrant | P1 |
| 50 | API d'ingestion de mesures (capteurs, MQTT) | Matériel | Entrant | P2 |
| 51 | Seaver | Capteurs | Entrant | P2 |
| 52 | Equisense | Capteurs | Entrant | P2 |
| 53 | Arioneo (Equimetre) | Capteurs | Entrant | P2 |
| 54 | Nightwatch | Capteurs | Entrant | P2 |
| 55 | Balances, abreuvoirs, sondes d'ambiance | Capteurs | Entrant | P2 |
| 56 | Contrôle d'accès (portail, sellerie) | Matériel | Bidirectionnel | P2 |
| 57 | Domotique (éclairage de carrière, Home Assistant, relais) | Matériel | Bidirectionnel | P2 |
| 58 | Import générique Excel et CSV avec mapping et doublons | Reprise de données | Entrant | P0 |
| 59 | Import assisté par IA (Excel, PDF, photos) | Reprise de données | Entrant | P1 |
| 60 | Reprise Kavalog (mapping mémorisé) | Reprise de données | Entrant | P0 |
| 61 | Reprise Equimondo (mapping mémorisé) | Reprise de données | Entrant | P1 |
| 62 | Reprise GCE, Horse-Manager, Equionline et autres | Reprise de données | Entrant | P1 |
| 63 | Reprise depuis logiciels d'associations (AssoConnect, HelloAsso) | Reprise de données | Entrant | P2 |
| 64 | Serveur MCP Piaffe | IA | Bidirectionnel | P0 (lecture), P1 (écriture) |
| 65 | API REST publique | Plateforme | Bidirectionnel | P0 |
| 66 | Webhooks | Plateforme | Sortant | P0 |
| 67 | Zapier, Make, n8n | Plateforme | Bidirectionnel | P2 |

---

## Sources lues le 17 novembre 2026

- MCP, journal des changements 2026-07-28 : https://modelcontextprotocol.io/specification/2026-07-28/changelog
- MCP, autorisation : https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- API Équidés (data.gouv.fr) : https://www.data.gouv.fr/dataservices/api-equides
- Guide du détenteur SIRE : https://www.aqps.fr/wp-content/uploads/2023/03/SIRE-Guide-Detenteur-WEB.pdf
- BOFiP, TVA des établissements équestres (15 mai 2024) : https://bofip.impots.gouv.fr/doctrine/pgp/14203-PGP
- Légifiscal, TVA à 5,5 % : https://www.legifiscal.fr/actualites-fiscales/3783-taux-reduit-tva-55-etablissements-equestres.html
- Convention collective IDCC 7012 : https://www.legisocial.fr/conventions-collectives-nationales/7012-personnel-des-centres-equestres/
- Convention collective IDCC 7026 : https://www.legisocial.fr/conventions-collectives-nationales/7026-personnel-des-activites-hippiques/
- Certificat de compétence transport : https://www.mapa-assurances.fr/marchand-bestiaux/certificat-competences-conducteurs-convoyeurs
- Facturation électronique, calendrier : https://entreprendre.service-public.gouv.fr/actualites/A15683
- Plateformes agréées : https://www.presse-citron.net/facturation-electronique-entre-vigueur-aujourdhui-voici-149-plateformes-agreees-france/
- E-reporting : https://pro.credit-agricole.fr/comptabilite/facture/electronique/e-reporting
- Logiciels de caisse, loi de finances 2026 : https://entreprendre.service-public.gouv.fr/actualites/A18087
- Pass'Sport 2026 : https://www.sports.gouv.fr/le-dispositif-pass-sport-de-retour-pour-la-rentree-2026-10272
- Chèque-Vacances Connect chez HiPay : https://developer.hipay.com/online-payments/payment-means/cheque-vacances-connect
- Pennylane, MCP : https://www.pennylane.com/fr/mcp
- PayFit, index de la documentation développeur : https://developers.payfit.io/llms.txt
- CNIL, vidéosurveillance au travail : https://www.cnil.fr/fr/node/998
- Comparatif de logiciels équestres (éditeur concurrent, à lire avec recul) : https://www.equirider.fr/logiciel-gestion-equestre/
- Espaces FFE (source tierce) : https://www.equirider.fr/compte-ffe-sif-gestion-connexion/
- Exports FFE Compet et Club SIF (source tierce) : https://www.paddockroom.app/fonctionnalites/import-ffeccompet-club-sif/
- Equimondo (fiche Capterra) : https://www.capterra.fr/software/1033887/equimondo

Pages repérées mais non lues (citées comme pistes dans le texte) : documentation Stripe, GoCardless, Mollie, Qonto, Pennylane API, Yousign, tarification WhatsApp, go2rtc, guide transport FNCH, kit d'intégration ANCV, plaquette pharmacie IFCE. Pour celles marquées VÉRIFIÉ dans les tableaux, seule l'existence de la page officielle a été constatée dans les résultats de recherche, pas son contenu détaillé.
