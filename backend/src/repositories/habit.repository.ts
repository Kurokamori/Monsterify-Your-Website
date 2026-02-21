import { BaseRepository } from './base.repository';
import { db } from '../database';

export type HabitFrequency = 'daily' | 'weekly';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type StreakStatus = 'not_started' | 'active' | 'at_risk' | 'broken';

export type HabitRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  streak: number;
  best_streak: number;
  last_completed_at: Date | null;
  next_reset_at: Date | null;
  status: HabitStatus;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_days: string | object | null;
  created_at: Date;
  updated_at: Date;
};

export type Habit = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  frequency: HabitFrequency;
  streak: number;
  bestStreak: number;
  lastCompletedAt: Date | null;
  nextResetAt: Date | null;
  status: HabitStatus;
  rewardLevels: number;
  rewardCoins: number;
  rewardTrainerId: number | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  reminderDays: string[];
  createdAt: Date;
  updatedAt: Date;
  streakStatus: StreakStatus;
};

export type HabitWithDetails = Habit & {
  trainerName: string | null;
};

export type HabitCreateInput = {
  userId: number;
  title: string;
  description?: string | null;
  frequency?: HabitFrequency;
  rewardLevels?: number;
  rewardCoins?: number;
  rewardTrainerId?: number | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
  reminderDays?: string[];
};

export type HabitUpdateInput = Partial<HabitCreateInput> & {
  streak?: number;
  bestStreak?: number;
  lastCompletedAt?: Date | null;
  nextResetAt?: Date | null;
  status?: HabitStatus;
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

const calculateStreakStatus = (habit: HabitRow): StreakStatus => {
  if (!habit.last_completed_at) {return 'not_started';}

  const now = new Date();
  const lastCompleted = new Date(habit.last_completed_at);
  const hoursDiff = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);

  if (habit.frequency === 'daily') {
    if (hoursDiff > 48) {return 'broken';}
    if (hoursDiff > 24) {return 'at_risk';}
    return 'active';
  } else if (habit.frequency === 'weekly') {
    if (hoursDiff > 168) {return 'broken';} // 7 days
    if (hoursDiff > 144) {return 'at_risk';} // 6 days
    return 'active';
  }

  return 'active';
};

const calculateNextReset = (frequency: HabitFrequency, from: Date = new Date()): Date => {
  const resetTime = new Date(from);

  if (frequency === 'daily') {
    resetTime.setDate(resetTime.getDate() + 2); // 48 hours
  } else if (frequency === 'weekly') {
    resetTime.setDate(resetTime.getDate() + 7); // 7 days
  }

  return resetTime;
};

const normalizeHabit = (row: HabitRow): Habit => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  frequency: row.frequency,
  streak: row.streak,
  bestStreak: row.best_streak,
  lastCompletedAt: row.last_completed_at,
  nextResetAt: row.next_reset_at,
  status: row.status,
  rewardLevels: row.reward_levels,
  rewardCoins: row.reward_coins,
  rewardTrainerId: row.reward_trainer_id,
  reminderEnabled: row.reminder_enabled,
  reminderTime: row.reminder_time,
  reminderDays: parseJsonField(row.reminder_days, []),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  streakStatus: calculateStreakStatus(row),
});

type HabitWithDetailsRow = HabitRow & {
  trainer_name: string | null;
};

const normalizeHabitWithDetails = (row: HabitWithDetailsRow): HabitWithDetails => ({
  ...normalizeHabit(row),
  trainerName: row.trainer_name,
});

export class HabitRepository extends BaseRepository<Habit, HabitCreateInput, HabitUpdateInput> {
  constructor() {
    super('habits');
  }

  override async findById(id: number): Promise<HabitWithDetails | null> {
    const result = await db.query<HabitWithDetailsRow>(
      `
        SELECT h.*, tr.name as trainer_name
        FROM habits h
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE h.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeHabitWithDetails(row) : null;
  }

  async findByUserId(userId: number, options: { status?: HabitStatus; frequency?: HabitFrequency } = {}): Promise<HabitWithDetails[]> {
    const conditions: string[] = ['h.user_id = $1'];
    const params: unknown[] = [userId];

    if (options.status) {
      params.push(options.status);
      conditions.push(`h.status = $${params.length}`);
    }

    if (options.frequency) {
      params.push(options.frequency);
      conditions.push(`h.frequency = $${params.length}`);
    }

    const result = await db.query<HabitWithDetailsRow>(
      `
        SELECT h.*, tr.name as trainer_name
        FROM habits h
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY h.created_at DESC
      `,
      params
    );
    return result.rows.map(normalizeHabitWithDetails);
  }

  override async create(input: HabitCreateInput): Promise<Habit> {
    const frequency = input.frequency ?? 'daily';
    const nextResetAt = calculateNextReset(frequency);
    const reminderDaysJson = JSON.stringify(input.reminderDays ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO habits (
          user_id, title, description, frequency, reward_levels, reward_coins,
          reward_trainer_id, reminder_enabled, reminder_time, reminder_days, next_reset_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        input.userId,
        input.title,
        input.description ?? null,
        frequency,
        input.rewardLevels ?? 0,
        input.rewardCoins ?? 0,
        input.rewardTrainerId ?? null,
        input.reminderEnabled ?? false,
        input.reminderTime ?? null,
        reminderDaysJson,
        nextResetAt,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert habit');
    }
    const habit = await this.findById(insertedRow.id);
    if (!habit) {
      throw new Error('Failed to create habit');
    }
    return habit;
  }

  override async update(id: number, input: HabitUpdateInput): Promise<Habit> {
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
    if (input.frequency !== undefined) {
      values.push(input.frequency);
      updates.push(`frequency = $${values.length}`);
    }
    if (input.streak !== undefined) {
      values.push(input.streak);
      updates.push(`streak = $${values.length}`);
    }
    if (input.bestStreak !== undefined) {
      values.push(input.bestStreak);
      updates.push(`best_streak = $${values.length}`);
    }
    if (input.lastCompletedAt !== undefined) {
      values.push(input.lastCompletedAt);
      updates.push(`last_completed_at = $${values.length}`);
    }
    if (input.nextResetAt !== undefined) {
      values.push(input.nextResetAt);
      updates.push(`next_reset_at = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
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
    if (input.reminderTime !== undefined) {
      values.push(input.reminderTime);
      updates.push(`reminder_time = $${values.length}`);
    }
    if (input.reminderDays !== undefined) {
      values.push(JSON.stringify(input.reminderDays));
      updates.push(`reminder_days = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Habit not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(`UPDATE habits SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Habit not found after update');
    }
    return updated;
  }

  async track(id: number): Promise<{ habit: Habit; streakChange: number }> {
    const habit = await this.findById(id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    if (habit.status !== 'active') {
      throw new Error('Habit is not active');
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if already tracked today
    if (habit.lastCompletedAt) {
      const lastCompletedDate = new Date(habit.lastCompletedAt).toISOString().split('T')[0];
      if (lastCompletedDate === today) {
        throw new Error('Habit already tracked today');
      }
    }

    // Calculate new streak
    let newStreak = 1;
    let streakChange = 1;

    if (habit.lastCompletedAt) {
      const hoursDiff = (now.getTime() - new Date(habit.lastCompletedAt).getTime()) / (1000 * 60 * 60);
      const streakBroken =
        (habit.frequency === 'daily' && hoursDiff > 48) ||
        (habit.frequency === 'weekly' && hoursDiff > 168);

      if (streakBroken) {
        newStreak = 1;
        streakChange = 1 - habit.streak;
      } else {
        newStreak = habit.streak + 1;
        streakChange = 1;
      }
    }

    const updatedHabit = await this.update(id, {
      streak: newStreak,
      bestStreak: Math.max(habit.bestStreak, newStreak),
      lastCompletedAt: now,
      nextResetAt: calculateNextReset(habit.frequency, now),
    });

    return {
      habit: updatedHabit,
      streakChange,
    };
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM habits WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getHabitsToReset(): Promise<HabitWithDetails[]> {
    const now = new Date().toISOString();
    const result = await db.query<HabitWithDetailsRow>(
      `
        SELECT h.*, tr.name as trainer_name
        FROM habits h
        LEFT JOIN trainers tr ON h.reward_trainer_id = tr.id
        WHERE h.next_reset_at <= $1 AND h.status = 'active' AND h.streak > 0
      `,
      [now]
    );
    return result.rows.map(normalizeHabitWithDetails);
  }

  async resetStreaks(habitIds: number[]): Promise<void> {
    if (habitIds.length === 0) {return;}

    const placeholders = habitIds.map((_, i) => `$${i + 1}`).join(',');
    await db.query(
      `UPDATE habits SET streak = 0, next_reset_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      habitIds
    );
  }
}
