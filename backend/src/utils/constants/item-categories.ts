/**
 * Item Category Constants
 * Defines all item categories used in the game inventory system
 */

// Item category definitions
export const ItemCategory = {
  BALLS: 'balls',
  BERRIES: 'berries',
  PASTRIES: 'pastries',
  EVOLUTION: 'evolution',
  HELD_ITEMS: 'helditems',
  ITEMS: 'items',
  KEY_ITEMS: 'keyitems',
  SEALS: 'seals',
  EGGS: 'eggs',
  ANTIQUES: 'antiques',
} as const;

export type ItemCategoryKey = keyof typeof ItemCategory;
export type ItemCategoryValue = (typeof ItemCategory)[ItemCategoryKey];

// Array of all item category values
export const ITEM_CATEGORIES: ItemCategoryValue[] = Object.values(ItemCategory);

// Array of all inventory category keys (used for trainer inventory structure)
export const INVENTORY_CATEGORIES: ItemCategoryValue[] = [
  ItemCategory.ITEMS,
  ItemCategory.BALLS,
  ItemCategory.BERRIES,
  ItemCategory.PASTRIES,
  ItemCategory.EVOLUTION,
  ItemCategory.EGGS,
  ItemCategory.ANTIQUES,
  ItemCategory.HELD_ITEMS,
  ItemCategory.SEALS,
  ItemCategory.KEY_ITEMS,
];

/**
 * Display names for each item category
 */
export const ITEM_CATEGORY_DISPLAY_NAMES: Record<ItemCategoryValue, string> = {
  [ItemCategory.BALLS]: 'Balls',
  [ItemCategory.BERRIES]: 'Berries',
  [ItemCategory.PASTRIES]: 'Pastries',
  [ItemCategory.EVOLUTION]: 'Evolution Items',
  [ItemCategory.HELD_ITEMS]: 'Held Items',
  [ItemCategory.ITEMS]: 'General Items',
  [ItemCategory.KEY_ITEMS]: 'Key Items',
  [ItemCategory.SEALS]: 'Seals',
  [ItemCategory.EGGS]: 'Eggs',
  [ItemCategory.ANTIQUES]: 'Antiques',
};

/**
 * Description for each item category
 */
export const ITEM_CATEGORY_DESCRIPTIONS: Record<ItemCategoryValue, string> = {
  [ItemCategory.BALLS]: 'Capture devices for catching wild monsters',
  [ItemCategory.BERRIES]: 'Natural items that can be fed to monsters or used in battle',
  [ItemCategory.PASTRIES]: 'Special baked goods with various effects on monsters',
  [ItemCategory.EVOLUTION]: 'Items that can trigger monster evolution',
  [ItemCategory.HELD_ITEMS]: 'Items that can be held by monsters for passive effects',
  [ItemCategory.ITEMS]: 'General purpose items with various uses',
  [ItemCategory.KEY_ITEMS]: 'Important items that unlock special features or areas',
  [ItemCategory.SEALS]: 'Decorative items that affect monster appearance',
  [ItemCategory.EGGS]: 'Monster eggs that can hatch into new monsters',
  [ItemCategory.ANTIQUES]: 'Rare collectible items with high trade value',
};

/**
 * Sort order for categories in the inventory UI
 */
export const ITEM_CATEGORY_SORT_ORDER: Record<ItemCategoryValue, number> = {
  [ItemCategory.ITEMS]: 0,
  [ItemCategory.BALLS]: 1,
  [ItemCategory.BERRIES]: 2,
  [ItemCategory.PASTRIES]: 3,
  [ItemCategory.EVOLUTION]: 4,
  [ItemCategory.HELD_ITEMS]: 5,
  [ItemCategory.SEALS]: 6,
  [ItemCategory.EGGS]: 7,
  [ItemCategory.ANTIQUES]: 8,
  [ItemCategory.KEY_ITEMS]: 9,
};

/**
 * Check if a category value is valid
 * @param category - The category to check
 * @returns True if the category is valid
 */
export function isValidItemCategory(category: string): category is ItemCategoryValue {
  return ITEM_CATEGORIES.includes(category as ItemCategoryValue);
}

/**
 * Get the display name for a category
 * @param category - The category value
 * @returns The display name or the original value if not found
 */
export function getItemCategoryDisplayName(category: ItemCategoryValue): string {
  return ITEM_CATEGORY_DISPLAY_NAMES[category] || category;
}

/**
 * Get categories sorted by their sort order
 * @returns Array of categories in display order
 */
export function getSortedItemCategories(): ItemCategoryValue[] {
  return [...ITEM_CATEGORIES].sort(
    (a, b) => ITEM_CATEGORY_SORT_ORDER[a] - ITEM_CATEGORY_SORT_ORDER[b]
  );
}

/**
 * Categories that cannot be sold/traded
 */
export const NON_TRADEABLE_CATEGORIES: ItemCategoryValue[] = [ItemCategory.KEY_ITEMS];

/**
 * Categories that can stack in inventory
 */
export const STACKABLE_CATEGORIES: ItemCategoryValue[] = [
  ItemCategory.BALLS,
  ItemCategory.BERRIES,
  ItemCategory.PASTRIES,
  ItemCategory.EVOLUTION,
  ItemCategory.ITEMS,
  ItemCategory.SEALS,
  ItemCategory.ANTIQUES,
];

/**
 * Categories that are unique (can only have 1)
 */
export const UNIQUE_CATEGORIES: ItemCategoryValue[] = [ItemCategory.KEY_ITEMS, ItemCategory.EGGS];

/**
 * Check if a category's items are tradeable
 * @param category - The category to check
 * @returns True if items in this category can be traded
 */
export function isCategoryTradeable(category: ItemCategoryValue): boolean {
  return !NON_TRADEABLE_CATEGORIES.includes(category);
}

/**
 * Check if a category's items are stackable
 * @param category - The category to check
 * @returns True if items in this category can stack
 */
export function isCategoryStackable(category: ItemCategoryValue): boolean {
  return STACKABLE_CATEGORIES.includes(category);
}
