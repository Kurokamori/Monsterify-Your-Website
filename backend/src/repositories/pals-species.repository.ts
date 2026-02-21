import { BaseRepository } from './base.repository';
import { db } from '../database';

export type PalsSpeciesRow = {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PalsSpecies = {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PalsSpeciesCreateInput = {
  name: string;
  imageUrl?: string | null;
};

export type PalsSpeciesUpdateInput = Partial<PalsSpeciesCreateInput>;

export type PalsSpeciesQueryOptions = {
  search?: string;
  sortBy?: 'name' | 'id';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedPalsSpecies = {
  data: PalsSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: PalsSpeciesRow): PalsSpecies => ({
  id: row.id,
  name: row.name,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PalsSpeciesRepository extends BaseRepository<
  PalsSpecies,
  PalsSpeciesCreateInput,
  PalsSpeciesUpdateInput
> {
  constructor() {
    super('pals_monsters');
  }

  async findAll(options: PalsSpeciesQueryOptions = {}): Promise<PaginatedPalsSpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM pals_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<PalsSpeciesRow>(
      `
        SELECT * FROM pals_monsters
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

  override async findById(id: number): Promise<PalsSpecies | null> {
    const result = await db.query<PalsSpeciesRow>(
      'SELECT * FROM pals_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<PalsSpecies | null> {
    const result = await db.query<PalsSpeciesRow>(
      'SELECT * FROM pals_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: PalsSpeciesCreateInput): Promise<PalsSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO pals_monsters (name, image_url)
        VALUES ($1, $2)
        RETURNING id
      `,
      [input.name, input.imageUrl ?? null]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Pals species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Pals species');
    }
    return species;
  }

  override async update(id: number, input: PalsSpeciesUpdateInput): Promise<PalsSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.imageUrl !== undefined) {
      values.push(input.imageUrl);
      updates.push(`image_url = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Pals species not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE pals_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Pals species not found after update');
    }
    return updated;
  }
}
