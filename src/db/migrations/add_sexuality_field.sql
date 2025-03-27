-- Add sexuality field to trainers table
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS sexuality text;
