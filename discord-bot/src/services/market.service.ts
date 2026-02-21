import { get, post, withAuth, type BaseResponse } from './api-client.js';

// ============================================================================
// Response shapes
// ============================================================================

interface RawShop {
  id: number;
  shop_id: string;
  name: string;
  description: string | null;
  flavor_text: string | null;
  banner_image: string | null;
  category: string;
  price_modifier: number;
  is_constant: boolean | number;
  is_active: boolean | number;
  visibility_condition: string | null;
}

interface RawShopItem {
  id: number;
  shop_id: string;
  item_id: number;
  price: number;
  max_quantity: number | null;
  current_quantity: number | null;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  rarity: string | null;
  effect: string | null;
  base_price: number;
}

interface RawItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  type: string | null;
  rarity: string | null;
  effect: string | null;
  base_price: number;
}

interface ShopsResponse extends BaseResponse {
  data: RawShop[];
}

interface ShopResponse extends BaseResponse {
  data: RawShop;
}

interface ShopItemsResponse extends BaseResponse {
  data: RawShopItem[];
}

interface ItemsResponse extends BaseResponse {
  data: RawItem[];
}

interface ItemResponse extends BaseResponse {
  data: RawItem;
}

interface PurchaseResponse extends BaseResponse {
  data: {
    shopItem: { name?: string };
    totalCost: number;
    remainingCurrency: number;
  };
}

interface ItemCategoriesResponse extends BaseResponse {
  data: string[];
}

// ============================================================================
// Public types
// ============================================================================

export interface Shop {
  id: number;
  shopId: string;
  name: string;
  description: string | null;
  flavorText: string | null;
  bannerImage: string | null;
  category: string;
  priceModifier: number;
  isActive: boolean;
}

export interface ShopItem {
  id: number;
  shopId: string;
  itemId: number;
  price: number;
  maxQuantity: number | null;
  currentQuantity: number | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  rarity: string | null;
  effect: string | null;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  type: string | null;
  rarity: string | null;
  effect: string | null;
  basePrice: number;
}

export interface PurchaseResult {
  itemName: string;
  quantity: number;
  totalCost: number;
  newBalance: number;
}

// ============================================================================
// Helpers
// ============================================================================

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') { return v; }
  return v === 1 || v === '1' || v === 'true';
}

function mapShop(raw: RawShop): Shop {
  return {
    id: raw.id,
    shopId: raw.shop_id,
    name: raw.name,
    description: raw.description,
    flavorText: raw.flavor_text,
    bannerImage: raw.banner_image,
    category: raw.category,
    priceModifier: raw.price_modifier,
    isActive: toBool(raw.is_active),
  };
}

function mapShopItem(raw: RawShopItem): ShopItem {
  return {
    id: raw.id,
    shopId: raw.shop_id,
    itemId: raw.item_id,
    price: raw.price,
    maxQuantity: raw.max_quantity,
    currentQuantity: raw.current_quantity,
    name: raw.name,
    description: raw.description,
    imageUrl: raw.image_url,
    category: raw.category,
    rarity: raw.rarity,
    effect: raw.effect,
  };
}

function mapItem(raw: RawItem): Item {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    imageUrl: raw.image_url,
    category: raw.category,
    type: raw.type,
    rarity: raw.rarity,
    effect: raw.effect,
    basePrice: raw.base_price,
  };
}

// ============================================================================
// Shop lookups
// ============================================================================

/** Get all shops. */
export async function getAllShops(): Promise<Shop[]> {
  const res = await get<ShopsResponse>('/shops');
  return (res.data ?? []).map(mapShop);
}

/** Get only active shops. */
export async function getActiveShops(): Promise<Shop[]> {
  const res = await get<ShopsResponse>('/shops/active');
  return (res.data ?? []).map(mapShop);
}

/** Get shops visible to the authenticated user. */
export async function getVisibleShops(discordId: string): Promise<Shop[]> {
  const res = await get<ShopsResponse>('/shops/visible', withAuth(discordId));
  return (res.data ?? []).map(mapShop);
}

/** Get a shop by its string shop_id. */
export async function getShopById(shopId: string): Promise<Shop | null> {
  try {
    const res = await get<ShopResponse>(`/shops/${shopId}`);
    if (!res.success || !res.data) { return null; }
    return mapShop(res.data);
  } catch {
    return null;
  }
}

/** Get all items stocked in a shop. */
export async function getShopItems(shopId: string): Promise<ShopItem[]> {
  const res = await get<ShopItemsResponse>(`/shops/${shopId}/items`);
  return (res.data ?? []).map(mapShopItem);
}

// ============================================================================
// Purchasing
// ============================================================================

/**
 * Purchase an item from a shop.
 *
 * @param shopId    - The shop's string identifier.
 * @param itemId    - The database ID of the shop item entry.
 * @param trainerId - The purchasing trainer's ID.
 * @param quantity  - Number of units to buy.
 * @param discordId - Discord ID for auth.
 */
export async function purchaseItem(
  shopId: string,
  itemId: number,
  trainerId: number,
  quantity: number,
  discordId: string,
): Promise<PurchaseResult> {
  const res = await post<PurchaseResponse>(
    `/shops/${shopId}/purchase`,
    { trainer_id: trainerId, item_id: itemId, quantity },
    withAuth(discordId),
  );
  return {
    itemName: res.data.shopItem?.name ?? 'Unknown Item',
    quantity,
    totalCost: res.data.totalCost,
    newBalance: res.data.remainingCurrency,
  };
}

// ============================================================================
// Item catalog lookups
// ============================================================================

/** Get the full item catalog. */
export async function getAllItems(): Promise<Item[]> {
  const res = await get<ItemsResponse>('/items');
  return (res.data ?? []).map(mapItem);
}

/** Get a single item by database ID. */
export async function getItemById(itemId: number): Promise<Item | null> {
  try {
    const res = await get<ItemResponse>(`/items/${itemId}`);
    if (!res.success || !res.data) { return null; }
    return mapItem(res.data);
  } catch {
    return null;
  }
}

/** Get all item categories. */
export async function getItemCategories(): Promise<string[]> {
  const res = await get<ItemCategoriesResponse>('/items/categories');
  return res.data ?? [];
}

/** Get all item types. */
export async function getItemTypes(): Promise<string[]> {
  const res = await get<ItemCategoriesResponse>('/items/types');
  return res.data ?? [];
}

/** Get all item rarities. */
export async function getItemRarities(): Promise<string[]> {
  const res = await get<ItemCategoriesResponse>('/items/rarities');
  return res.data ?? [];
}

// ============================================================================
// Item usage (berry, pastry)
// ============================================================================

/** Use a berry on a monster. */
export async function useBerry(
  data: { trainerId: number; monsterId: number; itemName: string },
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    '/items/use-berry',
    data,
    withAuth(discordId),
  );
  return res.data;
}

/** Use a pastry on a monster. */
export async function usePastry(
  data: { trainerId: number; monsterId: number; itemName: string },
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    '/items/use-pastry',
    data,
    withAuth(discordId),
  );
  return res.data;
}

/** Apply a pastry effect (commit the trait change). */
export async function applyPastry(
  data: { trainerId: number; monsterId: number; itemName: string; selectedOption: string },
  discordId: string,
): Promise<unknown> {
  const res = await post<BaseResponse & { data: unknown }>(
    '/items/apply-pastry',
    data,
    withAuth(discordId),
  );
  return res.data;
}
