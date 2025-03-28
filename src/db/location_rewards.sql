-- Create location_rewards table
CREATE TABLE IF NOT EXISTS location_rewards (
    reward_id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('monster', 'level', 'item', 'coin')),
    rarity VARCHAR(50) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    reward_data JSONB NOT NULL,
    weight INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_location_rewards_location ON location_rewards(location);
CREATE INDEX IF NOT EXISTS idx_location_rewards_type ON location_rewards(reward_type);

-- Insert sample monster rewards with specific specifications
INSERT INTO location_rewards (location, reward_type, rarity, reward_data, weight) VALUES
-- Garden monster rewards
('garden', 'monster', 'common', '{
    "species": ["Pokemon"],
    "types": ["Grass", "Bug"],
    "minLevel": 1,
    "maxLevel": 10,
    "filters": {
        "pokemon": {"rarity": "Common"}
    }
}', 100),
('garden', 'monster', 'uncommon', '{
    "species": ["Pokemon"],
    "types": ["Grass", "Poison", "Bug"],
    "minLevel": 5,
    "maxLevel": 15,
    "filters": {
        "pokemon": {"rarity": "Uncommon"}
    }
}', 50),
('garden', 'monster', 'rare', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Grass", "Fairy"],
    "minLevel": 10,
    "maxLevel": 20,
    "filters": {
        "pokemon": {"rarity": "Rare"},
        "digimon": {"stage": ["Rookie", "Champion"]}
    }
}', 20),

-- Farm monster rewards
('farm', 'monster', 'common', '{
    "species": ["Pokemon"],
    "types": ["Normal", "Ground"],
    "minLevel": 1,
    "maxLevel": 10,
    "filters": {
        "pokemon": {"rarity": "Common"}
    }
}', 100),
('farm', 'monster', 'uncommon', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Normal", "Ground", "Fighting"],
    "minLevel": 5,
    "maxLevel": 15,
    "filters": {
        "pokemon": {"rarity": "Uncommon"},
        "digimon": {"stage": ["Rookie"]}
    }
}', 50),
('farm', 'monster', 'rare', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Ground", "Fighting", "Steel"],
    "minLevel": 10,
    "maxLevel": 20,
    "filters": {
        "pokemon": {"rarity": "Rare"},
        "digimon": {"stage": ["Champion"]}
    }
}', 20),

-- Pirates Dock monster rewards (for both fishing and swabbing)
('pirates_dock', 'monster', 'common', '{
    "species": ["Pokemon"],
    "types": ["Water", "Flying"],
    "minLevel": 1,
    "maxLevel": 10,
    "filters": {
        "pokemon": {"rarity": "Common"}
    }
}', 100),
('pirates_dock', 'monster', 'uncommon', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Dark", "Flying"],
    "minLevel": 5,
    "maxLevel": 15,
    "filters": {
        "pokemon": {"rarity": "Uncommon"},
        "digimon": {"stage": ["Rookie"]}
    }
}', 50),
('pirates_dock', 'monster', 'rare', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Dark", "Dragon"],
    "minLevel": 10,
    "maxLevel": 20,
    "filters": {
        "pokemon": {"rarity": "Rare"},
        "digimon": {"stage": ["Champion"]}
    }
}', 20),

-- Level rewards for all locations
('garden', 'level', 'common', '{
    "levels": 1,
    "target": "trainer"
}', 100),
('garden', 'level', 'uncommon', '{
    "levels": 2,
    "target": "trainer"
}', 50),
('farm', 'level', 'common', '{
    "levels": 1,
    "target": "trainer"
}', 100),
('farm', 'level', 'uncommon', '{
    "levels": 2,
    "target": "trainer"
}', 50),
('pirates_dock', 'level', 'common', '{
    "levels": 1,
    "target": "trainer"
}', 100),
('pirates_dock', 'level', 'uncommon', '{
    "levels": 2,
    "target": "trainer"
}', 50),

-- Item rewards
('garden', 'item', 'common', '{
    "name": "Oran Berry",
    "quantity": {"min": 1, "max": 3},
    "category": "berries"
}', 100),
('garden', 'item', 'uncommon', '{
    "name": "Sitrus Berry",
    "quantity": {"min": 1, "max": 2},
    "category": "berries"
}', 50),
('garden', 'item', 'rare', '{
    "name": "Lum Berry",
    "quantity": {"min": 1, "max": 1},
    "category": "berries"
}', 20),

('farm', 'item', 'common', '{
    "name": "Potion",
    "quantity": {"min": 1, "max": 3},
    "category": "medicine"
}', 100),
('farm', 'item', 'uncommon', '{
    "name": "Super Potion",
    "quantity": {"min": 1, "max": 2},
    "category": "medicine"
}', 50),
('farm', 'item', 'rare', '{
    "name": "Rare Candy",
    "quantity": {"min": 1, "max": 1},
    "category": "evolution"
}', 20),

('pirates_dock', 'item', 'common', '{
    "name": "Poké Ball",
    "quantity": {"min": 1, "max": 5},
    "category": "balls"
}', 100),
('pirates_dock', 'item', 'uncommon', '{
    "name": "Great Ball",
    "quantity": {"min": 1, "max": 3},
    "category": "balls"
}', 50),
('pirates_dock', 'item', 'rare', '{
    "name": "Ultra Ball",
    "quantity": {"min": 1, "max": 1},
    "category": "balls"
}', 20),

-- Coin rewards
('garden', 'coin', 'common', '{
    "amount": {"min": 50, "max": 100}
}', 100),
('garden', 'coin', 'uncommon', '{
    "amount": {"min": 100, "max": 200}
}', 50),
('garden', 'coin', 'rare', '{
    "amount": {"min": 200, "max": 300}
}', 20),

('farm', 'coin', 'common', '{
    "amount": {"min": 50, "max": 100}
}', 100),
('farm', 'coin', 'uncommon', '{
    "amount": {"min": 100, "max": 200}
}', 50),
('farm', 'coin', 'rare', '{
    "amount": {"min": 200, "max": 300}
}', 20),

('pirates_dock', 'coin', 'common', '{
    "amount": {"min": 50, "max": 100}
}', 100),
('pirates_dock', 'coin', 'uncommon', '{
    "amount": {"min": 100, "max": 200}
}', 50),
('pirates_dock', 'coin', 'rare', '{
    "amount": {"min": 200, "max": 300}
}', 20);

-- Add some legendary monster rewards (very rare)
INSERT INTO location_rewards (location, reward_type, rarity, reward_data, weight) VALUES
('garden', 'monster', 'legendary', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Grass", "Fairy", "Psychic"],
    "minLevel": 30,
    "maxLevel": 50,
    "filters": {
        "pokemon": {"rarity": "Legendary"},
        "digimon": {"stage": ["Ultimate", "Mega"]}
    }
}', 1),
('farm', 'monster', 'legendary', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Ground", "Steel", "Fighting"],
    "minLevel": 30,
    "maxLevel": 50,
    "filters": {
        "pokemon": {"rarity": "Legendary"},
        "digimon": {"stage": ["Ultimate", "Mega"]}
    }
}', 1),
('pirates_dock', 'monster', 'legendary', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Dragon", "Dark"],
    "minLevel": 30,
    "maxLevel": 50,
    "filters": {
        "pokemon": {"rarity": "Legendary"},
        "digimon": {"stage": ["Ultimate", "Mega"]}
    }
}', 1);
