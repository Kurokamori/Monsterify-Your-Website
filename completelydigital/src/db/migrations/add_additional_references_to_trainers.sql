-- Add additional_references column to trainers table
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS additional_references TEXT;
