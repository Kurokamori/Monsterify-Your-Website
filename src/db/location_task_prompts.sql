-- Create location_task_prompts table
CREATE TABLE IF NOT EXISTS location_task_prompts (
    prompt_id SERIAL PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    prompt_text TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_location_task_prompts_location ON location_task_prompts(location);

-- Add some initial data for garden location
INSERT INTO location_task_prompts (location, prompt_text, difficulty) VALUES
('garden', 'Plant new seeds in the garden beds.', 'easy'),
('garden', 'Remove weeds and prepare soil for new plants.', 'normal'),
('garden', 'Harvest ripe vegetables and fruits from the garden.', 'normal'),
('garden', 'Prune overgrown plants and trees to encourage healthy growth.', 'hard');

-- Add some initial data for farm location
INSERT INTO location_task_prompts (location, prompt_text, difficulty) VALUES
('farm', 'Feed the animals and clean their pens.', 'easy'),
('farm', 'Repair fences and maintain farm equipment.', 'normal'),
('farm', 'Harvest crops from the fields before the weather turns.', 'normal'),
('farm', 'Train new farm animals and prepare them for work.', 'hard');

-- Add some initial data for pirates_dock location
INSERT INTO location_task_prompts (location, prompt_text, difficulty) VALUES
('pirates_dock', 'Swab the deck and clean the ship''s surfaces.', 'easy'),
('pirates_dock', 'Repair torn sails and damaged rigging.', 'normal'),
('pirates_dock', 'Navigate through stormy waters to reach a hidden cove.', 'hard'),
('pirates_dock', 'Defend the ship against rival pirates attempting to board.', 'hard');
