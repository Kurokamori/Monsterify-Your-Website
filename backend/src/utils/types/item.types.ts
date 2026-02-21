/**
 * Item Type Definitions
 * Types for items, shops, and trades
 */

import { BaseEntity } from './common.types';
import { ItemCategoryValue } from '../constants/item-categories';

/**
 * Item rarity levels
 */
export const ItemRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHICAL: 'mythical',
} as const;

export type ItemRarityValue = (typeof ItemRarity)[keyof typeof ItemRarity];

/**
 * Item entity
 */
export interface Item extends BaseEntity {
  name: string;
  description: string;
  imageUrl: string | null;
  category: ItemCategoryValue;
  type: string | null;
  rarity: ItemRarityValue | null;
  effect: string | null;
  basePrice: number;
}

/**
 * Item with usage details
 */
export interface ItemWithDetails extends Item {
  usageCount: number;
  isStackable: boolean;
  isTradeable: boolean;
  maxStack: number | null;
}

/**
 * Item summary for listings
 */
export interface ItemSummary {
  id: number;
  name: string;
  category: ItemCategoryValue;
  imageUrl: string | null;
  basePrice: number;
  rarity: ItemRarityValue | null;
}

/**
 * Input for creating an item
 */
export interface ItemCreateInput {
  name: string;
  description: string;
  imageUrl?: string;
  category: ItemCategoryValue;
  type?: string;
  rarity?: ItemRarityValue;
  effect?: string;
  basePrice: number;
}

/**
 * Input for updating an item
 */
export interface ItemUpdateInput {
  name?: string;
  description?: string;
  imageUrl?: string | null;
  category?: ItemCategoryValue;
  type?: string | null;
  rarity?: ItemRarityValue | null;
  effect?: string | null;
  basePrice?: number;
}

/**
 * Shop entity
 */
export interface Shop extends BaseEntity {
  name: string;
  description: string;
  location: string;
  imageUrl: string | null;
  ownerId: number | null; // NPC owner ID
  isActive: boolean;
  operatingHours: string | null;
}

/**
 * Shop item (item in a shop with pricing)
 */
export interface ShopItem extends BaseEntity {
  shopId: number;
  itemId: number;
  price: number; // Can differ from base price
  stock: number | null; // null = unlimited
  discountPercent: number;
  isActive: boolean;
}

/**
 * Shop item with details
 */
export interface ShopItemWithDetails extends ShopItem {
  itemName: string;
  itemDescription: string;
  itemImageUrl: string | null;
  itemCategory: ItemCategoryValue;
  itemRarity: ItemRarityValue | null;
  finalPrice: number; // Price after discount
}

/**
 * Shop with items
 */
export interface ShopWithItems extends Shop {
  items: ShopItemWithDetails[];
}

/**
 * Purchase from shop input
 */
export interface ShopPurchaseInput {
  trainerId: number;
  shopId: number;
  shopItemId: number;
  quantity: number;
}

/**
 * Purchase result
 */
export interface ShopPurchaseResult {
  success: boolean;
  itemName: string;
  quantity: number;
  totalCost: number;
  newBalance: number;
  newStock: number | null;
  message?: string;
}

/**
 * Trade entity
 */
export interface Trade extends BaseEntity {
  offerTrainerId: number;
  receiveTrainerId: number;
  status: TradeStatus;
  offerItems: TradeItem[];
  receiveItems: TradeItem[];
  offerMonsterIds: number[];
  receiveMonsterIds: number[];
  offerCurrency: number;
  receiveCurrency: number;
  message: string | null;
  expiresAt: Date | null;
}

/**
 * Trade status
 */
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired' | 'completed';

/**
 * Trade item (item in a trade offer)
 */
export interface TradeItem {
  itemName: string;
  category: ItemCategoryValue;
  quantity: number;
}

/**
 * Trade with details
 */
export interface TradeWithDetails extends Trade {
  offerTrainerName: string;
  receiveTrainerName: string;
  offerMonsterDetails: Array<{
    id: number;
    name: string;
    species: string;
    level: number;
  }>;
  receiveMonsterDetails: Array<{
    id: number;
    name: string;
    species: string;
    level: number;
  }>;
}

/**
 * Input for creating a trade
 */
export interface TradeCreateInput {
  offerTrainerId: number;
  receiveTrainerId: number;
  offerItems?: TradeItem[];
  receiveItems?: TradeItem[];
  offerMonsterIds?: number[];
  receiveMonsterIds?: number[];
  offerCurrency?: number;
  receiveCurrency?: number;
  message?: string;
  expiresIn?: number; // hours
}

/**
 * Input for responding to a trade
 */
export interface TradeResponseInput {
  tradeId: number;
  trainerId: number;
  action: 'accept' | 'reject' | 'counter';
  counterOffer?: TradeCreateInput;
}

/**
 * Automated trade entity (NPC trades)
 */
export interface AutomatedTrade extends BaseEntity {
  name: string;
  description: string;
  giveItems: TradeItem[];
  receiveItems: TradeItem[];
  giveMonsterSpecies: string | null;
  receiveMonsterSpecies: string | null;
  giveCurrency: number;
  receiveCurrency: number;
  isActive: boolean;
  maxUses: number | null;
  usesRemaining: number | null;
  requiredStanding: number | null;
  requiredFactionId: number | null;
}

/**
 * Antique auction entity
 */
export interface AntiqueAuction extends BaseEntity {
  itemName: string;
  itemDescription: string;
  itemImageUrl: string | null;
  startingBid: number;
  currentBid: number;
  currentBidderId: number | null;
  bidCount: number;
  startsAt: Date;
  endsAt: Date;
  status: AuctionStatus;
  winnerId: number | null;
  finalPrice: number | null;
}

/**
 * Auction status
 */
export type AuctionStatus = 'upcoming' | 'active' | 'ended' | 'cancelled';

/**
 * Auction bid
 */
export interface AuctionBid extends BaseEntity {
  auctionId: number;
  trainerId: number;
  amount: number;
  isWinning: boolean;
}

/**
 * Input for placing a bid
 */
export interface PlaceBidInput {
  auctionId: number;
  trainerId: number;
  amount: number;
}

/**
 * Bid result
 */
export interface BidResult {
  success: boolean;
  isHighestBid: boolean;
  currentHighBid: number;
  message?: string;
}

/**
 * Item query options
 */
export interface ItemQueryOptions {
  category?: ItemCategoryValue;
  type?: string;
  rarity?: ItemRarityValue;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'rarity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Trade query options
 */
export interface TradeQueryOptions {
  trainerId?: number;
  status?: TradeStatus;
  asOfferer?: boolean;
  asReceiver?: boolean;
  sortBy?: 'createdAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
