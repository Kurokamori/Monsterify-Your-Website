-- Create boss reward templates table
CREATE TABLE boss_reward_templates (
    template_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    coins INTEGER DEFAULT 0,
    levels INTEGER DEFAULT 0,
    items JSONB DEFAULT '{"items":[]}',
    monsters JSONB DEFAULT '{"monsters":[]}',
    is_top_damager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_boss_reward_templates_is_top_damager ON boss_reward_templates (is_top_damager);

-- Create table to associate templates with bosses
CREATE TABLE boss_template_assignments (
    assignment_id SERIAL PRIMARY KEY,
    boss_id INTEGER NOT NULL REFERENCES bosses(boss_id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES boss_reward_templates(template_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(boss_id, template_id)
);

-- Create index for faster lookups
CREATE INDEX idx_boss_template_assignments_boss_id ON boss_template_assignments (boss_id);
