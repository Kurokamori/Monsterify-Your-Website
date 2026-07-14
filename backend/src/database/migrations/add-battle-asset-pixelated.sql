-- Adds the per-asset `pixelated` flag to battle_assets.
--
-- When TRUE, the asset is drawn with nearest-neighbour scaling
-- (CSS `image-rendering: pixelated`) so pixel-art backgrounds, place-spots and
-- text-box skins stay crisp instead of being smoothed by the browser's default
-- bilinear filter. Existing assets keep the smooth default.
--
-- Applied automatically at startup by the migration runner (src/database/migrate.ts).
-- Idempotent, so it is safe to re-run and safe to delete once applied everywhere.

ALTER TABLE battle_assets ADD COLUMN IF NOT EXISTS pixelated BOOLEAN NOT NULL DEFAULT FALSE;
