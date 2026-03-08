/**
 * Mission Reward Types
 * Shared types for mission reward configuration and summaries
 */

// ── Reward Config (stored on missions table) ────────────────────────────────

export type MissionItemRewardEntry = {
  /** Static item by name */
  itemName?: string;
  /** Static item by ID */
  itemId?: number;
  /** Random from this item category (berries, balls, items, etc.) */
  category?: string;
  /** Random from a specific pool of item IDs */
  itemPool?: number[];
  /** Quantity to award (default 1) */
  quantity?: number;
  /** Chance percentage 0-100 (default 100) */
  chance?: number;
};

export type MissionRewardConfig = {
  /** Levels awarded to deployed monsters — fixed number or random range */
  levels?: number | { min: number; max: number };
  /** Coins awarded to trainers — fixed number or random range */
  coins?: number | { min: number; max: number };
  /** Item rewards */
  items?: MissionItemRewardEntry[];
};

// ── Reward Summary (stored on user_missions after claiming) ──────────────────

export type MissionRewardSummaryMonster = {
  monsterId: number;
  name: string;
  levelsGained: number;
  newLevel: number;
  capped: boolean;
  excessLevels: number;
};

export type MissionRewardSummaryTrainer = {
  trainerId: number;
  name: string;
  coinsGained: number;
};

export type MissionRewardSummaryItem = {
  itemName: string;
  quantity: number;
  category?: string;
  wasRandom: boolean;
  trainerId?: number;
  trainerName?: string;
};

export type MissionRewardSummaryReallocation = {
  targetType: 'monster' | 'trainer';
  targetId: number;
  targetName: string;
  levels: number;
};

export type MissionRewardSummary = {
  totalLevels: number;
  totalCoins: number;
  monsters: MissionRewardSummaryMonster[];
  trainers: MissionRewardSummaryTrainer[];
  items: MissionRewardSummaryItem[];
  reallocations: MissionRewardSummaryReallocation[];
};

// ── Claim Input ──────────────────────────────────────────────────────────────

export type LevelAllocationInput = {
  targetType: 'monster' | 'trainer';
  targetId: number;
  levels: number;
};

export type ItemTrainerAssignment = {
  itemIndex: number;
  trainerId: number;
};
