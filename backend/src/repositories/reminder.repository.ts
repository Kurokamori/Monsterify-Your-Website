import { BaseRepository } from './base.repository';
import { db } from '../database';

export type ReminderItemType = 'task' | 'habit' | 'routine_item';

export type ReminderRow = {
  id: number;
  user_id: number;
  discord_id: string | null;
  item_type: ReminderItemType;
  item_id: number | null;
  title: string;
  reminder_time: string;
  reminder_days: string | object | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Reminder = {
  id: number;
  userId: number;
  discordId: string | null;
  itemType: ReminderItemType;
  itemId: number | null;
  title: string;
  reminderTime: string;
  reminderDays: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ReminderWithUserDetails = Reminder & {
  userDiscordId: string | null;
};

export type ReminderCreateInput = {
  userId: number;
  discordId?: string | null;
  itemType: ReminderItemType;
  itemId?: number | null;
  title: string;
  reminderTime: string;
  reminderDays?: string[];
  isActive?: boolean;
};

export type ReminderUpdateInput = Partial<ReminderCreateInput>;

export type ReminderStatistics = {
  total: number;
  active: number;
  byType: Record<ReminderItemType, { total: number; active: number }>;
};

const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (!value) {return defaultValue;}
  if (Array.isArray(value)) {return value as T;}
  if (typeof value === 'object') {return defaultValue;}
  try {
    if (value === '[object Object]' || value.includes('[object Object]')) {
      return defaultValue;
    }
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const normalizeReminder = (row: ReminderRow): Reminder => ({
  id: row.id,
  userId: row.user_id,
  discordId: row.discord_id,
  itemType: row.item_type,
  itemId: row.item_id,
  title: row.title,
  reminderTime: row.reminder_time,
  reminderDays: parseJsonField(row.reminder_days, []),
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type ReminderWithUserDetailsRow = ReminderRow & {
  user_discord_id: string | null;
};

const normalizeReminderWithUserDetails = (row: ReminderWithUserDetailsRow): ReminderWithUserDetails => ({
  ...normalizeReminder(row),
  userDiscordId: row.user_discord_id,
});

export class ReminderRepository extends BaseRepository<Reminder, ReminderCreateInput, ReminderUpdateInput> {
  constructor() {
    super('reminders');
  }

  override async findById(id: number): Promise<Reminder | null> {
    const result = await db.query<ReminderRow>('SELECT * FROM reminders WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? normalizeReminder(row) : null;
  }

  async findByUserId(userId: number, options: { itemType?: ReminderItemType; isActive?: boolean } = {}): Promise<Reminder[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];

    if (options.itemType) {
      params.push(options.itemType);
      conditions.push(`item_type = $${params.length}`);
    }

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      conditions.push(`is_active = $${params.length}`);
    }

    const result = await db.query<ReminderRow>(
      `SELECT * FROM reminders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return result.rows.map(normalizeReminder);
  }

  async findByItemTypeAndId(itemType: ReminderItemType, itemId: number): Promise<Reminder[]> {
    const result = await db.query<ReminderRow>(
      'SELECT * FROM reminders WHERE item_type = $1 AND item_id = $2',
      [itemType, itemId]
    );
    return result.rows.map(normalizeReminder);
  }

  async findByUserAndItem(userId: number, itemType: ReminderItemType, itemId: number): Promise<Reminder | null> {
    const result = await db.query<ReminderRow>(
      'SELECT * FROM reminders WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
      [userId, itemType, itemId]
    );
    const row = result.rows[0];
    return row ? normalizeReminder(row) : null;
  }

  override async create(input: ReminderCreateInput): Promise<Reminder> {
    const reminderDaysJson = JSON.stringify(input.reminderDays ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO reminders (user_id, discord_id, item_type, item_id, title, reminder_time, reminder_days, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.userId,
        input.discordId ?? null,
        input.itemType,
        input.itemId ?? null,
        input.title,
        input.reminderTime,
        reminderDaysJson,
        input.isActive ?? true,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert reminder');
    }
    const reminder = await this.findById(insertedRow.id);
    if (!reminder) {
      throw new Error('Failed to create reminder');
    }
    return reminder;
  }

  override async update(id: number, input: ReminderUpdateInput): Promise<Reminder> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.discordId !== undefined) {
      values.push(input.discordId);
      updates.push(`discord_id = $${values.length}`);
    }
    if (input.itemType !== undefined) {
      values.push(input.itemType);
      updates.push(`item_type = $${values.length}`);
    }
    if (input.itemId !== undefined) {
      values.push(input.itemId);
      updates.push(`item_id = $${values.length}`);
    }
    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.reminderTime !== undefined) {
      values.push(input.reminderTime);
      updates.push(`reminder_time = $${values.length}`);
    }
    if (input.reminderDays !== undefined) {
      values.push(JSON.stringify(input.reminderDays));
      updates.push(`reminder_days = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Reminder not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(`UPDATE reminders SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Reminder not found after update');
    }
    return updated;
  }

  async createOrUpdate(input: ReminderCreateInput): Promise<Reminder> {
    if (input.itemId) {
      const existing = await this.findByUserAndItem(input.userId, input.itemType, input.itemId);
      if (existing) {
        return this.update(existing.id, input);
      }
    }
    return this.create(input);
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM reminders WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByItem(itemType: ReminderItemType, itemId: number): Promise<number> {
    const result = await db.query('DELETE FROM reminders WHERE item_type = $1 AND item_id = $2', [itemType, itemId]);
    return result.rowCount ?? 0;
  }

  async getActiveReminders(): Promise<ReminderWithUserDetails[]> {
    const result = await db.query<ReminderWithUserDetailsRow>(
      `
        SELECT r.*, u.discord_id as user_discord_id
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE CAST(r.is_active AS BOOLEAN) = true AND u.discord_id IS NOT NULL
        ORDER BY r.reminder_time ASC
      `
    );
    return result.rows.map(normalizeReminderWithUserDetails);
  }

  async getDueReminders(): Promise<ReminderWithUserDetails[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[now.getDay()];

    const result = await db.query<ReminderWithUserDetailsRow>(
      `
        SELECT r.*, u.discord_id as user_discord_id
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE CAST(r.is_active AS BOOLEAN) = true
        AND u.discord_id IS NOT NULL
        AND r.reminder_time = $1
        AND (
          r.reminder_days = '[]' OR
          r.reminder_days LIKE $2
        )
      `,
      [currentTime, `%"${todayName}"%`]
    );
    return result.rows.map(normalizeReminderWithUserDetails);
  }

  async getStatistics(userId: number): Promise<ReminderStatistics> {
    const result = await db.query<{
      item_type: ReminderItemType;
      count: string;
      active_count: string;
    }>(
      `
        SELECT
          item_type,
          COUNT(*) as count,
          SUM(CASE WHEN is_active::boolean = true THEN 1 ELSE 0 END) as active_count
        FROM reminders
        WHERE user_id = $1
        GROUP BY item_type
      `,
      [userId]
    );

    const stats: ReminderStatistics = {
      total: 0,
      active: 0,
      byType: {} as Record<ReminderItemType, { total: number; active: number }>,
    };

    for (const row of result.rows) {
      const total = parseInt(row.count, 10);
      const active = parseInt(row.active_count, 10);
      stats.total += total;
      stats.active += active;
      stats.byType[row.item_type] = { total, active };
    }

    return stats;
  }
}
