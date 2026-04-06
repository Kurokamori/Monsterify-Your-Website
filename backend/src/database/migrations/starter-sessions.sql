-- Starter session persistence
-- Stores active starter selection sessions so users can resume after page refresh
-- Sessions are deleted once the starters are claimed

CREATE TABLE IF NOT EXISTS starter_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  trainer_id INTEGER NOT NULL,
  seed TEXT NOT NULL,
  starter_sets JSONB NOT NULL,
  selected_starters JSONB NOT NULL DEFAULT '[]'::jsonb,
  starter_names JSONB NOT NULL DEFAULT '["","",""]'::jsonb,
  current_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_starter_sessions_user_id ON starter_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_starter_sessions_trainer_id ON starter_sessions(trainer_id);
