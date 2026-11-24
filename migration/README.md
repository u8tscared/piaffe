# Passerelle Piaffe : changer de logiciel sans rien ressaisir

La passerelle récupère les données d'un club (cavaliers, familles, chevaux, forfaits, factures, règlements, reprises, soins, équipe) depuis son ancien logiciel et les prépare pour Piaffe. Elle tourne **sur l'ordinateur du club** : rien n'est envoyé tant que le gérant ne clique pas sur « Envoyer », et les fichiers d'origine ne sont jamais modifiés.

Quatre façons de récupérer les données, un seul moteur (`core/`, JavaScript sans dépendance), présentées sur l'écran « Changer de logiciel » (56 logiciels réels rangés par famille, avec leurs logos, et un champ « collez l'adresse de votre logiciel » pour ceux qu'on ne connaît pas) :

1. **Robot navigateur** (`extension/`) : le gérant se connecte à son ancien logiciel, l'extension parcourt les pages et copie tout, même sur un logiciel inconnu (exploration automatique). Chaque exploration retient le chemin ; s'il casse, un incident est signalé.
2. **Robot pour ordinateur** (`cli/`) pour les logiciels installés.
3. **Confiez-nous l'accès** : identifiants chiffrés dans le navigateur, migration faite par notre robot (partie serveur à venir, voir `docs/CODES.md`).
4. **Fichier** : CSV, Excel, liste FFE, agenda .ics.

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
6. **Livre** un `paquet-piaffe.json` (format documenté dans `docs/FORMAT.md`) et un rapport HTML, ou envoie directement au serveur Piaffe par l'API d'import (essai d'abord, puis pour de vrai ; relancer met à jour sans créer de doublons).

## Essayer

```sh
# version navigateur : construire puis ouvrir dist/passerelle.html, bouton « Essayer avec des fichiers d'exemple »
node migration/tools/construire.mjs

# robot : chercher les exports sur ce poste, puis convertir
node migration/cli/passerelle.mjs chercher ~/Documents
node migration/cli/passerelle.mjs convertir migration/fixtures --sortie /tmp/sortie

# voir ce qui partirait vers l'API, puis envoyer (essai par défaut)
node migration/cli/passerelle.mjs envoyer /tmp/sortie/paquet-piaffe.json --apercu
node migration/cli/passerelle.mjs envoyer /tmp/sortie/paquet-piaffe.json --url https://app.piaffe.fr --cle pk_live_…

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
extension/          robot navigateur (extension Chrome), voir extension/LISEZMOI.md
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
- L'extension n'est pas encore publiée sur le Chrome Web Store (chargement manuel en mode développeur).
- « Confiez-nous l'accès » attend les routes serveur ; le formulaire n'envoie rien en attendant.
- Le robot demande Node.js ; le `.exe` Windows signé est l'étape suivante.
