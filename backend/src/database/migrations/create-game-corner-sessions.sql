-- Game Corner Sessions
-- Stores in-progress pomodoro timer sessions so they survive page refreshes.
-- Rows are deleted once the session completes and rewards are generated.

CREATE TABLE IF NOT EXISTS game_corner_sessions (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,

  -- Timer settings
  session_length      INTEGER NOT NULL DEFAULT 25,
  break_length        INTEGER NOT NULL DEFAULT 5,
  long_break_length   INTEGER NOT NULL DEFAULT 15,
  session_count       INTEGER NOT NULL DEFAULT 4,

  -- Progress
  completed_sessions  INTEGER NOT NULL DEFAULT 0,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0,
  current_session     INTEGER NOT NULL DEFAULT 0,
  is_break            BOOLEAN NOT NULL DEFAULT false,

  -- Timer recovery state
  timer_active        BOOLEAN NOT NULL DEFAULT false,
  time_remaining      INTEGER NOT NULL DEFAULT 0,       -- seconds
  timer_end_time      BIGINT,                           -- epoch ms (null when paused)
  total_timer_duration INTEGER NOT NULL DEFAULT 0,      -- seconds

  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT uq_game_corner_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_corner_sessions_user ON game_corner_sessions (user_id);
