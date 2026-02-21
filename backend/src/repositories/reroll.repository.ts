import { BaseRepository } from './base.repository';
import { db } from '../database';
import crypto from 'crypto';

// Reroll Session Types
export type RerollSessionStatus = 'active' | 'completed' | 'expired' | 'cancelled';
export type RerollType = 'monster' | 'item' | 'both';

export type RerollSessionRow = {
  id: number;
  token: string;
  roll_type: RerollType;
  target_user_id: number;
  monster_params: string | object | null;
  item_params: string | object | null;
  gift_levels: number;
  rolled_monsters: string | object | null;
  rolled_items: string | object | null;
  monster_claim_limit: number | null;
  item_claim_limit: number | null;
  created_by: number;
  created_at: Date;
  status: RerollSessionStatus;
  notes: string | null;
};

export type RerollSession = {
  id: number;
  token: string;
  rollType: RerollType;
  targetUserId: number;
  monsterParams: Record<string, unknown> | null;
  itemParams: Record<string, unknown> | null;
  giftLevels: number;
  rolledMonsters: unknown[];
  rolledItems: unknown[];
  monsterClaimLimit: number | null;
  itemClaimLimit: number | null;
  createdBy: number;
  createdAt: Date;
  status: RerollSessionStatus;
  notes: string | null;
};

export type RerollSessionWithDetails = RerollSession & {
  createdByUsername: string | null;
  targetUsername: string | null;
  targetDisplayName: string | null;
  claimCount: number;
};

// Reroll Claim Types
export type RerollClaimType = 'monster' | 'item';

export type RerollClaimRow = {
  id: number;
  session_id: number;
  user_id: number;
  trainer_id: number;
  claim_type: RerollClaimType;
  result_index: number;
  claimed_data: string | object | null;
  monster_name: string | null;
  item_quantity: number;
  claimed_at: Date;
};

export type RerollClaim = {
  id: number;
  sessionId: number;
  userId: number;
  trainerId: number;
  claimType: RerollClaimType;
  resultIndex: number;
  claimedData: unknown;
  monsterName: string | null;
  itemQuantity: number;
  claimedAt: Date;
};

export type RerollClaimWithDetails = RerollClaim & {
  userUsername: string | null;
  userDisplayName: string | null;
  trainerName: string | null;
};

// Input Types
export type RerollSessionCreateInput = {
  rollType: RerollType;
  targetUserId: number;
  monsterParams?: Record<string, unknown> | null;
  itemParams?: Record<string, unknown> | null;
  giftLevels?: number;
  rolledMonsters?: unknown[];
  rolledItems?: unknown[];
  monsterClaimLimit?: number | null;
  itemClaimLimit?: number | null;
  createdBy: number;
  notes?: string | null;
};

export type RerollSessionUpdateInput = {
  rolledMonsters?: unknown[];
  rolledItems?: unknown[];
  monsterClaimLimit?: number | null;
  itemClaimLimit?: number | null;
  status?: RerollSessionStatus;
  notes?: string | null;
};

export type RerollClaimCreateInput = {
  sessionId: number;
  userId: number;
  trainerId: number;
  claimType: RerollClaimType;
  resultIndex: number;
  claimedData?: unknown;
  monsterName?: string | null;
  itemQuantity?: number;
};

export type RerollSessionQueryOptions = {
  status?: RerollSessionStatus;
  createdBy?: number;
  page?: number;
  limit?: number;
};

export type PaginatedRerollSessions = {
  sessions: RerollSessionWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// JSON parsing helper
const parseJsonField = <T>(value: string | object | null, defaultValue: T): T => {
  if (value === null || value === undefined) {return defaultValue;}
  if (typeof value === 'object') {return value as T;}
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

// Normalizers
const normalizeRerollSession = (row: RerollSessionRow): RerollSession => ({
  id: row.id,
  token: row.token,
  rollType: row.roll_type,
  targetUserId: row.target_user_id,
  monsterParams: parseJsonField(row.monster_params, null),
  itemParams: parseJsonField(row.item_params, null),
  giftLevels: row.gift_levels,
  rolledMonsters: parseJsonField(row.rolled_monsters, []),
  rolledItems: parseJsonField(row.rolled_items, []),
  monsterClaimLimit: row.monster_claim_limit,
  itemClaimLimit: row.item_claim_limit,
  createdBy: row.created_by,
  createdAt: row.created_at,
  status: row.status,
  notes: row.notes,
});

type RerollSessionWithDetailsRow = RerollSessionRow & {
  created_by_username: string | null;
  target_username: string | null;
  target_display_name: string | null;
  claim_count: string;
};

const normalizeRerollSessionWithDetails = (row: RerollSessionWithDetailsRow): RerollSessionWithDetails => ({
  ...normalizeRerollSession(row),
  createdByUsername: row.created_by_username,
  targetUsername: row.target_username,
  targetDisplayName: row.target_display_name,
  claimCount: parseInt(row.claim_count, 10) || 0,
});

const normalizeRerollClaim = (row: RerollClaimRow): RerollClaim => ({
  id: row.id,
  sessionId: row.session_id,
  userId: row.user_id,
  trainerId: row.trainer_id,
  claimType: row.claim_type,
  resultIndex: row.result_index,
  claimedData: parseJsonField(row.claimed_data, null),
  monsterName: row.monster_name,
  itemQuantity: row.item_quantity,
  claimedAt: row.claimed_at,
});

type RerollClaimWithDetailsRow = RerollClaimRow & {
  user_username: string | null;
  user_display_name: string | null;
  trainer_name: string | null;
};

const normalizeRerollClaimWithDetails = (row: RerollClaimWithDetailsRow): RerollClaimWithDetails => ({
  ...normalizeRerollClaim(row),
  userUsername: row.user_username,
  userDisplayName: row.user_display_name,
  trainerName: row.trainer_name,
});

export class RerollRepository extends BaseRepository<
  RerollSession,
  RerollSessionCreateInput,
  RerollSessionUpdateInput
> {
  constructor() {
    super('reroll_sessions');
  }

  // Token generation
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Session Methods
  override async findById(id: number): Promise<RerollSessionWithDetails | null> {
    const result = await db.query<RerollSessionWithDetailsRow>(
      `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name,
               (SELECT COUNT(*) FROM reroll_claims WHERE session_id = rs.id)::text AS claim_count
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE rs.id = $1
      `,
      [id]
    );
    const row = result.rows[0];
    return row ? normalizeRerollSessionWithDetails(row) : null;
  }

  async findByToken(token: string): Promise<RerollSessionWithDetails | null> {
    const result = await db.query<RerollSessionWithDetailsRow>(
      `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name,
               (SELECT COUNT(*) FROM reroll_claims WHERE session_id = rs.id)::text AS claim_count
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE rs.token = $1
      `,
      [token]
    );
    const row = result.rows[0];
    return row ? normalizeRerollSessionWithDetails(row) : null;
  }

  async findAll(options: RerollSessionQueryOptions = {}): Promise<PaginatedRerollSessions> {
    const { status, createdBy, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`rs.status = $${paramIndex++}`);
      params.push(status);
    }

    if (createdBy) {
      conditions.push(`rs.created_by = $${paramIndex++}`);
      params.push(createdBy);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM reroll_sessions rs WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get sessions
    const sessionsParams = [...params, limit, offset];
    const result = await db.query<RerollSessionWithDetailsRow>(
      `
        SELECT rs.*,
               u1.username AS created_by_username,
               u2.username AS target_username,
               u2.display_name AS target_display_name,
               (SELECT COUNT(*) FROM reroll_claims WHERE session_id = rs.id)::text AS claim_count
        FROM reroll_sessions rs
        LEFT JOIN users u1 ON rs.created_by = u1.id
        LEFT JOIN users u2 ON rs.target_user_id = u2.id
        WHERE ${whereClause}
        ORDER BY rs.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `,
      sessionsParams
    );

    return {
      sessions: result.rows.map(normalizeRerollSessionWithDetails),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  override async create(input: RerollSessionCreateInput): Promise<RerollSession> {
    const token = this.generateToken();
    const monsterParamsJson = input.monsterParams ? JSON.stringify(input.monsterParams) : null;
    const itemParamsJson = input.itemParams ? JSON.stringify(input.itemParams) : null;
    const rolledMonstersJson = JSON.stringify(input.rolledMonsters ?? []);
    const rolledItemsJson = JSON.stringify(input.rolledItems ?? []);

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO reroll_sessions (
          token, roll_type, target_user_id, monster_params, item_params,
          gift_levels, rolled_monsters, rolled_items, monster_claim_limit,
          item_claim_limit, created_by, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        token,
        input.rollType,
        input.targetUserId,
        monsterParamsJson,
        itemParamsJson,
        input.giftLevels ?? 0,
        rolledMonstersJson,
        rolledItemsJson,
        input.monsterClaimLimit ?? null,
        input.itemClaimLimit ?? null,
        input.createdBy,
        'active',
        input.notes ?? null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert reroll session');
    }
    const session = await this.findById(insertedRow.id);
    if (!session) {
      throw new Error('Failed to create reroll session');
    }
    return session;
  }

  override async update(id: number, input: RerollSessionUpdateInput): Promise<RerollSession> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.rolledMonsters !== undefined) {
      values.push(JSON.stringify(input.rolledMonsters));
      updates.push(`rolled_monsters = $${values.length}`);
    }
    if (input.rolledItems !== undefined) {
      values.push(JSON.stringify(input.rolledItems));
      updates.push(`rolled_items = $${values.length}`);
    }
    if (input.monsterClaimLimit !== undefined) {
      values.push(input.monsterClaimLimit);
      updates.push(`monster_claim_limit = $${values.length}`);
    }
    if (input.itemClaimLimit !== undefined) {
      values.push(input.itemClaimLimit);
      updates.push(`item_claim_limit = $${values.length}`);
    }
    if (input.status !== undefined) {
      values.push(input.status);
      updates.push(`status = $${values.length}`);
    }
    if (input.notes !== undefined) {
      values.push(input.notes);
      updates.push(`notes = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Reroll session not found');
      }
      return existing;
    }

    values.push(id);
    await db.query(
      `UPDATE reroll_sessions SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Reroll session not found after update');
    }
    return updated;
  }

  override async delete(id: number): Promise<boolean> {
    // Claims are deleted via CASCADE
    const result = await db.query('DELETE FROM reroll_sessions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async updateResult(id: number, type: 'monster' | 'item', index: number, newData: unknown): Promise<RerollSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const field = type === 'monster' ? 'rolledMonsters' : 'rolledItems';
    const results = [...session[field]] as unknown[];

    if (index < 0 || index >= results.length) {
      throw new Error('Invalid result index');
    }

    results[index] = { ...(results[index] as object), ...(newData as object) };

    return this.update(id, { [field]: results });
  }

  async deleteResult(id: number, type: 'monster' | 'item', index: number): Promise<RerollSession> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    const field = type === 'monster' ? 'rolledMonsters' : 'rolledItems';
    const results = [...session[field]] as unknown[];

    if (index < 0 || index >= results.length) {
      throw new Error('Invalid result index');
    }

    results.splice(index, 1);

    return this.update(id, { [field]: results });
  }

  // Claim Methods
  async createClaim(input: RerollClaimCreateInput): Promise<RerollClaim> {
    const claimedDataJson = input.claimedData ? JSON.stringify(input.claimedData) : null;

    const result = await db.query<{ id: number }>(
      `
        INSERT INTO reroll_claims (
          session_id, user_id, trainer_id, claim_type, result_index,
          claimed_data, monster_name, item_quantity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        input.sessionId,
        input.userId,
        input.trainerId,
        input.claimType,
        input.resultIndex,
        claimedDataJson,
        input.monsterName ?? null,
        input.itemQuantity ?? 1,
      ]
    );

    const insertedClaimRow = result.rows[0];
    if (!insertedClaimRow) {
      throw new Error('Failed to insert reroll claim');
    }

    const claimResult = await db.query<RerollClaimRow>(
      'SELECT * FROM reroll_claims WHERE id = $1',
      [insertedClaimRow.id]
    );

    const claimRow = claimResult.rows[0];
    if (!claimRow) {
      throw new Error('Failed to retrieve reroll claim');
    }

    return normalizeRerollClaim(claimRow);
  }

  async getClaimsBySession(sessionId: number): Promise<RerollClaimWithDetails[]> {
    const result = await db.query<RerollClaimWithDetailsRow>(
      `
        SELECT rc.*,
               u.username AS user_username,
               u.display_name AS user_display_name,
               t.name AS trainer_name
        FROM reroll_claims rc
        LEFT JOIN users u ON rc.user_id = u.id
        LEFT JOIN trainers t ON rc.trainer_id = t.id
        WHERE rc.session_id = $1
        ORDER BY rc.claimed_at
      `,
      [sessionId]
    );
    return result.rows.map(normalizeRerollClaimWithDetails);
  }

  async getClaimsBySessionAndUser(sessionId: number, userId: number): Promise<RerollClaimWithDetails[]> {
    const result = await db.query<RerollClaimWithDetailsRow>(
      `
        SELECT rc.*,
               u.username AS user_username,
               u.display_name AS user_display_name,
               t.name AS trainer_name
        FROM reroll_claims rc
        LEFT JOIN users u ON rc.user_id = u.id
        LEFT JOIN trainers t ON rc.trainer_id = t.id
        WHERE rc.session_id = $1 AND rc.user_id = $2
        ORDER BY rc.claimed_at
      `,
      [sessionId, userId]
    );
    return result.rows.map(normalizeRerollClaimWithDetails);
  }

  async getClaimedIndices(sessionId: number, claimType: RerollClaimType): Promise<number[]> {
    const result = await db.query<{ result_index: number }>(
      'SELECT result_index FROM reroll_claims WHERE session_id = $1 AND claim_type = $2',
      [sessionId, claimType]
    );
    return result.rows.map(row => row.result_index);
  }

  async isIndexClaimed(sessionId: number, claimType: RerollClaimType, index: number): Promise<boolean> {
    const result = await db.query<{ id: number }>(
      'SELECT id FROM reroll_claims WHERE session_id = $1 AND claim_type = $2 AND result_index = $3',
      [sessionId, claimType, index]
    );
    return result.rows.length > 0;
  }

  async countClaimsByType(sessionId: number, claimType: RerollClaimType): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reroll_claims WHERE session_id = $1 AND claim_type = $2',
      [sessionId, claimType]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async getUserClaimCount(sessionId: number, userId: number, claimType: RerollClaimType): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM reroll_claims WHERE session_id = $1 AND user_id = $2 AND claim_type = $3',
      [sessionId, userId, claimType]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async canUserClaim(sessionId: number, userId: number, claimType: RerollClaimType, limit: number | null): Promise<boolean> {
    if (limit === null) {return true;}
    const currentCount = await this.getUserClaimCount(sessionId, userId, claimType);
    return currentCount < limit;
  }

  async getRemainingClaims(
    sessionId: number,
    userId: number,
    monsterLimit: number | null,
    itemLimit: number | null
  ): Promise<{
    monstersRemaining: number | 'unlimited';
    itemsRemaining: number | 'unlimited';
    monstersClaimed: number;
    itemsClaimed: number;
  }> {
    const monsterClaims = await this.getUserClaimCount(sessionId, userId, 'monster');
    const itemClaims = await this.getUserClaimCount(sessionId, userId, 'item');

    return {
      monstersRemaining: monsterLimit === null ? 'unlimited' : Math.max(0, monsterLimit - monsterClaims),
      itemsRemaining: itemLimit === null ? 'unlimited' : Math.max(0, itemLimit - itemClaims),
      monstersClaimed: monsterClaims,
      itemsClaimed: itemClaims,
    };
  }

  async isFullyClaimed(sessionId: number): Promise<boolean> {
    const session = await this.findById(sessionId);
    if (!session) {return false;}

    const monsterClaims = await this.getClaimedIndices(sessionId, 'monster');
    const itemClaims = await this.getClaimedIndices(sessionId, 'item');

    const monsterLimit = session.monsterClaimLimit ?? session.rolledMonsters.length;
    const itemLimit = session.itemClaimLimit ?? session.rolledItems.length;

    return monsterClaims.length >= monsterLimit && itemClaims.length >= itemLimit;
  }

  async deleteClaim(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM reroll_claims WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
