import api from './api';

// =============================================================================
// Types
// =============================================================================

export interface MonsterOverview {
  totalMonsters: number;
  uniqueSpecies: number;
  averageLevel: number;
  highestLevel: number;
  typeDistribution: Record<string, number>;
}

export interface MonsterSummary {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  battlesWon: number;
  battlesTotal: number;
}

export interface MonsterListItem {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  types: string[];
  battlesWon: number;
  battlesTotal: number;
  winRate: number;
}

export interface MonsterStatsResponse {
  overview: MonsterOverview;
  topMonsters: MonsterSummary[];
  monsters: MonsterListItem[];
}

export interface TrainerLeaderboardEntry {
  id: number;
  name: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  level: number;
  playerDisplayName: string;
  monsterCount: number;
  monsterRefPercent: number;
  monsterRefCount: number;
  currencyAmount: number;
  totalEarnedCurrency: number;
  totalMonsterLevels: number;
  level100Count: number;
}

export interface SpecialistEntry {
  trainerName: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  playerDisplayName: string;
  count: number;
}

export interface SpeciesSpecialistEntry {
  trainerName: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  playerDisplayName: string;
  species: string;
  count: number;
  sampleMonsters: Array<{ id: number; name: string; imgLink: string | null }>;
}

export interface LeaderboardStatsResponse {
  topTrainersByLevel: TrainerLeaderboardEntry[];
  topTrainersByMonsterCount: TrainerLeaderboardEntry[];
  topTrainersByRefPercent: TrainerLeaderboardEntry[];
  bottomTrainersByRefPercent: TrainerLeaderboardEntry[];
  topTrainersByCurrency: TrainerLeaderboardEntry[];
  topTrainersByTotalCurrency: TrainerLeaderboardEntry[];
  topTrainersByTotalLevel: TrainerLeaderboardEntry[];
  topTrainersByLevel100Count: TrainerLeaderboardEntry[];
  bottomTrainersByLevel: TrainerLeaderboardEntry[];
  bottomTrainersByMonsterCount: TrainerLeaderboardEntry[];
  bottomTrainersByCurrency: TrainerLeaderboardEntry[];
  bottomTrainersByTotalCurrency: TrainerLeaderboardEntry[];
  typeSpecialists: Record<string, SpecialistEntry>;
  attributeSpecialists: Record<string, SpecialistEntry>;
  speciesSpecialists: SpeciesSpecialistEntry[];
}

export interface GlobalStats {
  totalTrainers: number;
  totalMonsters: number;
  totalPlayers: number;
  averageMonstersPerTrainer: number;
  averageReferencePercentage: number;
}

export interface TrainerComparisonResponse {
  globalStats: GlobalStats;
}

export interface AchievementOverview {
  totalAchievementsAvailable: number;
  totalAchievementsClaimed: number;
  trainersWithAchievements: number;
  totalTrainers: number;
  averageAchievementsPerTrainer: number;
}

export interface AchievementTrainerEntry {
  trainerId: number;
  count: number;
  trainerName: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  playerDisplayName: string;
  achievements: string[];
}

export interface AchievementCategoryEntry {
  trainerId: number;
  count: number;
  trainerName: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  playerDisplayName: string;
}

export interface SubtypeTrainerEntry {
  trainerId: number;
  count: number;
  trainerName: string;
  title: string | null;
  faction: string | null;
  mainRef: string | null;
  playerDisplayName: string;
}

export interface AchievementStatsResponse {
  overview: AchievementOverview;
  mostAchievements: AchievementTrainerEntry[];
  leastAchievements: AchievementTrainerEntry[];
  topByCategory: Record<string, AchievementCategoryEntry[]>;
  topBySubtype: {
    types: Record<string, SubtypeTrainerEntry[]>;
    attributes: Record<string, SubtypeTrainerEntry[]>;
  };
  categoryBreakdown: {
    type: number;
    attribute: number;
    level100: number;
    trainerLevel: number;
    special: number;
  };
}

export interface PlayerLeaderboardEntry {
  playerName: string;
  playerUserId: string;
  trainerCount: number;
  totalMonsters: number;
  totalRefs: number;
  refPercent: number;
  totalCurrency: number;
  totalEarnedCurrency: number;
}

export interface PlayerSpecialistEntry {
  playerName: string;
  count: number;
}

export interface PlayerSpeciesSpecialistEntry {
  playerName: string;
  species: string;
  count: number;
}

export interface PlayerLeaderboardResponse {
  mostMonsters: PlayerLeaderboardEntry[];
  leastMonsters: PlayerLeaderboardEntry[];
  mostRefs: PlayerLeaderboardEntry[];
  leastRefs: PlayerLeaderboardEntry[];
  mostRefPercent: PlayerLeaderboardEntry[];
  leastRefPercent: PlayerLeaderboardEntry[];
  mostCurrency: PlayerLeaderboardEntry[];
  leastCurrency: PlayerLeaderboardEntry[];
  typeSpecialists: Record<string, PlayerSpecialistEntry>;
  attributeSpecialists: Record<string, PlayerSpecialistEntry>;
  speciesSpecialists: PlayerSpeciesSpecialistEntry[];
}

// =============================================================================
// Service
// =============================================================================

const statisticsService = {
  async getMonsterStats(type = 'all', sort = 'level', order = 'desc'): Promise<MonsterStatsResponse> {
    const response = await api.get(`/statistics/monster?type=${type}&sort=${sort}&order=${order}`);
    return response.data.data;
  },

  async getLeaderboardStats(): Promise<LeaderboardStatsResponse> {
    const response = await api.get('/statistics/leaderboards');
    return response.data.data;
  },

  async getTrainerComparison(): Promise<TrainerComparisonResponse> {
    const response = await api.get('/statistics/trainer-comparison');
    return response.data.data;
  },

  async getAchievementStats(): Promise<AchievementStatsResponse> {
    const response = await api.get('/statistics/achievement-stats');
    return response.data.data;
  },

  async getPlayerLeaderboardStats(): Promise<PlayerLeaderboardResponse> {
    const response = await api.get('/statistics/player-leaderboards');
    return response.data.data;
  },
};

export default statisticsService;
