-- Factures des praticiens (vétérinaire, maréchal, dentiste, ostéopathe) · src/pro/factures.ts
-- Le praticien est le vendeur : sa série PRO-AAAA-00001 est unique pour lui, tous clubs confondus.
-- Client : le club (la facture arrive aussi dans ses factures fournisseurs) ou le propriétaire du cheval.

CREATE TABLE pro_profiles (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',        -- nom, métier, SIRET, Ordre, adresse, IBAN, TVA, facturation automatique…
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE pro_invoice_counters (
  user_id TEXT NOT NULL,
  series TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, series)
);

CREATE TABLE pro_invoices (
  id TEXT PRIMARY KEY,                    -- pin_xxx
  user_id TEXT NOT NULL,                  -- le praticien (vendeur)
  club_id TEXT NOT NULL,                  -- l'écurie où les actes ont été faits
  pro_ref TEXT,                           -- sa fiche practitioners dans ce club
  series TEXT NOT NULL,
  seq INTEGER NOT NULL,
  number TEXT NOT NULL,
  bill_to TEXT NOT NULL,                  -- club | owner
  customer_ref TEXT,                      -- fiche members du propriétaire
  customer_name TEXT,
  customer_email TEXT,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  total_ht INTEGER NOT NULL DEFAULT 0,
  total_vat INTEGER NOT NULL DEFAULT 0,
  total_ttc INTEGER NOT NULL DEFAULT 0,
  acts TEXT NOT NULL DEFAULT '[]',        -- ids des proActs facturés
  snapshot TEXT NOT NULL,                 -- contenu figé (même format que les factures des clubs)
  pdf_key TEXT, xml_key TEXT,
  auto INTEGER NOT NULL DEFAULT 0,        -- 1 : faite toute seule par la facturation automatique
  sent_at TEXT, sent_to TEXT,
  incoming_id TEXT,                       -- copie rangée dans les factures fournisseurs du club
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_pro_invoices_number ON pro_invoices(user_id, number);
CREATE UNIQUE INDEX idx_pro_invoices_seq ON pro_invoices(user_id, series, seq);
CREATE INDEX idx_pro_invoices_club ON pro_invoices(club_id, issue_date);

-- Un acte n'est facturé qu'une fois (insertion dans la même transaction que la facture).
CREATE TABLE pro_invoice_acts (
  club_id TEXT NOT NULL,
  act_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  PRIMARY KEY (club_id, act_id)
);

-- Une facture émise est gelée : seuls l'envoi, le paiement et le classement changent.
CREATE TRIGGER trg_pro_invoices_frozen BEFORE UPDATE ON pro_invoices
WHEN NEW.number IS NOT OLD.number OR NEW.seq IS NOT OLD.seq OR NEW.series IS NOT OLD.series OR NEW.user_id IS NOT OLD.user_id
  OR NEW.club_id IS NOT OLD.club_id OR NEW.issue_date IS NOT OLD.issue_date OR NEW.snapshot IS NOT OLD.snapshot
  OR NEW.total_ttc IS NOT OLD.total_ttc OR NEW.total_ht IS NOT OLD.total_ht OR NEW.acts IS NOT OLD.acts OR NEW.bill_to IS NOT OLD.bill_to
BEGIN SELECT RAISE(ABORT, 'invoice_frozen'); END;
CREATE TRIGGER trg_pro_invoices_nodelete BEFORE DELETE ON pro_invoices
BEGIN SELECT RAISE(ABORT, 'invoice_frozen'); END;
