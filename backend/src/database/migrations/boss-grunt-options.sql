-- Migration: Support multiple grunt monster options per boss
-- The grunt_monster_data column on bosses already stores JSON.
-- We change it from a single object to an array of objects.
-- Existing single-object values are migrated to single-element arrays.

-- 1. Convert existing grunt_monster_data from object to array
UPDATE bosses
SET grunt_monster_data = json_build_array(grunt_monster_data::json)::text
WHERE grunt_monster_data IS NOT NULL
  AND grunt_monster_data NOT LIKE '[%';

-- 2. Add grunt_index column to boss_reward_claims
-- Stores which grunt option (array index) was randomly assigned to this player
ALTER TABLE boss_reward_claims
ADD COLUMN IF NOT EXISTS grunt_index integer DEFAULT NULL;
