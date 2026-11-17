# Manche 2 : construire les manques (consignes communes)

Projet : Piaffe, logiciel tout-en-un pour centres équestres. Démo mono-fichier construite par `node tools/build.js` depuis `core/` et `modules/`. Lis d'abord `MODULES.md` (contrat des modules, API `P.*`), puis `../research/05-couverture.md` sections 3 et 4 (manques P0/P1/P2 et incohérences, numérotés).

## Règles
- Tu ne modifies QUE les fichiers de ton lot. Jamais `core/`. Si tu as besoin du moteur ou des données, contourne localement et note-le dans ton rapport.
- Construis avec `node tools/build.js --out=<ton-id>` (sortie `dist/preview-<ton-id>.html`). Contrôle avec `PREVIEW=preview-<ton-id> node tools/check.js desktop` puis `phone`, `tablet`, et `phone --dark`. Zéro erreur, zéro débordement. Captures : `PREVIEW=preview-<ton-id> node tools/shot.js <route> phone <nom> [--dark] [--click=sel]` (sortie `shots/`, préfixe tes captures par ton id). Regarde réellement tes captures.
- Travaille tes fichiers temporaires dans `/tmp/claude-0/-home-claude/e9ff46d2-3b7d-558a-9458-fdac467148fb/scratchpad/<ton-id>/` uniquement.
- D'autres agents modifient d'autres modules en parallèle : c'est normal si leurs écrans changent entre deux constructions.
- Français impeccable : phrases complètes, espaces insécables avant « € % : ? ! ; », pas de tiret cadratin comme ponctuation, pas d'anglais (« DIRECT » et non « LIVE »). Icônes : uniquement `ICON(nom)` de `core/icons.js` (pas de bibliothèque, pas d'emoji). Design : tokens de `core/tokens.css`, sombre et clair, téléphone d'abord, motion sobre.
- Chaque fonction ajoutée doit être cliquable de bout en bout dans la démo (feuille, étapes, toast de fin, état mis à jour à l'écran), pas une maquette figée.
- Pas de git, pas de publication : l'orchestrateur s'en charge.

## Données partagées ajoutées au cœur (à utiliser, ne pas recopier en dur)
- `D.declarations` : chevaux déclarés en attente de validation (2 au départ). Côté adhérent, une déclaration fait `D.declarations.push({...status:'en attente'})`. Côté gérant, le bandeau compte `D.declarations.filter(x=>x.status==='en attente').length`.
- `D.trackBookings` : réservations de pistes des propriétaires (`arena` = id de `D.club.arenas`). L'adhérent en ajoute, le planning (Jour par piste) les affiche.
- `D.facts` : faits de référence uniques. Passage de Léa à Rambouillet 11 h 42 (14e sur 32, dossard 214, reconnaissance 11 h 10, détente 11 h 20 paddock B, Club Élite 115 cm). Solde de Léa 410 € restants sur la facture F-2026-1173 de 520 €. Journée de Pauline : cours particulier Léa et Ulysse à 11 h 15 en carrière d'honneur, collectif CSO 12 h 15, 14 h libre ; hersage de la carrière d'honneur à 13 h 30. Effectif : « 8 salariés et la gérante ». État corporel sur 5 partout (`h.bcs` est désormais sur 5 : 2,5 à 4 ; Ulysse 3). Contrat d'Emma : avenant de renouvellement, la demi-pension est en place depuis le 1er septembre.
- 44 chevaux (`D.horses.length`), 46 boxes. Calcule les compteurs depuis `D` plutôt que de les écrire en dur.

## Rapport final (court, en français)
Ce qui est construit (par numéro de 05-couverture), incohérences corrigées, ce qui reste, besoins moteur/données.
