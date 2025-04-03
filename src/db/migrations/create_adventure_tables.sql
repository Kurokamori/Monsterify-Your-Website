-- Create the encounters table if it doesn't exist
CREATE TABLE IF NOT EXISTS encounters (
    encounter_id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES areas(area_id),
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    rarity VARCHAR(50) DEFAULT 'common',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Set owner for encounters table
ALTER TABLE encounters OWNER TO u3f7f8n9i5oagn;

-- Create the adventure_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS adventure_participants (
    participant_id SERIAL PRIMARY KEY,
    adventure_id INTEGER REFERENCES adventures(adventure_id),
    user_id VARCHAR(20) NOT NULL,
    message_count INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    levels_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (adventure_id, user_id)
);

-- Set owner for adventure_participants table
ALTER TABLE adventure_participants OWNER TO u3f7f8n9i5oagn;

-- Add claimed column to adventure_participants if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'adventure_participants' AND column_name = 'claimed'
    ) THEN
        ALTER TABLE adventure_participants ADD COLUMN claimed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
