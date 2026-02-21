import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ItemRow = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  type: string | null;
  rarity: string | null;
  effect: string | null;
  base_price: number;
  created_at: Date;
  updated_at: Date;
};

export type ItemCreateInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  type?: string | null;
  rarity?: string | null;
  effect?: string | null;
  basePrice?: number;
};

export type ItemUpdateInput = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string;
  type?: string | null;
  rarity?: string | null;
  effect?: string | null;
  basePrice?: number;
};

export type ItemQueryOptions = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'base_price' | 'category' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  type?: string;
  rarity?: string;
};

export type PaginatedItems = {
  data: ItemRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class ItemRepository extends BaseRepository<ItemRow, ItemCreateInput, ItemUpdateInput> {
  constructor() {
    super('items');
  }

  async findAll(options: ItemQueryOptions = {}): Promise<PaginatedItems> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
      category = '',
      type = '',
      rarity = '',
    } = options;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      conditions.push(`(name ILIKE $${params.length - 1} OR description ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    if (rarity) {
      params.push(rarity);
      conditions.push(`rarity = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM items WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get paginated data
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const dataResult = await db.query<ItemRow>(
      `
        SELECT * FROM items
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<ItemRow | null> {
    const result = await db.query<ItemRow>(
      'SELECT * FROM items WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findByName(name: string): Promise<ItemRow | null> {
    const result = await db.query<ItemRow>(
      'SELECT * FROM items WHERE name = $1',
      [name]
    );
    return result.rows[0] ?? null;
  }

  async findByNames(names: string[]): Promise<ItemRow[]> {
    if (!names || names.length === 0) {
      return [];
    }

    const placeholders = names.map((_, index) => `$${index + 1}`).join(', ');
    const result = await db.query<ItemRow>(
      `SELECT * FROM items WHERE name IN (${placeholders}) ORDER BY name ASC`,
      names
    );
    return result.rows;
  }

  async findByCategory(category: string): Promise<ItemRow[]> {
    const result = await db.query<ItemRow>(
      'SELECT * FROM items WHERE category = $1 ORDER BY name ASC',
      [category]
    );
    return result.rows;
  }

  async getAllCategories(): Promise<string[]> {
    const result = await db.query<{ category: string }>(
      'SELECT DISTINCT category FROM items ORDER BY category ASC'
    );
    return result.rows.map((row) => row.category);
  }

  async getAllTypes(): Promise<string[]> {
    const result = await db.query<{ type: string }>(
      'SELECT DISTINCT type FROM items WHERE type IS NOT NULL ORDER BY type ASC'
    );
    return result.rows.map((row) => row.type);
  }

  async getAllRarities(): Promise<string[]> {
    const result = await db.query<{ rarity: string }>(
      'SELECT DISTINCT rarity FROM items WHERE rarity IS NOT NULL ORDER BY rarity ASC'
    );
    return result.rows.map((row) => row.rarity);
  }

  override async create(input: ItemCreateInput): Promise<ItemRow> {
    const result = await db.query<ItemRow>(
      `
        INSERT INTO items (name, description, image_url, category, type, rarity, effect, base_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        input.name,
        input.description ?? null,
        input.imageUrl ?? null,
        input.category,
        input.type ?? null,
        input.rarity ?? null,
        input.effect ?? null,
        input.basePrice ?? 0,
      ]
    );
    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert item');
    }
    return insertedRow;
  }

  override async update(id: number, input: ItemUpdateInput): Promise<ItemRow> {
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
    if (input.imageUrl !== undefined) {
      values.push(input.imageUrl);
      updates.push(`image_url = $${values.length}`);
    }
    if (input.category !== undefined) {
      values.push(input.category);
      updates.push(`category = $${values.length}`);
    }
    if (input.type !== undefined) {
      values.push(input.type);
      updates.push(`type = $${values.length}`);
    }
    if (input.rarity !== undefined) {
      values.push(input.rarity);
      updates.push(`rarity = $${values.length}`);
    }
    if (input.effect !== undefined) {
      values.push(input.effect);
      updates.push(`effect = $${values.length}`);
    }
    if (input.basePrice !== undefined) {
      values.push(input.basePrice);
      updates.push(`base_price = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Item not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query<ItemRow>(
      `UPDATE items SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const updatedRow = result.rows[0];
    if (!updatedRow) {
      throw new Error('Item not found after update');
    }
    return updatedRow;
  }

  async batchUpdateImages(updates: { id: number; imageUrl: string }[]): Promise<number> {
    if (updates.length === 0) { return 0; }

    return db.transaction(async (client) => {
      let updated = 0;
      for (const { id, imageUrl } of updates) {
        const result = await client.query(
          'UPDATE items SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [imageUrl, id]
        );
        updated += result.rowCount ?? 0;
      }
      return updated;
    });
  }
}
