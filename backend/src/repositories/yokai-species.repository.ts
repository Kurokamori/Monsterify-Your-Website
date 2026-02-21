import { BaseRepository } from './base.repository';
import { db } from '../database';

export type YokaiSpeciesRow = {
  id: number;
  name: string;
  tribe: string | null;
  rank: string | null;
  evolves_from: string | null;
  evolves_to: string | null;
  breeding_results: string | null;
  stage: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type YokaiSpecies = {
  id: number;
  name: string;
  tribe: string | null;
  rank: string | null;
  evolvesFrom: string | null;
  evolvesTo: string | null;
  breedingResults: string | null;
  stage: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type YokaiSpeciesCreateInput = {
  name: string;
  tribe?: string | null;
  rank?: string | null;
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  breedingResults?: string | null;
  stage?: string | null;
  imageUrl?: string | null;
};

export type YokaiSpeciesUpdateInput = Partial<YokaiSpeciesCreateInput>;

export type YokaiSpeciesQueryOptions = {
  search?: string;
  tribe?: string;
  rank?: string;
  stage?: string;
  sortBy?: 'name' | 'tribe' | 'rank';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedYokaiSpecies = {
  data: YokaiSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: YokaiSpeciesRow): YokaiSpecies => ({
  id: row.id,
  name: row.name,
  tribe: row.tribe,
  rank: row.rank,
  evolvesFrom: row.evolves_from,
  evolvesTo: row.evolves_to,
  breedingResults: row.breeding_results,
  stage: row.stage,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class YokaiSpeciesRepository extends BaseRepository<
  YokaiSpecies,
  YokaiSpeciesCreateInput,
  YokaiSpeciesUpdateInput
> {
  constructor() {
    super('yokai_monsters');
  }

  async findAll(options: YokaiSpeciesQueryOptions = {}): Promise<PaginatedYokaiSpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.tribe) {
      params.push(options.tribe);
      conditions.push(`tribe = $${params.length}`);
    }

    if (options.rank) {
      params.push(options.rank);
      conditions.push(`rank = $${params.length}`);
    }

    if (options.stage) {
      params.push(options.stage);
      conditions.push(`stage = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM yokai_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<YokaiSpeciesRow>(
      `
        SELECT * FROM yokai_monsters
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

  override async findById(id: number): Promise<YokaiSpecies | null> {
    const result = await db.query<YokaiSpeciesRow>(
      'SELECT * FROM yokai_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<YokaiSpecies | null> {
    const result = await db.query<YokaiSpeciesRow>(
      'SELECT * FROM yokai_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: YokaiSpeciesCreateInput): Promise<YokaiSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO yokai_monsters (
          name, tribe, rank, evolves_from, evolves_to,
          breeding_results, stage, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.name,
        input.tribe ?? null,
        input.rank ?? null,
        input.evolvesFrom ?? null,
        input.evolvesTo ?? null,
        input.breedingResults ?? null,
        input.stage ?? null,
        input.imageUrl ?? null,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create Yokai species');
    }
    const species = await this.findById(row.id);
    if (!species) {
      throw new Error('Failed to create Yokai species');
    }
    return species;
  }

  override async update(id: number, input: YokaiSpeciesUpdateInput): Promise<YokaiSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      tribe: 'tribe',
      rank: 'rank',
      evolvesFrom: 'evolves_from',
      evolvesTo: 'evolves_to',
      breedingResults: 'breeding_results',
      stage: 'stage',
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
        throw new Error('Yokai species not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE yokai_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Yokai species not found after update');
    }
    return updated;
  }

  async getTribes(): Promise<string[]> {
    const result = await db.query<{ tribe: string }>(
      'SELECT DISTINCT tribe FROM yokai_monsters WHERE tribe IS NOT NULL ORDER BY tribe'
    );
    return result.rows.map((r) => r.tribe);
  }

  async getRanks(): Promise<string[]> {
    const result = await db.query<{ rank: string }>(
      'SELECT DISTINCT rank FROM yokai_monsters WHERE rank IS NOT NULL ORDER BY rank'
    );
    return result.rows.map((r) => r.rank);
  }

  async getStages(): Promise<string[]> {
    const result = await db.query<{ stage: string }>(
      'SELECT DISTINCT stage FROM yokai_monsters WHERE stage IS NOT NULL ORDER BY stage'
    );
    return result.rows.map((r) => r.stage);
  }
}
