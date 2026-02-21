import { BaseRepository } from './base.repository';
import { db } from '../database';

export type AntiqueAuctionRow = {
  id: number;
  name: string;
  antique: string;
  image: string | null;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  description: string | null;
  family: string | null;
  creator: string | null;
  created_at: Date;
};

export type AntiqueAuction = {
  id: number;
  name: string;
  antique: string;
  image: string | null;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  description: string | null;
  family: string | null;
  creator: string | null;
  createdAt: Date;
};

export type AntiqueAuctionClaimRow = {
  id: number;
  auction_id: number;
  trainer_id: number;
  monster_id: number;
  claimed_at: Date;
};

export type AntiqueAuctionClaim = {
  id: number;
  auctionId: number;
  trainerId: number;
  monsterId: number;
  claimedAt: Date;
};

export type AntiqueAuctionCreateInput = {
  name?: string;
  antique: string;
  image?: string | null;
  species1: string;
  species2?: string | null;
  species3?: string | null;
  type1: string;
  type2?: string | null;
  type3?: string | null;
  type4?: string | null;
  type5?: string | null;
  attribute?: string | null;
  description?: string | null;
  family?: string | null;
  creator?: string | null;
};

export type AntiqueAuctionUpdateInput = Partial<AntiqueAuctionCreateInput>;

export type AntiqueAuctionQueryOptions = {
  antique?: string;
  species?: string;
  type?: string;
  creator?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PaginatedAntiqueAuctions = {
  auctions: AntiqueAuction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const normalizeAntiqueAuction = (row: AntiqueAuctionRow): AntiqueAuction => ({
  id: row.id,
  name: row.name,
  antique: row.antique,
  image: row.image,
  species1: row.species1,
  species2: row.species2,
  species3: row.species3,
  type1: row.type1,
  type2: row.type2,
  type3: row.type3,
  type4: row.type4,
  type5: row.type5,
  attribute: row.attribute,
  description: row.description,
  family: row.family,
  creator: row.creator,
  createdAt: row.created_at,
});

const normalizeAntiqueAuctionClaim = (row: AntiqueAuctionClaimRow): AntiqueAuctionClaim => ({
  id: row.id,
  auctionId: row.auction_id,
  trainerId: row.trainer_id,
  monsterId: row.monster_id,
  claimedAt: row.claimed_at,
});

export class AntiqueAuctionRepository extends BaseRepository<
  AntiqueAuction,
  AntiqueAuctionCreateInput,
  AntiqueAuctionUpdateInput
> {
  constructor() {
    super('antique_auctions');
  }

  override async findById(id: number): Promise<AntiqueAuction | null> {
    const result = await db.query<AntiqueAuctionRow>(
      'SELECT * FROM antique_auctions WHERE id = $1',
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeAntiqueAuction(row) : null;
  }

  async findAll(): Promise<AntiqueAuction[]> {
    const result = await db.query<AntiqueAuctionRow>(
      'SELECT * FROM antique_auctions ORDER BY antique ASC, name ASC'
    );
    return result.rows.map(normalizeAntiqueAuction);
  }

  async findByAntique(antique: string): Promise<AntiqueAuction[]> {
    const result = await db.query<AntiqueAuctionRow>(
      'SELECT * FROM antique_auctions WHERE antique = $1 ORDER BY name ASC',
      [antique]
    );
    return result.rows.map(normalizeAntiqueAuction);
  }

  async getCatalogue(options: AntiqueAuctionQueryOptions = {}): Promise<PaginatedAntiqueAuctions> {
    const { antique, species, type, creator, search, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (antique) {
      conditions.push(`antique = $${paramIndex++}`);
      params.push(antique);
    }

    if (species) {
      conditions.push(`(LOWER(species1) LIKE $${paramIndex} OR LOWER(species2) LIKE $${paramIndex} OR LOWER(species3) LIKE $${paramIndex})`);
      params.push(`%${species.toLowerCase()}%`);
      paramIndex++;
    }

    if (type) {
      conditions.push(`(LOWER(type1) = $${paramIndex} OR LOWER(type2) = $${paramIndex} OR LOWER(type3) = $${paramIndex} OR LOWER(type4) = $${paramIndex} OR LOWER(type5) = $${paramIndex})`);
      params.push(type.toLowerCase());
      paramIndex++;
    }

    if (creator) {
      conditions.push(`LOWER(creator) LIKE $${paramIndex++}`);
      params.push(`%${creator.toLowerCase()}%`);
    }

    if (search) {
      conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(species1) LIKE $${paramIndex} OR LOWER(species2) LIKE $${paramIndex} OR LOWER(species3) LIKE $${paramIndex} OR LOWER(creator) LIKE $${paramIndex})`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM antique_auctions WHERE ${whereClause}`,
      params
    );
    const countRow = countResult.rows[0];
    const total = parseInt(countRow?.count ?? '0', 10);

    // Get auctions
    const auctionsParams = [...params, limit, offset];
    const result = await db.query<AntiqueAuctionRow>(
      `SELECT * FROM antique_auctions WHERE ${whereClause} ORDER BY antique ASC, name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      auctionsParams
    );

    return {
      auctions: result.rows.map(normalizeAntiqueAuction),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  override async create(input: AntiqueAuctionCreateInput): Promise<AntiqueAuction> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO antique_auctions (
          name, antique, image, species1, species2, species3,
          type1, type2, type3, type4, type5, attribute,
          description, family, creator
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `,
      [
        input.name ?? input.species1,
        input.antique,
        input.image ?? null,
        input.species1,
        input.species2 ?? null,
        input.species3 ?? null,
        input.type1,
        input.type2 ?? null,
        input.type3 ?? null,
        input.type4 ?? null,
        input.type5 ?? null,
        input.attribute ?? null,
        input.description ?? null,
        input.family ?? null,
        input.creator ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert antique auction');
    }
    const auction = await this.findById(insertedRow.id);
    if (!auction) {
      throw new Error('Failed to create antique auction');
    }
    return auction;
  }

  override async update(id: number, input: AntiqueAuctionUpdateInput): Promise<AntiqueAuction> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      values.push(input.name);
      updates.push(`name = $${values.length}`);
    }
    if (input.antique !== undefined) {
      values.push(input.antique);
      updates.push(`antique = $${values.length}`);
    }
    if (input.image !== undefined) {
      values.push(input.image);
      updates.push(`image = $${values.length}`);
    }
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
    if (input.description !== undefined) {
      values.push(input.description);
      updates.push(`description = $${values.length}`);
    }
    if (input.family !== undefined) {
      values.push(input.family);
      updates.push(`family = $${values.length}`);
    }
    if (input.creator !== undefined) {
      values.push(input.creator);
      updates.push(`creator = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Antique auction not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE antique_auctions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Antique auction not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    // Delete claims first
    await db.query('DELETE FROM antique_auction_claims WHERE auction_id = $1', [id]);
    const result = await db.query('DELETE FROM antique_auctions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Claim methods
  async recordClaim(auctionId: number, trainerId: number, monsterId: number): Promise<AntiqueAuctionClaim> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO antique_auction_claims (auction_id, trainer_id, monster_id, claimed_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [auctionId, trainerId, monsterId]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert auction claim');
    }
    const claimResult = await db.query<AntiqueAuctionClaimRow>(
      'SELECT * FROM antique_auction_claims WHERE id = $1',
      [insertedRow.id]
    );
    const claimRow = claimResult.rows[0];
    if (!claimRow) {
      throw new Error('Failed to retrieve created claim');
    }
    return normalizeAntiqueAuctionClaim(claimRow);
  }

  async getClaimsByAuction(auctionId: number): Promise<AntiqueAuctionClaim[]> {
    const result = await db.query<AntiqueAuctionClaimRow>(
      'SELECT * FROM antique_auction_claims WHERE auction_id = $1 ORDER BY claimed_at DESC',
      [auctionId]
    );
    return result.rows.map(normalizeAntiqueAuctionClaim);
  }

  async getClaimsByTrainer(trainerId: number): Promise<(AntiqueAuctionClaim & { auction: AntiqueAuction })[]> {
    const result = await db.query<AntiqueAuctionClaimRow & AntiqueAuctionRow>(
      `
        SELECT c.*, a.name, a.antique, a.image, a.species1, a.species2, a.species3,
               a.type1, a.type2, a.type3, a.type4, a.type5, a.attribute,
               a.description, a.family, a.creator, a.created_at as auction_created_at
        FROM antique_auction_claims c
        JOIN antique_auctions a ON c.auction_id = a.id
        WHERE c.trainer_id = $1
        ORDER BY c.claimed_at DESC
      `,
      [trainerId]
    );

    return result.rows.map(row => ({
      ...normalizeAntiqueAuctionClaim(row),
      auction: normalizeAntiqueAuction({
        ...row,
        created_at: row.created_at,
      }),
    }));
  }

  // Utility methods
  async getUniqueAntiques(): Promise<string[]> {
    const result = await db.query<{ antique: string }>(
      'SELECT DISTINCT antique FROM antique_auctions ORDER BY antique ASC'
    );
    return result.rows.map(row => row.antique);
  }

  async getUniqueCreators(): Promise<string[]> {
    const result = await db.query<{ creator: string }>(
      "SELECT DISTINCT creator FROM antique_auctions WHERE creator IS NOT NULL AND creator != '' ORDER BY creator ASC"
    );
    return result.rows.map(row => row.creator);
  }

  async getUniqueTypes(): Promise<string[]> {
    const result = await db.query<{ type_val: string }>(
      `
        SELECT DISTINCT type_val FROM (
          SELECT type1 as type_val FROM antique_auctions WHERE type1 IS NOT NULL AND type1 != ''
          UNION
          SELECT type2 FROM antique_auctions WHERE type2 IS NOT NULL AND type2 != ''
          UNION
          SELECT type3 FROM antique_auctions WHERE type3 IS NOT NULL AND type3 != ''
          UNION
          SELECT type4 FROM antique_auctions WHERE type4 IS NOT NULL AND type4 != ''
          UNION
          SELECT type5 FROM antique_auctions WHERE type5 IS NOT NULL AND type5 != ''
        ) types ORDER BY type_val ASC
      `
    );
    return result.rows.map(row => row.type_val);
  }

  async getByFamily(family: string): Promise<AntiqueAuction[]> {
    const result = await db.query<AntiqueAuctionRow>(
      'SELECT * FROM antique_auctions WHERE family = $1 ORDER BY name ASC',
      [family]
    );
    return result.rows.map(normalizeAntiqueAuction);
  }
}
