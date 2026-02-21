import { BaseRepository } from './base.repository';
import { db } from '../database';

// Boss types
export type BossRow = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  total_hp: number;
  current_hp: number;
  month: number | null;
  year: number | null;
  status: string;
  reward_monster_data: string | null;
  grunt_monster_data: string | null;
  start_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type Boss = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalHp: number;
  currentHp: number;
  month: number | null;
  year: number | null;
  status: string;
  rewardMonsterData: Record<string, unknown> | null;
  gruntMonsterData: Record<string, unknown> | null;
  startDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BossCreateInput = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  totalHp: number;
  month?: number | null;
  year?: number | null;
  rewardMonsterData?: Record<string, unknown> | null;
  gruntMonsterData?: Record<string, unknown> | null;
};

export type BossUpdateInput = Partial<BossCreateInput> & {
  currentHp?: number;
  status?: string;
};

// Boss Damage types
export type BossDamageRow = {
  id: number;
  boss_id: number;
  user_id: number;
  damage_amount: number;
  submission_id: number | null;
  created_at: Date;
};

export type BossDamage = {
  id: number;
  bossId: number;
  userId: number;
  damageAmount: number;
  submissionId: number | null;
  createdAt: Date;
};

export type BossDamageWithUser = BossDamage & {
  username: string | null;
  discordId: string | null;
};

// Boss Reward Claim types
export type BossRewardClaimRow = {
  id: number;
  boss_id: number;
  user_id: number;
  reward_type: string;
  damage_dealt: number;
  rank_position: number;
  is_claimed: boolean;
  claimed_at: Date | null;
  monster_name: string | null;
  assigned_trainer_id: number | null;
  created_at: Date;
};

export type BossRewardClaim = {
  id: number;
  bossId: number;
  userId: number;
  rewardType: string;
  damageDealt: number;
  rankPosition: number;
  isClaimed: boolean;
  claimedAt: Date | null;
  monsterName: string | null;
  assignedTrainerId: number | null;
  createdAt: Date;
};

export type LeaderboardEntry = {
  userId: number;
  damageUserId: number;
  username: string | null;
  discordId: string | null;
  totalDamage: number;
  submissionCount: number;
};

const parseJsonField = (value: string | null): Record<string, unknown> | null => {
  if (!value) {return null;}
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
};

const normalizeBoss = (row: BossRow): Boss => ({
  id: row.id,
  name: row.name,
  description: row.description,
  imageUrl: row.image_url,
  totalHp: row.total_hp,
  currentHp: row.current_hp,
  month: row.month,
  year: row.year,
  status: row.status,
  rewardMonsterData: parseJsonField(row.reward_monster_data),
  gruntMonsterData: parseJsonField(row.grunt_monster_data),
  startDate: row.start_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeBossDamage = (row: BossDamageRow): BossDamage => ({
  id: row.id,
  bossId: row.boss_id,
  userId: row.user_id,
  damageAmount: row.damage_amount,
  submissionId: row.submission_id,
  createdAt: row.created_at,
});

const normalizeBossRewardClaim = (row: BossRewardClaimRow): BossRewardClaim => ({
  id: row.id,
  bossId: row.boss_id,
  userId: row.user_id,
  rewardType: row.reward_type,
  damageDealt: row.damage_dealt,
  rankPosition: row.rank_position,
  isClaimed: row.is_claimed,
  claimedAt: row.claimed_at,
  monsterName: row.monster_name,
  assignedTrainerId: row.assigned_trainer_id,
  createdAt: row.created_at,
});

export class BossRepository extends BaseRepository<Boss, BossCreateInput, BossUpdateInput> {
  constructor() {
    super('bosses');
  }

  override async findById(id: number): Promise<Boss | null> {
    const result = await db.query<BossRow>('SELECT * FROM bosses WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? normalizeBoss(row) : null;
  }

  async findActiveBoss(): Promise<Boss | null> {
    const result = await db.query<BossRow>(
      `SELECT * FROM bosses WHERE status = 'active' ORDER BY start_date DESC LIMIT 1`
    );
    const row = result.rows[0];
    return row ? normalizeBoss(row) : null;
  }

  async findDefeatedBosses(limit = 10): Promise<Boss[]> {
    const result = await db.query<BossRow>(
      `SELECT * FROM bosses WHERE status = 'defeated' ORDER BY start_date DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map(normalizeBoss);
  }

  override async create(input: BossCreateInput): Promise<Boss> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO bosses (
          name, description, image_url, total_hp, current_hp, month, year,
          status, reward_monster_data, grunt_monster_data, start_date
        ) VALUES ($1, $2, $3, $4, $4, $5, $6, 'active', $7, $8, CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [
        input.name,
        input.description ?? null,
        input.imageUrl ?? null,
        input.totalHp,
        input.month ?? null,
        input.year ?? null,
        input.rewardMonsterData ? JSON.stringify(input.rewardMonsterData) : null,
        input.gruntMonsterData ? JSON.stringify(input.gruntMonsterData) : null,
      ]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert boss');
    }
    const boss = await this.findById(insertedRow.id);
    if (!boss) {
      throw new Error('Failed to create boss');
    }
    return boss;
  }

  override async update(id: number, input: BossUpdateInput): Promise<Boss> {
    const updates: string[] = [];
    const values: unknown[] = [];

    const fieldMappings: Record<string, string> = {
      name: 'name',
      description: 'description',
      imageUrl: 'image_url',
      totalHp: 'total_hp',
      currentHp: 'current_hp',
      month: 'month',
      year: 'year',
      status: 'status',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${column} = $${values.length}`);
      }
    }

    if (input.rewardMonsterData !== undefined) {
      values.push(input.rewardMonsterData ? JSON.stringify(input.rewardMonsterData) : null);
      updates.push(`reward_monster_data = $${values.length}`);
    }

    if (input.gruntMonsterData !== undefined) {
      values.push(input.gruntMonsterData ? JSON.stringify(input.gruntMonsterData) : null);
      updates.push(`grunt_monster_data = $${values.length}`);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Boss not found');
      }
      return existing;
    }

    values.push(id);

    await db.query(
      `UPDATE bosses SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Boss not found after update');
    }
    return updated;
  }

  // Boss Damage methods
  async addDamage(bossId: number, userId: number, damageAmount: number, submissionId: number | null = null): Promise<BossDamage> {
    const result = await db.query<{ id: number }>(
      `INSERT INTO boss_damage (boss_id, user_id, damage_amount, submission_id) VALUES ($1, $2, $3, $4) RETURNING id`,
      [bossId, userId, damageAmount, submissionId]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert boss damage');
    }

    const damageResult = await db.query<BossDamageRow>(
      'SELECT * FROM boss_damage WHERE id = $1',
      [insertedRow.id]
    );

    const damageRow = damageResult.rows[0];
    if (!damageRow) {
      throw new Error('Failed to retrieve boss damage');
    }

    return normalizeBossDamage(damageRow);
  }

  async getDamageByBossId(bossId: number): Promise<BossDamageWithUser[]> {
    const result = await db.query<BossDamageRow & { username: string | null; discord_id: string | null }>(
      `
        SELECT bd.*, u.username, u.discord_id
        FROM boss_damage bd
        LEFT JOIN users u ON (bd.user_id = u.id OR bd.user_id::text = u.discord_id)
        WHERE bd.boss_id = $1
        ORDER BY bd.damage_amount DESC
      `,
      [bossId]
    );

    return result.rows.map((row) => ({
      ...normalizeBossDamage(row),
      username: row.username,
      discordId: row.discord_id,
    }));
  }

  async deleteUserDamage(bossId: number, userId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `WITH deleted AS (
        DELETE FROM boss_damage WHERE boss_id = $1 AND user_id = $2 RETURNING id
      ) SELECT COUNT(*)::text as count FROM deleted`,
      [bossId, userId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async setUserDamage(bossId: number, userId: number, newTotal: number): Promise<void> {
    // Delete all existing entries for this user on this boss, then insert one with the correct total
    await db.query('DELETE FROM boss_damage WHERE boss_id = $1 AND user_id = $2', [bossId, userId]);
    if (newTotal > 0) {
      await db.query(
        'INSERT INTO boss_damage (boss_id, user_id, damage_amount) VALUES ($1, $2, $3)',
        [bossId, userId, newTotal]
      );
    }
  }

  async getTotalDamage(bossId: number): Promise<number> {
    const result = await db.query<{ total_damage: string | null }>(
      `SELECT SUM(damage_amount) as total_damage FROM boss_damage WHERE boss_id = $1`,
      [bossId]
    );
    return parseInt(result.rows[0]?.total_damage ?? '0', 10);
  }

  async getUserDamage(userId: number, bossId: number): Promise<number> {
    const result = await db.query<{ total_damage: string | null }>(
      `SELECT SUM(damage_amount) as total_damage FROM boss_damage WHERE user_id = $1 AND boss_id = $2`,
      [userId, bossId]
    );
    return parseInt(result.rows[0]?.total_damage ?? '0', 10);
  }

  async getLeaderboard(bossId: number, limit = 10): Promise<LeaderboardEntry[]> {
    const result = await db.query<{
      user_id: number;
      damage_user_id: number;
      username: string | null;
      discord_id: string | null;
      total_damage: string;
      submission_count: string;
    }>(
      `
        SELECT
          COALESCE(u.id, bd.user_id) as user_id,
          bd.user_id as damage_user_id,
          u.username,
          u.discord_id,
          SUM(bd.damage_amount) as total_damage,
          COUNT(bd.id) as submission_count
        FROM boss_damage bd
        LEFT JOIN users u ON (bd.user_id = u.id OR bd.user_id::text = u.discord_id)
        WHERE bd.boss_id = $1
        GROUP BY COALESCE(u.id, bd.user_id), bd.user_id, u.username, u.discord_id
        ORDER BY total_damage DESC
        LIMIT $2
      `,
      [bossId, limit]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      damageUserId: row.damage_user_id,
      username: row.username,
      discordId: row.discord_id,
      totalDamage: parseInt(row.total_damage, 10),
      submissionCount: parseInt(row.submission_count, 10),
    }));
  }

  // Boss Reward Claim methods
  async createRewardClaim(
    bossId: number,
    userId: number,
    rewardType: string,
    damageDealt: number,
    rankPosition: number
  ): Promise<BossRewardClaim> {
    const result = await db.query<{ id: number }>(
      `
        INSERT INTO boss_reward_claims (boss_id, user_id, reward_type, damage_dealt, rank_position)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [bossId, userId, rewardType, damageDealt, rankPosition]
    );

    const insertedRow = result.rows[0];
    if (!insertedRow) {
      throw new Error('Failed to insert boss reward claim');
    }

    const claimResult = await db.query<BossRewardClaimRow>(
      'SELECT * FROM boss_reward_claims WHERE id = $1',
      [insertedRow.id]
    );

    const claimRow = claimResult.rows[0];
    if (!claimRow) {
      throw new Error('Failed to retrieve boss reward claim');
    }

    return normalizeBossRewardClaim(claimRow);
  }

  async getUnclaimedRewards(userId: number): Promise<(BossRewardClaim & { bossName: string; bossImage: string | null })[]> {
    const result = await db.query<BossRewardClaimRow & { boss_name: string; boss_image: string | null }>(
      `
        SELECT brc.*, b.name as boss_name, b.image_url as boss_image
        FROM boss_reward_claims brc
        JOIN bosses b ON brc.boss_id = b.id
        WHERE brc.user_id = $1 AND brc.is_claimed::boolean = false
        ORDER BY b.start_date DESC
      `,
      [userId]
    );

    return result.rows.map((row) => ({
      ...normalizeBossRewardClaim(row),
      bossName: row.boss_name,
      bossImage: row.boss_image,
    }));
  }

  async claimReward(
    bossId: number,
    userId: number,
    monsterName: string,
    trainerId: number
  ): Promise<BossRewardClaim | null> {
    const result = await db.query<BossRewardClaimRow>(
      `
        SELECT * FROM boss_reward_claims
        WHERE boss_id = $1 AND user_id = $2 AND is_claimed::boolean = false
      `,
      [bossId, userId]
    );

    const claim = result.rows[0];
    if (!claim) {
      return null;
    }

    await db.query(
      `
        UPDATE boss_reward_claims
        SET is_claimed = 1, claimed_at = CURRENT_TIMESTAMP, monster_name = $1, assigned_trainer_id = $2
        WHERE boss_id = $3 AND user_id = $4
      `,
      [monsterName, trainerId, bossId, userId]
    );

    const updatedResult = await db.query<BossRewardClaimRow>(
      'SELECT * FROM boss_reward_claims WHERE id = $1',
      [claim.id]
    );

    const updatedRow = updatedResult.rows[0];
    if (!updatedRow) {
      throw new Error('Failed to retrieve updated boss reward claim');
    }

    return normalizeBossRewardClaim(updatedRow);
  }

  async getRewardClaimsByBossId(bossId: number): Promise<BossRewardClaim[]> {
    const result = await db.query<BossRewardClaimRow>(
      `SELECT * FROM boss_reward_claims WHERE boss_id = $1 ORDER BY rank_position ASC`,
      [bossId]
    );
    return result.rows.map(normalizeBossRewardClaim);
  }

  async getTotalParticipants(bossId: number): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count FROM boss_damage WHERE boss_id = $1`,
      [bossId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
