import api from './api';

// --- Types ---

export interface Ability {
  name: string;
  effect?: string;
  description?: string;
  commonTypes?: string[];
  signatureMonsters?: string[];
  [key: string]: unknown;
}

export interface AbilityListResponse {
  abilities: Ability[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AbilityFilterOptions {
  search?: string;
  monsterSearch?: string;
  types?: string[];
  typeLogic?: 'AND' | 'OR';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// --- Service ---

const abilityService = {
  // Get abilities with filtering, pagination, and sorting
  getAbilities: async (options: AbilityFilterOptions = {}): Promise<AbilityListResponse> => {
    const {
      search = '',
      monsterSearch = '',
      types = [],
      typeLogic = 'OR',
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const response = await api.get('/abilities', {
      params: {
        search,
        monsterSearch,
        types: types.join(','),
        typeLogic,
        page,
        limit,
        sortBy,
        sortOrder,
      },
    });

    if (response.data?.success && response.data.data && response.data.pagination) {
      return {
        abilities: response.data.data,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
      };
    }
    return { abilities: [], total: 0, page: 1, totalPages: 0 };
  },

  // Get all unique types from abilities
  getTypes: async (): Promise<string[]> => {
    const response = await api.get('/abilities/types');
    return response.data?.success ? response.data.types : [];
  },

  // Get ability names and descriptions (for autocomplete)
  getAbilityNames: async (): Promise<Pick<Ability, 'name' | 'description'>[]> => {
    const response = await api.get('/abilities/names');
    return response.data?.success ? response.data.abilities : [];
  },

  // Get ability details by name
  getAbilityByName: async (name: string): Promise<Ability | null> => {
    const response = await api.get(`/abilities/${encodeURIComponent(name)}`);
    return response.data?.success ? response.data.ability : null;
  },

  // Search abilities by partial name
  searchAbilities: async (search: string): Promise<Ability[]> => {
    const result = await abilityService.getAbilities({ search, limit: 100 });
    return result.abilities;
  },
};

export default abilityService;
