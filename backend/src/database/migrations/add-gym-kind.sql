-- Adds the gym_kind classification to the gyms table.
--
-- gym_kind values:
--   'ai'       - standalone AI battle / gauntlet, awards no badge
--   'gym'      - standard badge gym
--   'league'   - elite battle awarding a league badge (unlocked after all gym badges)
--   'champion' - final battle awarding the special champion badge
--                (unlocked after all gym badges + all league badges)
--
-- Existing rows are backfilled from the legacy is_gym flag:
--   is_gym = TRUE  -> 'gym'
--   is_gym = FALSE -> 'ai'
--
-- Applied automatically at startup by the migration runner (src/database/migrate.ts).
-- Idempotent, so it is safe to re-run and safe to delete once applied everywhere.

ALTER TABLE gyms ADD COLUMN IF NOT EXISTS gym_kind TEXT;

UPDATE gyms
SET gym_kind = CASE WHEN is_gym = FALSE THEN 'ai' ELSE 'gym' END
WHERE gym_kind IS NULL;

ALTER TABLE gyms ALTER COLUMN gym_kind SET DEFAULT 'gym';
