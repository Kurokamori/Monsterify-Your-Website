-- Create location_activity_sessions table
CREATE TABLE IF NOT EXISTS location_activity_sessions (
    session_id SERIAL PRIMARY KEY,
    trainer_id INTEGER NULL, -- Make trainer_id nullable
    player_id TEXT NULL, -- Discord user ID for player-based activities
    location VARCHAR(100) NOT NULL,
    activity VARCHAR(100) NOT NULL,
    prompt_id INTEGER REFERENCES location_task_prompts(prompt_id),
    duration_minutes INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    rewards JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_activity_sessions_trainer_id ON location_activity_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_sessions_player_id ON location_activity_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_location_activity_sessions_location ON location_activity_sessions(location);
