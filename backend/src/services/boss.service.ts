import { db } from '../database';
import { BossRepository } from '../repositories';
import type {
  Boss,
  BossRow,
  BossCreateInput,
  BossUpdateInput,
  LeaderboardEntry,
  BossRewardClaim,
  BossDamage,
} from '../repositories';

// ============================================================================
// Types
// ============================================================================

export type BossWithHealth = Boss & { healthPercentage: number };

export type LeaderboardWithRank = LeaderboardEntry & { rank: number };

export type BossWithLeaderboard = {
  boss: BossWithHealth;
  leaderboard: LeaderboardWithRank[];
};

export type BossWithStats = Boss & {
  totalDamageEntries: number;
  totalParticipants: number;
};

export type DefeatedBossDetails = Boss & {
  leaderboard: LeaderboardWithRank[];
  userDamage?: number;
};

export type UnclaimedReward = BossRewardClaim & {
  bossName: string;
  bossImage: string | null;
};

export type BossWithRewards = {
  boss: BossWithHealth | null;
  rewards: UnclaimedReward[];
};

export type DamageResult = {
  success: boolean;
  damage: BossDamage;
  boss: Boss;
};

export type ClaimResult = {
  success: boolean;
  claim: BossRewardClaim | null;
  message: string;
};

// ============================================================================
// Service
// ============================================================================

export class BossService {
  private bossRepo: BossRepository;

  constructor(bossRepo?: BossRepository) {
    this.bossRepo = bossRepo ?? new BossRepository();
  }

  // ==========================================================================
  // Public Boss Queries
  // ==========================================================================

  async getCurrentBoss(): Promise<BossWithHealth | null> {
    const boss = await this.bossRepo.findActiveBoss();
    if (!boss) {
      return null;
    }
    return this.addHealthPercentage(boss);
  }

  async getBossById(id: number): Promise<BossWithHealth | null> {
    const boss = await this.bossRepo.findById(id);
    if (!boss) {
      return null;
    }
    return this.addHealthPercentage(boss);
  }

  async getLeaderboard(bossId: number, limit = 10): Promise<LeaderboardWithRank[]> {
    const leaderboard = await this.bossRepo.getLeaderboard(bossId, limit);
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  async getCurrentBossWithLeaderboard(limit = 10): Promise<BossWithLeaderboard | null> {
    const boss = await this.bossRepo.findActiveBoss();
    if (!boss) {
      return null;
    }

    const leaderboard = await this.bossRepo.getLeaderboard(boss.id, limit);
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return {
      boss: await this.addHealthPercentage(boss),
      leaderboard: rankedLeaderboard,
    };
  }

  async getDefeatedBosses(limit = 10): Promise<Boss[]> {
    return this.bossRepo.findDefeatedBosses(limit);
  }

  async getDefeatedBossById(id: number, userId?: number): Promise<DefeatedBossDetails | null> {
    const boss = await this.bossRepo.findById(id);
    if (!boss) {
      return null;
    }

    const leaderboard = await this.bossRepo.getLeaderboard(id, 50);
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    const result: DefeatedBossDetails = {
      ...boss,
      leaderboard: rankedLeaderboard,
    };

    if (userId) {
      result.userDamage = await this.bossRepo.getUserDamage(userId, id);
    }

    return result;
  }

  // ==========================================================================
  // Admin CRUD
  // ==========================================================================

  async createBoss(input: BossCreateInput): Promise<Boss> {
    return this.bossRepo.create(input);
  }

  async updateBoss(id: number, input: BossUpdateInput): Promise<Boss> {
    return this.bossRepo.update(id, input);
  }

  async deleteBoss(id: number): Promise<boolean> {
    return this.bossRepo.delete(id);
  }

  async getAllBossesWithStats(): Promise<BossWithStats[]> {
    const result = await db.query<BossRow & { total_damage_entries: string; total_participants: string }>(
      `
        SELECT
          b.*,
          COALESCE(stats.total_damage_entries, 0) as total_damage_entries,
          COALESCE(stats.total_participants, 0) as total_participants
        FROM bosses b
        LEFT JOIN (
          SELECT
            boss_id,
            COUNT(id) as total_damage_entries,
            COUNT(DISTINCT user_id) as total_participants
          FROM boss_damage
          GROUP BY boss_id
        ) stats ON b.id = stats.boss_id
        ORDER BY b.year DESC NULLS LAST, b.month DESC NULLS LAST, b.created_at DESC
      `
    );

    return result.rows.map((row) => {
      const boss = this.normalizeBossRow(row);
      return {
        ...boss,
        totalDamageEntries: parseInt(row.total_damage_entries, 10),
        totalParticipants: parseInt(row.total_participants, 10),
      };
    });
  }

  // ==========================================================================
  // Damage & Rewards
  // ==========================================================================

  async addDamage(
    bossId: number,
    userId: number,
    damageAmount: number,
    submissionId?: number,
  ): Promise<DamageResult> {
    const boss = await this.bossRepo.findById(bossId);
    if (!boss) {
      throw new Error('Boss not found');
    }

    const damage = await this.bossRepo.addDamage(bossId, userId, damageAmount, submissionId ?? null);

    // Update boss HP
    const newHp = Math.max(0, boss.currentHp - damageAmount);
    const updatedBoss = await this.bossRepo.update(bossId, {
      currentHp: newHp,
      status: newHp <= 0 ? 'defeated' : boss.status,
    });

    return { success: true, damage, boss: updatedBoss };
  }

  async getCurrentBossWithRewards(userId: number): Promise<BossWithRewards> {
    const boss = await this.bossRepo.findActiveBoss();
    const rewards = await this.bossRepo.getUnclaimedRewards(userId);

    return {
      boss: boss ? await this.addHealthPercentage(boss) : null,
      rewards,
    };
  }

  async getUnclaimedRewards(userId: number): Promise<UnclaimedReward[]> {
    return this.bossRepo.getUnclaimedRewards(userId);
  }

  async claimReward(
    bossId: number,
    userId: number,
    monsterName: string,
    trainerId: number,
  ): Promise<ClaimResult> {
    const claim = await this.bossRepo.claimReward(bossId, userId, monsterName, trainerId);
    if (!claim) {
      return {
        success: false,
        claim: null,
        message: 'No unclaimed reward found for this boss',
      };
    }

    return {
      success: true,
      claim,
      message: 'Reward claimed successfully',
    };
  }

  async deleteUserDamage(bossId: number, userId: number): Promise<{ success: boolean; deletedCount: number }> {
    const deletedCount = await this.bossRepo.deleteUserDamage(bossId, userId);
    return { success: true, deletedCount };
  }

  async setUserDamage(bossId: number, userId: number, newTotal: number): Promise<{ success: boolean }> {
    await this.bossRepo.setUserDamage(bossId, userId, newTotal);
    return { success: true };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private async addHealthPercentage(boss: Boss): Promise<BossWithHealth> {
    // Always compute HP from actual damage logs so it reflects all dealt damage
    const totalDamage = await this.bossRepo.getTotalDamage(boss.id);
    const currentHp = Math.max(0, boss.totalHp - totalDamage);

    // Sync the stored value if it drifted
    if (currentHp !== boss.currentHp) {
      await this.bossRepo.update(boss.id, {
        currentHp,
        status: currentHp <= 0 ? 'defeated' : boss.status,
      });
    }

    return {
      ...boss,
      currentHp,
      healthPercentage: boss.totalHp > 0
        ? Math.floor((currentHp / boss.totalHp) * 100)
        : 0,
    };
  }

  private normalizeBossRow(row: BossRow): Boss {
    const parseJson = (val: string | null): Record<string, unknown> | null => {
      if (!val) {return null;}
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return null;
      }
    };

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      totalHp: row.total_hp,
      currentHp: row.current_hp,
      month: row.month,
      year: row.year,
      status: row.status,
      rewardMonsterData: parseJson(row.reward_monster_data),
      gruntMonsterData: parseJson(row.grunt_monster_data),
      startDate: row.start_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
