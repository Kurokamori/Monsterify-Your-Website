-- Currency achievements
-- Rewards for earning and spending currency

-- Currency Earned Achievements
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
    'Currency Collector I',
    'Earn a total of 1,000 coins',
    'currency_earned',
    'currency_earned',
    1000,
    'fas fa-coins',
    '[
        {"type": "level", "value": 1},
        {"type": "monster_random", "value": {"name": "Currency Collector Prize I", "level": 10}}
    ]'::jsonb,
    1
);

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
    'Currency Collector II',
    'Earn a total of 10,000 coins',
    'currency_earned',
    'currency_earned',
    10000,
    'fas fa-coins',
    '[
        {"type": "level", "value": 3},
        {"type": "monster_random", "value": {"name": "Currency Collector Prize II", "level": 20}}
    ]'::jsonb,
    2
);

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
    'Currency Collector III',
    'Earn a total of 100,000 coins',
    'currency_earned',
    'currency_earned',
    100000,
    'fas fa-coins',
    '[
        {"type": "level", "value": 5},
        {"type": "monster_random", "value": {"name": "Currency Collector Prize III", "level": 40}}
    ]'::jsonb,
    3
);

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
    'Currency Collector IV',
    'Earn a total of 1,000,000 coins',
    'currency_earned',
    'currency_earned',
    1000000,
    'fas fa-coins',
    '[
        {"type": "level", "value": 10},
        {"type": "monster_random", "value": {"name": "Golden Prize", "level": 50}}
    ]'::jsonb,
    4
);

-- Currency Spent Achievements
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
    'Big Spender I',
    'Spend a total of 1,000 coins',
    'currency_spent',
    'currency_spent',
    1000,
    'fas fa-shopping-cart',
    '[
        {"type": "coin", "value": 100},
        {"type": "level", "value": 1}
    ]'::jsonb,
    1
);

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
    'Big Spender II',
    'Spend a total of 10,000 coins',
    'currency_spent',
    'currency_spent',
    10000,
    'fas fa-shopping-cart',
    '[
        {"type": "coin", "value": 1000},
        {"type": "level", "value": 2}
    ]'::jsonb,
    2
);

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
    'Big Spender III',
    'Spend a total of 100,000 coins',
    'currency_spent',
    'currency_spent',
    100000,
    'fas fa-shopping-cart',
    '[
        {"type": "coin", "value": 10000},
        {"type": "level", "value": 3},
        {"type": "monster_random", "value": {"name": "Big Spender Prize", "level": 25}}
    ]'::jsonb,
    3
);

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
    'Big Spender IV',
    'Spend a total of 1,000,000 coins',
    'currency_spent',
    'currency_spent',
    1000000,
    'fas fa-shopping-cart',
    '[
        {"type": "coin", "value": 100000},
        {"type": "level", "value": 5},
        {"type": "monster_random", "value": {"name": "Master Spender Prize", "level": 50}}
    ]'::jsonb,
    4
);
