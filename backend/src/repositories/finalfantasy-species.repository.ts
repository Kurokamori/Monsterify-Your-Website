import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FinalFantasySpeciesRow = {
  id: number;
  name: string;
  image_url: string | null;
  evolves_from: string | null;
  evolves_to: string | null;
  stage: string | null;
  breeding_results: string | null;
};

export type FinalFantasySpecies = {
  id: number;
  name: string;
  imageUrl: string | null;
  evolvesFrom: string | null;
  evolvesTo: string | null;
  stage: string | null;
  breedingResults: string | null;
};

export type FinalFantasySpeciesCreateInput = {
  name: string;
  imageUrl?: string | null;
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  stage?: string | null;
  breedingResults?: string | null;
};

export type FinalFantasySpeciesUpdateInput = Partial<FinalFantasySpeciesCreateInput>;

export type FinalFantasySpeciesQueryOptions = {
  search?: string;
  stage?: string;
  sortBy?: 'name' | 'stage';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedFinalFantasySpecies = {
  data: FinalFantasySpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: FinalFantasySpeciesRow): FinalFantasySpecies => ({
  id: row.id,
  name: row.name,
  imageUrl: row.image_url,
  evolvesFrom: row.evolves_from,
  evolvesTo: row.evolves_to,
  stage: row.stage,
  breedingResults: row.breeding_results,
});

export class FinalFantasySpeciesRepository extends BaseRepository<
  FinalFantasySpecies,
  FinalFantasySpeciesCreateInput,
  FinalFantasySpeciesUpdateInput
> {
  constructor() {
    super('finalfantasy_monsters');
  }

  async findAll(options: FinalFantasySpeciesQueryOptions = {}): Promise<PaginatedFinalFantasySpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.stage) {
      params.push(options.stage);
      conditions.push(`stage = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM finalfantasy_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<FinalFantasySpeciesRow>(
      `
        SELECT * FROM finalfantasy_monsters
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

  override async findById(id: number): Promise<FinalFantasySpecies | null> {
    const result = await db.query<FinalFantasySpeciesRow>(
      'SELECT * FROM finalfantasy_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<FinalFantasySpecies | null> {
    const result = await db.query<FinalFantasySpeciesRow>(
      'SELECT * FROM finalfantasy_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: FinalFantasySpeciesCreateInput): Promise<FinalFantasySpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO finalfantasy_monsters (
          name, image_url, evolves_from, evolves_to, stage, breeding_results
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.name,
        input.imageUrl ?? null,
        input.evolvesFrom ?? null,
        input.evolvesTo ?? null,
        input.stage ?? null,
        input.breedingResults ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Final Fantasy species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Final Fantasy species');
    }
    return species;
  }

  override async update(id: number, input: FinalFantasySpeciesUpdateInput): Promise<FinalFantasySpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      imageUrl: 'image_url',
      evolvesFrom: 'evolves_from',
      evolvesTo: 'evolves_to',
      stage: 'stage',
      breedingResults: 'breeding_results',
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
        throw new Error('Final Fantasy species not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE finalfantasy_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Final Fantasy species not found after update');
    }
    return updated;
  }

  async getStages(): Promise<string[]> {
    const result = await db.query<{ stage: string }>(
      'SELECT DISTINCT stage FROM finalfantasy_monsters WHERE stage IS NOT NULL ORDER BY stage'
    );
    return result.rows.map((r) => r.stage);
  }
}
