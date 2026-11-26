# « Donnez-nous vos codes » : comment ça marche

Le gérant n'a pas le temps : il confie l'identifiant et le mot de passe de son ancien logiciel, et le robot Stabl fait la copie à sa place.

## Le parcours

1. Dans la passerelle, carte « Donnez-nous vos codes » : identifiant, mot de passe, case « J'autorise Stabl à se connecter… » (obligatoire).
2. La page appelle `POST /api/v1/migration/robot` `{adresse, logiciel, acces: {identifiant, mot_de_passe}, consentement: true}` (connexion https, session du gérant).
3. Le serveur scelle aussitôt les identifiants (AES-GCM 256, clé dérivée du secret du Worker `ROBOT_SECRET`, à défaut `SESSION_SECRET`, liée à cette session). Le scellé n'est écrit ni en base ni dans un journal ; seul le Durable Object de la session le garde, en mémoire.
4. Le robot ouvre le logiciel, remplit le formulaire de connexion, puis efface les identifiants.
5. Code de vérification (SMS, e-mail, application) : l'écran en direct affiche « Tapez le code reçu » ; la page l'envoie par `POST /api/v1/migration/robot/:id/code {code}`. Le robot coche « se souvenir de cet appareil » quand la case existe.
6. Connexion refusée : le gérant est prévenu simplement (« L'identifiant ou le mot de passe a été refusé ») et peut se connecter lui-même dans le même écran.
7. La copie se fait en lecture seule, puis le navigateur est fermé. Le journal d'audit garde la date, le gérant et son consentement, jamais les identifiants.

## Ce qui reste à trancher

- Beaucoup de conditions d'utilisation interdisent de partager ses identifiants avec un tiers : à vérifier logiciel par logiciel. La connexion assistée (le gérant se connecte lui-même) n'a pas ce problème.
- Poser le secret `ROBOT_SECRET` (distinct de `SESSION_SECRET`) avant l'ouverture : `wrangler secret put ROBOT_SECRET`.
- Pilote facultatif : `wrangler secret put ANTHROPIC_API_KEY` (sans lui, le robot fait sans).
- Audit de sécurité avant la mise en service.

L'ancien envoi chiffré dans le navigateur (`core/acces.mjs`, RSA-OAEP) reste utilisable si un serveur séparé est configuré (`PIAFFE_SERVEUR`), mais le chemin normal est celui décrit ici.
