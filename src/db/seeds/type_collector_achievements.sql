-- Type collector achievements
-- Rewards for collecting monsters of specific types

-- Normal Type Collector Achievements
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Normal Type Collector I',
    'Collect 1 monster with the Normal type',
    'type_collector',
    'type_count',
    1,
    'Normal',
    'fas fa-star',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Normal Type Prize I", "level": 5}}
    ]'::jsonb,
    1
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Normal Type Collector II',
    'Collect 5 monsters with the Normal type',
    'type_collector',
    'type_count',
    5,
    'Normal',
    'fas fa-star',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    2
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Normal Type Collector III',
    'Collect 10 monsters with the Normal type',
    'type_collector',
    'type_count',
    10,
    'Normal',
    'fas fa-star',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Normal Type Prize III", "level": 15}}
    ]'::jsonb,
    3
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Normal Type Collector IV',
    'Collect 20 monsters with the Normal type',
    'type_collector',
    'type_count',
    20,
    'Normal',
    'fas fa-star',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    4
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Normal Type Collector V',
    'Collect 100 monsters with the Normal type',
    'type_collector',
    'type_count',
    100,
    'Normal',
    'fas fa-star',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Normal Type Master Prize", "level": 30}}
    ]'::jsonb,
    5
);

-- Fire Type Collector Achievements
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Fire Type Collector I',
    'Collect 1 monster with the Fire type',
    'type_collector',
    'type_count',
    1,
    'Fire',
    'fas fa-fire',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Fire Type Prize I", "level": 5}}
    ]'::jsonb,
    6
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Fire Type Collector II',
    'Collect 5 monsters with the Fire type',
    'type_collector',
    'type_count',
    5,
    'Fire',
    'fas fa-fire',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    7
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Fire Type Collector III',
    'Collect 10 monsters with the Fire type',
    'type_collector',
    'type_count',
    10,
    'Fire',
    'fas fa-fire',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Fire Type Prize III", "level": 15}}
    ]'::jsonb,
    8
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Fire Type Collector IV',
    'Collect 20 monsters with the Fire type',
    'type_collector',
    'type_count',
    20,
    'Fire',
    'fas fa-fire',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    9
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Fire Type Collector V',
    'Collect 100 monsters with the Fire type',
    'type_collector',
    'type_count',
    100,
    'Fire',
    'fas fa-fire',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Fire Type Master Prize", "level": 30}}
    ]'::jsonb,
    10
);

-- Water Type Collector Achievements
INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Water Type Collector I',
    'Collect 1 monster with the Water type',
    'type_collector',
    'type_count',
    1,
    'Water',
    'fas fa-water',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Water Type Prize I", "level": 5}}
    ]'::jsonb,
    11
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Water Type Collector II',
    'Collect 5 monsters with the Water type',
    'type_collector',
    'type_count',
    5,
    'Water',
    'fas fa-water',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    12
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Water Type Collector III',
    'Collect 10 monsters with the Water type',
    'type_collector',
    'type_count',
    10,
    'Water',
    'fas fa-water',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Water Type Prize III", "level": 15}}
    ]'::jsonb,
    13
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Water Type Collector IV',
    'Collect 20 monsters with the Water type',
    'type_collector',
    'type_count',
    20,
    'Water',
    'fas fa-water',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    14
);

INSERT INTO achievements (
    name,
    description,
    category,
    requirement_type,
    requirement_value,
    requirement_subtype,
    icon,
    rewards,
    "order"
) VALUES (
    'Water Type Collector V',
    'Collect 100 monsters with the Water type',
    'type_collector',
    'type_count',
    100,
    'Water',
    'fas fa-water',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Water Type Master Prize", "level": 30}}
    ]'::jsonb,
    15
);
