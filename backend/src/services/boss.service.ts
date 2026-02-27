import { db } from '../database';
import { BossRepository, MonsterRepository, TrainerRepository } from '../repositories';
import type {
  Boss,
  BossRow,
  BossCreateInput,
  BossUpdateInput,
  LeaderboardEntry,
  BossRewardClaim,
  BossDamage,
  MonsterCreateInput,
} from '../repositories';
import { MonsterInitializerService } from './monster-initializer.service';
import type { InitializedMonster } from './monster-initializer.service';

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

export type LeaderboardWithRewardClaim = LeaderboardWithRank & {
  rewardClaim?: { isClaimed: boolean };
};

export type DefeatedBossDetails = {
  boss: Boss;
  leaderboard: LeaderboardWithRewardClaim[];
  userReward?: {
    isClaimed: boolean;
    rewardType: string;
    damageDealt: number;
    rankPosition: number;
    monsterName?: string | null;
  };
  totalParticipants: number;
};

export type UnclaimedReward = BossRewardClaim & {
  bossName: string;
  bossImage: string | null;
  rewardMonsterData: string | null;
  gruntMonsterData: string | null;
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
  private monsterRepo: MonsterRepository;
  private trainerRepo: TrainerRepository;
  private monsterInitializer: MonsterInitializerService;

  constructor(bossRepo?: BossRepository) {
    this.bossRepo = bossRepo ?? new BossRepository();
    this.monsterRepo = new MonsterRepository();
    this.trainerRepo = new TrainerRepository();
    this.monsterInitializer = new MonsterInitializerService();
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

  async getDefeatedBosses(limit = 10): Promise<(Boss & {
    totalParticipants: number;
    topUsers: { userId: number; username: string | null; totalDamage: number }[];
  })[]> {
    const bosses = await this.bossRepo.findDefeatedBosses(limit);

    return Promise.all(bosses.map(async (boss) => {
      const [totalParticipants, leaderboard] = await Promise.all([
        this.bossRepo.getTotalParticipants(boss.id),
        this.bossRepo.getLeaderboard(boss.id, 3),
      ]);

      return {
        ...boss,
        totalParticipants,
        topUsers: leaderboard.map((entry) => ({
          userId: entry.userId,
          username: entry.username,
          totalDamage: entry.totalDamage,
        })),
      };
    }));
  }

  async getDefeatedBossById(id: number, userId?: number): Promise<DefeatedBossDetails | null> {
    const boss = await this.bossRepo.findById(id);
    if (!boss) {
      return null;
    }

    const [leaderboard, totalParticipants, rewardClaims] = await Promise.all([
      this.bossRepo.getLeaderboard(id, 50),
      this.bossRepo.getTotalParticipants(id),
      this.bossRepo.getRewardClaimsByBossId(id),
    ]);

    // Build a map of userId -> reward claim for quick lookup
    const claimMap = new Map(rewardClaims.map((c) => [c.userId, c]));

    const rankedLeaderboard: LeaderboardWithRewardClaim[] = leaderboard.map((entry, index) => {
      const claim = claimMap.get(entry.userId) ?? claimMap.get(entry.damageUserId);
      return {
        ...entry,
        rank: index + 1,
        rewardClaim: claim ? { isClaimed: claim.isClaimed } : undefined,
      };
    });

    const result: DefeatedBossDetails = {
      boss,
      leaderboard: rankedLeaderboard,
      totalParticipants,
    };

    if (userId) {
      const userClaim = claimMap.get(userId);
      if (userClaim) {
        result.userReward = {
          isClaimed: userClaim.isClaimed,
          rewardType: userClaim.rewardType,
          damageDealt: userClaim.damageDealt,
          rankPosition: userClaim.rankPosition,
          monsterName: userClaim.monsterName,
        };
      }
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
    const wasAlive = boss.status === 'active';
    const isNowDefeated = newHp <= 0;

    const updatedBoss = await this.bossRepo.update(bossId, {
      currentHp: newHp,
      status: isNowDefeated ? 'defeated' : boss.status,
    });

    // Auto-generate reward claims when boss transitions to defeated
    if (wasAlive && isNowDefeated) {
      await this.generateRewardClaims(bossId);
    }

    return { success: true, damage, boss: updatedBoss };
  }

  /**
   * Manually generate reward claims for a defeated boss (admin action).
   * Useful for bosses that were defeated before auto-generation was added.
   */
  async adminGenerateRewardClaims(bossId: number): Promise<{ created: number }> {
    const boss = await this.bossRepo.findById(bossId);
    if (!boss) {
      throw new Error('Boss not found');
    }
    if (boss.status !== 'defeated') {
      throw new Error('Boss is not defeated yet');
    }

    const existingClaims = await this.bossRepo.getRewardClaimsByBossId(bossId);
    if (existingClaims.length > 0) {
      return { created: 0 };
    }

    const leaderboard = await this.bossRepo.getLeaderboard(bossId, 500);
    for (const [i, entry] of leaderboard.entries()) {
      const rank = i + 1;
      const rewardType = rank === 1 ? 'boss_monster' : 'grunt_monster';
      await this.bossRepo.createRewardClaim(bossId, entry.userId, rewardType, entry.totalDamage, rank);
    }

    return { created: leaderboard.length };
  }

  /**
   * Generate reward claims for all participants when a boss is defeated.
   * Rank 1 gets 'boss_monster', everyone else gets 'grunt_monster'.
   */
  private async generateRewardClaims(bossId: number): Promise<void> {
    try {
      // Check if claims already exist to avoid duplicates
      const existingClaims = await this.bossRepo.getRewardClaimsByBossId(bossId);
      if (existingClaims.length > 0) {
        return;
      }

      const leaderboard = await this.bossRepo.getLeaderboard(bossId, 500);
      for (const [i, entry] of leaderboard.entries()) {
        const rank = i + 1;
        const rewardType = rank === 1 ? 'boss_monster' : 'grunt_monster';
        await this.bossRepo.createRewardClaim(bossId, entry.userId, rewardType, entry.totalDamage, rank);
      }
    } catch (error) {
      console.error('Error generating reward claims for boss', bossId, error);
    }
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
    // 1. Mark the claim as claimed in the DB
    const claim = await this.bossRepo.claimReward(bossId, userId, monsterName, trainerId);
    if (!claim) {
      return {
        success: false,
        claim: null,
        message: 'No unclaimed reward found for this boss',
      };
    }

    // 2. Get the boss to read the monster template data
    const boss = await this.bossRepo.findById(bossId);
    if (!boss) {
      return { success: true, claim, message: 'Reward claimed but boss data not found — monster not created' };
    }

    // 3. Determine which monster template to use
    const template = claim.rewardType === 'boss_monster'
      ? boss.rewardMonsterData
      : boss.gruntMonsterData;

    if (!template) {
      return { success: true, claim, message: 'Reward claimed but no monster template configured' };
    }

    // 4. Get the trainer so we have their player_user_id
    const trainer = await this.trainerRepo.findById(trainerId);
    if (!trainer) {
      return { success: true, claim, message: 'Reward claimed but trainer not found — monster not created' };
    }

    // 5. Build monster data from the template and initialize it
    try {
      const monsterData: Record<string, unknown> = {
        species1: template.species ? (template.species as string[])[0] : (template.name as string) ?? 'Unknown',
        species2: template.species ? (template.species as string[])[1] ?? null : null,
        species3: template.species ? (template.species as string[])[2] ?? null : null,
        type1: template.types ? (template.types as string[])[0] ?? 'Normal' : 'Normal',
        type2: template.types ? (template.types as string[])[1] ?? null : null,
        type3: template.types ? (template.types as string[])[2] ?? null : null,
        type4: template.types ? (template.types as string[])[3] ?? null : null,
        type5: template.types ? (template.types as string[])[4] ?? null : null,
        attribute: (template.attribute as string) ?? null,
        name: monsterName,
        level: 1,
        trainer_id: trainerId,
        player_user_id: trainer.player_user_id,
        where_met: 'Boss Battle Reward',
      };

      const initialized: InitializedMonster = await this.monsterInitializer.initializeMonster(monsterData);

      await this.monsterRepo.create(this.toMonsterCreateInput(initialized, trainerId, trainer.player_user_id));
    } catch (error) {
      console.error('Error creating boss reward monster:', error);
      return { success: true, claim, message: 'Reward claimed but failed to create monster' };
    }

    return {
      success: true,
      claim,
      message: 'Reward claimed and monster created successfully',
    };
  }

  private toMonsterCreateInput(
    monster: InitializedMonster,
    trainerId: number,
    playerUserId: string,
  ): MonsterCreateInput {
    return {
      trainerId,
      playerUserId,
      name: (monster.name as string) ?? (monster.species1 as string) ?? 'Unknown',
      species1: (monster.species1 as string) ?? 'Unknown',
      species2: monster.species2 as string | null,
      species3: monster.species3 as string | null,
      type1: (monster.type1 as string) ?? 'Normal',
      type2: monster.type2 as string | null,
      type3: monster.type3 as string | null,
      type4: monster.type4 as string | null,
      type5: monster.type5 as string | null,
      attribute: monster.attribute as string | null,
      level: monster.level ?? 1,
      hpTotal: monster.hp_total,
      hpIv: monster.hp_iv,
      hpEv: monster.hp_ev,
      atkTotal: monster.atk_total,
      atkIv: monster.atk_iv,
      atkEv: monster.atk_ev,
      defTotal: monster.def_total,
      defIv: monster.def_iv,
      defEv: monster.def_ev,
      spaTotal: monster.spa_total,
      spaIv: monster.spa_iv,
      spaEv: monster.spa_ev,
      spdTotal: monster.spd_total,
      spdIv: monster.spd_iv,
      spdEv: monster.spd_ev,
      speTotal: monster.spe_total,
      speIv: monster.spe_iv,
      speEv: monster.spe_ev,
      nature: monster.nature,
      characteristic: monster.characteristic,
      gender: monster.gender,
      friendship: monster.friendship,
      ability1: monster.ability1,
      ability2: monster.ability2,
      moveset: typeof monster.moveset === 'string' ? JSON.parse(monster.moveset) : (monster.moveset as string[]) ?? [],
      dateMet: monster.date_met ? new Date(monster.date_met as string) : new Date(),
      whereMet: (monster.where_met as string) ?? 'Boss Battle Reward',
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
