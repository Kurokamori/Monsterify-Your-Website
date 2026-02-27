import api from './api';
import type { Trainer, TrainerFormData, TrainerInventory, AdditionalReference } from '@components/trainers/types/Trainer';

// --- Response types ---

export interface TrainerListResponse {
  trainers: Trainer[];
  totalPages: number;
  currentPage: number;
  totalTrainers: number;
}

export interface TrainerMonster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  trainer_id?: number;
  box_number?: number;
  box_position?: number;
  [key: string]: unknown;
}

export interface TrainerMonstersResponse {
  monsters: TrainerMonster[];
  totalMonsters: number;
}

export interface MonsterBoxPosition {
  id: number;
  boxNumber: number;
  position: number;
}

// --- Response normalization helpers ---

/** Extract a trainer list from the various API response shapes */
function normalizeTrainerList(data: Record<string, unknown>): TrainerListResponse {
  // { success, trainers: [...] }
  if (data.success && Array.isArray(data.trainers)) {
    return {
      trainers: data.trainers as Trainer[],
      totalPages: (data.totalPages as number) ?? 1,
      currentPage: (data.currentPage as number) ?? 1,
      totalTrainers: (data.totalTrainers as number) ?? (data.trainers as unknown[]).length,
    };
  }
  // { success, data: [...] }
  if (data.success && Array.isArray(data.data)) {
    return {
      trainers: data.data as Trainer[],
      totalPages: (data.totalPages as number) ?? 1,
      currentPage: (data.currentPage as number) ?? 1,
      totalTrainers: (data.totalTrainers as number) ?? (data.data as unknown[]).length,
    };
  }
  // Direct array
  if (Array.isArray(data)) {
    return {
      trainers: data as unknown as Trainer[],
      totalPages: 1,
      currentPage: 1,
      totalTrainers: (data as unknown[]).length,
    };
  }
  return { trainers: [], totalPages: 1, currentPage: 1, totalTrainers: 0 };
}

/** Extract a single trainer from the various API response shapes */
function normalizeTrainerDetail(data: Record<string, unknown>): Trainer | null {
  if (data.success && data.trainer) return data.trainer as Trainer;
  if (data.success && data.data) return data.data as Trainer;
  if (data.name || data.id || data.level) return data as unknown as Trainer;
  return null;
}

// --- Service ---

const trainerService = {
  // Get all trainers (non-paginated, for dropdowns/forms)
  getAllTrainers: async (params: Record<string, unknown> = {}): Promise<TrainerListResponse> => {
    const response = await api.get('/trainers/all', { params });
    return normalizeTrainerList(response.data);
  },

  // Get trainers with pagination (for listing pages)
  getTrainersPaginated: async (params: Record<string, unknown> = {}): Promise<TrainerListResponse> => {
    const response = await api.get('/trainers', { params });
    return normalizeTrainerList(response.data);
  },

  // Get trainer by ID
  getTrainer: async (id: number | string): Promise<Trainer | null> => {
    const response = await api.get(`/trainers/${id}`);
    return normalizeTrainerDetail(response.data);
  },

  // Get trainers for the current user
  getUserTrainers: async (userId?: string | number): Promise<TrainerListResponse> => {
    const endpoint = userId ? `/trainers/user/${userId}` : '/trainers/user';
    const response = await api.get(endpoint, { params: { limit: 10000 } });
    return normalizeTrainerList(response.data);
  },

  // Create a new trainer (JSON body)
  createTrainer: async (trainerData: TrainerFormData): Promise<Trainer> => {
    const formatted: Record<string, unknown> = { ...trainerData };

    // Attach current user ID as fallback
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored) as { discord_id?: string };
        if (user.discord_id) formatted.player_user_id = user.discord_id;
      }
    } catch { /* ignore parse errors */ }

    // Ensure mega_info is serialized
    if (!formatted.mega_info) {
      formatted.mega_info = JSON.stringify({
        mega_ref: '', mega_artist: '',
        mega_species1: '', mega_species2: '', mega_species3: '',
        mega_type1: '', mega_type2: '', mega_type3: '',
        mega_type4: '', mega_type5: '', mega_type6: '',
        mega_ability: '',
      });
    } else if (typeof formatted.mega_info === 'object') {
      formatted.mega_info = JSON.stringify(formatted.mega_info);
    }

    const response = await api.post('/trainers', formatted);
    return response.data;
  },

  // Create a new trainer with file uploads (multipart/form-data)
  createTrainerWithFiles: async (formData: FormData): Promise<Trainer> => {
    const response = await api.post('/trainers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update a trainer (handles both JSON and FormData)
  updateTrainer: async (id: number | string, trainerData: TrainerFormData | FormData): Promise<Trainer> => {
    const config = trainerData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await api.put(`/trainers/${id}`, trainerData, config);
    return response.data;
  },

  // Delete a trainer
  deleteTrainer: async (id: number | string, forfeitToBazar = false): Promise<void> => {
    await api.delete(`/trainers/${id}`, { data: { forfeitToBazar } });
  },

  // Get monsters for a trainer
  getTrainerMonsters: async (
    trainerId: number | string,
    params: Record<string, unknown> = {},
  ): Promise<TrainerMonstersResponse> => {
    const response = await api.get(`/trainers/${trainerId}/monsters`, { params });
    const data = response.data;

    if (data?.success) {
      return { monsters: data.monsters ?? [], totalMonsters: data.totalMonsters ?? 0 };
    }
    if (Array.isArray(data)) {
      return { monsters: data, totalMonsters: data.length };
    }
    return { monsters: [], totalMonsters: 0 };
  },

  // Get ALL monsters for a trainer (no pagination)
  getAllTrainerMonsters: async (trainerId: number | string): Promise<TrainerMonstersResponse> => {
    const response = await api.get(`/trainers/${trainerId}/monsters/all`);
    const data = response.data;
    if (data?.success) {
      return { monsters: data.monsters ?? [], totalMonsters: data.totalMonsters ?? 0 };
    }
    return { monsters: [], totalMonsters: 0 };
  },

  // Update monster box positions
  updateMonsterBoxPositions: async (
    trainerId: number | string,
    positions: MonsterBoxPosition[],
  ) => {
    const response = await api.put(`/trainers/${trainerId}/monsters/boxes`, { positions });
    return response.data;
  },

  // Get trainer inventory
  getTrainerInventory: async (trainerId: number | string): Promise<TrainerInventory> => {
    const response = await api.get(`/trainers/${trainerId}/inventory`);
    return response.data;
  },

  // Get trainer gallery (submissions featuring this trainer)
  getTrainerGallery: async (trainerId: number | string): Promise<{ success: boolean; data: { id: number; image_url: string; title: string | null; created_at: string; is_mature: boolean; content_rating: Record<string, boolean> | null }[] }> => {
    const response = await api.get(`/trainers/${trainerId}/gallery`);
    return response.data;
  },

  // Get trainer additional references
  getTrainerReferences: async (trainerId: number | string): Promise<AdditionalReference[]> => {
    const response = await api.get(`/trainers/${trainerId}/references`);
    return response.data;
  },

  // Get trainer stats
  getTrainerStats: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/stats`);
    return response.data;
  },

  // Get trainer badges
  getTrainerBadges: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/badges`);
    return response.data;
  },

  // Get trainer adventures
  getTrainerAdventures: async (trainerId: number | string, params: Record<string, unknown> = {}) => {
    const response = await api.get(`/trainers/${trainerId}/adventures`, { params });
    return response.data;
  },

  // Get trainer submissions
  getTrainerSubmissions: async (trainerId: number | string, params: Record<string, unknown> = {}) => {
    const response = await api.get(`/trainers/${trainerId}/submissions`, { params });
    return response.data;
  },

  // Add experience to a trainer
  addTrainerExperience: async (trainerId: number | string, amount: number, source: string) => {
    const response = await api.post(`/trainers/${trainerId}/experience`, { amount, source });
    return response.data;
  },

  // Add coins to a trainer
  addTrainerCoins: async (trainerId: number | string, amount: number, source: string) => {
    const response = await api.post(`/trainers/${trainerId}/coins`, { amount, source });
    return response.data;
  },

  // Get featured monsters for a trainer
  getFeaturedMonsters: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/featured-monsters`);
    return response.data;
  },

  // Update featured monsters for a trainer (max 6 monster IDs)
  updateFeaturedMonsters: async (trainerId: number | string, featuredMonsters: number[]) => {
    const response = await api.put(`/trainers/${trainerId}/featured-monsters`, { featuredMonsters });
    return response.data;
  },

  // Get achievements for a trainer
  getAchievements: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/achievements`);
    return response.data;
  },

  // Claim a single achievement
  claimAchievement: async (trainerId: number | string, achievementId: number | string) => {
    const response = await api.post(`/trainers/${trainerId}/achievements/${achievementId}/claim`);
    return response.data;
  },

  // Claim all available achievements
  claimAllAchievements: async (trainerId: number | string) => {
    const response = await api.post(`/trainers/${trainerId}/achievements/claim-all`);
    return response.data;
  },

  // Get achievement statistics
  getAchievementStats: async (trainerId: number | string) => {
    const response = await api.get(`/trainers/${trainerId}/achievements/stats`);
    return response.data;
  },

  // Update trainer inventory item
  updateTrainerInventoryItem: async (
    trainerId: number | string,
    category: string,
    itemName: string,
    quantity: number,
  ) => {
    const response = await api.put(`/trainers/${trainerId}/inventory`, { category, itemName, quantity });
    return response.data;
  },

  // Admin: Bulk add item to all trainers
  adminBulkAddItemToAllTrainers: async (itemName: string, quantity: number, category: string) => {
    const response = await api.post('/trainers/admin/inventory/bulk-add', { itemName, quantity, category });
    return response.data;
  },

  // Admin: Update trainer currency
  adminUpdateCurrency: async (trainerId: number | string, amount: number) => {
    const response = await api.post(`/trainers/admin/currency/${trainerId}`, { amount });
    return response.data;
  },

  // Admin: Change trainer owner
  adminChangeOwner: async (trainerId: number | string, newOwnerDiscordId: string) => {
    const response = await api.put(`/trainers/admin/${trainerId}/owner`, { newOwnerDiscordId });
    return response.data;
  },

  // Admin: Delete trainer with optional forfeit
  adminDeleteTrainer: async (trainerId: number | string, forfeitToBazar: boolean) => {
    const response = await api.delete(`/trainers/admin/${trainerId}`, { data: { forfeitToBazar } });
    return response.data;
  },
};

export default trainerService;
