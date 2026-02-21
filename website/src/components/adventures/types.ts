// Adventure Component Types

// Adventure Status
export type AdventureStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// Adventure Type
export type AdventureType = 'custom' | 'prebuilt';

// Creator
export interface Creator {
  id: number;
  name: string;
  user_id?: string;
}

// Adventure
export interface Adventure {
  id: number;
  title: string;
  description: string;
  status: AdventureStatus;
  creator: Creator;
  max_encounters: number;
  current_encounter_count: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  participants_count: number;
  encounters?: AdventureEncounter[];
}

// Adventure Encounter
export interface AdventureEncounter {
  id: number;
  title: string;
  description: string;
}

// Landmass
export interface Landmass {
  id: number | string;
  name: string;
}

// Region
export interface Region {
  id: number | string;
  name: string;
  landmass_id?: number | string;
}

// Area
export interface Area {
  id: number | string;
  name: string;
  welcomeMessage?: string;
  region_id?: number | string;
}

// Area Requirements
export interface AreaRequirements {
  needsMissionMandate?: boolean;
  itemRequired?: string;
}

// Trainer (for adventure context)
export interface Trainer {
  id: number;
  name: string;
  level: number;
}

// User Inventory
export interface UserInventory {
  keyitems?: KeyItem[];
  keyItems?: KeyItem[];
  key_items?: KeyItem[];
}

export interface KeyItem {
  name?: string;
  item_name?: string;
  itemName?: string;
  quantity?: number;
  amount?: number;
}

// Adventure Creation Form Data
export interface AdventureFormData {
  title: string;
  description: string;
  threadEmoji: string;
  adventureType: AdventureType;
  landmass: string;
  region: string;
  area: string;
  selectedTrainer: string;
}

// Monster (for team selection)
export interface Monster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  level: number;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  image_path?: string;
  trainer_id?: number;
  stats: MonsterStats;
}

export interface MonsterStats {
  hp: number;
  attack: number;
  defense: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
}

// Reward Types
export interface UnclaimedReward {
  id: number;
  adventure_title: string;
  word_count: number;
  levels_earned: number;
  coins_earned: number;
  items_earned: RewardItem[];
  created_at: string;
}

export interface RewardItem {
  name: string;
  description?: string;
  rarity?: string;
}

// Allocation Types
export interface LevelAllocation {
  id: number;
  entityType: 'trainer' | 'monster';
  entityId: number;
  entityName: string;
  levels: number;
  trainerInfo?: {
    trainerId: number;
    trainerName: string;
  };
}

export interface CoinAllocation {
  id: number;
  trainerId: number;
  trainerName: string;
  coins: number;
}

// Boss Types
export interface Boss {
  id: number;
  name: string;
  description?: string;
  status: string;
  month: number;
  year: number;
  start_date?: string;
  current_hp: number;
  total_hp: number;
  healthPercentage: number;
  image_url?: string;
}

export interface LeaderboardEntry {
  discord_user_id?: string;
  trainer_name?: string;
  username?: string;
  total_damage: number;
}

export interface BossData {
  boss: Boss;
  leaderboard: LeaderboardEntry[];
}

// Filter Types
export type StatusFilter = 'all' | AdventureStatus;
export type SortOption = 'newest' | 'oldest' | 'most_participants' | 'most_encounters';

// Emoji Presets
export const EMOJI_PRESETS = ['🗡️', '⚔️', '🏹', '🛡️', '🌟', '🔥', '❄️', '⚡', '🌊', '🌿', '🏔️', '🌋'];

// Utility Functions
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }

  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getHealthBarColor = (percentage: number): string => {
  if (percentage > 60) return 'var(--success-color)';
  if (percentage > 30) return 'var(--warning-color)';
  return 'var(--error-color)';
};
