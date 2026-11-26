# Stabl, le vrai logiciel : architecture

La démo (`demo/`) reste la vitrine publique sur GitHub Pages. Le logiciel vendu aux écuries vit dans `app/` :

- `app/api/` : un seul Cloudflare Worker (TypeScript, Hono) qui sert **l'API** et **l'application web** (même origine, donc cookies simples et pas de CORS).
- `app/web/` : l'application web. Elle réutilise le moteur et les écrans de la démo (`demo/core`, `demo/modules`) et ajoute une couche « live » qui remplace les données fictives par les vraies données du club, enregistre chaque modification, et ajoute les écrans qui n'existent pas dans la démo (connexion, onboarding, abonnement, paiements en ligne, comptable, calendriers, clés d'API).

## Pourquoi Cloudflare

| Besoin | Service | Coût |
|---|---|---|
| Serveur + appli web | Workers (+ assets statiques) | Gratuit jusqu'à 100 000 requêtes/jour. **Workers Paid 5 $/mois** conseillé dès le premier client (limite CPU 10 ms → 30 s, utile pour le hachage des mots de passe et les PDF). |
| Base de données | D1 (SQLite) | Inclus : 5 Go, des milliards de lectures. |
| Fichiers (PDF, logos, pièces) | R2 | 10 Go gratuits, sortie gratuite. |
| Tâches planifiées | Cron Triggers | Inclus. |
| E-mails | Resend (3 000/mois gratuits) ou Brevo (300/jour gratuits), interchangeables | 0 € au départ. |
| Paiements | Stripe Billing + Stripe Connect (comptes des clubs, frais payés par le club) | Aucun abonnement, frais par transaction uniquement. |
| Facture électronique | Plateforme agréée par API (voir `invoicing/`) | Selon la plateforme retenue. |
| Connexion Google | Google OAuth (OpenID Connect) | Gratuit. |

Pas de serveur à gérer, pas de base qui s'endort (contrairement au palier gratuit de Supabase), une seule commande de déploiement.

## Découpage et propriété des fichiers

Chaque lot possède ses dossiers et n'écrit **jamais** dans ceux des autres. Le socle (`src/index.ts`, `src/env.ts`, `src/lib/*`, `src/routes-registry.ts`, `migrations/0001_init.sql`, `test/helpers.ts`, `test/setup.ts`) appartient à l'orchestrateur : si un lot a besoin d'y changer quelque chose, il le note dans son compte rendu (ou ajoute un fichier à lui).

| Lot | Dossiers | Migration |
|---|---|---|
| A · comptes et données | `src/auth/`, `src/records/`, `test/auth*.test.ts`, `test/records*.test.ts` | `0002_auth.sql` |
| B · Stripe | `src/billing/`, `test/billing*.test.ts` | `0003_billing.sql` |
| C · factures et comptable | `src/invoicing/`, `test/invoicing*.test.ts`, `assets/fonts/` | `0004_invoicing.sql` |
| D · e-mails, ICS, import | `src/mail/`, `src/ics/`, `src/import/`, `test/mail*`, `test/ics*`, `test/import*` | `0005_mail_ics_import.sql` |
| E · appli web et onboarding | `app/web/`, `src/onboarding/`, `test/onboarding*` | `0006_onboarding.sql` |
| MCP · connecteur Claude et ChatGPT | `src/mcp/`, `test/mcp*` | `0020_mcp.sql` |

Chaque `src/<lot>/routes.ts` exporte par défaut un `Hono<AppEnv>` monté à la racine (les chemins complets sont écrits dans le lot, ex. `app.post("/auth/login", …)`) et une fonction `cron(env, expr)` appelée par les Cron Triggers (`*/10 * * * *` et `0 6 * * *`).

## Conventions

- Identifiants : `newId("clb")` → `clb_…`. Dates ISO UTC en TEXT. **Montants en centimes** (INTEGER) côté serveur ; l'interface (données de la démo) manipule des euros : la conversion se fait à la frontière (records restent en euros comme la démo, les tables typées factures et paiements sont en centimes).
- Erreurs : `throw new ApiError(status, code, "Message en français pour l'utilisateur")` ou `bad()`, `forbidden()`, `notFound()`. Réponse `{ error: { code, message, details } }`.
- Authentification : le middleware `loadAuth` (lib/auth.ts) pose `c.get("user")`, `c.get("club")`, `c.get("membership")` (`role`, `person_ref`), `c.get("apiKey")`. Protégez avec `requireUser`, `requireRole("owner","manager")` (owner passe partout où manager passe), `requireScope("import")` (clé d'API ou gérant).
- Club courant : celui de la session, ou l'en-tête `X-Piaffe-Club`.
- Événements entre lots : `emit(env, c.executionCtx, {type:"invoice.paid", …})` et `on("invoice.paid", handler)` (lib/events.ts, liste des événements en tête du fichier). Un lot qui réagit à un événement d'un autre lot enregistre son gestionnaire dans un fichier `src/<lot>/hooks.ts` importé par son `routes.ts`.
- E-mails : `sendMail(env, {to, template, data, club_id})` (src/mail/send.ts, contrat fixe).
- Audit : `audit(db, {club_id, user_id, action, target, data})` pour toute action sensible.
- Tests : Vitest dans le runtime Workers (`npm test`), base D1 locale migrée à chaque fichier de test. `seed(role)` (test/helpers.ts) crée club + utilisateur + session ; `call(path, {json, token, club})` appelle le Worker. Les appels sortants (Stripe, Google, e-mail, plateforme) doivent être simulés dans les tests (`fetchMock` n'existe plus : injectez un `fetch` via une fonction `setFetch()` de votre lot, ou testez la logique pure).
- Pas de dépendance lourde. Déjà installés : `hono`, `pdf-lib`, `@pdf-lib/fontkit`. Stripe et Google s'appellent en `fetch` direct (pas de SDK).
- Français impeccable dans tous les messages et e-mails (espaces insécables avant : ; ? ! €, pas de tiret cadratin en ponctuation, vouvoiement).

## Contrats d'API (ce que l'appli web appelle)

### Comptes (lot A)
- `POST /auth/signup` `{email, password, first, last}` → crée l'utilisateur, ouvre la session (cookie `piaffe_s`), envoie `verify_email`. 201 `{user}`.
- `POST /auth/login` `{email, password}` → `{user, clubs}`. Limité à 10 essais / 15 min par IP et par e-mail.
- `POST /auth/logout`.
- `GET /auth/google/start?next=/…` → redirection Google (PKCE + state) ; `GET /auth/google/callback` → crée ou relie le compte (par `google_sub`, sinon par e-mail vérifié), ouvre la session, redirige vers `next`.
- `POST /auth/verify` `{token}` ; `POST /auth/verify/resend`.
- `POST /auth/password/forgot` `{email}` (réponse identique que l'e-mail existe ou non) ; `POST /auth/password/reset` `{token, password}`.
- `POST /auth/magic` `{email}` lien de connexion sans mot de passe (pratique pour les parents) ; `GET /auth/magic/callback?token=`.
- `GET /api/me` → `{user, clubs:[{id,name,role,person_ref}], current_club_id}` ; `PATCH /api/me` ; `POST /api/me/club` `{club_id}` change de club courant.
- `POST /api/clubs` `{name, kind, …}` → crée un club, l'appelant devient `owner`, essai de 30 jours. Émet `club.created`.
- Invitations : `POST /api/invitations` `{email, role, person_ref?, first?, last?}` (gérant) → e-mail `invitation` ; `GET /auth/invitations/:token` (aperçu public : club, rôle) ; `POST /auth/invitations/:token/accept` (connecté, ou avec `{password, first, last}` pour créer le compte au passage). `GET /api/invitations`, `DELETE /api/invitations/:id`.
- Équipe d'accès : `GET /api/club/users`, `PATCH /api/club/users/:userId` `{role, status}`, `DELETE …`.
- Clés d'API : `GET/POST /api/api-keys` `{name, scopes}` (le jeton complet n'est montré qu'une fois), `DELETE /api/api-keys/:id`.

### Données du club (lot A)
- `GET /api/club/bootstrap` → `{club, me:{user, role, person_ref}, data:{<coll>:[…]}, versions:{"<coll>/<id>":n}, server_time}` : toutes les collections que ce rôle a le droit de lire, au format exact de `window.DATA` de la démo.
- `POST /api/records/batch` `{ops:[{op:"upsert"|"delete", coll, id, data?, version?}]}` → `{results:[{coll,id,ok,version,conflict?}]}`. Si `version` est fourni et ne correspond pas : `conflict:true` + la version serveur.
- `GET /api/records/changes?since=ISO` → objets modifiés depuis (synchro entre appareils).
- Politique d'accès par rôle et par collection dans `src/records/policy.ts` (gérant : tout ; employé : chevaux, soins, tâches, stocks, planning, présences ; coach : ses reprises et ses élèves ; adhérent : sa fiche et sa famille, ses chevaux, les reprises, ses factures, ses contrats, ses messages ; comptable : rien dans records, seulement factures et exports).
- Déclencheurs (`src/records/triggers.ts`) : nouvel adhérent avec e-mail → invitation et e-mail de bienvenue (si l'option du club est active) ; réservation d'une reprise → `booking_confirmed` ; place libérée → `waitlist_spot`.

### Stripe (lot B)
- Abonnement des clubs à Stabl (vendeur : Marceau Ruis EI) : `GET /api/billing/plans`, `POST /api/billing/checkout` `{plan, interval:"month"|"year"}` → URL Stripe Checkout ; `POST /api/billing/portal` → URL du portail client ; `GET /api/billing/subscription`.
- Paiements des adhérents vers le club (Stripe Connect, le club encaisse sur son propre compte) : `POST /api/connect/onboard` → lien d'activation Stripe ; `GET /api/connect/status` ; `POST /api/pay/invoice/:id` → URL Checkout (carte, SEPA) pour une facture du club ; `POST /api/pay/mandate` → mise en place d'un prélèvement SEPA pour les échéances ; `POST /api/pay/link` (gérant) lien de paiement à envoyer.
- `POST /webhooks/stripe` (plateforme) et `POST /webhooks/stripe-connect` (comptes connectés), signatures vérifiées, idempotents. Émettent `subscription.changed`, `invoice.paid`, `payment.failed`.

### Factures, facture électronique, comptable (lot C)
- `GET /api/invoices?status=&member=&from=&to=`, `POST /api/invoices` (brouillon), `PATCH /api/invoices/:id` (brouillon seulement), `POST /api/invoices/:id/issue` (numérotation légale continue, gel, PDF Factur-X dans R2, envoi), `POST /api/invoices/:id/credit-note` (avoir), `POST /api/invoices/:id/payments` (paiement manuel : chèque, espèces, ANCV, virement), `GET /api/invoices/:id/pdf`, `GET /api/invoices/:id/facturx.xml`.
- Facture électronique : adaptateur de plateforme agréée (`src/invoicing/pa/`), transmission des factures B2B, e-reporting des ventes aux particuliers, réception des factures fournisseurs, statuts de cycle de vie. Fournisseur `sandbox` pour les tests.
- Comptable : rôle `accountant` (invité par le gérant), `GET /api/accounting/exports/fec?year=` (FEC conforme), `GET /api/accounting/exports/sales.csv`, `GET /api/accounting/exports/pdfs.zip?month=`, journal des ventes et des encaissements.
- Factures de Stabl aux clubs (vendeur Marceau Ruis EI) générées au même format à partir des paiements Stripe.

### E-mails, calendriers, import (lot D)
- `sendMail` + modèles HTML et texte (charte Stabl, logo remplaçable), fournisseurs `log`, `resend`, `brevo`, file d'attente `email_outbox` avec reprise par le cron, `POST /webhooks/mail` (rebonds), désinscription des e-mails non essentiels.
- ICS : `GET /api/calendars` (liens de l'utilisateur) ; `POST /api/calendars` `{scope}` ; flux `GET /ics/:token.ics` (adhérent : ses reprises et ses rendez-vous ; coach : son agenda ; gérant : planning du club, soins, concours ; cheval : soins et maréchal). Compatible Google Agenda, Apple Calendrier, Outlook.
- Import (utilisé par l'outil de migration depuis Kavalog et par l'import de fichiers) : voir « API d'import » ci-dessous.

### Onboarding et appli web (lot E)
- `GET /api/onboarding` / `PUT /api/onboarding` `{answers}` / `POST /api/onboarding/complete` : questionnaire adaptatif (type de structure, nombre de chevaux, de boxes, d'adhérents, de salariés, disciplines, logiciel actuel, comptable, encaissement en ligne) ; à la fin, le serveur prépare le club : modules actifs, forfaits types, installations, modèles de contrats, rappels, et propose l'import.
- Appli web : écrans de connexion, inscription, Google, mot de passe oublié, invitation, onboarding, puis la démo branchée sur les vraies données.

### Connecteur MCP (Claude, ChatGPT…) · `src/mcp/`

Un gérant (ou un employé) relie son assistant à Stabl en ajoutant l'adresse **`https://app.stablapp.fr/mcp`** comme connecteur. Guide pour le gérant : `app/MCP.md`. Modèle : le connecteur de Growth Gusto, en lecture des données en direct plutôt que d'un instantané.

- **Protocole** : MCP en HTTP « streamable », JSON-RPC 2.0, réponses JSON sans flux (`POST /mcp` ; `GET`/`DELETE` → 405 ; notifications → 202 ; lots acceptés). Versions 2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05. Sans état côté serveur (pas de `Mcp-Session-Id`). CORS ouvert (l'accès repose sur le jeton).
- **OAuth 2.1** (le Worker est son propre serveur d'autorisation) : `GET /.well-known/oauth-protected-resource[/mcp]`, `GET /.well-known/oauth-authorization-server[/mcp]` (et `openid-configuration`), `POST /oauth/register` (enregistrement dynamique RFC 7591, clients publics seulement), `GET /oauth/authorize` (PKCE S256 obligatoire, `resource` RFC 8707 vérifié, `iss` dans la réponse RFC 9207) → page d'accord servie par le Worker (même origine, la session `piaffe_s` est reprise ; sinon connexion e-mail/mot de passe ou Google sur place), `POST /oauth/authorize` (jeton de formulaire HMAC lié à la session + contrôle d'Origin), `POST /oauth/token` (code + `code_verifier`, renouvellement), `POST /oauth/revoke`. Les clients décrits par un document de métadonnées (`client_id` = URL https) sont acceptés. Sans jeton, `/mcp` répond 401 avec `WWW-Authenticate: Bearer resource_metadata=…`.
- **Jetons** : accès `stm_at_…` 1 h, renouvellement `stm_rt_…` 90 jours remplacé à chaque usage, code 5 min à usage unique, demande 10 min ; tout est stocké haché (`mcp_codes`, `mcp_tokens`). Un **accord** (`mcp_grants`) lie un assistant, une personne et UN club, avec les droits `lecture` (toujours) et `ecriture` (case « Permettre aussi les ajouts », décochée par défaut).
- **À chaque appel** : jeton valide, accord non retiré, personne toujours membre active du club avec un rôle `owner`, `manager` ou `staff` (adhérents, coachs et comptables n'ont pas le connecteur). Les données passent par `records/policy.ts` avec le rôle de la personne : un employé ne voit que ce qu'il voit dans l'appli (ni factures, ni chiffre d'affaires, ni pensions, annuaire réduit des adhérents, pas de coût des chevaux). 60 appels d'outils par minute et par accord.
- **Repli : clé d'API du club** (`Authorization: Bearer pk_live_…`, créée dans Réglages) : droit `read` obligatoire (outils de lecture, vue gérant), `write` pour les ajouts.
- **Outils** (`src/mcp/tools.ts`, noms et réponses en français, chaque réponse porte `donnees_du` et `derniere_saisie`) : lecture `club` (à appeler en premier), `chevaux`, `soins_a_venir`, `pensions`*, `adherents`, `planning`, `reservations`, `facturation_impayes`*, `chiffre_affaires`*, `presences`, `stocks`, `equipe`, `competitions`, `contrats`*, `taches` (* gérant seulement) ; écriture `ajouter_soin`, `reserver_place`, `cocher_tache` (droit `ecriture`, paramètre `confirme: true` exigé, que l'assistant ne pose qu'après le « oui » de la personne ; passent par `applyBatch` : politique d'accès, versions, audit `mcp:<assistant>`, déclencheurs comme l'e-mail de réservation ; bloqués si l'abonnement ne permet plus d'écrire).
- **Pour l'écran Connecteurs** (session) : `GET /api/mcp/tools` (adresse du serveur et outils permis à ce rôle), `GET /api/mcp/grants` (assistants reliés ; un employé ne voit que les siens), `DELETE /api/mcp/grants/:id` (retire l'accès et coupe les jetons), `GET /api/mcp/calls?limit=` (journal des 90 derniers jours, gérant).
- **Déploiement** : `wrangler.jsonc` fait passer `/mcp`, `/oauth/*` et `/.well-known/*` par le Worker avant les fichiers statiques ; `APP_URL` doit valoir `https://app.stablapp.fr` (il donne l'émetteur et l'adresse de la ressource).

## API d'import (pour l'outil de migration)

Authentification : clé d'API du club avec le scope `import` (`Authorization: Bearer pk_live_…`), créée par le gérant dans Réglages, ou session gérant.

- `POST /api/v1/import/jobs` `{source:"kavalog"|"equimondo"|"csv"|…, dry_run?:bool}` → `{job_id}`.
- `POST /api/v1/import/jobs/:id/items` `{coll, items:[{external_id, data}]}` (jusqu'à 500 objets par appel, répétable). `coll` ∈ `members, horses, staff, coaches, forfaits, lessons, halfboard, care, contracts, competitions, invoices, payments, stock`. `data` au format de la démo (voir `demo/core/data.js`). Les références entre objets utilisent les `external_id` de la source préfixés par `ext:` (ex. `owner:"ext:K-1234"`) : le serveur les traduit.
- `POST /api/v1/import/jobs/:id/commit` → applique (ou simule si `dry_run`) : création ou mise à jour idempotente grâce à la table de correspondance `(club, source, coll, external_id) → id Stabl`. Réponse : compte par collection, avertissements (doublons, champs manquants), erreurs par objet.
- `GET /api/v1/import/jobs/:id` → état et rapport. `POST /api/v1/import/jobs/:id/rollback` → supprime ce que ce job a créé.
- `POST /api/v1/import/csv` (multipart) : import de fichiers CSV/Excel exportés d'un autre logiciel, avec détection des colonnes.

## Admin (équipe Stabl)

Back-office de l'équipe Stabl (pas celui d'un club), servi par le Worker sur **`/admin`** : `src/admin/` (API), `app/web/admin/` (page autonome : `index.html`, `admin.css`, `admin.js`), migration `0007_admin.sql`, tests `test/admin.test.ts`.

- **Accès** : compte Stabl ordinaire connecté par session, e-mail vérifié et présent dans le secret **`ADMIN_EMAILS`** (adresses séparées par des virgules : `wrangler secret put ADMIN_EMAILS`). Tout le reste (visiteur, gérant, clé d'API) reçoit un 404. Chaque action est écrite dans `audit_log` (`admin.*`) et visible dans l'onglet Journal ; toute action qui change quelque chose passe par une fenêtre de confirmation et exige `{confirm: true}` côté serveur.
- **Écrans** : tableau de bord (clubs, essais, payants, revenu mensuel et annuel, essais qui finissent, impayés, migrations, robots en échec, quota d'e-mails, santé du service), clubs (recherche, filtres, fiche, actions : prolonger l'essai, offre fondateurs, vue « en tant que », lien de réinitialisation, suspendre ou réactiver), migrations (jobs, sessions du robot, incidents et captures, recettes par logiciel, « relancer » = recalcul de la simulation), support, prospection (import CSV, statuts, notes ; aucun e-mail ne part d'ici), réglages (prix, codes, variables, intégrations : configuré ou non, jamais de secret).
- **Vue « en tant que »** : session ordinaire du gérant, d'une heure, en **lecture seule** (toute écriture renvoie 403 `admin_view_readonly`), avec un bandeau dans l'appli (`/admin/bandeau.js`, chargé par `app/web/build.js`) et retour à la session admin par `POST /admin/vue/fin`.
- **Suspension** : les accès actifs du club passent à `suspended` (liste gardée dans `admin_club_flags` pour les rétablir), ses clés d'API sont refusées.
- **Garde globale** `adminGuard` (après `loadAuth` dans `index.ts`) : lecture seule de la vue, clés d'API des clubs suspendus, et journal des réponses 5xx dans `admin_errors` (30 jours) pour la santé du service.
- **Support** : `POST /api/contact` (public, JSON ou formulaire, champ piège `site_web`, 5 messages par heure et par IP, CORS pour stablapp.fr) alimente la boîte Support ; connecté, le message est rattaché au compte et au club.
- Après une modification de la page : `node app/web/admin/build.js` régénère `src/admin/page.gen.ts` (la page n'est jamais dans les fichiers statiques publics).
