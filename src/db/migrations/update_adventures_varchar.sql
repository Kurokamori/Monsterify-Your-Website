-- Update the thread_id and channel_id columns to use VARCHAR(100) instead of VARCHAR(20)
ALTER TABLE adventures ALTER COLUMN thread_id TYPE VARCHAR(100);
ALTER TABLE adventures ALTER COLUMN channel_id TYPE VARCHAR(100);

-- Add owner to table
ALTER TABLE adventures OWNER TO u3f7f8n9i5oagn;
