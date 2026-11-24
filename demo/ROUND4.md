# Manche 4 : zéro bug d'affichage, motion soigné, moins « IA »

Marceau (24/11) veut une app prête à être vendue à des écuries : « plus de bugs », « encore plus joli », « des petites animations, du motion design », et que rien ne fasse « trop IA ». La direction artistique ne change pas (Paddock : marine `--ink`, saphir `--acc`, strass, Bricolage Grotesque 800 + Inter, pastels par domaine). Lis d'abord MODULES.md (contrat) puis ROUND3.md (règles de manche, toujours valables).

## Ta mission sur chaque écran de ton lot (y compris les écrans cachés, les feuilles et les états cliqués)
1. **Audit visuel** à 1440 px (ordinateur), 1180 px (tablette) et 390 px (téléphone), en clair puis en sombre. Ouvre aussi les feuilles principales (`--click=`). Regarde chaque capture et liste ce qui cloche : texte tronqué ou qui passe sous un autre élément, chevauchements, débordements, cartes de hauteurs incohérentes, colonnes trop serrées, boutons qui passent à la ligne, alignements, espaces vides bizarres, contraste en sombre, chiffres qui se coupent, illustrations qui débordent de leur carte, libellés coupés en milieu de mot, etc.
2. **Corrige tout** dans ton module. Deux passes critiques par écran minimum.
3. **Motion design** sobre et précis (pas partout, ce qui donne de la vie) : entrée en cascade des cartes, compteurs qui montent, barres et anneaux qui se remplissent, transition douce quand on change d'onglet/segment/filtre interne à l'écran (fondu + léger glissement 8–12 px, 180–260 ms, `var(--e-out)`), retour d'état sur les actions (case qui se coche avec un petit rebond, ligne qui glisse quand on la valide), survols subtils. Respecte `prefers-reduced-motion` (`P.RM`). Pas d'animation en boucle gratuite.
4. **Moins « IA »** : retire les décorations clichés d'IA de ton lot (étincelles ✦ / icône `sparkle`/`assistant` décorative, petites étoiles strass parsemées, dégradés violets « magiques », formulations « l'IA a détecté », « par l'assistant »). Le contenu reste, mais présenté comme un outil métier sobre : « Résumé du matin », « À regarder aujourd'hui », « Suggestion ». Le strass ne marque que ce qui est réussi ou précieux.
5. **Noms** : les personnes de démo ont été renommées (gérante Claire Dumont, palefrenier Antoine Leroy, accueil Manon Lemoine). Si tu vois un nom à consonance trop typée ou un ancien nom en dur, remplace-le par un prénom et nom français simples et courants (Léa, Emma, Lucas, Hugo, Martin, Bernard…), en gardant le genre et la cohérence entre écrans.

## Règles
- Tu ne modifies QUE les fichiers de ton lot (`demo/modules/NN-*.js`). Jamais `core/`, jamais un autre module. Un besoin socle (moteur, coque, tokens, icônes) : note-le dans ton rapport, je m'en occupe (je travaille sur la coque en même temps que toi : logo, barre d'onglets, sélecteur d'espaces, bouton de l'assistant, transitions de page).
- Build : `node demo/tools/build.js --out=<ton-id> --only=<NN,NN>` (depuis /home/claude/piaffe). Contrôles : `PREVIEW=preview-<ton-id> node demo/tools/check.js desktop` puis `phone`, `tablet`, `phone --dark`, `desktop --dark` : 0 erreur, 0 débordement. Captures : `PREVIEW=preview-<ton-id> node demo/tools/shot.js <route> <desktop|tablet|phone> <ton-id>-<nom> [--dark] [--full] [--click=sel]`. Les captures vont dans demo/shots/ : préfixe-les TOUJOURS par ton id.
- Scratch privé : un sous-dossier à ton id dans `/tmp/claude-0/-home-claude/d6f9b928-9624-590f-8656-41f6caccf04b/scratchpad/`.
- Pas de git (ni add, ni commit, ni stash, ni checkout), pas de publication. D'autres agents travaillent en parallèle dans le même dossier sur d'autres modules.
- Français impeccable (espace insécable avant : ; ? ! € %, pas de tiret cadratin en ponctuation, pas d'italique, pas d'emoji, rien sous 13 px).
- Ne casse aucune fonction existante : chaque bouton doit toujours faire quelque chose.

## Rapport final (court, en français)
Les bugs trouvés et corrigés (écran par écran, une ligne chacun), le motion ajouté, ce qui reste ou ce qui demande le socle, et les chemins de 3 captures représentatives.
