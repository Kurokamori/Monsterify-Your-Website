-- Digimon Attribute collector achievements
-- Rewards for collecting monsters with specific Digimon attributes (Data, Vaccine, Virus, Variable, Free)

-- Data Attribute Collector Achievements
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
    'Data Attribute Collector I', 
    'Collect 1 monster with the Data attribute', 
    'attribute_collector', 
    'attribute_count', 
    1, 
    'Data',
    'fas fa-database', 
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Data Attribute Prize I", "level": 5}}
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
    'Data Attribute Collector II', 
    'Collect 5 monsters with the Data attribute', 
    'attribute_collector', 
    'attribute_count', 
    5, 
    'Data',
    'fas fa-database', 
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
    'Data Attribute Collector III', 
    'Collect 10 monsters with the Data attribute', 
    'attribute_collector', 
    'attribute_count', 
    10, 
    'Data',
    'fas fa-database', 
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Data Attribute Prize III", "level": 15}}
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
    'Data Attribute Collector IV', 
    'Collect 20 monsters with the Data attribute', 
    'attribute_collector', 
    'attribute_count', 
    20, 
    'Data',
    'fas fa-database', 
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
    'Data Attribute Collector V', 
    'Collect 100 monsters with the Data attribute', 
    'attribute_collector', 
    'attribute_count', 
    100, 
    'Data',
    'fas fa-database', 
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Data Attribute Master Prize", "level": 30}}
    ]'::jsonb, 
    5
);

-- Vaccine Attribute Collector Achievements
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
    'Vaccine Attribute Collector I', 
    'Collect 1 monster with the Vaccine attribute', 
    'attribute_collector', 
    'attribute_count', 
    1, 
    'Vaccine',
    'fas fa-syringe', 
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Vaccine Attribute Prize I", "level": 5}}
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
    'Vaccine Attribute Collector II', 
    'Collect 5 monsters with the Vaccine attribute', 
    'attribute_collector', 
    'attribute_count', 
    5, 
    'Vaccine',
    'fas fa-syringe', 
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
    'Vaccine Attribute Collector III', 
    'Collect 10 monsters with the Vaccine attribute', 
    'attribute_collector', 
    'attribute_count', 
    10, 
    'Vaccine',
    'fas fa-syringe', 
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Vaccine Attribute Prize III", "level": 15}}
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
    'Vaccine Attribute Collector IV', 
    'Collect 20 monsters with the Vaccine attribute', 
    'attribute_collector', 
    'attribute_count', 
    20, 
    'Vaccine',
    'fas fa-syringe', 
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
    'Vaccine Attribute Collector V', 
    'Collect 100 monsters with the Vaccine attribute', 
    'attribute_collector', 
    'attribute_count', 
    100, 
    'Vaccine',
    'fas fa-syringe', 
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Vaccine Attribute Master Prize", "level": 30}}
    ]'::jsonb, 
    10
);

-- Virus Attribute Collector Achievements
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
    'Virus Attribute Collector I', 
    'Collect 1 monster with the Virus attribute', 
    'attribute_collector', 
    'attribute_count', 
    1, 
    'Virus',
    'fas fa-virus', 
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Virus Attribute Prize I", "level": 5}}
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
    'Virus Attribute Collector II', 
    'Collect 5 monsters with the Virus attribute', 
    'attribute_collector', 
    'attribute_count', 
    5, 
    'Virus',
    'fas fa-virus', 
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
    'Virus Attribute Collector III', 
    'Collect 10 monsters with the Virus attribute', 
    'attribute_collector', 
    'attribute_count', 
    10, 
    'Virus',
    'fas fa-virus', 
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Virus Attribute Prize III", "level": 15}}
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
    'Virus Attribute Collector IV', 
    'Collect 20 monsters with the Virus attribute', 
    'attribute_collector', 
    'attribute_count', 
    20, 
    'Virus',
    'fas fa-virus', 
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
    'Virus Attribute Collector V', 
    'Collect 100 monsters with the Virus attribute', 
    'attribute_collector', 
    'attribute_count', 
    100, 
    'Virus',
    'fas fa-virus', 
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Virus Attribute Master Prize", "level": 30}}
    ]'::jsonb, 
    15
);

-- Variable Attribute Collector Achievements
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
    'Variable Attribute Collector I', 
    'Collect 1 monster with the Variable attribute', 
    'attribute_collector', 
    'attribute_count', 
    1, 
    'Variable',
    'fas fa-random', 
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Variable Attribute Prize I", "level": 5}}
    ]'::jsonb, 
    16
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
    'Variable Attribute Collector II', 
    'Collect 5 monsters with the Variable attribute', 
    'attribute_collector', 
    'attribute_count', 
    5, 
    'Variable',
    'fas fa-random', 
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb, 
    17
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
    'Variable Attribute Collector III', 
    'Collect 10 monsters with the Variable attribute', 
    'attribute_collector', 
    'attribute_count', 
    10, 
    'Variable',
    'fas fa-random', 
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Variable Attribute Prize III", "level": 15}}
    ]'::jsonb, 
    18
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
    'Variable Attribute Collector IV', 
    'Collect 20 monsters with the Variable attribute', 
    'attribute_collector', 
    'attribute_count', 
    20, 
    'Variable',
    'fas fa-random', 
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb, 
    19
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
    'Variable Attribute Collector V', 
    'Collect 100 monsters with the Variable attribute', 
    'attribute_collector', 
    'attribute_count', 
    100, 
    'Variable',
    'fas fa-random', 
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Variable Attribute Master Prize", "level": 30}}
    ]'::jsonb, 
    20
);

-- Free Attribute Collector Achievements
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
    'Free Attribute Collector I', 
    'Collect 1 monster with the Free attribute', 
    'attribute_collector', 
    'attribute_count', 
    1, 
    'Free',
    'fas fa-unlock', 
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Free Attribute Prize I", "level": 5}}
    ]'::jsonb, 
    21
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
    'Free Attribute Collector II', 
    'Collect 5 monsters with the Free attribute', 
    'attribute_collector', 
    'attribute_count', 
    5, 
    'Free',
    'fas fa-unlock', 
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb, 
    22
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
    'Free Attribute Collector III', 
    'Collect 10 monsters with the Free attribute', 
    'attribute_collector', 
    'attribute_count', 
    10, 
    'Free',
    'fas fa-unlock', 
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Free Attribute Prize III", "level": 15}}
    ]'::jsonb, 
    23
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
    'Free Attribute Collector IV', 
    'Collect 20 monsters with the Free attribute', 
    'attribute_collector', 
    'attribute_count', 
    20, 
    'Free',
    'fas fa-unlock', 
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb, 
    24
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
    'Free Attribute Collector V', 
    'Collect 100 monsters with the Free attribute', 
    'attribute_collector', 
    'attribute_count', 
    100, 
    'Free',
    'fas fa-unlock', 
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Free Attribute Master Prize", "level": 30}}
    ]'::jsonb, 
    25
);
