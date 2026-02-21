import { BaseRepository } from './base.repository';
import { db } from '../database';

export type PromptType = 'general' | 'monthly' | 'event' | 'progress';
export type PromptDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type PromptRow = {
  id: number;
  title: string;
  description: string | null;
  type: PromptType;
  category: string;
  difficulty: PromptDifficulty;
  is_active: boolean;
  priority: number;
  max_submissions: number | null;
  max_submissions_per_trainer: number | null;
  requires_approval: boolean;
  active_months: string | null;
  start_date: Date | null;
  end_date: Date | null;
  rewards: string | null;
  requirements: string | null;
  tags: string | null;
  min_trainer_level: number | null;
  max_trainer_level: number | null;
  required_factions: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PromptWithStats = PromptRow & {
  submission_count: number;
  approved_count: number;
  pending_count: number;
  is_currently_available: boolean;
};

export type Prompt = {
  id: number;
  title: string;
  description: string | null;
  type: PromptType;
  category: string;
  difficulty: PromptDifficulty;
  isActive: boolean;
  priority: number;
  maxSubmissions: number | null;
  maxSubmissionsPerTrainer: number | null;
  requiresApproval: boolean;
  activeMonths: string | null;
  startDate: Date | null;
  endDate: Date | null;
  rewards: object | null;
  requirements: object | null;
  tags: string[] | null;
  minTrainerLevel: number | null;
  maxTrainerLevel: number | null;
  requiredFactions: string[] | null;
  submissionCount: number;
  approvedCount: number;
  pendingCount: number;
  isCurrentlyAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PromptCreateInput = {
  title: string;
  description?: string | null;
  type?: PromptType;
  category?: string;
  difficulty?: PromptDifficulty;
  isActive?: boolean;
  priority?: number;
  maxSubmissions?: number | null;
  maxSubmissionsPerTrainer?: number | null;
  requiresApproval?: boolean;
  activeMonths?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  rewards?: object | null;
  requirements?: object | null;
  tags?: string[] | null;
  minTrainerLevel?: number | null;
  maxTrainerLevel?: number | null;
  requiredFactions?: string[] | null;
};

export type PromptUpdateInput = Partial<PromptCreateInput>;

export type PromptQueryOptions = {
  type?: PromptType;
  category?: string;
  difficulty?: PromptDifficulty;
  activeOnly?: boolean;
  availableOnly?: boolean;
  trainerId?: number;
  page?: number;
  limit?: number;
};

const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (value === null || value === undefined) {return defaultValue;}
  if (typeof value === 'object') {return value as T;}
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

const normalizePrompt = (row: PromptWithStats): Prompt => ({
  id: row.id,
  title: row.title,
  description: row.description,
  type: row.type,
  category: row.category,
  difficulty: row.difficulty,
  isActive: row.is_active,
  priority: row.priority,
  maxSubmissions: row.max_submissions,
  maxSubmissionsPerTrainer: row.max_submissions_per_trainer,
  requiresApproval: row.requires_approval,
  activeMonths: row.active_months,
  startDate: row.start_date,
  endDate: row.end_date,
  rewards: parseJsonField<object | null>(row.rewards, null),
  requirements: parseJsonField<object | null>(row.requirements, null),
  tags: parseJsonField<string[] | null>(row.tags, null),
  minTrainerLevel: row.min_trainer_level,
  maxTrainerLevel: row.max_trainer_level,
  requiredFactions: parseJsonField<string[] | null>(row.required_factions, null),
  submissionCount: Number(row.submission_count) || 0,
  approvedCount: Number(row.approved_count) || 0,
  pendingCount: Number(row.pending_count) || 0,
  isCurrentlyAvailable: row.is_currently_available,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const BASE_SELECT = `
  SELECT p.*,
         COALESCE(COUNT(ps.id), 0) as submission_count,
         COALESCE(COUNT(CASE WHEN ps.status = 'approved' THEN 1 END), 0) as approved_count,
         COALESCE(COUNT(CASE WHEN ps.status = 'pending' THEN 1 END), 0) as pending_count,
         CASE
           WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
           THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
           WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
           THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
           ELSE p.is_active::boolean
         END as is_currently_available
  FROM prompts p
  LEFT JOIN prompt_submissions ps ON p.id = ps.prompt_id
`;

export class PromptRepository extends BaseRepository<Prompt, PromptCreateInput, PromptUpdateInput> {
  constructor() {
    super('prompts');
  }

  async findAll(options: PromptQueryOptions = {}): Promise<Prompt[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.type) {
      params.push(options.type);
      conditions.push(`p.type = $${params.length}`);
    }

    if (options.category) {
      params.push(options.category);
      conditions.push(`p.category = $${params.length}`);
    }

    if (options.difficulty) {
      params.push(options.difficulty);
      conditions.push(`p.difficulty = $${params.length}`);
    }

    if (options.activeOnly !== undefined) {
      params.push(options.activeOnly);
      conditions.push(`p.is_active = $${params.length}`);
    }

    if (options.availableOnly) {
      conditions.push(`
        CASE
          WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
          THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
          WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
          THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
          ELSE p.is_active::boolean
        END = true
      `);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let query = `
      ${BASE_SELECT}
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.priority DESC, p.created_at DESC
    `;

    if (options.limit) {
      params.push(options.limit);
      query += ` LIMIT $${params.length}`;

      if (options.page && options.page > 1) {
        params.push((options.page - 1) * options.limit);
        query += ` OFFSET $${params.length}`;
      }
    }

    const result = await db.query<PromptWithStats>(query, params);
    return result.rows.map(normalizePrompt);
  }

  override async findById(id: number): Promise<Prompt | null> {
    const result = await db.query<PromptWithStats>(
      `${BASE_SELECT} WHERE p.id = $1 GROUP BY p.id`,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizePrompt(row) : null;
  }

  async findMonthlyPrompts(month: number): Promise<Prompt[]> {
    const result = await db.query<PromptWithStats>(
      `
        ${BASE_SELECT}
        WHERE p.type = 'monthly'
          AND p.is_active::boolean = true
          AND (p.active_months IS NULL OR p.active_months LIKE '%' || $1 || '%')
        GROUP BY p.id
        ORDER BY p.priority DESC, p.created_at DESC
      `,
      [month.toString()]
    );
    return result.rows.map(normalizePrompt);
  }

  async findEventPrompts(): Promise<Prompt[]> {
    const result = await db.query<PromptWithStats>(
      `
        ${BASE_SELECT}
        WHERE p.type = 'event'
          AND p.is_active::boolean = true
          AND CURRENT_DATE BETWEEN p.start_date AND p.end_date
        GROUP BY p.id
        ORDER BY p.priority DESC, p.start_date ASC
      `
    );
    return result.rows.map(normalizePrompt);
  }

  async getCategories(): Promise<{ category: string; promptCount: number }[]> {
    const result = await db.query<{ category: string; prompt_count: string }>(
      `
        SELECT DISTINCT category, COUNT(*) as prompt_count
        FROM prompts
        WHERE is_active::boolean = true
        GROUP BY category
        ORDER BY category
      `
    );
    return result.rows.map((row) => ({
      category: row.category,
      promptCount: parseInt(row.prompt_count, 10),
    }));
  }

  override async create(input: PromptCreateInput): Promise<Prompt> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO prompts (
          title, description, type, category, difficulty, is_active,
          priority, max_submissions, max_submissions_per_trainer, requires_approval,
          active_months, start_date, end_date, rewards, requirements, tags,
          min_trainer_level, max_trainer_level, required_factions, created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP
        )
        RETURNING id
      `,
      [
        input.title,
        input.description ?? null,
        input.type ?? 'general',
        input.category ?? 'general',
        input.difficulty ?? 'medium',
        input.isActive ?? true,
        input.priority ?? 0,
        input.maxSubmissions ?? null,
        input.maxSubmissionsPerTrainer ?? null,
        input.requiresApproval ?? true,
        input.activeMonths ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.rewards ? JSON.stringify(input.rewards) : null,
        input.requirements ? JSON.stringify(input.requirements) : null,
        input.tags ? JSON.stringify(input.tags) : null,
        input.minTrainerLevel ?? null,
        input.maxTrainerLevel ?? null,
        input.requiredFactions ? JSON.stringify(input.requiredFactions) : null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert prompt');
    }
    const prompt = await this.findById(insertedRow.id);
    if (!prompt) {
      throw new Error('Failed to create prompt');
    }
    return prompt;
  }

  override async update(id: number, input: PromptUpdateInput): Promise<Prompt> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, { column: string; isJson?: boolean }> = {
      title: { column: 'title' },
      description: { column: 'description' },
      type: { column: 'type' },
      category: { column: 'category' },
      difficulty: { column: 'difficulty' },
      isActive: { column: 'is_active' },
      priority: { column: 'priority' },
      maxSubmissions: { column: 'max_submissions' },
      maxSubmissionsPerTrainer: { column: 'max_submissions_per_trainer' },
      requiresApproval: { column: 'requires_approval' },
      activeMonths: { column: 'active_months' },
      startDate: { column: 'start_date' },
      endDate: { column: 'end_date' },
      rewards: { column: 'rewards', isJson: true },
      requirements: { column: 'requirements', isJson: true },
      tags: { column: 'tags', isJson: true },
      minTrainerLevel: { column: 'min_trainer_level' },
      maxTrainerLevel: { column: 'max_trainer_level' },
      requiredFactions: { column: 'required_factions', isJson: true },
    };

    for (const [key, { column, isJson }] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(isJson && value !== null ? JSON.stringify(value) : value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Prompt not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE prompts SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Prompt not found after update');
    }
    return updated;
  }

  async getSubmissionCount(promptId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM prompt_submissions WHERE prompt_id = $1',
      [promptId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async findAvailableByCategory(category: string, trainerId: number): Promise<Record<string, unknown>[]> {
    const result = await db.query(
      `SELECT
        p.id, p.title, p.description, p.prompt_text, p.category,
        p.difficulty, p.rewards, p.type, p.is_active,
        CASE
          WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
          THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
          WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
          THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
          ELSE p.is_active::boolean
        END as is_currently_available
      FROM prompts p
      WHERE
        p.type = $1 AND
        p.is_active::boolean = true AND
        CASE
          WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
          THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
          WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
          THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
          ELSE p.is_active::boolean
        END = true AND
        (
          p.max_submissions_per_trainer IS NULL OR
          (SELECT COUNT(*) FROM prompt_submissions ps WHERE ps.prompt_id = p.id AND ps.trainer_id = $2) < p.max_submissions_per_trainer
        )
      ORDER BY p.difficulty ASC, p.title ASC`,
      [category, trainerId]
    );
    return result.rows as Record<string, unknown>[];
  }

  async search(searchTerm: string, options: PromptQueryOptions = {}): Promise<Prompt[]> {
    const conditions: string[] = [`(p.title ILIKE $1 OR p.description ILIKE $1)`];
    const params: unknown[] = [`%${searchTerm}%`];

    if (options.type) {
      params.push(options.type);
      conditions.push(`p.type = $${params.length}`);
    }

    if (options.category) {
      params.push(options.category);
      conditions.push(`p.category = $${params.length}`);
    }

    if (options.activeOnly) {
      conditions.push('p.is_active::boolean = true');
    }

    const result = await db.query<PromptWithStats>(
      `
        ${BASE_SELECT}
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.id
        ORDER BY p.priority DESC, p.created_at DESC
      `,
      params
    );

    return result.rows.map(normalizePrompt);
  }
}
