import api from './api';

// --- Types ---

export type RerollResultType = 'monster' | 'item';

export interface RerollSession {
  id: number;
  status?: string;
  claim_token?: string;
  results?: RerollResult[];
  [key: string]: unknown;
}

export interface RerollResult {
  type: RerollResultType;
  index: number;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RerollClaim {
  type: RerollResultType;
  index: number;
  trainerId: number;
  monsterName?: string;
  [key: string]: unknown;
}

export interface ItemCategory {
  value: string;
  label: string;
  default: boolean;
}

export interface GiftCounts {
  itemCount: number;
  monsterCount: number;
}

// --- Service ---

const rerollerService = {
  // --- Admin ---

  // Create a new reroll session
  createSession: async (sessionData: Record<string, unknown>) => {
    const response = await api.post('/reroller/sessions', sessionData);
    return response.data;
  },

  // List all reroll sessions
  listSessions: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/reroller/sessions', { params });
    return response.data;
  },

  // Get a single session by ID
  getSession: async (id: number | string) => {
    const response = await api.get(`/reroller/sessions/${id}`);
    return response.data;
  },

  // Update a session
  updateSession: async (id: number | string, data: Record<string, unknown>) => {
    const response = await api.put(`/reroller/sessions/${id}`, data);
    return response.data;
  },

  // Delete a session
  deleteSession: async (id: number | string) => {
    const response = await api.delete(`/reroller/sessions/${id}`);
    return response.data;
  },

  // Update a specific result in a session
  updateResult: async (
    sessionId: number | string,
    type: RerollResultType,
    index: number,
    data: Record<string, unknown>,
  ) => {
    const response = await api.put(`/reroller/sessions/${sessionId}/result`, {
      type,
      index,
      data,
    });
    return response.data;
  },

  // Delete a specific result from a session
  deleteResult: async (sessionId: number | string, type: RerollResultType, index: number) => {
    const response = await api.delete(`/reroller/sessions/${sessionId}/result/${type}/${index}`);
    return response.data;
  },

  // Reroll a specific result
  rerollResult: async (sessionId: number | string, type: RerollResultType, index: number) => {
    const response = await api.post(`/reroller/sessions/${sessionId}/reroll-result`, {
      type,
      index,
    });
    return response.data;
  },

  // Reroll entire session
  rerollAll: async (sessionId: number | string) => {
    const response = await api.post(`/reroller/sessions/${sessionId}/reroll-all`);
    return response.data;
  },

  // --- Player ---

  // Check if a claim token is valid (public, no auth)
  checkToken: async (token: string) => {
    const response = await api.get(`/reroller/check/${token}`);
    return response.data;
  },

  // Get claim session for player (auth required)
  getClaimSession: async (token: string) => {
    const response = await api.get(`/reroller/claim/${token}`);
    return response.data;
  },

  // Submit claims (auth required)
  submitClaims: async (token: string, claims: RerollClaim[]) => {
    const response = await api.post(`/reroller/claim/${token}`, { claims });
    return response.data;
  },

  // --- Helpers ---

  // Build claim URL from token
  buildClaimUrl: (token: string): string => {
    return `${window.location.origin}/claim/${token}`;
  },

  // Default item categories for reroll configuration
  getItemCategories: (): ItemCategory[] => [
    { value: 'berries', label: 'Berries', default: true },
    { value: 'pastries', label: 'Pastries', default: true },
    { value: 'evolution', label: 'Evolution Items', default: true },
    { value: 'helditems', label: 'Held Items', default: true },
    { value: 'balls', label: 'Balls', default: true },
    { value: 'antiques', label: 'Antiques', default: true },
    { value: 'eggs', label: 'Eggs', default: false },
    { value: 'seals', label: 'Seals', default: false },
    { value: 'keyitems', label: 'Key Items', default: false },
  ],

  // Calculate gift roll counts from gift levels
  calculateGiftCounts: (giftLevels: number): GiftCounts => ({
    itemCount: Math.ceil(giftLevels / 5),
    monsterCount: Math.floor(giftLevels / 10),
  }),
};

export default rerollerService;
