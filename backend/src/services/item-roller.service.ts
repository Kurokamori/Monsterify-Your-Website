import { ItemRepository, ItemRow } from '../repositories';
import { TrainerInventoryRepository } from '../repositories';
import { type ItemCategoryValue } from '../utils/constants';

// ============================================================================
// Types
// ============================================================================

// Item rarity type (not exported from constants so we define it locally)
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemRollOptions = {
  category?: ItemCategoryValue | ItemCategoryValue[] | 'ALL';
  rarity?: string | null;
  quantity?: number;
  excludeIds?: number[];
  allowDuplicates?: boolean;
};

export type RolledItem = ItemRow & {
  quantity: number;
};

export type RollAndAddResult = {
  success: boolean;
  items: RolledItem[];
};

// ============================================================================
// Category to Inventory Field Mapping
// ============================================================================

const CATEGORY_TO_INVENTORY: Record<string, ItemCategoryValue> = {
  berries: 'berries',
  pastries: 'pastries',
  evolution: 'evolution',
  balls: 'balls',
  antiques: 'antiques',
  helditems: 'helditems',
  eggs: 'eggs',
  seals: 'seals',
  keyitems: 'keyitems',
  items: 'items',
};

// ============================================================================
// Service
// ============================================================================

/**
 * Service for randomly selecting items from the database.
 * Supports filtering by category and rarity, and can add items to trainer inventory.
 */
export class ItemRollerService {
  private itemRepository: ItemRepository;
  private inventoryRepository: TrainerInventoryRepository;

  constructor(
    itemRepository?: ItemRepository,
    inventoryRepository?: TrainerInventoryRepository
  ) {
    this.itemRepository = itemRepository ?? new ItemRepository();
    this.inventoryRepository = inventoryRepository ?? new TrainerInventoryRepository();
  }

  // ==========================================================================
  // Rolling Methods
  // ==========================================================================

  /**
   * Roll items based on configuration
   * @param options - Roll options
   * @returns Array of rolled items
   */
  async rollItems(options: ItemRollOptions = {}): Promise<RolledItem[]> {
    try {
      const category = options.category ?? 'ALL';
      const rarity = options.rarity ?? null;
      const quantity = options.quantity ?? 1;
      const excludeIds = options.excludeIds ?? [];
      const allowDuplicates = options.allowDuplicates ?? false;

      // Get items based on category
      let items: ItemRow[] = [];

      if (Array.isArray(category)) {
        // Handle multiple categories
        for (const cat of category) {
          const categoryItems = await this.getItemsByCategory(cat);
          items = [...items, ...categoryItems];
        }
      } else {
        items = await this.getItemsByCategory(category);
      }

      // Filter by rarity if specified
      if (rarity) {
        items = items.filter((item) => item.rarity?.toLowerCase() === rarity.toLowerCase());
      }

      // Exclude specific item IDs
      if (excludeIds.length > 0) {
        items = items.filter((item) => !excludeIds.includes(item.id));
      }

      if (items.length === 0) {
        console.warn('No items found matching the criteria');
        return [];
      }

      // Shuffle items
      const shuffledItems = this.shuffleArray([...items]);

      // Select items
      const selectedItems: RolledItem[] = [];
      const selectedItemIds = new Set<number>();

      if (!allowDuplicates) {
        // Try to select unique items
        let attempts = 0;
        while (selectedItems.length < quantity && attempts < 100) {
          const randomIndex = Math.floor(Math.random() * shuffledItems.length);
          const item = shuffledItems[randomIndex];

          if (item && !selectedItemIds.has(item.id)) {
            selectedItems.push({
              ...item,
              quantity: this.calculateItemQuantity(item.rarity ?? 'common'),
            });
            selectedItemIds.add(item.id);
          }

          attempts++;

          // If we've tried too many times or selected all available items, break
          if (attempts >= 100 || selectedItemIds.size >= shuffledItems.length) {
            break;
          }
        }
      }

      // If we still need more items, allow duplicates
      while (selectedItems.length < quantity && shuffledItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * shuffledItems.length);
        const item = shuffledItems[randomIndex];
        if (item) {
          selectedItems.push({
            ...item,
            quantity: this.calculateItemQuantity(item.rarity ?? 'common'),
          });
        }
      }

      return selectedItems;
    } catch (error) {
      console.error('Error rolling items:', error);
      throw error;
    }
  }

  /**
   * Roll a single item
   * @param options - Roll options
   * @returns Rolled item
   */
  async rollOne(options: Omit<ItemRollOptions, 'quantity'> = {}): Promise<RolledItem | null> {
    const items = await this.rollItems({ ...options, quantity: 1 });
    return items[0] ?? null;
  }

  /**
   * Roll multiple items
   * @param quantity - Number of items to roll
   * @param options - Roll options
   * @returns Array of rolled items
   */
  async rollMany(quantity: number, options: Omit<ItemRollOptions, 'quantity'> = {}): Promise<RolledItem[]> {
    return this.rollItems({ ...options, quantity });
  }

  /**
   * Roll items by rarity with weighted distribution
   * @param quantity - Number of items to roll
   * @param weights - Rarity weights (defaults to standard weights)
   * @returns Array of rolled items
   */
  async rollByRarityWeights(
    quantity: number,
    weights: Partial<Record<ItemRarity, number>> = {}
  ): Promise<RolledItem[]> {
    const defaultWeights: Record<ItemRarity, number> = {
      common: 60,
      uncommon: 25,
      rare: 10,
      epic: 4,
      legendary: 1,
    };

    const finalWeights = { ...defaultWeights, ...weights };
    const totalWeight = Object.values(finalWeights).reduce((sum: number, w: number) => sum + w, 0);

    const results: RolledItem[] = [];

    for (let i = 0; i < quantity; i++) {
      // Roll for rarity
      let roll = Math.random() * totalWeight;
      let selectedRarity: ItemRarity = 'common';

      for (const [rarity, weight] of Object.entries(finalWeights) as [ItemRarity, number][]) {
        roll -= weight;
        if (roll <= 0) {
          selectedRarity = rarity;
          break;
        }
      }

      // Roll an item of that rarity
      const item = await this.rollOne({ rarity: selectedRarity });
      if (item) {
        results.push(item);
      }
    }

    return results;
  }

  // ==========================================================================
  // Inventory Integration
  // ==========================================================================

  /**
   * Roll items and add them to trainer inventory
   * @param trainerId - Trainer ID
   * @param options - Roll options
   * @returns Result with added items
   */
  async rollAndAddToInventory(
    trainerId: number,
    options: ItemRollOptions = {}
  ): Promise<RollAndAddResult> {
    try {
      // Roll items
      const items = await this.rollItems(options);

      // Add items to trainer inventory
      const addedItems: RolledItem[] = [];

      for (const item of items) {
        // Map item category to inventory field
        const category = item.category?.toString().toLowerCase() ?? 'items';
        const inventoryField = CATEGORY_TO_INVENTORY[category] ?? 'items';

        // Add to inventory
        await this.inventoryRepository.addItem(trainerId, inventoryField, item.name, item.quantity);

        addedItems.push(item);
      }

      return {
        success: true,
        items: addedItems,
      };
    } catch (error) {
      console.error('Error rolling and adding items to inventory:', error);
      throw error;
    }
  }

  /**
   * Roll items by rarity weights and add to inventory
   * @param trainerId - Trainer ID
   * @param quantity - Number of items to roll
   * @param weights - Rarity weights
   * @returns Result with added items
   */
  async rollByWeightsAndAddToInventory(
    trainerId: number,
    quantity: number,
    weights?: Partial<Record<ItemRarity, number>>
  ): Promise<RollAndAddResult> {
    try {
      const items = await this.rollByRarityWeights(quantity, weights);

      for (const item of items) {
        const category = item.category?.toString().toLowerCase() ?? 'items';
        const inventoryField = CATEGORY_TO_INVENTORY[category] ?? 'items';
        await this.inventoryRepository.addItem(trainerId, inventoryField, item.name, item.quantity);
      }

      return {
        success: true,
        items,
      };
    } catch (error) {
      console.error('Error rolling by weights and adding items to inventory:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get items by category
   * @param category - Item category or 'ALL'
   * @returns Array of items
   */
  private async getItemsByCategory(category: ItemCategoryValue | 'ALL'): Promise<ItemRow[]> {
    try {
      if (category === 'ALL') {
        const result = await this.itemRepository.findAll({ limit: 10000 });
        return result.data ?? [];
      } else {
        return await this.itemRepository.findByCategory(category);
      }
    } catch (error) {
      console.error(`Error getting items for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns Shuffled array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i] as T;
      shuffled[i] = shuffled[j] as T;
      shuffled[j] = temp;
    }
    return shuffled;
  }

  /**
   * Calculate item quantity based on rarity
   * @param rarity - Item rarity
   * @returns Quantity to give
   */
  private calculateItemQuantity(rarity: string): number {
    const rarityLower = rarity.toLowerCase();
    if (rarityLower === 'common') {
      return Math.floor(Math.random() * 3) + 1; // 1-3
    } else if (rarityLower === 'uncommon') {
      return Math.floor(Math.random() * 2) + 1; // 1-2
    }
    return 1; // Rare, epic, legendary = 1
  }

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Roll a single item (static method)
   */
  static async rollOne(options: Omit<ItemRollOptions, 'quantity'> = {}): Promise<RolledItem | null> {
    const service = new ItemRollerService();
    return service.rollOne(options);
  }

  /**
   * Roll multiple items (static method)
   */
  static async rollMany(quantity: number, options: Omit<ItemRollOptions, 'quantity'> = {}): Promise<RolledItem[]> {
    const service = new ItemRollerService();
    return service.rollMany(quantity, options);
  }

  /**
   * Roll items and add to trainer inventory (static method)
   */
  static async rollAndAddToInventory(
    trainerId: number,
    options: ItemRollOptions = {}
  ): Promise<RollAndAddResult> {
    const service = new ItemRollerService();
    return service.rollAndAddToInventory(trainerId, options);
  }
}
