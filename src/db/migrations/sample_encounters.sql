-- Insert sample encounters for testing
-- These will be associated with the first area in each region

-- Get the first area ID from each region
WITH first_areas AS (
    SELECT DISTINCT ON (region_id) area_id
    FROM areas
    ORDER BY region_id, area_id
)

-- Insert monster encounters
INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'monster', 'A wild Fluffytail appears! It looks curious and friendly.', 'common'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'monster' AND rarity = 'common' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'monster', 'A Shadowpaw lurks in the darkness. It seems cautious but not immediately hostile.', 'uncommon'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'monster' AND rarity = 'uncommon' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'monster', 'A majestic Crystalhorn stands before you, its antlers glowing with an ethereal light. This is a rare and powerful creature!', 'rare'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'monster' AND rarity = 'rare' AND area_id IN (SELECT area_id FROM first_areas)
);

-- Insert NPC encounters
INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'npc', 'A friendly traveler approaches. "Greetings! I\'ve been exploring these parts for days. Perhaps I can share some information with you?"', 'common'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'npc' AND rarity = 'common' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'npc', 'A mysterious merchant appears with a cart full of unusual items. "Care to trade, stranger? I have wares from distant lands."', 'uncommon'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'npc' AND rarity = 'uncommon' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'npc', 'An ancient sage sits in meditation. As you approach, their eyes open, glowing with wisdom. "I\'ve been waiting for you. There is much I must tell you about this world."', 'rare'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'npc' AND rarity = 'rare' AND area_id IN (SELECT area_id FROM first_areas)
);

-- Insert obstacle encounters
INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'obstacle', 'A fallen tree blocks your path. It doesn\'t look too difficult to climb over or go around.', 'common'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'obstacle' AND rarity = 'common' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'obstacle', 'A swift river cuts across your path. You\'ll need to find a way across, perhaps by building a raft or finding a narrow point to jump.', 'uncommon'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'obstacle' AND rarity = 'uncommon' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'obstacle', 'A massive chasm stretches before you, with strange energy swirling in its depths. Crossing this will require exceptional skill or creativity.', 'rare'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'obstacle' AND rarity = 'rare' AND area_id IN (SELECT area_id FROM first_areas)
);

-- Insert treasure encounters
INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'treasure', 'You spot a small pouch half-buried in the ground. It contains a handful of coins and a simple trinket.', 'common'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'treasure' AND rarity = 'common' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'treasure', 'Hidden behind a waterfall, you discover a chest containing valuable items and a map fragment.', 'uncommon'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'treasure' AND rarity = 'uncommon' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'treasure', 'In an ancient ruin, you uncover a hidden chamber with a pedestal. On it rests a legendary artifact of great power!', 'rare'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'treasure' AND rarity = 'rare' AND area_id IN (SELECT area_id FROM first_areas)
);

-- Insert weather encounters
INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'weather', 'A light rain begins to fall. The gentle patter on leaves creates a peaceful atmosphere.', 'common'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'weather' AND rarity = 'common' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'weather', 'Dark clouds gather overhead, and a thunderstorm breaks out. You\'ll need to find shelter soon.', 'uncommon'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'weather' AND rarity = 'uncommon' AND area_id IN (SELECT area_id FROM first_areas)
);

INSERT INTO encounters (area_id, type, content, rarity)
SELECT area_id, 'weather', 'The sky turns an unnatural color, and elemental energy crackles in the air. This magical storm is both beautiful and dangerous.', 'rare'
FROM first_areas
WHERE NOT EXISTS (
    SELECT 1 FROM encounters WHERE type = 'weather' AND rarity = 'rare' AND area_id IN (SELECT area_id FROM first_areas)
);
