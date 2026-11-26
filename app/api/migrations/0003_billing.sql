-- Stabl · lot B (Stripe) : abonnement des clubs à Stabl et paiements des adhérents vers leur club (Connect).
-- Montants en centimes. Aucune donnée de carte ou d'IBAN n'est stockée : seulement les identifiants Stripe.

-- Événements Stripe reçus (idempotence des webhooks). status : processing | processed | failed | ignored
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY,                  -- evt_xxx
  source TEXT NOT NULL,                 -- platform | connect
  account TEXT,                         -- acct_xxx pour les événements Connect
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  attempts INTEGER NOT NULL DEFAULT 1,
  error TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  processed_at TEXT
);
CREATE INDEX idx_stripe_events_received ON stripe_events(received_at);

-- Abonnement d'un club à Stabl (client Stripe du compte de la plateforme).
CREATE TABLE billing_subscriptions (
  club_id TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT,                            -- essentiel | club | domaine
  interval TEXT,                        -- month | year
  price_lookup_key TEXT,
  status TEXT,                          -- statut Stripe brut (trialing, active, past_due, unpaid, canceled, incomplete, paused)
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  past_due_since TEXT,                  -- début de l'impayé (blocage de l'écriture après le délai de grâce)
  founder INTEGER NOT NULL DEFAULT 0,   -- offre fondateurs accordée
  referral_code TEXT UNIQUE,            -- code de parrainage de ce club
  referred_by TEXT,                     -- club_id du parrain
  referral_rewarded_at TEXT,            -- crédit versé au parrain
  trial_reminders TEXT NOT NULL DEFAULT '[]', -- JSON : rappels de fin d'essai déjà envoyés (jours)
  last_invoice_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Compte Stripe connecté d'un club (le club encaisse directement, paie ses frais Stripe).
CREATE TABLE connect_accounts (
  club_id TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled INTEGER NOT NULL DEFAULT 0,
  payouts_enabled INTEGER NOT NULL DEFAULT 0,
  details_submitted INTEGER NOT NULL DEFAULT 0,
  card_enabled INTEGER NOT NULL DEFAULT 0,
  sepa_enabled INTEGER NOT NULL DEFAULT 0,
  requirements TEXT NOT NULL DEFAULT '[]', -- JSON : informations encore demandées par Stripe
  disabled_reason TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Client Stripe d'un adhérent (ou d'une famille) sur le compte connecté de son club.
CREATE TABLE connect_customers (
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  person_ref TEXT NOT NULL,             -- fiche adhérent payeuse (records members)
  stripe_customer_id TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (club_id, person_ref)
);

-- Paiements en ligne des adhérents. status : pending | processing | succeeded | failed | canceled | refunded | partially_refunded
CREATE TABLE online_payments (
  id TEXT PRIMARY KEY,                  -- pay_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  person_ref TEXT,
  user_id TEXT,
  kind TEXT NOT NULL DEFAULT 'checkout',-- checkout | link | installment | autopay
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL DEFAULT 0, -- commission Stabl (APPLICATION_FEE_PERCENT)
  refunded_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  method TEXT,                          -- card | sepa_debit | …
  status TEXT NOT NULL DEFAULT 'pending',
  installment_id TEXT,
  stripe_checkout_session TEXT UNIQUE,
  stripe_payment_intent TEXT UNIQUE,
  stripe_charge TEXT,
  failure_reason TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_online_payments_invoice ON online_payments(club_id, invoice_id);
CREATE INDEX idx_online_payments_person ON online_payments(club_id, person_ref);

-- Mandats SEPA (ou cartes enregistrées) pour les échéances. status : pending | active | revoked
CREATE TABLE payment_mandates (
  id TEXT PRIMARY KEY,                  -- mdt_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  person_ref TEXT NOT NULL,
  user_id TEXT,
  stripe_customer_id TEXT NOT NULL,
  stripe_checkout_session TEXT UNIQUE,
  stripe_setup_intent TEXT,
  stripe_payment_method TEXT,
  stripe_mandate TEXT,
  method TEXT NOT NULL DEFAULT 'sepa_debit',
  label TEXT,                           -- ex. « IBAN se terminant par 4321 »
  autopay INTEGER NOT NULL DEFAULT 1,   -- prélever automatiquement les nouvelles factures
  schedule_id TEXT,                     -- mandat créé pour un échéancier précis
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_payment_mandates_person ON payment_mandates(club_id, person_ref, status);

-- Échéanciers : paiement en plusieurs fois d'une facture, ou prélèvement automatique d'une facture
-- à l'échéance. status : pending_mandate | active | completed | canceled | failed
CREATE TABLE payment_schedules (
  id TEXT PRIMARY KEY,                  -- sch_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  person_ref TEXT,
  kind TEXT NOT NULL DEFAULT 'installments', -- installments | autopay
  count INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  mandate_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_mandate',
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_payment_schedules_invoice ON payment_schedules(club_id, invoice_id);

-- status : scheduled | processing | paid | failed | canceled
CREATE TABLE payment_installments (
  id TEXT PRIMARY KEY,                  -- ins_xxx
  schedule_id TEXT NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  due_date TEXT NOT NULL,               -- AAAA-MM-JJ
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  payment_id TEXT,
  notified_at TEXT,                     -- avis de prélèvement envoyé
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_payment_installments_due ON payment_installments(status, due_date);

-- Liens de paiement envoyés par le gérant (jeton haché, page publique qui ouvre un Checkout frais).
CREATE TABLE pay_links (
  id TEXT PRIMARY KEY,                  -- pln_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT,
  created_by TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_opened_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_pay_links_invoice ON pay_links(club_id, invoice_id);
