-- Create mon_abilities table to store monster abilities
CREATE TABLE IF NOT EXISTS mon_abilities (
  id SERIAL PRIMARY KEY,
  mon_id INTEGER NOT NULL REFERENCES mons(mon_id) ON DELETE CASCADE,
  ability TEXT,
  ability1 TEXT,
  ability2 TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_mon_abilities_mon_id ON mon_abilities(mon_id);
