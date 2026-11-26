# Passerelle Stabl : changer de logiciel sans rien ressaisir

La passerelle récupère les données d'un club (cavaliers, familles, chevaux, forfaits, factures, règlements, reprises, soins, équipe) depuis son ancien logiciel et les prépare pour Stabl. Elle tourne **sur l'ordinateur du club** : rien n'est envoyé tant que le gérant ne clique pas sur « Envoyer », et les fichiers d'origine ne sont jamais modifiés.

Quatre façons de récupérer les données, un seul moteur (`core/`, JavaScript sans dépendance), présentées sur l'écran « Changer de logiciel » (63 logiciels réels rangés par famille, avec leurs logos, et un champ « collez l'adresse de votre logiciel » pour ceux qu'on ne connaît pas) :

1. **Connexion assistée** (`robot/`, `web/robot-distant.mjs`), rien à installer : un navigateur Stabl côté serveur ouvre l'ancien logiciel, le gérant voit son écran dans la page et s'y connecte (double authentification comprise). Dès qu'il est connecté, le robot copie tout en lecture seule, même sur un logiciel inconnu. Essai : `node migration/essais/robot-serveur.cjs`.
2. **Donnez-nous vos codes** : le gérant confie une fois son identifiant et son mot de passe ; le robot se connecte seul. Si le logiciel envoie un code de vérification (SMS, e-mail, application), la page le demande au gérant au bon moment. Les identifiants sont chiffrés sur le serveur (AES-GCM, clé secrète du Worker), jamais écrits en base ni dans un journal, et effacés dès la connexion faite. Si la connexion échoue, le gérant se connecte lui-même dans le même écran. Essais : `node migration/essais/robot-auto.cjs` et `node migration/essais/robot-codes.cjs`.
3. **Robot pour ordinateur** (`cli/`) pour les logiciels installés.
4. **Fichier** : CSV, Excel, Google Sheets (exporté en .xlsx ou .csv), liste FFE, agenda .ics, **export HelloAsso** (adhésions et paiements), **FEC** (fichier des écritures comptables, que tout logiciel de comptabilité sait sortir : Pennylane, Tiime, Indy, QuickBooks, Sage, EBP, Cegid, Dougs…). Les colonnes sont rangées toutes seules.

## Le robot, sans recette

Le robot n'a pas besoin de connaître le logiciel à l'avance :

- **il écoute** ce que le logiciel charge (les listes en JSON derrière l'écran), tourne lui-même les pages (page=, offset=, curseur, lien « suivant ») et redemande les listes datées (planning, réservations, factures, règlements) de 24 mois en arrière à 12 mois devant ;
- **il lit l'écran** : tableaux, grilles, fiches, cartes répétées ;
- **il suit les menus** du même site, y compris les vieux menus qui rechargent la page (JSF, PHP) ;
- **il range** ce qu'il trouve dans le monde équestre : cavaliers et adhérents, chevaux (SIRE, UELN, puce, race, robe, naissance, propriétaire), pensions, forfaits et cartes, reprises et planning, réservations, factures, règlements, licences FFE, soins (véto, maréchal, vermifuges, vaccins), stocks et fourrage, fournisseurs, équipe, comptabilité ;
- **un pilote facultatif** (un modèle Claude, si la clé `ANTHROPIC_API_KEY` est posée) cherche ce qui manque encore. Il propose une action à la fois ; c'est le code qui décide si elle part (`robot/garde-fous.mjs`) : jamais rien qui efface, crée, modifie, paie, envoie ou déconnecte. Sans clé, le robot fait sans ;
- **il apprend** : ce qui a marché devient la recette du logiciel (chemins, libellés de menus, en-têtes de colonnes, jamais une donnée du club), rejouée pour le club suivant.

Import par l'API : `POST /api/v1/import/fichier` (n'importe quel fichier ci-dessus, aperçu puis import) et `POST /api/v1/import/fec`.

Bonus : lettre de résiliation de l'ancien abonnement, e-mails de bascule pour les adhérents (`docs/EMAILS-MIGRATION.md`).

| Forme | Pour qui | Installation | Coût de fonctionnement |
|---|---|---|---|
| **Page web** `dist/passerelle.html` | 90 % des clubs : ils ont des exports CSV ou Excel | Aucune, s'ouvre dans le navigateur | 0 € (page statique, calcul dans le navigateur) |
| **Robot pour ordinateur** `cli/passerelle.mjs` | Clubs qui ne savent pas où sont leurs exports, ou dont l'ancien logiciel n'exporte pas tout | Un fichier à lancer (aujourd'hui avec Node, demain un `.exe` unique) | 0 € (tourne chez le club) |

## Ce que fait la passerelle

1. **Reconnaît le fichier** : CSV (séparateur et encodage Windows devinés), Excel `.xlsx` (plusieurs onglets), faux `.xls` exportés en HTML par les vieux logiciels.
2. **Reconnaît le contenu** : adhérents, chevaux, tarifs, factures, règlements, reprises, équipe ou soins, d'après les intitulés de colonnes (plus de 300 intitulés connus, voir `core/champs.mjs`). Le gérant peut corriger une colonne à la main.
3. **Remet au propre** : dates (y compris les dates Excel), téléphones au format international, montants « 1 390,00 € », noms en majuscules, numéros de licence FFE et SIRE, moyens de paiement, jours et heures.
4. **Fusionne** : un même cavalier présent dans l'export Kavalog et dans la liste FFE ne fait qu'une fiche (par licence, puis nom + naissance, puis e-mail). Les familles sont reconstituées (code famille, responsable légal, e-mail commun). Les chevaux sont reliés à leur propriétaire, les factures au payeur, les reprises à leurs cavaliers et à leurs chevaux.
5. **Contrôle** : liste ce qu'il faut vérifier (mineur sans contact, e-mail illisible, cheval sans SIRE, forfait sans tarif, soin d'un cheval inconnu…) et donne trois chiffres à comparer avec l'ancien logiciel : nombre de cavaliers, de chevaux, reste dû.
6. **Livre** un `paquet-piaffe.json` (format documenté dans `docs/FORMAT.md`) et un rapport HTML, ou envoie directement au serveur Stabl par l'API d'import (essai d'abord, puis pour de vrai ; relancer met à jour sans créer de doublons).

## Essayer

```sh
# version navigateur : construire puis ouvrir dist/passerelle.html, bouton « Essayer avec des fichiers d'exemple »
node migration/tools/construire.mjs

# robot : chercher les exports sur ce poste, puis convertir
node migration/cli/passerelle.mjs chercher ~/Documents
node migration/cli/passerelle.mjs convertir migration/fixtures --sortie /tmp/sortie

# voir ce qui partirait vers l'API, puis envoyer (essai par défaut)
node migration/cli/passerelle.mjs envoyer /tmp/sortie/paquet-piaffe.json --apercu
node migration/cli/passerelle.mjs envoyer /tmp/sortie/paquet-piaffe.json --url https://app.stablapp.fr --cle pk_live_…

# contrôles
node migration/test/tests.mjs
```

Les fichiers de `fixtures/` sont fictifs ; ils imitent un export Kavalog (Windows-1252, point-virgule, ligne de titre), une liste de licenciés FFE, un classeur maison à deux onglets, etc.

## Organisation

```
core/texte.mjs      décodage (UTF-8, Windows-1252, UTF-16) et forme comparable des libellés
core/csv.mjs        lecture CSV tolérante
core/xlsx.mjs       lecture .xlsx sans bibliothèque
core/lire.mjs       un fichier -> des tableaux
core/champs.mjs     dictionnaire des colonnes et reconnaissance du type de fichier
core/valeurs.mjs    mise au propre des valeurs
core/logiciels.mjs  ce qu'on sait de chaque logiciel et de ses bases locales
core/paquet.mjs     fusion et contrôles -> paquet piaffe-import 1.0
core/rapport.mjs    rapport HTML et résumé
core/vers-api.mjs   paquet -> lots pour POST /api/v1/import (voir app/ARCHITECTURE.md)
cli/passerelle.mjs  robot pour ordinateur (chercher, convertir, envoyer)
robot/              robot côté serveur : entree.mjs (migrerDepuisPage, migrerAvecAcces), auto.mjs (connexion et copie de bout en bout),
                    ecoute.mjs (robot de la page), jeux.mjs (listes JSON -> types équestres), explorateur.mjs (écrans et menus),
                    pilote.mjs (pilote facultatif), garde-fous.mjs, recettes.mjs, dans-la-page.mjs, serveur-local.mjs (référence du contrat HTTP)
core/fec.mjs        lecture du FEC (résumé comptable, clients, factures, règlements, fournisseurs)
core/helloasso.mjs  export HelloAsso -> adhérents, formules, paiements
core/parcours.mjs   questions d'accueil (changer ou intégrer) et plan de bascule
extension/          ancienne extension Chrome, plus proposée dans l'interface (même moteur d'extraction)
essais/             faux ancien logiciel web et essai de bout en bout du robot navigateur
core/capture.mjs    lecture des captures du robot navigateur ; core/ics.mjs agendas
core/logos.mjs      logos des logiciels ; core/acces.mjs chiffrement des identifiants ; core/resiliation.mjs lettre
web/                version navigateur ; tools/construire.mjs en fait un seul fichier
docs/ETUDE.md       comment chaque logiciel laisse sortir ses données, cadre légal
docs/FORMAT.md      format du paquet
```

## Limites du prototype

- Les intitulés de colonnes de Kavalog, Equimondo et Cavasoft sont **déduits**, pas relevés sur de vrais exports : il faut un vrai export de club pour calibrer (voir docs/ETUDE.md, « Ce qu'il faut à Marceau »).
- L'ancien format Excel binaire `.xls` (avant 2007) n'est pas lu : la page demande de l'enregistrer en `.xlsx`.
- Les bases locales (HFSQL, Access, Firebird) sont **repérées** par le robot, pas encore lues.
- La connexion assistée et « Donnez-nous vos codes » sont hébergées par l'API (Cloudflare Browser Rendering, un Durable Object par session, `app/api/src/robot/`) ; `robot/serveur-local.mjs` garde le même contrat HTTP pour les essais.
- Partager ses identifiants peut être interdit par les conditions d'utilisation de certains logiciels : à vérifier avant d'ouvrir l'option à tous (voir `docs/CODES.md`).
- Le robot demande Node.js ; le `.exe` Windows signé est l'étape suivante.
