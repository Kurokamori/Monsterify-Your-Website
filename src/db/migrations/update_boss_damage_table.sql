-- Drop existing boss_damage table if it exists
DROP TABLE IF EXISTS boss_damage;

-- Create boss_damage table with player_user_id instead of trainer_id
CREATE TABLE boss_damage
(
    damage_id     serial
        primary key,
    boss_id       integer not null
        references bosses
            on delete cascade,
    player_user_id varchar(255) not null,
    trainer_id    integer
        references trainers
            on delete set null,
    damage_amount integer not null,
    total_damage  integer not null,
    source        text,
    created_at    timestamp default CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_boss_damage_boss_id
    ON boss_damage (boss_id);

CREATE INDEX idx_boss_damage_player_user_id
    ON boss_damage (player_user_id);

CREATE INDEX idx_boss_damage_trainer_id
    ON boss_damage (trainer_id);

-- Set owner
ALTER TABLE boss_damage
    OWNER TO u3f7f8n9i5oagn;
