# Piaffe — Design et motion : règles opérationnelles

Document de référence pour les quatre vues (gérant ordinateur/tablette, employé téléphone, adhérent téléphone, coach).
Identité fixée : fond clair, marine `#0a1636`, saphir `#3d63f2`, éclat de strass (étoile à 4 branches), Bricolage Grotesque (titres), Instrument Sans (texte), icônes sur mesure.

**Statut des sources.** Trois sources ont été relues en ligne pour ce document et leurs valeurs sont exactes : Emil Kowalski (« 7 practical animation tips »), Rauno Freiberg (« Web Interface Guidelines ») et les jetons de mouvement Material 3. Tout le reste (Linear, Stripe, Qonto, Things, Family, Airbnb, etc.) vient de l'observation des produits, sans re-vérification en ligne : les comportements cités sont fiables, les valeurs chiffrées que nous en tirons sont **nos** recommandations, pas des chiffres publiés par ces éditeurs.

---

## 1. Douze principes de design

| # | Principe | Référence | Application à l'écurie |
|---|---|---|---|
| 1 | **La réponse avant le tableau de bord.** Chaque écran s'ouvre sur une phrase qui répond à la question du moment, les chiffres viennent ensuite. | Stripe Dashboard (« Aujourd'hui »), Mercury (solde en premier), Apple Forme (résumé) | Accueil gérant à 7 h : « 3 choses à régler ce matin : vermifuge de Quartz en retard, 2 pensions impayées, cours de 10 h sans moniteur. » Les KPI sont sous cette ligne, pas au-dessus. |
| 2 | **Optimiste par défaut.** L'interface se met à jour avant la réponse du serveur ; en cas d'échec, retour arrière avec message à côté du déclencheur. | Linear, Rauno Freiberg (mise à jour optimiste + retour arrière) | Le palefrenier coche « box 12 curé » : la ligne se coche en 0 ms, la synchronisation part en arrière-plan. Hors réseau dans la grange, une pastille « 3 actions en attente » remplace tout spinner. |
| 3 | **Tout est atteignable au clavier en 2 frappes.** Palette de commandes universelle, raccourcis affichés dans les info-bulles et les menus. | Linear, Raycast, Superhuman | `⌘K` puis « pens Quartz » ouvre la fiche pension de Quartz ; `C` crée un cours, `G` puis `P` va au planning. |
| 4 | **Une action principale par écran.** Un seul bouton saphir plein ; le reste est secondaire (contour) ou tertiaire (texte). | Things 3 (bouton +), Airbnb hôte, Apple HIG | Écran employé « Ma tournée » : un seul bouton plein, « Commencer la tournée ». Signaler un problème est un lien texte. |
| 5 | **Divulgation progressive.** Le détail s'ouvre en place (panneau latéral, feuille), sans changer de page ni perdre le contexte. | Linear (aperçu), Notion (page latérale), Attio (fiche en panneau) | Clic sur un cheval dans la liste : panneau droit de 480 px avec la fiche ; la liste reste visible et navigable aux flèches. |
| 6 | **L'objet du métier est le héros, pas le formulaire.** On manipule le cheval, le box, la reprise ; on ne remplit pas des champs. | Notion Calendar / Amie (glisser un événement), Things (glisser une tâche), Airbnb (calendrier hôte) | Changer un cheval de box = glisser sa vignette sur le plan de l'écurie. Déplacer un cours = glisser le bloc dans le planning. |
| 7 | **Le mouvement explique d'où ça vient et où ça va.** Toute animation a une origine spatiale ; aucune n'est décorative sur une action fréquente. | Emil Kowalski (origine de transformation, < 300 ms), Family (transitions partagées), Apple HIG | La fiche cheval grandit depuis la vignette cliquée (transition d'élément partagé) et y retourne à la fermeture. |
| 8 | **Dense sur ordinateur, aéré sur téléphone, jamais l'inverse.** La densité est un réglage par vue, pas un style global. | Linear, Attio, Stripe (tableaux 36–40 px) vs Revolut, Airbnb (cibles ≥ 44 pt) | Tableau des pensions : lignes de 40 px côté gérant. Même donnée côté employé : cartes de 72 px avec cible tactile pleine largeur (gants, mains mouillées). |
| 9 | **L'état vide vend la fonction.** Pas d'illustration générique : un exemple réel, une action, éventuellement un modèle. | Linear, Notion (modèles), Rauno Freiberg (l'état vide invite à créer) | Aucun contrat : aperçu grisé d'un contrat de pension type + « Créer depuis le modèle pension complète » + « Importer un PDF existant ». |
| 10 | **Les chiffres sont typographiés comme de l'argent.** Chiffres tabulaires, alignés à droite, devise en plus petit, signe explicite. | Stripe, Mercury, Qonto, Revolut | « 1 240,00 € » en `font-variant-numeric: tabular-nums`, centimes en opacité 60 %, colonnes de montants alignées à droite. |
| 11 | **La célébration est rare et méritée.** Le strass n'apparaît que sur un accomplissement réel ; jamais sur un clic banal. | Apple Forme (anneaux fermés), Family (confirmation d'envoi), Things (complétion) | L'éclat à 4 branches scintille 600 ms quand la tournée du matin est complète à 100 %, quand un contrat est signé, quand un adhérent valide son galop. Nulle part ailleurs. |
| 12 | **Annuler vaut mieux que confirmer.** Pas de boîte « Êtes-vous sûr ? » sauf pour l'irréversible ; un toast « Annuler » pendant 6 s. | Superhuman, Gmail, Linear, Rauno (les bascules s'appliquent immédiatement) | Annulation d'un cours : effet immédiat + toast « Cours annulé, 8 cavaliers prévenus dans 6 s — Annuler ». L'envoi des notifications attend la fin du délai. |

---

## 2. Navigation

### 2.1 Gérant — ordinateur (≥ 1200 px)

```
┌──────────┬──────────────────────────────────────────┬───────────────┐
│ Barre    │ En-tête de page 56 px                     │ Panneau       │
│ latérale │ (titre, filtres, action principale)       │ de détail     │
│ 248 px   ├──────────────────────────────────────────┤ 480 px        │
│          │ Contenu (largeur max 1280 px, marge 32)   │ (à la demande)│
└──────────┴──────────────────────────────────────────┴───────────────┘
```

- **Barre latérale** : 248 px, repliable en 64 px (icônes + info-bulle) avec `⌘\` ou `[`. Fond `#f6f7fb`, sans bordure lourde (1 px `rgba(10,22,54,.08)`).
- **Contenu de la barre**, de haut en bas : sélecteur d'établissement (40 px), bouton recherche « Rechercher ou lancer… ⌘K », puis **7 entrées au maximum** au premier niveau : Aujourd'hui, Planning, Chevaux, Cavaliers, Écurie (plan/boxes), Facturation, Équipe. Sous un séparateur : « Épinglés » (vues enregistrées par l'utilisateur, 5 max visibles), et en bas : Réglages, Aide, avatar.
- **Entrée active** : fond `rgba(61,99,242,.10)`, texte marine, icône saphir, hauteur 32 px, rayon 8 px. Pas de barre verticale colorée à gauche.
- **Compteurs** dans la barre : uniquement pour ce qui demande une action (impayés, alertes soin). Pastille 18 px, pas de rouge sauf urgence réelle.
- **Deux niveaux maximum.** Le troisième niveau devient des onglets dans l'en-tête de page (ex. Chevaux → fiche → Soins / Travail / Documents / Facturation).
- **Panneau de détail** : s'ouvre à droite en 480 px (720 px avec `⌘↵` ou bouton agrandir, plein écran en dernier). `Échap` ferme, `J`/`K` ou flèches passent à l'élément suivant sans fermer. L'URL change (lien partageable, bouton retour fonctionnel).
- **Fil d'Ariane** : seulement en plein écran sur une fiche, sous la forme « Chevaux / Quartz du Val », cliquable, 13 px.

### 2.2 Palette de commandes `⌘K` (ordinateur et tablette avec clavier)

- Largeur 640 px, hauteur max 420 px, positionnée à 18 % du haut de la fenêtre, rayon 16 px, ombre niveau 4, voile `rgba(10,22,54,.32)` sans flou lourd.
- Ouverture en **120 ms** (opacité 0→1, échelle 0,98→1, origine au centre haut). Fermeture en 80 ms. Aucune animation sur les résultats qui se filtrent.
- Champ de 52 px, texte 16 px. Résultats groupés : **Actions**, **Chevaux**, **Cavaliers**, **Pages**, **Récents**. 8 lignes visibles de 40 px.
- Recherche tolérante (sans accents, fautes), résultats en moins de 50 ms pour les données locales.
- Chaque ligne montre son raccourci à droite. Sans saisie : 5 actions contextuelles à la page en cours + 5 récents.
- Mode imbriqué : choisir « Déplacer un cheval… » remplace la liste par les boxes libres ; `Retour arrière` sur champ vide remonte d'un niveau.
- Préfixes : `>` actions seules, `@` personnes, `#` chevaux. Une ligne « Demander à l'assistant : “…” » est toujours présente en dernier.
- Raccourcis globaux à une touche (hors champ de saisie) : `C` créer, `/` filtrer la liste, `G` puis lettre pour naviguer, `?` affiche la carte des raccourcis.

### 2.3 Gérant — tablette (768–1199 px)

- **Paysage** : barre latérale repliée en rail de 72 px (icône + libellé 11 px dessous), contenu en deux colonnes maître/détail (liste 360 px + détail fluide).
- **Portrait** : rail conservé ; le détail s'ouvre en feuille pleine hauteur glissant depuis la droite (largeur 85 %, max 560 px).
- Cibles tactiles 44 px minimum ; lignes de tableau portées à 48 px ; tout survol a un équivalent appui long (menu contextuel).
- Le planning passe en vue 3 jours en portrait, semaine en paysage. Glisser-déposer au doigt avec appui long de 250 ms et retour haptique.
- Bouton recherche visible en permanence dans l'en-tête (pas de dépendance au clavier).

### 2.4 Employé — téléphone

- **Barre d'onglets basse, 4 entrées** : Aujourd'hui, Tournée, Chevaux, Moi. Hauteur 56 px + zone sûre. Icône 24 px + libellé 11 px toujours affiché.
- **Bouton d'action central flottant** (56 px, saphir) au-dessus de la barre : « Signaler » (photo + note vocale + cheval). C'est l'action la plus fréquente hors tournée.
- Tout détail s'ouvre en **feuille modale** à crans (50 % et 92 % de la hauteur), poignée de 36 × 5 px, fermeture par glissement vers le bas. Jamais plus d'une feuille empilée ; au-delà, on pousse un écran.
- Zone du pouce : toute action principale est dans les 40 % inférieurs de l'écran. Rien d'essentiel dans les coins supérieurs.
- Pointage : accessible depuis « Aujourd'hui » en un appui (grand bouton 64 px), pas enfoui dans « Moi ».
- Mode hors ligne explicite : bandeau discret de 28 px « Hors ligne — tout est enregistré sur le téléphone ».

### 2.5 Adhérent — téléphone

- **Barre d'onglets, 4 entrées** : Accueil, Réserver, Mon cheval (ou Mes cours si non propriétaire), Compte.
- Accueil = prochain cours en carte héros (heure, cheval attribué, moniteur, météo de la carrière), puis fil des nouvelles de l'écurie.
- Réservation en 3 appuis maximum : créneau → confirmation → payé (carte enregistrée ou crédit de carte de cours).
- Paiement et signature en feuille 92 %. Retour par balayage depuis le bord gauche partout.
- Notifications regroupées dans une cloche en haut à droite de l'Accueil, pas un onglet.

### 2.6 Coach

- **Téléphone/tablette au bord de la carrière** : 3 onglets — Mes reprises, Cavaliers, Notes. L'écran « Reprise en cours » est plein écran, contraste renforcé (lisible en plein soleil : texte marine sur blanc, pas de gris sous `#4a5372`), boutons 56 px.
- Appel des présents par balayage (droite = présent, gauche = absent), attribution des chevaux par glisser.
- **Ordinateur** : même coquille que le gérant avec une barre latérale réduite (Planning, Cavaliers, Progression, Chevaux).

### 2.7 Règles communes

1. La position dans l'application est toujours lisible en moins d'une seconde (onglet actif, titre de page, fil d'Ariane).
2. Le retour ramène à l'état exact quitté : défilement, filtres, onglet.
3. Pas de menu hamburger sur téléphone. Pas de navigation cachée derrière un avatar.
4. Les modales centrées sont réservées à l'ordinateur et aux décisions courtes (≤ 3 champs). Au-delà : panneau latéral ou page.
5. Changement de rôle (gérant qui est aussi coach) : sélecteur dans l'avatar, transition par fondu de 240 ms, jamais de rechargement.

---

## 3. Motion

### 3.1 Jetons de durée et de courbe

```css
:root {
  /* Durées */
  --d-instant: 80ms;   /* survol, pression, focus */
  --d-fast:   120ms;   /* info-bulle, menu, palette, pastille */
  --d-base:   180ms;   /* popover, bascule, onglet, ligne qui s'ouvre */
  --d-slow:   240ms;   /* panneau latéral, modale, transition de page */
  --d-sheet:  400ms;   /* feuille basse téléphone, élément partagé */
  --d-celebr: 600ms;   /* éclat de strass, validation */
  --d-count:  800ms;   /* compteurs (plafond) */

  /* Courbes */
  --e-out:      cubic-bezier(0.16, 1, 0.3, 1);     /* entrées : défaut */
  --e-out-soft: cubic-bezier(0.25, 1, 0.5, 1);     /* entrées de petits éléments */
  --e-in:       cubic-bezier(0.4, 0, 1, 1);        /* sorties uniquement, courtes */
  --e-in-out:   cubic-bezier(0.65, 0, 0.35, 1);    /* déplacement d'un élément déjà à l'écran */
  --e-standard: cubic-bezier(0.2, 0, 0, 1);        /* Material 3 « standard » */
  --e-emph-dec: cubic-bezier(0.05, 0.7, 0.1, 1);   /* Material 3 « emphasized decelerate » */
  --e-sheet:    cubic-bezier(0.32, 0.72, 0, 1);    /* feuille façon iOS */
}
```

| Usage | Durée | Courbe | Propriétés |
|---|---|---|---|
| Survol (fond, bordure) | 80 ms | `ease-out` | `background-color`, `border-color` |
| Pression bouton | 80 ms aller, 160 ms retour | `--e-out` | `transform: scale(0.97)` |
| Info-bulle | 120 ms, délai 400 ms ; 0 ms si une autre est déjà ouverte | `--e-out-soft` | opacité, `scale(0.97→1)` |
| Menu déroulant, popover | 120–150 ms entrée, 80 ms sortie | `--e-out` | opacité, `scale(0.96→1)`, `translateY(-4px→0)` |
| Palette `⌘K` | 120 ms / 80 ms | `--e-out` | opacité, `scale(0.98→1)` |
| Bascule, case à cocher | 180 ms | ressort « vif » | position du curseur, tracé de la coche |
| Onglets (soulignement glissant) | 180 ms | `--e-in-out` | `transform` du trait |
| Panneau de détail | 240 ms entrée, 180 ms sortie | `--e-out` / `--e-in` | `translateX(24px→0)`, opacité |
| Modale centrée | 200 ms / 140 ms | `--e-out` | opacité, `scale(0.96→1)` |
| Transition de page | 180–240 ms | `--e-out` | fondu croisé + `translateY(8px→0)` |
| Feuille basse (téléphone) | 400 ms, ou ressort | `--e-sheet` | `translateY(100%→0)` |
| Élément partagé (vignette → fiche) | 320–400 ms | ressort « doux » | position, taille, rayon |
| Réordonnancement de liste | 240 ms | `--e-in-out` | `transform` (technique FLIP) |
| Toast | 240 ms entrée, 160 ms sortie | `--e-out` | `translateY(16px→0)`, opacité |
| Validation (coche, strass) | 400–600 ms | `--e-emph-dec` | tracé SVG, échelle, opacité |

**Ressorts** (notation raideur/amortissement/masse, compatibles Motion et React Spring) :

| Nom | Réglage | Usage |
|---|---|---|
| Vif | `stiffness 500, damping 35, mass 1` (aucun rebond visible) | bascules, coches, pastilles |
| Doux | `stiffness 300, damping 30, mass 1` | feuilles, panneaux, élément partagé |
| Élastique | `stiffness 400, damping 17, mass 1` (un rebond léger) | réservé aux célébrations et au lâcher d'un glisser-déposer |

À titre de repère, Material 3 publie des ressorts « spatial » amortis à 0,9 (raideur 300 / 700 / 1400 pour lent / défaut / rapide) et « effets » amortis à 1 sans rebond : la couleur et l'opacité ne rebondissent jamais, seule la position le peut.

### 3.2 Règles tirées des références

- **Emil Kowalski** : bouton pressé à `scale(0.97)` ; ne jamais animer depuis `scale(0)`, partir de 0,9 ou plus ; `ease-out` pour tout ce qui entre ou sort, jamais `ease-in` à l'entrée ; `transform-origin` calé sur le déclencheur ; animations d'interface sous 300 ms (180 ms paraît plus réactif que 400 ms) ; supprimer l'animation de ce que l'on voit des dizaines de fois par jour ; `filter: blur(2px)` pour adoucir un fondu croisé récalcitrant.
- **Rauno Freiberg** : animations d'interaction ≤ 200 ms ; pas d'animation au changement de thème ; pas d'animation sur les actions fréquentes et peu nouvelles (menu contextuel, ajout/suppression en liste) ; boucles en pause hors écran ; menus ouverts dès `mousedown` ; styles de survol uniquement sous `@media (hover: hover)`.
- **Material 3** : durées par paliers de 50 ms (courtes 50–200, moyennes 250–400, longues 450–600) ; une sortie est plus courte que l'entrée correspondante.
- **Apple HIG** : le mouvement doit rester optionnel, interruptible et cohérent avec le geste (une feuille suit le doigt à 1:1 et reprend sa vitesse au lâcher).

### 3.3 Quoi animer

- Les changements d'état provoqués par l'utilisateur (ouvrir, fermer, cocher, déplacer, valider).
- Les relations spatiales : d'où vient un panneau, où part un élément archivé.
- Les changements de données en direct : une ligne qui arrive glisse et son fond passe de `rgba(61,99,242,.10)` à transparent en 1 200 ms.
- Les compteurs lors de la **première** apparition d'un chiffre clé.
- Les accomplissements (voir 3.9).

### 3.4 Quoi ne jamais animer

- La saisie de texte, le curseur, la sélection.
- La navigation au clavier dans une liste ou la palette (le surlignage saute en 0 ms).
- Le filtrage et le tri de tableaux au-delà de 20 lignes : remplacement instantané.
- Le défilement (pas de détournement de la molette, pas de parallaxe dans l'application).
- Le changement de thème et de densité.
- `width`, `height`, `top`, `left`, `margin` : uniquement `transform`, `opacity`, `clip-path`, `filter` (léger). Hauteur variable : `grid-template-rows: 0fr → 1fr`.
- Tout ce qui bloque : aucune animation n'empêche le clic suivant, toutes sont interruptibles et reprennent depuis leur position en cours.
- Les messages d'erreur : apparition immédiate, sans secousse du formulaire.
- Les actions répétées plus de 20 fois par jour (cocher une ligne de tournée reste à 120 ms maximum).

### 3.5 Transitions de page

- **Même niveau** (Planning → Chevaux) : fondu croisé 180 ms, contenu entrant `translateY(8px→0)`. La barre latérale ne bouge jamais.
- **Descente** (liste → fiche) : élément partagé sur ordinateur (la ligne devient l'en-tête de la fiche, 320 ms, ressort doux) ; poussée horizontale sur téléphone (`translateX(100%→0)`, 350 ms, `--e-sheet`, écran sortant décalé de −30 % et assombri de 8 %).
- **Remontée** : mouvement inverse, 20 % plus court.
- API View Transitions là où elle est disponible, fondu simple ailleurs. Jamais plus de 400 ms au total.
- La coquille (barre, en-tête) s'affiche en moins de 100 ms ; seul le contenu attend les données.

### 3.6 Apparitions en cascade

- Décalage de **30 ms** par élément (40 ms pour de grandes cartes), **plafonné à 8 éléments** : au-delà, tout le reste apparaît avec le huitième. Durée totale de la cascade ≤ 400 ms.
- Chaque élément : opacité 0→1 et `translateY(8px→0)`, 240 ms, `--e-out`.
- Une seule fois par visite de page. Jamais au retour arrière, au tri, au filtrage ou au rafraîchissement.
- Jamais sur les lignes d'un tableau dense : la cascade concerne cartes, widgets et sections.

```css
.cascade > * { opacity: 0; transform: translateY(8px);
  animation: entree 240ms var(--e-out) forwards;
  animation-delay: calc(min(var(--i), 8) * 30ms); }
@keyframes entree { to { opacity: 1; transform: none; } }
```

### 3.7 Compteurs

- Durée 600–800 ms, courbe `--e-out` (rapide puis ralentit), départ à 0 ou, mieux, à la valeur précédente connue.
- `font-variant-numeric: tabular-nums` obligatoire pour que la largeur ne tremble pas.
- Uniquement sur 1 à 4 chiffres héros par écran (recettes du mois, taux de remplissage, boxes occupés). Jamais dans un tableau.
- Sur mise à jour en direct : roulement chiffre par chiffre (chaque chiffre glisse verticalement, 300 ms, décalage 20 ms), façon Family / Revolut.
- La variation (« +8 % ») apparaît 150 ms après la fin du compteur, en fondu.
- La valeur finale exacte est dans le DOM dès le départ (`aria-label`), l'animation est purement visuelle.

### 3.8 Survol, pression, focus

| État | Traitement |
|---|---|
| Survol bouton principal | fond saphir assombri de 6 % (`#3558e0`), 80 ms. Pas de déplacement, pas d'ombre qui grossit. |
| Survol ligne de tableau | fond `rgba(10,22,54,.03)`, 0 ms à l'entrée, 80 ms à la sortie ; actions de ligne révélées en opacité. |
| Survol carte cliquable | bordure `rgba(10,22,54,.08)` → `rgba(10,22,54,.16)` et ombre niveau 1 → 2, 120 ms. `translateY(-1px)` au maximum. |
| Pression | `scale(0.97)` bouton, `scale(0.985)` carte, `scale(0.94)` icône seule. 80 ms. |
| Focus clavier | anneau `box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3d63f2`, apparition instantanée, visible uniquement avec `:focus-visible`. |
| Désactivé | opacité 0,45, curseur par défaut, aucune info-bulle. |
| Tactile | pas d'état de survol ; état pressé immédiat (0 ms) + haptique légère sur les actions de validation. |

### 3.9 Chargement

- **Sous 150 ms : rien.** Entre 150 ms et 1 s : squelette. Au-delà de 1 s : squelette + libellé (« Chargement du planning… »). Au-delà de 10 s : message et action de repli.
- Les squelettes ont la **forme exacte** du contenu final (mêmes hauteurs de ligne, mêmes largeurs de colonnes) pour un décalage de mise en page nul.
- Couleur `#eef0f6`, reflet `linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent)` balayé en 1 400 ms linéaire, tous les blocs synchronisés (une seule vague, pas un clignotement par bloc).
- Le contenu remplace le squelette en fondu de 180 ms, sans cascade.
- Jamais de squelette pour une donnée déjà en cache : on affiche l'ancienne valeur et on rafraîchit en silence.
- Spinner réservé à l'intérieur d'un bouton (16 px, remplace le libellé, largeur du bouton figée).

### 3.10 Micro-interactions de validation

**Signature de contrat (doigt ou stylet)**
- Tracé à largeur variable selon la vitesse (1,5 à 3,5 px), lissage par courbes de Bézier, couleur marine `#0a1636`, latence visée < 16 ms (rendu sur canvas, `pointerrawupdate` si disponible).
- Ligne de base pointillée et « × » à gauche ; le libellé « Signez ici » s'efface en 120 ms au premier contact.
- À la validation : le tracé se fige, un trait saphir se dessine sous la signature en 300 ms, un tampon « Signé le 17 nov. 2026 à 14:32 » apparaît (`scale(1.15→1)`, 240 ms, ressort élastique), éclat de strass 600 ms au coin du tampon, haptique « succès ».
- Bouton « Effacer » en texte, jamais à côté du bouton « Valider ».

**Paiement**
- Le bouton « Payer 85,00 € » garde sa largeur, passe en spinner (≥ 400 ms même si la réponse est plus rapide, pour que l'état soit perçu), puis se transforme en cercle avec coche dessinée (`stroke-dashoffset`, 320 ms, `--e-emph-dec`).
- Le fond du bouton passe du saphir au vert succès `#17a673` en 180 ms. Le montant de la carte de solde roule vers sa nouvelle valeur.
- Reçu qui glisse depuis le bas en feuille (400 ms). Aucun confetti.
- Échec : le bouton revient à son état initial, message sous le bouton en `#d43d51`, sans secousse.

**Pointage employé**
- Appui maintenu de 600 ms sur un bouton rond de 96 px : un anneau saphir se remplit autour (progression linéaire), haptique à 100 %. Relâcher avant annule (l'anneau se vide en 180 ms). Évite les pointages accidentels dans la poche.
- À la validation : le bouton s'inverse (plein → contour), l'heure s'affiche en grand (32 px, chiffres tabulaires), le chronomètre de la journée démarre.

**Coche de tournée (box fait)**
- Balayage vers la droite ou appui : coche dessinée en 180 ms, texte de la ligne en opacité 0,5, barre de progression de la tournée qui avance (240 ms, `--e-out`). La ligne ne disparaît pas (on doit pouvoir décocher).
- Dernière ligne cochée : la barre devient saphir plein, éclat de strass, « Tournée terminée en 42 min ».

**Enregistrement automatique**
- Pas de bouton « Enregistrer » sur les fiches. Indicateur textuel en en-tête : « Enregistrement… » → « Enregistré » (fondu 120 ms, disparaît après 2 s).

### 3.11 Mouvement réduit

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
  .fondu-autorise { transition: opacity 120ms linear !important; }
}
```

- On **remplace**, on ne supprime pas : translations, échelles, ressorts et éléments partagés deviennent un fondu de 120 ms. Les changements de couleur et d'opacité restent.
- Compteurs : valeur finale affichée directement. Cascades : tout apparaît ensemble. Reflet des squelettes : fixe.
- Strass : apparaît statique 1 s puis s'efface. Plan 3D : pas de rotation automatique ni de survol de caméra, changements de point de vue par fondu.
- Réglage doublé dans l'application (Compte → Apparence → « Réduire les animations ») pour ceux qui ne connaissent pas le réglage système. Par défaut activé sur les appareils peu puissants (`navigator.hardwareConcurrency ≤ 4` ou mode économie d'énergie).
- Budget de performance : 60 images/s sur un téléphone Android de milieu de gamme de 4 ans ; toute animation qui n'y arrive pas est simplifiée ou retirée.

---

## 4. Densité et typographie

### 4.1 Échelle typographique

Bricolage Grotesque pour les niveaux Affichage à Titre 3 ; Instrument Sans pour tout le reste. Jamais de graisse sous 400.

| Rôle | Police | Taille / interligne | Graisse | Interlettrage |
|---|---|---|---|---|
| Affichage (chiffre héros) | Bricolage | 40 / 44 px | 600 | −0,02em |
| Titre 1 (page) | Bricolage | 28 / 34 px | 600 | −0,015em |
| Titre 2 (section) | Bricolage | 22 / 28 px | 600 | −0,01em |
| Titre 3 (carte) | Bricolage | 18 / 24 px | 600 | −0,005em |
| Corps fort | Instrument Sans | 15 / 22 px | 600 | 0 |
| Corps | Instrument Sans | 15 / 22 px (ordinateur : 14 / 20) | 400 | 0 |
| Secondaire | Instrument Sans | 13 / 18 px | 400–500 | 0 |
| Légende, en-tête de colonne | Instrument Sans | 12 / 16 px | 500 | +0,01em |
| Micro (pastille, onglet bas) | Instrument Sans | 11 / 14 px | 600 | +0,02em |

- Téléphone : corps à 16 px, champs de saisie à 16 px minimum (évite le zoom iOS). Titre 1 à 26 px.
- Longueur de ligne 60–75 caractères pour le texte courant.
- `font-variant-numeric: tabular-nums` sur tout montant, heure, compteur, colonne numérique (à vérifier sur les fichiers de police retenus ; sinon chiffres en police de repli à chasse fixe).
- `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;`
- Pas de capitales sauf légendes de 11–12 px. Pas de changement de graisse au survol.
- Bricolage Grotesque est une police variable avec axe de largeur et de taille optique : utiliser la taille optique automatique, ne pas l'employer sous 18 px.

### 4.2 Couleurs de travail

```css
:root {
  --marine: #0a1636;      /* texte principal, titres */
  --saphir: #3d63f2;      /* accent, action principale (contraste 4,9:1 sur blanc) */
  --saphir-presse: #3558e0;
  --saphir-10: rgba(61, 99, 242, .10);
  --fond: #ffffff;
  --fond-2: #f6f7fb;      /* barre latérale, zones en retrait */
  --fond-3: #eef0f6;      /* squelettes, champs désactivés */
  --texte-2: #4a5372;     /* secondaire (≥ 7:1) */
  --texte-3: #7b84a3;     /* tertiaire, ≥ 14 px en graisse 500 uniquement */
  --bord: rgba(10, 22, 54, .08);
  --bord-fort: rgba(10, 22, 54, .16);
  --succes: #17a673;  --attention: #d98a12;  --danger: #d43d51;
}
```

- Les gris sont teintés de marine, jamais neutres purs.
- Le saphir couvre moins de 10 % de la surface d'un écran. Pas de dégradé saphir → violet.
- Les couleurs de statut portent un sens et rien d'autre ; elles ne décorent jamais.

### 4.3 Grille et espacements

- Unité de base **4 px**. Échelle : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Alignements et dimensions de composants sur **8 px** ; le 4 px sert aux ajustements internes (icône/texte, pastille).
- Marges de page : 32 px ordinateur, 24 px tablette, 16 px téléphone. Gouttière de grille : 24 / 16 / 12 px.
- Grille 12 colonnes sur ordinateur, 8 sur tablette, 4 sur téléphone. Largeur de contenu max 1280 px ; texte et formulaires 680 px.
- Espacement intérieur de carte : 20 px (ordinateur), 16 px (téléphone). Entre sections : 32 px. Entre un titre et son contenu : 12 px.
- Hauteurs de contrôles : 32 px (dense, ordinateur), 40 px (défaut), 48 px (téléphone), 56 px (action principale téléphone).
- Icônes : 16 px (dans le texte), 20 px (boutons, barre latérale), 24 px (barre d'onglets). Trait 1,5 px sur grille 24, extrémités arrondies, mêmes rayons d'angle que l'interface.

### 4.4 Rayons

| Élément | Rayon |
|---|---|
| Pastille, étiquette | 6 px (ou 999 px pour les statuts) |
| Bouton, champ, entrée de menu | 8 px |
| Carte, popover, menu | 12 px |
| Modale, palette, panneau flottant | 16 px |
| Feuille basse (coins hauts) | 24 px |
| Avatar personne | cercle |
| Avatar cheval | carré arrondi 10 px (distinction immédiate personne/cheval) |

Règle d'imbrication : rayon intérieur = rayon extérieur − espacement intérieur (minimum 4 px).

### 4.5 Ombres

Teintées marine, deux couches, toujours accompagnées d'une bordure de 1 px.

```css
--ombre-1: 0 1px 2px rgba(10,22,54,.06);
--ombre-2: 0 1px 2px rgba(10,22,54,.06), 0 4px 12px rgba(10,22,54,.06);
--ombre-3: 0 2px 4px rgba(10,22,54,.06), 0 12px 28px rgba(10,22,54,.10);
--ombre-4: 0 4px 8px rgba(10,22,54,.08), 0 24px 56px rgba(10,22,54,.16);
```

- Niveau 0 (bordure seule) : cartes au repos. Niveau 1 : cartes cliquables. Niveau 2 : survol, éléments glissés au repos. Niveau 3 : menus, popovers, toasts. Niveau 4 : modales, palette, élément en cours de glissement.
- Les cartes au repos n'ont pas d'ombre portée : bordure `--bord` sur fond blanc. L'ombre signale l'élévation, pas la décoration.

### 4.6 Tableaux

- Lignes de 40 px (dense 32 px, confortable 48 px, réglage par utilisateur). En-tête de 36 px, collant, fond blanc, texte 12 px graisse 500 `--texte-2`, sans capitales.
- Séparateurs horizontaux 1 px `--bord` uniquement. Pas de zébrures, pas de bordures verticales, pas de cadre extérieur.
- Première colonne = identité (avatar 24 px + nom en graisse 500), collante au défilement horizontal.
- Texte à gauche, nombres et montants à droite en chiffres tabulaires, statuts en pastille, dates relatives (« il y a 2 j ») avec date exacte en info-bulle.
- Survol de ligne : fond `rgba(10,22,54,.03)` + actions rapides révélées à droite (3 icônes max, le reste dans « … »).
- Sélection multiple : case visible au survol ou dès qu'une ligne est cochée ; barre d'actions groupées flottante en bas (hauteur 48 px, fond marine, texte blanc, rayon 12 px).
- Ligne entière cliquable → panneau de détail. `J`/`K` pour naviguer, `X` pour cocher, `↵` pour ouvrir.
- Filtres en pastilles au-dessus du tableau (« Statut : En pension × »), vues enregistrables. Tri par clic sur l'en-tête, flèche 12 px.
- Virtualisation au-delà de 100 lignes ; pagination infinie avec compteur « 248 chevaux ».
- Téléphone : jamais de tableau. Liste de cartes à 2 lignes (titre + méta) et une valeur à droite.

### 4.7 Cartes

- Fond blanc, bordure 1 px `--bord`, rayon 12 px, espacement 20 px, pas d'ombre au repos.
- Structure fixe : légende (12 px, `--texte-2`) → valeur ou titre → contexte (13 px) → action éventuelle en bas à droite.
- Carte KPI : valeur en Affichage 40 px, variation en pastille (« +8 % vs oct. »), mini-courbe de 32 px de haut sans axes, trait 1,5 px saphir.
- Une carte = un sujet. Pas de carte dans une carte : utiliser un séparateur ou un fond `--fond-2`.
- Toute carte cliquable l'est entièrement, avec un seul lien principal.

### 4.8 États vides

- Bloc centré, largeur max 360 px : icône sur mesure 40 px (trait, saphir à 60 %) ou aperçu grisé du contenu attendu → titre 18 px → une phrase de 13–15 px → un bouton principal + un lien secondaire.
- Le texte dit ce que la fonction apporte et comment démarrer, pas « Aucune donnée ».
- Trois variantes distinctes : première utilisation (pédagogique, avec modèle), aucun résultat de filtre (« Aucun cheval ne correspond — Effacer les filtres »), tout est fait (positif : « Tous les soins du jour sont faits », avec strass discret).
- Jamais d'illustration de stock ni de mascotte.

### 4.9 Pastilles de statut

- Hauteur 22 px (20 px en tableau dense), espacement horizontal 8 px, rayon 999 px, texte 12 px graisse 500, point de 6 px à gauche.
- Fond = couleur à 12 % d'opacité, texte = teinte foncée de la même couleur (contraste ≥ 4,5:1).

| Statut | Fond | Texte | Exemples |
|---|---|---|---|
| Neutre | `rgba(10,22,54,.06)` | `#4a5372` | Brouillon, Archivé |
| Info / en cours | `rgba(61,99,242,.12)` | `#2947c4` | Planifié, En cours |
| Succès | `rgba(23,166,115,.12)` | `#0e7a54` | Payé, Fait, Présent |
| Attention | `rgba(217,138,18,.14)` | `#96600a` | À échéance, À confirmer |
| Danger | `rgba(212,61,81,.12)` | `#b02a3d` | Impayé, En retard, Blessé |

- Cinq familles au maximum dans tout le produit. La couleur n'est jamais le seul signal : libellé toujours présent, icône pour le danger.
- Vocabulaire fermé et identique partout (un impayé s'appelle « Impayé » dans les quatre vues).
- Changement de statut : fondu croisé de couleur 180 ms, sans mouvement.

---

## 5. Vingt-cinq « moments waouh »

Impact et effort notés de 1 à 5. Classement par rapport impact/effort, puis par impact. Effort : 1 = quelques jours, 3 = 3–5 semaines, 5 = un trimestre ou une dépendance matérielle.

### Rang A — à faire en premier (impact fort, effort faible à moyen)

| # | Moment | Vue | Impact | Effort |
|---|---|---|---|---|
| 1 | **Palette `⌘K`** : tout trouver et tout faire en deux frappes (« box Quartz », « facturer Dupont »). | Gérant, coach | 5 | 2 |
| 2 | **Tournée des boxes à balayer** : une carte par box, balayage droite = fait, gauche = signaler ; progression et temps en haut ; fonctionne hors réseau. | Employé | 5 | 2 |
| 3 | **Signature de contrat au doigt** avec tracé à pression simulée, tampon horodaté et PDF envoyé dans la seconde. | Adhérent, gérant | 5 | 2 |
| 4 | **Résumé du matin en une phrase** : l'accueil rédige les 3 priorités du jour à partir des données (soins, impayés, planning). | Gérant | 5 | 2 |
| 5 | **Pointage par appui maintenu** avec anneau qui se remplit et haptique. | Employé | 4 | 1 |
| 6 | **Annulation universelle** : toute action destructive offre « Annuler » pendant 6 s, y compris l'envoi de messages groupés. | Toutes | 4 | 1 |
| 7 | **Compteurs roulants** sur les 3 chiffres héros (recettes, remplissage, boxes occupés) qui se mettent à jour en direct quand un paiement arrive. | Gérant | 4 | 1 |
| 8 | **Strass d'accomplissement** : tournée terminée, galop validé, mois sans impayé. Rare, 600 ms. | Toutes | 4 | 1 |
| 9 | **Planning à glisser-déposer** avec détection de conflits en direct (cheval déjà monté 2 fois, moniteur indisponible : le créneau rougit avant le lâcher). | Gérant, coach | 5 | 3 |
| 10 | **Réservation en 3 appuis** avec paiement par portefeuille mobile et carte de cours qui se « poinçonne » visuellement. | Adhérent | 5 | 3 |

### Rang B — différenciants (impact fort, effort moyen)

| # | Moment | Vue | Impact | Effort |
|---|---|---|---|---|
| 11 | **Assistant qui exécute** : « Décale la reprise de mercredi à 15 h et préviens les cavaliers » → l'assistant montre l'aperçu de l'action (avant/après, 8 destinataires) et attend un seul appui de validation. | Gérant | 5 | 3 |
| 12 | **Signalement en 10 secondes** : photo + note vocale transcrite + cheval détecté par le box en cours ; le gérant le reçoit classé par gravité. | Employé | 5 | 3 |
| 13 | **Fiche cheval en frise chronologique** : soins, ferrures, travail, pesées sur une même ligne de temps que l'on pince pour zoomer. | Gérant, propriétaire | 4 | 2 |
| 14 | **Carnet de santé prédictif** : anneaux façon Apple Forme (vermifuge, vaccin, maréchal, dentiste) qui se vident à l'approche de l'échéance. | Gérant, propriétaire | 4 | 2 |
| 15 | **Plan 2D interactif de l'écurie** : boxes colorés par statut, glisser un cheval d'un box à l'autre, clic = fiche. Socle du plan 3D. | Gérant | 5 | 3 |
| 16 | **Nouvelles de mon cheval** : fil photo/vidéo privé alimenté par les employés (« Quartz est sorti au paddock ce matin »), notification quotidienne facultative. | Adhérent | 5 | 3 |
| 17 | **Appel par balayage** au début de la reprise, attribution des chevaux par glisser, la reprise démarre avec un chronomètre plein écran. | Coach | 4 | 2 |
| 18 | **Facturation mensuelle en un geste** : « 42 factures prêtes, 3 à vérifier » → aperçu, valider, toutes partent ; barre de progression par facture. | Gérant | 5 | 3 |
| 19 | **Progression du cavalier** : parcours des galops en étapes, compétences cochées par le coach, strass au passage de niveau, partageable. | Adhérent, coach | 4 | 3 |
| 20 | **Activité en direct** (écran verrouillé) : « Reprise dans 25 min — Quartz, carrière 2 » puis « En cours ». | Adhérent, coach | 4 | 3 |

### Rang C — signatures spectaculaires (impact très fort, effort élevé)

| # | Moment | Vue | Impact | Effort |
|---|---|---|---|---|
| 21 | **Plan 3D de l'écurie** : maquette isométrique que l'on fait tourner, boxes qui s'éclairent selon le statut, survol de caméra vers un box au clic. | Gérant | 5 | 4 |
| 22 | **Caméras dans le plan** : appui sur un box ou la carrière → flux vidéo qui s'ouvre depuis l'emplacement de la caméra ; alerte « cheval couché depuis 3 h ». | Gérant, propriétaire | 5 | 5 |
| 23 | **Fiche cheval 3D avec points de soin** : modèle que l'on tourne, pastilles sur les zones (antérieur gauche : tendinite, 12 mars), historique par zone. | Gérant, vétérinaire, propriétaire | 5 | 4 |
| 24 | **Charge de travail du cheval** : carte thermique hebdomadaire (heures montées, intensité, repos) et alerte de surmenage avant d'attribuer un cours. | Gérant, coach | 4 | 3 |
| 25 | **Mode kiosque de l'écurie** : écran mural dans la sellerie affichant le planning du jour, les attributions cheval/cavalier et les consignes, mis à jour en direct. | Tous sur place | 4 | 3 |

**Recommandation de séquencement.** Livrer le rang A complet avant toute 3D : il donne 80 % de l'effet perçu. Le plan 2D (15) est le prérequis du plan 3D (21) et des caméras (22). La fiche 3D (23) peut démarrer avec un modèle générique unique teinté à la robe du cheval, avant toute personnalisation morphologique.

**Garde-fous 3D.** Chargement différé, modèle < 1,5 Mo, repli automatique en 2D si le rendu passe sous 40 images/s ou en mouvement réduit, jamais de 3D comme seul accès à une information.

---

## 6. Personnalisation

### 6.1 Ce que font les meilleurs

| Produit | Mécanisme | Ce qu'on en retient |
|---|---|---|
| Linear | Favoris et vues enregistrées dans la barre latérale ; préférences d'affichage par vue | On personnalise en épinglant ce qu'on utilise, pas en configurant un écran de réglages. |
| Notion | Barre latérale à réordonner par glisser, modèles | Glisser-déposer direct, modèles pour ne jamais partir de zéro. |
| Stripe Dashboard | Widgets de l'accueil à ajouter/retirer, raccourcis épinglés automatiquement selon l'usage | Les raccourcis se proposent d'eux-mêmes d'après le comportement. |
| Shopify admin | Applications épinglées dans la navigation, cartes de métriques modifiables | Les modules sont des « applications » que l'on active ; la navigation reflète ce qui est activé. |
| Raycast | Alias et raccourcis par commande, favoris | Chaque commande peut recevoir un raccourci personnel. |
| Arc | Espaces avec couleur propre | Un thème = un choix de teinte, pas un éditeur de couleurs. |
| Apple (écran d'accueil, Santé) | Mode édition explicite, widgets en 3 tailles, « favoris » en tête du résumé | Tailles prédéfinies, mode édition distinct du mode usage. |
| Revolut, Qonto | Widgets d'accueil à réordonner, raccourcis d'actions rapides | 4 actions rapides choisies par l'utilisateur en tête d'écran. |
| Things 3 | Presque rien de configurable | Un bon défaut vaut mieux que dix options. |

### 6.2 Règles pour Piaffe

1. **Défauts par rôle et par type d'établissement.** À l'inscription, 3 questions (type : club, pension, élevage, mixte ; nombre de chevaux ; modules souhaités) produisent une configuration complète. 90 % des utilisateurs ne doivent jamais avoir à personnaliser.
2. **Modules activables par l'établissement** (Pensions, Cours, Concours, Élevage, Boutique, Caméras). Un module désactivé disparaît de la navigation, de la palette et des réglages : aucune entrée grisée.
3. **La personnalisation se fait sur place.** Bouton « Personnaliser » en haut de l'accueil → mode édition (les widgets vibrent légèrement à 1° d'amplitude, poignée et « × » visibles) → « Terminé ». Pas de page de réglages séparée pour l'agencement.
4. **Widgets en 3 tailles fixes** sur une grille de 4 colonnes : S (1×1), M (2×1), L (2×2 ou 4×1). **8 widgets maximum** sur l'accueil. Bibliothèque d'environ 15 widgets, présentés avec un aperçu aux vraies données.
5. **Épingler partout.** Tout cheval, cavalier, vue filtrée ou rapport peut être épinglé dans la barre latérale (étoile, ou `⌥F`). 5 épinglés visibles, le reste sous « Voir tout ».
6. **Vues enregistrées.** Filtre + tri + colonnes = une vue nommée, personnelle ou partagée à l'équipe. Indicateur « Vue modifiée — Enregistrer / Rétablir » quand on s'en écarte.
7. **Actions rapides sur téléphone** : 4 emplacements en tête de l'accueil, choisis parmi une douzaine ; proposés automatiquement d'après les actions les plus fréquentes après 2 semaines d'usage (« Vous signalez souvent un soin : l'ajouter aux raccourcis ? »).
8. **Raccourcis clavier** : jeu par défaut complet et documenté (`?`), modification possible commande par commande depuis la palette (« Attribuer un raccourci »), détection des conflits.
9. **Thème** : Clair (défaut), Sombre, Système ; **6 teintes d'accent préréglées** dont le saphir par défaut, toutes vérifiées en contraste ; densité Confortable / Compacte. L'établissement peut ajouter son logo et sa teinte pour l'espace adhérent. Aucun sélecteur de couleur libre, aucun choix de police.
10. **Deux niveaux de portée, jamais mélangés** : réglages de l'établissement (modules, statuts, tarifs — gérant seul) et préférences personnelles (accueil, épinglés, thème, raccourcis — chacun). L'interface indique toujours lequel on modifie.
11. **Tout est réversible** : « Rétablir la disposition par défaut » dans le mode édition ; les préférences suivent le compte sur tous les appareils.
12. **Test de sobriété** : toute nouvelle option doit remplacer une décision que nous n'arrivons pas à prendre pour au moins 20 % des utilisateurs ; sinon on choisit pour eux.

---

## 7. Pièges à éviter

### 7.1 Ce qui fait « généré par IA »

- Dégradés violet → bleu, halos lumineux flous derrière les cartes, verre dépoli partout.
- Émojis en guise d'icônes ou dans les titres ; icônes de bibliothèque générique mélangées à des icônes sur mesure.
- Rangée de trois ou quatre cartes KPI identiques avec icône dans un carré coloré en haut à gauche.
- Tout centré, tout en cartes arrondies à 16–24 px avec la même ombre douce.
- Bordure colorée épaisse à gauche des cartes ou des alertes.
- Texte en dégradé, titres avec un mot surligné en couleur.
- Animations d'apparition sur chaque élément à chaque défilement ; rebonds généralisés ; cartes qui s'inclinent en 3D au survol.
- Étincelles ✨ sur toute fonction d'assistant. Chez Piaffe, le strass est réservé aux accomplissements ; l'assistant a sa propre icône.
- Textes creux : « Bienvenue sur votre tableau de bord », « Boostez votre productivité », « Tout-en-un, simple et puissant ». Écrire avec les mots de l'écurie : reprise, pension, box, maréchal, galop.
- Données de démonstration invraisemblables (« Cheval 1 », « Jean Dupont », 12 345 €). Utiliser des noms de chevaux, d'affixes et de montants crédibles.
- Graphiques décoratifs sans échelle ni source, camemberts à 8 parts, jauges demi-cercle.
- Mode sombre par simple inversion, noir pur `#000`, saphir non ajusté.
- Bulles de discussion comme seule interface d'assistant : préférer l'aperçu d'action validable.

### 7.2 Ce qui fait « logiciel de gestion vieillot »

- Menus déroulants à plusieurs niveaux en haut de page, fil d'Ariane à 5 niveaux, onglets dans des onglets.
- Tableaux quadrillés et zébrés, en-têtes en capitales grasses sur fond gris, 15 colonnes visibles par défaut.
- Formulaires d'une page entière avec 30 champs, astérisques rouges partout, bouton « Enregistrer » en bas à atteindre par défilement.
- Fenêtres modales empilées ; boîtes « Êtes-vous sûr ? » sur chaque action.
- Rechargement complet de la page à chaque clic ; spinner plein écran ; « Veuillez patienter ».
- Pagination « 1 2 3 … 47 » avec choix « 10 / 25 / 50 par page » comme seul accès aux données.
- Codes couleur saturés (rouge, vert et orange vifs), icônes disquette, loupe et engrenage sorties d'une banque d'images.
- Messages d'erreur techniques (« Erreur 500 », « Champ invalide ») sans solution proposée.
- Dates au format `2026-11-17 14:32:07` ; montants sans séparateur de milliers ni devise.
- Version mobile qui est le site ordinateur réduit ; tableaux à défilement horizontal sur téléphone.
- Export Excel comme réponse à tout besoin d'analyse.
- Réglages présentés comme un arbre de 60 options ; vocabulaire de base de données (« entité », « enregistrement », « tiers »).
- Écran de connexion avec photo de cheval en pleine page et formulaire flottant dessus.

### 7.3 Pièges propres au motion

- Animer la hauteur ou la largeur (saccades) ; animations non interruptibles ; durées supérieures à 400 ms sur une action courante.
- `ease-in` ou `linear` sur une entrée ; `transition: all`.
- Cascade rejouée à chaque retour sur la page ; compteurs relancés à chaque rafraîchissement.
- Squelettes qui ne correspondent pas à la mise en page finale (saut de contenu).
- Célébration à chaque validation : elle perd son sens en deux jours.
- Animation de chargement qui dure plus longtemps que le chargement lui-même (exception assumée : 400 ms minimum sur le paiement).
- Oublier `prefers-reduced-motion`, le mode économie d'énergie et les Android d'entrée de gamme des saisonniers.

---

## 8. Critères d'acceptation (à vérifier sur chaque écran livré)

1. Une seule action principale saphir visible.
2. Réponse visuelle à toute interaction en moins de 100 ms.
3. Aucune animation supérieure à 400 ms hors célébration ; toutes interruptibles.
4. Écran lisible et utilisable en mouvement réduit.
5. Cibles tactiles ≥ 44 px ; contraste texte ≥ 4,5:1.
6. État vide, état de chargement, état d'erreur et état hors ligne conçus, pas seulement l'état nominal.
7. Chiffres tabulaires, montants alignés à droite.
8. Tous les espacements multiples de 4 px, tous les rayons issus de l'échelle.
9. Action atteignable depuis `⌘K` sur ordinateur.
10. Vocabulaire de statut identique dans les quatre vues.

---

## Sources

Relues en ligne pour ce document :
- Emil Kowalski, « 7 practical animation tips » — https://emilkowal.ski/ui/7-practical-animation-tips
- Rauno Freiberg, « Web Interface Guidelines » — https://interfaces.rauno.me/ (texte : https://raw.githubusercontent.com/raunofreiberg/interfaces/main/README.md)
- Material 3, jetons de mouvement (durées, courbes, ressorts) — https://raw.githubusercontent.com/material-components/material-components-android/master/docs/theming/Motion.md

Non relues en ligne (observation des produits et connaissance générale) : Linear, Stripe Dashboard, Qonto, Notion Calendar, Amie, Raycast, Arc, Things 3, Superhuman, Airbnb hôte, Revolut, Family, Apple Santé/Forme, Apple HIG, Mercury, Attio, Vercel, Framer, Toast, Mindbody, Shopify admin, Doctolib Pro. La courbe de feuille `cubic-bezier(0.32, 0.72, 0, 1)` est celle communément associée aux feuilles iOS et au composant Vaul, citée de mémoire.
