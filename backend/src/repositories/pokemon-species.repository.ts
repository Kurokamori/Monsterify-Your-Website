import { BaseRepository } from './base.repository';
import { db } from '../database';

export type PokemonSpeciesRow = {
  id: number;
  name: string;
  ndex: number;
  type_primary: string;
  type_secondary: string | null;
  evolves_from: string | null;
  evolves_to: string | null;
  breeding_results: string | null;
  stage: string | null;
  is_legendary: boolean;
  is_mythical: boolean;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PokemonSpecies = {
  id: number;
  name: string;
  ndex: number;
  typePrimary: string;
  typeSecondary: string | null;
  evolvesFrom: string | null;
  evolvesTo: string | null;
  breedingResults: string | null;
  stage: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PokemonSpeciesCreateInput = {
  name: string;
  ndex: number;
  typePrimary: string;
  typeSecondary?: string | null;
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  breedingResults?: string | null;
  stage?: string | null;
  isLegendary?: boolean;
  isMythical?: boolean;
  imageUrl?: string | null;
};

export type PokemonSpeciesUpdateInput = Partial<PokemonSpeciesCreateInput>;

export type PokemonSpeciesQueryOptions = {
  search?: string;
  type?: string;
  legendary?: boolean;
  mythical?: boolean;
  stage?: string;
  sortBy?: 'name' | 'ndex';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedPokemonSpecies = {
  data: PokemonSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: PokemonSpeciesRow): PokemonSpecies => ({
  id: row.id,
  name: row.name,
  ndex: row.ndex,
  typePrimary: row.type_primary,
  typeSecondary: row.type_secondary,
  evolvesFrom: row.evolves_from,
  evolvesTo: row.evolves_to,
  breedingResults: row.breeding_results,
  stage: row.stage,
  isLegendary: row.is_legendary,
  isMythical: row.is_mythical,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PokemonSpeciesRepository extends BaseRepository<
  PokemonSpecies,
  PokemonSpeciesCreateInput,
  PokemonSpeciesUpdateInput
> {
  constructor() {
    super('pokemon_monsters');
  }

  async findAll(options: PokemonSpeciesQueryOptions = {}): Promise<PaginatedPokemonSpecies> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'ndex',
      sortOrder = 'asc',
    } = options;

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

    if (options.mythical !== undefined) {
      params.push(options.mythical);
      conditions.push(`is_mythical = $${params.length}`);
    }

    if (options.stage) {
      params.push(options.stage);
      conditions.push(`stage = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM pokemon_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderColumn = sortBy === 'name' ? 'name' : 'ndex';
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<PokemonSpeciesRow>(
      `
        SELECT * FROM pokemon_monsters
        ${whereClause}
        ORDER BY ${orderColumn} ${orderDirection}
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

  override async findById(id: number): Promise<PokemonSpecies | null> {
    const result = await db.query<PokemonSpeciesRow>(
      'SELECT * FROM pokemon_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByNdex(ndex: number): Promise<PokemonSpecies | null> {
    const result = await db.query<PokemonSpeciesRow>(
      'SELECT * FROM pokemon_monsters WHERE ndex = $1',
      [ndex]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<PokemonSpecies | null> {
    const result = await db.query<PokemonSpeciesRow>(
      'SELECT * FROM pokemon_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: PokemonSpeciesCreateInput): Promise<PokemonSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO pokemon_monsters (
          name, ndex, type_primary, type_secondary, evolves_from, evolves_to,
          breeding_results, stage, is_legendary, is_mythical, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        input.name,
        input.ndex,
        input.typePrimary,
        input.typeSecondary ?? null,
        input.evolvesFrom ?? null,
        input.evolvesTo ?? null,
        input.breedingResults ?? null,
        input.stage ?? null,
        input.isLegendary ?? false,
        input.isMythical ?? false,
        input.imageUrl ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Pokemon species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Pokemon species');
    }
    return species;
  }

  override async update(id: number, input: PokemonSpeciesUpdateInput): Promise<PokemonSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      ndex: 'ndex',
      typePrimary: 'type_primary',
      typeSecondary: 'type_secondary',
      evolvesFrom: 'evolves_from',
      evolvesTo: 'evolves_to',
      breedingResults: 'breeding_results',
      stage: 'stage',
      isLegendary: 'is_legendary',
      isMythical: 'is_mythical',
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
        throw new Error('Pokemon species not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE pokemon_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Pokemon species not found after update');
    }
    return updated;
  }

  async getTypes(): Promise<string[]> {
    const result = await db.query<{ type: string }>(
      `
        SELECT DISTINCT type_primary as type FROM pokemon_monsters
        UNION
        SELECT DISTINCT type_secondary as type FROM pokemon_monsters WHERE type_secondary IS NOT NULL
        ORDER BY type
      `
    );
    return result.rows.map((r) => r.type);
  }

  async getStages(): Promise<string[]> {
    const result = await db.query<{ stage: string }>(
      'SELECT DISTINCT stage FROM pokemon_monsters WHERE stage IS NOT NULL ORDER BY stage'
    );
    return result.rows.map((r) => r.stage);
  }
}
