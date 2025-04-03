-- Update pirates_dock prompts to be more specific
-- First, add new prompts for pirates_dock_fishing
INSERT INTO location_task_prompts (location, prompt_text, difficulty) VALUES
('pirates_dock_fishing', 'Cast your line and catch some common fish for the crew''s dinner.', 'easy'),
('pirates_dock_fishing', 'Try to catch some of the more elusive fish species in deeper waters.', 'normal'),
('pirates_dock_fishing', 'Brave the rough seas to catch rare and valuable fish species.', 'normal'),
('pirates_dock_fishing', 'Hunt for the legendary sea monster that sailors have been talking about.', 'hard');

-- Add new prompts for pirates_dock_swab
INSERT INTO location_task_prompts (location, prompt_text, difficulty) VALUES
('pirates_dock_swab', 'Swab the main deck and make it shine.', 'easy'),
('pirates_dock_swab', 'Clean the entire ship, including the captain''s quarters.', 'normal'),
('pirates_dock_swab', 'Repair damaged parts of the ship while cleaning.', 'normal'),
('pirates_dock_swab', 'Completely overhaul the ship''s cleanliness during a storm.', 'hard');

-- Add rewards for pirates_dock_fishing
INSERT INTO location_rewards (location, reward_type, rarity, reward_data, weight) VALUES
-- Fishing monster rewards
('pirates_dock_fishing', 'monster', 'common', '{
    "species": ["Pokemon"],
    "types": ["Water", "Ice"],
    "minLevel": 1,
    "maxLevel": 10,
    "filters": {
        "pokemon": {"rarity": "Common"}
    }
}', 100),
('pirates_dock_fishing', 'monster', 'uncommon', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Ice", "Electric"],
    "minLevel": 5,
    "maxLevel": 15,
    "filters": {
        "pokemon": {"rarity": "Uncommon"},
        "digimon": {"stage": ["Rookie"]}
    }
}', 50),
('pirates_dock_fishing', 'monster', 'rare', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Dragon"],
    "minLevel": 10,
    "maxLevel": 20,
    "filters": {
        "pokemon": {"rarity": "Rare"},
        "digimon": {"stage": ["Champion"]}
    }
}', 20),

-- Fishing item rewards
('pirates_dock_fishing', 'item', 'common', '{
    "name": "Fishing Rod",
    "quantity": {"min": 1, "max": 1},
    "category": "items"
}', 100),
('pirates_dock_fishing', 'item', 'uncommon', '{
    "name": "Super Rod",
    "quantity": {"min": 1, "max": 1},
    "category": "items"
}', 50),
('pirates_dock_fishing', 'item', 'rare', '{
    "name": "Water Stone",
    "quantity": {"min": 1, "max": 1},
    "category": "evolution"
}', 20),

-- Fishing coin rewards
('pirates_dock_fishing', 'coin', 'common', '{
    "amount": 75
}', 100),
('pirates_dock_fishing', 'coin', 'uncommon', '{
    "amount": 150
}', 50),
('pirates_dock_fishing', 'coin', 'rare', '{
    "amount": 250
}', 20);

-- Add rewards for pirates_dock_swab
INSERT INTO location_rewards (location, reward_type, rarity, reward_data, weight) VALUES
-- Swabbing monster rewards
('pirates_dock_swab', 'monster', 'common', '{
    "species": ["Pokemon"],
    "types": ["Water", "Fighting"],
    "minLevel": 1,
    "maxLevel": 10,
    "filters": {
        "pokemon": {"rarity": "Common"}
    }
}', 100),
('pirates_dock_swab', 'monster', 'uncommon', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Fighting", "Steel"],
    "minLevel": 5,
    "maxLevel": 15,
    "filters": {
        "pokemon": {"rarity": "Uncommon"},
        "digimon": {"stage": ["Rookie"]}
    }
}', 50),
('pirates_dock_swab', 'monster', 'rare', '{
    "species": ["Pokemon", "Digimon"],
    "types": ["Water", "Fighting", "Ghost"],
    "minLevel": 10,
    "maxLevel": 20,
    "filters": {
        "pokemon": {"rarity": "Rare"},
        "digimon": {"stage": ["Champion"]}
    }
}', 20),

-- Swabbing item rewards
('pirates_dock_swab', 'item', 'common', '{
    "name": "Cleaner",
    "quantity": {"min": 1, "max": 3},
    "category": "items"
}', 100),
('pirates_dock_swab', 'item', 'uncommon', '{
    "name": "Super Cleaner",
    "quantity": {"min": 1, "max": 2},
    "category": "items"
}', 50),
('pirates_dock_swab', 'item', 'rare', '{
    "name": "Pirate Hat",
    "quantity": {"min": 1, "max": 1},
    "category": "antique"
}', 20),

-- Swabbing coin rewards
('pirates_dock_swab', 'coin', 'common', '{
    "amount": 75
}', 100),
('pirates_dock_swab', 'coin', 'uncommon', '{
    "amount": 150
}', 50),
('pirates_dock_swab', 'coin', 'rare', '{
    "amount": 250
}', 20);

-- Add level rewards for both locations
INSERT INTO location_rewards (location, reward_type, rarity, reward_data, weight) VALUES
('pirates_dock_fishing', 'level', 'common', '{
    "levels": 1,
    "target": "trainer"
}', 100),
('pirates_dock_fishing', 'level', 'uncommon', '{
    "levels": 2,
    "target": "trainer"
}', 50),
('pirates_dock_swab', 'level', 'common', '{
    "levels": 1,
    "target": "trainer"
}', 100),
('pirates_dock_swab', 'level', 'uncommon', '{
    "levels": 2,
    "target": "trainer"
}', 50);
