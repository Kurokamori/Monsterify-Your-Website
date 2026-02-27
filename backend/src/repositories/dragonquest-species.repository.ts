import { BaseRepository } from './base.repository';
import { db } from '../database';

export type DragonQuestSpeciesRow = {
  id: number;
  name: string;
  family: string | null;
  subfamily: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DragonQuestSpecies = {
  id: number;
  name: string;
  family: string | null;
  subfamily: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DragonQuestSpeciesCreateInput = {
  name: string;
  family?: string | null;
  subfamily?: string | null;
  imageUrl?: string | null;
};

export type DragonQuestSpeciesUpdateInput = Partial<DragonQuestSpeciesCreateInput>;

export type DragonQuestSpeciesQueryOptions = {
  search?: string;
  family?: string;
  subfamily?: string;
  sortBy?: 'name' | 'family' | 'subfamily';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedDragonQuestSpecies = {
  data: DragonQuestSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: DragonQuestSpeciesRow): DragonQuestSpecies => ({
  id: row.id,
  name: row.name,
  family: row.family,
  subfamily: row.subfamily,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class DragonQuestSpeciesRepository extends BaseRepository<
  DragonQuestSpecies,
  DragonQuestSpeciesCreateInput,
  DragonQuestSpeciesUpdateInput
> {
  constructor() {
    super('dragonquest_monsters');
  }

  async findAll(options: DragonQuestSpeciesQueryOptions = {}): Promise<PaginatedDragonQuestSpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.family) {
      params.push(options.family);
      conditions.push(`family = $${params.length}`);
    }

    if (options.subfamily) {
      params.push(options.subfamily);
      conditions.push(`subfamily = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM dragonquest_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<DragonQuestSpeciesRow>(
      `
        SELECT * FROM dragonquest_monsters
        ${whereClause}
        ORDER BY ${sortBy} ${orderDirection}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows.map(normalizeSpecies),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<DragonQuestSpecies | null> {
    const result = await db.query<DragonQuestSpeciesRow>(
      'SELECT * FROM dragonquest_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<DragonQuestSpecies | null> {
    const result = await db.query<DragonQuestSpeciesRow>(
      'SELECT * FROM dragonquest_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: DragonQuestSpeciesCreateInput): Promise<DragonQuestSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO dragonquest_monsters (name, family, subfamily, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [input.name, input.family ?? null, input.subfamily ?? null, input.imageUrl ?? null]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create Dragon Quest species');
    }
    const species = await this.findById(row.id);
    if (!species) {
      throw new Error('Failed to create Dragon Quest species');
    }
    return species;
  }

  override async update(id: number, input: DragonQuestSpeciesUpdateInput): Promise<DragonQuestSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      family: 'family',
      subfamily: 'subfamily',
      imageUrl: 'image_url',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Dragon Quest species not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE dragonquest_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Dragon Quest species not found after update');
    }
    return updated;
  }

  async getFamilies(): Promise<string[]> {
    const result = await db.query<{ family: string }>(
      'SELECT DISTINCT family FROM dragonquest_monsters WHERE family IS NOT NULL ORDER BY family'
    );
    return result.rows.map((r) => r.family);
  }

  async getSubfamilies(family?: string): Promise<string[]> {
    if (family) {
      const result = await db.query<{ subfamily: string }>(
        'SELECT DISTINCT subfamily FROM dragonquest_monsters WHERE subfamily IS NOT NULL AND family = $1 ORDER BY subfamily',
        [family]
      );
      return result.rows.map((r) => r.subfamily);
    }
    const result = await db.query<{ subfamily: string }>(
      'SELECT DISTINCT subfamily FROM dragonquest_monsters WHERE subfamily IS NOT NULL ORDER BY subfamily'
    );
    return result.rows.map((r) => r.subfamily);
  }
}
