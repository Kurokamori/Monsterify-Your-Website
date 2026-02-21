import { BaseRepository } from './base.repository';
import { db } from '../database';

export type MonsterHunterSpeciesRow = {
  id: number;
  name: string;
  image_url: string | null;
  rank: number | null;
  element: string | null;
};

export type MonsterHunterSpecies = {
  id: number;
  name: string;
  imageUrl: string | null;
  rank: number | null;
  element: string | null;
};

export type MonsterHunterSpeciesCreateInput = {
  name: string;
  imageUrl?: string | null;
  rank?: number | null;
  element?: string | null;
};

export type MonsterHunterSpeciesUpdateInput = Partial<MonsterHunterSpeciesCreateInput>;

export type MonsterHunterSpeciesQueryOptions = {
  search?: string;
  rank?: number;
  element?: string;
  sortBy?: 'name' | 'rank';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedMonsterHunterSpecies = {
  data: MonsterHunterSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeSpecies = (row: MonsterHunterSpeciesRow): MonsterHunterSpecies => ({
  id: row.id,
  name: row.name,
  imageUrl: row.image_url,
  rank: row.rank,
  element: row.element,
});

export class MonsterHunterSpeciesRepository extends BaseRepository<
  MonsterHunterSpecies,
  MonsterHunterSpeciesCreateInput,
  MonsterHunterSpeciesUpdateInput
> {
  constructor() {
    super('monsterhunter_monsters');
  }

  async findAll(options: MonsterHunterSpeciesQueryOptions = {}): Promise<PaginatedMonsterHunterSpecies> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (options.rank !== undefined) {
      params.push(options.rank);
      conditions.push(`rank = $${params.length}`);
    }

    if (options.element) {
      params.push(options.element);
      conditions.push(`element = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM monsterhunter_monsters ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<MonsterHunterSpeciesRow>(
      `
        SELECT * FROM monsterhunter_monsters
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

  override async findById(id: number): Promise<MonsterHunterSpecies | null> {
    const result = await db.query<MonsterHunterSpeciesRow>(
      'SELECT * FROM monsterhunter_monsters WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<MonsterHunterSpecies | null> {
    const result = await db.query<MonsterHunterSpeciesRow>(
      'SELECT * FROM monsterhunter_monsters WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  override async create(input: MonsterHunterSpeciesCreateInput): Promise<MonsterHunterSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO monsterhunter_monsters (name, image_url, rank, element)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [
        input.name,
        input.imageUrl ?? null,
        input.rank ?? null,
        input.element ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Monster Hunter species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Monster Hunter species');
    }
    return species;
  }

  override async update(id: number, input: MonsterHunterSpeciesUpdateInput): Promise<MonsterHunterSpecies> {
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
    if (input.rank !== undefined) {
      values.push(input.rank);
      updates.push(`rank = $${values.length}`);
    }
    if (input.element !== undefined) {
      values.push(input.element);
      updates.push(`element = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Monster Hunter species not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE monsterhunter_monsters SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Monster Hunter species not found after update');
    }
    return updated;
  }

  async getElements(): Promise<string[]> {
    const result = await db.query<{ element: string }>(
      'SELECT DISTINCT element FROM monsterhunter_monsters WHERE element IS NOT NULL ORDER BY element'
    );
    return result.rows.map((r) => r.element);
  }

  async getRanks(): Promise<number[]> {
    const result = await db.query<{ rank: number }>(
      'SELECT DISTINCT rank FROM monsterhunter_monsters WHERE rank IS NOT NULL ORDER BY rank'
    );
    return result.rows.map((r) => r.rank);
  }
}
