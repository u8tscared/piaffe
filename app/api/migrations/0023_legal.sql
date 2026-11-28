-- Textes légaux (28/11/2026) : version des CGU acceptée par chaque utilisateur, et des CGV + accord de sous-traitance RGPD par chaque club.
ALTER TABLE users ADD COLUMN terms_version TEXT;
ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE clubs ADD COLUMN legal_version TEXT;        -- version des CGV et de l'accord de sous-traitance acceptée
ALTER TABLE clubs ADD COLUMN legal_accepted_at TEXT;
ALTER TABLE clubs ADD COLUMN legal_accepted_by TEXT;    -- users.id de la personne qui a accepté au nom du club
