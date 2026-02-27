import { BaseRepository } from './base.repository';
import { db } from '../database';

// =============================================================================
// Category Types
// =============================================================================

export type BookmarkCategoryRow = {
  id: number;
  user_id: number;
  title: string;
  sort_order: number;
  created_at: Date;
};

export type BookmarkCategory = {
  id: number;
  userId: number;
  title: string;
  sortOrder: number;
  createdAt: Date;
};

export type BookmarkCategoryWithCounts = BookmarkCategory & {
  itemCount: number;
};

export type BookmarkCategoryCreateInput = {
  userId: number;
  title: string;
  sortOrder?: number;
};

export type BookmarkCategoryUpdateInput = Partial<Omit<BookmarkCategoryCreateInput, 'userId'>>;

// =============================================================================
// Item Types
// =============================================================================

export type BookmarkItemType = 'trainer' | 'monster';

export type BookmarkItemRow = {
  id: number;
  category_id: number;
  item_type: BookmarkItemType;
  item_id: number;
  pos_x: string;
  pos_y: string;
  card_width: string;
  card_height: string | null;
  created_at: Date;
};

export type BookmarkItem = {
  id: number;
  categoryId: number;
  itemType: BookmarkItemType;
  itemId: number;
  posX: number;
  posY: number;
  cardWidth: number;
  cardHeight: number | null;
  createdAt: Date;
};

export type BookmarkItemWithDetails = BookmarkItem & {
  itemName: string | null;
  itemImage: string | null;
  itemSpecies1: string | null;
  itemSpecies2: string | null;
  itemSpecies3: string | null;
  itemType1: string | null;
  itemType2: string | null;
  itemType3: string | null;
  itemType4: string | null;
  itemType5: string | null;
  itemType6: string | null;
  itemAttribute: string | null;
};

export type BookmarkItemCreateInput = {
  categoryId: number;
  itemType: BookmarkItemType;
  itemId: number;
  posX?: number;
  posY?: number;
  cardWidth?: number;
  cardHeight?: number | null;
};

// =============================================================================
// Text Note Types
// =============================================================================

export type BookmarkTextNoteRow = {
  id: number;
  category_id: number;
  content: string;
  pos_x: string;
  pos_y: string;
  font_size: number;
  width: string;
  color: string;
  created_at: Date;
};

export type BookmarkTextNote = {
  id: number;
  categoryId: number;
  content: string;
  posX: number;
  posY: number;
  fontSize: number;
  width: number;
  color: string;
  createdAt: Date;
};

export type BookmarkTextNoteCreateInput = {
  categoryId: number;
  content?: string;
  posX?: number;
  posY?: number;
  fontSize?: number;
  width?: number;
  color?: string;
};

export type BookmarkTextNoteUpdateInput = Partial<Omit<BookmarkTextNoteCreateInput, 'categoryId'>>;

// =============================================================================
// Normalizers
// =============================================================================

const normalizeCategory = (row: BookmarkCategoryRow): BookmarkCategory => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
});

type BookmarkCategoryWithCountsRow = BookmarkCategoryRow & { item_count: string };

const normalizeCategoryWithCounts = (row: BookmarkCategoryWithCountsRow): BookmarkCategoryWithCounts => ({
  ...normalizeCategory(row),
  itemCount: parseInt(row.item_count, 10),
});

const normalizeItem = (row: BookmarkItemRow): BookmarkItem => ({
  id: row.id,
  categoryId: row.category_id,
  itemType: row.item_type,
  itemId: row.item_id,
  posX: parseFloat(row.pos_x),
  posY: parseFloat(row.pos_y),
  cardWidth: parseFloat(row.card_width),
  cardHeight: row.card_height ? parseFloat(row.card_height) : null,
  createdAt: row.created_at,
});

type BookmarkItemWithDetailsRow = BookmarkItemRow & {
  item_name: string | null;
  item_image: string | null;
  item_species1: string | null;
  item_species2: string | null;
  item_species3: string | null;
  item_type1: string | null;
  item_type2: string | null;
  item_type3: string | null;
  item_type4: string | null;
  item_type5: string | null;
  item_type6: string | null;
  item_attribute: string | null;
};

const normalizeItemWithDetails = (row: BookmarkItemWithDetailsRow): BookmarkItemWithDetails => ({
  ...normalizeItem(row),
  itemName: row.item_name,
  itemImage: row.item_image,
  itemSpecies1: row.item_species1,
  itemSpecies2: row.item_species2,
  itemSpecies3: row.item_species3,
  itemType1: row.item_type1,
  itemType2: row.item_type2,
  itemType3: row.item_type3,
  itemType4: row.item_type4,
  itemType5: row.item_type5,
  itemType6: row.item_type6,
  itemAttribute: row.item_attribute,
});

const normalizeTextNote = (row: BookmarkTextNoteRow): BookmarkTextNote => ({
  id: row.id,
  categoryId: row.category_id,
  content: row.content,
  posX: parseFloat(row.pos_x),
  posY: parseFloat(row.pos_y),
  fontSize: row.font_size,
  width: parseFloat(row.width),
  color: row.color,
  createdAt: row.created_at,
});

// =============================================================================
// Repository
// =============================================================================

export class BookmarkRepository extends BaseRepository<
  BookmarkCategory,
  BookmarkCategoryCreateInput,
  BookmarkCategoryUpdateInput
> {
  constructor() {
    super('bookmark_categories');
  }

  // =========================================================================
  // Category Methods
  // =========================================================================

  override async findById(id: number): Promise<BookmarkCategory | null> {
    const result = await db.query<BookmarkCategoryRow>(
      'SELECT * FROM bookmark_categories WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeCategory(row) : null;
  }

  async findByIdWithOwner(id: number, userId: number): Promise<BookmarkCategory | null> {
    const result = await db.query<BookmarkCategoryRow>(
      'SELECT * FROM bookmark_categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    const row = result.rows[0];
    return row ? normalizeCategory(row) : null;
  }

  async findByUserIdWithCounts(userId: number): Promise<BookmarkCategoryWithCounts[]> {
    const result = await db.query<BookmarkCategoryWithCountsRow>(
      `
        SELECT c.*, COUNT(bi.id) as item_count
        FROM bookmark_categories c
        LEFT JOIN bookmark_items bi ON c.id = bi.category_id
        WHERE c.user_id = $1
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.created_at DESC
      `,
      [userId]
    );
    return result.rows.map(normalizeCategoryWithCounts);
  }

  override async create(input: BookmarkCategoryCreateInput): Promise<BookmarkCategory> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bookmark_categories (user_id, title, sort_order)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [input.userId, input.title, input.sortOrder ?? 0]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert bookmark category');
    }
    const category = await this.findById(insertedRow.id);
    if (!category) {
      throw new Error('Failed to create bookmark category');
    }
    return category;
  }

  override async update(id: number, input: BookmarkCategoryUpdateInput): Promise<BookmarkCategory> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.sortOrder !== undefined) {
      values.push(input.sortOrder);
      updates.push(`sort_order = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Bookmark category not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE bookmark_categories SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Bookmark category not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM bookmark_categories WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // =========================================================================
  // Item Methods
  // =========================================================================

  async getItemsByCategory(categoryId: number, userId: number): Promise<BookmarkItemWithDetails[]> {
    const result = await db.query<BookmarkItemWithDetailsRow>(
      `
        SELECT bi.*,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.name
                 WHEN bi.item_type = 'monster' THEN m.name
               END as item_name,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.main_ref
                 WHEN bi.item_type = 'monster' THEN m.img_link
               END as item_image,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.species1
                 WHEN bi.item_type = 'monster' THEN m.species1
               END as item_species1,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.species2
                 WHEN bi.item_type = 'monster' THEN m.species2
               END as item_species2,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.species3
                 WHEN bi.item_type = 'monster' THEN m.species3
               END as item_species3,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type1
                 WHEN bi.item_type = 'monster' THEN m.type1
               END as item_type1,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type2
                 WHEN bi.item_type = 'monster' THEN m.type2
               END as item_type2,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type3
                 WHEN bi.item_type = 'monster' THEN m.type3
               END as item_type3,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type4
                 WHEN bi.item_type = 'monster' THEN m.type4
               END as item_type4,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type5
                 WHEN bi.item_type = 'monster' THEN m.type5
               END as item_type5,
               CASE
                 WHEN bi.item_type = 'trainer' THEN t.type6
                 ELSE NULL
               END as item_type6,
               CASE
                 WHEN bi.item_type = 'monster' THEN m.attribute
                 ELSE NULL
               END as item_attribute
        FROM bookmark_items bi
        JOIN bookmark_categories c ON bi.category_id = c.id
        LEFT JOIN trainers t ON bi.item_type = 'trainer' AND bi.item_id = t.id
        LEFT JOIN monsters m ON bi.item_type = 'monster' AND bi.item_id = m.id
        WHERE bi.category_id = $1 AND c.user_id = $2
        ORDER BY bi.created_at ASC
      `,
      [categoryId, userId]
    );
    return result.rows.map(normalizeItemWithDetails);
  }

  async createItem(input: BookmarkItemCreateInput, userId: number): Promise<BookmarkItem> {
    // Verify category ownership
    const category = await this.findByIdWithOwner(input.categoryId, userId);
    if (!category) {
      throw new Error('Category not found or access denied');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bookmark_items (category_id, item_type, item_id, pos_x, pos_y, card_width, card_height)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.categoryId,
        input.itemType,
        input.itemId,
        input.posX ?? 10,
        input.posY ?? 10,
        input.cardWidth ?? 15,
        input.cardHeight ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert bookmark item');
    }

    const itemResult = await db.query<BookmarkItemRow>(
      'SELECT * FROM bookmark_items WHERE id = $1',
      [insertedRow.id]
    );
    const row = itemResult.rows[0];
    if (!row) {
      throw new Error('Failed to create bookmark item');
    }
    return normalizeItem(row);
  }

  async updateItemPosition(id: number, userId: number, posX: number, posY: number, cardWidth?: number, cardHeight?: number | null): Promise<BookmarkItem | null> {
    const setClauses = ['pos_x = $1', 'pos_y = $2'];
    const values: unknown[] = [posX, posY];

    if (cardWidth !== undefined) {
      values.push(cardWidth);
      setClauses.push(`card_width = $${values.length}`);
    }
    if (cardHeight !== undefined) {
      values.push(cardHeight);
      setClauses.push(`card_height = $${values.length}`);
    }

    values.push(id);
    values.push(userId);

    const result = await db.query(
      `
        UPDATE bookmark_items
        SET ${setClauses.join(', ')}
        WHERE id = $${values.length - 1} AND category_id IN (
          SELECT c.id FROM bookmark_categories c WHERE c.user_id = $${values.length}
        )
      `,
      values
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    const itemResult = await db.query<BookmarkItemRow>(
      'SELECT * FROM bookmark_items WHERE id = $1',
      [id]
    );
    const row = itemResult.rows[0];
    return row ? normalizeItem(row) : null;
  }

  async bulkUpdatePositions(
    positions: Array<{ id: number; posX: number; posY: number }>,
    userId: number
  ): Promise<boolean> {
    for (const pos of positions) {
      await db.query(
        `
          UPDATE bookmark_items
          SET pos_x = $1, pos_y = $2
          WHERE id = $3 AND category_id IN (
            SELECT c.id FROM bookmark_categories c WHERE c.user_id = $4
          )
        `,
        [pos.posX, pos.posY, pos.id, userId]
      );
    }
    return true;
  }

  async deleteItem(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM bookmark_items
        WHERE id = $1 AND category_id IN (
          SELECT c.id FROM bookmark_categories c WHERE c.user_id = $2
        )
      `,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // =========================================================================
  // Text Note Methods
  // =========================================================================

  async getNotesByCategory(categoryId: number, userId: number): Promise<BookmarkTextNote[]> {
    const result = await db.query<BookmarkTextNoteRow>(
      `
        SELECT n.*
        FROM bookmark_text_notes n
        JOIN bookmark_categories c ON n.category_id = c.id
        WHERE n.category_id = $1 AND c.user_id = $2
        ORDER BY n.created_at ASC
      `,
      [categoryId, userId]
    );
    return result.rows.map(normalizeTextNote);
  }

  async createNote(input: BookmarkTextNoteCreateInput, userId: number): Promise<BookmarkTextNote> {
    const category = await this.findByIdWithOwner(input.categoryId, userId);
    if (!category) {
      throw new Error('Category not found or access denied');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bookmark_text_notes (category_id, content, pos_x, pos_y, font_size, width, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        input.categoryId,
        input.content ?? '',
        input.posX ?? 50,
        input.posY ?? 50,
        input.fontSize ?? 14,
        input.width ?? 20,
        input.color ?? '#ffffff',
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert text note');
    }

    const noteResult = await db.query<BookmarkTextNoteRow>(
      'SELECT * FROM bookmark_text_notes WHERE id = $1',
      [insertedRow.id]
    );
    const row = noteResult.rows[0];
    if (!row) {
      throw new Error('Failed to create text note');
    }
    return normalizeTextNote(row);
  }

  async updateNote(id: number, userId: number, input: BookmarkTextNoteUpdateInput): Promise<BookmarkTextNote | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.content !== undefined) {
      values.push(input.content);
      updates.push(`content = $${values.length}`);
    }
    if (input.posX !== undefined) {
      values.push(input.posX);
      updates.push(`pos_x = $${values.length}`);
    }
    if (input.posY !== undefined) {
      values.push(input.posY);
      updates.push(`pos_y = $${values.length}`);
    }
    if (input.fontSize !== undefined) {
      values.push(input.fontSize);
      updates.push(`font_size = $${values.length}`);
    }
    if (input.width !== undefined) {
      values.push(input.width);
      updates.push(`width = $${values.length}`);
    }
    if (input.color !== undefined) {
      values.push(input.color);
      updates.push(`color = $${values.length}`);
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    values.push(userId);

    const result = await db.query(
      `
        UPDATE bookmark_text_notes
        SET ${updates.join(', ')}
        WHERE id = $${values.length - 1} AND category_id IN (
          SELECT c.id FROM bookmark_categories c WHERE c.user_id = $${values.length}
        )
      `,
      values
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    const noteResult = await db.query<BookmarkTextNoteRow>(
      'SELECT * FROM bookmark_text_notes WHERE id = $1',
      [id]
    );
    const row = noteResult.rows[0];
    return row ? normalizeTextNote(row) : null;
  }

  async deleteNote(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM bookmark_text_notes
        WHERE id = $1 AND category_id IN (
          SELECT c.id FROM bookmark_categories c WHERE c.user_id = $2
        )
      `,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
