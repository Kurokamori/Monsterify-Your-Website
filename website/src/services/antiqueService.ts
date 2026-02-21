import api from './api';

// --- Antique Setting Types (matches DB antique_settings table) ---

export interface OverrideParameters {
  force_fusion?: boolean;
  attribute?: string[];
  species?: string[];
  species1?: string[];
  species2?: string[];
  species3?: string[];
  species_all?: string[];
  type?: string[];
  type1?: string[];
  type2?: string[];
  type3?: string[];
  type4?: string[];
  type5?: string[];
  max_types?: number;
  [key: string]: unknown;
}

export interface AntiqueSetting {
  id: number;
  itemName: string;
  category: string;
  holiday: string;
  description: string | null;
  rollCount: number;
  forceFusion: boolean | null;
  forceNoFusion: boolean | null;
  allowFusion: boolean | null;
  forceMinTypes: number | null;
  overrideParameters: OverrideParameters;
  createdAt: string;
  updatedAt: string;
}

export interface AntiqueSettingSaveInput {
  category: string;
  holiday: string;
  description?: string | null;
  rollCount: number;
  forceFusion: boolean | null;
  forceNoFusion: boolean | null;
  allowFusion: boolean | null;
  forceMinTypes: number | null;
  overrideParameters: OverrideParameters;
}

// --- Auction Types ---

export interface AntiqueAuction {
  id: number;
  antique?: string;
  name?: string;
  description?: string;
  image_url?: string;
  [key: string]: unknown;
}

export interface AdminAntiqueAuction {
  id: number;
  name: string;
  antique: string;
  image: string | null;
  species1: string;
  species2: string | null;
  species3: string | null;
  type1: string;
  type2: string | null;
  type3: string | null;
  type4: string | null;
  type5: string | null;
  attribute: string | null;
  description: string | null;
  family: string | null;
  creator: string | null;
  createdAt: string;
}

export interface AntiqueDropdownItem {
  name: string;
  holiday: string;
  category: string;
}

export interface AuctionCatalogueFilters {
  antique?: string;
  species?: string;
  type?: string;
  creator?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface AuctionAntiqueParams {
  trainerId: number;
  targetTrainerId?: number;
  antique: string;
  auctionId: number;
  monsterName: string;
  discordUserId: string;
}

// --- Service ---

const antiqueService = {
  // Get antique roll settings (admin) — backwards compat alias
  getAntiqueRollSettings: async () => {
    const response = await api.get('/antiques/settings');
    return response.data;
  },

  // Get antique auctions (admin)
  getAntiqueAuctions: async () => {
    const response = await api.get('/antiques/auctions');
    return response.data;
  },

  // Get auction catalogue with filtering
  getAuctionCatalogue: async (filters: AuctionCatalogueFilters = {}) => {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    }
    const response = await api.get('/antiques/catalogue', { params });
    return response.data;
  },

  // Get catalogue filter options
  getCatalogueFilters: async () => {
    const response = await api.get('/antiques/catalogue/filters');
    return response.data;
  },

  // Get a trainer's antiques
  getTrainerAntiques: async (trainerId: number | string) => {
    const response = await api.get(`/antiques/trainer/${trainerId}`);
    return response.data;
  },

  // Appraise an antique
  appraiseAntique: async (trainerId: number, antique: string) => {
    const response = await api.post('/antiques/appraise', { trainerId, antique });
    return response.data;
  },

  // Get auction options for an antique
  getAuctionOptions: async (antique: string) => {
    const response = await api.get(`/antiques/auction-options/${encodeURIComponent(antique)}`);
    return response.data;
  },

  // Auction an antique
  auctionAntique: async (params: AuctionAntiqueParams) => {
    const response = await api.post('/antiques/auction', {
      ...params,
      targetTrainerId: params.targetTrainerId ?? params.trainerId,
    });
    return response.data;
  },

  // --- Antique Settings (Admin) ---

  getAntiqueSettings: async (): Promise<{ success: boolean; data: AntiqueSetting[] }> => {
    const response = await api.get('/antiques/appraisal-configs');
    return response.data;
  },

  saveAntiqueSetting: async (itemName: string, input: AntiqueSettingSaveInput) => {
    const response = await api.put(
      `/antiques/appraisal-configs/${encodeURIComponent(itemName)}`,
      input
    );
    return response.data;
  },

  deleteAntiqueSetting: async (itemName: string) => {
    const response = await api.delete(
      `/antiques/appraisal-configs/${encodeURIComponent(itemName)}`
    );
    return response.data;
  },

  // --- Admin CRUD ---

  // Get all antiques for dropdown (admin)
  getAllAntiquesDropdown: async () => {
    const response = await api.get('/antiques/all-antiques');
    return response.data;
  },

  // Get auction by ID (admin)
  getAntiqueAuctionById: async (id: number | string) => {
    const response = await api.get(`/antiques/auctions/${id}`);
    return response.data;
  },

  // Create auction (admin)
  createAntiqueAuction: async (auctionData: Partial<AntiqueAuction>) => {
    const response = await api.post('/antiques/auctions', auctionData);
    return response.data;
  },

  // Update auction (admin)
  updateAntiqueAuction: async (id: number | string, auctionData: Partial<AntiqueAuction>) => {
    const response = await api.put(`/antiques/auctions/${id}`, auctionData);
    return response.data;
  },

  // Delete auction (admin)
  deleteAntiqueAuction: async (id: number | string) => {
    const response = await api.delete(`/antiques/auctions/${id}`);
    return response.data;
  },

  // Upload an image for an auction (admin)
  uploadImage: async (image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    const response = await api.post('/antiques/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default antiqueService;
