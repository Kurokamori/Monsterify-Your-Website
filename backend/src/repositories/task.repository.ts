import { BaseRepository } from './base.repository';
import { db } from '../database';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TaskStep = {
  text: string;
  completed: boolean;
};

export type TaskRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  due_date: Date | null;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  category: string | null;
  tags: string | object | null;
  steps: string | object | null;
  current_step: number;
  status: TaskStatus;
  repeat_type: RepeatType | null;
  repeat_interval: number | null;
  repeat_days: string | object | null;
  reward_levels: number;
  reward_coins: number;
  reward_trainer_id: number | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_days: string | object | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type Task = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  category: string | null;
  tags: string[];
  steps: TaskStep[];
  currentStep: number;
  status: TaskStatus;
  repeatType: RepeatType | null;
  repeatInterval: number | null;
  repeatDays: string[];
  rewardLevels: number;
  rewardCoins: number;
  rewardTrainerId: number | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  reminderDays: string[];
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskWithDetails = Task & {
  trainerName: string | null;
};

export type TaskCreateInput = {
  userId: number;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty;
  category?: string | null;
  tags?: string[];
  steps?: TaskStep[];
  repeatType?: RepeatType | null;
  repeatInterval?: number | null;
  repeatDays?: string[];
  rewardLevels?: number;
  rewardCoins?: number;
  rewardTrainerId?: number | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
  reminderDays?: string[];
};

export type TaskUpdateInput = Partial<TaskCreateInput> & {
  currentStep?: number;
  status?: TaskStatus;
  completedAt?: Date | null;
};

export type TaskQueryOptions = {
  status?: TaskStatus;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty;
  category?: string;
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

const normalizeTask = (row: TaskRow): Task => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  dueDate: row.due_date,
  priority: row.priority,
  difficulty: row.difficulty,
  category: row.category,
  tags: parseJsonField(row.tags, []),
  steps: parseJsonField(row.steps, []),
  currentStep: row.current_step,
  status: row.status,
  repeatType: row.repeat_type,
  repeatInterval: row.repeat_interval,
  repeatDays: parseJsonField(row.repeat_days, []),
  rewardLevels: row.reward_levels,
  rewardCoins: row.reward_coins,
  rewardTrainerId: row.reward_trainer_id,
  reminderEnabled: row.reminder_enabled,
  reminderTime: row.reminder_time,
  reminderDays: parseJsonField(row.reminder_days, []),
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type TaskWithDetailsRow = TaskRow & {
  trainer_name: string | null;
};

const normalizeTaskWithDetails = (row: TaskWithDetailsRow): TaskWithDetails => ({
  ...normalizeTask(row),
  trainerName: row.trainer_name,
});

export class TaskRepository extends BaseRepository<Task, TaskCreateInput, TaskUpdateInput> {
  constructor() {
    super('tasks');
  }

  override async findById(id: number): Promise<TaskWithDetails | null> {
    const result = await db.query<TaskWithDetailsRow>(
      `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE t.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeTaskWithDetails(row) : null;
  }

  async findByUserId(userId: number, options: TaskQueryOptions = {}): Promise<TaskWithDetails[]> {
    const conditions: string[] = ['t.user_id = $1'];
    const params: unknown[] = [userId];

    if (options.status) {
      params.push(options.status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (options.priority) {
      params.push(options.priority);
      conditions.push(`t.priority = $${params.length}`);
    }
    if (options.difficulty) {
      params.push(options.difficulty);
      conditions.push(`t.difficulty = $${params.length}`);
    }
    if (options.category) {
      params.push(options.category);
      conditions.push(`t.category = $${params.length}`);
    }

    const result = await db.query<TaskWithDetailsRow>(
      `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY t.created_at DESC
      `,
      params
    );
    return result.rows.map(normalizeTaskWithDetails);
  }

  override async create(input: TaskCreateInput): Promise<Task> {
    const tagsJson = JSON.stringify(input.tags ?? []);
    const stepsJson = JSON.stringify(input.steps ?? []);
    const repeatDaysJson = JSON.stringify(input.repeatDays ?? []);
    const reminderDaysJson = JSON.stringify(input.reminderDays ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO tasks (
          user_id, title, description, due_date, priority, difficulty,
          category, tags, steps, repeat_type, repeat_interval, repeat_days,
          reward_levels, reward_coins, reward_trainer_id, reminder_enabled,
          reminder_time, reminder_days
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `,
      [
        input.userId,
        input.title,
        input.description ?? null,
        input.dueDate ?? null,
        input.priority ?? 'medium',
        input.difficulty ?? 'easy',
        input.category ?? null,
        tagsJson,
        stepsJson,
        input.repeatType ?? null,
        input.repeatInterval ?? null,
        repeatDaysJson,
        input.rewardLevels ?? 0,
        input.rewardCoins ?? 0,
        input.rewardTrainerId ?? null,
        input.reminderEnabled ?? false,
        input.reminderTime ?? null,
        reminderDaysJson,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create task');
    }
    const task = await this.findById(row.id);
    if (!task) {
      throw new Error('Failed to create task');
    }
    return task;
  }

  override async update(id: number, input: TaskUpdateInput): Promise<Task> {
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
    if (input.dueDate !== undefined) {
      values.push(input.dueDate);
      updates.push(`due_date = $${values.length}`);
    }
    if (input.priority !== undefined) {
      values.push(input.priority);
      updates.push(`priority = $${values.length}`);
    }
    if (input.difficulty !== undefined) {
      values.push(input.difficulty);
      updates.push(`difficulty = $${values.length}`);
    }
    if (input.category !== undefined) {
      values.push(input.category);
      updates.push(`category = $${values.length}`);
    }
    if (input.tags !== undefined) {
      values.push(JSON.stringify(input.tags));
      updates.push(`tags = $${values.length}`);
    }
    if (input.steps !== undefined) {
      values.push(JSON.stringify(input.steps));
      updates.push(`steps = $${values.length}`);
    }
    if (input.currentStep !== undefined) {
      values.push(input.currentStep);
      updates.push(`current_step = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.repeatType !== undefined) {
      values.push(input.repeatType);
      updates.push(`repeat_type = $${values.length}`);
    }
    if (input.repeatInterval !== undefined) {
      values.push(input.repeatInterval);
      updates.push(`repeat_interval = $${values.length}`);
    }
    if (input.repeatDays !== undefined) {
      values.push(JSON.stringify(input.repeatDays));
      updates.push(`repeat_days = $${values.length}`);
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
    if (input.completedAt !== undefined) {
      values.push(input.completedAt);
      updates.push(`completed_at = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Task not found');
      }
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Task not found after update');
    }
    return updated;
  }

  async complete(id: number): Promise<Task> {
    const task = await this.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'completed') {
      throw new Error('Task already completed');
    }

    return this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    });
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getDueToday(): Promise<TaskWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query<TaskWithDetailsRow>(
      `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE DATE(t.due_date) = $1 AND t.status = 'pending'
      `,
      [today]
    );
    return result.rows.map(normalizeTaskWithDetails);
  }

  async getOverdue(userId: number): Promise<TaskWithDetails[]> {
    const now = new Date().toISOString();
    const result = await db.query<TaskWithDetailsRow>(
      `
        SELECT t.*, tr.name as trainer_name
        FROM tasks t
        LEFT JOIN trainers tr ON t.reward_trainer_id = tr.id
        WHERE t.user_id = $1 AND t.due_date < $2 AND t.status = 'pending'
        ORDER BY t.due_date ASC
      `,
      [userId, now]
    );
    return result.rows.map(normalizeTaskWithDetails);
  }

  async getCategories(userId: number): Promise<string[]> {
    const result = await db.query<{ category: string }>(
      'SELECT DISTINCT category FROM tasks WHERE user_id = $1 AND category IS NOT NULL ORDER BY category',
      [userId]
    );
    return result.rows.map(row => row.category);
  }
}
