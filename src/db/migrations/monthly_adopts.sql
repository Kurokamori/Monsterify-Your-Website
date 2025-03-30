-- Create monthly_adopts table
CREATE TABLE IF NOT EXISTS monthly_adopts (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  species1 TEXT NOT NULL,
  species2 TEXT,
  species3 TEXT,
  type1 TEXT NOT NULL,
  type2 TEXT,
  type3 TEXT,
  type4 TEXT,
  type5 TEXT,
  attribute TEXT,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by INTEGER REFERENCES trainers(id),
  claimed_at TIMESTAMP,
  UNIQUE(year, month, id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_adopts_year_month ON monthly_adopts(year, month);
