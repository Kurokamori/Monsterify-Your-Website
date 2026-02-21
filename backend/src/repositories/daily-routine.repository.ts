import { BaseRepository } from './base.repository';
import { db } from '../database';

export type PatternType = 'daily' | 'weekdays' | 'weekends' | 'custom';

export type DailyRoutineRow = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  pattern_type: PatternType;
  pattern_days: string | object | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type DailyRoutine = {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  patternType: PatternType;
  patternDays: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DailyRoutineWithItems = DailyRoutine & {
  items: RoutineItem[];
};

export type RoutineItemRow = {
  id: number;
  routine_id: number;
  title: string;
  description: string | null;
  scheduled_time: string | null;
  order_index: number;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | null;
  reminder_enabled: boolean;
  reminder_offset: number;
  created_at: Date;
  updated_at: Date;
};

export type RoutineItem = {
  id: number;
  routineId: number;
  title: string;
  description: string | null;
  scheduledTime: string | null;
  orderIndex: number;
  rewardLevels: number;
  rewardCoins: number;
  rewardTrainerId: number | null;
  reminderEnabled: boolean;
  reminderOffset: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RoutineItemWithDetails = RoutineItem & {
  trainerName: string | null;
  completedToday: boolean;
};

export type DailyRoutineCreateInput = {
  userId: number;
  name: string;
  description?: string | null;
  patternType?: PatternType;
  patternDays?: string[];
  isActive?: boolean;
};

export type DailyRoutineUpdateInput = Partial<DailyRoutineCreateInput>;

export type RoutineItemCreateInput = {
  routineId: number;
  title: string;
  description?: string | null;
  scheduledTime?: string | null;
  orderIndex?: number;
  rewardLevels?: number;
  rewardCoins?: number;
  rewardTrainerId?: number | null;
  reminderEnabled?: boolean;
  reminderOffset?: number;
};

export type RoutineItemUpdateInput = Partial<Omit<RoutineItemCreateInput, 'routineId'>>;

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

const normalizeDailyRoutine = (row: DailyRoutineRow): DailyRoutine => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  patternType: row.pattern_type,
  patternDays: parseJsonField(row.pattern_days, []),
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeRoutineItem = (row: RoutineItemRow): RoutineItem => ({
  id: row.id,
  routineId: row.routine_id,
  title: row.title,
  description: row.description,
  scheduledTime: row.scheduled_time,
  orderIndex: row.order_index,
  rewardLevels: row.reward_levels,
  rewardCoins: row.reward_coins,
  rewardTrainerId: row.reward_trainer_id,
  reminderEnabled: row.reminder_enabled,
  reminderOffset: row.reminder_offset,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type RoutineItemWithDetailsRow = RoutineItemRow & {
  trainer_name: string | null;
  completed_today: boolean;
};

const normalizeRoutineItemWithDetails = (row: RoutineItemWithDetailsRow): RoutineItemWithDetails => ({
  ...normalizeRoutineItem(row),
  trainerName: row.trainer_name,
  completedToday: row.completed_today,
});

export class DailyRoutineRepository extends BaseRepository<
  DailyRoutine,
  DailyRoutineCreateInput,
  DailyRoutineUpdateInput
> {
  constructor() {
    super('daily_routines');
  }

  override async findById(id: number): Promise<DailyRoutineWithItems | null> {
    const result = await db.query<DailyRoutineRow>('SELECT * FROM daily_routines WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) {return null;}

    const items = await this.getRoutineItems(id);
    return {
      ...normalizeDailyRoutine(row),
      items,
    };
  }

  async findByUserId(userId: number, options: { isActive?: boolean; patternType?: PatternType } = {}): Promise<DailyRoutineWithItems[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];

    if (options.isActive !== undefined) {
      params.push(options.isActive);
      conditions.push(`is_active = $${params.length}`);
    }

    if (options.patternType) {
      params.push(options.patternType);
      conditions.push(`pattern_type = $${params.length}`);
    }

    const result = await db.query<DailyRoutineRow>(
      `SELECT * FROM daily_routines WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );

    const routines: DailyRoutineWithItems[] = [];
    for (const row of result.rows) {
      const items = await this.getRoutineItems(row.id);
      routines.push({
        ...normalizeDailyRoutine(row),
        items,
      });
    }

    return routines;
  }

  async getRoutineItems(routineId: number): Promise<RoutineItem[]> {
    const result = await db.query<RoutineItemRow>(
      `
        SELECT ri.*
        FROM routine_items ri
        WHERE ri.routine_id = $1
        ORDER BY ri.order_index ASC
      `,
      [routineId]
    );
    return result.rows.map(normalizeRoutineItem);
  }

  async getRoutineItemsWithCompletionStatus(routineId: number, userId: number): Promise<RoutineItemWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query<RoutineItemWithDetailsRow>(
      `
        SELECT ri.*, tr.name as trainer_name,
               CASE WHEN rc.id IS NOT NULL THEN true ELSE false END as completed_today
        FROM routine_items ri
        LEFT JOIN trainers tr ON ri.reward_trainer_id = tr.id
        LEFT JOIN routine_completions rc ON ri.id = rc.routine_item_id
                                         AND rc.user_id = $1
                                         AND rc.completion_date = $2
        WHERE ri.routine_id = $3
        ORDER BY ri.order_index ASC
      `,
      [userId, today, routineId]
    );
    return result.rows.map(normalizeRoutineItemWithDetails);
  }

  override async create(input: DailyRoutineCreateInput): Promise<DailyRoutine> {
    const patternDaysJson = JSON.stringify(input.patternDays ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO daily_routines (user_id, name, description, pattern_type, pattern_days, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.userId,
        input.name,
        input.description ?? null,
        input.patternType ?? 'daily',
        patternDaysJson,
        input.isActive ?? true,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert daily routine');
    }
    const routine = await this.findById(insertedRow.id);
    if (!routine) {
      throw new Error('Failed to create daily routine');
    }
    return routine;
  }

  override async update(id: number, input: DailyRoutineUpdateInput): Promise<DailyRoutine> {
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
    if (input.patternType !== undefined) {
      values.push(input.patternType);
      updates.push(`pattern_type = $${values.length}`);
    }
    if (input.patternDays !== undefined) {
      values.push(JSON.stringify(input.patternDays));
      updates.push(`pattern_days = $${values.length}`);
    }
    if (input.isActive !== undefined) {
      values.push(input.isActive);
      updates.push(`is_active = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Daily routine not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE daily_routines SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Daily routine not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    // Delete routine items first
    await db.query('DELETE FROM routine_items WHERE routine_id = $1', [id]);
    // Delete completions
    await db.query('DELETE FROM routine_completions WHERE routine_item_id IN (SELECT id FROM routine_items WHERE routine_id = $1)', [id]);
    // Delete routine
    const result = await db.query('DELETE FROM daily_routines WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Routine Item methods
  async addItem(input: RoutineItemCreateInput): Promise<RoutineItem> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO routine_items (
          routine_id, title, description, scheduled_time, order_index,
          reward_levels, reward_coins, reward_trainer_id, reminder_enabled, reminder_offset
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.routineId,
        input.title,
        input.description ?? null,
        input.scheduledTime ?? null,
        input.orderIndex ?? 0,
        input.rewardLevels ?? 0,
        input.rewardCoins ?? 0,
        input.rewardTrainerId ?? null,
        input.reminderEnabled ?? false,
        input.reminderOffset ?? 0,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert routine item');
    }
    const itemResult = await db.query<RoutineItemRow>('SELECT * FROM routine_items WHERE id = $1', [insertedRow.id]);
    const itemRow = itemResult.rows[0];
    if (!itemRow) {
      throw new Error('Failed to retrieve routine item');
    }
    return normalizeRoutineItem(itemRow);
  }

  async updateItem(itemId: number, input: RoutineItemUpdateInput): Promise<RoutineItem> {
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
    if (input.scheduledTime !== undefined) {
      values.push(input.scheduledTime);
      updates.push(`scheduled_time = $${values.length}`);
    }
    if (input.orderIndex !== undefined) {
      values.push(input.orderIndex);
      updates.push(`order_index = $${values.length}`);
    }
    if (input.rewardLevels !== undefined) {
      values.push(input.rewardLevels);
      updates.push(`reward_levels = $${values.length}`);
    }
    if (input.rewardCoins !== undefined) {
      values.push(input.rewardCoins);
      updates.push(`reward_coins = $${values.length}`);
    }
    if (input.rewardTrainerId !== undefined) {
      values.push(input.rewardTrainerId);
      updates.push(`reward_trainer_id = $${values.length}`);
    }
    if (input.reminderEnabled !== undefined) {
      values.push(input.reminderEnabled);
      updates.push(`reminder_enabled = $${values.length}`);
    }
    if (input.reminderOffset !== undefined) {
      values.push(input.reminderOffset);
      updates.push(`reminder_offset = $${values.length}`);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(itemId);
      await db.query(`UPDATE routine_items SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    }

    const itemResult = await db.query<RoutineItemRow>('SELECT * FROM routine_items WHERE id = $1', [itemId]);
    const itemRow = itemResult.rows[0];
    if (!itemRow) {
      throw new Error('Routine item not found');
    }
    return normalizeRoutineItem(itemRow);
  }

  async deleteItem(itemId: number): Promise<boolean> {
    await db.query('DELETE FROM routine_completions WHERE routine_item_id = $1', [itemId]);
    const result = await db.query('DELETE FROM routine_items WHERE id = $1', [itemId]);
    return (result.rowCount ?? 0) > 0;
  }

  async completeItem(itemId: number, userId: number): Promise<{ success: boolean; item: RoutineItem }> {
    const today = new Date().toISOString().split('T')[0];

    // Check if already completed today
    const existingResult = await db.query<{ id: number }>(
      'SELECT id FROM routine_completions WHERE routine_item_id = $1 AND user_id = $2 AND completion_date = $3',
      [itemId, userId, today]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Routine item already completed today');
    }

    // Record completion
    await db.query(
      'INSERT INTO routine_completions (routine_item_id, user_id, completion_date) VALUES ($1, $2, $3)',
      [itemId, userId, today]
    );

    const itemResult = await db.query<RoutineItemRow>('SELECT * FROM routine_items WHERE id = $1', [itemId]);
    const itemRow = itemResult.rows[0];
    if (!itemRow) {
      throw new Error('Routine item not found after completion');
    }
    return {
      success: true,
      item: normalizeRoutineItem(itemRow),
    };
  }

  async getActiveRoutinesForToday(userId: number): Promise<DailyRoutineWithItems[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[dayOfWeek];

    const result = await db.query<DailyRoutineRow>(
      `
        SELECT * FROM daily_routines
        WHERE user_id = $1 AND is_active::boolean = true
        AND (
          pattern_type = 'daily' OR
          (pattern_type = 'weekdays' AND $2 BETWEEN 1 AND 5) OR
          (pattern_type = 'weekends' AND $2 IN (0, 6)) OR
          (pattern_type = 'custom' AND pattern_days LIKE $3)
        )
      `,
      [userId, dayOfWeek, `%"${todayName}"%`]
    );

    const routines: DailyRoutineWithItems[] = [];
    for (const row of result.rows) {
      const items = await this.getRoutineItemsWithCompletionStatus(row.id, userId);
      routines.push({
        ...normalizeDailyRoutine(row),
        items,
      });
    }

    return routines;
  }
}
