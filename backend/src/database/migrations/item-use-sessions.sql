-- Item-use session persistence
-- Stores active berry/pastry species-selection sessions so users can resume after page refresh
-- Sessions are deleted once the item is applied or cancelled
-- Unique constraint on (user_id, session_type) ensures one pending session per feature per user

CREATE TABLE IF NOT EXISTS item_use_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL,  -- 'apothecary' | 'adoption_item' | 'mass_edit'
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_item_session UNIQUE (user_id, session_type)
);

CREATE INDEX IF NOT EXISTS idx_item_use_sessions_user ON item_use_sessions(user_id);
