# Sortir ses données de son ancien logiciel : étude du 24 novembre 2026

Objet : savoir, pour chaque logiciel du marché, comment un club peut récupérer **ses propres données** pour passer à Piaffe, et en déduire l'outil le plus simple et le moins cher.

Légende : **V** = vérifié sur une page lue ce jour ou lors de l'audit du 17/11 (research/01 et 03) ; **S** = supposé, à confirmer sur un vrai export.

## Ce qu'il faut retenir

1. **Personne n'automatise la migration.** Equimondo et Gecurie la présentent comme un service : le club « transmet un export », l'équipe de l'éditeur fait l'import, « la plupart des migrations prennent moins d'une journée » (Equimondo) ; Cavalio facture 400 à 800 € de frais de lancement (V). Aucun outil en libre-service, aucun robot.
2. **La voie universelle, ce sont les exports CSV / Excel** que chaque logiciel sait produire (listes de cavaliers, chevaux, factures). La passerelle Piaffe est donc d'abord un **lecteur d'exports très tolérant**, qui reconnaît les colonnes tout seul. C'est ce qui couvre le plus de clubs pour le moins d'effort.
3. **Kavalog** (le plus installé) existe en version bureau Windows et en version web (V). Son site refuse la lecture automatique : la liste de ses exports n'a pas pu être relevée (S). Pour la version bureau, les données sont dans une base locale ; si c'est une base HFSQL (WINDEV), courante chez les éditeurs français, elle se lit en lecture seule par le pilote ODBC gratuit de l'éditeur de WINDEV (S, à vérifier sur un poste équipé).
4. **La FFE** fournit la liste des licenciés du club depuis FFE Club SIF (export tableur, S pour les colonnes exactes) : c'est la meilleure source pour fiabiliser les fiches (licence, naissance, galop). La passerelle la fusionne avec l'export de l'ancien logiciel.
5. **Le droit est du côté du club** (voir plus bas) : les données sont les siennes, et depuis septembre 2025 le règlement européen sur les données encadre le changement de fournisseur de logiciel en ligne.

## Logiciel par logiciel

| Logiciel | Forme | Comment le club sort ses données | Ce que fait la passerelle | Statut |
|---|---|---|---|---|
| **Kavalog** (AEXAE) | Bureau Windows + web + applis | Exports des listes depuis le logiciel (S). Version bureau : base locale sur le poste (S). Pas d'API ouverte selon un annuaire (V2, fiabilité faible). | Lit les exports ; le robot repère les exports et la base sur le poste. Lecture de la base : étape suivante. | Exports S, base S |
| **Equimondo** | Web | « Export standard » clients, chevaux, factures téléchargé par le client (V, page éditeur). Factur-X, UBL, CII pour les factures (V). | Lit l'export standard. | V |
| **Gecurie** | Web | « Export complet des données en PDF / Excel » (V). | Lit l'export Excel. | V |
| **Cavasoft** | Bureau / web | Import et export Excel annoncés (V, research/01). | Lit l'export Excel. | V pour l'existence, S pour les colonnes |
| **HoofPlanner** | Web | Import/export CSV de toutes les données (V). | Lit les CSV. | V |
| **Cavalio** | Web | Export « à tout moment » promis (V), format non précisé. | Lit CSV/Excel. | S |
| **FFE Club SIF** | Web fédéral | Export des licenciés de la saison (S pour les colonnes). FFE Compet : export CSV/XLS des engagements et résultats (V, source tierce). | Fusionne avec les fiches adhérents par numéro de licence. | S |
| **Excel / Google Sheets** | Tableur | Enregistrer chaque onglet en .xlsx ou .csv. | Lit tous les onglets. | V (testé) |
| **HelloAsso** | Web | Export CSV des adhésions et paiements (S). | À ajouter au dictionnaire quand un club en apporte un. | S |
| **Papier** | — | Rien à extraire. | Proposer un modèle Excel à remplir (à faire) ou la saisie assistée de l'onboarding. | — |

## Pourquoi pas un robot qui « aspire » le site web de l'ancien logiciel ?

Techniquement possible (le gérant se connecte, un module lit les pages qu'il voit), mais : fragile (chaque mise à jour de l'éditeur le casse), souvent contraire aux conditions d'utilisation, et inutile tant que les exports existent. On le garde en dernier recours, uniquement sur des pages que le gérant ouvre lui-même avec son compte.

## Pourquoi pas un robot qui tourne en permanence ?

Utile pendant la **période de double saisie** (le club garde Kavalog un mois le temps de basculer) : le robot pourrait relancer l'export et l'envoi chaque nuit, et l'API d'import met à jour sans doublons grâce aux identifiants stables. C'est prévu par le format (identifiants stables, `envoyer` idempotent) ; la planification est l'étape suivante.

## Cadre légal (à faire relire par un juriste avant de communiquer dessus)

- **Les données appartiennent au club**, qui est responsable de traitement au sens du RGPD. Le club peut les extraire et les confier à un nouveau sous-traitant (Piaffe). Il faut un **accord de sous-traitance RGPD** entre Piaffe et chaque club (contrat type à rédiger).
- **Règlement européen sur les données (Data Act)**, applicable depuis le 12 septembre 2025 : il oblige les fournisseurs de services de traitement de données, logiciels en ligne compris, à permettre au client de changer de fournisseur et d'emporter ses données, et supprime les frais de changement à partir du **12 janvier 2027** (S : à vérifier article par article, notamment pour les logiciels installés sur le poste et les contrats de 24 mois reprochés à Kavalog). Si c'est confirmé, c'est un argument commercial fort.
- **Lire une base locale** : la passerelle ne lit que des données, sur une copie, avec l'accord écrit du club ; elle ne décompile pas le logiciel. Vérifier la licence d'utilisation de l'ancien logiciel, qui peut encadrer l'accès à la base.
- **Sécurité** : le paquet contient des données personnelles (mineurs compris). Il n'est jamais envoyé à un tiers ; l'envoi se fait uniquement vers le compte Piaffe du club, en HTTPS, avec une clé d'API au droit « import » seulement, révocable.

## Architecture retenue : coût quasi nul

```
 Poste du club                                           Serveur Piaffe
 ┌─────────────────────────────────────────┐            ┌──────────────────────────┐
 │ Exports CSV/Excel, liste FFE, base locale│            │ POST /api/v1/import/jobs │
 │            │                             │  HTTPS     │  … /items  (500 par lot) │
 │   Passerelle (page web ou robot)         │──────────▶ │  … /commit (idempotent)  │
 │   lit, nettoie, fusionne, contrôle       │ clé import │  … /rollback             │
 │   → paquet-piaffe.json + rapport         │            └──────────────────────────┘
 └─────────────────────────────────────────┘
```

- Tout le calcul est chez le club : pas de serveur de conversion, pas de stockage des fichiers bruts chez Piaffe.
- La page web est un fichier statique (GitHub Pages ou le site Piaffe) : 0 €.
- Le robot Windows : un seul `.exe` construit gratuitement par GitHub Actions (Node « single executable »). Seul coût : la **signature du code**, sans laquelle Windows affiche un avertissement inquiétant (environ 10 € par mois avec la signature de Microsoft, à vérifier).

## Ce qu'il faut à Marceau

1. **Un vrai export de Kavalog** (et si possible d'Equimondo, Cavasoft, FFE Club SIF) venant d'un club ami, même avec des noms remplacés. C'est ce qui permet de passer de « colonnes devinées » à « colonnes connues ». Idéal : 30 minutes sur le poste d'un club sous Kavalog bureau pour voir où sont les données.
2. **Décider si on fait le `.exe` Windows** maintenant (coût de signature) ou si la page web suffit pour les premiers clubs. Recommandation : page web d'abord, `.exe` quand un premier club en a besoin.
3. **Faire valider** par un juriste l'argument Data Act et le contrat de sous-traitance RGPD.
4. **Une boîte à part ?** Le moteur est générique (lecture, reconnaissance de colonnes, fusion, contrôle) ; ce qui a de la valeur, ce sont les dictionnaires métier. Recommandation : le garder dans Piaffe tant qu'il sert à vendre Piaffe (c'est un argument de vente décisif contre Kavalog), et le séparer plus tard si d'autres éditeurs veulent l'acheter.
