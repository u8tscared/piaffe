-- Piaffe · lot A (comptes et données) : jetons à usage unique, invitations, état OAuth Google.
-- Tous les jetons sont stockés hachés (SHA-256 hex) : la base ne contient jamais un jeton utilisable.

-- Jetons envoyés par e-mail : vérification d'adresse, changement d'adresse, réinitialisation, lien magique.
CREATE TABLE auth_tokens (
  id TEXT PRIMARY KEY,                  -- SHA-256 hex du jeton remis
  kind TEXT NOT NULL,                   -- verify | email_change | reset | magic
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,                  -- adresse à laquelle le jeton a été envoyé
  data TEXT,                            -- JSON (ex. {next})
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, kind);
CREATE INDEX idx_auth_tokens_exp ON auth_tokens(expires_at);

-- Invitations dans un club. person_ref : un ou plusieurs ids de fiches séparés par des virgules
-- (m012 ou m012,m013 pour un parent de deux enfants ; s05 pour un employé ; c01 pour un coach).
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,                  -- inv_xxx
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email TEXT NOT NULL COLLATE NOCASE,
  role TEXT NOT NULL,
  person_ref TEXT,
  first TEXT, last TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  invited_by TEXT,
  source TEXT NOT NULL DEFAULT 'manual', -- manual | auto (déclencheur nouvel adhérent)
  expires_at TEXT NOT NULL,
  accepted_at TEXT, accepted_by TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_invitations_club ON invitations(club_id, created_at);
CREATE INDEX idx_invitations_email ON invitations(club_id, email);

-- État d'une connexion Google en cours (state + vérificateur PKCE + nonce), à usage unique, 10 minutes.
CREATE TABLE oauth_states (
  id TEXT PRIMARY KEY,                  -- SHA-256 hex du state
  verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  next TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_sessions_exp ON sessions(expires_at);
CREATE INDEX idx_records_coll ON records(club_id, coll);
