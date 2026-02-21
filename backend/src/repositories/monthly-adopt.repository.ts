import { BaseRepository } from './base.repository';
import { db } from '../database';

export type MonthlyAdoptRow = {
  id: number;
  year: number;
  month: number;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  created_at: Date;
};

export type MonthlyAdopt = {
  id: number;
  year: number;
  month: number;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  createdAt: Date;
};

export type MonthlyAdoptWithCount = MonthlyAdopt & {
  adoptionCount: number;
};

export type AdoptionClaimRow = {
  id: number;
  adopt_id: number;
  trainer_id: number;
  monster_id: number;
  claimed_at: Date;
};

export type AdoptionClaim = {
  id: number;
  adoptId: number;
  trainerId: number;
  monsterId: number;
  claimedAt: Date;
};

export type MonthlyAdoptCreateInput = {
  year: number;
  month: number;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
};

export type MonthlyAdoptUpdateInput = Partial<MonthlyAdoptCreateInput>;

export type PaginatedMonthlyAdopts = {
  adopts: MonthlyAdoptWithCount[];
  total: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const normalizeMonthlyAdopt = (row: MonthlyAdoptRow): MonthlyAdopt => ({
  id: row.id,
  year: row.year,
  month: row.month,
  species1: row.species1,
  species2: row.species2,
  species3: row.species3,
  type1: row.type1,
  type2: row.type2,
  type3: row.type3,
  type4: row.type4,
  type5: row.type5,
  attribute: row.attribute,
  createdAt: row.created_at,
});

type MonthlyAdoptWithCountRow = MonthlyAdoptRow & {
  adoption_count: string;
};

const normalizeMonthlyAdoptWithCount = (row: MonthlyAdoptWithCountRow): MonthlyAdoptWithCount => ({
  ...normalizeMonthlyAdopt(row),
  adoptionCount: parseInt(row.adoption_count, 10),
});

const normalizeAdoptionClaim = (row: AdoptionClaimRow): AdoptionClaim => ({
  id: row.id,
  adoptId: row.adopt_id,
  trainerId: row.trainer_id,
  monsterId: row.monster_id,
  claimedAt: row.claimed_at,
});

export class MonthlyAdoptRepository extends BaseRepository<
  MonthlyAdopt,
  MonthlyAdoptCreateInput,
  MonthlyAdoptUpdateInput
> {
  constructor() {
    super('monthly_adopts');
  }

  override async findById(id: number): Promise<MonthlyAdoptWithCount | null> {
    const result = await db.query<MonthlyAdoptWithCountRow>(
      `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        WHERE a.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeMonthlyAdoptWithCount(row) : null;
  }

  async findByYearAndMonth(year: number, month: number, options: { page?: number; limit?: number } = {}): Promise<PaginatedMonthlyAdopts> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM monthly_adopts WHERE year = $1 AND month = $2',
      [year, month]
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get adopts
    const result = await db.query<MonthlyAdoptWithCountRow>(
      `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        WHERE year = $1 AND month = $2
        ORDER BY id ASC
        LIMIT $3 OFFSET $4
      `,
      [year, month, limit, offset]
    );

    return {
      adopts: result.rows.map(normalizeMonthlyAdoptWithCount),
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(options: { page?: number; limit?: number } = {}): Promise<PaginatedMonthlyAdopts> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM monthly_adopts');
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get adopts
    const result = await db.query<MonthlyAdoptWithCountRow>(
      `
        SELECT a.*,
        (SELECT COUNT(*) FROM adoption_claims WHERE adopt_id = a.id) AS adoption_count
        FROM monthly_adopts a
        ORDER BY year DESC, month DESC, id
        LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return {
      adopts: result.rows.map(normalizeMonthlyAdoptWithCount),
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  override async create(input: MonthlyAdoptCreateInput): Promise<MonthlyAdopt> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO monthly_adopts (
          year, month, species1, species2, species3,
          type1, type2, type3, type4, type5, attribute
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        input.year,
        input.month,
        input.species1,
        input.species2 ?? null,
        input.species3 ?? null,
        input.type1,
        input.type2 ?? null,
        input.type3 ?? null,
        input.type4 ?? null,
        input.type5 ?? null,
        input.attribute ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert monthly adopt');
    }
    const adopt = await this.findById(insertedRow.id);
    if (!adopt) {
      throw new Error('Failed to create monthly adopt');
    }
    return adopt;
  }

  override async update(id: number, input: MonthlyAdoptUpdateInput): Promise<MonthlyAdopt> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.species1 !== undefined) {
      values.push(input.species1);
      updates.push(`species1 = $${values.length}`);
    }
    if (input.species2 !== undefined) {
      values.push(input.species2);
      updates.push(`species2 = $${values.length}`);
    }
    if (input.species3 !== undefined) {
      values.push(input.species3);
      updates.push(`species3 = $${values.length}`);
    }
    if (input.type1 !== undefined) {
      values.push(input.type1);
      updates.push(`type1 = $${values.length}`);
    }
    if (input.type2 !== undefined) {
      values.push(input.type2);
      updates.push(`type2 = $${values.length}`);
    }
    if (input.type3 !== undefined) {
      values.push(input.type3);
      updates.push(`type3 = $${values.length}`);
    }
    if (input.type4 !== undefined) {
      values.push(input.type4);
      updates.push(`type4 = $${values.length}`);
    }
    if (input.type5 !== undefined) {
      values.push(input.type5);
      updates.push(`type5 = $${values.length}`);
    }
    if (input.attribute !== undefined) {
      values.push(input.attribute);
      updates.push(`attribute = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Monthly adopt not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(`UPDATE monthly_adopts SET ${updates.join(', ')} WHERE id = $${values.length}`, values);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Monthly adopt not found after update');
    }
    return updated;
  }

  async updateSpecies(id: number, speciesSlot: 'species1' | 'species2' | 'species3', newSpecies: string): Promise<boolean> {
    const result = await db.query(`UPDATE monthly_adopts SET ${speciesSlot} = $1 WHERE id = $2`, [newSpecies, id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Adoption Claim methods
  async recordAdoptionClaim(adoptId: number, trainerId: number, monsterId: number): Promise<AdoptionClaim> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO adoption_claims (adopt_id, trainer_id, monster_id, claimed_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [adoptId, trainerId, monsterId]
    );

    const insertedClaimRow = result.rows[0];
    if (!insertedClaimRow) {
      throw new Error('Failed to insert adoption claim');
    }
    const claimResult = await db.query<AdoptionClaimRow>(
      'SELECT * FROM adoption_claims WHERE id = $1',
      [insertedClaimRow.id]
    );
    const claimRow = claimResult.rows[0];
    if (!claimRow) {
      throw new Error('Failed to retrieve adoption claim');
    }
    return normalizeAdoptionClaim(claimRow);
  }

  async getAdoptionClaimsByTrainer(trainerId: number): Promise<(AdoptionClaim & { adopt: MonthlyAdopt })[]> {
    const result = await db.query<AdoptionClaimRow & MonthlyAdoptRow>(
      `
        SELECT ac.*, ma.year, ma.month, ma.species1, ma.species2, ma.species3,
               ma.type1, ma.type2, ma.type3, ma.type4, ma.type5, ma.attribute,
               ma.created_at as adopt_created_at
        FROM adoption_claims ac
        JOIN monthly_adopts ma ON ac.adopt_id = ma.id
        WHERE ac.trainer_id = $1
        ORDER BY ac.claimed_at DESC
      `,
      [trainerId]
    );

    return result.rows.map(row => ({
      ...normalizeAdoptionClaim(row),
      adopt: normalizeMonthlyAdopt({
        ...row,
        created_at: row.created_at,
      }),
    }));
  }

  async getAdoptionClaimsByAdopt(adoptId: number): Promise<AdoptionClaim[]> {
    const result = await db.query<AdoptionClaimRow>(
      'SELECT * FROM adoption_claims WHERE adopt_id = $1 ORDER BY claimed_at DESC',
      [adoptId]
    );
    return result.rows.map(normalizeAdoptionClaim);
  }

  async hasTrainerClaimedAdopt(trainerId: number, adoptId: number): Promise<boolean> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM adoption_claims WHERE trainer_id = $1 AND adopt_id = $2',
      [trainerId, adoptId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  // Utility methods
  async getMonthsWithData(): Promise<{ year: number; month: number }[]> {
    const result = await db.query<{ year: number; month: number }>(
      'SELECT DISTINCT year, month FROM monthly_adopts ORDER BY year DESC, month DESC'
    );
    return result.rows;
  }

  async getCountForMonth(year: number, month: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM monthly_adopts WHERE year = $1 AND month = $2',
      [year, month]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async getEarliestMonth(): Promise<{ year: number; month: number } | null> {
    const result = await db.query<{ year: number; month: number }>(
      'SELECT year, month FROM monthly_adopts ORDER BY year ASC, month ASC LIMIT 1'
    );
    return result.rows[0] ?? null;
  }
}
