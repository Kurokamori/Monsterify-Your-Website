// Boss Page Types

/** Monster data attached to a boss reward */
export interface BossMonsterData {
  name: string;
  species?: string[];
  types?: string[];
  attribute?: string;
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
}

/** Full defeated boss detail from API */
export interface DefeatedBossDetailData {
  boss: DefeatedBossSummary & {
    description?: string;
    rewardMonsterData?: string;
    gruntMonsterData?: string;
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
      monsterData = JSON.parse(reward.gruntMonsterData) as BossMonsterData;
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
