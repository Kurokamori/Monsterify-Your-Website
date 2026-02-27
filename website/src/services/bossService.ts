import api from './api';

// --- Types ---

export interface Boss {
  id: number;
  name?: string;
  image_path?: string;
  level?: number;
  difficulty?: string;
  element?: string;
  description?: string;
  weaknesses?: string[];
  resistances?: string[];
  max_health?: number;
  current_hp?: number;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface BossLeaderboardEntry {
  user_id?: number;
  trainer_id?: number;
  trainer_name?: string;
  total_damage?: number;
  rank?: number;
  [key: string]: unknown;
}

export interface BossDamageData {
  trainer_id: number;
  user_id: number;
  damage: number;
  [key: string]: unknown;
}

export interface BossRewardClaimData {
  userId: number;
  monsterName?: string;
  trainerId: number;
}

// --- Admin Types ---

export interface AdminBoss {
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
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  totalDamageEntries: number;
  totalParticipants: number;
}

export interface AdminLeaderboardEntry {
  userId: number;
  damageUserId: number;
  username: string | null;
  discordId: string | null;
  totalDamage: number;
  submissionCount: number;
}

// --- Service ---

const bossService = {
  // Get current active boss
  getCurrentBoss: async () => {
    const response = await api.get('/bosses/current');
    return response.data;
  },

  // Get current boss with leaderboard
  getCurrentBossWithLeaderboard: async (limit = 10) => {
    const response = await api.get('/bosses/current/full', { params: { limit } });
    return response.data;
  },

  // Get boss by ID
  getBossById: async (bossId: number | string) => {
    const response = await api.get(`/bosses/${bossId}`);
    return response.data;
  },

  // Get leaderboard for a boss
  getBossLeaderboard: async (bossId: number | string, limit = 10): Promise<BossLeaderboardEntry[]> => {
    const response = await api.get(`/bosses/${bossId}/leaderboard`, { params: { limit } });
    return response.data;
  },

  // Get defeated bosses with rankings
  getDefeatedBosses: async (limit = 10) => {
    const response = await api.get('/bosses/defeated', { params: { limit } });
    return response.data;
  },

  // Get a specific defeated boss with full rankings
  getDefeatedBossById: async (bossId: number | string, userId?: number | string | null) => {
    const params: Record<string, unknown> = {};
    if (userId != null) params.userId = userId;
    const response = await api.get(`/bosses/defeated/${bossId}`, { params });
    return response.data;
  },

  // Add damage to a boss
  addBossDamage: async (bossId: number | string, damageData: BossDamageData) => {
    const response = await api.post(`/bosses/${bossId}/damage`, damageData);
    return response.data;
  },

  // Get current boss with unclaimed rewards info
  getCurrentBossWithRewards: async (userId?: number | string | null) => {
    const params: Record<string, unknown> = {};
    if (userId != null) params.userId = userId;
    const response = await api.get('/bosses/current/rewards', { params });
    return response.data;
  },

  // Get unclaimed rewards for a user
  getUnclaimedRewards: async (userId: number | string) => {
    const response = await api.get('/bosses/rewards/unclaimed', { params: { userId } });
    return response.data;
  },

  // Claim a boss reward
  claimBossReward: async (bossId: number | string, claimData: BossRewardClaimData) => {
    const response = await api.post(`/bosses/rewards/${bossId}/claim`, claimData);
    return response.data;
  },

  // ── Admin: Boss CRUD ────────────────────────────────────────────────

  adminGetAllBosses: async (): Promise<AdminBoss[]> => {
    const response = await api.get('/bosses/admin/all');
    return response.data.data || [];
  },

  adminCreateBoss: async (data: {
    name: string;
    description?: string;
    image_url?: string;
    total_hp: number;
    month: number;
    year: number;
    reward_monster_data?: Record<string, unknown> | null;
    grunt_monster_data?: Record<string, unknown> | null;
  }): Promise<AdminBoss> => {
    const response = await api.post('/bosses/admin/create', data);
    return response.data.data;
  },

  adminUpdateBoss: async (id: number, data: {
    name?: string;
    description?: string;
    image_url?: string;
    total_hp?: number;
    current_hp?: number;
    month?: number;
    year?: number;
    status?: string;
    reward_monster_data?: Record<string, unknown> | null;
    grunt_monster_data?: Record<string, unknown> | null;
  }): Promise<AdminBoss> => {
    const response = await api.put(`/bosses/admin/${id}`, data);
    return response.data.data;
  },

  adminDeleteBoss: async (id: number): Promise<void> => {
    await api.delete(`/bosses/admin/${id}`);
  },

  // ── Admin: Damage Management ────────────────────────────────────────

  adminAddDamage: async (bossId: number, data: {
    userId: number;
    damageAmount: number;
  }): Promise<{ success: boolean; damage: unknown; boss: unknown }> => {
    const response = await api.post(`/bosses/${bossId}/damage`, data);
    return response.data;
  },

  adminDeleteUserDamage: async (bossId: number, userId: number) => {
    const response = await api.delete(`/bosses/admin/${bossId}/damage/${userId}`);
    return response.data;
  },

  adminSetUserDamage: async (bossId: number, userId: number, damage: number) => {
    const response = await api.put(`/bosses/admin/${bossId}/damage/${userId}`, { damage });
    return response.data;
  },

  adminGenerateRewards: async (bossId: number): Promise<{ success: boolean; message: string; data: { created: number } }> => {
    const response = await api.post(`/bosses/admin/${bossId}/generate-rewards`);
    return response.data;
  },

  adminGetLeaderboard: async (bossId: number, limit = 100): Promise<AdminLeaderboardEntry[]> => {
    const response = await api.get(`/bosses/${bossId}/leaderboard`, { params: { limit } });
    return response.data.data || [];
  },
};

export default bossService;
