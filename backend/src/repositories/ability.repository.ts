import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AbilityRow = {
  id: number;
  name: string;
  effect: string | null;
  description: string | null;
  common_types: string[] | null;
  signature_monsters: string[] | null;
  created_at: Date;
  updated_at: Date;
};

export type Ability = {
  id: number;
  name: string;
  effect: string | null;
  description: string | null;
  commonTypes: string[] | null;
  signatureMonsters: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AbilityCreateInput = {
  name: string;
  effect?: string | null;
  description?: string | null;
  commonTypes?: string[] | null;
  signatureMonsters?: string[] | null;
};

export type AbilityUpdateInput = Partial<AbilityCreateInput>;

export type AbilityQueryOptions = {
  search?: string;
  monsterSearch?: string;
  types?: string[];
  typeLogic?: 'AND' | 'OR';
  sortBy?: 'name' | 'effect';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type PaginatedAbilities = {
  data: Ability[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const normalizeAbility = (row: AbilityRow): Ability => ({
  id: row.id,
  name: row.name,
  effect: row.effect,
  description: row.description,
  commonTypes: row.common_types,
  signatureMonsters: row.signature_monsters,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class AbilityRepository extends BaseRepository<
  Ability,
  AbilityCreateInput,
  AbilityUpdateInput
> {
  constructor() {
    super('abilities');
  }

  async findAll(options: AbilityQueryOptions = {}): Promise<PaginatedAbilities> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      typeLogic = 'OR',
    } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.search) {
      params.push(`%${options.search}%`);
      const searchIndex = params.length;
      conditions.push(
        `(name ILIKE $${searchIndex} OR effect ILIKE $${searchIndex} OR description ILIKE $${searchIndex})`
      );
    }

    if (options.monsterSearch) {
      params.push(`%${options.monsterSearch}%`);
      conditions.push(`signature_monsters::text ILIKE $${params.length}`);
    }

    if (options.types && options.types.length > 0) {
      const typeConditions = options.types.map((type) => {
        params.push(type);
        return `$${params.length} = ANY(common_types)`;
      });

      if (typeLogic === 'AND') {
        conditions.push(`(${typeConditions.join(' AND ')})`);
      } else {
        conditions.push(`(${typeConditions.join(' OR ')})`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM abilities ${whereClause}`,
      params
    );
    const countRow = countResult.rows[0];
    const total = parseInt(countRow?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const validSortFields = ['name', 'effect'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<AbilityRow>(
      `
        SELECT * FROM abilities
        ${whereClause}
        ORDER BY ${safeSortBy} ${orderDirection}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      data: dataResult.rows.map(normalizeAbility),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async findById(id: number): Promise<Ability | null> {
    const result = await db.query<AbilityRow>(
      'SELECT * FROM abilities WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAbility(row) : null;
  }

  async findByName(name: string): Promise<Ability | null> {
    const result = await db.query<AbilityRow>(
      'SELECT * FROM abilities WHERE name = $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeAbility(row) : null;
  }

  async findRandom(count = 2): Promise<Ability[]> {
    const result = await db.query<AbilityRow>(
      `SELECT * FROM abilities ORDER BY RANDOM() LIMIT $1`,
      [count]
    );
    return result.rows.map(normalizeAbility);
  }

  override async create(input: AbilityCreateInput): Promise<Ability> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO abilities (name, effect, description, common_types, signature_monsters)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [
        input.name,
        input.effect ?? null,
        input.description ?? null,
        input.commonTypes ?? null,
        input.signatureMonsters ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert ability');
    }
    const ability = await this.findById(insertedRow.id);
    if (!ability) {
      throw new Error('Failed to create ability');
    }
    return ability;
  }

  override async update(id: number, input: AbilityUpdateInput): Promise<Ability> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.effect !== undefined) {
      values.push(input.effect);
      updates.push(`effect = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.commonTypes !== undefined) {
      values.push(input.commonTypes);
      updates.push(`common_types = $${values.length}`);
    }
    if (input.signatureMonsters !== undefined) {
      values.push(input.signatureMonsters);
      updates.push(`signature_monsters = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Ability not found');
      }
      return existing;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await db.query(
      `UPDATE abilities SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Ability not found after update');
    }
    return updated;
  }

  async getAllTypes(): Promise<string[]> {
    const result = await db.query<{ type: string }>(
      `SELECT DISTINCT unnest(common_types) as type FROM abilities WHERE common_types IS NOT NULL ORDER BY type`
    );
    return result.rows.map((r) => r.type).filter((t) => t?.trim());
  }

  async getAllNames(): Promise<{ name: string; description: string }[]> {
    const result = await db.query<{ name: string; description: string }>(
      `SELECT name, description FROM abilities ORDER BY name`
    );
    return result.rows;
  }
}
