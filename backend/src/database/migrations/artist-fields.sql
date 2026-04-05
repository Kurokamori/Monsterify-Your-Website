-- Add artist attribution fields to trainers and monsters

-- Trainer: artist for main reference image
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS main_ref_artist TEXT DEFAULT NULL;

-- Monster: artist for main reference image and mega reference image
ALTER TABLE monsters ADD COLUMN IF NOT EXISTS main_ref_artist TEXT DEFAULT NULL;
ALTER TABLE monsters ADD COLUMN IF NOT EXISTS mega_ref_artist TEXT DEFAULT NULL;
