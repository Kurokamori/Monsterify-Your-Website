/**
 * Town Component Types
 * Types for activity sessions, adoptions, and town features
 */

import type { Monster } from '../../common/MonsterDetails';

// Base trainer type for town components
export interface TownTrainer {
  id: number | string;
  name: string;
  discord_id?: string;
  main_ref?: string;
  level?: number;
}

// Activity Session Types
export interface ActivitySession {
  session_id: string;
  location: string;
  activity: string;
  created_at?: string;
  expires_at?: string;
  status?: 'active' | 'completed' | 'expired';
}

export interface ActivityPrompt {
  id?: number;
  prompt_text: string;
  activity_type?: string;
}

export interface ActivityFlavor {
  id?: number;
  flavor_text: string;
  image_url?: string;
  npc_name?: string;
}

// Reward Types
export type RewardType = 'coin' | 'level' | 'item' | 'monster' | 'points' | 'custom';
export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';

export interface BaseReward {
  id: number | string;
  type: RewardType;
  rarity?: RewardRarity;
  claimed?: boolean;
  claimed_by?: number | string;
  claimed_at?: string;
  assigned_to?: number | string;
  forfeited?: boolean;
}

export interface CoinReward extends BaseReward {
  type: 'coin';
  reward_data: {
    amount: number;
    title?: string;
  };
}

export interface LevelReward extends BaseReward {
  type: 'level';
  reward_data: {
    levels: number;
    title?: string;
  };
}

export interface ItemReward extends BaseReward {
  type: 'item';
  reward_data: {
    name: string;
    quantity: number;
    item_id?: number;
    category?: string;
    title?: string;
  };
}

export interface MonsterRewardData {
  species?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  monster_id?: number;
  monster_name?: string;
  monster_species?: string;
  monster_image?: string;
  img_link?: string;
  image_url?: string;
  species1_image?: string;
  species2_image?: string;
  species3_image?: string;
  is_mystery_roll?: boolean;
  rolled_monster?: Monster;
  title?: string;
}

export interface MonsterReward extends BaseReward {
  type: 'monster';
  reward_data: MonsterRewardData;
}

export interface PointsReward extends BaseReward {
  type: 'points';
  reward_data: {
    points: number;
    point_type?: string;
    title?: string;
  };
}

export interface CustomReward extends BaseReward {
  type: 'custom';
  reward_data: {
    title: string;
    description?: string;
    custom_value?: string;
  };
}

export type ActivityReward = CoinReward | LevelReward | ItemReward | MonsterReward | PointsReward | CustomReward;

// Species Images Cache
export interface SpeciesImageData {
  image_url?: string;
  type?: string;
  type2?: string;
  attribute?: string;
}

export type SpeciesImagesMap = Record<string, string | SpeciesImageData>;

// Adoption Types
export interface Adopt {
  id: number;
  name?: string;
  species1: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  main_ref?: string;
  is_adopted?: boolean;
  adopted_by?: number | string;
  adopted_at?: string;
  created_at?: string;
  month?: number;
  year?: number;
  rarity?: RewardRarity;
  available?: boolean;
  submission_id?: number;
}

export interface AdoptionPagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface MonthData {
  year: number;
  month: number;
  count?: number;
}

// Adopted Monster (after adoption is complete)
export interface AdoptedMonster extends Monster {
  id: number;
  name: string;
  trainer_id?: number | string;
  img_link?: string;
}

// Artwork Types (for adoption artwork selector)
export interface Artwork {
  id: number;
  title: string;
  image_url: string;
  thumbnail_url?: string;
  created_at?: string;
  submission_id?: number;
}

// Inventory Types
export interface TrainerInventory {
  berries: Record<string, number>;
  pastries: Record<string, number>;
}

// Item Queue for batch processing
export interface QueuedItem {
  id: number;
  type: 'berry' | 'pastry';
  itemName: string;
  value?: string;
  selectedSpecies?: string;
}

// Item Operation Result
export interface ItemOperationResult {
  success: boolean;
  message?: string;
  monster?: Monster;
  newMonster?: Monster;
  needsSelection?: boolean;
  rolledSpecies?: string[];
}

// Session Display Props
export interface SessionDisplayProps {
  session: ActivitySession;
  prompt: ActivityPrompt;
  flavor: ActivityFlavor;
  onReturnToActivity?: () => void;
  loading?: boolean;
  error?: string | null;
}

// Adoption Center Props
export interface AdoptionCenterProps {
  className?: string;
}

// Adoption Item Modal Props
export interface AdoptionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  monster: Monster | AdoptedMonster;
  trainerId: number | string;
  trainerInventory: TrainerInventory;
  onComplete?: (updatedMonster: Monster) => void;
}

// Helper function types
export interface ClaimRewardParams {
  sessionId: string;
  rewardId: number | string;
  trainerId: number | string;
  monsterName?: string;
}

// ========== Antique Types ==========

// Antique auction option (a specific monster that can be claimed)
export interface AntiqueAuctionOption {
  id: number;
  name?: string;
  species1: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  image?: string;
  creator?: string;
  description?: string;
  antique?: string;
  holiday?: string;
}

// Rolled monster from appraisal
export interface RolledMonster {
  species1: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
}

// Antique Appraisal Props
export interface AntiqueAppraisalProps {
  isOpen: boolean;
  trainerId: number | string;
  antique: string;
  onClose: () => void;
  onSuccess?: (monster: Monster) => void;
}

// Antique Auction Props
export interface AntiqueAuctionProps {
  isOpen: boolean;
  trainerId: number | string;
  antique: string;
  onClose: () => void;
  onSuccess?: (monster: Monster) => void;
  userTrainers?: TownTrainer[];
}

// Trainer with discord_user_id for antique operations
export interface AntiqueTrainer extends TownTrainer {
  discord_user_id?: string;
}

// ========== Witch's Hut / Evolution Types ==========

// Evolution option returned from API
export interface EvolutionOption {
  name: string;
  type: string;
}

// Evolution preview data (from fakemon database)
export interface EvolutionPreview {
  name: string;
  type_primary?: string;
  type_secondary?: string;
  image_url?: string;
}

// Evolution item configuration
export interface EvolutionItem {
  id: string;
  desc: string;
  type: string;
}

// Trainer inventory for evolution
export interface EvolutionInventory {
  evolution: Record<string, number>;
}

// Evolved monster result
export interface EvolvedMonster extends Monster {
  attribute?: string;
}

// Witch's Hut Props
export interface WitchsHutProps {
  className?: string;
  onEvolutionComplete?: (monster: EvolvedMonster) => void;
}

// ========== Shop Types ==========

// Shop item from API
export interface ShopItem {
  id: number;
  name: string;
  description: string;
  effect?: string;
  price: number;
  image_path?: string;
  image_url?: string;
  category: string;
  stock: number;
  is_limited: boolean;
}

// Shop category
export interface ShopCategory {
  id: string;
  name: string;
}

// Trainer with currency for shop
export interface ShopTrainer extends TownTrainer {
  currency_amount: number;
}

// Shop pagination state
export interface ShopPagination {
  page: number;
  totalPages: number;
  limit: number;
}

// Shop Props
export interface ShopProps {
  shopId: string | number;
  shopName?: string;
  shopDescription?: string;
  shopCategory?: string;
  className?: string;
  onPurchaseComplete?: (item: ShopItem, quantity: number, trainerId: string | number) => void;
}

// ========== Bazar Types ==========

// Bazar item category
export interface BazarCategory {
  key: string;
  label: string;
}

// Default bazar categories
export const BAZAR_CATEGORIES: BazarCategory[] = [
  { key: 'items', label: 'Items' },
  { key: 'balls', label: 'Poké Balls' },
  { key: 'berries', label: 'Berries' },
  { key: 'pastries', label: 'Pastries' },
  { key: 'evolution', label: 'Evolution Items' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'antiques', label: 'Antiques' },
  { key: 'helditems', label: 'Held Items' },
  { key: 'seals', label: 'Seals' },
  { key: 'keyitems', label: 'Key Items' }
];

// Bazar item (available for collection)
export interface BazarItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  image_url?: string;
  image_path?: string;
  forfeited_by?: number | string;
  forfeited_at?: string;
}

// Trainer inventory item (for forfeiting)
export interface InventoryItem {
  name: string;
  quantity: number;
  image_url?: string;
  image_path?: string;
}

// Bazar monster (forfeited monster available for adoption)
export interface BazarMonster {
  id: number;
  name?: string;
  species1: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  main_ref?: string;
  forfeited_by?: number | string;
  forfeited_at?: string;
  original_trainer_name?: string;
}

// Trainer monster (for selecting monsters to forfeit)
export interface TrainerMonster {
  id: number;
  name: string;
  species1: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  img_link?: string;
  level?: number;
}

// Bazar Forfeit Item Props
export interface BazarForfeitItemProps {
  className?: string;
  onForfeitComplete?: () => void;
}

// Bazar Collect Item Props
export interface BazarCollectItemProps {
  className?: string;
  onCollectComplete?: (item: BazarItem, trainerId: string | number) => void;
}

// Bazar Adopt Monster Props
export interface BazarAdoptMonsterProps {
  className?: string;
  onAdoptComplete?: (monster: BazarMonster, trainerId: string | number) => void;
}

// Bazar Forfeit Monster Props
export interface BazarForfeitMonsterProps {
  className?: string;
  onForfeitComplete?: (monsters: TrainerMonster[]) => void;
}

// ========== Mega Mart Types ==========

// Individual ability info
export interface AbilityInfo {
  name: string;
  effect: string;
}

// Monster abilities response from API
export interface MonsterAbilities {
  ability1?: AbilityInfo;
  ability2?: AbilityInfo;
  hidden_ability?: AbilityInfo;
}

// Trainer inventory for Mega Mart (items category)
export interface MegaMartInventory {
  items: Record<string, number>;
}

// Mega Mart Props
export interface MegaMartProps {
  className?: string;
}
