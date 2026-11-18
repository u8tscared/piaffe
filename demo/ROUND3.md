# Manche 3 : chaque écran au niveau « Paddock »

Marceau a choisi la direction artistique « Paddock » (maquette de référence : /home/claude/piaffe/design/b-paddock.html, publiée sur https://claude.ai/artifact/2uFUB8kL2qyZuNmcefyjAs). Son verdict sur l'ancienne version : « trop simpliste, tout est trop petit, ça fait vieillot, les plannings sont moches. Je veux un truc de malade en design et en UX, ultra qualitatif, hyper optimisé. »

Le socle (core/tokens.css, shell.css, icons.js, engine.js) est déjà passé en Paddock. Lis MODULES.md (section Paddock : classes de domaine .d-*, .card.tint, .ico, .big, P.ui.kpi({dom,tint,illu}), window.ILLU, P.chart lisible) et ouvre la maquette pour t'imprégner : grille bento de tuiles de tailles variées, chaque domaine sa couleur pastel profonde, gros chiffres en Bricolage 800, illustrations maison animées (une par écran au plus, via ILLU), Inter 15–16 px, beaucoup d'air, micro-interactions et motion soignés.

## Ta mission sur chacun de tes écrans
Pas un simple recoloriage : repense la mise en page et l'UX de chaque écran comme le ferait un designer produit de Linear ou Airbnb, en gardant TOUTES les fonctions existantes (rien ne doit disparaître ni cesser de marcher).
- Hiérarchie franche : en tête, l'essentiel en gros (chiffre clé, action principale), puis le détail.
- Plus rien sous 13 px (supprime les tailles écrites en dur trop petites), icônes 20–24 px, cibles 40 px+.
- Tuiles teintées par domaine, pastilles d'icône .ico, chips, gros chiffres .big, états vides illustrés, survols riches.
- Tableaux aérés et lisibles, ou remplacés par des listes en cartes quand c'est plus clair (toujours en cartes au téléphone).
- Téléphone pensé pour le pouce : actions en bas, feuilles depuis le bas, rien de tronqué bêtement.
- Motion : entrées en cascade, compteurs, transitions de vue, illustration qui vit ; respect de prefers-reduced-motion.
- Clair et sombre impeccables.

## Règles
- Tu ne modifies QUE les fichiers de ton lot. Jamais `core/`. Besoin moteur : contourne localement et note-le.
- Build : `node tools/build.js --out=<ton-id>` ; contrôles : `PREVIEW=preview-<ton-id> node tools/check.js desktop`, `phone`, `tablet`, `phone --dark`, `desktop --dark` : 0 erreur, 0 débordement. Captures : `PREVIEW=preview-<ton-id> node tools/shot.js <route> <desktop|phone|tablet> <nom> [--dark] [--full] [--click=sel]` (préfixe tes captures par ton id) : REGARDE-les et fais au moins deux passes critiques par écran (« Linear ou Airbnb le montreraient-ils tel quel ? »).
- Scratch privé : `/tmp/claude-0/-home-claude/e9ff46d2-3b7d-558a-9458-fdac467148fb/scratchpad/<ton-id>/`.
- D'autres agents modifient d'autres modules en parallèle.
- Français impeccable (insécables avant : ; ? ! € %, pas de tiret cadratin en ponctuation). Icônes : uniquement ICON(nom) ou tes SVG au même style (trait 1,8). Pas de git, pas de publication.
- Rends dans le conteneur fourni par le moteur ; ne remplace jamais document.body.

## Rapport final (court)
Écrans repris et ce qui a changé, ce que tu as vérifié, besoins socle, 3 captures représentatives.
