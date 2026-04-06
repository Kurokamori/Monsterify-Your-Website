-- Garden Harvest Sessions
-- Persists active harvest sessions so users can resume after refresh/navigation
-- Sessions are deleted once all rewards are claimed/forfeited

CREATE TABLE IF NOT EXISTS garden_harvest_sessions (
  id UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Only one active session per user at a time
  CONSTRAINT unique_active_garden_session UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_garden_harvest_sessions_user_id ON garden_harvest_sessions(user_id);
