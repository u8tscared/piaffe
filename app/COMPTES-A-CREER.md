# Ce que Marceau doit créer et configurer

Rien n'a été créé à ton nom. Voici, dans l'ordre, les comptes à ouvrir et les réglages à faire. Chaque secret s'enregistre avec `cd app/api && npx wrangler secret put NOM` (jamais dans le code).

## 1. Cloudflare (hébergement)
1. Créer un compte sur dash.cloudflare.com (gratuit), puis passer à **Workers Paid (5 $ par mois)** dès le premier club : le hachage des mots de passe et la génération des PDF dépassent les 10 ms de calcul du palier gratuit.
2. `npx wrangler login`, puis `npx wrangler d1 create piaffe` et recopier l'id dans `app/api/wrangler.jsonc` (`database_id`).
3. `npx wrangler r2 bucket create piaffe-files`.
4. Acheter le domaine (ex. stablapp.fr) chez Cloudflare Registrar (prix coûtant, environ 10 € par an), puis brancher `app.stablapp.fr` sur le Worker et mettre `APP_URL` à `https://app.stablapp.fr`.
5. `npm run db:migrate:remote`, `node ../web/build.js`, `npm run deploy`.

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

## 4. E-mails (Resend conseillé, Brevo en alternative gratuite)
1. Créer un compte sur resend.com. L'offre gratuite (3 000 par mois, mais 100 par jour) suffit pour les essais ; passer au Pro (20 $ par mois) dès le premier club migré, car une campagne d'accueil dépasse vite 100 e-mails par jour. Brevo : 300 par jour gratuits.
2. Déclarer le sous-domaine d'envoi `mail.stablapp.fr` et ajouter chez Cloudflare DNS les enregistrements fournis : SPF (TXT `v=spf1 include:amazonses.com ~all` et MX `send`), DKIM (TXT `resend._domainkey`), DMARC (`_dmarc` : `v=DMARC1; p=none; rua=mailto:dmarc@stablapp.fr`, à passer en `p=quarantine` après 2 à 4 semaines sans problème).
3. Webhook vers `https://app.stablapp.fr/webhooks/mail` avec les événements bounced, complained, delivered.
4. Réglages : `MAIL_PROVIDER=resend`, `MAIL_FROM="Stabl <bonjour@mail.stablapp.fr>"` dans wrangler.jsonc ; secrets `MAIL_API_KEY` et `MAIL_WEBHOOK_SECRET` (le `whsec_…` de Resend).
5. Logo des e-mails : `BRAND.logoUrl` dans `app/api/src/mail/brand.ts` (PNG de 56 px de haut), à remplir quand le nouveau logo sera choisi.

## 5. Facture électronique (plateforme agréée SUPER PDP conseillée)
Coût : compte gratuit jusqu'à 1 000 factures par mois ; par l'API 0,01 € HT par facture (une journée d'e-reporting compte pour une facture), vérification d'identité 2 €, minimum 10 € HT par an. Un centre équestre reste dans le gratuit.
1. Ouvrir un compte éditeur chez SUPER PDP (superpdp.tech) et créer l'application OAuth « Stabl », URL de retour `https://app.stablapp.fr/api/einvoicing/callback`.
2. Secret `EINVOICE_API_KEY` = `client_id:client_secret`, et `EINVOICE_PROVIDER=superpdp` dans wrangler.jsonc.
3. Sur leur bac à sable, vérifier les routes de l'adaptateur, surtout l'e-reporting (`SUPERPDP_EREPORTING_PATH` dans `app/api/src/invoicing/pa/superpdp.ts`).
4. Inscrire ton entreprise individuelle sur une plateforme agréée pour **recevoir** tes factures fournisseurs (obligatoire depuis le 1er septembre 2026 ; le compte gratuit SUPER PDP suffit). L'émission électronique de tes factures d'abonnement sera obligatoire en septembre 2027.
5. Faire passer une facture PDF dans un validateur Factur-X (veraPDF ou le service en ligne de la FNFE) et faire relire le plan de comptes par un expert-comptable.
6. Décision : la facture légale de l'abonnement est la facture Factur-X émise par Stabl (série PIA-) ; celle de Stripe sert de reçu. Sinon il y aurait deux numérotations.

## 6. Robot de migration (rien à installer chez le client)
Il tourne sur Cloudflare Browser Rendering, inclus dans Workers Paid : 10 h de navigateur par mois, puis 0,09 $ par heure, soit environ 20 à 40 migrations par mois sans frais en plus. Rien d'autre à activer : le binding suffit et `wrangler deploy` crée le Durable Object. Réglages (sessions par club et par heure, délai d'inactivité) dans `app/api/src/robot/reglages.ts`.
