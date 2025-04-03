-- Create antique_auctions table
CREATE TABLE IF NOT EXISTS antique_auctions (
  id SERIAL PRIMARY KEY,
  antique TEXT NOT NULL,
  image_link TEXT,
  name TEXT,
  species1 TEXT NOT NULL,
  species2 TEXT,
  species3 TEXT,
  type1 TEXT NOT NULL,
  type2 TEXT,
  type3 TEXT,
  type4 TEXT,
  type5 TEXT,
  attribute TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_antique_auctions_antique ON antique_auctions(antique);
