/**
 * Location Activity Types
 * TypeScript types for the town activities system.
 */

import type { LocationId, ActivityId } from '../constants/location-constants';

// ============================================================================
// Session Types
// ============================================================================

export type SessionStatus = 'active' | 'completed' | 'cleared';

export type ActivitySessionRow = {
  id: string;
  session_id: string;
  player_id: string;
  location: string;
  activity: string;
  prompt_id: number;
  difficulty: string;
  completed: boolean;
  rewards: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ActivitySession = {
  id: string;
  session_id: string;
  player_id: string;
  location: LocationId;
  activity: ActivityId;
  prompt_id: number;
  difficulty: string;
  status: SessionStatus;
  rewards: ActivityReward[];
  created_at: string;
  completed_at: string | null;
};

// ============================================================================
// Reward Types
// ============================================================================

export type RewardType = 'coin' | 'item' | 'level' | 'monster';

export type CoinRewardData = {
  amount: number;
  title: string;
};

export type ItemRewardData = {
  name: string;
  quantity: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string;
  effect: string | null;
};

export type LevelRewardData = {
  levels: number;
  isMonster: boolean;
  title: string;
  monster_id?: number;
  monster_name?: string;
};

export type MonsterRewardData = {
  level: number;
  title: string;
  rolled_monster: Record<string, unknown>;
  monster_name: string;
  monster_species: string;
  monster_image: string | null;
  species1: string | null;
  species2: string | null;
  species3: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  monster_type: string | null;
  species_image_url: string | null;
  species1_image: string | null;
  species2_image: string | null;
  species3_image: string | null;
  monster_id?: number;
  allowed_types?: string[] | null;
  is_legendary?: boolean;
};

export type RewardData = CoinRewardData | ItemRewardData | LevelRewardData | MonsterRewardData;

export type ActivityReward = {
  id: string;
  type: RewardType;
  reward_type: RewardType;
  rarity: string;
  reward_data: RewardData;
  assigned_to: number | null;
  claimed: boolean;
  claimed_by?: number;
  claimed_at?: string;
};

// ============================================================================
// Prompt Types
// ============================================================================

export type LocationPromptRow = {
  id: number;
  location: string;
  activity: string;
  prompt_text: string;
  difficulty: string | null;
  created_at: Date;
  updated_at: Date;
};

export type LocationPrompt = LocationPromptRow;

export type LocationPromptCreateInput = {
  location: string;
  activity: string;
  prompt_text: string;
  difficulty?: string | null;
};

export type LocationPromptUpdateInput = {
  prompt_text?: string;
  difficulty?: string | null;
};

// ============================================================================
// Flavor Types
// ============================================================================

export type LocationFlavorRow = {
  id: number;
  location: string;
  image_url: string | null;
  flavor_text: string | null;
  created_at: Date;
  updated_at: Date;
};

export type LocationFlavor = LocationFlavorRow;

export type LocationFlavorCreateInput = {
  location: string;
  image_url?: string | null;
  flavor_text?: string | null;
};

export type LocationFlavorUpdateInput = {
  image_url?: string | null;
  flavor_text?: string | null;
};

// ============================================================================
// Claim Result
// ============================================================================

export type ClaimResult = {
  success: boolean;
  reward: ActivityReward;
  message?: string;
};
