-- Stabl · lot D : e-mails transactionnels, calendriers ICS, API d'import.

-- ---------- E-mails : file d'attente ----------
-- Chaque e-mail passe par cette table : envoi immédiat tenté, puis reprise par le cron avec délai croissant.
-- Le corps (html, text) des e-mails sensibles (liens de connexion, réinitialisation) est effacé dès l'envoi ;
-- celui des autres est effacé au bout de 7 jours. Les pièces jointes sont dans R2 (mail/<id>/<n>).
CREATE TABLE email_outbox (
  id TEXT PRIMARY KEY,                    -- eml_xxx
  club_id TEXT,
  to_email TEXT NOT NULL COLLATE NOCASE,
  template TEXT NOT NULL,
  category TEXT NOT NULL,                 -- essential | bookings | reminders | waitlist
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  reply_to TEXT,
  html TEXT, text TEXT,
  headers TEXT NOT NULL DEFAULT '{}',     -- JSON
  attachments TEXT NOT NULL DEFAULT '[]', -- JSON [{filename,type,key,size}]
  sensitive INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | sending | sent | failed | suppressed | skipped
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  lease_until TEXT,
  last_error TEXT,
  provider TEXT, provider_id TEXT,
  dedupe_key TEXT UNIQUE,
  delivery TEXT,                          -- delivered | bounced | complained | delayed (webhook)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  sent_at TEXT
);
CREATE INDEX idx_outbox_due ON email_outbox(status, next_attempt_at);
CREATE INDEX idx_outbox_club ON email_outbox(club_id, created_at);
CREATE INDEX idx_outbox_provider ON email_outbox(provider_id);

-- Adresses à ne plus écrire : rebond définitif (tout est bloqué) ou plainte (seuls les e-mails non essentiels sont bloqués).
CREATE TABLE email_suppressions (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  reason TEXT NOT NULL,                   -- hard_bounce | complaint | manual
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Préférences de notification par adresse (club_id '' = tous les clubs). Absence de ligne = activé.
CREATE TABLE notification_prefs (
  email TEXT NOT NULL COLLATE NOCASE,
  club_id TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,                 -- bookings | reminders | waitlist
  enabled INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (email, club_id, category)
);

-- Événements reçus des fournisseurs (idempotence des webhooks).
CREATE TABLE email_events (
  id TEXT PRIMARY KEY,                    -- identifiant d'événement du fournisseur (ou empreinte)
  outbox_id TEXT,
  type TEXT NOT NULL,
  email TEXT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------- Calendriers ICS ----------
-- Le jeton d'URL est dérivé (HMAC du secret du serveur et de l'id) : la base ne stocke que son SHA-256.
CREATE TABLE calendar_feeds (
  id TEXT PRIMARY KEY,                    -- cal_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,                    -- member | coach | club | horse
  target TEXT,                            -- person_ref ou id du cheval
  name TEXT NOT NULL,
  alarm_minutes INTEGER,
  token_hash TEXT NOT NULL UNIQUE,
  last_used_at TEXT, revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_calendar_user ON calendar_feeds(user_id, club_id);

-- ---------- Import ----------
CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY,                    -- imp_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',    -- open | simulated | committed | failed | rolled_back
  created_by TEXT,                        -- usr_… ou clé d'API
  item_count INTEGER NOT NULL DEFAULT 0,
  report TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  committed_at TEXT, rolled_back_at TEXT
);
CREATE INDEX idx_import_jobs_club ON import_jobs(club_id, created_at);

CREATE TABLE import_items (
  job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  coll TEXT NOT NULL,
  external_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (job_id, coll, external_id)
);

-- Correspondance idempotente : (club, source, collection, id externe) → id Stabl.
CREATE TABLE import_map (
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  coll TEXT NOT NULL,
  external_id TEXT NOT NULL,
  piaffe_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (club_id, source, coll, external_id)
);
CREATE INDEX idx_import_map_job ON import_map(job_id);

-- Ce que chaque job a écrit, pour l'annulation (created : supprimé ; updated : état précédent restauré).
CREATE TABLE import_changes (
  job_id TEXT NOT NULL,
  club_id TEXT NOT NULL,
  coll TEXT NOT NULL,
  piaffe_id TEXT NOT NULL,
  action TEXT NOT NULL,                   -- created | updated
  previous TEXT,
  version_after INTEGER,
  PRIMARY KEY (job_id, coll, piaffe_id)
);

-- ---------- Outil de migration ----------
-- « Chemins appris » par logiciel source (partagés entre clubs, versionnés). Écriture : clé de scope migration.
CREATE TABLE migration_recipes (
  id TEXT PRIMARY KEY,                    -- rcp_xxx
  software TEXT NOT NULL,                 -- kavalog, equimondo…
  name TEXT NOT NULL DEFAULT 'defaut',
  version INTEGER NOT NULL,
  recipe TEXT NOT NULL,                   -- JSON libre
  notes TEXT,
  created_by_club TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (software, name, version)
);

-- Signalements d'un robot de migration cassé.
CREATE TABLE migration_incidents (
  id TEXT PRIMARY KEY,                    -- inc_xxx
  club_id TEXT,
  software TEXT NOT NULL,
  step TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  screenshot_key TEXT,                    -- R2
  tool_version TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Campagne d'accueil des adhérents après une migration.
CREATE TABLE migration_campaigns (
  id TEXT PRIMARY KEY,                    -- cmp_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  send_at TEXT NOT NULL,                  -- envoi de l'annonce
  activate_at TEXT,                       -- envoi du lien d'activation (sinon inclus dans l'annonce)
  previous_software TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | sending | sent | canceled
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_campaigns_due ON migration_campaigns(status, send_at);

CREATE TABLE migration_recipients (
  id TEXT PRIMARY KEY,                    -- identifiant opaque (pixel d'ouverture)
  campaign_id TEXT NOT NULL REFERENCES migration_campaigns(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  first TEXT,
  token_hash TEXT UNIQUE,                 -- lien d'activation (SHA-256)
  token_expires_at TEXT,
  announce_mail TEXT, activate_mail TEXT, reminder1_mail TEXT, reminder2_mail TEXT, -- ids email_outbox
  announced_at TEXT, activate_sent_at TEXT, reminder1_at TEXT, reminder2_at TEXT,
  opened_at TEXT, activated_at TEXT, user_id TEXT,
  UNIQUE (campaign_id, member_id)
);
CREATE INDEX idx_recipients_campaign ON migration_recipients(campaign_id);
