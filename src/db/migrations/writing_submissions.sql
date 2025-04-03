-- Create writing_submissions table
CREATE TABLE IF NOT EXISTS writing_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    writing_url TEXT NOT NULL,
    writing_type VARCHAR(50) NOT NULL,
    word_count INTEGER NOT NULL,
    difficulty_modifier INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    total_levels INTEGER NOT NULL,
    total_coins INTEGER NOT NULL,
    submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(discord_id)
);

-- Create writing_submission_participants table
CREATE TABLE IF NOT EXISTS writing_submission_participants (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    trainer_id INTEGER NOT NULL,
    monster_id INTEGER,
    levels_awarded INTEGER NOT NULL,
    coins_awarded INTEGER NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES writing_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    FOREIGN KEY (monster_id) REFERENCES monsters(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id ON writing_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_submission_date ON writing_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_writing_submission_participants_submission_id ON writing_submission_participants(submission_id);
CREATE INDEX IF NOT EXISTS idx_writing_submission_participants_trainer_id ON writing_submission_participants(trainer_id);
CREATE INDEX IF NOT EXISTS idx_writing_submission_participants_monster_id ON writing_submission_participants(monster_id);
