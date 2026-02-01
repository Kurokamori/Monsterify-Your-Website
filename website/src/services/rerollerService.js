import api from './api';

/**
 * Service for reroller-related API calls
 */
const rerollerService = {
  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Create a new reroll session
   * @param {Object} sessionData - Session configuration
   * @returns {Promise<Object>} - Response with created session
   */
  createSession: async (sessionData) => {
    try {
      const response = await api.post('/reroller/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error creating reroll session:', error);
      throw error;
    }
  },

  /**
   * List all reroll sessions
   * @param {Object} params - Query parameters (status, page, limit)
   * @returns {Promise<Object>} - Response with sessions list
   */
  listSessions: async (params = {}) => {
    try {
      const response = await api.get('/reroller/sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing reroll sessions:', error);
      throw error;
    }
  },

  /**
   * Get a single reroll session
   * @param {number} id - Session ID
   * @returns {Promise<Object>} - Response with session data
   */
  getSession: async (id) => {
    try {
      const response = await api.get(`/reroller/sessions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting reroll session:', error);
      throw error;
    }
  },

  /**
   * Update a reroll session
   * @param {number} id - Session ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Response with updated session
   */
  updateSession: async (id, data) => {
    try {
      const response = await api.put(`/reroller/sessions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating reroll session:', error);
      throw error;
    }
  },

  /**
   * Delete a reroll session
   * @param {number} id - Session ID
   * @returns {Promise<Object>} - Response
   */
  deleteSession: async (id) => {
    try {
      const response = await api.delete(`/reroller/sessions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting reroll session:', error);
      throw error;
    }
  },

  /**
   * Update a specific result in a session
   * @param {number} sessionId - Session ID
   * @param {string} type - 'monster' or 'item'
   * @param {number} index - Result index
   * @param {Object} data - New result data
   * @returns {Promise<Object>} - Response with updated session
   */
  updateResult: async (sessionId, type, index, data) => {
    try {
      const response = await api.put(`/reroller/sessions/${sessionId}/result`, {
        type,
        index,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Error updating result:', error);
      throw error;
    }
  },

  /**
   * Delete a specific result from a session
   * @param {number} sessionId - Session ID
   * @param {string} type - 'monster' or 'item'
   * @param {number} index - Result index
   * @returns {Promise<Object>} - Response with updated session
   */
  deleteResult: async (sessionId, type, index) => {
    try {
      const response = await api.delete(`/reroller/sessions/${sessionId}/result/${type}/${index}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting result:', error);
      throw error;
    }
  },

  /**
   * Reroll a specific result
   * @param {number} sessionId - Session ID
   * @param {string} type - 'monster' or 'item'
   * @param {number} index - Result index
   * @returns {Promise<Object>} - Response with updated session
   */
  rerollResult: async (sessionId, type, index) => {
    try {
      const response = await api.post(`/reroller/sessions/${sessionId}/reroll-result`, {
        type,
        index
      });
      return response.data;
    } catch (error) {
      console.error('Error rerolling result:', error);
      throw error;
    }
  },

  /**
   * Reroll entire session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} - Response with updated session
   */
  rerollAll: async (sessionId) => {
    try {
      const response = await api.post(`/reroller/sessions/${sessionId}/reroll-all`);
      return response.data;
    } catch (error) {
      console.error('Error rerolling session:', error);
      throw error;
    }
  },

  // ============================================================================
  // PLAYER METHODS
  // ============================================================================

  /**
   * Check if a claim token is valid (public, no auth required)
   * @param {string} token - Claim token
   * @returns {Promise<Object>} - Response with validity status
   */
  checkToken: async (token) => {
    try {
      const response = await api.get(`/reroller/check/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error checking token:', error);
      throw error;
    }
  },

  /**
   * Get claim session for player (auth required)
   * @param {string} token - Claim token
   * @returns {Promise<Object>} - Response with available rewards and trainers
   */
  getClaimSession: async (token) => {
    try {
      const response = await api.get(`/reroller/claim/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error getting claim session:', error);
      throw error;
    }
  },

  /**
   * Submit claims (auth required)
   * @param {string} token - Claim token
   * @param {Array} claims - Array of claims to submit
   * @returns {Promise<Object>} - Response with created entities
   */
  submitClaims: async (token, claims) => {
    try {
      const response = await api.post(`/reroller/claim/${token}`, { claims });
      return response.data;
    } catch (error) {
      console.error('Error submitting claims:', error);
      throw error;
    }
  },

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Build claim URL from token
   * @param {string} token - Claim token
   * @returns {string} - Full claim URL
   */
  buildClaimUrl: (token) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/claim/${token}`;
  },

  /**
   * Get default item categories
   * @returns {Array} - Array of category objects
   */
  getItemCategories: () => [
    { value: 'berries', label: 'Berries', default: true },
    { value: 'pastries', label: 'Pastries', default: true },
    { value: 'evolution', label: 'Evolution Items', default: true },
    { value: 'helditems', label: 'Held Items', default: true },
    { value: 'balls', label: 'Balls', default: true },
    { value: 'antiques', label: 'Antiques', default: true },
    { value: 'eggs', label: 'Eggs', default: false },
    { value: 'seals', label: 'Seals', default: false },
    { value: 'keyitems', label: 'Key Items', default: false }
  ],

  /**
   * Calculate gift roll counts
   * @param {number} giftLevels - Number of gift levels
   * @returns {Object} - Item and monster counts
   */
  calculateGiftCounts: (giftLevels) => ({
    itemCount: Math.ceil(giftLevels / 5),
    monsterCount: Math.floor(giftLevels / 10)
  })
};

export default rerollerService;
