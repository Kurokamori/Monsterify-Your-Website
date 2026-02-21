import api from './api';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Mission {
  id: number;
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
  minLevel: number;
  maxMonsters: number;
  requirements: MissionRequirements | null;
  rewardConfig: MissionRewardConfig | null;
  requiredProgress: number;
  status: string;
}

export interface MissionRequirements {
  types?: string[];
  attributes?: string[];
  minLevel?: number;
}

export interface MissionRewardConfig {
  levels?: { min: number; max: number };
  coins?: { min: number; max: number };
  items?: { min: number; max: number };
  monsters?: { count: number };
}

export interface MissionMonster {
  id: number;
  name: string;
  level: number;
  imgLink: string | null;
  types: string[];
  attribute: string | null;
  trainerName: string | null;
}

export interface UserMission {
  id: number;
  userId: string;
  missionId: number;
  status: string;
  currentProgress: number;
  requiredProgress: number;
  rewardClaimed: boolean;
  startedAt: string;
  completedAt: string | null;
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
  monsters: MissionMonster[];
}

export interface EligibleMonster {
  id: number;
  name: string;
  level: number;
  img_link: string | null;
  type1: string | null;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  trainer_name: string | null;
}

export interface AdminUserMission {
  id: number;
  userId: string;
  missionId: number;
  status: string;
  currentProgress: number;
  requiredProgress: number;
  rewardClaimed: boolean;
  startedAt: string;
  completedAt: string | null;
  title: string;
  description: string | null;
  difficulty: string;
  duration: number;
  username: string | null;
  displayName: string | null;
}

export interface AdminUserMissionParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  missionId?: number;
  sortBy?: string;
  sortOrder?: string;
}

// ── Service ────────────────────────────────────────────────────────────────

const missionService = {
  getAvailableMissions: async () => {
    const response = await api.get('/missions/user/available');
    return response.data;
  },

  getActiveMissions: async () => {
    const response = await api.get('/missions/user/active');
    return response.data;
  },

  getMissionById: async (missionId: number | string) => {
    const response = await api.get(`/missions/${missionId}`);
    return response.data;
  },

  getEligibleMonsters: async (missionId: number | string) => {
    const response = await api.get(`/missions/${missionId}/eligible-monsters`);
    return response.data;
  },

  startMission: async (missionId: number | string, monsterIds: number[]) => {
    const response = await api.post(`/missions/${missionId}/start`, { monsterIds });
    return response.data;
  },

  claimRewards: async (missionId: number | string) => {
    const response = await api.post(`/missions/${missionId}/claim`);
    return response.data;
  },

  // Admin methods
  adminGetAllMissions: async (params: {
    page?: number;
    limit?: number;
    difficulty?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    queryParams.append('status', params.status || 'all');
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    const response = await api.get(`/missions?${queryParams.toString()}`);
    return response.data;
  },

  adminCreateMission: async (data: Partial<Mission>) => {
    const response = await api.post('/missions', data);
    return response.data;
  },

  adminUpdateMission: async (id: number, data: Partial<Mission>) => {
    const response = await api.put(`/missions/${id}`, data);
    return response.data;
  },

  adminDeleteMission: async (id: number) => {
    const response = await api.delete(`/missions/${id}`);
    return response.data;
  },

  adminGetDifficulties: async () => {
    const response = await api.get('/missions/admin/difficulties');
    return response.data;
  },

  // Admin – User Missions
  adminGetUserMissions: async (params: AdminUserMissionParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.missionId) queryParams.append('missionId', String(params.missionId));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    const response = await api.get(`/missions/admin/user-missions?${queryParams.toString()}`);
    return response.data;
  },

  adminUpdateUserMission: async (id: number, data: { currentProgress?: number; status?: string; rewardClaimed?: boolean }) => {
    const response = await api.put(`/missions/admin/user-missions/${id}`, data);
    return response.data;
  },

  adminCompleteUserMission: async (id: number) => {
    const response = await api.put(`/missions/admin/user-missions/${id}/complete`);
    return response.data;
  },

  adminDeleteUserMission: async (id: number) => {
    const response = await api.delete(`/missions/admin/user-missions/${id}`);
    return response.data;
  },
};

export default missionService;
