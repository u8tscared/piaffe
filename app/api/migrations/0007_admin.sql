-- Stabl · espace admin (back-office de l'équipe Stabl, src/admin/)
-- Les admins sont listés par le secret ADMIN_EMAILS (jamais dans le code). Chaque action admin est
-- écrite dans audit_log (action « admin.* », user_id = l'admin).

-- Vue « en tant que » : une session Stabl ordinaire du gérant, en lecture seule, courte et journalisée.
CREATE TABLE admin_impersonations (
  id TEXT PRIMARY KEY,                    -- imv_xxx
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  club_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,        -- sessions.id (SHA-256 du jeton) de la session de vue
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  ended_at TEXT
);
CREATE INDEX idx_admin_imp_club ON admin_impersonations(club_id, started_at);

-- Suspension d'un club : les accès actifs passent à « suspended » ; on garde la liste pour les rétablir.
CREATE TABLE admin_club_flags (
  club_id TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  suspended_at TEXT,
  suspended_by TEXT,
  reason TEXT,
  suspended_users TEXT NOT NULL DEFAULT '[]', -- JSON : user_id des accès suspendus par l'admin
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Support : messages du formulaire de contact (site et appli).
CREATE TABLE support_messages (
  id TEXT PRIMARY KEY,                    -- sup_xxx
  source TEXT NOT NULL DEFAULT 'site',    -- site | app
  club_id TEXT,
  user_id TEXT,
  name TEXT,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nouveau', -- nouveau | en_cours | traite
  note TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_support_status ON support_messages(status, created_at);

-- Prospection : centres équestres à démarcher (aucun envoi automatique).
CREATE TABLE prospects (
  id TEXT PRIMARY KEY,                    -- prs_xxx
  name TEXT NOT NULL,
  city TEXT,
  email TEXT COLLATE NOCASE,
  phone TEXT,
  source TEXT,                            -- origine de l'adresse (annuaire FFE, salon, site du centre…)
  status TEXT NOT NULL DEFAULT 'a_contacter', -- a_contacter | contacte | demo | client | perdu
  notes TEXT,
  club_id TEXT,                           -- club Stabl une fois client
  last_contact_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX idx_prospects_email ON prospects(email) WHERE email IS NOT NULL;
CREATE INDEX idx_prospects_status ON prospects(status, updated_at);

-- Santé du service : erreurs 5xx renvoyées par le Worker (30 derniers jours).
CREATE TABLE admin_errors (
  id TEXT PRIMARY KEY,                    -- err_xxx
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  method TEXT, path TEXT, status INTEGER,
  message TEXT,
  club_id TEXT, user_id TEXT
);
CREATE INDEX idx_admin_errors_at ON admin_errors(at);

CREATE INDEX idx_audit_action ON audit_log(action, at);
