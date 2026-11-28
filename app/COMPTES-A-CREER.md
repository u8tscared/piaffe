# Ce que Marceau doit créer et configurer

Rien n'a été créé à ton nom. Voici, dans l'ordre, les comptes à ouvrir et les réglages à faire. Chaque secret s'enregistre avec `cd app/api && npx wrangler secret put NOM` (jamais dans le code).

## En bref, dans l'ordre
1. Cloudflare : compte, jeton d'API, puis `bash app/api/scripts/deployer.sh` (section 1). L'appli est en ligne, sans paiement ni e-mail : elle le dit clairement aux utilisateurs.
2. Domaine `app.stablapp.fr` branché sur le Worker (section 1, point 5).
3. E-mails (section 4) : sans eux, les invitations et liens de mot de passe ne partent pas (l'appli affiche alors le lien à copier).
4. Stripe (section 3), puis Google (section 2), puis facture électronique (section 5).
5. Passer à Workers Paid (5 $ par mois) avant d'émettre la première vraie facture (section 1, point 2).

## 1. Cloudflare (hébergement)
1. Créer un compte sur dash.cloudflare.com (gratuit). Mon profil › Jetons d'API › « Créer un jeton » : modèle « Modifier Cloudflare Workers », en ajoutant les droits D1 (modifier) et R2 (modifier). Noter le jeton et l'identifiant du compte (colonne de droite du tableau de bord).
2. **Palier gratuit ou Workers Paid (5 $ par mois)** : tout fonctionne sur le palier gratuit (100 000 requêtes par jour, D1 5 Go, R2 10 Go, Durable Objects SQLite, tâches planifiées) **sauf deux choses qui dépassent les 10 ms de calcul par requête** :
   - la génération du PDF Factur-X d'une facture (mesuré : 40 à 85 ms, plus de 200 ms au premier appel) ; sur le palier gratuit la facture est bien émise et numérotée, mais le PDF risque d'être refusé par Cloudflare (erreur 1102) ;
   - le robot de migration (Browser Rendering : 10 minutes de navigateur par jour en gratuit, soit une ou deux migrations).
   Donc : essais et démonstrations en gratuit, **Workers Paid dès la première vraie facture**. Le hachage des mots de passe est réglé pour tenir dans le gratuit (`PASSWORD_ITERATIONS` = 30000 dans wrangler.jsonc ; le monter à 100000 une fois en Workers Paid, les comptes existants sont mis à niveau à leur connexion suivante).
3. Mise en ligne (crée tout ce qui manque, puis publie ; relançable sans risque) :
   ```
   export CLOUDFLARE_API_TOKEN=…  CLOUDFLARE_ACCOUNT_ID=…  APP_URL=https://app.stablapp.fr
   bash app/api/scripts/deployer.sh --essai   # vérifie tout sans rien publier
   bash app/api/scripts/deployer.sh
   ```
   Le script crée la base D1 et le stockage R2 en juridiction UE (données hébergées dans l'Union européenne), écrit l'identifiant de la base dans `app/api/wrangler.jsonc` (à commiter), crée le secret `SESSION_SECRET` (signature des liens de désinscription, d'activation et de calendrier ; ne jamais le changer ensuite), applique les migrations, construit l'appli web et publie. Sans `SESSION_SECRET`, l'API répond « Le service est en cours de configuration » au lieu de tourner avec un secret faible.
4. Vérifier `https://…/api/health`, puis créer son compte.
5. Acheter le domaine (ex. stablapp.fr) chez Cloudflare Registrar (prix coûtant, environ 10 € par an), puis Workers › piaffe › Paramètres › Domaines : ajouter `app.stablapp.fr`. Mettre `APP_URL` à `https://app.stablapp.fr` dans wrangler.jsonc (ou le passer au script comme ci-dessus).

## 2. Google (connexion « Continuer avec Google »)
1. console.cloud.google.com : créer un projet.
2. « API et services » > « Écran de consentement OAuth », mode Externe : nom, logo, e-mail d'assistance, domaine autorisé, liens vers la politique de confidentialité et les CGU, scopes `openid`, `email`, `profile` uniquement. Puis passer l'application « en production » (ces scopes ne demandent pas de validation lourde).
3. « Identifiants » > « ID client OAuth », type « Application Web » : origine `https://app.stablapp.fr`, URI de redirection `https://app.stablapp.fr/auth/google/callback` (et `http://localhost:8787/auth/google/callback` pour les essais).
4. Secrets : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 3. Stripe (abonnements des clubs et paiements des adhérents)
1. Créer le compte sur dashboard.stripe.com au nom de l'entreprise individuelle (entrepreneur individuel, SIREN 934 733 122, IBAN professionnel, nom affiché « Stabl »).
2. Paramètres > Moyens de paiement : activer Carte et Prélèvement SEPA.
3. Facturation > Portail client : activer (changer d'offre, moyen de paiement, résiliation en fin de période, factures).
4. Activer **Connect** : plateforme SaaS, comptes avec tableau de bord Stripe complet, frais payés par le compte connecté. Remplir le profil de plateforme et l'image de marque (Paramètres > Connect).
5. Développeurs > Clés d'API : de préférence une clé restreinte (Customers, Checkout, Prices, Products, Coupons, Promotion codes, Subscriptions, Billing portal, Accounts, Account links, Payment intents, Setup intents, Payment methods, Refunds, Tax rates). Secret : `STRIPE_SECRET_KEY`.
6. Workbench > Webhooks, version d'API `2026-11-18.endive`, deux destinations :
   - « Votre compte » → `https://app.stablapp.fr/webhooks/stripe` : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.paid`, `invoice.payment_failed`. Secret : `STRIPE_WEBHOOK_SECRET`.
   - « Comptes connectés » → `https://app.stablapp.fr/webhooks/stripe-connect` : `account.updated`, `checkout.session.completed`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.processing`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `setup_intent.succeeded`, `mandate.updated`. Secret : `STRIPE_CONNECT_WEBHOOK_SECRET`.
7. Créer le catalogue (d'abord avec la clé de test) : `cd app/api && STRIPE_SECRET_KEY=sk_test_… node scripts/setup-stripe.mjs`.
8. Codes promo : Produits > Coupons > Codes promo, sur `piaffe_lancement` ou `piaffe_parrainage`.
9. **Ne pas activer Stripe Tax** tant que la franchise de TVA s'applique. Le jour où elle cesse : `PLATFORM_VAT_REGIME=normal` dans wrangler.jsonc et relancer le script.
10. Facultatif : secret `BILLING_ADMIN_SECRET` (24 caractères ou plus) pour accorder l'offre fondateurs à un club.

À valider : prix (Essentiel 59 €, Club 149 €, Domaine 289 € par mois, annuel au prix de 10 mois, offre fondateurs 99 € à vie pour 30 clubs), parrainage 50 €, délai de grâce 7 jours, commission Stabl sur les paiements des clubs à 0 %, pré-notification SEPA de 3 jours (à prévoir dans le mandat, sinon 14 jours).

## 4. E-mails (Resend)
État au 28/11/2026 : compte Resend de Marceau (connexion Google, marceau.ruis@gmail.com), domaine `mail.stablapp.fr` ajouté en région Irlande (eu-west-1), webhook créé.
1. Offre gratuite (3 000 par mois, 100 par jour) pour les essais ; passer au Pro (20 $ par mois) dès le premier club migré, car une campagne d'accueil dépasse vite 100 e-mails par jour.
2. DNS : le DNS de stablapp.fr est **chez Ionos** (pas Cloudflare). Enregistrements à ajouter (Ionos › Domaines › stablapp.fr › DNS) :
   - TXT `resend._domainkey.mail` : la clé DKIM `p=MIGf…` affichée dans Resend › Domains › mail.stablapp.fr ;
   - MX `send.mail` → `feedback-smtp.eu-west-1.amazonses.com`, priorité 10 ;
   - TXT `send.mail` → `v=spf1 include:amazonses.com ~all`.
   Ne pas toucher aux MX, SPF, DKIM et DMARC d'Ionos posés sur `stablapp.fr` lui-même (boîtes @stablapp.fr). Le DMARC de stablapp.fr couvre aussi le sous-domaine.
3. Webhook (fait) : `https://app.stablapp.fr/webhooks/mail`, événements email.bounced, email.complained, email.delivered, email.delivery_delayed. Son secret `whsec_…` se lit à tout moment dans Resend › Webhooks (« Signing secret »).
4. Réglages : `MAIL_FROM="Stabl <bonjour@mail.stablapp.fr>"` dans wrangler.jsonc (les réponses vont à bonjour@stablapp.fr par le reply-to). `MAIL_PROVIDER` reste `log` en local ; `deployer.sh` publie avec `resend`.
5. Secrets, au moment du déploiement : créer la clé dans Resend › API keys (droit « Sending access », domaine mail.stablapp.fr ; elle ne s'affiche qu'une fois), puis `export MAIL_API_KEY=re_… MAIL_WEBHOOK_SECRET=whsec_…` avant `bash app/api/scripts/deployer.sh`, qui les enregistre sans les afficher.
6. Logo des e-mails : `BRAND.logoUrl` dans `app/api/src/mail/brand.ts` (PNG de 56 px de haut).

## 5. Facture électronique (plateforme agréée SUPER PDP conseillée)
Coût : compte gratuit jusqu'à 1 000 factures par mois ; par l'API 0,01 € HT par facture (une journée d'e-reporting compte pour une facture), vérification d'identité 2 €, minimum 10 € HT par an. Un centre équestre reste dans le gratuit.
1. Ouvrir un compte éditeur chez SUPER PDP (superpdp.tech) et créer l'application OAuth « Stabl », URL de retour `https://app.stablapp.fr/api/einvoicing/callback`.
2. Secret `EINVOICE_API_KEY` = `client_id:client_secret`, et `EINVOICE_PROVIDER=superpdp` dans wrangler.jsonc.
3. Sur leur bac à sable, vérifier les routes de l'adaptateur, surtout l'e-reporting (`SUPERPDP_EREPORTING_PATH` dans `app/api/src/invoicing/pa/superpdp.ts`).
4. Inscrire ton entreprise individuelle sur une plateforme agréée pour **recevoir** tes factures fournisseurs (obligatoire depuis le 1er septembre 2026 ; le compte gratuit SUPER PDP suffit). L'émission électronique de tes factures d'abonnement sera obligatoire en septembre 2027.
5. Faire passer une facture PDF dans un validateur Factur-X (veraPDF ou le service en ligne de la FNFE) et faire relire le plan de comptes par un expert-comptable.
6. Décision : la facture légale de l'abonnement est la facture Factur-X émise par Stabl (série PIA-) ; celle de Stripe sert de reçu. Sinon il y aurait deux numérotations.

## 6. Robot de migration (rien à installer chez le client)
Il tourne sur Cloudflare Browser Rendering. Palier gratuit : 10 minutes de navigateur par jour (une ou deux migrations). Workers Paid : 10 h de navigateur par mois, puis 0,09 $ par heure, soit environ 20 à 40 migrations par mois sans frais en plus. Rien d'autre à activer : le binding suffit et `wrangler deploy` crée le Durable Object. Réglages (sessions par club et par heure, délai d'inactivité) dans `app/api/src/robot/reglages.ts`.
