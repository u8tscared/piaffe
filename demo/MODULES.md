# Écrire un écran Piaffe

Ce document est le contrat commun de tous les écrans de la démo. Lisez-le en entier, puis lisez `core/tokens.css`, `core/shell.css`, `core/engine.js`, `core/data.js` et l'écran de référence `modules/10-cockpit.js` avant d'écrire une ligne.

## Le produit

Piaffe est la plateforme tout-en-un des centres équestres et écuries (club fictif de démo : **Écurie des Tilleuls**, 46 boxes, date du jour **mardi 17 novembre 2026, 9 h 41**). Quatre vues :

- **Gérant** (ordinateur et tablette d'abord) : pilote tout le club.
- **Employé** (téléphone d'abord) : moniteurs, palefreniers, accueil. Utilisateur de démo : Mamadou Diallo, palefrenier soigneur (`s05`).
- **Adhérent** (téléphone d'abord) : cavaliers, parents, propriétaires, demi-pensionnaires. Utilisatrice de démo : Léa Martin (`m001`), 27 ans, Galop 7, propriétaire d'Ulysse de la Roche (`h01`, box B01).
- **Coach** (téléphone et ordinateur) : coachs indépendants réservables en ligne. Utilisatrice de démo : Pauline Arnaud (`c01`), coach CSO.

Ambition : battre tous les concurrents (Kavalog, Equimondo, BarnManager, Equicty…). Voir `../research/` pour l'audit. Chaque écran doit être **complet** (toutes les fonctions qu'un vrai gérant attend), **simple à lire** et **beau**.

## Règles de design (non négociables)

1. Couleurs et rayons **uniquement** via les jetons de `tokens.css` (`var(--acc)`, `var(--ink)`, `var(--surface)`, `var(--line)`, `var(--ok)`…). Aucune couleur en dur, sinon le thème sombre casse. Exception : l'intérieur d'une vidéo de caméra simulée ou d'une scène 3D.
2. Polices : titres en `var(--f-display)` (Bricolage Grotesque), texte en `var(--f-text)`, code en `var(--f-mono)`. **Jamais d'italique.** Pas d'emoji. Chiffres alignés : classe `num`.
3. Icônes : **uniquement** `ICON('nom')` (liste plus bas). Si une icône manque, dessinez-la dans votre module en SVG sur une grille 24, trait 1.7 arrondi, même style, avec `class="i"`. Pas de bibliothèque d'icônes.
4. Composants existants à réutiliser : `.card`, `.ch`/`.cb`/`.cf`, `.btn` (`.pri`, `.dark`, `.ghost`, `.sm`, `.icon`), `.chip` (`.ok .warn .bad .acc .navy .line`, `.dot`), `.tag`, `.seg`, `.tabs`, `.tbl` via `P.ui.table`, `.list`/`.li`, `.av`, `.kpi` via `P.ui.kpi`, `.bar`, `.ring`, `.note`, `.tl` (frise), `.empty`, `.in` (champs), `.tog`, `.chk`, `.strass`, `.live`, `.g2 .g3 .g4 .g5`, `.stack`, `.hrow`, `.rise` (apparition en cascade des enfants).
5. Mise en page responsive par **requêtes de conteneur** (`@container main (max-width:760px){…}`), pas par media queries : l'écran s'affiche dans un cadre de téléphone ou de tablette à l'intérieur de la page. Testez à 1440 px (ordinateur), en tablette et à 390 px (téléphone). Rien ne doit déborder horizontalement ; les tableaux larges défilent dans leur `.tw`.
6. Mouvement : sobre et précis. Utilisez `.rise` pour les listes, les compteurs `data-count`, les graphiques de `P.chart` (ils s'animent seuls), les transitions `var(--t-2)`/`var(--t-3)` et les courbes `var(--e-out)`/`var(--e-spring)`. Un seul « moment waouh » par écran, pas d'effets partout. `prefers-reduced-motion` est déjà géré globalement ; pour une boucle `requestAnimationFrame`, testez `P.RM`.
7. Le strass (`.strass`, saphir) marque **ce qui est réussi ou précieux** (une signature terminée, un sans-faute, l'assistant). Pas de décoration gratuite.
8. Écriture : français simple, phrases complètes, voix active, verbes d'action sur les boutons (« Envoyer les relances », pas « Valider »). Un bouton fait exactement ce qu'il dit, puis un toast confirme (« Relances envoyées »). Pas de tirets cadratins décoratifs, pas de « Note : ». Vocabulaire du métier : reprise, galop, licence FFE, SIRE, pension, demi-pension, box, paddock, carrière, manège, maréchal, vermifuge, engagement, Club 2, Amateur…
9. Chaque écran s'ouvre **plein de données réalistes**, jamais vide. Chaque bouton fait quelque chose de visible : il ouvre une feuille (`P.sheet`), change l'état à l'écran, navigue (`data-go`) ou affiche un toast. Aucun bouton mort.
10. Accessibilité : vrais `<button>`, `title` sur les boutons-icônes, focus visible (déjà géré), contrastes via les jetons.

## API du moteur (`window.P`)

```js
P.mod({
  id:'planning', role:'gerant', group:'Club', title:'Planning', icon:'planning',
  n:10,                 // ordre dans le groupe (plus petit = plus haut)
  hidden:false,         // true pour un écran de détail absent du menu (ex. 'cheval')
  tab:'chevaux',        // écran de détail : onglet du téléphone à garder actif
  phoneTitle:'Planning',// titre court en haut du téléphone
  short:'Planning',     // libellé de la barre d'onglets du téléphone
  badge:function(){return {v:3,hot:true}}, // pastille du menu (optionnel)
  render:function(el,ctx){ el.innerHTML='…'; /* puis brancher les événements sur el */ }
});
```

- `ctx` : `{role, params, mobile, me, D, ui, fmt, chart, go, sheet, toast, rerender}`. `ctx.params.id` contient l'identifiant passé à l'écran.
- Navigation : n'importe quel élément avec `data-go="idEcran"` (et `data-id="h01"` ou `data-p-xxx="…"` pour les paramètres) navigue au clic. En JS : `P.go('cheval',{id:'h01'})`. `P.back()` revient en arrière.
- `P.sheet({title, icon, body: html | function(bodyEl, sheetEl), foot: html, wide:true})` : panneau latéral sur ordinateur, feuille du bas sur téléphone. Retourne l'élément ; `sheet.close()` le ferme. Les boutons du pied se trouvent avec `sheet.querySelector(...)`.
- `P.toast('Message', {icon:'checkc', undo:function(){…}})`.
- `P.rerender()` redessine l'écran courant.
- `P.css(\`…\`)` ajoute le CSS propre au module. **Préfixez toutes vos classes** par 2 à 4 lettres propres au module (ex. `.pl-` pour planning) pour éviter les collisions. Ne redéfinissez jamais une classe du design system.
- Composants HTML : `P.ui.ph(titre, sousTitre, boutonsHtml)` (en-tête de page), `P.ui.kpi({label,value,count,fmt:'eur'|'pct',unit,delta,up,dsub,spark:[…],icon})`, `P.ui.table(cols,rows,{click:true,key:'id'})` avec `cols=[{k,l,n:true,hide:true,f:function(row){return html}}]` (lignes cliquables : écoutez `[data-row]`), `P.ui.av(idPersonne)`, `P.ui.hav(idCheval)`, `P.ui.avs([ids])`, `P.ui.chip(txt, 'ok'|'warn'|'bad'|'acc', dot)`, `P.ui.status('payée')`, `P.ui.bar(pct, couleur)`, `P.ui.ring(pct, libellé, couleur, taille)`, `P.ui.seg([[val,libellé]], sel, 'data-x')`, `P.ui.tabs(...)`, `P.ui.tog(on,id)`, `P.ui.chk(on,id)`, `P.ui.empty(icone,titre,sousTitre,bouton)`.
- Graphiques : `P.chart.line([{v:[…],c:'var(--acc)',area:true}], labels, {fmt, h})`, `P.chart.bars(valeurs|[[empilées]], labels, {colors, fmt, h, hi})`, `P.chart.donut([{v,c}], {size, center, sub})`, `P.chart.spark(valeurs, couleur)`, `P.chart.legend([[libellé,couleur]])`.
- Format : `P.fmt.eur(1234)` → « 1 234 € », `P.fmt.date('2026-11-17')`, `P.fmt.dateL`, `P.fmt.rel` (« demain », « il y a 3 j »), `P.fmt.days`, `P.fmt.esc`.
- 3D : `P.gl.horse(conteneur, {points:[{id,label,pos:[x,y,z],c}], onPick:function(id){}, walk:true, still:false})` affiche le cheval 3D (three.js r128 est disponible en global `THREE`, le modèle en `HORSE`). Le cheval mesure 1 de haut, tête vers +z, sol à y≈0. Le conteneur doit avoir une hauteur. Vous pouvez construire vos propres scènes three.js (écurie 3D…).
- Personnalisation : `P.prefs.get(clé, défaut)` / `P.prefs.set(clé, valeur)` (stockage local, déjà protégé). `P.prefs.off(role)` liste les modules désactivés ; `P.prefs.setOff(role, liste)`.
- Palette ⌘K : ajoutez vos actions avec `P.actions.push({role:'gerant', label:'Créer une reprise', icon:'planning', run:function(){…}})`.
- Assistant : apprenez-lui vos sujets avec `P.brain.push({role:'gerant', re:/regex/i, reply:function(texte, ctx){return {text:'…', card:'html', actions:[{label:'…', run:function(){…; return 'Fait'}}]}}})`. Réponses précises, chiffrées à partir des données.
- Visite guidée : `P.tourSteps.push({route:'idEcran', title:'…', text:'…'})` pour **un** écran phare par module au plus.

## Données (`window.DATA`, alias `P.D`)

`D.club`, `D.staff`, `D.coaches`, `D.horses` (40), `D.members` (148), `D.forfaits`, `D.halfboard`, `D.halfboardOffers`, `D.lessons` (reprises hebdomadaires, `dow` 0 = dimanche, 2 = mardi = aujourd'hui), `D.invoices`, `D.bank`, `D.months`/`D.revenue`/`D.costs`/`D.occupancy`, `D.competitions`, `D.entries`, `D.vans`, `D.carpool`, `D.care`, `D.journal`, `D.tasks`, `D.stock`, `D.equipment`, `D.cameras`, `D.sensors`, `D.weather`, `D.contracts`, `D.templates`, `D.threads`, `D.notifs`. Outils : `D.horse(id)`, `D.member(id)`, `D.staffer(id)`, `D.coach(id)`, `D.person(id)`, `D.name(id)`, `D.day(décalage)`, `D.iso(date)`.

Si vous avez besoin de données supplémentaires, ajoutez-les **dans votre propre fichier**, en haut, sous la forme `D.monSujet = D.monSujet || [...]` ; ne modifiez pas `core/`.

## Identifiants d'écrans (réservés, pour les liens croisés)

- Gérant · Pilotage : `cockpit` (fait), `rapports`
- Gérant · Écurie : `chevaux`, `cheval` (détail, caché), `ecurie3d`, `cameras`, `soins`, `alimentation`, `entretien`
- Gérant · Club : `planning`, `adherents`, `adherent` (détail, caché), `pensions`, `coachs`, `competitions`, `boutique`, `communication`
- Gérant · Argent : `facturation`, `compta`, `contrats`
- Gérant · Équipe : `equipe`
- Gérant · Plateforme : `assistant`, `connecteurs`, `import`, `reglages`
- Employé (groupes `Ma journée`, `Écurie`, `Moi`) : `emp-jour`, `emp-tournee`, `emp-chevaux`, `emp-cheval` (caché), `emp-planning`, `emp-soins`, `emp-pointage`, `emp-signaler`, `emp-messages`, `emp-conges`
- Adhérent (groupes `Moi`, `Équitation`, `Cheval`, `Compte`) : `adh-accueil`, `adh-reserver`, `adh-cheval`, `adh-demipension`, `adh-coachs`, `adh-concours`, `adh-progression`, `adh-paiements`, `adh-contrats`, `adh-messages`, `adh-profil`
- Coach (groupes `Coaching`, `Compte`) : `coach-agenda`, `coach-eleves`, `coach-dispo`, `coach-revenus`, `coach-concours`, `coach-profil`

Les barres d'onglets du téléphone sont déjà définies dans `P.roles` : gérant `cockpit, planning, chevaux, adherents` ; employé `emp-jour, emp-tournee, emp-chevaux, emp-planning` ; adhérent `adh-accueil, adh-reserver, adh-cheval, adh-paiements` ; coach `coach-agenda, coach-eleves, coach-dispo, coach-revenus`.

## Fichiers et tests

- Un fichier par lot : `modules/NN-nom.js` (le numéro qui vous est donné). Enveloppez tout dans `(function(){ … })();`. **N'écrivez jamais la chaîne `</script>`** dans un module.
- Ne modifiez **jamais** `core/`, `tools/` ni les fichiers des autres lots. Si le moteur vous manque, contournez dans votre fichier et signalez-le dans votre compte rendu.
- Assemblez votre version de test (sans gêner les autres agents) puis capturez :

```
cd /home/claude/piaffe/demo
node tools/build.js --out=VOTREID --only=NN-nom
PREVIEW=preview-VOTREID node tools/shot.js planning desktop VOTREID-planning-d
PREVIEW=preview-VOTREID node tools/shot.js planning phone VOTREID-planning-p
PREVIEW=preview-VOTREID node tools/shot.js planning tablet VOTREID-planning-t --full
PREVIEW=preview-VOTREID node tools/shot.js planning desktop VOTREID-sheet --click=".pl-row"   # clique avant la capture
```

  Le script affiche les erreurs console et la liste des éléments qui débordent. Ouvrez les PNG de `shots/` avec l'outil Read et **regardez-les vraiment** : alignements, débordements, textes coupés, contrastes, hiérarchie. Corrigez jusqu'à ce que ce soit irréprochable sur ordinateur, tablette et téléphone, en clair et en sombre (`--dark`).
- Pas de commande git : l'orchestrateur s'en charge.

## Liste des icônes

today, planning, horse, stable, camera, sensor, care, feed, members, owner, coach, compet, invoice, accounting, team, upkeep, stock, contract, shop, chat, assistant, plug, api, mcp, import, settings, report, onboarding, search, bell, plus, minus, x, check, right, left, down, up, arrow, back, ext, more, menu, filter, sort, download, upload, edit, trash, copy, link, clock, pin, user, child, family, lock, shield, eye, play, pause, rec, mic, phone, mail, sms, euro, card, bank, wallet, ticket, gift, bag, doc, folder, sign, qr, scan, truck, van, car, route, thermo, drop, wind, sun, moon, cloud, rain, heart, pulse, syringe, pill, hoof, tooth, bone, star, flag, trophy, medal, jump, arena, paddock, hay, bucket, wrench, bolt, wifi, battery, weight, gauge, stopwatch, layers, cube, rotate, grid, list, kanban, map, globe, sliders, palette, logout, bulb, send, attach, image, video, expand, refresh, info, alert, checkc, xc, dot, cmd, code, key, webhook, robot, spark, swap, calendar_add, waitlist, repeat, holiday, clockin, hourglass, tag, percent, trend, eye_off, moonstar, whistle, saddle, helmet, brush, shavings, tractor.

`HORSE_GLYPH()` donne la petite tête de cheval du logo ; `LOGO(taille, couleur, couleurŒil, animé)` le logo complet.
