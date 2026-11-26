-- Stabl · connecteur MCP (Claude, ChatGPT et autres assistants) : clients OAuth, demandes d'accord,
-- accords (un assistant relié à un club par une personne), codes et jetons, journal des appels.
-- Tous les secrets sont stockés hachés (SHA-256 hex) : la base ne contient aucun jeton utilisable.

-- Assistants enregistrés à la volée (RFC 7591) ou décrits par un document de métadonnées (client_id = URL https).
CREATE TABLE mcp_clients (
  id TEXT PRIMARY KEY,                  -- stc_xxx, ou l'URL du document de métadonnées
  name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,          -- JSON [url…]
  kind TEXT NOT NULL DEFAULT 'dcr',     -- dcr | cimd
  fetched_at TEXT,                      -- cimd : dernière lecture du document
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Demande d'accord en cours (10 minutes) : ce que l'assistant a demandé, en attente de la décision de la personne.
CREATE TABLE mcp_requests (
  id TEXT PRIMARY KEY,                  -- SHA-256 hex de l'identifiant de demande
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  state TEXT,
  code_challenge TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'lecture',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Accord : tel assistant lit (et éventuellement écrit) les données de tel club, au nom de telle personne.
CREATE TABLE mcp_grants (
  id TEXT PRIMARY KEY,                  -- stg_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_host TEXT,
  scopes TEXT NOT NULL DEFAULT '["lecture"]',
  calls INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_mcp_grants_club ON mcp_grants(club_id, created_at);
CREATE INDEX idx_mcp_grants_user ON mcp_grants(user_id);

-- Codes d'autorisation (5 minutes, usage unique) et jetons (accès 1 h, renouvellement 90 jours, renouvelé à chaque usage).
CREATE TABLE mcp_codes (
  id TEXT PRIMARY KEY,                  -- SHA-256 hex du code
  grant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE mcp_tokens (
  id TEXT PRIMARY KEY,                  -- SHA-256 hex du jeton
  kind TEXT NOT NULL,                   -- access | refresh
  grant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_mcp_tokens_grant ON mcp_tokens(grant_id);
CREATE INDEX idx_mcp_tokens_exp ON mcp_tokens(expires_at);

-- Journal des appels d'outils (90 jours) : ce que l'écran « Connecteurs » montre au gérant.
CREATE TABLE mcp_calls (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  grant_id TEXT,                        -- NULL pour une clé d'API
  api_key_id TEXT,
  client_name TEXT,
  user_id TEXT,
  tool TEXT NOT NULL,
  args TEXT,                            -- JSON tronqué à 300 caractères
  ok INTEGER NOT NULL,
  summary TEXT,
  ms INTEGER,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_mcp_calls_club ON mcp_calls(club_id, at);
