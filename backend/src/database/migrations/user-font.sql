-- Add font preference column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS font VARCHAR(50) DEFAULT NULL;
