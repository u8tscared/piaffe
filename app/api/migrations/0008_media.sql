-- Photos des chevaux (profil, soins, marques) : fichiers dans R2, métadonnées ici.
-- L'identifiant est créé par l'appareil (med_…) : un envoi rejoué après une coupure de réseau ne crée pas de doublon.
CREATE TABLE media (
  id TEXT NOT NULL,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  horse_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'profil',        -- profil | soin | marques
  zone TEXT,                                   -- zone du cheval 3D (tete, membres…) pour une photo de soin
  care_id TEXT,                                -- soin lié (records/care)
  note TEXT,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  r2_key TEXT NOT NULL,
  thumb_key TEXT,
  thumb_mime TEXT,
  author_id TEXT,
  author_name TEXT,
  taken_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at TEXT,
  PRIMARY KEY (club_id, id)
);
CREATE INDEX idx_media_horse ON media(club_id, horse_id, created_at);
