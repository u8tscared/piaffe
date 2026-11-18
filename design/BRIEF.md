# Refonte design Piaffe : brief commun aux trois directions

Piaffe est le logiciel tout-en-un des centres équestres (démo fonctionnelle : /home/claude/piaffe/demo, publiée sur https://claude.ai/artifact/Vdt6ti3FA1Nii45Y42nRKN ; lis demo/MODULES.md, core/tokens.css, core/shell.css, core/data.js, modules/10-cockpit.js et modules/20-planning.js pour connaître le contenu réel).

## Verdict du client (Marceau) sur la version actuelle
« Trop simpliste. Sur le côté (la barre latérale), c'est horrible. Toutes les icônes, tous les textes : c'est trop petit. Le logiciel fait hyper vieillot, pas du tout joli. Les plannings, c'est moche, tout est moche. Je veux un truc de malade en design et en UX, ultra qualitatif, hyper optimisé, une direction artistique complètement changée. »

## Ce qu'il aime (historique)
Clair plutôt que noir (les sites noirs lui semblent peu clairs), ultra moderne, épuré mais riche, énormément de motion design, polices et icônes sur mesure (jamais une bibliothèque d'icônes, jamais d'emoji), pas de titres en italique, une marque propre : logo « La pièce » (tête de cheval pleine, œil en strass, voir LOGO() dans demo/core/icons.js), bleu marine #0a1636 et saphir, éclats de strass (façon bombes Samshield) en petite touche. La direction peut faire évoluer couleurs et typo si elle reste fidèle au logo.

## Livrable de chaque direction
Un seul fichier HTML autonome (artifact claude.ai) qui montre DEUX pages du logiciel côte à côte dans une même navigation :
1. **Le cockpit du gérant** (« Aujourd'hui » : résumé du matin par l'assistant, reprises du jour, écurie en direct, indicateurs, à traiter, à valider).
2. **Le planning** (semaine et jour, pistes, moniteurs, remplissage, glisser-déposer simulé, création d'une reprise).
Avec la vraie barre latérale/navigation repensée (c'est le point le plus critiqué), en vue ordinateur (1440 px) ET en vue téléphone (un bouton bascule ordinateur / téléphone, la vue téléphone dans un cadre d'iPhone soigné, avec une navigation mobile pensée pour le pouce). Données réelles du club (Écurie des Tilleuls, mardi 17 novembre 2026, 9 h 41 ; chevaux, moniteurs, reprises : reprends les noms de demo/core/data.js et 20-planning.js).
Tailles : texte courant 15–16 px minimum sur ordinateur, icônes 20–24 px, cibles 40 px+ ; hiérarchie franche ; respiration. Les interactions principales marchent (changer de jour, de vue semaine/jour, ouvrir une reprise dans un panneau, cocher, survol riche), et le motion est soigné (entrées, transitions de vue partagées, compteurs, micro-interactions), 60 fps, respect de prefers-reduced-motion.
Icônes : dessine ton propre jeu (SVG inline) cohérent avec ta direction, ou retravaille ceux de core/icons.js.

## Contraintes artifact
Pas de <!doctype>, <html>, <head>, <body> (ajoutés à la publication ; ATTENTION : ton contenu se retrouve dans <body>, donc ne remplace jamais document.body.innerHTML, rends dans un conteneur). Commence par <title>…</title> et <meta name="claude:viewport-fit-sides" content="cover">. Polices Google Fonts uniquement ; scripts seulement depuis cdnjs avec version exacte. Pas de fetch, pas d'iframe, pas d'alert. Tokens de couleur sur :root + sombre sous @media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…}} et :root[data-theme="dark"]{…} ; body avec fond explicite. La page entière marche à 390 px (pas de défilement horizontal). Français impeccable (insécables avant : ; ? ! € %, pas de tiret cadratin en ponctuation).

## Vérification obligatoire
Teste avec Playwright (Chromium préinstallé : require('playwright')) en enveloppant ton fichier comme la publication le fera : '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>\n'+fichier. Zéro erreur console, pas de débordement à 1440 et 390 px, clair et sombre. Fais des captures et REGARDE-les ; au moins deux passes critiques (« un directeur artistique de Linear, Apple ou Airbnb le montrerait-il tel quel ? »). Ne publie pas, ne fais pas de git, ne touche pas à demo/.
