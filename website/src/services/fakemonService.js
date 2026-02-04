import api from './api';

/**
 * Service for fakemon-related API calls
 */
const fakemonService = {
  /**
   * Get all fakemon
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with fakemon data
   */
  getAllFakemon: async (params = {}) => {
    try {
      const response = await api.get('/fakedex', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching fakemon:', error);
      throw error;
    }
  },

  /**
   * Get fakemon by number
   * @param {number} number - Fakemon number
   * @returns {Promise<Object>} - Response with fakemon data
   */
  getFakemonByNumber: async (number) => {
    try {
      const response = await api.get(`/fakedex/${number}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching fakemon ${number}:`, error);
      throw error;
    }
  },

  /**
   * Get random fakemon
   * @param {number} count - Number of random fakemon to get
   * @returns {Promise<Object>} - Response with random fakemon data
   */
  getRandomFakemon: async (count = 3) => {
    try {
      const response = await api.get('/fakedex/random', { params: { count } });
      return response.data;
    } catch (error) {
      console.error('Error fetching random fakemon:', error);
      throw error;
    }
  },

  /**
   * Search fakemon
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Response with search results
   */
  searchFakemon: async (params = {}) => {
    try {
      // Use the main endpoint with search parameters
      const response = await api.get('/fakedex', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching fakemon:', error);
      throw error;
    }
  },

  /**
   * Search fakemon by name (for autocomplete)
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Response with matching fakemon
   */
  searchFakemonByName: async (query) => {
    try {
      const response = await api.get('/fakedex/search', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error searching fakemon by name:', error);
      throw error;
    }
  },

  /**
   * Get fakemon by type
   * @param {string} type - Fakemon type
   * @returns {Promise<Object>} - Response with fakemon of the specified type
   */
  getFakemonByType: async (type) => {
    try {
      // Use the main endpoint with type parameter
      const response = await api.get('/fakedex', { params: { type } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching fakemon by type ${type}:`, error);
      throw error;
    }
  },

  /**
   * Get all fakemon types
   * @returns {Promise<Object>} - Response with all fakemon types
   */
  getAllTypes: async () => {
    try {
      const response = await api.get('/fakedex/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching fakemon types:', error);
      throw error;
    }
  },

  /**
   * Get fakemon evolution chain
   * @param {number} number - Fakemon number
   * @returns {Promise<Object>} - Response with evolution chain data
   */
  getEvolutionChain: async (number) => {
    try {
      const response = await api.get(`/fakedex/${number}/evolution`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching evolution chain for fakemon ${number}:`, error);
      throw error;
    }
  },

  /**
   * Get next available fakemon number
   * @returns {Promise<Object>} - Response with next available number
   */
  getNextFakemonNumber: async () => {
    try {
      const response = await api.get('/fakedex/admin/next-number');
      return response.data;
    } catch (error) {
      console.error('Error fetching next fakemon number:', error);
      throw error;
    }
  },

  /**
   * Create a new fakemon
   * @param {Object} fakemonData - Fakemon data
   * @returns {Promise<Object>} - Response with created fakemon
   */
  createFakemon: async (fakemonData) => {
    try {
      const response = await api.post('/fakedex/admin', fakemonData);
      return response.data;
    } catch (error) {
      console.error('Error creating fakemon:', error);
      throw error;
    }
  },

  /**
   * Update an existing fakemon
   * @param {string} number - Fakemon number
   * @param {Object} fakemonData - Updated fakemon data
   * @returns {Promise<Object>} - Response with updated fakemon
   */
  updateFakemon: async (number, fakemonData) => {
    try {
      const response = await api.put(`/fakedex/admin/${number}`, fakemonData);
      return response.data;
    } catch (error) {
      console.error(`Error updating fakemon ${number}:`, error);
      throw error;
    }
  },

  /**
   * Delete a fakemon
   * @param {string} number - Fakemon number
   * @returns {Promise<Object>} - Response with success message
   */
  deleteFakemon: async (number) => {
    try {
      const response = await api.delete(`/fakedex/admin/${number}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting fakemon ${number}:`, error);
      throw error;
    }
  },

  /**
   * Get all fakemon categories
   * @returns {Promise<Object>} - Response with categories
   */
  getAllCategories: async () => {
    try {
      const response = await api.get('/fakedex/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching fakemon categories:', error);
      throw error;
    }
  },

  /**
   * Get numbers used within a category
   * @param {string} category - Category name
   * @returns {Promise<Object>} - Response with numbers
   */
  getNumbersByCategory: async (category) => {
    try {
      const response = await api.get('/fakedex/admin/numbers-by-category', {
        params: { category }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching numbers for category ${category}:`, error);
      throw error;
    }
  },

  /**
   * Bulk create fakemon
   * @param {Array} fakemonList - Array of fakemon data
   * @returns {Promise<Object>} - Response with created fakemon and errors
   */
  bulkCreateFakemon: async (fakemonList) => {
    try {
      const response = await api.post('/fakedex/admin/bulk', { fakemonList });
      return response.data;
    } catch (error) {
      console.error('Error bulk creating fakemon:', error);
      throw error;
    }
  }
};

export default fakemonService;
