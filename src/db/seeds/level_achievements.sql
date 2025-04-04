-- Level-up achievements (one for every 100 levels from 100 to 2000)
-- Each achievement rewards coins and a random item

-- Level 100 Achievement
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
    'Level 100 Milestone',
    'Reach trainer level 100',
    'level',
    'level',
    100,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 1}
    ]'::jsonb,
    1
);

-- Level 200 Achievement
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
    'Level 200 Milestone',
    'Reach trainer level 200',
    'level',
    'level',
    200,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 2000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    2
);

-- Level 300 Achievement
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
    'Level 300 Milestone',
    'Reach trainer level 300',
    'level',
    'level',
    300,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 3000},
        {"type": "level", "value": 3}
    ]'::jsonb,
    3
);

-- Level 400 Achievement
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
    'Level 400 Milestone',
    'Reach trainer level 400',
    'level',
    'level',
    400,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 4000},
        {"type": "level", "value": 4}
    ]'::jsonb,
    4
);

-- Level 500 Achievement
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
    'Level 500 Milestone',
    'Reach trainer level 500',
    'level',
    'level',
    500,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 5000},
        {"type": "level", "value": 5},
        {"type": "monster_random", "value": {"name": "Level 500 Prize", "level": 25}}
    ]'::jsonb,
    5
);

-- Level 600 Achievement
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
    'Level 600 Milestone',
    'Reach trainer level 600',
    'level',
    'level',
    600,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 6000},
        {"type": "level", "value": 6}
    ]'::jsonb,
    6
);

-- Level 700 Achievement
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
    'Level 700 Milestone',
    'Reach trainer level 700',
    'level',
    'level',
    700,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 7000},
        {"type": "level", "value": 7}
    ]'::jsonb,
    7
);

-- Level 800 Achievement
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
    'Level 800 Milestone',
    'Reach trainer level 800',
    'level',
    'level',
    800,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 8000},
        {"type": "level", "value": 8}
    ]'::jsonb,
    8
);

-- Level 900 Achievement
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
    'Level 900 Milestone',
    'Reach trainer level 900',
    'level',
    'level',
    900,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 9000},
        {"type": "level", "value": 9}
    ]'::jsonb,
    9
);

-- Level 1000 Achievement
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
    'Level 1000 Milestone',
    'Reach trainer level 1000',
    'level',
    'level',
    1000,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 10000},
        {"type": "level", "value": 10},
        {"type": "monster_random", "value": {"name": "Milestone Monster", "level": 50}}
    ]'::jsonb,
    10
);

-- Level 1100 Achievement
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
    'Level 1100 Milestone',
    'Reach trainer level 1100',
    'level',
    'level',
    1100,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 11000},
        {"type": "level", "value": 11}
    ]'::jsonb,
    11
);

-- Level 1200 Achievement
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
    'Level 1200 Milestone',
    'Reach trainer level 1200',
    'level',
    'level',
    1200,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 12000},
        {"type": "level", "value": 12}
    ]'::jsonb,
    12
);

-- Level 1300 Achievement
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
    'Level 1300 Milestone',
    'Reach trainer level 1300',
    'level',
    'level',
    1300,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 13000},
        {"type": "level", "value": 13}
    ]'::jsonb,
    13
);

-- Level 1400 Achievement
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
    'Level 1400 Milestone',
    'Reach trainer level 1400',
    'level',
    'level',
    1400,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 14000},
        {"type": "level", "value": 14}
    ]'::jsonb,
    14
);

-- Level 1500 Achievement
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
    'Level 1500 Milestone',
    'Reach trainer level 1500',
    'level',
    'level',
    1500,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 15000},
        {"type": "level", "value": 15},
        {"type": "monster_random", "value": {"name": "Milestone Monster", "level": 75}}
    ]'::jsonb,
    15
);

-- Level 1600 Achievement
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
    'Level 1600 Milestone',
    'Reach trainer level 1600',
    'level',
    'level',
    1600,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 16000},
        {"type": "level", "value": 16}
    ]'::jsonb,
    16
);

-- Level 1700 Achievement
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
    'Level 1700 Milestone',
    'Reach trainer level 1700',
    'level',
    'level',
    1700,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 17000},
        {"type": "level", "value": 17}
    ]'::jsonb,
    17
);

-- Level 1800 Achievement
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
    'Level 1800 Milestone',
    'Reach trainer level 1800',
    'level',
    'level',
    1800,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 18000},
        {"type": "level", "value": 18}
    ]'::jsonb,
    18
);

-- Level 1900 Achievement
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
    'Level 1900 Milestone',
    'Reach trainer level 1900',
    'level',
    'level',
    1900,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 19000},
        {"type": "level", "value": 19}
    ]'::jsonb,
    19
);

-- Level 2000 Achievement
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
    'Level 2000 Milestone',
    'Reach trainer level 2000',
    'level',
    'level',
    2000,
    'fas fa-level-up-alt',
    '[
        {"type": "coin", "value": 20000},
        {"type": "level", "value": 20},
        {"type": "monster_random", "value": {"name": "Ultimate Milestone Monster", "level": 100}}
    ]'::jsonb,
    20
);
