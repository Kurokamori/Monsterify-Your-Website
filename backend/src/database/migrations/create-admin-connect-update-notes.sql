-- Create the admin_connect_update_notes table for storing update notes
CREATE TABLE IF NOT EXISTS admin_connect_update_notes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single row
INSERT INTO admin_connect_update_notes (id, content) VALUES (1, '')
ON CONFLICT (id) DO NOTHING;
