import { BaseRepository } from './base.repository';
import { db } from '../database';

export type MissionRow = {
  id: number;
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
  min_level: number;
  max_monsters: number;
  requirements: string | null;
  reward_config: string | null;
  required_progress: number;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type Mission = {
  id: number;
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
  minLevel: number;
  maxMonsters: number;
  requirements: Record<string, unknown> | null;
  rewardConfig: Record<string, unknown> | null;
  requiredProgress: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MissionCreateInput = {
  title: string;
  description?: string | null;
  difficulty?: string;
  duration?: number;
  minLevel?: number;
  maxMonsters?: number;
  requirements?: Record<string, unknown> | null;
  rewardConfig?: Record<string, unknown> | null;
  requiredProgress?: number;
  status?: string;
};

export type MissionUpdateInput = Partial<MissionCreateInput>;

export type MissionQueryOptions = {
  difficulty?: string;
  status?: string;
  sortBy?: 'title' | 'difficulty' | 'duration';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedMissions = {
  data: Mission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const parseJsonField = (value: string | null): Record<string, unknown> | null => {
  if (!value) {return null;}
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

const normalizeMission = (row: MissionRow): Mission => ({
  id: row.id,
  title: row.title,
  description: row.description,
  difficulty: row.difficulty,
  duration: row.duration,
  minLevel: row.min_level,
  maxMonsters: row.max_monsters,
  requirements: parseJsonField(row.requirements),
  rewardConfig: parseJsonField(row.reward_config),
  requiredProgress: row.required_progress,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class MissionRepository extends BaseRepository<
  Mission,
  MissionCreateInput,
  MissionUpdateInput
> {
  constructor() {
    super('missions');
  }

  async findAll(options: MissionQueryOptions = {}): Promise<PaginatedMissions> {
    const { page = 1, limit = 10, sortBy = 'difficulty', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.difficulty) {
      params.push(options.difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }

    if (options.status) {
      params.push(options.status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM missions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<MissionRow>(
      `
        SELECT * FROM missions
        ${whereClause}
        ORDER BY ${sortBy} ${orderDirection}, title ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows.map(normalizeMission),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<Mission | null> {
    const result = await db.query<MissionRow>(
      'SELECT * FROM missions WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeMission(row) : null;
  }

  async findActiveMissions(): Promise<Mission[]> {
    const result = await db.query<MissionRow>(
      `SELECT * FROM missions WHERE status = 'active' ORDER BY difficulty ASC, title ASC`
    );
    return result.rows.map(normalizeMission);
  }

  override async create(input: MissionCreateInput): Promise<Mission> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO missions (
          title, description, difficulty, duration, min_level, max_monsters,
          requirements, reward_config, required_progress, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.title,
        input.description ?? null,
        input.difficulty ?? 'easy',
        input.duration ?? 24,
        input.minLevel ?? 1,
        input.maxMonsters ?? 3,
        input.requirements ? JSON.stringify(input.requirements) : null,
        input.rewardConfig ? JSON.stringify(input.rewardConfig) : null,
        input.requiredProgress ?? 100,
        input.status ?? 'active',
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert mission');
    }
    const mission = await this.findById(insertedRow.id);
    if (!mission) {
      throw new Error('Failed to create mission');
    }
    return mission;
  }

  override async update(id: number, input: MissionUpdateInput): Promise<Mission> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      difficulty: 'difficulty',
      duration: 'duration',
      minLevel: 'min_level',
      maxMonsters: 'max_monsters',
      requiredProgress: 'required_progress',
      status: 'status',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    if (input.requirements !== undefined) {
      values.push(input.requirements ? JSON.stringify(input.requirements) : null);
      updates.push(`requirements = $${values.length}`);
    }

    if (input.rewardConfig !== undefined) {
      values.push(input.rewardConfig ? JSON.stringify(input.rewardConfig) : null);
      updates.push(`reward_config = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Mission not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE missions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Mission not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM missions WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getDifficulties(): Promise<string[]> {
    const result = await db.query<{ difficulty: string }>(
      'SELECT DISTINCT difficulty FROM missions WHERE difficulty IS NOT NULL ORDER BY difficulty'
    );
    return result.rows.map((r) => r.difficulty);
  }
}
