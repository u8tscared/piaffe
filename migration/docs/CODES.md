# « Confiez-nous l'accès » : cahier des charges

Option 2 de l'écran « Changer de logiciel » : le gérant n'a pas le temps, il nous donne ses identifiants de l'ancien logiciel et notre robot fait la migration à sa place.

## Côté navigateur (fait : core/acces.mjs)

- La page récupère la clé publique du serveur : `GET /api/v1/migration/cle-publique` → `{kid, spki_base64}` (RSA-OAEP 2048, SHA-256).
- Les identifiants sont chiffrés **dans le navigateur** : une clé AES-GCM 256 aléatoire chiffre `{adresse, identifiant, mot_de_passe, remarque_2fa}`, puis la clé AES est chiffrée par la clé publique RSA. Le mot de passe ne circule jamais en clair, même vers notre serveur web.
- Envoi : `POST /api/v1/migration/acces` `{kid, cle_chiffree, iv, donnees_chiffrees, logiciel, club_id}`.
- Tant que `PIAFFE_SERVEUR` n'est pas configuré, le formulaire affiche « bientôt disponible » et n'envoie rien.

## Côté serveur (fil backend, à faire après relecture sécurité)

- Seul le worker de migration détient la clé privée (secret séparé, jamais dans la base ni dans les journaux).
- Le worker lance le même robot que l'extension (Chromium sans écran, mêmes garde-fous : lecture seule, liens dangereux ignorés, pause entre pages), avec les chemins appris.
- Double authentification : le worker s'arrête sur l'écran de code et notifie le gérant (« Entrez le code reçu ») ; le code saisi est transmis au worker et utilisé une seule fois.
- À la fin, ou au bout de 72 h quoi qu'il arrive : effacement des identifiants chiffrés et de la session, journal d'effacement daté visible par le gérant, e-mail « vos identifiants ont été effacés, pensez à changer votre mot de passe ».
- Consentement explicite enregistré (case à cocher, date, adresse IP), mention dans le contrat de sous-traitance.

## Réserves à trancher par Marceau

- Beaucoup de conditions d'utilisation interdisent de partager ses identifiants avec un tiers : à faire vérifier, logiciel par logiciel, avant d'ouvrir l'option. L'option 1 (le gérant se connecte lui-même et l'extension copie chez lui) n'a pas ce problème.
- Ce stockage, même chiffré et temporaire, est la donnée la plus sensible de Piaffe : audit de sécurité avant la mise en service.
