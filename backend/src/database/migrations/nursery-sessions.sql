-- Nursery session persistence
-- Stores active hatching/nurturing sessions so users can resume after page refresh
-- Sessions are deleted once all eggs are claimed

CREATE TABLE IF NOT EXISTS nursery_sessions (
  session_id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  trainer_id INTEGER NOT NULL,
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nursery_sessions_user_id ON nursery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nursery_sessions_trainer_id ON nursery_sessions(trainer_id);
