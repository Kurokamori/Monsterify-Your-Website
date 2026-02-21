import api from './api';

// --- Types ---

export interface Adventure {
  id: number;
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'ended' | string;
  creator_id?: number;
  max_encounters?: number;
  current_encounter_count?: number;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
  participants?: AdventureParticipant[];
  encounters?: AdventureEncounter[];
  [key: string]: unknown;
}

export interface AdventureParticipant {
  user_id?: number;
  trainer_id?: number;
  joined_at?: string;
  message_count?: number;
  word_count?: number;
}

export interface AdventureEncounter {
  id: number;
  adventure_id: number;
  title?: string;
  description?: string;
  image_url?: string;
  created_at?: string;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface AdventureMessage {
  id?: number;
  adventure_id?: number;
  trainer_id?: number;
  message: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AdventureListParams {
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface AdventureTemplate {
  id: number;
  title: string;
  description?: string;
  max_encounters?: number;
  [key: string]: unknown;
}

export interface AdventureRegion {
  id: number | string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface LeaderboardParams {
  timeframe?: string;
  page?: number;
  limit?: number;
}

// --- Admin Types ---

export interface AdminAdventure {
  id: number;
  creatorId: number;
  creatorUsername: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  regionName: string | null;
  areaName: string | null;
  encounterCount: number;
  maxEncounters: number | null;
  discordThreadId: string | null;
  totalParticipants: number;
  totalWords: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AdminAdventureParticipant {
  id: number;
  adventureId: number;
  discordUserId: string;
  userId: number | null;
  username: string | null;
  wordCount: number;
  messageCount: number;
  lastMessageAt: string | null;
  joinedAt: string;
}

export interface AdminAdventureListParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// --- Service ---

const adventureService = {
  // ── CRUD ──────────────────────────────────────────────────────────

  // Get all adventures
  getAllAdventures: async (params: AdventureListParams = {}) => {
    const response = await api.get('/adventures', { params });
    return response.data;
  },

  // Get adventure by ID
  getAdventureById: async (id: number | string) => {
    const response = await api.get(`/adventures/${id}`);
    return response.data;
  },

  // Get current user's adventures
  getUserAdventures: async (params: AdventureListParams = {}) => {
    const response = await api.get('/adventures/user', { params });
    return response.data;
  },

  // Get adventures for a specific trainer
  getTrainerAdventures: async (trainerId: number | string, params: AdventureListParams = {}) => {
    const response = await api.get(`/trainers/${trainerId}/adventures`, { params });
    return response.data;
  },

  // Create a new adventure
  createAdventure: async (adventureData: Partial<Adventure>) => {
    const response = await api.post('/adventures', adventureData);
    return response.data;
  },

  // Update an adventure
  updateAdventure: async (id: number | string, adventureData: Partial<Adventure>) => {
    const response = await api.put(`/adventures/${id}`, adventureData);
    return response.data;
  },

  // ── Participation ─────────────────────────────────────────────────

  // Join an adventure
  joinAdventure: async (adventureId: number | string, trainerId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/join`, { trainerId });
    return response.data;
  },

  // Leave an adventure
  leaveAdventure: async (adventureId: number | string, trainerId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/leave`, { trainerId });
    return response.data;
  },

  // ── Encounters ────────────────────────────────────────────────────

  // Get adventure encounters
  getAdventureEncounters: async (adventureId: number | string) => {
    const response = await api.get(`/adventures/${adventureId}/encounters`);
    return response.data;
  },

  // Generate next encounter
  generateNextEncounter: async (
    adventureId: number | string,
    encounterData: Partial<AdventureEncounter> = {},
  ) => {
    const response = await api.post(`/adventures/${adventureId}/encounters`, encounterData);
    return response.data;
  },

  // ── Messages ──────────────────────────────────────────────────────

  // Get adventure messages
  getAdventureMessages: async (
    adventureId: number | string,
    params: { page?: number; limit?: number } = {},
  ) => {
    const response = await api.get(`/adventures/${adventureId}/messages`, { params });
    return response.data;
  },

  // Post a message to an adventure
  postAdventureMessage: async (
    adventureId: number | string,
    trainerId: number | string,
    message: string,
  ) => {
    const response = await api.post(`/adventures/${adventureId}/messages`, {
      trainerId,
      message,
    });
    return response.data;
  },

  // ── Completion & rewards ──────────────────────────────────────────

  // End an adventure
  endAdventure: async (adventureId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/end`);
    return response.data;
  },

  // Complete an adventure
  completeAdventure: async (adventureId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/complete`);
    return response.data;
  },

  // Calculate adventure rewards
  calculateAdventureRewards: async (adventureId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/calculate-rewards`);
    return response.data;
  },

  // Claim adventure rewards
  claimAdventureRewards: async (adventureId: number | string, trainerId: number | string) => {
    const response = await api.post(`/adventures/${adventureId}/claim-rewards`, { trainerId });
    return response.data;
  },

  // ── Teams ─────────────────────────────────────────────────────────

  // Get adventure team for a trainer
  getAdventureTeam: async (adventureId: number | string, trainerId: number | string) => {
    const response = await api.get(`/adventures/${adventureId}/team`, {
      params: { trainerId },
    });
    return response.data;
  },

  // Update adventure team
  updateAdventureTeam: async (
    adventureId: number | string,
    trainerId: number | string,
    monsterIds: number[],
  ) => {
    const response = await api.put(`/adventures/${adventureId}/team`, {
      trainerId,
      monsterIds,
    });
    return response.data;
  },

  // ── Templates, regions & stats ────────────────────────────────────

  // Get adventure templates
  getAdventureTemplates: async () => {
    const response = await api.get('/adventures/templates');
    return response.data;
  },

  // Get available regions for prebuilt adventures
  getAvailableRegions: async () => {
    const response = await api.get('/adventures/regions');
    return response.data;
  },

  // Get adventure leaderboard
  getAdventureLeaderboard: async (params: LeaderboardParams = {}) => {
    const response = await api.get('/adventures/leaderboard', { params });
    return response.data;
  },

  // Get adventure statistics
  getAdventureStatistics: async () => {
    const response = await api.get('/adventures/statistics');
    return response.data;
  },

  // ── Admin ─────────────────────────────────────────────────────────

  adminGetAllAdventures: async (params: AdminAdventureListParams = {}) => {
    const response = await api.get('/adventures/admin/all', { params });
    return response.data;
  },

  adminGetParticipants: async (id: number) => {
    const response = await api.get(`/adventures/admin/${id}/participants`);
    return response.data;
  },

  adminSendMessage: async (id: number, message: string) => {
    const response = await api.post(`/adventures/admin/${id}/message`, { message });
    return response.data;
  },

  adminUpdateAdventure: async (id: number, data: Partial<Adventure>) => {
    const response = await api.put(`/adventures/${id}`, data);
    return response.data;
  },

  adminDeleteAdventure: async (id: number) => {
    const response = await api.delete(`/adventures/${id}`);
    return response.data;
  },

  adminCompleteAdventure: async (id: number) => {
    const response = await api.post(`/adventures/${id}/complete`);
    return response.data;
  },
};

export default adventureService;
