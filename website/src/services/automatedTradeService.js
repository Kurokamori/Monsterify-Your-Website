import api from './api';

/**
 * Service for Automated Trade Center-related API calls
 */
const automatedTradeService = {
  /**
   * Execute an automated trade between trainers
   * @param {Object} tradeData - Trade data
   * @param {number} tradeData.fromTrainerId - Source trainer ID
   * @param {number} tradeData.toTrainerId - Target trainer ID
   * @param {Object} tradeData.fromItems - Items from source trainer
   * @param {Object} tradeData.toItems - Items from target trainer
   * @param {Array} tradeData.fromMonsters - Monster IDs from source trainer
   * @param {Array} tradeData.toMonsters - Monster IDs from target trainer
   * @returns {Promise<Object>} - Response with trade result
   */
  executeAutomatedTrade: async (tradeData) => {
    try {
      const response = await api.post('/town/automated-trade/execute', tradeData);
      return response.data;
    } catch (error) {
      console.error('Error executing automated trade:', error);
      throw error;
    }
  },

  /**
   * Get trade history for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with trade history
   */
  getTradeHistory: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/town/automated-trade/history/${trainerId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching trade history for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get all trainers available for trading
   * @returns {Promise<Object>} - Response with available trainers
   */
  getAvailableTrainers: async () => {
    try {
      const response = await api.get('/town/automated-trade/trainers');
      return response.data;
    } catch (error) {
      console.error('Error fetching available trainers:', error);
      throw error;
    }
  },

  /**
   * Get trainer's monsters available for trading
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's monsters
   */
  getTrainerMonsters: async (trainerId) => {
    try {
      const response = await api.get(`/town/automated-trade/trainers/${trainerId}/monsters`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer's inventory available for trading
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's inventory
   */
  getTrainerInventory: async (trainerId) => {
    try {
      const response = await api.get(`/town/automated-trade/trainers/${trainerId}/inventory`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }
};

export default automatedTradeService;
