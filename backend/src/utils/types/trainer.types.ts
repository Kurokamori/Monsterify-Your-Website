/**
 * Trainer Type Definitions
 * Types for player characters (trainers) and their inventory
 */

import { BaseEntity, NumberRecord } from './common.types';
import { ItemCategoryValue } from '../constants/item-categories';

/**
 * Full trainer entity
 */
export interface Trainer extends BaseEntity {
  playerUserId: string;
  name: string;
  level: number;
  currencyAmount: number;
  totalEarnedCurrency: number;
  imgLink: string | null;
  additionalRefs: string[];
  bio: string | null;
}

/**
 * Trainer with computed fields (for API responses)
 */
export interface TrainerWithStats extends Trainer {
  monsterCount: number;
  monsterRefCount: number;
  monsterRefPercent: number;
  playerDisplayName: string | null;
  playerUsername: string;
}

/**
 * Trainer summary (minimal info for listings)
 */
export interface TrainerSummary {
  id: number;
  name: string;
  level: number;
  imgLink: string | null;
  playerUsername: string;
}

/**
 * Input for creating a new trainer
 */
export interface TrainerCreateInput {
  playerUserId: string;
  name: string;
  imgLink?: string;
  bio?: string;
}

/**
 * Input for updating a trainer
 */
export interface TrainerUpdateInput {
  name?: string;
  imgLink?: string | null;
  bio?: string | null;
  additionalRefs?: string[];
}

/**
 * Trainer inventory structure
 * Each category maps item names to quantities
 */
export interface TrainerInventory {
  trainerId: number;
  items: NumberRecord;
  balls: NumberRecord;
  berries: NumberRecord;
  pastries: NumberRecord;
  evolution: NumberRecord;
  eggs: NumberRecord;
  antiques: NumberRecord;
  heldItems: NumberRecord;
  seals: NumberRecord;
  keyItems: NumberRecord;
}

/**
 * Default empty inventory
 */
export const DEFAULT_TRAINER_INVENTORY: Omit<TrainerInventory, 'trainerId'> = {
  items: {},
  balls: {},
  berries: {},
  pastries: {},
  evolution: {},
  eggs: {},
  antiques: {},
  heldItems: {},
  seals: {},
  keyItems: {},
};

/**
 * Map of item category to inventory field name
 */
export const CATEGORY_TO_INVENTORY_FIELD: Record<ItemCategoryValue, keyof Omit<TrainerInventory, 'trainerId'>> = {
  items: 'items',
  balls: 'balls',
  berries: 'berries',
  pastries: 'pastries',
  evolution: 'evolution',
  eggs: 'eggs',
  antiques: 'antiques',
  helditems: 'heldItems',
  seals: 'seals',
  keyitems: 'keyItems',
};

/**
 * Inventory item with full details
 */
export interface InventoryItem {
  name: string;
  quantity: number;
  category: ItemCategoryValue;
}

/**
 * Input for adding items to inventory
 */
export interface AddItemInput {
  trainerId: number;
  itemName: string;
  category: ItemCategoryValue;
  quantity: number;
}

/**
 * Input for removing items from inventory
 */
export interface RemoveItemInput {
  trainerId: number;
  itemName: string;
  category: ItemCategoryValue;
  quantity: number;
}

/**
 * Result of inventory operation
 */
export interface InventoryOperationResult {
  success: boolean;
  newQuantity: number;
  message?: string;
}

/**
 * Trainer currency transaction
 */
export interface CurrencyTransaction {
  id: number;
  trainerId: number;
  amount: number; // Positive for gain, negative for spend
  reason: string;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Input for currency operations
 */
export interface CurrencyOperationInput {
  trainerId: number;
  amount: number;
  reason: string;
}

/**
 * Trainer level up result
 */
export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  rewards?: {
    currency?: number;
    items?: InventoryItem[];
  };
}

/**
 * Trainer achievement
 */
export interface TrainerAchievement {
  id: number;
  trainerId: number;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  completed: boolean;
}

/**
 * Achievement definition
 */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: number;
  reward?: {
    currency?: number;
    items?: Array<{
      name: string;
      category: ItemCategoryValue;
      quantity: number;
    }>;
  };
  iconUrl?: string;
}

/**
 * Trainer party slot (for battle party)
 */
export interface PartySlot {
  position: number; // 1-6
  monsterId: number | null;
}

/**
 * Trainer party configuration
 */
export interface TrainerParty {
  trainerId: number;
  slots: PartySlot[];
}

/**
 * Trainer box view filter
 */
export interface BoxViewFilter {
  boxNumber?: number;
  typeFilter?: string;
  searchQuery?: string;
  sortBy?: 'name' | 'level' | 'species' | 'dateAdded';
  sortDirection?: 'asc' | 'desc';
}
