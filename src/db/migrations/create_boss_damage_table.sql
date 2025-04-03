-- Create boss_damage table if it doesn't exist
CREATE TABLE IF NOT EXISTS boss_damage
(
    damage_id     serial
        primary key,
    boss_id       integer not null
        references bosses
            on delete cascade,
    trainer_id    integer not null
        references trainers
            on delete cascade,
    damage_amount integer not null,
    total_damage  integer not null,
    source        text,
    created_at    timestamp default CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boss_damage_boss_id
    ON boss_damage (boss_id);

CREATE INDEX IF NOT EXISTS idx_boss_damage_trainer_id
    ON boss_damage (trainer_id);

-- Set owner
ALTER TABLE boss_damage
    OWNER TO u3f7f8n9i5oagn;
