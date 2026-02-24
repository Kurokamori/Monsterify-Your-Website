import api from './api';

// --- Types ---

export interface Adopt {
  id: number;
  name?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  attribute?: string;
  level?: number;
  img_link?: string;
  claimed?: boolean;
  claimed_by_trainer_id?: number;
  month?: number;
  year?: number;
  [key: string]: unknown;
}

export interface AdoptListResponse {
  success: boolean;
  adopts: Adopt[];
  total?: number;
  page?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface AdoptionArtDetails {
  quality: string;
  background: string;
  appearances: { type: string }[];
  complexityBonus: number;
}

export interface ClaimAdoptParams {
  adoptId: number;
  trainerId: number;
  monsterName: string;
  discordUserId: string;
  berryName?: string | null;
  pastryName?: string | null;
  speciesValue?: string | null;
  typeValue?: string | null;
  artDetails?: AdoptionArtDetails;
}

export interface UseItemParams {
  monsterId: number;
  trainerId: number;
}

// --- Service ---

const adoptionService = {
  // Get adopts for the current month
  getCurrentMonthAdopts: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/adoption/current', { params });
    return response.data;
  },

  // Get all adopts with pagination
  getAllAdopts: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/adoption', { params });
    return response.data;
  },

  // Get adopts for a specific year and month
  getAdoptsByYearAndMonth: async (
    year: number,
    month: number,
    params: Record<string, unknown> = {},
  ) => {
    const response = await api.get(`/adoption/${year}/${month}`, { params });
    return response.data;
  },

  // Claim a monthly adopt
  claimAdopt: async (data: ClaimAdoptParams) => {
    const response = await api.post('/adoption/claim', data);
    return response.data;
  },

  // Check if a trainer has a daycare daypass
  checkDaycareDaypass: async (trainerId: number | string) => {
    const response = await api.get(`/adoption/check-daypass/${trainerId}`);
    return response.data;
  },

  // Get list of months that have adoption data
  getMonthsWithData: async () => {
    const response = await api.get('/adoption/months');
    return response.data;
  },

  // Generate monthly adopts for the current month (admin)
  generateMonthlyAdopts: async () => {
    const response = await api.post('/adoption/generate');
    return response.data;
  },

  // Generate test data for past months (admin)
  generateTestData: async (monthsCount = 3) => {
    const response = await api.post('/adoption/generate-test-data', { monthsCount });
    return response.data;
  },

  // Use a berry on a monster
  useBerry: async (
    monsterId: number,
    berryName: string,
    trainerId: number,
    speciesValue?: string | null,
  ) => {
    const response = await api.post('/items/use-berry', {
      monsterId,
      berryName,
      trainerId,
      speciesValue: speciesValue ?? null,
    });
    return response.data;
  },

  // Use a pastry on a monster
  usePastry: async (
    monsterId: number,
    pastryName: string,
    trainerId: number,
    selectedValue?: string | null,
  ) => {
    const response = await api.post('/items/use-pastry', {
      monsterId,
      pastryName,
      trainerId,
      selectedValue: selectedValue ?? null,
    });
    return response.data;
  },

  // Roll random species
  rollRandomSpecies: async (count = 10) => {
    const response = await api.get('/species/random', { params: { count } });
    return response.data;
  },

  // Get species list
  getSpeciesList: async () => {
    const response = await api.get('/species/list');
    return response.data;
  },
};

export default adoptionService;
