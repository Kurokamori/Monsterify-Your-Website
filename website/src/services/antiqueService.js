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
  },

  // ========== Admin CRUD Methods ==========

  /**
   * Get all antiques for dropdown (admin only)
   * @returns {Promise<Object>} - Response with antiques list with holidays
   */
  getAllAntiquesDropdown: async () => {
    try {
      const response = await api.get('/antiques/all-antiques');
      return response.data;
    } catch (error) {
      console.error('Error fetching antiques dropdown:', error);
      throw error;
    }
  },

  /**
   * Get antique auction by ID (admin only)
   * @param {number} id - Auction ID
   * @returns {Promise<Object>} - Response with auction data
   */
  getAntiqueAuctionById: async (id) => {
    try {
      const response = await api.get(`/antiques/auctions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching antique auction with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new antique auction (admin only)
   * @param {Object} auctionData - Auction data
   * @returns {Promise<Object>} - Response with created auction
   */
  createAntiqueAuction: async (auctionData) => {
    try {
      const response = await api.post('/antiques/auctions', auctionData);
      return response.data;
    } catch (error) {
      console.error('Error creating antique auction:', error);
      throw error;
    }
  },

  /**
   * Update an antique auction (admin only)
   * @param {number} id - Auction ID
   * @param {Object} auctionData - Auction data
   * @returns {Promise<Object>} - Response with updated auction
   */
  updateAntiqueAuction: async (id, auctionData) => {
    try {
      const response = await api.put(`/antiques/auctions/${id}`, auctionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating antique auction with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an antique auction (admin only)
   * @param {number} id - Auction ID
   * @returns {Promise<Object>} - Response with deletion result
   */
  deleteAntiqueAuction: async (id) => {
    try {
      const response = await api.delete(`/antiques/auctions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting antique auction with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Upload an image for antique auction (admin only)
   * @param {File} image - Image file
   * @returns {Promise<Object>} - Response with uploaded image URL
   */
  uploadImage: async (image) => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post('/antiques/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading antique image:', error);
      throw error;
    }
  }
};

export default antiqueService;
