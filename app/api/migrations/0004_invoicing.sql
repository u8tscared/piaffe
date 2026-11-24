-- Piaffe · lot C : factures, avoirs, acomptes, paiements, facture électronique, comptabilité.
-- Montants en centimes (INTEGER). Taux de TVA en points de base (550 = 5,5 %).
-- Une facture émise est gelée : les déclencheurs ci-dessous refusent toute modification de son contenu
-- (correction uniquement par avoir). Seuls les champs de suivi (statut, paiements, envoi, e-facture) bougent.

-- ---------- Factures (et avoirs, acomptes) ----------
-- issuer = 'club' : facture d'un club à ses clients (club_id = le club vendeur).
-- issuer = 'platform' : facture de Piaffe (Marceau Ruis EI) à un club ; club_id = 'platform', buyer_club_id = le club.
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,                    -- inv_xxx
  club_id TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT 'club',    -- club | platform
  kind TEXT NOT NULL DEFAULT 'invoice',   -- invoice (380) | deposit (386, acompte) | credit_note (381, avoir)
  series TEXT,                            -- ex. F-2026, AV-2026 (posée à l'émission)
  seq INTEGER,                            -- rang dans la série
  number TEXT,                            -- ex. F-2026-00001 (NULL tant que brouillon)
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | issued | sent | partially_paid | paid | overdue | cancelled
  customer_ref TEXT,                      -- fiche adhérent payeuse (records members) ou NULL
  customer_type TEXT NOT NULL DEFAULT 'individual', -- individual | business | association | public
  customer_name TEXT,
  customer_email TEXT,
  customer_siren TEXT,
  customer_vat TEXT,
  customer_address TEXT,                  -- JSON {line1,line2,zip,city,country}
  delivery_address TEXT,                  -- JSON, si différente
  buyer_reference TEXT,                   -- référence acheteur (BT-10), bon de commande, service public
  label TEXT,                             -- libellé court affiché dans les listes
  issue_date TEXT,                        -- AAAA-MM-JJ (posée à l'émission)
  service_date TEXT,                      -- date de la prestation ou de la livraison si différente
  period_start TEXT, period_end TEXT,     -- période facturée (pension, forfait)
  due_date TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  price_mode TEXT NOT NULL DEFAULT 'ttc', -- ttc | ht : sens de saisie des prix unitaires
  total_ht INTEGER NOT NULL DEFAULT 0,
  total_vat INTEGER NOT NULL DEFAULT 0,
  total_ttc INTEGER NOT NULL DEFAULT 0,
  prepaid_amount INTEGER NOT NULL DEFAULT 0,   -- acomptes déduits (facture finale)
  credited_amount INTEGER NOT NULL DEFAULT 0,  -- avoirs imputés
  paid_amount INTEGER NOT NULL DEFAULT 0,      -- encaissements (net des remboursements)
  payment_method TEXT,                    -- moyen prévu : card | sepa | transfer | check | cash | ancv | pass_sport | other
  operation_category TEXT,                -- goods | services | mixed
  vat_on_debits INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  original_id TEXT,                       -- avoir : facture d'origine
  deposit_ids TEXT NOT NULL DEFAULT '[]', -- facture finale : acomptes déduits (JSON)
  snapshot TEXT,                          -- JSON figé à l'émission : vendeur, client, lignes, TVA, mentions
  pdf_key TEXT, xml_key TEXT, pdf_sha256 TEXT,
  einvoice_channel TEXT NOT NULL DEFAULT 'none', -- b2b | b2c | none
  einvoice_status TEXT,                   -- pending | submitted | <code cycle de vie> | rejected | error | not_required
  einvoice_ref TEXT,
  einvoice_error TEXT,
  einvoice_attempts INTEGER NOT NULL DEFAULT 0,
  reminders_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TEXT,
  buyer_club_id TEXT,                     -- issuer platform : club facturé
  stripe_invoice_id TEXT,                 -- issuer platform : idempotence
  created_by TEXT, issued_by TEXT,
  issued_at TEXT, sent_at TEXT, paid_at TEXT, cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(club_id, number) WHERE number IS NOT NULL;
CREATE UNIQUE INDEX idx_invoices_series_seq ON invoices(club_id, series, seq) WHERE seq IS NOT NULL;
CREATE UNIQUE INDEX idx_invoices_stripe ON invoices(club_id, stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_invoices_club_status ON invoices(club_id, status, due_date);
CREATE INDEX idx_invoices_club_customer ON invoices(club_id, customer_ref);
CREATE INDEX idx_invoices_club_date ON invoices(club_id, issue_date);
CREATE INDEX idx_invoices_einvoice ON invoices(einvoice_status) WHERE einvoice_status IN ('pending','submitted','error');
CREATE INDEX idx_invoices_buyer_club ON invoices(buyer_club_id) WHERE buyer_club_id IS NOT NULL;

CREATE TABLE invoice_lines (
  id TEXT PRIMARY KEY,                    -- inl_xxx
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other', -- voir catalog.ts (lesson, boarding, facilities…)
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'C62',       -- code d'unité UN/ECE (C62 unité, HUR heure, DAY jour, MON mois)
  unit_price INTEGER NOT NULL,            -- centimes, HT ou TTC selon invoices.price_mode
  vat_rate_bp INTEGER NOT NULL DEFAULT 0, -- 2000 = 20 %
  vat_category TEXT NOT NULL DEFAULT 'S', -- S standard | E exonéré | Z taux zéro
  exemption_reason TEXT,
  line_ht INTEGER NOT NULL DEFAULT 0,
  line_ttc INTEGER NOT NULL DEFAULT 0,
  account TEXT                            -- compte de produit (706100…)
);
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id, position);

-- Compteurs de numérotation : une ligne par club et par série, incrémentée dans la même transaction
-- que l'émission (aucun trou, aucun doublon, même en concurrence).
CREATE TABLE invoice_counters (
  club_id TEXT NOT NULL,
  series TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (club_id, series)
);

CREATE TABLE invoice_payments (
  id TEXT PRIMARY KEY,                    -- ipm_xxx
  club_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount INTEGER NOT NULL,                -- centimes ; négatif = remboursement
  method TEXT NOT NULL,                   -- card | sepa | transfer | check | cash | ancv | pass_sport | other
  paid_at TEXT NOT NULL,                  -- AAAA-MM-JJ
  reference TEXT,                         -- n° de chèque, de remise ANCV, de virement
  stripe_ref TEXT,                        -- idempotence des paiements en ligne
  note TEXT,
  created_by TEXT,
  pa_reported_at TEXT,                    -- statut 212 « Encaissée » transmis à la plateforme (B2B)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_club_date ON invoice_payments(club_id, paid_at);
CREATE UNIQUE INDEX idx_invoice_payments_stripe ON invoice_payments(club_id, stripe_ref) WHERE stripe_ref IS NOT NULL;

CREATE TABLE invoice_reminders (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  to_email TEXT,
  manual INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_invoice_reminders_invoice ON invoice_reminders(invoice_id);

-- Réglages de facturation du club (JSON, voir settings.ts) : délais, pénalités, IBAN, comptes, relances…
CREATE TABLE invoicing_settings (
  club_id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------- Facture électronique ----------
-- Raccordement d'un club à la plateforme agréée (jetons chiffrés AES-GCM).
CREATE TABLE einvoice_accounts (
  club_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | connected | error | disconnected
  external_id TEXT,
  credentials TEXT,                       -- chiffré
  cursor_in TEXT,                         -- dernier identifiant de facture reçue lu
  cursor_events TEXT,                     -- dernier événement de cycle de vie lu
  error TEXT,
  connected_at TEXT, last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Historique du cycle de vie (statuts normés 200 à 213) des factures émises et reçues.
CREATE TABLE einvoice_events (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  invoice_id TEXT,                        -- facture émise
  incoming_id TEXT,                       -- facture reçue
  code TEXT NOT NULL,                     -- ex. 200, 205, 210, 212
  label TEXT,
  reason TEXT,
  provider_event_id TEXT,
  at TEXT NOT NULL
);
CREATE INDEX idx_einvoice_events_invoice ON einvoice_events(invoice_id, at);
CREATE UNIQUE INDEX idx_einvoice_events_provider ON einvoice_events(club_id, provider_event_id) WHERE provider_event_id IS NOT NULL;

-- E-reporting : données de transaction (ventes aux particuliers) et de paiement, agrégées par période.
CREATE TABLE einvoice_reports (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- transactions | payments
  period_start TEXT NOT NULL,             -- AAAA-MM-JJ inclus
  period_end TEXT NOT NULL,               -- AAAA-MM-JJ inclus
  status TEXT NOT NULL DEFAULT 'pending', -- pending | submitted | accepted | rejected | error | empty
  payload TEXT,
  provider_ref TEXT,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (club_id, kind, period_start)
);

-- Factures fournisseurs reçues (plateforme agréée, ou factures Piaffe de l'abonnement).
CREATE TABLE incoming_invoices (
  id TEXT PRIMARY KEY,                    -- inc_xxx
  club_id TEXT NOT NULL,
  source TEXT NOT NULL,                   -- pa | piaffe | upload
  provider TEXT,
  provider_ref TEXT,
  supplier_name TEXT,
  supplier_siren TEXT,
  supplier_vat TEXT,
  number TEXT,
  type_code TEXT NOT NULL DEFAULT '380',
  issue_date TEXT,
  due_date TEXT,
  total_ht INTEGER NOT NULL DEFAULT 0,
  total_vat INTEGER NOT NULL DEFAULT 0,
  total_ttc INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  vat_breakdown TEXT NOT NULL DEFAULT '[]', -- JSON [{rate_bp, base, vat}]
  account TEXT,                           -- compte de charge proposé (606000…)
  status TEXT NOT NULL DEFAULT 'received', -- received | approved | disputed | refused | paid
  xml_key TEXT, pdf_key TEXT,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_incoming_provider ON incoming_invoices(club_id, source, provider_ref) WHERE provider_ref IS NOT NULL;
CREATE INDEX idx_incoming_club_date ON incoming_invoices(club_id, issue_date);

-- ---------- Gel des factures émises (défense en profondeur, en plus des contrôles applicatifs) ----------
CREATE TRIGGER trg_invoices_frozen BEFORE UPDATE ON invoices
WHEN OLD.number IS NOT NULL AND (
  NEW.number IS NOT OLD.number OR NEW.seq IS NOT OLD.seq OR NEW.series IS NOT OLD.series OR NEW.kind IS NOT OLD.kind
  OR NEW.club_id IS NOT OLD.club_id OR NEW.issue_date IS NOT OLD.issue_date OR NEW.due_date IS NOT OLD.due_date
  OR NEW.customer_ref IS NOT OLD.customer_ref OR NEW.customer_name IS NOT OLD.customer_name
  OR NEW.customer_siren IS NOT OLD.customer_siren OR NEW.customer_address IS NOT OLD.customer_address
  OR NEW.total_ht IS NOT OLD.total_ht OR NEW.total_vat IS NOT OLD.total_vat OR NEW.total_ttc IS NOT OLD.total_ttc
  OR NEW.prepaid_amount IS NOT OLD.prepaid_amount OR NEW.snapshot IS NOT OLD.snapshot OR NEW.original_id IS NOT OLD.original_id
  OR NEW.status = 'draft'
)
BEGIN
  SELECT RAISE(ABORT, 'invoice_frozen');
END;

CREATE TRIGGER trg_invoices_no_delete BEFORE DELETE ON invoices
WHEN OLD.number IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'invoice_frozen');
END;

CREATE TRIGGER trg_lines_frozen_ins BEFORE INSERT ON invoice_lines
WHEN (SELECT number FROM invoices WHERE id = NEW.invoice_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'invoice_frozen');
END;
CREATE TRIGGER trg_lines_frozen_upd BEFORE UPDATE ON invoice_lines
WHEN (SELECT number FROM invoices WHERE id = OLD.invoice_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'invoice_frozen');
END;
CREATE TRIGGER trg_lines_frozen_del BEFORE DELETE ON invoice_lines
WHEN (SELECT number FROM invoices WHERE id = OLD.invoice_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'invoice_frozen');
END;
