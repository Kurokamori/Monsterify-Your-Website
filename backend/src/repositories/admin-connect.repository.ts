import { BaseRepository } from './base.repository';
import { db } from '../database';

// ── Row types (snake_case, matching DB columns) ─────────────────────

export type AdminConnectItemRow = {
  id: number;
  name: string;
  description: string | null;
  secret_name: string | null;
  is_secret: boolean;
  category: string;
  status: string;
  urgency: string;
  difficulty: string;
  progress: number;
  priority: number;
  data_fields: Array<{ key: string; value: string }>;
  created_by: number | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type AdminConnectSubItemRow = {
  id: number;
  item_id: number;
  name: string;
  description: string | null;
  is_completed: boolean;
  sort_order: number;
  created_at: Date;
};

// ── Domain types (camelCase) ────────────────────────────────────────

export type AdminConnectItem = {
  id: number;
  name: string;
  description: string | null;
  secretName: string | null;
  isSecret: boolean;
  category: string;
  status: string;
  urgency: string;
  difficulty: string;
  progress: number;
  priority: number;
  dataFields: Array<{ key: string; value: string }>;
  createdBy: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminConnectSubItem = {
  id: number;
  itemId: number;
  name: string;
  description: string | null;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: Date;
};

export type AdminConnectItemWithSubs = AdminConnectItem & {
  subItems: AdminConnectSubItem[];
};

// ── Input types ─────────────────────────────────────────────────────

export type AdminConnectItemCreateInput = {
  name: string;
  description?: string | null;
  secretName?: string | null;
  isSecret?: boolean;
  category?: string;
  status?: string;
  urgency?: string;
  difficulty?: string;
  progress?: number;
  priority?: number;
  dataFields?: Array<{ key: string; value: string }>;
  createdBy?: number | null;
};

export type AdminConnectItemUpdateInput = {
  name?: string;
  description?: string | null;
  secretName?: string | null;
  isSecret?: boolean;
  category?: string;
  status?: string;
  urgency?: string;
  difficulty?: string;
  progress?: number;
  priority?: number;
  dataFields?: Array<{ key: string; value: string }>;
  resolvedAt?: Date | null;
};

export type AdminConnectSubItemCreateInput = {
  itemId: number;
  name: string;
  description?: string | null;
  sortOrder?: number;
};

export type AdminConnectSubItemUpdateInput = {
  name?: string;
  description?: string | null;
  isCompleted?: boolean;
  sortOrder?: number;
};

// ── Normalizers ─────────────────────────────────────────────────────

function normalizeItem(row: AdminConnectItemRow): AdminConnectItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    secretName: row.secret_name,
    isSecret: row.is_secret,
    category: row.category,
    status: row.status,
    urgency: row.urgency,
    difficulty: row.difficulty,
    progress: row.progress,
    priority: row.priority,
    dataFields: row.data_fields ?? [],
    createdBy: row.created_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeSubItem(row: AdminConnectSubItemRow): AdminConnectSubItem {
  return {
    id: row.id,
    itemId: row.item_id,
    name: row.name,
    description: row.description,
    isCompleted: row.is_completed,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

// ── Repository ──────────────────────────────────────────────────────

export class AdminConnectRepository extends BaseRepository<
  AdminConnectItem,
  AdminConnectItemCreateInput,
  AdminConnectItemUpdateInput
> {
  constructor() {
    super('admin_connect_items');
  }

  // ── BaseRepository abstract implementations ─────────────────────

  async findById(id: number): Promise<AdminConnectItem | null> {
    return this.findItemById(id);
  }

  async create(input: AdminConnectItemCreateInput): Promise<AdminConnectItem> {
    return this.createItem(input);
  }

  async update(id: number, input: AdminConnectItemUpdateInput): Promise<AdminConnectItem> {
    const result = await this.updateItem(id, input);
    if (!result) {
      throw new Error(`AdminConnectItem with id ${id} not found`);
    }
    return result;
  }

  // ── Items ───────────────────────────────────────────────────────

  async findAllItems(): Promise<AdminConnectItem[]> {
    const result = await db.query<AdminConnectItemRow>(
      `SELECT * FROM admin_connect_items ORDER BY priority ASC, created_at DESC`,
    );
    return result.rows.map(normalizeItem);
  }

  async findItemById(id: number): Promise<AdminConnectItem | null> {
    const result = await db.query<AdminConnectItemRow>(
      `SELECT * FROM admin_connect_items WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? normalizeItem(result.rows[0]) : null;
  }

  async findItemWithSubs(id: number): Promise<AdminConnectItemWithSubs | null> {
    const item = await this.findItemById(id);
    if (!item) {
      return null;
    }
    const subs = await this.findSubItemsByItemId(id);
    return { ...item, subItems: subs };
  }

  async findAllWithSubs(): Promise<AdminConnectItemWithSubs[]> {
    const items = await this.findAllItems();
    const subResult = await db.query<AdminConnectSubItemRow>(
      `SELECT * FROM admin_connect_sub_items ORDER BY sort_order ASC, id ASC`,
    );
    const subsByItem = new Map<number, AdminConnectSubItem[]>();
    for (const row of subResult.rows) {
      const sub = normalizeSubItem(row);
      const list = subsByItem.get(sub.itemId) ?? [];
      list.push(sub);
      subsByItem.set(sub.itemId, list);
    }
    return items.map((item) => ({
      ...item,
      subItems: subsByItem.get(item.id) ?? [],
    }));
  }

  async createItem(input: AdminConnectItemCreateInput): Promise<AdminConnectItem> {
    const result = await db.query<AdminConnectItemRow>(
      `INSERT INTO admin_connect_items
        (name, description, secret_name, is_secret, category, status, urgency, difficulty, progress, priority, data_fields, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        input.name,
        input.description ?? null,
        input.secretName ?? null,
        input.isSecret ?? false,
        input.category ?? 'misc',
        input.status ?? 'open',
        input.urgency ?? 'normal',
        input.difficulty ?? 'normal',
        input.progress ?? 0,
        input.priority ?? 0,
        JSON.stringify(input.dataFields ?? []),
        input.createdBy ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create item');
    }
    return normalizeItem(row);
  }

  async updateItem(id: number, input: AdminConnectItemUpdateInput): Promise<AdminConnectItem | null> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(input.name); }
    if (input.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(input.description); }
    if (input.secretName !== undefined) { sets.push(`secret_name = $${idx++}`); vals.push(input.secretName); }
    if (input.isSecret !== undefined) { sets.push(`is_secret = $${idx++}`); vals.push(input.isSecret); }
    if (input.category !== undefined) { sets.push(`category = $${idx++}`); vals.push(input.category); }
    if (input.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(input.status); }
    if (input.urgency !== undefined) { sets.push(`urgency = $${idx++}`); vals.push(input.urgency); }
    if (input.difficulty !== undefined) { sets.push(`difficulty = $${idx++}`); vals.push(input.difficulty); }
    if (input.progress !== undefined) { sets.push(`progress = $${idx++}`); vals.push(input.progress); }
    if (input.priority !== undefined) { sets.push(`priority = $${idx++}`); vals.push(input.priority); }
    if (input.dataFields !== undefined) { sets.push(`data_fields = $${idx++}`); vals.push(JSON.stringify(input.dataFields)); }
    if (input.resolvedAt !== undefined) { sets.push(`resolved_at = $${idx++}`); vals.push(input.resolvedAt); }

    if (sets.length === 0) {
      return this.findItemById(id);
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await db.query<AdminConnectItemRow>(
      `UPDATE admin_connect_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals,
    );
    return result.rows[0] ? normalizeItem(result.rows[0]) : null;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.query(`DELETE FROM admin_connect_items WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async updatePriorities(orderedIds: number[]): Promise<void> {
    const cases = orderedIds.map((id, i) => `WHEN ${id} THEN ${i}`).join(' ');
    const idList = orderedIds.join(',');
    await db.query(
      `UPDATE admin_connect_items SET priority = CASE id ${cases} END, updated_at = NOW() WHERE id IN (${idList})`,
    );
  }

  // ── Sub-items ───────────────────────────────────────────────────

  async findSubItemsByItemId(itemId: number): Promise<AdminConnectSubItem[]> {
    const result = await db.query<AdminConnectSubItemRow>(
      `SELECT * FROM admin_connect_sub_items WHERE item_id = $1 ORDER BY sort_order ASC, id ASC`,
      [itemId],
    );
    return result.rows.map(normalizeSubItem);
  }

  async createSubItem(input: AdminConnectSubItemCreateInput): Promise<AdminConnectSubItem> {
    const result = await db.query<AdminConnectSubItemRow>(
      `INSERT INTO admin_connect_sub_items (item_id, name, description, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.itemId, input.name, input.description ?? null, input.sortOrder ?? 0],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create sub-item');
    }
    return normalizeSubItem(row);
  }

  async updateSubItem(id: number, input: AdminConnectSubItemUpdateInput): Promise<AdminConnectSubItem | null> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(input.name); }
    if (input.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(input.description); }
    if (input.isCompleted !== undefined) { sets.push(`is_completed = $${idx++}`); vals.push(input.isCompleted); }
    if (input.sortOrder !== undefined) { sets.push(`sort_order = $${idx++}`); vals.push(input.sortOrder); }

    if (sets.length === 0) {
      return null;
    }

    vals.push(id);
    const result = await db.query<AdminConnectSubItemRow>(
      `UPDATE admin_connect_sub_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      vals,
    );
    return result.rows[0] ? normalizeSubItem(result.rows[0]) : null;
  }

  async deleteSubItem(id: number): Promise<boolean> {
    const result = await db.query(`DELETE FROM admin_connect_sub_items WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
