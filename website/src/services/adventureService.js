import api from './api';

/**
 * Service for adventure-related API calls
 */
const adventureService = {
  /**
   * Get all adventures
   * @param {Object} params - Query parameters (status, page, limit, sort)
   * @returns {Promise<Object>} - Response with adventures data
   */
  getAllAdventures: async (params = {}) => {
    try {
      const response = await api.get('/adventures', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching adventures:', error);
      throw error;
    }
  },

  /**
   * Get adventure by ID
   * @param {number} id - Adventure ID
   * @returns {Promise<Object>} - Response with adventure data
   */
  getAdventureById: async (id) => {
    try {
      const response = await api.get(`/adventures/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching adventure ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get user's adventures
   * @param {Object} params - Query parameters (status, page, limit, sort)
   * @returns {Promise<Object>} - Response with user's adventures data
   */
  getUserAdventures: async (params = {}) => {
    try {
      const response = await api.get('/adventures/user', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user adventures:', error);
      throw error;
    }
  },

  /**
   * Get trainer's adventures
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters (status, page, limit, sort)
   * @returns {Promise<Object>} - Response with trainer's adventures data
   */
  getTrainerAdventures: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/adventures`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching adventures for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new adventure
   * @param {Object} adventureData - Adventure data
   * @returns {Promise<Object>} - Response with created adventure data
   */
  createAdventure: async (adventureData) => {
    try {
      const response = await api.post('/adventures', adventureData);
      return response.data;
    } catch (error) {
      console.error('Error creating adventure:', error);
      throw error;
    }
  },

  /**
   * Update an adventure
   * @param {number} id - Adventure ID
   * @param {Object} adventureData - Updated adventure data
   * @returns {Promise<Object>} - Response with updated adventure data
   */
  updateAdventure: async (id, adventureData) => {
    try {
      const response = await api.put(`/adventures/${id}`, adventureData);
      return response.data;
    } catch (error) {
      console.error(`Error updating adventure ${id}:`, error);
      throw error;
    }
  },

  /**
   * Join an adventure
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with join result
   */
  joinAdventure: async (adventureId, trainerId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/join`, { trainerId });
      return response.data;
    } catch (error) {
      console.error(`Error joining adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Leave an adventure
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with leave result
   */
  leaveAdventure: async (adventureId, trainerId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/leave`, { trainerId });
      return response.data;
    } catch (error) {
      console.error(`Error leaving adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Get adventure encounters
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} - Response with encounters data
   */
  getAdventureEncounters: async (adventureId) => {
    try {
      const response = await api.get(`/adventures/${adventureId}/encounters`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching encounters for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Generate next encounter
   * @param {number} adventureId - Adventure ID
   * @param {Object} encounterData - Encounter data (for custom adventures)
   * @returns {Promise<Object>} - Response with generated encounter data
   */
  generateNextEncounter: async (adventureId, encounterData = {}) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/encounters`, encounterData);
      return response.data;
    } catch (error) {
      console.error(`Error generating next encounter for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Get adventure messages
   * @param {number} adventureId - Adventure ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} - Response with messages data
   */
  getAdventureMessages: async (adventureId, params = {}) => {
    try {
      const response = await api.get(`/adventures/${adventureId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Post a message to an adventure
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Response with posted message data
   */
  postAdventureMessage: async (adventureId, trainerId, message) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/messages`, {
        trainerId,
        message
      });
      return response.data;
    } catch (error) {
      console.error(`Error posting message to adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * End an adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} - Response with adventure end result
   */
  endAdventure: async (adventureId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/end`);
      return response.data;
    } catch (error) {
      console.error(`Error ending adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Calculate adventure rewards
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} - Response with reward calculation
   */
  calculateAdventureRewards: async (adventureId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/calculate-rewards`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating rewards for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Claim adventure rewards
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with reward claim result
   */
  claimAdventureRewards: async (adventureId, trainerId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/claim-rewards`, { trainerId });
      return response.data;
    } catch (error) {
      console.error(`Error claiming rewards for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Get adventure templates
   * @returns {Promise<Object>} - Response with adventure templates
   */
  getAdventureTemplates: async () => {
    try {
      const response = await api.get('/adventures/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching adventure templates:', error);
      throw error;
    }
  },

  /**
   * Get adventure leaderboard
   * @param {Object} params - Query parameters (timeframe, page, limit)
   * @returns {Promise<Object>} - Response with leaderboard data
   */
  getAdventureLeaderboard: async (params = {}) => {
    try {
      const response = await api.get('/adventures/leaderboard', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching adventure leaderboard:', error);
      throw error;
    }
  },

  /**
   * Get adventure statistics
   * @returns {Promise<Object>} - Response with adventure statistics
   */
  getAdventureStatistics: async () => {
    try {
      const response = await api.get('/adventures/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching adventure statistics:', error);
      throw error;
    }
  },

  /**
   * Get adventure team
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with team data
   */
  getAdventureTeam: async (adventureId, trainerId) => {
    try {
      const response = await api.get(`/adventures/${adventureId}/team`, { params: { trainerId } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching team for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Update adventure team
   * @param {number} adventureId - Adventure ID
   * @param {number} trainerId - Trainer ID
   * @param {Array} monsterIds - Array of monster IDs
   * @returns {Promise<Object>} - Response with updated team data
   */
  updateAdventureTeam: async (adventureId, trainerId, monsterIds) => {
    try {
      const response = await api.put(`/adventures/${adventureId}/team`, {
        trainerId,
        monsterIds
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating team for adventure ${adventureId}:`, error);
      throw error;
    }
  },

  /**
   * Get available regions for prebuilt adventures
   * @returns {Promise<Object>} - Response with regions data
   */
  getAvailableRegions: async () => {
    try {
      const response = await api.get('/adventures/regions');
      return response.data;
    } catch (error) {
      console.error('Error fetching available regions:', error);
      throw error;
    }
  },

  /**
   * Complete adventure
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} - Response with completion result
   */
  completeAdventure: async (adventureId) => {
    try {
      const response = await api.post(`/adventures/${adventureId}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error completing adventure ${adventureId}:`, error);
      throw error;
    }
  }
};

export default adventureService;
