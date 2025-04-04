-- Attribute collector achievements
-- Rewards for collecting monsters with specific attributes

-- Brave Attribute Collector Achievements
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
    'Brave Attribute Collector I',
    'Collect 1 monster with the Brave attribute',
    'attribute_collector',
    'attribute_count',
    1,
    'Brave',
    'fas fa-shield-alt',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Brave Attribute Prize I", "level": 5}}
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
    'Brave Attribute Collector II',
    'Collect 5 monsters with the Brave attribute',
    'attribute_collector',
    'attribute_count',
    5,
    'Brave',
    'fas fa-shield-alt',
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
    'Brave Attribute Collector III',
    'Collect 10 monsters with the Brave attribute',
    'attribute_collector',
    'attribute_count',
    10,
    'Brave',
    'fas fa-shield-alt',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Brave Attribute Prize III", "level": 15}}
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
    'Brave Attribute Collector IV',
    'Collect 20 monsters with the Brave attribute',
    'attribute_collector',
    'attribute_count',
    20,
    'Brave',
    'fas fa-shield-alt',
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
    'Brave Attribute Collector V',
    'Collect 100 monsters with the Brave attribute',
    'attribute_collector',
    'attribute_count',
    100,
    'Brave',
    'fas fa-shield-alt',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Brave Attribute Master Prize", "level": 30}}
    ]'::jsonb,
    5
);

-- Calm Attribute Collector Achievements
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
    'Calm Attribute Collector I',
    'Collect 1 monster with the Calm attribute',
    'attribute_collector',
    'attribute_count',
    1,
    'Calm',
    'fas fa-wind',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Calm Attribute Prize I", "level": 5}}
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
    'Calm Attribute Collector II',
    'Collect 5 monsters with the Calm attribute',
    'attribute_collector',
    'attribute_count',
    5,
    'Calm',
    'fas fa-wind',
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
    'Calm Attribute Collector III',
    'Collect 10 monsters with the Calm attribute',
    'attribute_collector',
    'attribute_count',
    10,
    'Calm',
    'fas fa-wind',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Calm Attribute Prize III", "level": 15}}
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
    'Calm Attribute Collector IV',
    'Collect 20 monsters with the Calm attribute',
    'attribute_collector',
    'attribute_count',
    20,
    'Calm',
    'fas fa-wind',
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
    'Calm Attribute Collector V',
    'Collect 100 monsters with the Calm attribute',
    'attribute_collector',
    'attribute_count',
    100,
    'Calm',
    'fas fa-wind',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Calm Attribute Master Prize", "level": 30}}
    ]'::jsonb,
    10
);

-- Jolly Attribute Collector Achievements
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
    'Jolly Attribute Collector I',
    'Collect 1 monster with the Jolly attribute',
    'attribute_collector',
    'attribute_count',
    1,
    'Jolly',
    'fas fa-laugh',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Jolly Attribute Prize I", "level": 5}}
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
    'Jolly Attribute Collector II',
    'Collect 5 monsters with the Jolly attribute',
    'attribute_collector',
    'attribute_count',
    5,
    'Jolly',
    'fas fa-laugh',
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
    'Jolly Attribute Collector III',
    'Collect 10 monsters with the Jolly attribute',
    'attribute_collector',
    'attribute_count',
    10,
    'Jolly',
    'fas fa-laugh',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Jolly Attribute Prize III", "level": 15}}
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
    'Jolly Attribute Collector IV',
    'Collect 20 monsters with the Jolly attribute',
    'attribute_collector',
    'attribute_count',
    20,
    'Jolly',
    'fas fa-laugh',
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
    'Jolly Attribute Collector V',
    'Collect 100 monsters with the Jolly attribute',
    'attribute_collector',
    'attribute_count',
    100,
    'Jolly',
    'fas fa-laugh',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Jolly Attribute Master Prize", "level": 30}}
    ]'::jsonb,
    15
);
