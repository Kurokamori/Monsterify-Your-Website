import { BaseRepository } from './base.repository';
import { db } from '../database';

export type FakemonSpeciesRow = {
  id: number;
  number: number;
  name: string;
  category: string;
  classification: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  description: string | null;
  image_url: string | null;
  evolution_line: string | null;
  ability1: string | null;
  ability2: string | null;
  hidden_ability: string | null;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  stage: string | null;
  is_legendary: boolean;
  is_mythical: boolean;
  evolves_from: string | null;
  evolves_to: string | null;
  breeding_results: string | null;
  created_by: number | null;
  created_at: string | null;
};

export type FakemonSpecies = {
  id: number;
  number: number;
  name: string;
  category: string;
  classification: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  description: string | null;
  imageUrl: string | null;
  evolutionLine: unknown[] | null;
  ability1: string | null;
  ability2: string | null;
  hiddenAbility: string | null;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  stage: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  evolvesFrom: string | null;
  evolvesTo: string | null;
  breedingResults: string | null;
  createdBy: number | null;
  createdAt: string | null;
};

export type FakemonSpeciesCreateInput = {
  number: number;
  name: string;
  category: string;
  classification?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  evolutionLine?: unknown[] | null;
  ability1?: string | null;
  ability2?: string | null;
  hiddenAbility?: string | null;
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
  stage?: string | null;
  isLegendary?: boolean;
  isMythical?: boolean;
  evolvesFrom?: string | null;
  evolvesTo?: string | null;
  breedingResults?: string | null;
  createdBy?: number | null;
};

export type FakemonSpeciesUpdateInput = Partial<FakemonSpeciesCreateInput>;

export type FakemonSpeciesQueryOptions = {
  search?: string;
  type?: string;
  category?: string;
  attribute?: string;
  stage?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'number';
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedFakemonSpecies = {
  data: FakemonSpecies[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const parseEvolutionLine = (raw: string | null): unknown[] | null => {
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const normalizeSpecies = (row: FakemonSpeciesRow): FakemonSpecies => ({
  id: row.id,
  number: row.number,
  name: row.name,
  category: row.category,
  classification: row.classification,
  type1: row.type1,
  type2: row.type2,
  type3: row.type3,
  type4: row.type4,
  type5: row.type5,
  attribute: row.attribute,
  description: row.description,
  imageUrl: row.image_url,
  evolutionLine: parseEvolutionLine(row.evolution_line),
  ability1: row.ability1,
  ability2: row.ability2,
  hiddenAbility: row.hidden_ability,
  hp: row.hp,
  attack: row.attack,
  defense: row.defense,
  specialAttack: row.special_attack,
  specialDefense: row.special_defense,
  speed: row.speed,
  stage: row.stage,
  isLegendary: row.is_legendary,
  isMythical: row.is_mythical,
  evolvesFrom: row.evolves_from,
  evolvesTo: row.evolves_to,
  breedingResults: row.breeding_results,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export class FakemonSpeciesRepository extends BaseRepository<
  FakemonSpecies,
  FakemonSpeciesCreateInput,
  FakemonSpeciesUpdateInput
> {
  constructor() {
    super('fakemon');
  }

  async findAll(options: FakemonSpeciesQueryOptions = {}): Promise<PaginatedFakemonSpecies> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'number',
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
      conditions.push(
        `(type1 = $${params.length} OR type2 = $${params.length} OR type3 = $${params.length} OR type4 = $${params.length} OR type5 = $${params.length})`
      );
    }

    if (options.category) {
      params.push(options.category);
      conditions.push(`category = $${params.length}`);
    }

    if (options.attribute) {
      params.push(options.attribute);
      conditions.push(`attribute = $${params.length}`);
    }

    if (options.stage) {
      params.push(options.stage);
      conditions.push(`stage = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM fakemon ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const orderColumn = sortBy === 'name' ? 'name' : 'number';
    const orderDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const dataResult = await db.query<FakemonSpeciesRow>(
      `
        SELECT * FROM fakemon
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

  override async findById(id: number): Promise<FakemonSpecies | null> {
    const result = await db.query<FakemonSpeciesRow>(
      'SELECT * FROM fakemon WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByNumber(number: number): Promise<FakemonSpecies | null> {
    const result = await db.query<FakemonSpeciesRow>(
      'SELECT * FROM fakemon WHERE number = $1',
      [number]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findByName(name: string): Promise<FakemonSpecies | null> {
    const result = await db.query<FakemonSpeciesRow>(
      'SELECT * FROM fakemon WHERE name ILIKE $1',
      [name]
    );
    const row = result.rows[0];
    return row ? normalizeSpecies(row) : null;
  }

  async findPrevAndNext(number: number): Promise<{ prev: FakemonSpecies | null; next: FakemonSpecies | null }> {
    const prevResult = await db.query<FakemonSpeciesRow>(
      'SELECT * FROM fakemon WHERE number < $1 ORDER BY number DESC LIMIT 1',
      [number]
    );
    const nextResult = await db.query<FakemonSpeciesRow>(
      'SELECT * FROM fakemon WHERE number > $1 ORDER BY number ASC LIMIT 1',
      [number]
    );

    const prevRow = prevResult.rows[0];
    const nextRow = nextResult.rows[0];

    return {
      prev: prevRow ? normalizeSpecies(prevRow) : null,
      next: nextRow ? normalizeSpecies(nextRow) : null,
    };
  }

  override async create(input: FakemonSpeciesCreateInput): Promise<FakemonSpecies> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO fakemon (
          number, name, category, classification, type1, type2, type3, type4, type5,
          attribute, description, image_url, evolution_line,
          ability1, ability2, hidden_ability,
          hp, attack, defense, special_attack, special_defense, speed,
          stage, is_legendary, is_mythical,
          evolves_from, evolves_to, breeding_results,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25,
          $26, $27, $28,
          $29
        )
        RETURNING id
      `,
      [
        input.number,
        input.name,
        input.category,
        input.classification ?? null,
        input.type1,
        input.type2 ?? null,
        input.type3 ?? null,
        input.type4 ?? null,
        input.type5 ?? null,
        input.attribute ?? null,
        input.description ?? null,
        input.imageUrl ?? null,
        input.evolutionLine ? JSON.stringify(input.evolutionLine) : null,
        input.ability1 ?? null,
        input.ability2 ?? null,
        input.hiddenAbility ?? null,
        input.hp ?? 50,
        input.attack ?? 50,
        input.defense ?? 50,
        input.specialAttack ?? 50,
        input.specialDefense ?? 50,
        input.speed ?? 50,
        input.stage ?? null,
        input.isLegendary ?? false,
        input.isMythical ?? false,
        input.evolvesFrom ?? null,
        input.evolvesTo ?? null,
        input.breedingResults ?? null,
        input.createdBy ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert Fakemon species');
    }
    const species = await this.findById(insertedRow.id);
    if (!species) {
      throw new Error('Failed to create Fakemon species');
    }
    return species;
  }

  override async update(id: number, input: FakemonSpeciesUpdateInput): Promise<FakemonSpecies> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      number: 'number',
      name: 'name',
      category: 'category',
      classification: 'classification',
      type1: 'type1',
      type2: 'type2',
      type3: 'type3',
      type4: 'type4',
      type5: 'type5',
      attribute: 'attribute',
      description: 'description',
      imageUrl: 'image_url',
      ability1: 'ability1',
      ability2: 'ability2',
      hiddenAbility: 'hidden_ability',
      hp: 'hp',
      attack: 'attack',
      defense: 'defense',
      specialAttack: 'special_attack',
      specialDefense: 'special_defense',
      speed: 'speed',
      stage: 'stage',
      isLegendary: 'is_legendary',
      isMythical: 'is_mythical',
      evolvesFrom: 'evolves_from',
      evolvesTo: 'evolves_to',
      breedingResults: 'breeding_results',
      createdBy: 'created_by',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    // Handle evolutionLine separately due to JSON serialization
    if (input.evolutionLine !== undefined) {
      values.push(input.evolutionLine ? JSON.stringify(input.evolutionLine) : null);
      updates.push(`evolution_line = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Fakemon species not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE fakemon SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Fakemon species not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM fakemon WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getCategories(): Promise<string[]> {
    const result = await db.query<{ category: string }>(
      'SELECT DISTINCT category FROM fakemon WHERE category IS NOT NULL ORDER BY category'
    );
    return result.rows.map((r) => r.category);
  }

  async getNumbersByCategory(category: string): Promise<number[]> {
    const result = await db.query<{ number: number }>(
      'SELECT number FROM fakemon WHERE category = $1 ORDER BY number',
      [category]
    );
    return result.rows.map((r) => r.number);
  }

  async getNextNumber(): Promise<number> {
    const result = await db.query<{ max_number: string | null }>(
      'SELECT MAX(number) as max_number FROM fakemon'
    );
    const maxNumber = result.rows[0]?.max_number;
    return maxNumber ? parseInt(maxNumber, 10) + 1 : 1;
  }

  async findRandom(count = 1): Promise<FakemonSpecies[]> {
    const result = await db.query<FakemonSpeciesRow>(
      `SELECT * FROM fakemon ORDER BY RANDOM() LIMIT $1`,
      [count]
    );
    return result.rows.map(normalizeSpecies);
  }

  async search(query: string, limit = 10): Promise<FakemonSpecies[]> {
    const result = await db.query<FakemonSpeciesRow>(
      `SELECT * FROM fakemon WHERE name ILIKE $1 ORDER BY name LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows.map(normalizeSpecies);
  }

  async bulkCreate(items: FakemonSpeciesCreateInput[], createdBy?: number): Promise<FakemonSpecies[]> {
    const created: FakemonSpecies[] = [];

    for (const item of items) {
      const input: FakemonSpeciesCreateInput = {
        ...item,
        createdBy: createdBy ?? item.createdBy ?? null,
      };
      const species = await this.create(input);
      created.push(species);
    }

    return created;
  }
}
