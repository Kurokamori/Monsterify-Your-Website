-- Monster "Can Talk" progression system and Prompt monster conditions
-- can_talk: 0 = Unable to Speak, 1 = Knows Some Letters, 2 = Forming Simple Words, 3 = Able to Converse
-- can_talk_descriptor: User-selectable flavor text from level-appropriate options
-- monster_conditions: JSON array of conditions that check/modify participating monsters

ALTER TABLE monsters ADD COLUMN IF NOT EXISTS can_talk INTEGER DEFAULT 0;
ALTER TABLE monsters ADD COLUMN IF NOT EXISTS can_talk_descriptor VARCHAR(100) DEFAULT NULL;

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS monster_conditions TEXT DEFAULT NULL;
