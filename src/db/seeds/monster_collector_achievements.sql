-- Monster collector achievements
-- Rewards for collecting a certain number of monsters

-- Monster Collector I
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    icon,
    rewards,
    "order"
) VALUES (
    'Monster Collector I',
    'Collect 10 monsters',
    'monster_collector',
    'monster_count',
    10,
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 500},
        {"type": "level", "value": 2},
        {"type": "monster_random", "value": {"name": "Collector's Starter", "level": 10}}
    ]'::jsonb,
    1
);

-- Monster Collector II
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    icon,
    rewards,
    "order"
) VALUES (
    'Monster Collector II',
    'Collect 50 monsters',
    'monster_collector',
    'monster_count',
    50,
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 2500},
        {"type": "level", "value": 5},
        {"type": "monster_random", "value": {"name": "Collector's Companion", "level": 25}}
    ]'::jsonb,
    2
);

-- Monster Collector III
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    icon,
    rewards,
    "order"
) VALUES (
    'Monster Collector III',
    'Collect 100 monsters',
    'monster_collector',
    'monster_count',
    100,
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 5000},
        {"type": "level", "value": 10},
        {"type": "monster_random", "value": {"name": "Collector's Partner", "level": 50}}
    ]'::jsonb,
    3
);

-- Monster Collector IV
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    icon,
    rewards,
    "order"
) VALUES (
    'Monster Collector IV',
    'Collect 500 monsters',
    'monster_collector',
    'monster_count',
    500,
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 25000},
        {"type": "level", "value": 15},
        {"type": "monster_random", "value": {"name": "Collector\'s Prize", "level": 75}}
    ]'::jsonb,
    4
);

-- Monster Collector V
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    icon,
    rewards,
    "order"
) VALUES (
    'Monster Collector V',
    'Collect 1000 monsters',
    'monster_collector',
    'monster_count',
    1000,
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 50000},
        {"type": "level", "value": 20},
        {"type": "monster_random", "value": {"name": "Master Collector\'s Prize", "level": 100}}
    ]'::jsonb,
    5
);
