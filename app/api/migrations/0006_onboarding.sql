-- Stabl · lot E (onboarding)
-- Les réponses et l'avancement de l'onboarding vivent dans clubs.onboarding (JSON, socle) ;
-- les préférences d'affichage (écrans masqués, fiche du club) dans clubs.settings (JSON, socle).

-- Cache de la recherche d'entreprises (recherche-entreprises.api.gouv.fr), 7 jours.
CREATE TABLE siret_cache (
  q TEXT PRIMARY KEY,                   -- requête normalisée (nom en minuscules, ou SIREN / SIRET)
  data TEXT NOT NULL,                   -- JSON : liste de résultats déjà mis au format Stabl
  at TEXT NOT NULL
);

-- Journal des étapes de démarrage cochées (une ligne par club et par tâche).
CREATE TABLE onboarding_tasks (
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  done_at TEXT,
  dismissed_at TEXT,
  PRIMARY KEY (club_id, task_id)
);
