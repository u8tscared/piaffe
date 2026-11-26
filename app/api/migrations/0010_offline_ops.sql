-- Mode hors connexion : chaque modification envoyée par un appareil porte un identifiant unique (op_id).
-- Une opération rejouée (réponse perdue, double envoi au retour du réseau) est reconnue et n'est jamais appliquée deux fois.
-- Purge après 60 jours (cron quotidien).
CREATE TABLE IF NOT EXISTS record_ops (
  club_id TEXT NOT NULL,
  op_id TEXT NOT NULL,
  coll TEXT NOT NULL,
  id TEXT NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (club_id, op_id)
);
CREATE INDEX IF NOT EXISTS idx_record_ops_at ON record_ops(at);
