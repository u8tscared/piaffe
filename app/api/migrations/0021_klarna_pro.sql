-- Paiement en 3 fois par Klarna (le club reçoit tout de suite le montant total)
ALTER TABLE connect_accounts ADD COLUMN klarna_enabled INTEGER NOT NULL DEFAULT 0;
