-- Piaffe · schéma initial (D1 / SQLite)
-- Règles : identifiants texte (préfixe + aléatoire), dates en ISO 8601 UTC (TEXT),
-- montants en centimes (INTEGER), JSON en TEXT. Chaque table métier porte club_id.
-- Les autres lots ajoutent leurs tables dans leurs propres migrations (0002_auth, 0003_billing,
-- 0004_invoicing, 0005_mail_ics_import, 0006_onboarding) sans modifier celle-ci.

-- ---------- Clubs (locataires) ----------
CREATE TABLE clubs (
  id TEXT PRIMARY KEY,                  -- clb_xxx
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'centre',  -- centre | ecurie_pension | ecurie_proprietaires | poney_club | coach_independant | association
  legal_form TEXT,                      -- association | ei | eurl | sarl | sas | earl | gaec | autre
  siren TEXT, siret TEXT, vat_number TEXT,
  vat_regime TEXT NOT NULL DEFAULT 'normal', -- normal | franchise (293 B) | association_exoneree
  address TEXT,                         -- JSON {line1,line2,zip,city,country}
  email TEXT, phone TEXT, ffe_number TEXT,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  logo_key TEXT,                        -- clé R2
  plan TEXT NOT NULL DEFAULT 'trial',   -- trial | essentiel | club | domaine
  plan_status TEXT NOT NULL DEFAULT 'trialing', -- trialing | active | past_due | canceled | unpaid
  trial_ends_at TEXT,
  settings TEXT NOT NULL DEFAULT '{}',  -- JSON libre (préférences, modules actifs…)
  onboarding TEXT NOT NULL DEFAULT '{}',-- JSON réponses de l'onboarding + avancement
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------- Utilisateurs (un compte, plusieurs clubs possibles) ----------
CREATE TABLE users (
  id TEXT PRIMARY KEY,                  -- usr_xxx
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified_at TEXT,
  password_hash TEXT,                   -- pbkdf2$sha256$iter$salt$hash (NULL si Google seul)
  google_sub TEXT UNIQUE,
  first TEXT, last TEXT, phone TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'fr',
  last_club_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Rôles : owner (gérant titulaire, facturation Piaffe), manager (gérant), staff (employé),
-- coach, member (adhérent, parent, propriétaire), accountant (comptable, lecture + exports).
CREATE TABLE memberships (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  person_ref TEXT,                      -- id de la fiche dans records (m001, s05, c01…)
  status TEXT NOT NULL DEFAULT 'active',-- active | suspended
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, club_id)
);
CREATE INDEX idx_memberships_club ON memberships(club_id);

-- ---------- Magasin générique des données du club ----------
-- Une ligne par objet du modèle de la démo (window.DATA) : coll = members, horses, staff, coaches,
-- lessons, forfaits, halfboard, care, journal, tasks, stock, equipment, contracts, competitions,
-- entries, vans, threads, trackBookings, declarations… data = l'objet JSON tel que l'utilise l'interface.
CREATE TABLE records (
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  coll TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (club_id, coll, id)
);
CREATE INDEX idx_records_updated ON records(club_id, updated_at);

-- ---------- Journal d'audit ----------
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  club_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,                 -- ex. member.create, invoice.issue, auth.login
  target TEXT,
  data TEXT,
  ip TEXT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_audit_club ON audit_log(club_id, at);

-- ---------- Limitation de débit simple ----------
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

-- ---------- Sessions (cookie piaffe_s ou en-tête Authorization: Bearer) ----------
-- id = SHA-256 hex du jeton remis au navigateur : une fuite de la base ne donne pas de session.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id TEXT,                         -- club courant
  expires_at TEXT NOT NULL,
  user_agent TEXT, ip TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ---------- Clés d'API des clubs (import, intégrations, MCP) ----------
-- Jeton : pk_live_<préfixe>_<secret> ; on stocke le SHA-256 du jeton complet.
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  scopes TEXT NOT NULL DEFAULT '["import"]',
  created_by TEXT,
  last_used_at TEXT, revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
