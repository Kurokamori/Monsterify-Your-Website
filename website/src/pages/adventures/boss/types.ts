// Boss Page Types

/** A single whole-monster option within a reward selection */
export interface BossMonsterOption {
  name?: string;
  species?: string[];
  types?: string[];
  attribute?: string;
}

/**
 * Monster data attached to a boss reward.
 *
 * A reward is either a single monster (name/species/types/attribute) or a
 * selection of whole-monster `options`. When `options` is present and
 * non-empty, the reward is a selection and `selectionMode` decides whether the
 * server rolls one at random or the player picks one at claim time.
 */
export interface BossMonsterData {
  name: string;
  species?: string[];
  types?: string[];
  attribute?: string;
  options?: BossMonsterOption[];
  selectionMode?: 'random' | 'player';
}

/** Raw unclaimed reward from the API */
export interface UnclaimedBossReward {
  bossId: number;
  bossName: string;
  bossImage?: string | null;
  rewardType: 'boss_monster' | 'grunt_monster';
  damageDealt: number;
  rankPosition: number;
  rewardMonsterData?: string;
  gruntMonsterData?: string;
  gruntIndex?: number | null;
}

/** Parsed reward data for the claim modal */
export interface RewardClaimData {
  bossId: number;
  bossName: string;
  bossImage?: string | null;
  rewardType: 'boss_monster' | 'grunt_monster';
  damageDealt: number;
  rankPosition: number;
  monsterData: BossMonsterData | null;
}

/** Leaderboard entry with full detail */
export interface BossLeaderboardEntry {
  userId: number;
  trainerId?: number;
  trainerName?: string;
  trainerAvatar?: string;
  username?: string;
  totalDamage: number;
  submissionCount: number;
  rank: number;
  rewardClaim?: {
    isClaimed: boolean;
  };
}

/** A defeated boss in the list view */
export interface DefeatedBossSummary {
  id: number;
  name: string;
  month: number;
  year: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  totalParticipants?: number;
  topUsers?: Array<{
    userId: number;
    username?: string;
    totalDamage?: number;
  }>;
}

/** Current active boss */
export interface CurrentBoss {
  id: number;
  name: string;
  description?: string;
  status: string;
  month: number;
  year: number;
  startDate?: string;
  currentHp: number;
  totalHp: number;
  healthPercentage: number;
  imageUrl?: string;
}

/** API response shape for current boss with leaderboard */
export interface CurrentBossData {
  boss: CurrentBoss;
  leaderboard: BossLeaderboardEntry[];
}

/** User's reward status for a specific boss */
export interface UserRewardStatus {
  isClaimed: boolean;
  rewardType: 'boss_monster' | 'grunt_monster';
  damageDealt: number;
  rankPosition: number;
  monsterName?: string;
  gruntIndex?: number | null;
}

/** Full defeated boss detail from API */
export interface DefeatedBossDetailData {
  boss: DefeatedBossSummary & {
    description?: string;
    rewardMonsterData?: string | Record<string, unknown> | null;
    gruntMonsterData?: string | Record<string, unknown>[] | Record<string, unknown> | null;
  };
  leaderboard: BossLeaderboardEntry[];
  userReward?: UserRewardStatus;
  totalParticipants?: number;
}

/** Trainer option for reward claiming */
export interface TrainerOption {
  id: number | string;
  name: string;
}

/** Parse raw reward into RewardClaimData */
export function parseRewardData(reward: UnclaimedBossReward): RewardClaimData {
  let monsterData: BossMonsterData | null = null;
  try {
    if (reward.rewardType === 'boss_monster' && reward.rewardMonsterData) {
      monsterData = JSON.parse(reward.rewardMonsterData) as BossMonsterData;
    } else if (reward.rewardType === 'grunt_monster' && reward.gruntMonsterData) {
      const parsed = JSON.parse(reward.gruntMonsterData);
      if (Array.isArray(parsed)) {
        // Use the assigned grunt index, fallback to first
        const idx = reward.gruntIndex ?? 0;
        monsterData = (parsed[idx] ?? parsed[0]) as BossMonsterData;
      } else {
        // Legacy single-object format
        monsterData = parsed as BossMonsterData;
      }
    }
  } catch {
    // Invalid JSON, leave as null
  }

  return {
    bossId: reward.bossId,
    bossName: reward.bossName,
    bossImage: reward.bossImage,
    rewardType: reward.rewardType,
    damageDealt: reward.damageDealt,
    rankPosition: reward.rankPosition,
    monsterData,
  };
}
