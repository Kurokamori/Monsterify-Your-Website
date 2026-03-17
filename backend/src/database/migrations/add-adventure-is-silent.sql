-- Add is_silent column to adventures table
-- Silent adventures are created via /adventure here in Discord and don't appear on the website
ALTER TABLE adventures ADD COLUMN IF NOT EXISTS is_silent BOOLEAN NOT NULL DEFAULT false;
