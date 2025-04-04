-- Type collector achievements
-- Rewards for collecting monsters of specific types (all 18 Pokemon types)

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

-- Electric Type Collector Achievements
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
    'Electric Type Collector I',
    'Collect 1 monster with the Electric type',
    'type_collector',
    'type_count',
    1,
    'Electric',
    'fas fa-bolt',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Electric Type Prize I", "level": 5}}
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
    'Electric Type Collector II',
    'Collect 5 monsters with the Electric type',
    'type_collector',
    'type_count',
    5,
    'Electric',
    'fas fa-bolt',
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
    'Electric Type Collector III',
    'Collect 10 monsters with the Electric type',
    'type_collector',
    'type_count',
    10,
    'Electric',
    'fas fa-bolt',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Electric Type Prize III", "level": 15}}
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
    'Electric Type Collector IV',
    'Collect 20 monsters with the Electric type',
    'type_collector',
    'type_count',
    20,
    'Electric',
    'fas fa-bolt',
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
    'Electric Type Collector V',
    'Collect 100 monsters with the Electric type',
    'type_collector',
    'type_count',
    100,
    'Electric',
    'fas fa-bolt',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Electric Type Master Prize", "level": 30}}
    ]'::jsonb,
    20
);

-- Grass Type Collector Achievements
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
    'Grass Type Collector I',
    'Collect 1 monster with the Grass type',
    'type_collector',
    'type_count',
    1,
    'Grass',
    'fas fa-leaf',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Grass Type Prize I", "level": 5}}
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
    'Grass Type Collector II',
    'Collect 5 monsters with the Grass type',
    'type_collector',
    'type_count',
    5,
    'Grass',
    'fas fa-leaf',
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
    'Grass Type Collector III',
    'Collect 10 monsters with the Grass type',
    'type_collector',
    'type_count',
    10,
    'Grass',
    'fas fa-leaf',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Grass Type Prize III", "level": 15}}
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
    'Grass Type Collector IV',
    'Collect 20 monsters with the Grass type',
    'type_collector',
    'type_count',
    20,
    'Grass',
    'fas fa-leaf',
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
    'Grass Type Collector V',
    'Collect 100 monsters with the Grass type',
    'type_collector',
    'type_count',
    100,
    'Grass',
    'fas fa-leaf',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Grass Type Master Prize", "level": 30}}
    ]'::jsonb,
    25
);

-- Ice Type Collector Achievements
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
    'Ice Type Collector I',
    'Collect 1 monster with the Ice type',
    'type_collector',
    'type_count',
    1,
    'Ice',
    'fas fa-snowflake',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Ice Type Prize I", "level": 5}}
    ]'::jsonb,
    26
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
    'Ice Type Collector II',
    'Collect 5 monsters with the Ice type',
    'type_collector',
    'type_count',
    5,
    'Ice',
    'fas fa-snowflake',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    27
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
    'Ice Type Collector III',
    'Collect 10 monsters with the Ice type',
    'type_collector',
    'type_count',
    10,
    'Ice',
    'fas fa-snowflake',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Ice Type Prize III", "level": 15}}
    ]'::jsonb,
    28
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
    'Ice Type Collector IV',
    'Collect 20 monsters with the Ice type',
    'type_collector',
    'type_count',
    20,
    'Ice',
    'fas fa-snowflake',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    29
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
    'Ice Type Collector V',
    'Collect 100 monsters with the Ice type',
    'type_collector',
    'type_count',
    100,
    'Ice',
    'fas fa-snowflake',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Ice Type Master Prize", "level": 30}}
    ]'::jsonb,
    30
);

-- Fighting Type Collector Achievements
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
    'Fighting Type Collector I',
    'Collect 1 monster with the Fighting type',
    'type_collector',
    'type_count',
    1,
    'Fighting',
    'fas fa-fist-raised',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Fighting Type Prize I", "level": 5}}
    ]'::jsonb,
    31
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
    'Fighting Type Collector II',
    'Collect 5 monsters with the Fighting type',
    'type_collector',
    'type_count',
    5,
    'Fighting',
    'fas fa-fist-raised',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    32
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
    'Fighting Type Collector III',
    'Collect 10 monsters with the Fighting type',
    'type_collector',
    'type_count',
    10,
    'Fighting',
    'fas fa-fist-raised',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Fighting Type Prize III", "level": 15}}
    ]'::jsonb,
    33
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
    'Fighting Type Collector IV',
    'Collect 20 monsters with the Fighting type',
    'type_collector',
    'type_count',
    20,
    'Fighting',
    'fas fa-fist-raised',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    34
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
    'Fighting Type Collector V',
    'Collect 100 monsters with the Fighting type',
    'type_collector',
    'type_count',
    100,
    'Fighting',
    'fas fa-fist-raised',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Fighting Type Master Prize", "level": 30}}
    ]'::jsonb,
    35
);

-- Poison Type Collector Achievements
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
    'Poison Type Collector I',
    'Collect 1 monster with the Poison type',
    'type_collector',
    'type_count',
    1,
    'Poison',
    'fas fa-skull-crossbones',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Poison Type Prize I", "level": 5}}
    ]'::jsonb,
    36
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
    'Poison Type Collector II',
    'Collect 5 monsters with the Poison type',
    'type_collector',
    'type_count',
    5,
    'Poison',
    'fas fa-skull-crossbones',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    37
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
    'Poison Type Collector III',
    'Collect 10 monsters with the Poison type',
    'type_collector',
    'type_count',
    10,
    'Poison',
    'fas fa-skull-crossbones',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Poison Type Prize III", "level": 15}}
    ]'::jsonb,
    38
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
    'Poison Type Collector IV',
    'Collect 20 monsters with the Poison type',
    'type_collector',
    'type_count',
    20,
    'Poison',
    'fas fa-skull-crossbones',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    39
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
    'Poison Type Collector V',
    'Collect 100 monsters with the Poison type',
    'type_collector',
    'type_count',
    100,
    'Poison',
    'fas fa-skull-crossbones',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Poison Type Master Prize", "level": 30}}
    ]'::jsonb,
    40
);

-- Ground Type Collector Achievements
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
    'Ground Type Collector I',
    'Collect 1 monster with the Ground type',
    'type_collector',
    'type_count',
    1,
    'Ground',
    'fas fa-mountain',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Ground Type Prize I", "level": 5}}
    ]'::jsonb,
    41
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
    'Ground Type Collector II',
    'Collect 5 monsters with the Ground type',
    'type_collector',
    'type_count',
    5,
    'Ground',
    'fas fa-mountain',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    42
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
    'Ground Type Collector III',
    'Collect 10 monsters with the Ground type',
    'type_collector',
    'type_count',
    10,
    'Ground',
    'fas fa-mountain',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Ground Type Prize III", "level": 15}}
    ]'::jsonb,
    43
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
    'Ground Type Collector IV',
    'Collect 20 monsters with the Ground type',
    'type_collector',
    'type_count',
    20,
    'Ground',
    'fas fa-mountain',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    44
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
    'Ground Type Collector V',
    'Collect 100 monsters with the Ground type',
    'type_collector',
    'type_count',
    100,
    'Ground',
    'fas fa-mountain',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Ground Type Master Prize", "level": 30}}
    ]'::jsonb,
    45
);

-- Flying Type Collector Achievements
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
    'Flying Type Collector I',
    'Collect 1 monster with the Flying type',
    'type_collector',
    'type_count',
    1,
    'Flying',
    'fas fa-feather-alt',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Flying Type Prize I", "level": 5}}
    ]'::jsonb,
    46
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
    'Flying Type Collector II',
    'Collect 5 monsters with the Flying type',
    'type_collector',
    'type_count',
    5,
    'Flying',
    'fas fa-feather-alt',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    47
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
    'Flying Type Collector III',
    'Collect 10 monsters with the Flying type',
    'type_collector',
    'type_count',
    10,
    'Flying',
    'fas fa-feather-alt',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Flying Type Prize III", "level": 15}}
    ]'::jsonb,
    48
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
    'Flying Type Collector IV',
    'Collect 20 monsters with the Flying type',
    'type_collector',
    'type_count',
    20,
    'Flying',
    'fas fa-feather-alt',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    49
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
    'Flying Type Collector V',
    'Collect 100 monsters with the Flying type',
    'type_collector',
    'type_count',
    100,
    'Flying',
    'fas fa-feather-alt',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Flying Type Master Prize", "level": 30}}
    ]'::jsonb,
    50
);

-- Psychic Type Collector Achievements
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
    'Psychic Type Collector I',
    'Collect 1 monster with the Psychic type',
    'type_collector',
    'type_count',
    1,
    'Psychic',
    'fas fa-brain',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Psychic Type Prize I", "level": 5}}
    ]'::jsonb,
    51
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
    'Psychic Type Collector II',
    'Collect 5 monsters with the Psychic type',
    'type_collector',
    'type_count',
    5,
    'Psychic',
    'fas fa-brain',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    52
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
    'Psychic Type Collector III',
    'Collect 10 monsters with the Psychic type',
    'type_collector',
    'type_count',
    10,
    'Psychic',
    'fas fa-brain',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Psychic Type Prize III", "level": 15}}
    ]'::jsonb,
    53
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
    'Psychic Type Collector IV',
    'Collect 20 monsters with the Psychic type',
    'type_collector',
    'type_count',
    20,
    'Psychic',
    'fas fa-brain',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    54
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
    'Psychic Type Collector V',
    'Collect 100 monsters with the Psychic type',
    'type_collector',
    'type_count',
    100,
    'Psychic',
    'fas fa-brain',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Psychic Type Master Prize", "level": 30}}
    ]'::jsonb,
    55
);

-- Bug Type Collector Achievements
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
    'Bug Type Collector I',
    'Collect 1 monster with the Bug type',
    'type_collector',
    'type_count',
    1,
    'Bug',
    'fas fa-bug',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Bug Type Prize I", "level": 5}}
    ]'::jsonb,
    56
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
    'Bug Type Collector II',
    'Collect 5 monsters with the Bug type',
    'type_collector',
    'type_count',
    5,
    'Bug',
    'fas fa-bug',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    57
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
    'Bug Type Collector III',
    'Collect 10 monsters with the Bug type',
    'type_collector',
    'type_count',
    10,
    'Bug',
    'fas fa-bug',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Bug Type Prize III", "level": 15}}
    ]'::jsonb,
    58
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
    'Bug Type Collector IV',
    'Collect 20 monsters with the Bug type',
    'type_collector',
    'type_count',
    20,
    'Bug',
    'fas fa-bug',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    59
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
    'Bug Type Collector V',
    'Collect 100 monsters with the Bug type',
    'type_collector',
    'type_count',
    100,
    'Bug',
    'fas fa-bug',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Bug Type Master Prize", "level": 30}}
    ]'::jsonb,
    60
);

-- Rock Type Collector Achievements
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
    'Rock Type Collector I',
    'Collect 1 monster with the Rock type',
    'type_collector',
    'type_count',
    1,
    'Rock',
    'fas fa-gem',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Rock Type Prize I", "level": 5}}
    ]'::jsonb,
    61
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
    'Rock Type Collector II',
    'Collect 5 monsters with the Rock type',
    'type_collector',
    'type_count',
    5,
    'Rock',
    'fas fa-gem',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    62
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
    'Rock Type Collector III',
    'Collect 10 monsters with the Rock type',
    'type_collector',
    'type_count',
    10,
    'Rock',
    'fas fa-gem',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Rock Type Prize III", "level": 15}}
    ]'::jsonb,
    63
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
    'Rock Type Collector IV',
    'Collect 20 monsters with the Rock type',
    'type_collector',
    'type_count',
    20,
    'Rock',
    'fas fa-gem',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    64
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
    'Rock Type Collector V',
    'Collect 100 monsters with the Rock type',
    'type_collector',
    'type_count',
    100,
    'Rock',
    'fas fa-gem',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Rock Type Master Prize", "level": 30}}
    ]'::jsonb,
    65
);

-- Ghost Type Collector Achievements
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
    'Ghost Type Collector I',
    'Collect 1 monster with the Ghost type',
    'type_collector',
    'type_count',
    1,
    'Ghost',
    'fas fa-ghost',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Ghost Type Prize I", "level": 5}}
    ]'::jsonb,
    66
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
    'Ghost Type Collector II',
    'Collect 5 monsters with the Ghost type',
    'type_collector',
    'type_count',
    5,
    'Ghost',
    'fas fa-ghost',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    67
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
    'Ghost Type Collector III',
    'Collect 10 monsters with the Ghost type',
    'type_collector',
    'type_count',
    10,
    'Ghost',
    'fas fa-ghost',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Ghost Type Prize III", "level": 15}}
    ]'::jsonb,
    68
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
    'Ghost Type Collector IV',
    'Collect 20 monsters with the Ghost type',
    'type_collector',
    'type_count',
    20,
    'Ghost',
    'fas fa-ghost',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    69
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
    'Ghost Type Collector V',
    'Collect 100 monsters with the Ghost type',
    'type_collector',
    'type_count',
    100,
    'Ghost',
    'fas fa-ghost',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Ghost Type Master Prize", "level": 30}}
    ]'::jsonb,
    70
);

-- Dragon Type Collector Achievements
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
    'Dragon Type Collector I',
    'Collect 1 monster with the Dragon type',
    'type_collector',
    'type_count',
    1,
    'Dragon',
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Dragon Type Prize I", "level": 5}}
    ]'::jsonb,
    71
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
    'Dragon Type Collector II',
    'Collect 5 monsters with the Dragon type',
    'type_collector',
    'type_count',
    5,
    'Dragon',
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    72
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
    'Dragon Type Collector III',
    'Collect 10 monsters with the Dragon type',
    'type_collector',
    'type_count',
    10,
    'Dragon',
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Dragon Type Prize III", "level": 15}}
    ]'::jsonb,
    73
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
    'Dragon Type Collector IV',
    'Collect 20 monsters with the Dragon type',
    'type_collector',
    'type_count',
    20,
    'Dragon',
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    74
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
    'Dragon Type Collector V',
    'Collect 100 monsters with the Dragon type',
    'type_collector',
    'type_count',
    100,
    'Dragon',
    'fas fa-dragon',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Dragon Type Master Prize", "level": 30}}
    ]'::jsonb,
    75
);

-- Dark Type Collector Achievements
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
    'Dark Type Collector I',
    'Collect 1 monster with the Dark type',
    'type_collector',
    'type_count',
    1,
    'Dark',
    'fas fa-moon',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Dark Type Prize I", "level": 5}}
    ]'::jsonb,
    76
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
    'Dark Type Collector II',
    'Collect 5 monsters with the Dark type',
    'type_collector',
    'type_count',
    5,
    'Dark',
    'fas fa-moon',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    77
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
    'Dark Type Collector III',
    'Collect 10 monsters with the Dark type',
    'type_collector',
    'type_count',
    10,
    'Dark',
    'fas fa-moon',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Dark Type Prize III", "level": 15}}
    ]'::jsonb,
    78
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
    'Dark Type Collector IV',
    'Collect 20 monsters with the Dark type',
    'type_collector',
    'type_count',
    20,
    'Dark',
    'fas fa-moon',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    79
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
    'Dark Type Collector V',
    'Collect 100 monsters with the Dark type',
    'type_collector',
    'type_count',
    100,
    'Dark',
    'fas fa-moon',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Dark Type Master Prize", "level": 30}}
    ]'::jsonb,
    80
);

-- Steel Type Collector Achievements
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
    'Steel Type Collector I',
    'Collect 1 monster with the Steel type',
    'type_collector',
    'type_count',
    1,
    'Steel',
    'fas fa-cog',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Steel Type Prize I", "level": 5}}
    ]'::jsonb,
    81
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
    'Steel Type Collector II',
    'Collect 5 monsters with the Steel type',
    'type_collector',
    'type_count',
    5,
    'Steel',
    'fas fa-cog',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    82
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
    'Steel Type Collector III',
    'Collect 10 monsters with the Steel type',
    'type_collector',
    'type_count',
    10,
    'Steel',
    'fas fa-cog',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Steel Type Prize III", "level": 15}}
    ]'::jsonb,
    83
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
    'Steel Type Collector IV',
    'Collect 20 monsters with the Steel type',
    'type_collector',
    'type_count',
    20,
    'Steel',
    'fas fa-cog',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    84
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
    'Steel Type Collector V',
    'Collect 100 monsters with the Steel type',
    'type_collector',
    'type_count',
    100,
    'Steel',
    'fas fa-cog',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Steel Type Master Prize", "level": 30}}
    ]'::jsonb,
    85
);

-- Fairy Type Collector Achievements
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
    'Fairy Type Collector I',
    'Collect 1 monster with the Fairy type',
    'type_collector',
    'type_count',
    1,
    'Fairy',
    'fas fa-magic',
    '[
        {"type": "coin", "value": 50},
        {"type": "monster_random", "value": {"name": "Fairy Type Prize I", "level": 5}}
    ]'::jsonb,
    86
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
    'Fairy Type Collector II',
    'Collect 5 monsters with the Fairy type',
    'type_collector',
    'type_count',
    5,
    'Fairy',
    'fas fa-magic',
    '[
        {"type": "coin", "value": 250},
        {"type": "level", "value": 1}
    ]'::jsonb,
    87
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
    'Fairy Type Collector III',
    'Collect 10 monsters with the Fairy type',
    'type_collector',
    'type_count',
    10,
    'Fairy',
    'fas fa-magic',
    '[
        {"type": "coin", "value": 500},
        {"type": "monster_random", "value": {"name": "Fairy Type Prize III", "level": 15}}
    ]'::jsonb,
    88
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
    'Fairy Type Collector IV',
    'Collect 20 monsters with the Fairy type',
    'type_collector',
    'type_count',
    20,
    'Fairy',
    'fas fa-magic',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    89
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
    'Fairy Type Collector V',
    'Collect 100 monsters with the Fairy type',
    'type_collector',
    'type_count',
    100,
    'Fairy',
    'fas fa-magic',
    '[
        {"type": "coin", "value": 5000},
        {"type": "monster_random", "value": {"name": "Fairy Type Master Prize", "level": 30}}
    ]'::jsonb,
    90
);
