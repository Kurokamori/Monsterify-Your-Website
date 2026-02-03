import api from './api';

/**
 * Service for antique-related API calls
 */
const antiqueService = {
  /**
   * Get antique roll settings (admin only)
   * @returns {Promise<Object>} - Response with antique roll settings
   */
  getAntiqueRollSettings: async () => {
    try {
      const response = await api.get('/antiques/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching antique roll settings:', error);
      throw error;
    }
  },

  /**
   * Get antique auctions (admin only)
   * @returns {Promise<Object>} - Response with antique auctions
   */
  getAntiqueAuctions: async () => {
    try {
      const response = await api.get('/antiques/auctions');
      return response.data;
    } catch (error) {
      console.error('Error fetching antique auctions:', error);
      throw error;
    }
  },

  /**
   * Get auction catalogue with filtering
   * @param {Object} filters - Filter options (antique, species, type, creator, search, page, limit)
   * @returns {Promise<Object>} - Response with catalogue data
   */
  getAuctionCatalogue: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const response = await api.get(`/antiques/catalogue?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching auction catalogue:', error);
      throw error;
    }
  },

  /**
   * Get catalogue filter options (antiques with holidays, types, creators)
   * @returns {Promise<Object>} - Response with filter options
   */
  getCatalogueFilters: async () => {
    try {
      const response = await api.get('/antiques/catalogue/filters');
      return response.data;
    } catch (error) {
      console.error('Error fetching catalogue filters:', error);
      throw error;
    }
  },

  /**
   * Get trainer's antiques
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's antiques
   */
  getTrainerAntiques: async (trainerId) => {
    try {
      const response = await api.get(`/antiques/trainer/${trainerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching antiques for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Appraise an antique
   * @param {number} trainerId - Trainer ID
   * @param {string} antique - Antique name
   * @returns {Promise<Object>} - Response with appraisal result
   */
  appraiseAntique: async (trainerId, antique) => {
    try {
      const response = await api.post('/antiques/appraise', {
        trainerId,
        antique
      });
      return response.data;
    } catch (error) {
      console.error('Error appraising antique:', error);
      throw error;
    }
  },

  /**
   * Get auction options for an antique
   * @param {string} antique - Antique name
   * @returns {Promise<Object>} - Response with auction options
   */
  getAuctionOptions: async (antique) => {
    try {
      const response = await api.get(`/antiques/auction-options/${antique}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching auction options for antique ${antique}:`, error);
      throw error;
    }
  },

  /**
   * Auction an antique
   * @param {number} trainerId - Source trainer ID (who has the antique)
   * @param {string} antique - Antique name
   * @param {number} auctionId - Auction ID
   * @param {string} monsterName - Monster name
   * @param {string} discordUserId - Discord user ID
   * @param {number} targetTrainerId - Target trainer ID (where the monster goes)
   * @returns {Promise<Object>} - Response with auction result
   */
  auctionAntique: async (trainerId, antique, auctionId, monsterName, discordUserId, targetTrainerId = null) => {
    try {
      const response = await api.post('/antiques/auction', {
        trainerId,
        targetTrainerId: targetTrainerId || trainerId,
        antique,
        auctionId,
        monsterName,
        discordUserId
      });
      return response.data;
    } catch (error) {
      console.error('Error auctioning antique:', error);
      throw error;
    }
  }
};

export default antiqueService;
