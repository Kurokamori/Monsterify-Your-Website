-- Ensures the pals_monsters table exists on fresh environments.
-- Matches the shape expected by PalsSpeciesRepository (name + optional image URL).
CREATE TABLE IF NOT EXISTS pals_monsters (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  image_url  TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive lookups by name are used by the wiki importer and search.
CREATE INDEX IF NOT EXISTS pals_monsters_name_lower_idx ON pals_monsters (LOWER(name));
