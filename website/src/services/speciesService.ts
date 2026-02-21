import api from './api';

// --- Franchise configuration types ---

export interface FilterConfig {
  label: string;
  field: string;
  options: string[] | null;
  type?: 'boolean';
}

export interface DisplayField {
  key: string;
  label: string;
  type?: 'type' | 'boolean';
}

export interface EvolutionFields {
  from?: string;
  to?: string;
  lineField?: string;
}

export interface FranchiseConfigItem {
  name: string;
  endpoint: string;
  adminEndpoint?: string;
  idField: string;
  nameField: string;
  imageField: string;
  sortDefault: string;
  filters: Record<string, FilterConfig>;
  displayFields: DisplayField[];
  evolutionFields: EvolutionFields | null;
}

export type FranchiseKey =
  | 'pokemon' | 'digimon' | 'nexomon' | 'yokai'
  | 'monsterhunter' | 'finalfantasy' | 'pals' | 'fakemon';

// --- Franchise configuration ---

export const FRANCHISE_CONFIG: Record<FranchiseKey, FranchiseConfigItem> = {
  pokemon: {
    name: 'Pokemon',
    endpoint: '/pokemon-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'ndex',
    filters: {
      type: { label: 'Type', field: 'type', options: null },
      stage: { label: 'Stage', field: 'stage', options: ['Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"] },
      legendary: { label: 'Legendary', field: 'legendary', options: null, type: 'boolean' },
      mythical: { label: 'Mythical', field: 'mythical', options: null, type: 'boolean' },
    },
    displayFields: [
      { key: 'ndex', label: 'Dex #' },
      { key: 'typePrimary', label: 'Type 1', type: 'type' },
      { key: 'typeSecondary', label: 'Type 2', type: 'type' },
      { key: 'stage', label: 'Stage' },
      { key: 'isLegendary', label: 'Legendary', type: 'boolean' },
      { key: 'isMythical', label: 'Mythical', type: 'boolean' },
    ],
    evolutionFields: { from: 'evolvesFrom', to: 'evolvesTo' },
  },
  digimon: {
    name: 'Digimon',
    endpoint: '/digimon-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'name',
    filters: {
      rank: { label: 'Rank', field: 'rank', options: null },
      attribute: { label: 'Attribute', field: 'attribute', options: null },
    },
    displayFields: [
      { key: 'rank', label: 'Rank' },
      { key: 'attribute', label: 'Attribute' },
      { key: 'families', label: 'Families' },
      { key: 'digimonType', label: 'Type' },
      { key: 'levelRequired', label: 'Level Required' },
    ],
    evolutionFields: { from: 'digivolvesFrom', to: 'digivolvesTo' },
  },
  nexomon: {
    name: 'Nexomon',
    endpoint: '/nexomon-monsters',
    idField: 'nr',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'nr',
    filters: {
      type: { label: 'Type', field: 'type', options: null },
      stage: { label: 'Stage', field: 'stage', options: null },
      legendary: { label: 'Legendary', field: 'legendary', options: null, type: 'boolean' },
    },
    displayFields: [
      { key: 'nr', label: 'Number' },
      { key: 'typePrimary', label: 'Type 1', type: 'type' },
      { key: 'typeSecondary', label: 'Type 2', type: 'type' },
      { key: 'stage', label: 'Stage' },
      { key: 'isLegendary', label: 'Legendary', type: 'boolean' },
    ],
    evolutionFields: { from: 'evolvesFrom', to: 'evolvesTo' },
  },
  yokai: {
    name: 'Yokai Watch',
    endpoint: '/yokai-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'name',
    filters: {
      tribe: { label: 'Tribe', field: 'tribe', options: null },
      rank: { label: 'Rank', field: 'rank', options: null },
      stage: { label: 'Stage', field: 'stage', options: null },
    },
    displayFields: [
      { key: 'tribe', label: 'Tribe' },
      { key: 'rank', label: 'Rank' },
      { key: 'stage', label: 'Stage' },
    ],
    evolutionFields: { from: 'evolvesFrom', to: 'evolvesTo' },
  },
  monsterhunter: {
    name: 'Monster Hunter',
    endpoint: '/monsterhunter-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'name',
    filters: {
      rank: { label: 'Rank', field: 'rank', options: null },
      element: { label: 'Element', field: 'element', options: null },
    },
    displayFields: [
      { key: 'rank', label: 'Rank' },
      { key: 'element', label: 'Element' },
    ],
    evolutionFields: null,
  },
  finalfantasy: {
    name: 'Final Fantasy',
    endpoint: '/finalfantasy-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'name',
    filters: {
      stage: { label: 'Stage', field: 'stage', options: null },
    },
    displayFields: [
      { key: 'stage', label: 'Stage' },
    ],
    evolutionFields: { from: 'evolvesFrom', to: 'evolvesTo' },
  },
  pals: {
    name: 'Palworld',
    endpoint: '/pals-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'name',
    filters: {},
    displayFields: [],
    evolutionFields: null,
  },
  fakemon: {
    name: 'Fakemon',
    endpoint: '/fakedex',
    adminEndpoint: '/fakedex/admin',
    idField: 'number',
    nameField: 'name',
    imageField: 'imageUrl',
    sortDefault: 'number',
    filters: {
      type: { label: 'Type', field: 'type', options: null },
      category: { label: 'Category', field: 'category', options: null },
      attribute: { label: 'Attribute', field: 'attribute', options: null },
    },
    displayFields: [
      { key: 'number', label: 'Dex #' },
      { key: 'type1', label: 'Type 1', type: 'type' },
      { key: 'type2', label: 'Type 2', type: 'type' },
      { key: 'category', label: 'Category' },
      { key: 'attribute', label: 'Attribute' },
    ],
    evolutionFields: { from: 'evolvesFrom', to: 'evolvesTo', lineField: 'evolutionLine' },
  },
};

export const FRANCHISE_LIST = Object.keys(FRANCHISE_CONFIG) as FranchiseKey[];

// --- Species types ---

export interface Species {
  [key: string]: unknown;
}

export interface SpeciesListResponse {
  species: Species[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetSpeciesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface AdjacentSpeciesResult {
  prev: Species | null;
  next: Species | null;
  currentIndex: number;
  total: number;
}

export interface SpeciesImageMap {
  [speciesName: string]: { image_url: string; species: string };
}

// --- Response normalization ---

interface ApiResponse {
  data?: Species[] | { data: Species[]; pagination: PaginationInfo };
  pagination?: PaginationInfo;
  fakemon?: Species[];
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  success?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function normalizeListResponse(response: ApiResponse): SpeciesListResponse {
  if (response.data && response.pagination) {
    return {
      species: response.data as Species[],
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.totalPages,
    };
  }
  if (response.fakemon) {
    return {
      species: response.fakemon,
      page: response.page ?? 1,
      limit: response.limit ?? 30,
      total: response.totalItems ?? 0,
      totalPages: response.totalPages ?? 0,
    };
  }
  if (Array.isArray(response.data)) {
    return {
      species: response.data,
      page: 1,
      limit: response.data.length,
      total: response.data.length,
      totalPages: 1,
    };
  }
  if (Array.isArray(response)) {
    return {
      species: response,
      page: 1,
      limit: response.length,
      total: response.length,
      totalPages: 1,
    };
  }
  return { species: [], page: 1, limit: 30, total: 0, totalPages: 0 };
}

/** Resolve franchise config, throwing on unknown franchise */
function resolveConfig(franchise: FranchiseKey): FranchiseConfigItem {
  const config = FRANCHISE_CONFIG[franchise];
  if (!config) throw new Error(`Unknown franchise: ${franchise}`);
  return config;
}

// --- Service ---

const speciesService = {
  // ── Franchise database queries ─────────────────────────────────────

  // Get paginated species list for a franchise
  getSpecies: async (franchise: FranchiseKey, params: GetSpeciesParams = {}): Promise<SpeciesListResponse> => {
    const config = resolveConfig(franchise);
    const {
      page = 1,
      limit = 30,
      search = '',
      sortBy = config.sortDefault,
      sortOrder = 'asc',
      ...filters
    } = params;

    const queryParams: Record<string, unknown> = { page, limit, sortBy, sortOrder };
    if (search) queryParams.search = search;

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '' && value !== null) {
        queryParams[key] = value;
      }
    }

    const response = await api.get(config.endpoint, { params: queryParams });
    return normalizeListResponse(response.data);
  },

  // Get single species by ID
  getSpeciesById: async (franchise: FranchiseKey, id: string | number): Promise<Species> => {
    const config = resolveConfig(franchise);
    const response = await api.get(`${config.endpoint}/${id}`);
    return response.data.data || response.data;
  },

  // Get static filter options for a franchise
  getFilterOptions: async (franchise: FranchiseKey): Promise<Record<string, string[]>> => {
    const config = resolveConfig(franchise);
    const options: Record<string, string[]> = {};
    for (const [filterKey, filterConfig] of Object.entries(config.filters)) {
      if (filterConfig.options) {
        options[filterKey] = filterConfig.options;
      }
    }
    return options;
  },

  // Get adjacent species for prev/next navigation
  getAdjacentSpecies: async (
    franchise: FranchiseKey,
    currentId: string | number,
    params: GetSpeciesParams = {},
  ): Promise<AdjacentSpeciesResult> => {
    const config = resolveConfig(franchise);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page, limit, ...filterParams } = params;

    try {
      const response = await speciesService.getSpecies(franchise, {
        ...filterParams,
        page: 1,
        limit: 1000,
      });

      const species = response.species;
      const currentIndex = species.findIndex(
        s => String(s[config.idField]) === String(currentId),
      );

      if (currentIndex === -1) {
        return { prev: null, next: null, currentIndex: -1, total: species.length };
      }

      return {
        prev: currentIndex > 0 ? species[currentIndex - 1] : null,
        next: currentIndex < species.length - 1 ? species[currentIndex + 1] : null,
        currentIndex,
        total: species.length,
      };
    } catch {
      return { prev: null, next: null, currentIndex: -1, total: 0 };
    }
  },

  // Get franchise configuration
  getFranchiseConfig: (franchise: FranchiseKey): FranchiseConfigItem | null => {
    return FRANCHISE_CONFIG[franchise] || null;
  },

  // ── Generic franchise CRUD (replaces per-franchise methods) ────────

  // Create a species entry in a franchise database
  createSpecies: async (franchise: FranchiseKey, data: Partial<Species>): Promise<Species> => {
    const config = resolveConfig(franchise);
    const base = config.adminEndpoint ?? config.endpoint;
    const response = await api.post(base, data);
    return response.data;
  },

  // Update a species entry in a franchise database
  updateSpecies: async (franchise: FranchiseKey, id: string | number, data: Partial<Species>): Promise<Species> => {
    const config = resolveConfig(franchise);
    const base = config.adminEndpoint ?? config.endpoint;
    const response = await api.put(`${base}/${id}`, data);
    return response.data;
  },

  // Delete a species entry from a franchise database
  deleteSpecies: async (franchise: FranchiseKey, id: string | number): Promise<void> => {
    const config = resolveConfig(franchise);
    const base = config.adminEndpoint ?? config.endpoint;
    await api.delete(`${base}/${id}`);
  },

  // ── Species utility methods ────────────────────────────────────────

  // Get images for a list of species names
  getSpeciesImages: async (speciesList: string[]): Promise<SpeciesImageMap> => {
    if (!speciesList.length) return {};

    const response = await api.get('/species/images', {
      params: { species: speciesList.join(',') },
    });

    const map: SpeciesImageMap = {};
    if (response.data?.success && Array.isArray(response.data.images)) {
      for (const img of response.data.images) {
        map[img.species] = { image_url: img.url, species: img.species };
      }
    }
    return map;
  },

  // Get random species
  getRandomSpecies: async (count = 10) => {
    const response = await api.get('/species/random', { params: { count } });
    return response.data;
  },

  // Get species list
  getSpeciesList: async (params: Record<string, unknown> = {}) => {
    const response = await api.get('/species/list', { params });
    return response.data;
  },

  // Search species by name
  searchSpecies: async (query: string) => {
    const response = await api.get('/species/search', { params: { query } });
    return response.data;
  },

  // ── Fakemon-specific methods ──────────────────────────────────────

  getFakemonTypes: async (): Promise<string[]> => {
    const response = await api.get('/fakedex/types');
    return response.data?.data ?? [];
  },

  getFakemonCategories: async (): Promise<string[]> => {
    const response = await api.get('/fakedex/categories');
    return response.data?.data ?? [];
  },

  getFakemonNumbersByCategory: async (category: string): Promise<number[]> => {
    const response = await api.get('/fakedex/admin/numbers-by-category', {
      params: { category },
    });
    return response.data?.data ?? [];
  },

  bulkCreateFakemon: async (fakemon: Record<string, unknown>[]): Promise<{ success: boolean; data: unknown[] }> => {
    const response = await api.post('/fakedex/admin/bulk', { fakemon });
    return response.data;
  },
};

export default speciesService;
