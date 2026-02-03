import api from './api';

/**
 * Service for fetching abilities from the backend
 */
const abilityService = {
  /**
   * Get all abilities with advanced filtering
   * @param {Object} options - Filter options
   * @param {string} options.search - Search term for name/effect/description
   * @param {string} options.monsterSearch - Search term for signature monsters
   * @param {string[]} options.types - Array of types to filter by
   * @param {string} options.typeLogic - 'AND' or 'OR' for type filtering
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @returns {Promise<{abilities: Array, total: number, page: number, totalPages: number}>}
   */
  async getAbilities(options = {}) {
    try {
      const {
        search = '',
        monsterSearch = '',
        types = [],
        typeLogic = 'OR',
        page = 1,
        limit = 50,
        sortBy = 'abilityname',
        sortOrder = 'asc'
      } = options;

      const params = {
        search,
        monsterSearch,
        types: types.join(','),
        typeLogic,
        page,
        limit,
        sortBy,
        sortOrder
      };

      const response = await api.get('/abilities', { params });
      if (response.data && response.data.success) {
        return {
          abilities: response.data.abilities,
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages
        };
      }
      return { abilities: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      console.error('Error fetching abilities:', error);
      return { abilities: [], total: 0, page: 1, totalPages: 0 };
    }
  },

  /**
   * Get all unique types from abilities
   * @returns {Promise<string[]>}
   */
  async getTypes() {
    try {
      const response = await api.get('/abilities/types');
      if (response.data && response.data.success) {
        return response.data.types;
      }
      return [];
    } catch (error) {
      console.error('Error fetching ability types:', error);
      return [];
    }
  },

  /**
   * Get all abilities with their names and descriptions
   * Used for autocomplete functionality
   * @returns {Promise<Array<{name: string, description: string}>>}
   */
  async getAbilityNames() {
    try {
      const response = await api.get('/abilities/names');
      if (response.data && response.data.success) {
        return response.data.abilities;
      }
      return [];
    } catch (error) {
      console.error('Error fetching ability names:', error);
      return [];
    }
  },

  /**
   * Get ability details by name
   * @param {string} name - The ability name
   * @returns {Promise<Object | null>}
   */
  async getAbilityByName(name) {
    try {
      const response = await api.get(`/abilities/${encodeURIComponent(name)}`);
      if (response.data && response.data.success) {
        return response.data.ability;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ability by name:', error);
      return null;
    }
  },

  /**
   * Search abilities by partial name (legacy method, now uses getAbilities)
   * @param {string} search - Search query
   * @returns {Promise<Array>}
   */
  async searchAbilities(search) {
    try {
      const result = await this.getAbilities({ search, limit: 100 });
      return result.abilities;
    } catch (error) {
      console.error('Error searching abilities:', error);
      return [];
    }
  }
};

export default abilityService;
