import api from './api';

// Franchise configuration - maps franchises to their API endpoints and attributes
export const FRANCHISE_CONFIG = {
  pokemon: {
    name: 'Pokemon',
    endpoint: '/pokemon-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'ndex',
    filters: {
      type: { label: 'Type', field: 'type', options: null }, // Will be populated dynamically
      stage: { label: 'Stage', field: 'stage', options: ['Base Stage', 'Middle Stage', 'Final Stage', "Doesn't Evolve"] },
      legendary: { label: 'Legendary', field: 'legendary', type: 'boolean' },
      mythical: { label: 'Mythical', field: 'mythical', type: 'boolean' }
    },
    displayFields: [
      { key: 'ndex', label: 'Dex #' },
      { key: 'type_primary', label: 'Type 1', type: 'type' },
      { key: 'type_secondary', label: 'Type 2', type: 'type' },
      { key: 'stage', label: 'Stage' },
      { key: 'is_legendary', label: 'Legendary', type: 'boolean' },
      { key: 'is_mythical', label: 'Mythical', type: 'boolean' }
    ],
    evolutionFields: { from: 'evolves_from', to: 'evolves_to' }
  },
  digimon: {
    name: 'Digimon',
    endpoint: '/digimon-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'name',
    filters: {
      rank: { label: 'Rank', field: 'rank', options: null },
      attribute: { label: 'Attribute', field: 'attribute', options: null }
    },
    displayFields: [
      { key: 'rank', label: 'Rank' },
      { key: 'attribute', label: 'Attribute' },
      { key: 'families', label: 'Families' },
      { key: 'digimon_type', label: 'Type' },
      { key: 'level_required', label: 'Level Required' }
    ],
    evolutionFields: { from: 'digivolves_from', to: 'digivolves_to' }
  },
  nexomon: {
    name: 'Nexomon',
    endpoint: '/nexomon-monsters',
    idField: 'nr',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'nr',
    filters: {
      type: { label: 'Type', field: 'type', options: null },
      stage: { label: 'Stage', field: 'stage', options: null },
      legendary: { label: 'Legendary', field: 'legendary', type: 'boolean' }
    },
    displayFields: [
      { key: 'nr', label: 'Number' },
      { key: 'type_primary', label: 'Type 1', type: 'type' },
      { key: 'type_secondary', label: 'Type 2', type: 'type' },
      { key: 'stage', label: 'Stage' },
      { key: 'is_legendary', label: 'Legendary', type: 'boolean' }
    ],
    evolutionFields: { from: 'evolves_from', to: 'evolves_to' }
  },
  yokai: {
    name: 'Yokai Watch',
    endpoint: '/yokai-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'name',
    filters: {
      tribe: { label: 'Tribe', field: 'tribe', options: null },
      rank: { label: 'Rank', field: 'rank', options: null },
      stage: { label: 'Stage', field: 'stage', options: null }
    },
    displayFields: [
      { key: 'tribe', label: 'Tribe' },
      { key: 'rank', label: 'Rank' },
      { key: 'stage', label: 'Stage' }
    ],
    evolutionFields: { from: 'evolves_from', to: 'evolves_to' }
  },
  monsterhunter: {
    name: 'Monster Hunter',
    endpoint: '/monsterhunter-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'name',
    filters: {
      rank: { label: 'Rank', field: 'rank', options: null },
      element: { label: 'Element', field: 'element', options: null }
    },
    displayFields: [
      { key: 'rank', label: 'Rank' },
      { key: 'element', label: 'Element' }
    ],
    evolutionFields: null
  },
  finalfantasy: {
    name: 'Final Fantasy',
    endpoint: '/finalfantasy-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'name',
    filters: {
      stage: { label: 'Stage', field: 'stage', options: null }
    },
    displayFields: [
      { key: 'stage', label: 'Stage' }
    ],
    evolutionFields: { from: 'evolves_from', to: 'evolves_to' }
  },
  pals: {
    name: 'Palworld',
    endpoint: '/pals-monsters',
    idField: 'id',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'name',
    filters: {},
    displayFields: [],
    evolutionFields: null
  },
  fakemon: {
    name: 'Fakemon',
    endpoint: '/fakedex',
    idField: 'number',
    nameField: 'name',
    imageField: 'image_url',
    sortDefault: 'number',
    filters: {
      type: { label: 'Type', field: 'type', options: null },
      category: { label: 'Category', field: 'category', options: null },
      attribute: { label: 'Attribute', field: 'attribute', options: null }
    },
    displayFields: [
      { key: 'number', label: 'Dex #' },
      { key: 'type1', label: 'Type 1', type: 'type' },
      { key: 'type2', label: 'Type 2', type: 'type' },
      { key: 'category', label: 'Category' },
      { key: 'attribute', label: 'Attribute' }
    ],
    evolutionFields: { lineField: 'evolution_line' }
  }
};

// Get list of franchise keys
export const FRANCHISE_LIST = Object.keys(FRANCHISE_CONFIG);

// Normalize API responses to consistent format
const normalizeListResponse = (response, franchise) => {
  const config = FRANCHISE_CONFIG[franchise];

  // Handle different response formats
  if (response.data && response.pagination) {
    // Standard format: { success, data, pagination }
    return {
      species: response.data,
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.totalPages
    };
  } else if (response.fakemon) {
    // Fakemon format: { fakemon, page, limit, totalItems, totalPages }
    return {
      species: response.fakemon,
      page: response.page,
      limit: response.limit,
      total: response.totalItems,
      totalPages: response.totalPages
    };
  } else if (Array.isArray(response.data)) {
    // Simple array format
    return {
      species: response.data,
      page: 1,
      limit: response.data.length,
      total: response.data.length,
      totalPages: 1
    };
  } else if (Array.isArray(response)) {
    // Direct array
    return {
      species: response,
      page: 1,
      limit: response.length,
      total: response.length,
      totalPages: 1
    };
  }

  // Fallback
  return {
    species: [],
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0
  };
};

const speciesDatabaseService = {
  /**
   * Get paginated species list for a franchise
   */
  getSpecies: async (franchise, params = {}) => {
    const config = FRANCHISE_CONFIG[franchise];
    if (!config) {
      throw new Error(`Unknown franchise: ${franchise}`);
    }

    const {
      page = 1,
      limit = 30,
      search = '',
      sortBy = config.sortDefault,
      sortOrder = 'asc',
      ...filters
    } = params;

    // Build query params
    const queryParams = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    if (search) {
      queryParams.search = search;
    }

    // Add filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        queryParams[key] = value;
      }
    });

    try {
      const response = await api.get(config.endpoint, { params: queryParams });
      return normalizeListResponse(response.data, franchise);
    } catch (error) {
      console.error(`Error fetching ${franchise} species:`, error);
      throw error;
    }
  },

  /**
   * Get single species by ID
   */
  getSpeciesById: async (franchise, id) => {
    const config = FRANCHISE_CONFIG[franchise];
    if (!config) {
      throw new Error(`Unknown franchise: ${franchise}`);
    }

    try {
      const response = await api.get(`${config.endpoint}/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching ${franchise} species ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get filter options for a franchise (distinct values)
   */
  getFilterOptions: async (franchise) => {
    const config = FRANCHISE_CONFIG[franchise];
    if (!config) {
      throw new Error(`Unknown franchise: ${franchise}`);
    }

    // Some filter options are static, defined in config
    const options = {};

    Object.entries(config.filters).forEach(([filterKey, filterConfig]) => {
      if (filterConfig.options) {
        options[filterKey] = filterConfig.options;
      }
    });

    // For dynamic options, we'd need backend endpoints that return distinct values
    // For now, return what we have statically defined
    return options;
  },

  /**
   * Get adjacent species for prev/next navigation
   */
  getAdjacentSpecies: async (franchise, currentId, params = {}) => {
    const config = FRANCHISE_CONFIG[franchise];
    if (!config) {
      throw new Error(`Unknown franchise: ${franchise}`);
    }

    // Fetch all species with same filters to find position
    const { page, limit, ...filterParams } = params;

    try {
      // Get a larger batch to find position
      const response = await speciesDatabaseService.getSpecies(franchise, {
        ...filterParams,
        page: 1,
        limit: 1000 // Get many to find adjacent
      });

      const species = response.species;
      const currentIndex = species.findIndex(s =>
        String(s[config.idField]) === String(currentId)
      );

      if (currentIndex === -1) {
        return { prev: null, next: null, currentIndex: -1, total: species.length };
      }

      return {
        prev: currentIndex > 0 ? species[currentIndex - 1] : null,
        next: currentIndex < species.length - 1 ? species[currentIndex + 1] : null,
        currentIndex,
        total: species.length
      };
    } catch (error) {
      console.error('Error getting adjacent species:', error);
      return { prev: null, next: null, currentIndex: -1, total: 0 };
    }
  },

  /**
   * Get franchise configuration
   */
  getFranchiseConfig: (franchise) => {
    return FRANCHISE_CONFIG[franchise] || null;
  }
};

export default speciesDatabaseService;
