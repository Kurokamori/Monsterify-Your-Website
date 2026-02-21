import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ShopRow = {
  id: number;
  shop_id: string;
  name: string;
  description: string | null;
  flavor_text: string | null;
  banner_image: string | null;
  category: string | null;
  price_modifier: number;
  is_constant: boolean;
  is_active: boolean;
  visibility_condition: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ShopItemRow = {
  id: number;
  shop_id: string;
  item_id: number;
  price: number;
  max_quantity: number | null;
  current_quantity: number | null;
  date: string | null;
  // Joined from items table
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  type: string | null;
  rarity: string | null;
  effect: string | null;
};

export type ShopCreateInput = {
  shopId: string;
  name: string;
  description?: string | null;
  flavorText?: string | null;
  bannerImage?: string | null;
  category?: string | null;
  priceModifier?: number;
  isConstant?: boolean;
  isActive?: boolean;
  visibilityCondition?: string | null;
};

export type ShopUpdateInput = {
  name?: string;
  description?: string | null;
  flavorText?: string | null;
  bannerImage?: string | null;
  category?: string | null;
  priceModifier?: number;
  isConstant?: boolean;
  isActive?: boolean;
  visibilityCondition?: string | null;
};

export type ShopItemCreateInput = {
  shopId: string;
  itemId: number;
  price: number;
  maxQuantity?: number | null;
  currentQuantity?: number | null;
  date?: string | null;
};

export type ShopItemUpdateInput = {
  price?: number;
  maxQuantity?: number | null;
  currentQuantity?: number | null;
};

export type VisibilityCondition = {
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
  random_chance?: number;
  manually_enabled?: boolean;
};

export class ShopRepository extends BaseRepository<ShopRow, ShopCreateInput, ShopUpdateInput> {
  constructor() {
    super('shops');
  }

  async findAll(): Promise<ShopRow[]> {
    const result = await db.query<ShopRow>(
      'SELECT * FROM shops ORDER BY name ASC'
    );
    return result.rows;
  }

  async findAllActive(): Promise<ShopRow[]> {
    const result = await db.query<ShopRow>(
      'SELECT * FROM shops WHERE is_active::boolean = true ORDER BY name ASC'
    );
    return result.rows;
  }

  override async findById(id: number): Promise<ShopRow | null> {
    const result = await db.query<ShopRow>(
      'SELECT * FROM shops WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByShopId(shopId: string): Promise<ShopRow | null> {
    const result = await db.query<ShopRow>(
      'SELECT * FROM shops WHERE shop_id = $1',
      [shopId]
    );
    return result.rows[0] ?? null;
  }

  async findVisibleShops(userId?: number): Promise<ShopRow[]> {
    const shops = await this.findAllActive();

    return shops.filter((shop) => {
      if (shop.is_constant) {
        return true;
      }

      if (!shop.visibility_condition) {
        return true;
      }

      try {
        const condition = JSON.parse(shop.visibility_condition) as VisibilityCondition;

        // Check day of week
        if (condition.days_of_week) {
          const today = new Date().getDay();
          if (!condition.days_of_week.includes(today)) {
            return false;
          }
        }

        // Check date range
        if (condition.start_date && condition.end_date) {
          const now = new Date();
          const startDate = new Date(condition.start_date);
          const endDate = new Date(condition.end_date);
          if (now < startDate || now > endDate) {
            return false;
          }
        }

        // Check random chance (deterministic based on userId and date)
        if (condition.random_chance && userId) {
          const dateStr = new Date().toISOString().split('T')[0];
          const seed = `${userId}-${shop.shop_id}-${dateStr}`;
          const hash = this.hashString(seed);
          const randomValue = hash / Number.MAX_SAFE_INTEGER;
          if (randomValue > condition.random_chance) {
            return false;
          }
        }

        // Check manual enable
        if (condition.manually_enabled === false) {
          return false;
        }

        return true;
      } catch {
        return true; // Default to visible if parsing fails
      }
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async getShopItems(shopId: string, date?: string): Promise<ShopItemRow[]> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const result = await db.query<ShopItemRow>(
      `SELECT si.*, i.name, i.description, i.image_url, i.category, i.type, i.rarity, i.effect
       FROM shop_items si
       JOIN items i ON si.item_id = i.id
       WHERE si.shop_id = $1 AND si.date = $2
       ORDER BY i.name ASC`,
      [shopId, targetDate]
    );
    return result.rows;
  }

  override async create(input: ShopCreateInput): Promise<ShopRow> {
    const result = await db.query<ShopRow>(
      `
        INSERT INTO shops (
          shop_id, name, description, flavor_text, banner_image,
          category, price_modifier, is_constant, is_active, visibility_condition
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        input.shopId,
        input.name,
        input.description ?? null,
        input.flavorText ?? null,
        input.bannerImage ?? null,
        input.category ?? null,
        input.priceModifier ?? 1.0,
        input.isConstant ?? true,
        input.isActive ?? true,
        input.visibilityCondition ?? null,
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create shop');
    }
    return row;
  }

  override async update(id: number, input: ShopUpdateInput): Promise<ShopRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.flavorText !== undefined) {
      values.push(input.flavorText);
      updates.push(`flavor_text = $${values.length}`);
    }
    if (input.bannerImage !== undefined) {
      values.push(input.bannerImage);
      updates.push(`banner_image = $${values.length}`);
    }
    if (input.category !== undefined) {
      values.push(input.category);
      updates.push(`category = $${values.length}`);
    }
    if (input.priceModifier !== undefined) {
      values.push(input.priceModifier);
      updates.push(`price_modifier = $${values.length}`);
    }
    if (input.isConstant !== undefined) {
      values.push(input.isConstant);
      updates.push(`is_constant = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (input.visibilityCondition !== undefined) {
      values.push(input.visibilityCondition);
      updates.push(`visibility_condition = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Shop not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query<ShopRow>(
      `UPDATE shops SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Shop not found after update');
    }
    return row;
  }

  async updateByShopId(shopId: string, input: ShopUpdateInput): Promise<ShopRow> {
    const shop = await this.findByShopId(shopId);
    if (!shop) {
      throw new Error(`Shop with shop_id ${shopId} not found`);
    }
    return this.update(shop.id, input);
  }

  // ===========================================================================
  // Shop Item CRUD
  // ===========================================================================

  async findShopItemById(id: number): Promise<ShopItemRow | null> {
    const result = await db.query<ShopItemRow>(
      'SELECT * FROM shop_items WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findShopItemByShopAndItemId(shopId: string, itemId: number): Promise<ShopItemRow | null> {
    const result = await db.query<ShopItemRow>(
      'SELECT si.*, i.name, i.description, i.image_url, i.category, i.type, i.rarity, i.effect FROM shop_items si JOIN items i ON si.item_id = i.id WHERE si.shop_id = $1 AND si.item_id = $2',
      [shopId, itemId]
    );
    return result.rows[0] ?? null;
  }

  async addShopItem(input: ShopItemCreateInput): Promise<ShopItemRow> {
    const insertResult = await db.query<{ id: number }>(
      `
        INSERT INTO shop_items (shop_id, item_id, price, max_quantity, current_quantity, date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.shopId,
        input.itemId,
        input.price,
        input.maxQuantity ?? null,
        input.currentQuantity ?? null,
        input.date ?? new Date().toISOString().split('T')[0],
      ]
    );
    const inserted = insertResult.rows[0];
    if (!inserted) {
      throw new Error('Failed to add shop item');
    }

    // Return with joined item data
    const result = await db.query<ShopItemRow>(
      `SELECT si.*, i.name, i.description, i.image_url, i.category, i.type, i.rarity, i.effect
       FROM shop_items si
       JOIN items i ON si.item_id = i.id
       WHERE si.id = $1`,
      [inserted.id]
    );
    if (!result.rows[0]) {
      throw new Error('Failed to retrieve created shop item');
    }
    return result.rows[0];
  }

  async updateShopItem(id: number, input: ShopItemUpdateInput): Promise<ShopItemRow> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.price !== undefined) {
      values.push(input.price);
      updates.push(`price = $${values.length}`);
    }
    if (input.maxQuantity !== undefined) {
      values.push(input.maxQuantity);
      updates.push(`max_quantity = $${values.length}`);
    }
    if (input.currentQuantity !== undefined) {
      values.push(input.currentQuantity);
      updates.push(`current_quantity = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findShopItemById(id);
      if (!existing) {
        throw new Error('Shop item not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query<ShopItemRow>(
      `UPDATE shop_items SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Shop item not found after update');
    }
    return row;
  }

  async removeShopItem(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM shop_items WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async reduceShopItemStock(id: number, quantity: number): Promise<ShopItemRow> {
    const result = await db.query<ShopItemRow>(
      `
        UPDATE shop_items
        SET current_quantity = current_quantity - $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND (current_quantity IS NULL OR current_quantity >= $1)
        RETURNING *
      `,
      [quantity, id]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Shop item not found or insufficient stock');
    }
    return row;
  }
}
