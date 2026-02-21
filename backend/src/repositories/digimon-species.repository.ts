import { BaseRepository } from './base.repository';
import { db } from '../database';

export type DigimonSpeciesRow = {
  id: number;
  name: string;
  rank: string | null;
  level_required: number | null;
  attribute: string | null;
  families: string | null;
  digimon_type: string | null;
  natural_attributes: string | null;
  digivolves_from: string | null;
  digivolves_to: string | null;
  breeding_results: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DigimonSpecies = {
  id: number;
  name: string;
  rank: string | null;
  levelRequired: number | null;
  attribute: string | null;
  families: string | null;
  digimonType: string | null;
  naturalAttributes: string | null;
  digivolvesFrom: string | null;
  digivolvesTo: string | null;
  breedingResults: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DigimonSpeciesCreateInput = {
  name: string;
  rank?: string | null;
  levelRequired?: number | null;
  attribute?: string | null;
  families?: string | null;
  digimonType?: string | null;
  naturalAttributes?: string | null;
  digivolvesFrom?: string | null;
  digivolvesTo?: string | null;
  breedingResults?: string | null;
  imageUrl?: string | null;
};

export type DigimonSpeciesUpdateInput = Partial<DigimonSpeciesCreateInput>;

export type DigimonSpeciesQueryOptions = {
  search?: string;
  rank?: string;
  attribute?: string;
  sortBy?: 'name' | 'rank';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedDigimonSpecies = {
  data: DigimonSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: DigimonSpeciesRow): DigimonSpecies => ({
  id: row.id,
  name: row.name,
  rank: row.rank,
  levelRequired: row.level_required,
  attribute: row.attribute,
  families: row.families,
  digimonType: row.digimon_type,
  naturalAttributes: row.natural_attributes,
  digivolvesFrom: row.digivolves_from,
  digivolvesTo: row.digivolves_to,
  breedingResults: row.breeding_results,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class DigimonSpeciesRepository extends BaseRepository<
  DigimonSpecies,
  DigimonSpeciesCreateInput,
  DigimonSpeciesUpdateInput
> {
  constructor() {
    super('digimon_monsters');
  }

  async findAll(options: DigimonSpeciesQueryOptions = {}): Promise<PaginatedDigimonSpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.rank) {
      params.push(options.rank);
      conditions.push(`rank = $${params.length}`);
    }

    if (options.attribute) {
      params.push(options.attribute);
      conditions.push(`attribute = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM digimon_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<DigimonSpeciesRow>(
      `
        SELECT * FROM digimon_monsters
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

  override async findById(id: number): Promise<DigimonSpecies | null> {
    const result = await db.query<DigimonSpeciesRow>(
      'SELECT * FROM digimon_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<DigimonSpecies | null> {
    const result = await db.query<DigimonSpeciesRow>(
      'SELECT * FROM digimon_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: DigimonSpeciesCreateInput): Promise<DigimonSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO digimon_monsters (
          name, rank, level_required, attribute, families, digimon_type,
          natural_attributes, digivolves_from, digivolves_to, breeding_results, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        input.name,
        input.rank ?? null,
        input.levelRequired ?? null,
        input.attribute ?? null,
        input.families ?? null,
        input.digimonType ?? null,
        input.naturalAttributes ?? null,
        input.digivolvesFrom ?? null,
        input.digivolvesTo ?? null,
        input.breedingResults ?? null,
        input.imageUrl ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Digimon species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Digimon species');
    }
    return species;
  }

  override async update(id: number, input: DigimonSpeciesUpdateInput): Promise<DigimonSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      rank: 'rank',
      levelRequired: 'level_required',
      attribute: 'attribute',
      families: 'families',
      digimonType: 'digimon_type',
      naturalAttributes: 'natural_attributes',
      digivolvesFrom: 'digivolves_from',
      digivolvesTo: 'digivolves_to',
      breedingResults: 'breeding_results',
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
        throw new Error('Digimon species not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE digimon_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Digimon species not found after update');
    }
    return updated;
  }

  async getRanks(): Promise<string[]> {
    const result = await db.query<{ rank: string }>(
      'SELECT DISTINCT rank FROM digimon_monsters WHERE rank IS NOT NULL ORDER BY rank'
    );
    return result.rows.map((r) => r.rank);
  }

  async getAttributes(): Promise<string[]> {
    const result = await db.query<{ attribute: string }>(
      'SELECT DISTINCT attribute FROM digimon_monsters WHERE attribute IS NOT NULL ORDER BY attribute'
    );
    return result.rows.map((r) => r.attribute);
  }
}
