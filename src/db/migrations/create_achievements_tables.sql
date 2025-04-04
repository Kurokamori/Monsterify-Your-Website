-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('level', 'type_collector', 'monster_collector', 'attribute_collector', 'currency_earned', 'currency_spent', 'custom')),
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('level', 'type_count', 'monster_count', 'attribute_count', 'currency_earned', 'currency_spent', 'custom')),
    requirement_value INTEGER NOT NULL CHECK (requirement_value > 0),
    requirement_subtype VARCHAR(100),
    icon VARCHAR(100) DEFAULT 'fas fa-trophy',
    rewards JSONB NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    is_secret BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trainer_achievements table to track progress
CREATE TABLE IF NOT EXISTS trainer_achievements (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_complete BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trainer_id, achievement_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_achievements_trainer_id ON trainer_achievements(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_achievements_achievement_id ON trainer_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
