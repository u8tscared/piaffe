# Extension « Stabl : changer de logiciel » (robot navigateur)

Le gérant se connecte **lui-même** à son ancien logiciel (double authentification comprise), puis clique sur l'extension :

- **Tout récupérer automatiquement** : le robot part de la page affichée, suit les menus du même site, copie chaque liste (en passant toutes les pages « Suivant »), ouvre les fiches détaillées si la case est cochée. Ça marche aussi sur un logiciel que nous ne connaissons pas : il suffit d'ouvrir son adresse.
- **Rejouer le chemin connu** : chaque exploration réussie enregistre le chemin (quelles pages, quel tableau, quelles colonnes). La fois suivante, sur le même logiciel, le robot va droit au but. Si un écran a changé, il le signale (incident) et repasse en exploration pour cette page.
- **Télécharger pour la passerelle** : produit `capture-piaffe.json`, à déposer dans la passerelle, qui le lit comme n'importe quel export.

## Garde-fous

- Lecture seule : le robot ne remplit ni n'envoie aucun formulaire, ne clique que sur « page suivante », et ignore les liens dangereux (déconnexion, supprimer, annuler, résilier, payer, valider, exporter, télécharger, imprimer…).
- Il ne voit jamais le mot de passe : le gérant se connecte lui-même ; les champs mot de passe ne sont jamais lus.
- Accès au site demandé au moment voulu, pour ce site seulement (`optional_host_permissions`).
- Une pause de 0,7 s entre deux pages pour ne pas charger le serveur de l'ancien éditeur.
- Tout reste dans le navigateur jusqu'au téléchargement. Seuls les chemins appris (sans aucune donnée de club) et les incidents peuvent être envoyés à Stabl si une adresse de serveur est configurée.

## Essayer

```sh
node migration/essais/robot-navigateur.cjs   # faux ancien logiciel + Chrome avec l'extension, exploration complète
```

Chargement manuel : `chrome://extensions`, mode développeur, « Charger l'extension non empaquetée », choisir `migration/extension/`. Puis `node migration/essais/ancien-logiciel.mjs` et ouvrir http://localhost:4799 (identifiant et mot de passe : demo).

## Publication

Chrome Web Store : compte développeur (frais uniques de 5 $), fiche, politique de confidentialité, puis revue de Google. Edge Add-ons : gratuit, même paquet.
