import { db } from '../database';
import {
  ShopRepository,
  ItemRepository,
  TrainerRepository,
  TrainerInventoryRepository,
  INVENTORY_CATEGORIES,
} from '../repositories';
import type {
  ShopRow,
  ShopItemRow,
  ShopCreateInput,
  ShopUpdateInput,
  ShopItemCreateInput,
  ShopItemUpdateInput,
  InventoryCategory,
} from '../repositories';

export type PurchaseResult = {
  shopItem: ShopItemRow;
  totalCost: number;
  remainingCurrency: number;
};

export type StockResult = {
  shopId: string;
  itemsAdded: number;
  items: ShopItemRow[];
};

export class ShopService {
  private shopRepo: ShopRepository;
  private itemRepo: ItemRepository;
  private trainerRepo: TrainerRepository;
  private inventoryRepo: TrainerInventoryRepository;

  /** Price variance range: prices will be base * modifier * (1 ± PRICE_VARIANCE) */
  private static readonly PRICE_VARIANCE = 0.2;

  constructor(
    shopRepo?: ShopRepository,
    itemRepo?: ItemRepository,
    trainerRepo?: TrainerRepository,
    inventoryRepo?: TrainerInventoryRepository,
  ) {
    this.shopRepo = shopRepo ?? new ShopRepository();
    this.itemRepo = itemRepo ?? new ItemRepository();
    this.trainerRepo = trainerRepo ?? new TrainerRepository();
    this.inventoryRepo = inventoryRepo ?? new TrainerInventoryRepository();
  }

  /**
   * Simple seeded random number generator (mulberry32).
   * Returns a function that produces values in [0, 1).
   */
  private static seededRandom(seed: number): () => number {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Apply random price variance around a base price.
   * Uses a seeded RNG so the same item+date combo always produces the same price.
   */
  private static rollPrice(
    basePrice: number,
    priceModifier: number,
    itemId: number,
    dateStr: string,
  ): number {
    // Multiply itemId by a large prime and XOR with a date-derived number
    // so that consecutive days and close item IDs produce very different seeds
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateBits = (((y! * 367 + m!) * 31 + d!) * 0x45d9f3b) ^ 0xa5a5a5a5;
    const itemBits = Math.imul(itemId, 0x9e3779b9); // golden ratio hash
    const seed = (dateBits ^ itemBits) >>> 0;
    const rng = ShopService.seededRandom(seed);
    const variance = 1 - ShopService.PRICE_VARIANCE + rng() * ShopService.PRICE_VARIANCE * 2;
    return Math.max(10, Math.round(((basePrice || 100) * priceModifier * variance) / 10) * 10);
  }

  // ===========================================================================
  // Shop CRUD
  // ===========================================================================

  async getAllShops(): Promise<ShopRow[]> {
    return this.shopRepo.findAll();
  }

  async getActiveShops(): Promise<ShopRow[]> {
    return this.shopRepo.findAllActive();
  }

  async getVisibleShops(userId?: number): Promise<ShopRow[]> {
    return this.shopRepo.findVisibleShops(userId);
  }

  async getShopByShopId(shopId: string): Promise<ShopRow | null> {
    return this.shopRepo.findByShopId(shopId);
  }

  async createShop(input: ShopCreateInput): Promise<ShopRow> {
    const existing = await this.shopRepo.findByShopId(input.shopId);
    if (existing) {
      throw new Error('Shop ID already exists');
    }
    return this.shopRepo.create(input);
  }

  async updateShop(shopId: string, input: ShopUpdateInput): Promise<ShopRow> {
    return this.shopRepo.updateByShopId(shopId, input);
  }

  async deleteShop(shopId: string): Promise<void> {
    const shop = await this.shopRepo.findByShopId(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }
    await this.shopRepo.delete(shop.id);
  }

  // ===========================================================================
  // Shop Items
  // ===========================================================================

  async getShopItems(shopId: string): Promise<ShopItemRow[]> {
    const shop = await this.shopRepo.findByShopId(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    // Constant shops load items directly from the items table by category
    if (shop.is_constant && shop.category) {
      const items = await this.itemRepo.findByCategory(shop.category);
      const priceModifier = shop.price_modifier ?? 1.0;
      const today = new Date().toISOString().split('T')[0]!;

      return items.map((item) => ({
        id: item.id,
        shop_id: shopId,
        item_id: item.id,
        price: ShopService.rollPrice(item.base_price, priceModifier, item.id, today),
        max_quantity: null,
        current_quantity: null,
        date: null,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        category: item.category,
        type: item.type,
        rarity: item.rarity,
        effect: item.effect,
      }));
    }

    // Non-constant shops load from shop_items table (filtered by today's date)
    const today = new Date().toISOString().split('T')[0]!;
    let items = await this.shopRepo.getShopItems(shopId, today);

    // Auto-stock if no items exist for today
    if (items.length === 0 && shop.category) {
      const result = await this.stockShop(
        shopId,
        shop.category,
        10,
        shop.price_modifier ?? 1.0,
      );
      items = result.items;
    }

    return items;
  }

  async addShopItem(input: ShopItemCreateInput): Promise<ShopItemRow> {
    return this.shopRepo.addShopItem(input);
  }

  async updateShopItem(id: number, input: ShopItemUpdateInput): Promise<ShopItemRow> {
    return this.shopRepo.updateShopItem(id, input);
  }

  async removeShopItem(id: number): Promise<boolean> {
    return this.shopRepo.removeShopItem(id);
  }

  async stockShop(
    shopId: string,
    category: string,
    count: number,
    priceModifier: number,
  ): Promise<StockResult> {
    let items;
    if (category === 'ALL') {
      // Get all items except Key Items
      const allCategories = await this.itemRepo.getAllCategories();
      const validCategories = allCategories.filter(
        (c) => c.toLowerCase() !== 'key items',
      );
      const allItems = [];
      for (const cat of validCategories) {
        const catItems = await this.itemRepo.findByCategory(cat);
        allItems.push(...catItems);
      }
      items = allItems;
    } else {
      items = await this.itemRepo.findByCategory(category);
    }
    if (items.length === 0) {
      throw new Error(`No items found in category: ${category}`);
    }

    // Shuffle and pick up to `count` items
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const today = new Date().toISOString().split('T')[0]!;
    const addedItems: ShopItemRow[] = [];
    for (const item of selected) {
      const price = ShopService.rollPrice(item.base_price, priceModifier, item.id, today);
      const shopItem = await this.shopRepo.addShopItem({
        shopId,
        itemId: item.id,
        price,
        maxQuantity: null,
        currentQuantity: null,
      });
      addedItems.push(shopItem);
    }

    return {
      shopId,
      itemsAdded: addedItems.length,
      items: addedItems,
    };
  }

  /**
   * Restock all non-constant active shops with fresh daily prices.
   * Clears old shop_items for previous dates before restocking.
   */
  async restockAllShops(): Promise<{ shopsRestocked: number; totalItems: number }> {
    const shops = await this.shopRepo.findAllActive();
    const today = new Date().toISOString().split('T')[0]!;
    let shopsRestocked = 0;
    let totalItems = 0;

    for (const shop of shops) {
      if (shop.is_constant || !shop.category) continue;

      // Check if already stocked for today
      const existing = await this.shopRepo.getShopItems(shop.shop_id, today);
      if (existing.length > 0) continue;

      // Clear old items from previous days
      await this.shopRepo.clearOldShopItems(shop.shop_id, today);

      const result = await this.stockShop(
        shop.shop_id,
        shop.category,
        10,
        shop.price_modifier ?? 1.0,
      );
      shopsRestocked++;
      totalItems += result.itemsAdded;
    }

    return { shopsRestocked, totalItems };
  }

  // ===========================================================================
  // Purchasing
  // ===========================================================================

  async purchaseItem(
    trainerId: number,
    shopId: string,
    itemId: number,
    quantity: number,
    giftToTrainerId?: number,
  ): Promise<PurchaseResult> {
    const shop = await this.shopRepo.findByShopId(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    let shopItem: ShopItemRow;

    if (shop.is_constant && shop.category) {
      // For constant shops, itemId is the items table id
      const itemRow = await this.itemRepo.findById(itemId);
      if (!itemRow?.category || itemRow.category !== shop.category) {
        throw new Error('Item not found or unavailable in this shop');
      }
      const priceModifier = shop.price_modifier ?? 1.0;
      const today = new Date().toISOString().split('T')[0]!;
      shopItem = {
        id: itemRow.id,
        shop_id: shopId,
        item_id: itemRow.id,
        price: ShopService.rollPrice(itemRow.base_price, priceModifier, itemRow.id, today),
        max_quantity: null,
        current_quantity: null,
        date: null,
        name: itemRow.name,
        description: itemRow.description,
        image_url: itemRow.image_url,
        category: itemRow.category,
        type: itemRow.type,
        rarity: itemRow.rarity,
        effect: itemRow.effect,
      };
    } else {
      // For non-constant shops, itemId is the shop_items table id
      const found = await this.shopRepo.findShopItemById(itemId);
      if (!found?.shop_id || found.shop_id !== shopId) {
        throw new Error('Shop item not found or unavailable');
      }
      shopItem = found;
    }

    const totalCost = shopItem.price * quantity;
    if (trainer.currency_amount < totalCost) {
      throw new Error(
        `Insufficient funds. Need ${totalCost} but trainer has ${trainer.currency_amount}`,
      );
    }

    if (shopItem.current_quantity !== null && shopItem.current_quantity < quantity) {
      throw new Error(
        `Insufficient stock. Need ${quantity} but only ${shopItem.current_quantity} available`,
      );
    }

    // Validate gift recipient if specified
    if (giftToTrainerId) {
      const giftTrainer = await this.trainerRepo.findById(giftToTrainerId);
      if (!giftTrainer) {
        throw new Error('Gift recipient trainer not found');
      }
    }

    return db.transaction(async () => {
      // Deduct currency from the buyer
      await this.trainerRepo.updateCurrency(trainerId, -totalCost);

      // Reduce stock if applicable (only for non-constant shops)
      let updatedShopItem = shopItem;
      if (!shop.is_constant && shopItem.current_quantity !== null) {
        updatedShopItem = await this.shopRepo.reduceShopItemStock(shopItem.id, quantity);
      }

      // Add item to recipient's inventory (gift target or buyer)
      const recipientId = giftToTrainerId ?? trainerId;
      const itemName = shopItem.name ?? 'Unknown Item';
      const rawCategory = shopItem.category ?? 'items';
      const category: InventoryCategory = INVENTORY_CATEGORIES.includes(rawCategory as InventoryCategory)
        ? (rawCategory as InventoryCategory)
        : 'items';
      await this.inventoryRepo.addItem(recipientId, category, itemName, quantity);

      const updatedTrainer = await this.trainerRepo.findById(trainerId);

      return {
        shopItem: updatedShopItem,
        totalCost,
        remainingCurrency: updatedTrainer?.currency_amount ?? 0,
      };
    });
  }
}
