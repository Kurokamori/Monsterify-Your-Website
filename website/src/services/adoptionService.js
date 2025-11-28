import api from './api';

/**
 * Service for adoption-related API calls
 */
const adoptionService = {
  /**
   * Get monthly adopts for the current month
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  getCurrentMonthAdopts: async (params = {}) => {
    try {
      const response = await api.get('/adoption/current', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting current month adopts:', error);
      throw error;
    }
  },

  /**
   * Get all monthly adopts with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  getAllAdopts: async (params = {}) => {
    try {
      const response = await api.get('/adoption', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting all adopts:', error);
      throw error;
    }
  },

  /**
   * Get monthly adopts for a specific year and month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Number of adopts per page
   * @returns {Promise<Object>} - Object containing adopts and pagination info
   */
  getAdoptsByYearAndMonth: async (year, month, params = {}) => {
    try {
      const response = await api.get(`/adoption/${year}/${month}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting adopts by year and month:', error);
      throw error;
    }
  },

  /**
   * Claim a monthly adopt
   * @param {number} adoptId - Adopt ID
   * @param {number} trainerId - Trainer ID
   * @param {string} monsterName - Monster name
   * @param {string} discordUserId - Discord user ID
   * @param {string} berryName - Berry name (optional)
   * @param {string} pastryName - Pastry name (optional)
   * @param {string} speciesValue - Species value for berry/pastry (optional)
   * @param {string} typeValue - Type value for berry/pastry (optional)
   * @returns {Promise<Object>} - Result of claiming
   */
  claimAdopt: async (adoptId, trainerId, monsterName, discordUserId, berryName = null, pastryName = null, speciesValue = null, typeValue = null) => {
    try {
      const response = await api.post('/adoption/claim', {
        adoptId,
        trainerId,
        monsterName,
        discordUserId,
        berryName,
        pastryName,
        speciesValue,
        typeValue
      });
      return response.data;
    } catch (error) {
      console.error('Error claiming adopt:', error);
      throw error;
    }
  },

  /**
   * Check if a trainer has a daycare daypass
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Object with hasDaypass and daypassCount properties
   */
  checkDaycareDaypass: async (trainerId) => {
    try {
      const response = await api.get(`/adoption/check-daypass/${trainerId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking daycare daypass:', error);
      throw error;
    }
  },

  /**
   * Get list of months with adoption data
   * @returns {Promise<Array>} - Array of objects with year and month
   */
  getMonthsWithData: async () => {
    try {
      const response = await api.get('/adoption/months');
      return response.data;
    } catch (error) {
      console.error('Error getting months with adoption data:', error);
      throw error;
    }
  },

  /**
   * Generate monthly adopts for the current month (admin only)
   * @returns {Promise<Object>} - Result of generation
   */
  generateMonthlyAdopts: async () => {
    try {
      const response = await api.post('/adoption/generate');
      return response.data;
    } catch (error) {
      console.error('Error generating monthly adopts:', error);
      throw error;
    }
  },

  /**
   * Generate test data for past months (admin only)
   * @param {number} monthsCount - Number of past months to generate data for
   * @returns {Promise<Object>} - Result of generation
   */
  generateTestData: async (monthsCount = 3) => {
    try {
      const response = await api.post('/adoption/generate-test-data', {
        monthsCount
      });
      return response.data;
    } catch (error) {
      console.error('Error generating test data:', error);
      throw error;
    }
  },

  /**
   * Use a berry on a monster
   * @param {number} monsterId - Monster ID
   * @param {string} berryName - Berry name
   * @param {number} trainerId - Trainer ID
   * @param {string} speciesValue - Species value (for species berries)
   * @returns {Promise<Object>} - Result of using berry
   */
  useBerry: async (monsterId, berryName, trainerId, speciesValue = null) => {
    try {
      const response = await api.post('/items/use-berry', {
        monsterId,
        berryName,
        trainerId,
        speciesValue
      });
      return response.data;
    } catch (error) {
      console.error('Error using berry:', error);
      throw error;
    }
  },

  /**
   * Use a pastry on a monster
   * @param {number} monsterId - Monster ID
   * @param {string} pastryName - Pastry name
   * @param {number} trainerId - Trainer ID
   * @param {string} selectedValue - Selected value for the pastry
   * @returns {Promise<Object>} - Result of using pastry
   */
  usePastry: async (monsterId, pastryName, trainerId, selectedValue) => {
    try {
      const response = await api.post('/items/use-pastry', {
        monsterId,
        pastryName,
        trainerId,
        selectedValue
      });
      return response.data;
    } catch (error) {
      console.error('Error using pastry:', error);
      throw error;
    }
  },

  /**
   * Roll random species
   * @param {number} count - Number of species to roll
   * @returns {Promise<Object>} - Result with array of species
   */
  rollRandomSpecies: async (count = 10) => {
    try {
      const response = await api.get(`/species/random?count=${count}`);
      return response.data;
    } catch (error) {
      console.error('Error rolling random species:', error);
      throw error;
    }
  },

  /**
   * Get species list
   * @returns {Promise<Object>} - Result with array of species
   */
  getSpeciesList: async () => {
    try {
      const response = await api.get('/species/list');
      return response.data;
    } catch (error) {
      console.error('Error getting species list:', error);
      throw error;
    }
  }
};

export default adoptionService;
