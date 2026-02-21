// Shared types for prompt submissions

export interface Trainer {
  id: string | number;
  name: string;
  is_owned?: boolean;
}

export interface Monster {
  id: string | number;
  name: string;
  trainer_id: string | number;
}

export interface PromptRewards {
  levels?: number;
  coins?: number;
  items?: unknown[];
  monsters?: unknown[];
  monster_roll?: { enabled: boolean };
  [key: string]: unknown;
}

export interface Prompt {
  id: string | number;
  title: string;
  description: string;
  type?: string;
  difficulty?: string;
  event_name?: string;
  rewards?: string | PromptRewards;
  max_submissions_per_trainer?: number;
}

export interface Submission {
  title: string;
  submissionType: 'art' | 'writing';
}

export interface PromptSubmission {
  id: number;
}

export interface TrainerReward {
  trainerName: string;
  levels: number;
}

export interface MonsterReward {
  monsterName: string;
  levels: number;
}

export interface ArtWritingRewards {
  trainerRewards?: TrainerReward[];
  monsterRewards?: MonsterReward[];
  totalCoins?: number;
  totalGiftLevels?: number;
}

export interface PromptItem {
  icon?: string;
  item_name?: string;
  display?: string;
  quantity?: number;
}

export interface UnclaimedMonster {
  species1: string;
  img_link?: string;
  type1?: string;
  type2?: string;
  attribute?: string;
  claimed?: boolean;
  final_name?: string;
}

export interface PromptRewardsData {
  levels?: number;
  coins?: number;
  items?: PromptItem[];
  monsters?: UnclaimedMonster[];
}

export interface SubmissionResult {
  submission?: Submission;
  promptSubmission?: PromptSubmission;
  artWritingRewards?: ArtWritingRewards;
  promptRewards?: PromptRewardsData;
  hasGiftLevels?: boolean;
  hasLevelCaps?: boolean;
  cappedMonsters?: Array<{
    monsterId: number;
    name?: string;
    species1?: string;
    img_link?: string;
    image_url?: string;
    currentLevel: number;
    originalLevels: number;
    excessLevels: number;
    trainerName?: string;
  }>;
}

