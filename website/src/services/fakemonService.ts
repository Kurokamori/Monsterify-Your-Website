import api from './api';

// --- Types ---

export interface Fakemon {
  number: number;
  name: string;
  category?: string;
  classification?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  description?: string;
  full_description?: string;
  image_url?: string;
  image_path?: string;
  ability1?: string;
  ability2?: string;
  hidden_ability?: string;
  hp?: number;
  attack?: number;
  defense?: number;
  special_attack?: number;
  special_defense?: number;
  speed?: number;
  evolution_line?: EvolutionEntry[];
  artist_caption?: string;
  height?: string;
  weight?: string;
  habitat?: string;
  rarity?: string;
  created_by?: number;
  created_at?: string;
  // Adjacency from detail endpoint
  prevFakemon?: { number: number; name: string } | null;
  nextFakemon?: { number: number; name: string } | null;
}

export interface EvolutionEntry {
  number: number;
  name: string;
  level?: number;
  method?: 'level' | 'item' | 'condition' | string;
  method_detail?: string;
  evolves_from?: number | null;
  image_url?: string;
  image_path?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

export interface FakemonListResponse {
  fakemon: Fakemon[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface FakemonDetailResponse {
  fakemon: Fakemon | null;
  prevFakemon?: { number: number; name: string } | null;
  nextFakemon?: { number: number; name: string } | null;
}

export interface EvolutionChainResponse {
  evolutionChain: EvolutionEntry[];
}

export interface FakemonListParams {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  attribute?: string;
  search?: string;
}

export interface TypesResponse {
  types: string[];
}

// --- Normalizer ---
// Backend returns camelCase; frontend interfaces use snake_case

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFakemon(raw: any): Fakemon {
  return {
    ...raw,
    image_url: raw.imageUrl ?? raw.image_url,
    image_path: raw.imagePath ?? raw.image_path,
    hidden_ability: raw.hiddenAbility ?? raw.hidden_ability,
    special_attack: raw.specialAttack ?? raw.special_attack,
    special_defense: raw.specialDefense ?? raw.special_defense,
    full_description: raw.fullDescription ?? raw.full_description,
    artist_caption: raw.artistCaption ?? raw.artist_caption,
    evolution_line: raw.evolutionLine ?? raw.evolution_line,
    created_by: raw.createdBy ?? raw.created_by,
    created_at: raw.createdAt ?? raw.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEvolution(raw: any): EvolutionEntry {
  return {
    ...raw,
    image_url: raw.imageUrl ?? raw.image_url,
    image_path: raw.imagePath ?? raw.image_path,
    method_detail: raw.methodDetail ?? raw.method_detail,
    evolves_from: raw.evolvesFrom ?? raw.evolves_from,
  };
}

// --- Service ---

const fakemonService = {
  getAllFakemon: async (params: FakemonListParams = {}): Promise<FakemonListResponse> => {
    const response = await api.get('/fakedex', { params });
    const body = response.data;
    return {
      fakemon: (body.data || []).map(normalizeFakemon),
      total: body.pagination?.total,
      page: body.pagination?.page,
      totalPages: body.pagination?.totalPages,
    };
  },

  getFakemonByNumber: async (number: number | string): Promise<FakemonDetailResponse> => {
    const response = await api.get(`/fakedex/${number}`);
    const body = response.data;
    return {
      fakemon: body.data ? normalizeFakemon(body.data) : null,
      prevFakemon: body.prev ?? null,
      nextFakemon: body.next ?? null,
    };
  },

  getRandomFakemon: async (count = 3): Promise<{ fakemon: Fakemon[] }> => {
    const response = await api.get('/fakedex/random', { params: { count } });
    const body = response.data;
    return { fakemon: (body.data || []).map(normalizeFakemon) };
  },

  searchFakemonByName: async (query: string): Promise<{ fakemon: Fakemon[] }> => {
    const response = await api.get('/fakedex/search', { params: { query } });
    const body = response.data;
    return { fakemon: (body.data || []).map(normalizeFakemon) };
  },

  getAllTypes: async (): Promise<TypesResponse> => {
    const response = await api.get('/fakedex/types');
    const body = response.data;
    return { types: body.data || [] };
  },

  getAllCategories: async (): Promise<{ categories: string[] }> => {
    const response = await api.get('/fakedex/categories');
    const body = response.data;
    return { categories: body.data || [] };
  },

  getEvolutionChain: async (number: number | string): Promise<EvolutionChainResponse> => {
    const response = await api.get(`/fakedex/${number}/evolution`);
    const body = response.data;
    return { evolutionChain: (body.data || []).map(normalizeEvolution) };
  },

  // --- Admin ---

  getNextFakemonNumber: async (): Promise<{ number: number }> => {
    const response = await api.get('/fakedex/admin/next-number');
    return { number: response.data.data };
  },

  createFakemon: async (fakemonData: Partial<Fakemon>) => {
    const response = await api.post('/fakedex/admin', fakemonData);
    return response.data;
  },

  updateFakemon: async (number: number | string, fakemonData: Partial<Fakemon>) => {
    const response = await api.put(`/fakedex/admin/${number}`, fakemonData);
    return response.data;
  },

  deleteFakemon: async (number: number | string) => {
    const response = await api.delete(`/fakedex/admin/${number}`);
    return response.data;
  },

  getNumbersByCategory: async (category: string) => {
    const response = await api.get('/fakedex/admin/numbers-by-category', { params: { category } });
    return response.data;
  },

  bulkCreateFakemon: async (fakemonList: Partial<Fakemon>[]) => {
    const response = await api.post('/fakedex/admin/bulk', { fakemonList });
    return response.data;
  },
};

export default fakemonService;
