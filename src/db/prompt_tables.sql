-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
    prompt_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'progression', 'legendary', 'event', 'monthly')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    min_trainer_level INTEGER DEFAULT 0,
    month VARCHAR(20), -- For monthly prompts (January, February, etc.)
    repeatable BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    reward_coins INTEGER DEFAULT 0,
    reward_levels INTEGER DEFAULT 0,
    reward_items JSONB, -- Specific items to reward: [{"name": "Item Name", "quantity": 1}]
    reward_random_items JSONB, -- Random items from categories: {"category": "quantity", "BERRIES": 2, "ITEMS": 1}
    reward_monster_params JSONB, -- Parameters for MonsterRoller
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_month ON prompt_templates(month);

-- Create prompt_completions table to track which trainers have completed which prompts
CREATE TABLE IF NOT EXISTS prompt_completions (
    completion_id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompt_templates(prompt_id) ON DELETE CASCADE,
    trainer_id INTEGER NOT NULL,
    submission_url TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rewards_claimed BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_completions_prompt_id ON prompt_completions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_completions_trainer_id ON prompt_completions(trainer_id);

-- Create unique constraint to prevent duplicate completions for non-repeatable prompts
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_prompt_completion 
ON prompt_completions(prompt_id, trainer_id) 
WHERE (SELECT repeatable FROM prompt_templates WHERE prompt_id = prompt_completions.prompt_id) = FALSE;