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

      return items.map((item) => ({
        id: item.id,
        shop_id: shopId,
        item_id: item.id,
        price: Math.round((item.base_price || 100) * priceModifier),
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
    const today = new Date().toISOString().split('T')[0];
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

    const addedItems: ShopItemRow[] = [];
    for (const item of selected) {
      const price = Math.round((item.base_price || 100) * priceModifier);
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

  // ===========================================================================
  // Purchasing
  // ===========================================================================

  async purchaseItem(
    trainerId: number,
    shopId: string,
    itemId: number,
    quantity: number,
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
      shopItem = {
        id: itemRow.id,
        shop_id: shopId,
        item_id: itemRow.id,
        price: Math.round((itemRow.base_price || 100) * priceModifier),
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

    return db.transaction(async () => {
      // Deduct currency
      await this.trainerRepo.updateCurrency(trainerId, -totalCost);

      // Reduce stock if applicable (only for non-constant shops)
      let updatedShopItem = shopItem;
      if (!shop.is_constant && shopItem.current_quantity !== null) {
        updatedShopItem = await this.shopRepo.reduceShopItemStock(shopItem.id, quantity);
      }

      // Add item to trainer inventory
      const itemName = shopItem.name ?? 'Unknown Item';
      const rawCategory = shopItem.category ?? 'items';
      const category: InventoryCategory = INVENTORY_CATEGORIES.includes(rawCategory as InventoryCategory)
        ? (rawCategory as InventoryCategory)
        : 'items';
      await this.inventoryRepo.addItem(trainerId, category, itemName, quantity);

      const updatedTrainer = await this.trainerRepo.findById(trainerId);

      return {
        shopItem: updatedShopItem,
        totalCost,
        remainingCurrency: updatedTrainer?.currency_amount ?? 0,
      };
    });
  }
}
