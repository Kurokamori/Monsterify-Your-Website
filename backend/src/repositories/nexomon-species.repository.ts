import { BaseRepository } from './base.repository';
import { db } from '../database';

export type NexomonSpeciesRow = {
  nr: number;
  name: string;
  is_legendary: boolean;
  type_primary: string;
  type_secondary: string | null;
  evolves_from: string | null;
  evolves_to: string | null;
  breeding_results: string | null;
  stage: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  breeds_into: string | null;
  rarity: string | null;
};

export type NexomonSpecies = {
  nr: number;
  name: string;
  isLegendary: boolean;
  typePrimary: string;
  typeSecondary: string | null;
  evolvesFrom: string | null;
  evolvesTo: string | null;
  breedingResults: string | null;
  stage: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  breedsInto: string | null;
  rarity: string | null;
};

export type NexomonSpeciesCreateInput = {
  nr: number;
  name: string;
  isLegendary?: boolean;
  typePrimary: string;
  typeSecondary?: string | null;
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  breedingResults?: string | null;
  stage?: string | null;
  imageUrl?: string | null;
};

export type NexomonSpeciesUpdateInput = Partial<NexomonSpeciesCreateInput>;

export type NexomonSpeciesQueryOptions = {
  search?: string;
  type?: string;
  legendary?: boolean;
  stage?: string;
  sortBy?: 'name' | 'nr';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedNexomonSpecies = {
  data: NexomonSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: NexomonSpeciesRow): NexomonSpecies => ({
  nr: row.nr,
  name: row.name,
  isLegendary: row.is_legendary,
  typePrimary: row.type_primary,
  typeSecondary: row.type_secondary,
  evolvesFrom: row.evolves_from,
  evolvesTo: row.evolves_to,
  breedingResults: row.breeding_results,
  stage: row.stage,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  breedsInto: row.breeds_into,
  rarity: row.rarity,
});

export class NexomonSpeciesRepository extends BaseRepository<
  NexomonSpecies,
  NexomonSpeciesCreateInput,
  NexomonSpeciesUpdateInput
> {
  constructor() {
    super('nexomon_monsters');
  }

  async findAll(options: NexomonSpeciesQueryOptions = {}): Promise<PaginatedNexomonSpecies> {
    const { page = 1, limit = 10, sortBy = 'nr', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.type) {
      params.push(options.type);
      conditions.push(`(type_primary = $${params.length} OR type_secondary = $${params.length})`);
    }

    if (options.legendary !== undefined) {
      params.push(options.legendary);
      conditions.push(`is_legendary = $${params.length}`);
    }

    if (options.stage) {
      params.push(options.stage);
      conditions.push(`stage = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM nexomon_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<NexomonSpeciesRow>(
      `
        SELECT * FROM nexomon_monsters
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

  override async findById(id: number): Promise<NexomonSpecies | null> {
    const result = await db.query<NexomonSpeciesRow>(
      'SELECT * FROM nexomon_monsters WHERE nr = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByNr(nr: number): Promise<NexomonSpecies | null> {
    const result = await db.query<NexomonSpeciesRow>(
      'SELECT * FROM nexomon_monsters WHERE nr = $1',
      [nr]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<NexomonSpecies | null> {
    const result = await db.query<NexomonSpeciesRow>(
      'SELECT * FROM nexomon_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: NexomonSpeciesCreateInput): Promise<NexomonSpecies> {
    const result = await db.query<{ nr: number }>(
      `
        INSERT INTO nexomon_monsters (
          nr, name, is_legendary, type_primary, type_secondary,
          evolves_from, evolves_to, breeding_results, stage, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING nr
      `,
      [
        input.nr,
        input.name,
        input.isLegendary ?? false,
        input.typePrimary,
        input.typeSecondary ?? null,
        input.evolvesFrom ?? null,
        input.evolvesTo ?? null,
        input.breedingResults ?? null,
        input.stage ?? null,
        input.imageUrl ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Nexomon species');
    }
    const species = await this.findById(insertedRow.nr);
    if (!species) {
      throw new Error('Failed to create Nexomon species');
    }
    return species;
  }

  override async update(id: number, input: NexomonSpeciesUpdateInput): Promise<NexomonSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      nr: 'nr',
      name: 'name',
      isLegendary: 'is_legendary',
      typePrimary: 'type_primary',
      typeSecondary: 'type_secondary',
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
        throw new Error('Nexomon species not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE nexomon_monsters SET ${updates.join(', ')} WHERE nr = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Nexomon species not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM nexomon_monsters WHERE nr = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getTypes(): Promise<string[]> {
    const result = await db.query<{ type: string }>(
      `
        SELECT DISTINCT type_primary as type FROM nexomon_monsters
        UNION
        SELECT DISTINCT type_secondary as type FROM nexomon_monsters WHERE type_secondary IS NOT NULL
        ORDER BY type
      `
    );
    return result.rows.map((r) => r.type);
  }

  async getStages(): Promise<string[]> {
    const result = await db.query<{ stage: string }>(
      'SELECT DISTINCT stage FROM nexomon_monsters WHERE stage IS NOT NULL ORDER BY stage'
    );
    return result.rows.map((r) => r.stage);
  }
}
