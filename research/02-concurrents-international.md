# Piaffe — Audit des concurrents internationaux et des technologies connexes

Date de recherche : 17 novembre 2026. Web accessible : oui (recherche + lecture de pages).

**Méthode et limites à connaître avant de lire**

- **VÉRIFIÉ** = lu ce jour sur la page citée. **SUPPOSÉ** = de mémoire ou par déduction, non confirmé par une page lue. **Non trouvé** = cherché, pas d'information publique.
- Beaucoup de données viennent des annuaires Capterra / GetApp / Software Advice. Leurs listes de fonctionnalités sont des cases cochées par l'éditeur, pas des tests ; leurs prix sont parfois périmés ou contradictoires avec le site officiel (signalé au cas par cas). Quand le site officiel a pu être lu, c'est lui qui fait foi.
- Les pays ne figurent presque jamais sur ces pages : la plupart sont marqués SUPPOSÉ.
- Aucun produit n'a été testé en main. Les « points faibles » viennent d'avis utilisateurs cités, souvent peu nombreux (4 à 50 avis) et parfois anciens.
- Site officiel d'Equestrian Connect (EC Pro) : lecture refusée par le site (robots). Fiche bâtie sur les annuaires.
- Deux noms de la liste de départ n'ont pas été retrouvés tels quels : « EquiTrack » (trouvé : EquiTraq, Suède, et EquiTrace, traçabilité médicale) et « iStable » (trouvé : une ancienne fiche d'app et miStable, orienté courses). Voir les fiches.

---

## 1. Synthèse en 10 lignes

1. Le marché mondial est émietté : une trentaine de petits éditeurs, aucun leader. Le mieux noté en volume sur Capterra n'a que 50 avis (Stable Secretary) ; aucun acteur ne couvre club + pensions + cours + compta + RH + compétition + connecté.
2. Deux familles ne se recouvrent presque pas : les logiciels « écurie / santé du cheval » (BarnManager, Stable Secretary, Equicty, CRIO, HRS) et les logiciels « école d'équitation / réservation » (EC Pro, Hopoti, Equestrian Systems). Piaffe doit faire les deux dans le même produit.
3. Les prix publics sont bas : de 10 à 100 $ ou € par mois pour une écurie, souvent par paliers de nombre de chevaux. EC Pro (75 $/mois + frais de réservation) et Equicty (modules à la carte) montent le panier.
4. La comptabilité est partout sous-traitée à QuickBooks ou Xero ; personne ne fait de vraie compta ni de RH/paie. Aucune prise en compte des spécificités françaises (FEC, TVA équine, licences FFE, SIRE) : c'est un fossé naturel pour Piaffe.
5. Les API publiques sont rares : Equicty (option payante à 13 €/mois), Horse Report System (annoncée), HorseManager (550 € + 100 €/an), Playtomic et Glofox la réservent aux offres hautes. Aucun logiciel équestre de gestion ne propose de connecteur MCP ; le seul MCP équestre trouvé est un annuaire américain en lecture seule.
6. L'IA est quasi absente côté gestion. Elle existe côté cavalier (coach IA de Ridely, analyse de position d'EquiTraq) et côté matériel (caméras de box, analyse de locomotion). Hors équitation, Golfmanager a lancé en septembre 2026 un MCP en bêta pour piloter le club depuis ChatGPT, Claude ou Gemini : c'est la référence à égaler.
7. Les plaintes récurrentes des utilisateurs : pas de notifications push, prise en main longue, export de données difficile, calendrier peu pratique, factures peu flexibles.
8. Le connecté est un monde en silos : chaque capteur ou caméra a son app, aucun ne publie d'intégration avec un logiciel d'écurie. Une plateforme qui agrège ces flux dans la fiche du cheval n'existe pas.
9. Les caméras de box avec IA sont mûres et abordables (Horcery 899 $ + 19,99 $/mois ; Acaris Stable Guard 39,99 €/mois ; Novostable 599 €) : détection de coliques, cheval couché, poulinage, intrusion.
10. Pour la réservation de coachs, l'équitation n'a que de petits acteurs (Hopoti, Equine Bookings). Les modèles à copier viennent d'ailleurs : Playtomic (remplissage et communauté), Mindbody (place de marché à commission plafonnée), ClassPass (tarif dynamique sur les créneaux vides), Glofox (app à la marque du club).

---

## 2. Fiches par acteur

### 2.1 Logiciels de gestion d'écurie et de club

#### BarnManager
- **Pays** : États-Unis (SUPPOSÉ).
- **Cible** : écuries de propriétaires, cavaliers pro, pensions, associations de sauvetage. VÉRIFIÉ (Capterra).
- **Modules** (VÉRIFIÉ, barnmanager.com/pricing) : fiches chevaux numériques, calendrier partagé, contacts et prestataires, alimentation / compléments / médicaments, rappels d'échéances, rapports. Offre Pro : factures, factures récurrentes automatiques, répartition d'une charge sur plusieurs factures, paiement en ligne, suivi du chiffre d'affaires.
- **Apps** : iOS et Android gratuites. VÉRIFIÉ.
- **Prix** (VÉRIFIÉ, site officiel) : Essentials 40 $/mois ou 400 $/an ; Pro 70 $/mois ou 700 $/an ; utilisateurs et chevaux illimités ; essai 14 ou 30 jours ; gratuit possible pour refuges et centres d'équithérapie reconnus d'utilité publique (501(c)(3)).
- **Points forts** : tarif sans limite de chevaux ni d'utilisateurs ; support très bien noté (4,9/5). VÉRIFIÉ (Capterra, 20 avis, 4,4/5).
- **Points faibles** (avis Capterra, VÉRIFIÉ) : « caractère peu intuitif de certaines fonctions » ; nouvelle version « avec des défauts de jeunesse » ; « télécharger les données devrait être plus simple ». Pas de planning de cours ni de portail adhérent (SUPPOSÉ, absent des listes).
- **Import/export** : export CSV. VÉRIFIÉ. Import : non trouvé.
- **API** : non mentionnée.
- **Intégrations** : QuickBooks Online (offre Pro). VÉRIFIÉ.
- Sources : https://www.barnmanager.com/pricing/ ; https://www.capterra.com/p/164823/BarnManager/

#### Stable Secretary
- **Pays** : États-Unis (SUPPOSÉ ; numéro commercial en indicatif 617).
- **Cible** : propriétaires d'écurie, gérants, entraîneurs ; 98 % de petites structures. VÉRIFIÉ.
- **Modules** (VÉRIFIÉ, Capterra) : fiches chevaux, santé, maréchalerie, reproduction, alimentation, compétitions, tâches, tableau blanc numérique, calendrier, facturation et suivi des paiements, multi-devises, documents, rôles et permissions.
- **Apps** : web, iOS, Android. VÉRIFIÉ.
- **Prix** (VÉRIFIÉ, app.stablesecretary.com/purchase) : Individual (3 chevaux) 6,95 $/mois ; Copper (6) 29,95 $ ; Bronze (15) 39,95 $ ; Silver (30) 49,95 $ ; Gold (illimité) 69,95 $/mois ou 799,95 $/an. Garantie de remboursement 30 jours. Les prix affichés sur Capterra diffèrent : ne pas s'y fier.
- **Points forts** : meilleur volume d'avis du secteur (4,8/5, 50 avis, 98 % positifs) ; support 4,9/5. VÉRIFIÉ.
- **Points faibles** (avis VÉRIFIÉS) : « pas de notifications push dans l'app mobile » ; la section compétition « ne convient pas au dressage » ; l'app plante parfois ; écarts de prix entre paliers jugés illogiques ; « peu de flexibilité sur les relevés » ; app « moins conviviale que le site ».
- **Import/export** : non trouvé.
- **API** : non mentionnée.
- **Intégrations** : QuickBooks Online, Stripe, Elavon. VÉRIFIÉ.
- Sources : https://app.stablesecretary.com/purchase ; https://www.capterra.com/p/129021/Stable-Secretary/ ; https://www.softwareadvice.com/horse/stable-secretary-profile/

#### EC Pro (Equestrian Connect)
- **Pays** : Irlande (SUPPOSÉ).
- **Cible** : écoles d'équitation, centres équestres, pensions, équithérapie, événements, location d'installations. VÉRIFIÉ.
- **Modules** (VÉRIFIÉ, Capterra, 55 fonctions déclarées) : réservation et paiement en ligne des cours, liste d'attente, inscriptions, calendrier glisser-déposer, gestion des chevaux et de leur charge, clients, facturation, événements et billetterie, formulaires personnalisables, stocks, employés, marketing et promotions, site web optionnel, rapports.
- **Apps** : web, iOS, Android ; app à la marque de chaque club annoncée. VÉRIFIÉ (annuaire).
- **Prix** : à partir de 75 $/mois, clients / chevaux / utilisateurs illimités, **plus des frais de réservation et de transaction** dont le montant n'est pas publié. VÉRIFIÉ (Capterra, Software Advice). Site officiel non lisible.
- **Points forts** : le plus complet côté école d'équitation ; « guichet unique » ; rappels automatiques qui réduisent les absences ; 4,8/5 sur 33 avis. VÉRIFIÉ.
- **Points faibles** (avis VÉRIFIÉS) : mise en place longue ; « certaines fonctions sont alambiquées » ; lenteurs lors des pics de réservation ; « le calendrier a quelques bugs » ; doublons de factures comptables sur paiements hors ligne ; un avis 1 étoile sur le support.
- **Import/export** : non trouvé.
- **API** : non mentionnée.
- **Intégrations** : Xero, QuickBooks Online, Stripe, Dynamics 365. VÉRIFIÉ.
- Sources : https://www.capterra.com/p/197564/EC-Pro/ ; https://www.softwareadvice.com/event-booking/ec-pro-profile

#### Equicty
- **Pays** : Belgique (SUPPOSÉ ; téléphone en +32).
- **Cible** : deux produits. Equstable pour écuries (sport, élevage, commerce) ; Equclub pour clubs. VÉRIFIÉ.
- **Modules** (VÉRIFIÉ, equicty.com/pricing) : Equstable = chevaux, utilisateurs illimités, CRM, planification du travail, santé, médias, rapports. Options : Finance, Élevage, Nutrition, Compétition, Traçabilité, API publique. Equclub = membres et équipes, portail membre, planification d'événements, boutique en ligne, facturation, encaissement.
- **Apps** : app mobile incluse (iOS/Android selon GetApp). VÉRIFIÉ.
- **Prix** (VÉRIFIÉ, HT, par mois, facturation annuelle / trimestrielle) : jusqu'à 10 chevaux 35 / 39 € ; 11-25 : 59 / 66 € ; 26-50 : 89 / 99 € ; 51-75 : 107 / 119 € ; 76-100 : 131 / 145 € ; 101-150 : 149 / 165 € ; 151-250 : 179 / 199 €. Options : Finance 35 / 39 € ; Élevage 53 / 59 € ; Nutrition 32 / 36 € ; Compétition, Traçabilité, API publique, Paiement en ligne : 12 / 13 € chacune. Essai 21 jours sans carte.
- **Points forts** : seul acteur avec API publique à prix affiché ; facturation électronique Peppol ; données chevaux vérifiées via Hippomundo ; aucune commission sur les paiements Stripe ; 4,7/5 sur 22 avis. VÉRIFIÉ.
- **Points faibles** : « demande plus de formation des utilisateurs qu'il ne devrait, et quelques bizarreries » (avis GetApp, VÉRIFIÉ). L'addition monte vite avec les options (constat sur la grille). Club et écurie sont deux produits séparés.
- **Import/export** : non trouvé.
- **API** : oui, publique, en option payante. VÉRIFIÉ.
- **Intégrations** : Hippomundo, Peppol, Stripe. VÉRIFIÉ.
- Sources : https://www.equicty.com/pricing ; https://www.getapp.com/horse-software/a/equicty

#### CRIO Online
- **Pays** : non trouvé (éditeur : CRIO Equine Software).
- **Cible** : élevages, haras, centres d'entraînement, pensions, clubs. VÉRIFIÉ.
- **Modules** (VÉRIFIÉ, Capterra) : base chevaux, reproduction (récoltes de semence, étalons), module vétérinaire et traitements, alimentation, stocks, facturation, comptabilité, calendrier, tâches, documents, liens publics par QR code vers la fiche d'un cheval.
- **Apps** : web, iOS, Android. VÉRIFIÉ.
- **Prix** (VÉRIFIÉ, Capterra) : Basic 15,90 $/mois (15 chevaux, 1 utilisateur) ; Professional 29,90 $ (100 chevaux, 3 utilisateurs) ; Enterprise 49,90 $ (300 chevaux, 10 utilisateurs, facturation) ; Unlimited 95,90 $. Essai 30 jours.
- **Points forts** : très fort en élevage ; prix bas ; 4,6/5 sur 43 avis. VÉRIFIÉ.
- **Points faibles** (avis VÉRIFIÉS, 2018-2020) : « configuration difficile, beaucoup d'onglets inutiles, peu d'instructions » ; « impossible d'exporter vers Excel ».
- **Import/export** : export Excel absent selon un avis ancien ; état actuel non trouvé.
- **API / intégrations** : non mentionnées.
- Source : https://www.capterra.com/p/154844/Crio-Online/

#### Horse Report System (HRS)
- **Pays** : États-Unis (SUPPOSÉ).
- **Cible** : entraîneurs, propriétaires, gérants d'écurie, pensions ; toutes disciplines y compris western et courses. VÉRIFIÉ.
- **Modules** (VÉRIFIÉ, Capterra) : fiche cheval sur une page, suivi d'activité et de conditionnement, santé, alimentation, reproduction, stocks, communication, rôles, résultats de compétition.
- **Apps** : web, iOS, Android. VÉRIFIÉ.
- **Prix** : à partir de 9,99 $/mois ; cinq paliers annoncés, un seul prix publié. VÉRIFIÉ.
- **Points forts** : simplicité ; 5,0/5 sur 9 avis (avis sollicités par l'éditeur avec incitation, à relativiser). VÉRIFIÉ.
- **Points faibles** (avis VÉRIFIÉS) : calendrier difficile à parcourir ; écran vide tant qu'aucune donnée n'est saisie.
- **API** : oui selon la fiche Capterra. VÉRIFIÉ (déclaratif). Documentation publique : non trouvée.
- **Intégrations** : aucune nommée.
- Source : https://www.capterra.com/p/230603/Horse-Report-System/

#### Paddock Pro
- **Pays** : États-Unis (SUPPOSÉ ; éditeur Alua Software).
- **Cible** : fermes équestres et pensions. VÉRIFIÉ.
- **Modules** : facturation, clients, dépenses, alimentation, base chevaux, reproduction, dossiers médicaux, bilan. VÉRIFIÉ.
- **Prix** : 75 $/utilisateur/mois selon Capterra. VÉRIFIÉ (annuaire, à confirmer).
- **Points faibles** : les 4 avis datent de 2012 ; « j'aimerais envoyer des e-mails depuis le logiciel ». Produit ancien (SUPPOSÉ : peu actif).
- **API / intégrations** : non mentionnées. (Lien QuickBooks : SUPPOSÉ, non confirmé.)
- Source : https://www.capterra.com/p/118836/Paddock-Pro/

#### StableBuzz
- **Pays** : Canada (SUPPOSÉ).
- **Cible** : écuries de cours et de pension, coachs indépendants. VÉRIFIÉ.
- **Modules** : planning, clients, facturation, paiements, dépenses, employés, dossiers médicaux, documents. VÉRIFIÉ.
- **Prix** : 19,98 $/mois, à l'usage. VÉRIFIÉ (annuaire).
- **Avis** : 1 seul avis. Trop peu pour conclure.
- Source : https://www.capterra.com/p/188502/Stablebuzz/

#### equineGenie
- **Pays** : États-Unis (SUPPOSÉ ; éditeur GenieCo).
- **Cible** : entreprises équestres de toute taille, forte orientation comptable et élevage. VÉRIFIÉ.
- **Modules** : comptabilité intégrée, facturation, stocks, alimentation, reproduction, santé, tâches. VÉRIFIÉ.
- **Prix** : 349 $ en achat unique (licence). VÉRIFIÉ (Capterra).
- **Points forts** : « le suivi financier est le meilleur » ; un des rares à faire la compta en interne. VÉRIFIÉ.
- **Points faibles** (avis VÉRIFIÉS) : tutoriels difficiles à suivre ; courbe d'apprentissage sans bases comptables ; retour obligé au menu principal pour changer de module. Logiciel de bureau (SUPPOSÉ).
- Source : https://www.capterra.com/p/96552/equineGenie/

#### Equisoft Live
- **Pays** : non trouvé.
- **Cible** : haras, écuries d'entraînement et portefeuilles de propriétaires dans les courses. VÉRIFIÉ.
- **Modules** : registres chevaux, grand livre, factures automatiques, reproduction, pedigree. VÉRIFIÉ.
- **Prix** : 57 €/utilisateur/mois. VÉRIFIÉ (annuaire). Aucun avis.
- Source : https://www.capterra.com/p/126386/Equisoft-Live/

#### Stablemanagement.app
- **Statut** : produit non identifié avec certitude. La fiche Capterra « Stables » (planning, réservation en ligne, facturation ; intégrations QuickBooks Online, Google Calendar, GroupMe ; version gratuite ; prix sur demande ; 0 avis) pourrait correspondre, sans preuve du domaine. Tout est **non vérifié**.
- Source : https://www.capterra.com/p/10038306/Stables/

#### Hippovibe
- **Pays** : Allemagne (SUPPOSÉ ; avis en allemand, fondé en 2015 selon Capterra).
- **Cible** : cavaliers et écuries, loisir ou pro. VÉRIFIÉ.
- **Modules** : base chevaux, plans d'alimentation personnalisables, santé, rendez-vous, compétitions, facturation, dépenses. VÉRIFIÉ.
- **Prix** : à partir de 72 € (période trimestrielle ou annuelle, non précisée). VÉRIFIÉ (annuaire).
- **Points faibles** (avis VÉRIFIÉS, 2022) : « des notifications que nous demandons depuis longtemps » ; pas d'import de calendrier ; pannes occasionnelles ; d'autres apps font pareil pour moins cher. 4,3/5 sur 4 avis.
- Source : https://www.capterra.co.uk/software/189348/hippovibe

#### HorseManager (Pays-Bas)
- **Pays** : Pays-Bas (SUPPOSÉ ; domaine .nl).
- **Cible** : stations d'étalons, écoles d'équitation, transporteurs, vétérinaires, organisateurs d'événements. VÉRIFIÉ.
- **Prix** (VÉRIFIÉ, horsemanager.nl) : prix de base non affichés (deux paliers : 10 chevaux ou moins / plus de 10). Modules : école d'équitation 20 €/mois ; transport 80 €/mois ; vétérinaires 20 €/mois ; étalons 1 € par saillie ; événements 0,35 € par départ + 1,50 € par membre. Un an gratuit pour les jeunes entreprises.
- **Matériel** : lecteur de puce 550 € (pousse l'identité du cheval vers l'app) ; écran tactile 21,5 pouces pour l'écurie 650 €. VÉRIFIÉ.
- **API** : oui, pour alimenter le site web du client (WordPress compris) : 550 € + 100 €/an. VÉRIFIÉ.
- Source : https://www.horsemanager.nl/en/prices/

#### Equestrian Systems (Royaume-Uni)
- **Pays** : Royaume-Uni (SUPPOSÉ ; prix en livres).
- **Cible** : écoles d'équitation, centres de compétition, pensions ; systèmes sur mesure. VÉRIFIÉ.
- **Modules** : réservation en ligne, planning des cours, paiements récurrents, présences, portail client, site web intégré. VÉRIFIÉ.
- **Prix** : 55 £/mois. VÉRIFIÉ (annuaire). **Intégrations** : Stripe, GoCardless. 5,0/5 sur 2 avis.
- Source : https://www.capterra.com/p/215488/Equestrian-Systems-Booking-System/

#### LIVERYLive (Royaume-Uni)
- **Pays** : Royaume-Uni (SUPPOSÉ).
- **Cible** : gérants de pensions ; version SOLO pour propriétaires ; ARENAS pour location de carrières. VÉRIFIÉ.
- **Prix** : 2 £ par cheval actif et par mois ; SOLO et ARENAS gratuits. VÉRIFIÉ (annuaire).
- **Intégrations** : Xero, QuickBooks Online, Stripe (paiements, factures, vérification d'identité). VÉRIFIÉ.
- Source : https://www.capterra.com/p/10047219/LIVERYLive/

#### Equestrian Center (éditeur non nommé)
- **Prix** (VÉRIFIÉ, Capterra) : Propriétaire 7 €/mois (5 chevaux) ; Petite écurie 29 € (30 chevaux, 10 utilisateurs) ; Professionnel 79 € (illimité).
- **Particularité** : IA générative et plans d'entraînement par IA, module école d'équitation, module événements, neuf rôles. 0 avis : produit récent.
- Source : https://www.capterra.com/p/10046016/Equestrian-Center/

#### Prism
- **Cible** : pur-sang, trotteurs et écuries de sport ; entraîneurs, propriétaires, syndicats. VÉRIFIÉ.
- **Modules** : communication propriétaires, facturation et comptabilité, ventes, gestion d'écurie, de haras et de reproduction. Essai 14 jours. Prix non publiés. VÉRIFIÉ.
- Source : https://prepro.prism.horse

#### iStable / miStable
- « iStable » : une ancienne fiche d'app existe, sans information exploitable. **Non trouvé**.
- miStable : plateforme de gestion pour écuries de courses avec une app séparée pour les propriétaires (miStable Owners). VÉRIFIÉ (existence, App Store). Modules et prix : non lus.
- Sources : https://mistable.com/ ; https://apps.apple.com/us/app/mistable-owners/id1242182100

### 2.2 Apps cavaliers et propriétaires

#### Ridely (Suède)
- **Pays** : Suède (SUPPOSÉ ; éditeur Ztabler AB).
- **Cible** : cavaliers amateurs et leurs coachs. VÉRIFIÉ.
- **Fonctions** (VÉRIFIÉ, App Store) : plus de 600 vidéos avec des entraîneurs, plus de 40 programmes structurés, journal d'entraînement partageable avec le coach, suivi santé du cheval, **coach IA entraîné sur leur bibliothèque validée par des experts**, suivi de sécurité en balade (RideSafe), score de bien-être du cheval avec classement, Apple Watch.
- **Prix** (VÉRIFIÉ, boutique US) : 34,99 $/mois ; 99,99 $/3 mois ; 149,99 $/an ; 399,99 $ à vie ; exercice à l'unité 6,99 $ ; programme 39,99 $. Essai 7 jours.
- **Avis** : 4,6/5 sur 942 notes. Demandes non satisfaites : suivi hors connexion, plusieurs types d'activité par séance, export du calendrier.
- **API / intégrations** : aucune.
- Source : https://apps.apple.com/us/app/-/id1242286435

#### Equilab (Suède)
- **Pays** : Suède (SUPPOSÉ ; éditeur Equestrian Insights AB).
- **Cible** : tous cavaliers ; app grand public la plus diffusée (4,8/5 sur environ 5 200 notes dans la boutique US). VÉRIFIÉ.
- **Fonctions** (VÉRIFIÉ) : suivi GPS des séances (distance, vitesse, allures, virages) au téléphone ou à l'Apple Watch, historique, **suivi de sécurité avec alerte aux proches après 5 minutes d'immobilité**, groupes et calendriers partagés (coach, véto, demi-pensionnaires), discussion, défis.
- **Prix** (VÉRIFIÉ) : Premium 12,99 $/mois ; 59,99 $/6 mois ; 99,99 $/an. Depuis octobre 2024, statistiques détaillées et courbes de tendance sont passées en Premium ; planification du calendrier et météo sont devenues gratuites.
- **Points faibles** (avis VÉRIFIÉS) : allures mal classées ; la séance ne s'arrête pas seule ; sécurité et montre jugées devoir être gratuites.
- **API** : non trouvée.
- Sources : https://apps.apple.com/app/id1133163586 ; https://equilab.freshdesk.com/support/solutions/articles/154000203651-october-2024-premium-feature-changes

#### EquiTraq (Suède) — probablement l'« EquiTrack » de la liste
- **Pays** : Suède. VÉRIFIÉ (adresse du développeur à Ängelholm).
- **Cible** : propriétaires (offre Privé) et écuries (offre Business). VÉRIFIÉ.
- **Fonctions** (VÉRIFIÉ, Google Play) : documents et certificats, santé, entraînement, **ration avec totaux de nutriments et lecture par IA des analyses de fourrage et des étiquettes d'aliments**, coûts, discussion, météo, partage sélectif avec écurie et prestataires ; côté écurie : clients, personnel, soins et rééducation, données de facturation ; option **analyse de la position du cavalier par IA à partir d'une vidéo**.
- **Prix** : abonnement, essai 14 jours, montants non publiés. Plus de 10 téléchargements : très jeune produit.
- Source : https://play.google.com/store/apps/details?id=app.equitraq

#### The Equestrian App (États-Unis)
- **Cible** : propriétaires, écuries, familles 4-H, prestataires. VÉRIFIÉ.
- **Fonctions** (VÉRIFIÉ) : gestion des boxes, pension, plans d'entraînement, véto et maréchal, facturation, suivi de séance, dépenses, vaccins, poids, discussion d'écurie, listes de tâches, **transfert de la fiche d'un cheval à un nouveau propriétaire**, annuaire d'environ 15 000 entreprises équestres, résultats de concours.
- **Prix** : gratuit. 4,9/5 sur 16 notes. Développeur individuel.
- Source : https://apps.apple.com/us/app/equestrian-app/id1263719672

### 2.3 Réservation de cours et places de marché équestres

#### Hopoti (Finlande)
- **Pays** : Finlande (SUPPOSÉ ; société Hopoti Software Oy, développé avec la fédération équestre finlandaise — ce dernier point VÉRIFIÉ).
- **Cible** : écoles d'équitation, écuries, organisateurs ; et cavaliers. VÉRIFIÉ.
- **Chiffres annoncés** (VÉRIFIÉ, hopoti.com) : plus de 40 pays, plus de 250 structures, plus de 130 000 utilisateurs, plus de 3 millions de réservations, 4,7 sur Trustpilot.
- **Fonctions cavalier** (VÉRIFIÉ) : recherche de centres à proximité ; réservation et paiement de cours, cartes de séances, forfaits, adhésions, bons cadeaux ; annulation et report avec crédit automatique ; **compte famille** (enfants sans e-mail) ; **cheval favori** et cheval attribué visible à l'avance ; **alerte quand une place se libère** ; synchronisation calendrier (iCal). Abonnement Hopoti Plus : carnet de progression, carnet de soins, badges.
- **Fonctions structure** (VÉRIFIÉ) : calendrier de réservation et boutique, paiement en ligne, acomptes et paiement en plusieurs fois, attribution des chevaux avec vue de leur charge sur les cours précédents et suivants, contacts d'urgence, page d'actualités du club et pages par cheval.
- **Apps** : application web installable, pas d'app native. VÉRIFIÉ.
- **Prix** : non publiés. **API** : non mentionnée.
- Sources : https://hopoti.com/en-gb ; https://business.hopoti.com/features/rider-features/ ; https://www.malgretoutmedia.com/hopoti-business-part-2/

#### Equine Bookings (Royaume-Uni)
- **Modèle** (VÉRIFIÉ, article de 2020, à actualiser) : les coachs publient cours et stages, les cavaliers cherchent par zone et discipline puis paient en ligne. **Le coach garde 100 % du prix ; le cavalier paie de petits frais de réservation.** Politique d'annulation par activité, remboursement automatique, codes promo, validation manuelle possible de chaque réservation.
- Source : https://everythinghorseuk.co.uk/equine-bookings/

#### Board & Stable (États-Unis)
- Annuaire de plus de 5 500 pensions et 1 200 entraîneurs dans 44 États, **doté d'un serveur MCP en lecture seule** (recherche de pensions et d'entraîneurs par lieu, discipline, prestations, prix maximum). VÉRIFIÉ. C'est le seul MCP équestre trouvé.
- Source : https://vibehackers.io/mcp/board-and-stable-mcp

### 2.4 Références d'autres sports

#### Playtomic (Espagne — padel et tennis)
- **Offres club** (VÉRIFIÉ, playtomic.com/pricing ; prix non affichés) : Standard (planning, clients, paiements, matchs, cours collectifs publics, tournois, rapports) ; Professional (+ affichage terrain, catégories d'utilisateurs, porte-monnaie, caisse) ; Champion (+ coachs, stages, adhésions, factures, ligues, cours particuliers, **intégrations API**, plusieurs entités juridiques, campagnes) ; Master. Délai de réponse du support garanti par offre (48 h à 4 h). Essai 2 mois.
- **Critiques** (source concurrente Book & Go, **à prendre avec réserve**) : commission non publiée ; les données joueurs appartiendraient à Playtomic avec export limité ; pas d'app à la marque du club ; le club est listé à côté de ses concurrents ; versement sous 7 jours.
- **À retenir** : la force est côté joueur (trouver des partenaires de niveau, matchs ouverts) ; la faiblesse est la dépendance du club.
- Sources : https://playtomic.com/pricing ; https://www.bookandgo.app/de/playtomic-alternative

#### Mindbody (États-Unis — fitness, bien-être)
- **Prix** (VÉRIFIÉ, mindbodyonline.com/pricing) : Starter à partir de 79 $/mois par site ; Accelerate, Ultimate, Enterprise sur devis. Utilisateurs illimités, caisse et paiement en ligne partout.
- **Fonctions marquantes** : choix de sa place en cours, gestion des salles et ressources, campagnes e-mail et SMS automatiques, tableau de suivi des prospects, **accueil téléphonique par IA 24 h/24**, app à la marque en option, plus de 100 intégrations. VÉRIFIÉ.
- **Place de marché** : référencement gratuit ; **commission de 20 % plafonnée à 30 $ sur le premier achat d'un nouveau client uniquement**. VÉRIFIÉ.
- **Critiques** (Punchpass, concurrent) : complexité, hausses de prix, support, migration de données incomplète en standard.
- Sources : https://www.mindbodyonline.com/pricing ; https://punchpass.com/resources/blog/lets-talk-about-mindbody-pricing-we-break-down-the-plans-features-and-more/

#### ClassPass (États-Unis)
- **Modèle** (VÉRIFIÉ, classpass.com) : l'utilisateur achète des crédits ; **SmartRate ajuste en temps réel le nombre de crédits d'un créneau** selon demande, saison, horaire et proximité du début ; le partenaire touche au moins un plancher négocié (pourcentage confidentiel de son tarif direct) ; annulations tardives payées selon la politique du studio ; versement mensuel ; tableau de bord partenaire.
- **Critique** : marges réduites et exposition aux concurrents dans la même app (cité par Punchpass).
- Source : https://classpass.com/partners/blog/classpass-payouts-pricing-policies-rates

#### ABC Glofox (Irlande / États-Unis)
- **Prix** : « à partir de 99 $/mois », paliers sur devis. **API réservée à l'offre Enterprise.** App à la marque du club, **prédiction d'attrition par IA**, intégrations ClassPass et Gympass. Critiques : support dégradé depuis le rachat de 2022, hausse de 70 % en cours de contrat signalée par un client. Source unique et concurrente (Vibefam) : **à prendre avec réserve**.
- Source : https://vibefam.com/glofox-review-pricing-features-pros-cons-2026/

#### Golfmanager (Espagne — golf)
- **MCP natif en bêta** (annoncé le 3 septembre 2026) : le personnel pilote le logiciel depuis ChatGPT, Claude ou Gemini, à l'écrit ou à la voix ; créer ou annuler une réservation, inscrire un membre à une compétition, modifier une fiche, sortir un rapport d'occupation et de chiffre d'affaires, émettre une facture. **L'assistant agit dans la limite des droits de l'utilisateur et chaque action est journalisée à son nom.** VÉRIFIÉ.
- Source : https://golfbusinessnews.com/news/management-topics/golfmanager-launches-native-mcp-integration-with-ai-platforms/

---

## 3. Matrice fonctionnalités × acteurs

Légende : ● présent (lu sur une source) ; ○ partiel ou en option payante ; – absent des sources lues (absence non prouvée) ; ? non trouvé.

| Fonction | BarnManager | Stable Secretary | EC Pro | Equicty | CRIO | HRS | Hopoti | equineGenie | LIVERYLive | Ridely | Equilab | Cible Piaffe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fiche cheval et santé | ● | ● | ● | ● | ● | ● | ○ | ● | ● | ○ | – | ● |
| Alimentation / rations | ● | ● | ● | ○ | ● | ● | – | ● | ? | – | – | ● |
| Reproduction / élevage | – | ● | – | ○ | ● | ● | – | ● | – | – | – | ● |
| Pensions et facturation récurrente | ○ | ● | ● | ○ | ○ | – | – | ● | ● | – | – | ● |
| Planning des cours | – | – | ● | ○ | – | – | ● | – | – | – | – | ● |
| Réservation et paiement en ligne | ○ | ○ | ● | ○ | – | – | ● | – | ○ | – | – | ● |
| Liste d'attente / place libérée | – | – | ● | ? | – | – | ● | – | – | – | – | ● |
| Attribution des chevaux aux cours | – | – | ● | ? | – | – | ● | – | – | – | – | ● |
| Portail ou app adhérent | – | – | ● | ● | – | – | ● | – | ○ | – | – | ● |
| Compte famille | – | – | ? | ? | – | – | ● | – | – | – | – | ● |
| Comptabilité intégrée | – | – | ○ | ○ | ○ | – | – | ● | – | – | – | ● |
| Lien compta externe | QuickBooks | QuickBooks | Xero, QuickBooks | Peppol | – | – | – | – | Xero, QuickBooks | – | – | ● |
| RH, plannings du personnel, paie | – | – | ○ | – | – | – | – | – | – | – | – | ● |
| Compétitions | – | ● | ○ | ○ | – | ● | ○ | – | – | – | – | ● |
| Tâches et tableau blanc d'écurie | ● | ● | ● | ● | ● | – | – | ● | ● | – | – | ● |
| Entretien des installations | – | – | – | – | – | – | – | – | – | – | – | ● |
| App mobile native | ● | ● | ● | ● | ● | ● | – | ? | ● | ● | ● | ● |
| Notifications push | ? | – | ● | ? | ? | ? | ● | – | ? | ● | ● | ● |
| Suivi de séance GPS | – | – | – | – | – | – | – | – | – | ● | ● | ● |
| Contenus et programmes d'entraînement | – | – | – | – | – | – | – | – | – | ● | – | ○ |
| IA | – | – | – | – | – | – | – | – | – | ● | – | ● |
| API publique | – | – | – | ○ | – | ● | – | – | – | – | – | ● |
| Connecteur MCP | – | – | – | – | – | – | – | – | – | – | – | ● |
| Capteurs et caméras intégrés | – | – | – | – | – | – | – | – | – | – | – | ● |
| Export des données | ● | ? | ? | ? | – | ? | ? | ? | ? | – | – | ● |
| Prix d'entrée mensuel | 40 $ | 6,95 $ | 75 $ + frais | 35 € | 15,90 $ | 9,99 $ | ? | 349 $ une fois | 2 £/cheval | 34,99 $ | 12,99 $ | à définir |

Lecture : aucune colonne n'est pleine. Les lignes RH, entretien, MCP et connecté sont vides chez tous. La ligne « export » est presque partout inconnue, ce qui est en soi un signal.

---

## 4. Vingt idées à reprendre ou à dépasser

| # | Idée | D'où elle vient | Comment Piaffe la dépasse |
|---|---|---|---|
| 1 | Chevaux et utilisateurs illimités, prix simple | BarnManager, EC Pro | Éviter les paliers par nombre de chevaux, critiqués chez Stable Secretary |
| 2 | Gratuité pour associations et équithérapie | BarnManager | Offre solidaire, bon levier de notoriété |
| 3 | Alerte « une place s'est libérée » sur un cours complet | Hopoti | Ajouter l'inscription automatique depuis la liste d'attente |
| 4 | Cheval favori du cavalier, visible du moniteur à l'attribution | Hopoti | Proposer l'attribution automatique selon niveau, poids, charge de travail du cheval |
| 5 | Charge du cheval visible (cours précédent / suivant) | Hopoti, EC Pro | Plafond d'heures par cheval et alerte de surcharge, croisé avec santé et capteurs |
| 6 | Compte famille, enfants sans e-mail | Hopoti | Indispensable en poney-club ; ajouter autorisations parentales et paiement groupé |
| 7 | Annulation dans les délais = crédit automatique | Hopoti, Equine Bookings | Règles paramétrables par activité et rattrapage proposé en un geste |
| 8 | Acompte et paiement en plusieurs fois | Hopoti | Ajouter prélèvement SEPA et échéanciers de forfaits annuels |
| 9 | Répartir une charge sur plusieurs factures | BarnManager | Copropriété de chevaux et demi-pensions : répartition automatique par quote-part |
| 10 | Lien public par QR code vers la fiche du cheval | CRIO | QR sur la porte du box : ration, soins du jour, contacts, consignes |
| 11 | Écran tactile d'écurie et lecteur de puce | HorseManager | Mode « tableau de bord mural » de l'app, lecture de puce au téléphone |
| 12 | Transfert de la fiche du cheval au nouveau propriétaire | The Equestrian App | Carnet de santé portable, lié au numéro SIRE |
| 13 | Lecture par IA des analyses de fourrage et étiquettes d'aliments | EquiTraq | Calcul de ration complet et alerte de stock |
| 14 | Coach IA appuyé sur des contenus validés par des experts | Ridely | Coach IA nourri par les séances réelles, les capteurs et les consignes du moniteur du club |
| 15 | Sécurité en extérieur : alerte après 5 minutes d'immobilité | Equilab, Ridely | L'alerte prévient aussi le club, pas seulement les proches |
| 16 | Commission uniquement sur le premier achat d'un nouveau client, plafonnée | Mindbody | Place de marché de coachs sans prélèvement sur la clientèle existante du club |
| 17 | Tarif dynamique des créneaux peu remplis, avec prix plancher | ClassPass (SmartRate) | Remplir les reprises creuses, le club gardant la main sur le plancher |
| 18 | App à la marque du club | Glofox, EC Pro, Mindbody | Incluse sans surcoût ; les données restent au club, à l'inverse de ce qui est reproché à Playtomic |
| 19 | API publique documentée | Equicty (13 €/mois), HorseManager (550 €) | API incluse dans toutes les offres, avec webhooks et export complet en un clic |
| 20 | MCP avec droits de l'utilisateur et journal des actions | Golfmanager (bêta, sept. 2026) | Premier MCP d'un logiciel de gestion équestre, en lecture et en écriture |

Hors tableau, à traiter comme exigences de base parce que ce sont les plaintes les plus fréquentes dans les avis : notifications push fiables (Stable Secretary, Hippovibe), prise en main rapide (EC Pro, Equicty, CRIO), calendrier fluide (EC Pro, HRS), import de calendrier (Hippovibe), factures et relevés personnalisables (Stable Secretary).

---

## 5. Panorama du connecté et manière de s'y brancher

### 5.1 Capteurs portés par le cheval ou le cavalier

| Produit | Pays | Mesure | Prix public | Ouverture |
|---|---|---|---|---|
| Seaver (sangle, protège-sangle, gilet airbag SafeFit) | France (SUPPOSÉ) | Vitesse, distance, allures, symétrie au trot, cadence, analyse des sauts, détection d'anomalie de locomotion ; option Health+ : ECG avec détection d'arythmie, fréquence de repos, stress, récupération. VÉRIFIÉ | Abonnements dans l'app (boutique australienne) : Safe Ride 12,49 $A/mois, Health+ 23,49 $A/mois. Prix du matériel : non lu | API publique non trouvée |
| Equisense Motion / Motion S | France (SUPPOSÉ) | Allures, symétrie, sauts ; fréquence cardiaque avec électrode sur le Motion S. VÉRIFIÉ | Motion Essential 279 € ; Motion S 399 €. VÉRIFIÉ | Disponibilité actuelle et API : non trouvées ; santé de l'entreprise à vérifier (SUPPOSÉ : difficultés passées) |
| Arioneo Equimetre | France (SUPPOSÉ) | Paramètres physiologiques à l'entraînement et en course ; données envoyées vers une plateforme web ; cible entraîneurs, propriétaires, vétérinaires. VÉRIFIÉ. Détail (ECG, GPS, locomotion) : SUPPOSÉ | Non trouvé | API ou partenariats logiciels : non trouvés |
| Nightwatch (Protequus) | États-Unis | Licol : fréquence cardiaque et respiratoire par radar, activité, posture, GPS ; indice de détresse de 1 à 10 ; alertes par SMS, appel et e-mail jusqu'à accusé de réception ; apprentissage d'environ 80 heures. VÉRIFIÉ (FAQ de 2022) | De 49 à 99 $/mois, engagement 3 à 12 mois. VÉRIFIÉ (2022) | API non mentionnée ; s'appuyait sur le réseau 3G en voie d'extinction ; statut commercial actuel non vérifié |
| Horsepal Edge, HoofStep, HorseCare | ? | Balises d'activité, licol connecté, capteurs de membres. VÉRIFIÉ (simple mention dans un article) | Non trouvé | Non trouvé |

### 5.2 Analyse de locomotion par vidéo, sans capteur

- **Sleip** (Suède, SUPPOSÉ) : analyse objective de la locomotion à l'iPhone, mesure des asymétries et comparaison dans le temps ; offre vétérinaire (documentation des anesthésies diagnostiques, tests de flexion) et offre pour entraîneurs, kinés, maréchaux ; partage par lien ou PDF. Prix non publié (un avis évoque 200 $/mois, non confirmé). 4,8/5 sur 111 notes. VÉRIFIÉ — https://apps.apple.com/us/app/sleip/id1583194375
- **TrojanTrack** (Irlande) : vidéo de 8 secondes au pas, suivi de 52 points anatomiques, rapport en feu tricolore ; vise entraîneurs et gérants qui surveillent toute une écurie. App publiée, prix non affichés. VÉRIFIÉ — https://apps.apple.com/app/id6753805863 ; https://www.irishtimes.com/business/innovation/2024/11/07/innovation-awards-finalist-trojantrack-ai-to-keep-a-step-ahead-of-lameness-in-horses

### 5.3 Caméras de box avec IA

| Produit | Pays | Détections | Prix public | Ouverture |
|---|---|---|---|---|
| Acaris Horse Protector / Smart Box | Allemagne (SUPPOSÉ) | Coliques, cheval coincé, poulinage, stress, intrusion ; temps passé à boire, manger, se coucher ; rapport quotidien sur 24 h. La Smart Box transforme une caméra IP ordinaire. VÉRIFIÉ | Non affiché sur la page lue | API non mentionnée |
| Acaris Stable Guard | Allemagne (SUPPOSÉ) | Sécurité : distingue humain et animal, accès non autorisé, manipulation des chevaux ; plages d'alerte réglables. VÉRIFIÉ | 39,99 €/mois (engagement 24 mois) ou 1 380 € à l'achat. VÉRIFIÉ | API non mentionnée |
| Novostable Smart Cam One | France (Annecy) | Signes précoces de colique, comportement inhabituel, poulinage ; profil du cheval appris en 12 heures et affiné sur 5 jours ; alertes push, SMS, appel ; boîtier compatible avec plusieurs marques de caméras. VÉRIFIÉ | 599 €. Abonnement : non trouvé | API non trouvée |
| Horcery Stall Monitor | États-Unis | Roulades, couché, sommeil, inactivité inhabituelle, entrées et sorties, présence humaine ; température, humidité, bruit, lumière ; clip vidéo joint à chaque alerte ; partage jusqu'à 20 personnes ; IA embarquée. VÉRIFIÉ | 899 $ + abonnement obligatoire 19,99 $/mois ou 190 $/an. VÉRIFIÉ | API non mentionnée |

Sources : https://eu.acaris.net/en/health-monitoring/ ; https://eu.acaris.net/en/?p=40837 ; https://theresanaiforthat.com/device/novostable-smart-cam-one ; https://horcery.com/

### 5.4 Abreuvoirs et distributeurs connectés

- **Cascada** (États-Unis) : abreuvoir automatique qui mesure la consommation d'eau par capteur à ultrasons, apprend l'habitude de chaque cheval et alerte en cas de variation ; 972 $, en précommande pour janvier 2027. VÉRIFIÉ — https://americanstalls.com/collections/accessories/products/the-cascada-automatic-waterer
- **Horcery Bucket Meter** : mesure de la prise d'aliment et d'eau au seau, 149 $, livraison annoncée pour l'hiver 2026. VÉRIFIÉ — https://horcery.com/
- **Distributeurs automatiques de concentrés et de fourrage** (HIT Active Stable, Schauer, SimpleFeeder, etc.) : existence connue, fonctions et ouverture **non vérifiées** dans cette recherche.

### 5.5 Comment une plateforme peut s'y brancher

Constat : aucune des pages lues ne mentionne d'API ouverte ni d'intégration avec un logiciel d'écurie. Tout branchement passera donc par une démarche commerciale auprès de chaque fabricant. Par ordre de faisabilité :

1. **Caméras, par le flux vidéo standard.** La plupart des caméras IP exposent un flux RTSP/ONVIF. Piaffe peut afficher le direct du box dans la fiche du cheval et dans le portail propriétaire sans dépendre d'un fabricant. Acaris Smart Box et le boîtier Novostable prouvent que l'IA peut se greffer sur une caméra ordinaire : soit partenariat, soit analyse maison plus tard.
2. **Alertes entrantes par webhook ou e-mail.** Demander aux fabricants de caméras et de licols un webhook d'alerte (colique suspectée, cheval couché trop longtemps). À défaut, une adresse e-mail d'alerte dédiée par box, lue par Piaffe, suffit pour créer un événement dans la fiche et prévenir la personne d'astreinte.
3. **Capteurs d'entraînement, par partenariat de données.** Proposer à Seaver, Equisense, Arioneo, Equilab une liaison de compte (OAuth) pour rapatrier les résumés de séance : durée, allures, fréquence cardiaque, symétrie. Chemin de repli : import de fichiers de séance (GPX/FIT) et lecture d'Apple Santé, qu'Equilab alimente déjà.
4. **Capteurs cardiaques en Bluetooth standard.** Une ceinture cardio au profil Bluetooth standard peut être lue directement par l'app Piaffe pendant la séance, sans accord fabricant (SUPPOSÉ : à valider selon les modèles).
5. **Locomotion par vidéo.** Sleip et TrojanTrack partagent déjà leurs résultats par lien ou PDF : commencer par rattacher ce rapport à la fiche du cheval et au dossier vétérinaire, puis viser une intégration.
6. **Eau et aliment.** Marché naissant (Cascada, Horcery) : prévoir le modèle de données « consommation par cheval et par jour » dès maintenant, brancher quand les produits seront livrés.
7. **Modèle de données commun.** Tout flux, quelle que soit la source, doit atterrir dans une même chronologie du cheval (événement, mesure, alerte, média) avec règles d'alerte paramétrables et droits d'accès par rôle. C'est cette agrégation qui n'existe chez personne.
8. **MCP et API de Piaffe.** Exposer ces données et actions par API et par MCP, avec les droits de l'utilisateur connecté et un journal des actions, sur le modèle annoncé par Golfmanager.

Points de vigilance : vidéo en continu = données personnelles des salariés et des clients (RGPD, information, durée de conservation) ; couverture réseau souvent faible dans les écuries (prévoir le hors-connexion) ; une alerte santé n'est pas un diagnostic (Horcery le précise explicitement sur son site).

---

## 6. Sources

Toutes consultées le 17 novembre 2026.

**Logiciels de gestion**
- https://www.barnmanager.com/pricing/
- https://www.capterra.com/p/164823/BarnManager/
- https://app.stablesecretary.com/purchase
- https://www.capterra.com/p/129021/Stable-Secretary/
- https://www.softwareadvice.com/horse/stable-secretary-profile/
- https://www.capterra.com/p/197564/EC-Pro/
- https://www.softwareadvice.com/event-booking/ec-pro-profile
- https://www.equicty.com/pricing
- https://www.getapp.com/horse-software/a/equicty
- https://www.capterra.com/p/154844/Crio-Online/
- https://www.capterra.com/p/230603/Horse-Report-System/
- https://www.capterra.com/p/118836/Paddock-Pro/
- https://www.capterra.com/p/188502/Stablebuzz/
- https://www.capterra.com/p/96552/equineGenie/
- https://www.capterra.com/p/126386/Equisoft-Live/
- https://www.capterra.com/p/10038306/Stables/
- https://www.capterra.co.uk/software/189348/hippovibe
- https://www.softwaresuggest.com/hippovibe
- https://www.horsemanager.nl/en/prices/
- https://www.capterra.com/p/215488/Equestrian-Systems-Booking-System/
- https://www.capterra.com/p/10047219/LIVERYLive/
- https://www.capterra.com/p/10046016/Equestrian-Center/
- https://prepro.prism.horse
- https://mistable.com/
- https://www.capterra.com/horse-software/ (classement de la catégorie)

**Apps cavaliers**
- https://apps.apple.com/us/app/-/id1242286435 (Ridely)
- https://apps.apple.com/app/id1133163586 (Equilab)
- https://equilab.freshdesk.com/support/solutions/articles/154000203651-october-2024-premium-feature-changes
- https://play.google.com/store/apps/details?id=app.equitraq
- https://apps.apple.com/us/app/equestrian-app/id1263719672

**Réservation, places de marché, autres sports**
- https://hopoti.com/en-gb
- https://business.hopoti.com/features/rider-features/
- https://www.malgretoutmedia.com/hopoti-business-part-2/
- https://everythinghorseuk.co.uk/equine-bookings/
- https://vibehackers.io/mcp/board-and-stable-mcp
- https://playtomic.com/pricing
- https://help.playtomic.com/en/articles/5481891-pricing-and-subscription-plans
- https://www.bookandgo.app/de/playtomic-alternative (source concurrente)
- https://www.mindbodyonline.com/pricing
- https://punchpass.com/resources/blog/lets-talk-about-mindbody-pricing-we-break-down-the-plans-features-and-more/ (source concurrente)
- https://classpass.com/partners/blog/classpass-payouts-pricing-policies-rates
- https://vibefam.com/glofox-review-pricing-features-pros-cons-2026/ (source concurrente)
- https://golfbusinessnews.com/news/management-topics/golfmanager-launches-native-mcp-integration-with-ai-platforms/

**Connecté**
- https://apps.apple.com/au/app/seaver/id1335975186
- https://help.equisense.com/l/en/article/53pp5iemj1-price-motion-corrency
- https://apps.apple.com/il/app/equimetre/id1261881562
- https://cdn.shopify.com/s/files/1/0023/1243/7833/files/PTQ-0231_NIGHTWATCH_FAQs_20220725.pdf
- https://apps.apple.com/us/app/sleip/id1583194375
- https://apps.apple.com/app/id6753805863 (TrojanTrack)
- https://www.irishtimes.com/business/innovation/2024/11/07/innovation-awards-finalist-trojantrack-ai-to-keep-a-step-ahead-of-lameness-in-horses
- https://eu.acaris.net/en/health-monitoring/
- https://eu.acaris.net/en/?p=40837 (Stable Guard)
- https://theresanaiforthat.com/device/novostable-smart-cam-one
- https://horcery.com/
- https://americanstalls.com/collections/accessories/products/the-cascada-automatic-waterer
- https://www.thehorseexchange.co.uk/?p=19033

**Non accessible** : https://www.equestrianconnect.com/pricing (lecture refusée par le site).

**À compléter dans une prochaine passe** : prix et commission exacts d'EC Pro et de Hopoti (demander une démo) ; prix du matériel Seaver et Arioneo ; statut commercial d'Equisense et de Nightwatch ; existence d'API privées chez les fabricants de caméras ; acteurs germanophones et nordiques de gestion de club non couverts ici.
