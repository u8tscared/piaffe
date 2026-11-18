# Landing Piaffe v3 : brief

## Contexte
Piaffe est le logiciel tout-en-un des centres équestres (démo : /home/claude/piaffe/demo, 55 écrans, 4 espaces : gérant, employé, adhérent, coach). Marceau, le fondateur, va bientôt présenter le produit. Il veut une landing qui fasse dire « ça a l'air dingue, je veux ça ».

Ses mots : « plus complète, plus sympa, avec les bonnes couleurs, qu'on comprenne toute l'application et ses parties (gérant, employé, adhérent, coach). Ultra clair, ultra dingue en design, qui reprend la direction artistique et les vrais écrans. Du motion design, ultra bien expliqué. Le titre et les textes ne doivent pas bouger : un seul texte hyper clair. Une partie Piaffe AI, en rouge, expliquée comme Gusto AI sur growthgusto.fr. Ultra complet, et on doit pouvoir essayer la démo. »

## Modèle : growthgusto.fr (une autre entreprise de Marceau)
C'est très clair dès la première page. Reprendre sa logique (pas son contenu) :
1. Barre d'annonce courte « Nouveau ».
2. En-tête : liens d'ancre et un bouton principal.
3. Hero statique :
   - surtitre court ;
   - H1 d'une phrase (« Tout votre établissement dans une seule app. ») ;
   - chapeau qui nomme les modules ;
   - 2 boutons, dont « Voir la démo » avec la légende « Un établissement déjà rempli. Rien n'est enregistré. » ;
   - ligne de confiance (« 14 jours gratuits · Sans carte bancaire · Sans engagement ») ;
   - visuel en collage : la vraie capture du tableau de bord et des cartes flottantes de vraies données.
4. Bande « N fonctions, une seule app » avec des pastilles de fonctions groupées par module.
5. Tour des modules « Ce que fait l'app, métier par métier. » :
   - une barre d'ancres ;
   - des blocs numérotés 01, 02… qui alternent gauche et droite.

   Chaque bloc contient :
   - surtitre numéroté ;
   - H3 en deux temps (« Le HACCP se fait presque tout seul. ») ;
   - un paragraphe ;
   - 3 puces (titre en gras et une ligne) ;
   - un lien « Voir en détail » et un badge de comptage ;
   - une maquette d'interface à droite.
6. Section démo (« Voir une petite démo »), avec des pastilles qui ouvrent la démo sur différents écrans.
7. Intégrations en colonnes de listes (« En direct », « Par import », « Bientôt »).
8. L'IA (détail plus bas).
9. Multi-appareils (« Le téléphone en cuisine, l'ordinateur au bureau. »).
10. Mise en route en 3 étapes avec durées, puis « Vous venez d'un autre logiciel ? ».
11. Tarifs « Trois packs. C'est tout. » avec bascule mensuel/annuel.
12. Comparatif, FAQ, bandeau final, pied de page à colonnes.

### Gusto AI sur growthgusto.fr (à transposer en Piaffe AI)
- Bloc module : « Posez la question, il lit vos chiffres. » Il lit ventes, achats, stock et planning, répond avec les vrais chiffres, repère les problèmes et propose l'action. Rien ne se fait sans validation. Puces : « Vos chiffres, en une question » (« Pourquoi ma marge baisse ? »), « Il propose, vous validez », « Aussi dans Claude et ChatGPT ». Maquette : question, réponse chiffrée, carte de proposition avec boutons « Valider ».
- Bloc « Parlez à votre établissement, dans Claude et ChatGPT. » : maquette d'un chat Claude avec « Growth Gusto relié », une ligne d'outil « A lu ventes et marges », la réponse chiffrée, et la légende « Exemple, avec les chiffres d'un établissement fictif. ». Logos des IA (Claude, ChatGPT, Le Chat, Perplexity, Grok), en pastilles texte : pas de vrais logos de marque.
- Page détaillée en sections numérotées :
  - 01 vos questions, vos chiffres (exemples de questions) ;
  - 02 il propose, vous décidez (cartes d'action, journal, droits) ;
  - 03 « Optimise ma semaine » (actions chiffrées classées par gain) ;
  - 04 l'IA dans vos écrans (bouton « Pourquoi ? », factures lues, saisie à la voix) ;
  - 05 le point chaque matin (cartes Attention, À surveiller, Opportunité, Prévision) ;
  - 06 votre établissement dans votre IA (connecteur en lecture seule, coupé en un geste, une adresse à coller).
- Garanties : lecture seule par défaut, propriétaire seulement, coupure en un geste, aperçu avant toute action.

## Ce qu'on construit
Une landing longue et complète, en français. Proposition de déroulé, que tu peux améliorer :

1. **Nav** : logo Piaffe, liens Fonctionnalités, Quatre espaces, Piaffe AI, Tarifs, Questions, thème clair/sombre, bouton « Essayer la démo ».
2. **Hero, sans aucune animation de texte** :
   - H1 du type « Tout votre centre équestre dans une seule app. » ;
   - chapeau qui nomme planning, chevaux et soins, adhérents, facturation et compta, équipe, caméras, concours, Piaffe AI ;
   - boutons « Essayer la démo » et « Voir les fonctionnalités », avec la légende sur la démo pré-remplie ;
   - ligne de confiance (prends les vrais engagements de l'ancienne landing : essai, sans engagement, reprise des données, hébergé en France) ;
   - visuel : capture réelle g-cockpit dans un cadre navigateur soigné, téléphone p-adh-accueil qui chevauche, 2 ou 3 cartes flottantes de vraies données de la démo (exemples : « 7 relances prêtes, 2 073 € », « Xanthos, box B23, boit 40 % de moins », « Planning de la semaine rempli à 86 % »).
3. **Bande** « 55 écrans, 4 espaces, une seule app », avec les pastilles de fonctions par module (couleur de domaine).
4. **Quatre espaces** (« Chacun son espace, les mêmes données ») :
   - onglets Gérant, Employé, Adhérent, Coach ;
   - pour chaque espace : qui c'est, 3 ou 4 puces, la ou les vraies captures dans le bon appareil (gérant : ordinateur, employé : téléphone et tablette, adhérent : téléphone, coach : ordinateur et téléphone), et un lien « Ouvrir l'espace … dans la démo » vers la bonne route ;
   - transition soignée entre les onglets.
5. **Tour des modules** « Ce que fait Piaffe, métier par métier » :
   - barre d'ancres collante ;
   - environ 8 à 10 blocs : Planning et reprises, Chevaux et soins, Écurie connectée (plan 3D, caméras, alimentation), Adhérents, pensions et contrats, Facturation et comptabilité, Équipe et pointage, Compétitions et coachs, Communication, Connecteurs et import ;
   - chaque bloc est construit comme ceux de Gusto, avec la vraie capture.

   Mise en valeur des captures, en restant sobre :
   - recadrage ou zoom sur la zone utile ;
   - une ou deux annotations (pastille et légende) qui pointent un vrai élément ;
   - léger effet de profondeur au défilement.

   Le titre en deux temps ne passe pas par l'italique (Marceau refuse les titres en italique) : la seconde moitié prend la couleur du domaine.
6. **Piaffe AI** (MISE À JOUR : PAS de rouge ; identité navy + strass de l'assistant dans la démo, cohérente avec le reste) : la pièce maîtresse, aussi complète que Gusto AI.
   - Fond rouge profond ou dégradé rouge, avec du texte clair, pensé pour les modes clair et sombre. S'appuyer sur le rouge du système (--cr #ee5f48, --cr-ink #972414) et le pousser vers un rouge riche et premium.
   - Titre du type « Posez la question. Piaffe AI répond avec les chiffres de votre écurie. »
   - Exemples de questions en pastilles : « Qui n'a pas payé ce mois-ci ? », « Quels chevaux ont trop travaillé cette semaine ? », « Remplis les places libres de samedi », « Prépare les factures de pension ».
   - Chat interactif en HTML : on clique une question, la réponse s'écrit avec de vrais chiffres de la démo et une carte d'action « Valider », « Modifier ». Ici seulement, l'animation de frappe est permise, puisque c'est le produit qui parle, pas un titre.
   - Les capacités en sections numérotées, sur le modèle Gusto 01 à 06.
   - Le point du matin.
   - Bloc « Votre écurie dans Claude et ChatGPT » : maquette de chat Claude, « Piaffe relié », ligne d'outil, adresse MCP à copier, pastilles des IA.
   - Garanties.
   - La vraie capture g-ai-relances.
7. **Multi-appareils** : « Le téléphone à l'écurie, l'ordinateur au bureau. »
8. **Mise en route en 3 étapes**, puis la reprise d'un autre logiciel (outils remplacés et imports, à reprendre de l'ancienne landing).
9. **Tarifs** (reprends les offres, prix et inclusions de l'ancienne landing) avec bascule mensuel/annuel, puis éventuellement un comparatif, puis la **FAQ** (reprends et complète).
10. **Bandeau final** « Essayer la démo », puis le **pied de page**.

## Direction artistique : « Paddock » (déjà choisie, ne pas réinventer)
- Lis /home/claude/piaffe/demo/core/tokens.css. Reprends ses jetons : surfaces, encre, --acc bleu, couleurs de domaine --hz, --rd, --mo, --tm, --cr, --pf avec leurs variantes -bg et -ink, rayons, ombres, courbes.
- Lis aussi la maquette /home/claude/piaffe/design/b-paddock.html : grille bento, tuiles pastel profondes par domaine, gros chiffres en Bricolage Grotesque 800, Inter 15 à 17 px, beaucoup d'air, illustrations maison.
- Polices Google : Bricolage Grotesque et Inter.
- Icônes : uniquement {{i:nom}} (demo/core/icons.js) ou des SVG au même trait de 1,8. Logo : {{logo:N}}.
- Les illustrations window.ILLU (demo/core) peuvent servir pour 1 ou 2 touches vivantes. Pas plus.
- Clair par défaut et sombre impeccable, avec la structure de jetons imposée par l'artifact :
  - :root ;
  - @media (prefers-color-scheme:dark) :root:not([data-theme=light]) ;
  - :root[data-theme=dark].
- Aucun titre en italique, aucun texte qui bouge ou qui défile tout seul, pas de mots qui tournent.
- Motion permise :
  - apparitions au défilement (fondu et légère montée, en cascade) ;
  - captures qui se posent avec un léger 3D ou parallaxe ;
  - onglets qui glissent ;
  - le chat Piaffe AI ;
  - survols riches.

  Respecter prefers-reduced-motion.
- Téléphone (390 px) impeccable : rien ne déborde, cibles de 44 px et plus, captures lisibles (recadrées si besoin), gouttière latérale avec max(16px, env(safe-area-inset-*)).

## Vraies captures
- Dossier /home/claude/piaffe/site/shots/*.webp, index dans shots.json.
- Préfixes : g- gérant en 1440×900 rendu ×1,5, c- coach, e- employé en tablette, p- téléphone 390×844.
- Liste : `ls /home/claude/piaffe/site/shots`. Regarde-les toutes avant de choisir.
- Dans le HTML, référence-les en relatif : `shots/g-cockpit.webp`, avec width, height et loading="lazy" (sauf le hero).
- Ne les intègre pas en base64.
- Pour une capture qui manque, ajoute une entrée dans /home/claude/piaffe/site/tools/capture.js et lance `node site/tools/capture.js <nom>` depuis /home/claude/piaffe. La preview de démo nécessaire est déjà construite (demo/dist/preview-landing.html).

## Fichiers et build
- Tu réécris /home/claude/piaffe/site/src/landing.html, landing.css et landing.js. L'ancienne version est copiée dans site/old-v2/ : lis-la pour récupérer les faits (prix, FAQ, connecteurs, imports, outils remplacés, chiffres).
- Tu peux adapter site/build.js :
  - le marqueur /*__HORSE__*/ et three.js ne sont plus obligatoires : retire-les si tu n'utilises pas le cheval 3D ;
  - garde {{demo:route}}, {{i:nom}}, {{logo:N}} et le traitement des espaces insécables ;
  - la preview dist/preview.html doit trouver les images : réécris `shots/` en `../shots/` dans la preview.
- Les liens de démo passent par {{demo:route}}, avec une route d'écran réelle (cockpit, planning, chevaux, adh-accueil, emp-jour, coach-agenda, assistant, connecteurs…).
- Contraintes artifact :
  - pas de doctype, html, head ni body dans la source ;
  - <title> en tête ;
  - scripts externes uniquement depuis cdnjs, versions exactes ;
  - pas de alert ni de window.open ;
  - stockage local dans try/catch ;
  - le body ne défile jamais horizontalement.
- Interdits : git et publication. Ne touche pas à demo/.

## Français
- Impeccable, phrases claires, vouvoiement.
- Espaces insécables avant : ; ? ! € % (le build les ajoute dans le texte HTML, à toi de les gérer dans le JS).
- Pas de tiret cadratin comme ponctuation.
- Pas de jargon : le lecteur est gérant de centre équestre.
- Chiffres cohérents avec la démo :
  - Écurie des Tilleuls, 44 chevaux, 148 adhérents ;
  - gérante Claire Morel ;
  - 2 073 € et 7 factures en retard ;
  - Xanthos au box B23 ;
  - Léa Martin et son cheval Ulysse ;
  - coach Pauline Arnaud ;
  - palefrenier Mamadou Diallo.

## Contrôles obligatoires
- `node site/build.js`, puis captures Playwright de site/dist/preview.html en ordinateur 1440, tablette 1024 et téléphone 390, en clair et en sombre, pleine page.
- 0 erreur console, 0 débordement horizontal (vérifie scrollWidth).
- **Regarde chaque capture**, et fais au moins deux passes critiques complètes en te demandant si Stripe, Linear ou Airbnb le publieraient tel quel. Corrige.
- Scratch privé : /tmp/claude-0/-home-claude/e9ff46d2-3b7d-558a-9458-fdac467148fb/scratchpad/landing/

## Rapport final (court)
- Déroulé des sections.
- Ce qui a été vérifié.
- Les chemins de 4 captures représentatives : hero, quatre espaces, Piaffe AI, téléphone.
