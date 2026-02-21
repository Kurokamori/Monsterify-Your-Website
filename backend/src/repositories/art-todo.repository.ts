import { BaseRepository } from './base.repository';
import { db } from '../database';

// Art Todo List Types
export type ArtTodoListRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  created_at: Date;
};

export type ArtTodoList = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  createdAt: Date;
};

export type ArtTodoListWithCounts = ArtTodoList & {
  itemCount: number;
  completedCount: number;
};

export type ArtTodoListWithItems = ArtTodoList & {
  items: ArtTodoItemWithDetails[];
};

// Art Todo Item Types
export type ArtTodoItemPriority = 'low' | 'medium' | 'high';
export type ArtTodoItemStatus = 'pending' | 'in_progress' | 'completed';

export type ArtTodoItemRow = {
  id: number;
  list_id: number;
  title: string;
  description: string | null;
  status: ArtTodoItemStatus;
  priority: ArtTodoItemPriority;
  due_date: Date | null;
  is_persistent: boolean;
  steps_total: number;
  steps_completed: number;
  created_at: Date;
  updated_at: Date;
};

export type ArtTodoItem = {
  id: number;
  listId: number;
  title: string;
  description: string | null;
  status: ArtTodoItemStatus;
  priority: ArtTodoItemPriority;
  dueDate: Date | null;
  isPersistent: boolean;
  stepsTotal: number;
  stepsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArtTodoItemWithDetails = ArtTodoItem & {
  references: ArtTodoReferenceWithDetails[];
};

// Art Todo Reference Types
export type ArtTodoReferenceType = 'trainer' | 'monster';

export type ArtTodoReferenceRow = {
  id: number;
  item_id: number;
  reference_type: ArtTodoReferenceType;
  reference_id: number;
  created_at: Date;
};

export type ArtTodoReference = {
  id: number;
  itemId: number;
  referenceType: ArtTodoReferenceType;
  referenceId: number;
  createdAt: Date;
};

export type ArtTodoReferenceWithDetails = ArtTodoReference & {
  referenceName: string | null;
  referenceImage: string | null;
};

// Input Types
export type ArtTodoListCreateInput = {
  userId: number;
  title: string;
  description?: string | null;
};

export type ArtTodoListUpdateInput = Partial<Omit<ArtTodoListCreateInput, 'userId'>>;

export type ArtTodoItemCreateInput = {
  listId: number;
  title: string;
  description?: string | null;
  status?: ArtTodoItemStatus;
  priority?: ArtTodoItemPriority;
  dueDate?: Date | null;
  isPersistent?: boolean;
  stepsTotal?: number;
  stepsCompleted?: number;
};

export type ArtTodoItemUpdateInput = Partial<Omit<ArtTodoItemCreateInput, 'listId'>>;

export type ArtTodoReferenceCreateInput = {
  itemId: number;
  referenceType: ArtTodoReferenceType;
  referenceId: number;
};

// Normalizers
const normalizeArtTodoList = (row: ArtTodoListRow): ArtTodoList => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
});

const normalizeArtTodoItem = (row: ArtTodoItemRow): ArtTodoItem => ({
  id: row.id,
  listId: row.list_id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date,
  isPersistent: row.is_persistent,
  stepsTotal: row.steps_total,
  stepsCompleted: row.steps_completed,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeArtTodoReference = (row: ArtTodoReferenceRow): ArtTodoReference => ({
  id: row.id,
  itemId: row.item_id,
  referenceType: row.reference_type,
  referenceId: row.reference_id,
  createdAt: row.created_at,
});

type ArtTodoReferenceWithDetailsRow = ArtTodoReferenceRow & {
  reference_name: string | null;
  reference_image: string | null;
};

const normalizeArtTodoReferenceWithDetails = (row: ArtTodoReferenceWithDetailsRow): ArtTodoReferenceWithDetails => ({
  ...normalizeArtTodoReference(row),
  referenceName: row.reference_name,
  referenceImage: row.reference_image,
});

type ArtTodoListWithCountsRow = ArtTodoListRow & {
  item_count: string;
  completed_count: string;
};

const normalizeArtTodoListWithCounts = (row: ArtTodoListWithCountsRow): ArtTodoListWithCounts => ({
  ...normalizeArtTodoList(row),
  itemCount: parseInt(row.item_count, 10),
  completedCount: parseInt(row.completed_count, 10),
});

export class ArtTodoRepository extends BaseRepository<
  ArtTodoList,
  ArtTodoListCreateInput,
  ArtTodoListUpdateInput
> {
  constructor() {
    super('art_todo_lists');
  }

  // List Methods
  override async findById(id: number): Promise<ArtTodoList | null> {
    const result = await db.query<ArtTodoListRow>(
      'SELECT * FROM art_todo_lists WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeArtTodoList(row) : null;
  }

  async findByIdWithOwner(id: number, userId: number): Promise<ArtTodoList | null> {
    const result = await db.query<ArtTodoListRow>(
      'SELECT * FROM art_todo_lists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    const row = result.rows[0];
    return row ? normalizeArtTodoList(row) : null;
  }

  async findByUserId(userId: number): Promise<ArtTodoList[]> {
    const result = await db.query<ArtTodoListRow>(
      'SELECT * FROM art_todo_lists WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows.map(normalizeArtTodoList);
  }

  async findByUserIdWithCounts(userId: number): Promise<ArtTodoListWithCounts[]> {
    const result = await db.query<ArtTodoListWithCountsRow>(
      `
        SELECT
          l.id, l.user_id, l.title, l.description, l.created_at,
          COUNT(i.id) as item_count,
          COUNT(CASE WHEN i.status = 'completed' THEN 1 ELSE NULL END) as completed_count
        FROM art_todo_lists l
        LEFT JOIN art_todo_items i ON l.id = i.list_id
        WHERE l.user_id = $1
        GROUP BY l.id, l.user_id, l.title, l.description, l.created_at
        ORDER BY l.created_at DESC
      `,
      [userId]
    );
    return result.rows.map(normalizeArtTodoListWithCounts);
  }

  async findByIdWithItems(id: number, userId: number): Promise<ArtTodoListWithItems | null> {
    const list = await this.findByIdWithOwner(id, userId);
    if (!list) {return null;}

    const items = await this.getItemsWithReferences(id, userId);
    return {
      ...list,
      items,
    };
  }

  override async create(input: ArtTodoListCreateInput): Promise<ArtTodoList> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO art_todo_lists (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [input.userId, input.title, input.description ?? null]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert art todo list');
    }
    const list = await this.findById(insertedRow.id);
    if (!list) {
      throw new Error('Failed to create art todo list');
    }
    return list;
  }

  override async update(id: number, input: ArtTodoListUpdateInput): Promise<ArtTodoList> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Art todo list not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE art_todo_lists SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Art todo list not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    // Items and references are deleted via CASCADE
    const result = await db.query('DELETE FROM art_todo_lists WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Item Methods
  async getItemsByList(listId: number, userId: number): Promise<ArtTodoItem[]> {
    const result = await db.query<ArtTodoItemRow>(
      `
        SELECT i.* FROM art_todo_items i
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE i.list_id = $1 AND l.user_id = $2
        ORDER BY
          CASE i.status
            WHEN 'pending' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'completed' THEN 3
          END,
          CASE i.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          i.created_at DESC
      `,
      [listId, userId]
    );
    return result.rows.map(normalizeArtTodoItem);
  }

  async getRecentItemsByUser(userId: number, limit: number): Promise<ArtTodoItem[]> {
    const result = await db.query<ArtTodoItemRow>(
      `
        SELECT i.* FROM art_todo_items i
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE l.user_id = $1 AND i.status != 'completed'
        ORDER BY
          CASE i.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          i.created_at DESC
        LIMIT $2
      `,
      [userId, limit]
    );
    return result.rows.map(normalizeArtTodoItem);
  }

  async getItemById(id: number, userId: number): Promise<ArtTodoItem | null> {
    const result = await db.query<ArtTodoItemRow>(
      `
        SELECT i.* FROM art_todo_items i
        JOIN art_todo_lists l ON i.list_id = l.id
        WHERE i.id = $1 AND l.user_id = $2
      `,
      [id, userId]
    );
    const row = result.rows[0];
    return row ? normalizeArtTodoItem(row) : null;
  }

  async getItemsWithReferences(listId: number, userId: number): Promise<ArtTodoItemWithDetails[]> {
    const items = await this.getItemsByList(listId, userId);
    const result: ArtTodoItemWithDetails[] = [];

    for (const item of items) {
      const references = await this.getReferencesByItem(item.id, userId);
      result.push({
        ...item,
        references,
      });
    }

    return result;
  }

  async createItem(input: ArtTodoItemCreateInput, userId: number): Promise<ArtTodoItem> {
    // Verify list ownership
    const list = await this.findByIdWithOwner(input.listId, userId);
    if (!list) {
      throw new Error('List not found or access denied');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO art_todo_items (
          list_id, title, description, status, priority,
          due_date, is_persistent, steps_total, steps_completed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        input.listId,
        input.title,
        input.description ?? null,
        input.status ?? 'pending',
        input.priority ?? 'medium',
        input.dueDate ?? null,
        input.isPersistent ?? false,
        input.stepsTotal ?? 0,
        input.stepsCompleted ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert art todo item');
    }
    const item = await this.getItemById(insertedRow.id, userId);
    if (!item) {
      throw new Error('Failed to create art todo item');
    }
    return item;
  }

  async updateItem(id: number, userId: number, input: ArtTodoItemUpdateInput): Promise<ArtTodoItem> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.priority !== undefined) {
      values.push(input.priority);
      updates.push(`priority = $${values.length}`);
    }
    if (input.dueDate !== undefined) {
      values.push(input.dueDate);
      updates.push(`due_date = $${values.length}`);
    }
    if (input.isPersistent !== undefined) {
      values.push(input.isPersistent);
      updates.push(`is_persistent = $${values.length}`);
    }
    if (input.stepsTotal !== undefined) {
      values.push(input.stepsTotal);
      updates.push(`steps_total = $${values.length}`);
    }
    if (input.stepsCompleted !== undefined) {
      values.push(input.stepsCompleted);
      updates.push(`steps_completed = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.getItemById(id, userId);
      if (!existing) {
        throw new Error('Art todo item not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    values.push(userId);

    await db.query(
      `
        UPDATE art_todo_items
        SET ${updates.join(', ')}
        WHERE id = $${values.length - 1} AND id IN (
          SELECT i.id FROM art_todo_items i
          JOIN art_todo_lists l ON i.list_id = l.id
          WHERE l.user_id = $${values.length}
        )
      `,
      values
    );

    const updated = await this.getItemById(id, userId);
    if (!updated) {
      throw new Error('Art todo item not found after update');
    }
    return updated;
  }

  async moveItemToList(itemId: number, newListId: number, userId: number): Promise<ArtTodoItem> {
    // Verify both lists belong to user
    const [currentItem, newList] = await Promise.all([
      this.getItemById(itemId, userId),
      this.findByIdWithOwner(newListId, userId),
    ]);

    if (!currentItem) {
      throw new Error('Item not found or access denied');
    }
    if (!newList) {
      throw new Error('New list not found or access denied');
    }

    await db.query(
      'UPDATE art_todo_items SET list_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newListId, itemId]
    );

    const moved = await this.getItemById(itemId, userId);
    if (!moved) {
      throw new Error('Failed to move item');
    }
    return moved;
  }

  async deleteItem(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM art_todo_items
        WHERE id = $1 AND id IN (
          SELECT i.id FROM art_todo_items i
          JOIN art_todo_lists l ON i.list_id = l.id
          WHERE l.user_id = $2
        )
      `,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Reference Methods
  async getReferencesByItem(itemId: number, userId: number): Promise<ArtTodoReferenceWithDetails[]> {
    const result = await db.query<ArtTodoReferenceWithDetailsRow>(
      `
        SELECT r.*,
               CASE
                 WHEN r.reference_type = 'trainer' THEN t.name
                 WHEN r.reference_type = 'monster' THEN m.name
               END as reference_name,
               CASE
                 WHEN r.reference_type = 'trainer' THEN t.main_ref
                 WHEN r.reference_type = 'monster' THEN m.img_link
               END as reference_image
        FROM art_todo_references r
        JOIN art_todo_items i ON r.item_id = i.id
        JOIN art_todo_lists l ON i.list_id = l.id
        LEFT JOIN trainers t ON r.reference_type = 'trainer' AND r.reference_id = t.id
        LEFT JOIN monsters m ON r.reference_type = 'monster' AND r.reference_id = m.id
        WHERE r.item_id = $1 AND l.user_id = $2
        ORDER BY r.created_at ASC
      `,
      [itemId, userId]
    );
    return result.rows.map(normalizeArtTodoReferenceWithDetails);
  }

  async getReferenceById(id: number, userId: number): Promise<ArtTodoReferenceWithDetails | null> {
    const result = await db.query<ArtTodoReferenceWithDetailsRow>(
      `
        SELECT r.*,
               CASE
                 WHEN r.reference_type = 'trainer' THEN t.name
                 WHEN r.reference_type = 'monster' THEN m.name
               END as reference_name,
               CASE
                 WHEN r.reference_type = 'trainer' THEN t.main_ref
                 WHEN r.reference_type = 'monster' THEN m.img_link
               END as reference_image
        FROM art_todo_references r
        JOIN art_todo_items i ON r.item_id = i.id
        JOIN art_todo_lists l ON i.list_id = l.id
        LEFT JOIN trainers t ON r.reference_type = 'trainer' AND r.reference_id = t.id
        LEFT JOIN monsters m ON r.reference_type = 'monster' AND r.reference_id = m.id
        WHERE r.id = $1 AND l.user_id = $2
      `,
      [id, userId]
    );
    const row = result.rows[0];
    return row ? normalizeArtTodoReferenceWithDetails(row) : null;
  }

  async createReference(input: ArtTodoReferenceCreateInput, userId: number): Promise<ArtTodoReferenceWithDetails> {
    // Verify item ownership
    const item = await this.getItemById(input.itemId, userId);
    if (!item) {
      throw new Error('Item not found or access denied');
    }

    // Check if reference already exists
    const existingResult = await db.query<{ id: number }>(
      'SELECT id FROM art_todo_references WHERE item_id = $1 AND reference_type = $2 AND reference_id = $3',
      [input.itemId, input.referenceType, input.referenceId]
    );
    if (existingResult.rows.length > 0) {
      throw new Error('Reference already exists for this item');
    }

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO art_todo_references (item_id, reference_type, reference_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [input.itemId, input.referenceType, input.referenceId]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert reference');
    }
    const reference = await this.getReferenceById(insertedRow.id, userId);
    if (!reference) {
      throw new Error('Failed to create reference');
    }
    return reference;
  }

  async deleteReference(id: number, userId: number): Promise<boolean> {
    const result = await db.query(
      `
        DELETE FROM art_todo_references
        WHERE id = $1 AND id IN (
          SELECT r.id FROM art_todo_references r
          JOIN art_todo_items i ON r.item_id = i.id
          JOIN art_todo_lists l ON i.list_id = l.id
          WHERE l.user_id = $2
        )
      `,
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async bulkCreateReferences(
    itemId: number,
    references: { referenceType: ArtTodoReferenceType; referenceId: number }[],
    userId: number
  ): Promise<ArtTodoReferenceWithDetails[]> {
    const results: ArtTodoReferenceWithDetails[] = [];

    for (const ref of references) {
      try {
        const result = await this.createReference(
          {
            itemId,
            referenceType: ref.referenceType,
            referenceId: ref.referenceId,
          },
          userId
        );
        results.push(result);
      } catch {
        // Skip duplicates or invalid references
      }
    }

    return results;
  }

  async getReferenceMatrix(itemId: number, userId: number): Promise<{
    trainers: ArtTodoReferenceWithDetails[];
    monsters: ArtTodoReferenceWithDetails[];
  }> {
    const references = await this.getReferencesByItem(itemId, userId);
    return {
      trainers: references.filter(ref => ref.referenceType === 'trainer'),
      monsters: references.filter(ref => ref.referenceType === 'monster'),
    };
  }
}
