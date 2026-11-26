# Règles de facturation appliquées par Stabl (lot C)

État vérifié le 24 novembre 2026. Les sources sont citées à la fin de chaque section.

## 1. Calendrier de la réforme

| Date | Qui | Obligation |
|---|---|---|
| 1er septembre 2026 | toutes les entreprises assujetties | **recevoir** les factures électroniques (via une plateforme agréée, PA) |
| 1er septembre 2026 | grandes entreprises et ETI | **émettre** en facture électronique + e-reporting |
| 1er septembre 2027 | PME et micro-entreprises (presque tous les centres équestres) | **émettre** + e-reporting |

Conséquence pour Stabl : aujourd'hui, un club doit déjà pouvoir **recevoir** ses factures fournisseurs (foin, maréchal, vétérinaire) par une PA. L'émission électronique devient obligatoire pour lui en septembre 2027, mais nous la préparons dès maintenant (même PDF Factur-X, envoi par la PA dès que le club est raccordé).

Les associations loi 1901 **non assujetties** à la TVA (régime `association_exoneree`) ne sont pas concernées pour leurs opérations exonérées : canal `none`, pas d'e-reporting.

Sources : [impots.gouv.fr, calendrier](https://impots.gouv.fr/professionnel/questions/partir-de-quand-suis-je-concerne-par-la-reforme-de-la-facturation), [economie.gouv.fr](https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-%C3%A9lectronique-pour-les-entreprises).

## 2. Facture électronique (B2B) ou e-reporting (B2C)

- Client **professionnel français identifié par son SIREN** (`customer_type` business, public ou association avec SIREN) : facture électronique transmise par la PA (`einvoice_channel = b2b`).
- Client **particulier** ou étranger : pas de facture électronique, mais **e-reporting** des données de transaction (agrégées par jour, par catégorie et par taux) et des données de paiement pour les prestations de services (`b2c`). C'est le cas de la très grande majorité des factures d'un centre équestre.

### Périodicité de l'e-reporting (réglage `vat_periodicity`)

| Régime de TVA du club | Transactions | Paiements |
|---|---|---|
| Réel normal mensuel | par décade (`decade`), dépôt le 20, le 30 et le 10 | mensuel, avant le 10 du mois suivant |
| Réel normal trimestriel | mensuel (`monthly`) | mensuel |
| Réel simplifié (cas le plus fréquent) | mensuel (`monthly`, valeur par défaut), entre le 25 et le 30 du mois suivant | mensuel |
| Franchise en base | bimestriel (`bimonthly`, forcé) | bimestriel |

Stabl déclare chaque période **dès le lendemain de sa fin** (cron quotidien), rattrape les trois dernières périodes en cas d'incident et ne déclare jamais deux fois la même (contrainte d'unicité). Catégories : `TLB1` livraisons de biens, `TPS1` prestations de services, `TNT1` opérations non taxées (débours, franchise, exonérations). Les acomptes sont déclarés à leur émission, la facture finale ne déclare que le solde.

Pour les factures B2B de **prestations de services** sans option sur les débits, l'encaissement est transmis à la PA sous forme du statut **212 « Encaissée »**, ventilé par taux.

Sources : [données de facture](https://www.impots.gouv.fr/facturation-electronique-donnees-de-facture), [données de transaction](https://www.impots.gouv.fr/e-reporting-donnees-de-transaction), [fréquences et délais](https://www.impots.gouv.fr/e-reporting-tableau-des-frequences-et-delais-de-transmission), [FNFE-MPE, fiche e-reporting](https://fnfe-mpe.org/wp-content/uploads/2026/04/Fiche-Flash-Fonctionnement-e-reportingnew.pdf).

## 3. Mentions obligatoires (toutes présentes dans le PDF et le XML)

Depuis le 1er septembre 2026 : SIREN et pays du vendeur et du client, **catégorie de l'opération** (livraison de biens, prestations de services ou mixte), date d'émission, numéro unique chronologique et continu, HT et TVA par taux, devise ; selon le cas : numéros de TVA, numéro de la facture rectifiée (avoir), **option pour le paiement de la TVA d'après les débits**, motif d'exonération (franchise comprise), date de la prestation si différente, date de l'acompte.
À partir du 1er septembre 2027 : désignation, quantité et prix unitaire HT par ligne (déjà fait), adresse de livraison si différente (champ `delivery_address`), date de la facture initiale pour un avoir (déjà fait).

Pour un **client professionnel**, Stabl ajoute : pénalités de retard (taux réglable, par défaut « trois fois le taux d'intérêt légal »), **indemnité forfaitaire de 40 €** (art. L441-10 et D441-5 du code de commerce), « Pas d'escompte pour paiement anticipé », et dans le XML les notes normées `PMD`, `PMT`, `AAB`. Délai de paiement B2B plafonné à 60 jours.

Mentions selon `clubs.vat_regime` :
- `normal` : TVA par taux, numéro de TVA intracommunautaire (calculé depuis le SIREN s'il n'est pas saisi).
- `franchise` : « TVA non applicable, art. 293 B du CGI » ; XML catégorie `E`, code `VATEX-FR-FRANCHISE`, identifiant fiscal `FC` = SIREN.
- `association_exoneree` : « Exonération de TVA, art. 261, 7-1° du CGI (organisme sans but lucratif) ».

Source : [impots.gouv.fr, données de facture](https://www.impots.gouv.fr/facturation-electronique-donnees-de-facture), [service-public.fr, mentions obligatoires](https://entreprendre.service-public.gouv.fr/vosdroits/F31808).

## 4. TVA des centres équestres (catégories de ligne, `catalog.ts`)

Taux de **5,5 %** depuis le 1er janvier 2024 (art. 278-0 bis du CGI, BOI-TVA-SECT-80-10-30-50) : enseignement et pratique de l'équitation (`lesson`), accès aux installations (`facilities`), mise à disposition d'équidés, promenades et randonnées (`horse_lease`, `course`), droits d'engagement (`competition`), **pension en établissement équestre accessoire à la pratique** (`boarding`), ventes d'équidés pour la reproduction.
Taux de **20 %** : pension sans lien avec la pratique, notamment valorisation commerciale ou chevaux de course (`boarding_std`), transport, sellerie et boutique, ventes d'équidés hors reproduction, refacturations. 10 % pour la buvette (`food`).
Hors TVA : **débours** (licence FFE reversée, `disbursement`, compte 467100) et **cotisations** sans contrepartie (`membership`).
Chaque ligne peut forcer son taux (`vat_rate_bp` ou `vat_rate`), limité à 0, 2,1, 5,5, 10 et 20 %. Les écuries qui ventilent la pension (part hébergement à 20 %, part installations à 5,5 %) font deux lignes.

Source : [BOFiP BOI-TVA-SECT-80-10-30-50](https://bofip.impots.gouv.fr/bofip/9265-PGP.html/identifiant=BOI-TVA-SECT-80-10-30-50-20260325).

## 5. Calculs et arrondis

Montants en centimes entiers. TVA calculée **par taux sur la base cumulée** (règle EN 16931 BR-CO-17), jamais ligne à ligne.
- Prix saisis HT : TVA = arrondi(base × taux), demi vers le haut.
- Prix saisis TTC (défaut, adapté aux particuliers) : le TTC est conservé au centime ; base = arrondi(TTC ÷ (1 + taux)) ; TVA = TTC − base. L'écart avec base × taux est au plus d'un centime, toléré par BR-CO-17. La base est répartie sur les lignes (plus fort reste) pour que la somme des lignes égale la base du taux.

## 6. Numérotation, gel, avoirs, acomptes

- Séries par club et par année : `F-2026-00001` (factures et acomptes), `AV-2026-00001` (avoirs), préfixes réglables. Le compteur est incrémenté **dans la même transaction D1** que le gel de la facture, sous condition que le brouillon soit inchangé : aucun trou, aucun doublon, même en concurrence (testé avec 20 émissions simultanées).
- Facture émise **gelée** : contrôlé par l'application et par des déclencheurs SQL (`invoice_frozen`). Correction uniquement par avoir (total, partiel en montant ou par lignes).
- Acompte (`kind = deposit`, code 386) puis facture finale avec `deposit_ids` : l'acompte apparaît en `TotalPrepaidAmount`, cadre de facturation `S4`/`B4`/`M4`.
- Statuts : brouillon, émise, envoyée, partiellement payée, payée, en retard, annulée (par avoir). Paiements multiples : carte, SEPA, virement, chèque, espèces, chèques-vacances ANCV, Pass'Sport, autre.

## 7. Format Factur-X

- XML **CII D16B au profil EN 16931** (`urn:cen.eu:en16931:2017`). Pourquoi pas BASIC : EN 16931 est la norme complète demandée par la réforme et admet les notes normées, l'adresse de livraison et la référence de facture d'origine ; nous n'utilisons que des champs présents dans les deux profils. Validé contre le XSD Factur-X officiel (bibliothèque `factur-x` de l'Akretion, profil en16931) pendant le développement.
- Cadre de facturation (BT-23) : `B1`, `S1`, `M1` (biens, services, mixte), `x4` après acompte. Exigibilité (BT-8) : `72` à l'encaissement pour les services, `5` avec l'option sur les débits.
- Adresse électronique des parties : SIREN au schéma `0225` (annuaire de la réforme).
- PDF/A-3b : police Inter embarquée (TrueType, pas de police standard), couleurs sRGB avec OutputIntent et profil ICC embarqué (`icc.ts`), XMP `pdfaid` + extension Factur-X (`fx:ConformanceLevel` = EN 16931), pièce jointe `factur-x.xml` avec `AFRelationship /Alternative` et `/AF` sur le catalogue, identifiants `/ID` déterministes. À faire valider une fois par veraPDF (non exécuté dans notre environnement).

### Polices

`assets/fonts/Inter-*.ttf` : sous-ensemble latin d'Inter 4.1 (SIL OFL, `Inter-LICENSE.txt`), 40 Ko chacune. Wrangler n'importe pas les `.ttf` sans règle `Data` dans `wrangler.jsonc` (socle) : les polices sont donc encodées en base64 dans `src/invoicing/fonts.ts`, accepté par le bundler, Vitest et TypeScript. Pour régénérer : `pyftsubset Inter-Regular.ttf --unicodes="U+0020-007E,U+00A0-017F,U+2009,U+2013-2014,U+2018-201E,U+2022,U+2026,U+202F,U+2030,U+20AC,U+2212" --layout-features='kern,liga,tnum'`, puis réencoder en base64.

## 8. Plateformes agréées : choix

| Plateforme | Prix | API éditeur |
|---|---|---|
| **SUPER PDP** (retenue) | compte gratuit jusqu'à 1 000 factures/mois ; API 0,01 € HT par facture (0,005 € au-delà de 10 000) ; e-reporting : une journée = une facture ; KYC 2 € ; minimum 10 € HT par an | REST + OAuth2, webhooks, bac à sable, « marque grise » pour éditeurs |
| B2Brouter | Basic gratuit (24 transactions par an, exonérés de TVA), Professional 110 € HT par an, API sur devis | REST, bac à sable, marque blanche |
| Seqino | sur devis | REST, SDK, marque blanche |
| Pennylane, Tiime, Indy | gratuits pour leurs propres utilisateurs | pas pensés pour un éditeur tiers |

SUPER PDP est la seule offre au coût quasi nul **et** pensée pour un éditeur : pour un club qui émet 30 factures B2B par mois et fait son e-reporting, on reste dans l'offre gratuite. Adaptateur : `pa/superpdp.ts` (routes `/v1.beta/…` tirées du SDK public `bluerock/superpdp-php-client`). Fournisseur par défaut et en test : `sandbox`.

Sources : [tarifs SUPER PDP](https://www.superpdp.tech/tarifs), [ComparePDP, API](https://comparepdp.com/articles/api-facturation-electronique), [tarifs B2Brouter](https://www.b2brouter.net/fr/tarifs/), [API B2Brouter](https://www.b2brouter.net/fr/api-facturation-electronique/).

## 9. Plan de comptes proposé (`catalog.ts`, surchargeable par `settings.accounts`)

| Compte | Usage |
|---|---|
| 706100 | Enseignement (5,5 %) |
| 706200 / 706210 | Pensions 5,5 % / part au taux normal |
| 706300 | Accès aux installations |
| 706400 | Stages, animations, randonnées |
| 706500 | Compétitions, engagements |
| 706600 | Mise à disposition d'équidés |
| 706700 / 706800 | Transport / autres prestations |
| 707000 / 707100 / 707110 / 707200 | Marchandises / équidés / équidés pour la reproduction / buvette |
| 708000 / 708800 | Refacturations / autres produits |
| 756000 | Cotisations |
| 467100 | Débours (licences FFE) |
| 411000 (+ auxiliaire `C<fiche>`) | Clients |
| 419100 | Acomptes reçus |
| 445711 / 445712 / 445713 / 445714 | TVA collectée 5,5 / 10 / 20 / 2,1 % |
| 445660 | TVA déductible (achats) |
| 401000 / 606000 / 651000 | Fournisseurs / achats / abonnement logiciel |
| 512000 | Banque (virement, SEPA) |
| 511200 / 511300 / 511500 | Chèques / ANCV / paiements Stripe à recevoir |
| 530000 | Caisse |
| 441000 | Pass'Sport à recevoir |

Journaux : `VE` ventes, `BQ` banque, `CA` caisse, `AC` achats. Le client est lettré quand la facture est soldée.

## 10. Exports pour le comptable

- **FEC** (art. A47 A-1 du LPF) : 18 colonnes, tabulation (ou `sep=pipe`), dates AAAAMMJJ, montants à virgule, ISO 8859-15 (ou `encoding=utf8`), nom `SIRENFECAAAAMMJJ.txt` (date de clôture, `end=` si l'exercice n'est pas civil). Chaque écriture est équilibrée (testé).
- **Écritures CSV** (`entries.csv`) : `Journal;Date;Pièce;Compte;Compte auxiliaire;Libellé du compte auxiliaire;Libellé;Débit;Crédit;Échéance;Lettrage`, UTF-8 avec BOM, dates JJ/MM/AAAA, virgule décimale. Import : Pennylane (Comptabilité > Import d'écritures, « Fichier CSV »), Tiime (Import FEC ou CSV), Sage 100 / Génération Expert (import paramétrable, une ligne par mouvement). Le FEC est aussi importable tel quel dans tous ces logiciels.
- **Journal des ventes** (`sales.csv`) : une ligne par facture, bases et TVA par taux. **Encaissements** (`payments.csv`). **Archive ZIP** du mois (factures, avoirs, factures fournisseurs).

## 11. Factures de Stabl aux clubs

Émetteur : variables `PLATFORM_*` (Marceau Ruis EI, SIREN 934 733 122, franchise en base par défaut). Déclencheur : `subscription.paid {club_id, stripe_invoice_id, amount_cents, tax_cents, period_start, period_end, plan}` émis par le lot Stripe. Une facture par paiement (idempotence `stripe_invoice_id`), série `PIA-AAAA-NNNNN`, réglée par carte, rangée aussi dans les achats du club (compte 651000). Si `PLATFORM_VAT_REGIME = normal`, la TVA à 20 % est extraite du TTC payé.
