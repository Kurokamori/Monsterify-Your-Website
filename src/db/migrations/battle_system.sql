-- Battle System Tables

-- Battle Opponents Table
CREATE TABLE IF NOT EXISTS battle_opponents (
    opponent_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'normal', 'hard', 'elite')),
    level INTEGER NOT NULL,
    type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Opponent Monsters Table
CREATE TABLE IF NOT EXISTS opponent_monsters (
    monster_id SERIAL PRIMARY KEY,
    opponent_id INTEGER REFERENCES battle_opponents(opponent_id),
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    species1 TEXT NOT NULL,
    species2 TEXT,
    species3 TEXT,
    type1 TEXT NOT NULL,
    type2 TEXT,
    type3 TEXT,
    type4 TEXT,
    type5 TEXT,
    attribute TEXT,
    hp_total INTEGER NOT NULL,
    atk_total INTEGER NOT NULL,
    def_total INTEGER NOT NULL,
    spa_total INTEGER NOT NULL,
    spd_total INTEGER NOT NULL,
    spe_total INTEGER NOT NULL,
    moveset TEXT,
    image_url TEXT,
    position INTEGER NOT NULL, -- Order in the opponent's team
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Battles Table
CREATE TABLE IF NOT EXISTS battles (
    battle_id SERIAL PRIMARY KEY,
    trainer_id INTEGER REFERENCES trainers(id),
    opponent_id INTEGER REFERENCES battle_opponents(opponent_id),
    status TEXT CHECK (status IN ('in_progress', 'won', 'lost', 'abandoned')) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    wpm INTEGER, -- Words per minute
    accuracy DECIMAL(5,2), -- Typing accuracy percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Battle Rewards Table
CREATE TABLE IF NOT EXISTS battle_rewards (
    reward_id SERIAL PRIMARY KEY,
    battle_id INTEGER REFERENCES battles(battle_id),
    trainer_id INTEGER REFERENCES trainers(id),
    coins INTEGER DEFAULT 0,
    levels INTEGER DEFAULT 0,
    items JSONB DEFAULT '{"items": []}',
    monsters JSONB DEFAULT '{"monsters": []}',
    is_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Type Effectiveness Table
CREATE TABLE IF NOT EXISTS type_effectiveness (
    attacking_type TEXT NOT NULL,
    defending_type TEXT NOT NULL,
    effectiveness DECIMAL(3,2) NOT NULL, -- 0.5 for not very effective, 1.0 for normal, 2.0 for super effective
    PRIMARY KEY (attacking_type, defending_type)
);

-- Insert basic Pokemon type effectiveness data
INSERT INTO type_effectiveness (attacking_type, defending_type, effectiveness)
VALUES
    -- Normal type effectiveness
    ('Normal', 'Normal', 1.0),
    ('Normal', 'Fighting', 1.0),
    ('Normal', 'Flying', 1.0),
    ('Normal', 'Poison', 1.0),
    ('Normal', 'Ground', 1.0),
    ('Normal', 'Rock', 0.5),
    ('Normal', 'Bug', 1.0),
    ('Normal', 'Ghost', 0.0),
    ('Normal', 'Steel', 0.5),
    ('Normal', 'Fire', 1.0),
    ('Normal', 'Water', 1.0),
    ('Normal', 'Grass', 1.0),
    ('Normal', 'Electric', 1.0),
    ('Normal', 'Psychic', 1.0),
    ('Normal', 'Ice', 1.0),
    ('Normal', 'Dragon', 1.0),
    ('Normal', 'Dark', 1.0),
    ('Normal', 'Fairy', 1.0),
    
    -- Fire type effectiveness
    ('Fire', 'Normal', 1.0),
    ('Fire', 'Fighting', 1.0),
    ('Fire', 'Flying', 1.0),
    ('Fire', 'Poison', 1.0),
    ('Fire', 'Ground', 1.0),
    ('Fire', 'Rock', 0.5),
    ('Fire', 'Bug', 2.0),
    ('Fire', 'Ghost', 1.0),
    ('Fire', 'Steel', 2.0),
    ('Fire', 'Fire', 0.5),
    ('Fire', 'Water', 0.5),
    ('Fire', 'Grass', 2.0),
    ('Fire', 'Electric', 1.0),
    ('Fire', 'Psychic', 1.0),
    ('Fire', 'Ice', 2.0),
    ('Fire', 'Dragon', 0.5),
    ('Fire', 'Dark', 1.0),
    ('Fire', 'Fairy', 1.0),
    
    -- Water type effectiveness
    ('Water', 'Normal', 1.0),
    ('Water', 'Fighting', 1.0),
    ('Water', 'Flying', 1.0),
    ('Water', 'Poison', 1.0),
    ('Water', 'Ground', 2.0),
    ('Water', 'Rock', 2.0),
    ('Water', 'Bug', 1.0),
    ('Water', 'Ghost', 1.0),
    ('Water', 'Steel', 1.0),
    ('Water', 'Fire', 2.0),
    ('Water', 'Water', 0.5),
    ('Water', 'Grass', 0.5),
    ('Water', 'Electric', 1.0),
    ('Water', 'Psychic', 1.0),
    ('Water', 'Ice', 1.0),
    ('Water', 'Dragon', 0.5),
    ('Water', 'Dark', 1.0),
    ('Water', 'Fairy', 1.0),
    
    -- Electric type effectiveness
    ('Electric', 'Normal', 1.0),
    ('Electric', 'Fighting', 1.0),
    ('Electric', 'Flying', 2.0),
    ('Electric', 'Poison', 1.0),
    ('Electric', 'Ground', 0.0),
    ('Electric', 'Rock', 1.0),
    ('Electric', 'Bug', 1.0),
    ('Electric', 'Ghost', 1.0),
    ('Electric', 'Steel', 1.0),
    ('Electric', 'Fire', 1.0),
    ('Electric', 'Water', 2.0),
    ('Electric', 'Grass', 0.5),
    ('Electric', 'Electric', 0.5),
    ('Electric', 'Psychic', 1.0),
    ('Electric', 'Ice', 1.0),
    ('Electric', 'Dragon', 0.5),
    ('Electric', 'Dark', 1.0),
    ('Electric', 'Fairy', 1.0),
    
    -- Grass type effectiveness
    ('Grass', 'Normal', 1.0),
    ('Grass', 'Fighting', 1.0),
    ('Grass', 'Flying', 0.5),
    ('Grass', 'Poison', 0.5),
    ('Grass', 'Ground', 2.0),
    ('Grass', 'Rock', 2.0),
    ('Grass', 'Bug', 0.5),
    ('Grass', 'Ghost', 1.0),
    ('Grass', 'Steel', 0.5),
    ('Grass', 'Fire', 0.5),
    ('Grass', 'Water', 2.0),
    ('Grass', 'Grass', 0.5),
    ('Grass', 'Electric', 1.0),
    ('Grass', 'Psychic', 1.0),
    ('Grass', 'Ice', 1.0),
    ('Grass', 'Dragon', 0.5),
    ('Grass', 'Dark', 1.0),
    ('Grass', 'Fairy', 1.0);

-- Add more type effectiveness data as needed

-- Attribute Effectiveness Table (for Digimon attributes: Data, Vaccine, Virus, Variable, Free)
CREATE TABLE IF NOT EXISTS attribute_effectiveness (
    attacking_attribute TEXT NOT NULL,
    defending_attribute TEXT NOT NULL,
    effectiveness DECIMAL(3,2) NOT NULL,
    PRIMARY KEY (attacking_attribute, defending_attribute)
);

-- Insert Digimon attribute effectiveness data
INSERT INTO attribute_effectiveness (attacking_attribute, defending_attribute, effectiveness)
VALUES
    ('Data', 'Data', 1.0),
    ('Data', 'Vaccine', 0.5),
    ('Data', 'Virus', 2.0),
    ('Data', 'Variable', 1.0),
    ('Data', 'Free', 1.0),
    
    ('Vaccine', 'Data', 2.0),
    ('Vaccine', 'Vaccine', 1.0),
    ('Vaccine', 'Virus', 0.5),
    ('Vaccine', 'Variable', 1.0),
    ('Vaccine', 'Free', 1.0),
    
    ('Virus', 'Data', 0.5),
    ('Virus', 'Vaccine', 2.0),
    ('Virus', 'Virus', 1.0),
    ('Virus', 'Variable', 1.0),
    ('Virus', 'Free', 1.0),
    
    ('Variable', 'Data', 1.0),
    ('Variable', 'Vaccine', 1.0),
    ('Variable', 'Virus', 1.0),
    ('Variable', 'Variable', 1.0),
    ('Variable', 'Free', 1.0),
    
    ('Free', 'Data', 1.0),
    ('Free', 'Vaccine', 1.0),
    ('Free', 'Virus', 1.0),
    ('Free', 'Variable', 1.0),
    ('Free', 'Free', 1.0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battles_trainer_id ON battles(trainer_id);
CREATE INDEX IF NOT EXISTS idx_battles_opponent_id ON battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_battle_rewards_battle_id ON battle_rewards(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_rewards_trainer_id ON battle_rewards(trainer_id);
CREATE INDEX IF NOT EXISTS idx_opponent_monsters_opponent_id ON opponent_monsters(opponent_id);
