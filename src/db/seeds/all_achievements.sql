-- Master file for seeding all achievements
-- This file includes all achievement categories

-- First, clear existing achievements
DELETE FROM achievements;

-- Include level achievements
\i src/db/seeds/level_achievements.sql

-- Include type collector achievements
\i src/db/seeds/all_type_collector_achievements.sql

-- Include monster collector achievements
\i src/db/seeds/monster_collector_achievements.sql

-- Include attribute collector achievements
\i src/db/seeds/digimon_attribute_collector_achievements.sql

-- Include currency achievements
\i src/db/seeds/currency_achievements.sql

-- Log completion
SELECT 'Achievement seeding completed successfully' AS message;
