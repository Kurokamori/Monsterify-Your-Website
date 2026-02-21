import api from './api';

export interface BulkAddMonstersData {
  trainer_id: number;
  monsters_text: string;
}

export interface BulkAddResult {
  success: boolean;
  trainer_name?: string;
  processed_count?: number;
  error_count?: number;
  results?: {
    name: string;
    level: number;
    species: string[];
    types: string[];
    attribute: string;
  }[];
  errors?: string[];
  message?: string;
}

export interface AdminLevelResult {
  trainer: {
    id: number;
    name: string;
    newLevel: number;
    newCurrency: number;
  };
}

export interface AdminMonsterLevelResult {
  monster: {
    id: number;
    name: string;
    newLevel: number;
    trainerId: number;
  };
}

export interface AdminStatsResponse {
  success: boolean;
  data?: Record<string, unknown>;
}

export interface FactionPerson {
  id: number;
  faction_id: number;
  name: string;
  alias?: string;
  standing_requirement?: number;
  blurb?: string;
  short_bio?: string;
  long_bio?: string;
  role?: string;
  available_assistance?: string;
  images?: string[];
  standing_reward?: number;
}

export interface Faction {
  id: number;
  name: string;
  description?: string;
}

export interface MonsterTeamMember {
  id: number;
  person_id: number;
  position: number;
  species: string[];
  types: string[];
  attribute?: string;
  level?: number;
  nickname?: string;
  stats?: {
    hp_iv: number; hp_ev: number;
    atk_iv: number; atk_ev: number;
    def_iv: number; def_ev: number;
    spa_iv: number; spa_ev: number;
    spd_iv: number; spd_ev: number;
    spe_iv: number; spe_ev: number;
  };
}

export interface AdminPaginatedResponse<T = Record<string, unknown>> {
  success: boolean;
  data: T[];
  totalPages: number;
  message?: string;
}

// --- Response normalization ---

/** Normalize paginated admin list responses into a consistent shape */
function normalizeAdminList<T = Record<string, unknown>>(
  data: Record<string, unknown>,
  key?: string,
): AdminPaginatedResponse<T> {
  const items = (
    (key && data[key]) || data.data || data
  ) as T[];
  return {
    success: (data.success as boolean) ?? true,
    data: Array.isArray(items) ? items : [],
    totalPages: (data.totalPages as number) ?? 1,
    message: (data.message as string) ?? '',
  };
}

// --- Service ---

const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminStatsResponse> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User management
  getUsers: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Admin listing endpoints (normalized response format)
  getTrainers: async (params: Record<string, unknown> = {}): Promise<AdminPaginatedResponse> => {
    const response = await api.get('/trainers', { params });
    return normalizeAdminList(response.data, 'trainers');
  },

  getMonsters: async (params: Record<string, unknown> = {}): Promise<AdminPaginatedResponse> => {
    const response = await api.get('/monsters', { params });
    return normalizeAdminList(response.data, 'monsters');
  },

  getFakemon: async (params: Record<string, unknown> = {}): Promise<AdminPaginatedResponse> => {
    const response = await api.get('/fakedex', { params });
    return normalizeAdminList(response.data);
  },

  getSubmissions: async (params: Record<string, unknown> = {}): Promise<AdminPaginatedResponse> => {
    const response = await api.get('/submissions', { params });
    return normalizeAdminList(response.data);
  },

  // Bulk operations
  bulkAddMonsters: async (data: BulkAddMonstersData): Promise<BulkAddResult> => {
    const response = await api.post('/admin/monsters/bulk-add', data);
    return response.data;
  },

  // Faction endpoints
  getFactions: async (): Promise<Faction[]> => {
    const response = await api.get('/admin/factions');
    return response.data.data || response.data;
  },

  getFactionPeople: async (factionId?: number): Promise<FactionPerson[]> => {
    const params = factionId ? { faction_id: factionId } : {};
    const response = await api.get('/admin/faction-people', { params });
    return response.data.data || response.data;
  },

  createFactionPerson: async (data: Partial<FactionPerson>): Promise<FactionPerson> => {
    const response = await api.post('/admin/faction-people', data);
    return response.data.data || response.data;
  },

  updateFactionPerson: async (id: number, data: Partial<FactionPerson>): Promise<FactionPerson> => {
    const response = await api.put(`/admin/faction-people/${id}`, data);
    return response.data.data || response.data;
  },

  deleteFactionPerson: async (id: number): Promise<void> => {
    await api.delete(`/admin/faction-people/${id}`);
  },

  // Monster Team endpoints
  getPersonTeam: async (personId: number): Promise<MonsterTeamMember[]> => {
    const response = await api.get(`/admin/faction-people/${personId}/team`);
    return response.data.data || response.data;
  },

  addTeamMonster: async (personId: number, data: Partial<MonsterTeamMember>): Promise<MonsterTeamMember> => {
    const response = await api.post(`/admin/faction-people/${personId}/team`, data);
    return response.data.data || response.data;
  },

  updateMonster: async (monsterId: number, data: Partial<MonsterTeamMember>): Promise<MonsterTeamMember> => {
    const response = await api.put(`/admin/monsters/${monsterId}`, data);
    return response.data.data || response.data;
  },

  deleteMonster: async (monsterId: number): Promise<void> => {
    await api.delete(`/admin/monsters/${monsterId}`);
  },

  // Prompt admin endpoints
  getPrompts: async (params?: Record<string, unknown>) => {
    const response = await api.get('/prompts', { params });
    return response.data;
  },

  updatePromptStatus: async (ids: number[], status: string) => {
    const response = await api.put('/admin/prompts/bulk-status', { ids, status });
    return response.data;
  },

  deletePrompts: async (ids: number[]) => {
    const response = await api.post('/admin/prompts/bulk-delete', { ids });
    return response.data;
  },

  createPrompt: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/prompts', data);
    return response.data;
  },

  updatePrompt: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/admin/prompts/${id}`, data);
    return response.data;
  },

  // Monster roller endpoints
  rollMonstersMany: async (
    params: Record<string, unknown> & { count: number },
  ): Promise<{ success: boolean; data: Record<string, unknown>[]; seed: string; count: number }> => {
    const response = await api.post('/monster-roller/roll/many', params);
    return response.data;
  },

  createAndInitializeMonster: async (data: {
    trainer_id: number;
    name: string;
    species1: string;
    species2?: string | null;
    species3?: string | null;
    type1: string;
    type2?: string | null;
    type3?: string | null;
    type4?: string | null;
    type5?: string | null;
    attribute?: string | null;
    level?: number;
    img_link?: string | null;
  }): Promise<{ success: boolean; data: Record<string, unknown> }> => {
    const createResponse = await api.post('/monsters', data);
    const monster = createResponse.data.data;
    const initResponse = await api.post(`/monsters/${monster.id}/initialize`);
    return initResponse.data;
  },

  // Level management endpoints
  addLevelsToTrainer: async (
    trainerId: number,
    levels: number,
    coins?: number,
    reason?: string,
  ): Promise<{ success: boolean; message: string; data: AdminLevelResult }> => {
    const response = await api.post(`/trainers/admin/levels/${trainerId}`, { levels, coins, reason });
    return response.data;
  },

  addLevelsToMonster: async (
    monsterId: number,
    levels: number,
    reason?: string,
  ): Promise<{ success: boolean; message: string; data: AdminMonsterLevelResult }> => {
    const response = await api.post(`/monsters/admin/levels/${monsterId}`, { levels, reason });
    return response.data;
  },
};

export default adminService;

