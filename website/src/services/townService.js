import api from './api';

/**
 * Service for town-related API calls
 */
const townService = {
  /**
   * Get town information
   * @returns {Promise<Object>} - Response with town data
   */
  getTownInfo: async () => {
    try {
      const response = await api.get('/town');
      return response.data;
    } catch (error) {
      console.error('Error fetching town info:', error);
      throw error;
    }
  },

  /**
   * Get town locations
   * @returns {Promise<Object>} - Response with town locations
   */
  getTownLocations: async () => {
    try {
      const response = await api.get('/town/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching town locations:', error);
      throw error;
    }
  },

  /**
   * Get location details
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} - Response with location details
   */
  getLocationDetails: async (locationId) => {
    try {
      const response = await api.get(`/town/locations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching location details for ${locationId}:`, error);
      throw error;
    }
  },

  /**
   * Get shop items
   * @param {string} shopId - Shop ID
   * @param {Object} params - Query parameters (category, page, limit, sort)
   * @returns {Promise<Object>} - Response with shop items
   */
  getShopItems: async (shopId, params = {}) => {
    try {
      const response = await api.get(`/town/shops/${shopId}/items`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching items for shop ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * Purchase item
   * @param {string} shopId - Shop ID
   * @param {number} itemId - Item ID
   * @param {number} quantity - Quantity to purchase
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with purchase result
   */
  purchaseItem: async (shopId, itemId, quantity, trainerId) => {
    try {
      const response = await api.post(`/town/shops/${shopId}/purchase`, {
        itemId,
        quantity,
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error purchasing item ${itemId} from shop ${shopId}:`, error);
      throw error;
    }
  },

  /**
   * Get adoption center monsters - DEPRECATED, use adoptionService instead
   * @param {Object} params - Query parameters (page, limit, sort)
   * @returns {Promise<Object>} - Response with adoption center monsters
   * @deprecated Use adoptionService.getCurrentMonthAdopts() instead
   */
  getAdoptionCenterMonsters: async (params = {}) => {
    console.warn('townService.getAdoptionCenterMonsters is deprecated. Use adoptionService.getCurrentMonthAdopts() instead.');
    try {
      const response = await api.get('/adoption/current', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching adoption center monsters:', error);
      throw error;
    }
  },

  /**
   * Adopt monster - DEPRECATED, use adoptionService instead
   * @param {number} monsterId - Monster ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with adoption result
   * @deprecated Use adoptionService.claimAdopt() instead
   */
  adoptMonster: async (monsterId, trainerId) => {
    console.warn('townService.adoptMonster is deprecated. Use adoptionService.claimAdopt() instead.');
    try {
      const response = await api.post(`/adoption/claim`, {
        adoptId: monsterId,
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error adopting monster ${monsterId}:`, error);
      throw error;
    }
  },

  /**
   * Get garden state
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with garden state
   */
  getGardenState: async (trainerId) => {
    try {
      const response = await api.get(`/town/garden/${trainerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching garden state for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Tend garden
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with tend result
   */
  tendGarden: async (trainerId) => {
    try {
      const response = await api.post(`/town/garden/${trainerId}/tend`);
      return response.data;
    } catch (error) {
      console.error(`Error tending garden for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Harvest garden
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with harvest result
   */
  harvestGarden: async (trainerId) => {
    try {
      const response = await api.post(`/town/garden/${trainerId}/harvest`);
      return response.data;
    } catch (error) {
      console.error(`Error harvesting garden for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get garden points
   * @returns {Promise<Object>} - Response with garden points
   */
  getGardenPoints: async () => {
    try {
      const response = await api.get('/garden/points');
      return response.data;
    } catch (error) {
      console.error('Error fetching garden points:', error);
      throw error;
    }
  },

  /**
   * Start garden harvest
   * @returns {Promise<Object>} - Response with harvest session
   */
  startGardenHarvest: async () => {
    try {
      const response = await api.post('/garden/harvest');
      return response.data;
    } catch (error) {
      console.error('Error starting garden harvest:', error);
      throw error;
    }
  },

  /**
   * Get garden harvest session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Response with session details
   */
  getGardenHarvestSession: async (sessionId) => {
    try {
      const response = await api.get(`/garden/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching garden harvest session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Claim garden harvest reward
   * @param {string} sessionId - Session ID
   * @param {string} rewardId - Reward ID
   * @param {number} trainerId - Trainer ID
   * @param {string} monsterName - Monster name (optional, for monster rewards)
   * @returns {Promise<Object>} - Response with claim result
   */
  claimGardenHarvestReward: async (sessionId, rewardId, trainerId, monsterName = '') => {
    try {
      const response = await api.post('/garden/claim', {
        sessionId,
        rewardId,
        trainerId,
        monsterName
      });
      return response.data;
    } catch (error) {
      console.error(`Error claiming garden harvest reward ${rewardId}:`, error);
      throw error;
    }
  },

  /**
   * Forfeit a garden harvest monster reward to the bazar
   * @param {string} sessionId - Harvest session ID
   * @param {string} rewardId - Reward ID
   * @param {string} monsterName - Monster name
   * @returns {Promise<Object>} - Response with forfeit result
   */
  forfeitGardenHarvestMonster: async (sessionId, rewardId, monsterName = '') => {
    try {
      const response = await api.post('/garden/forfeit', {
        sessionId,
        rewardId,
        monsterName
      });
      return response.data;
    } catch (error) {
      console.error(`Error forfeiting garden harvest monster ${rewardId}:`, error);
      throw error;
    }
  },

  /**
   * Get farm state
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with farm state
   */
  getFarmState: async (trainerId) => {
    try {
      const response = await api.get(`/town/farm/${trainerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching farm state for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get farm prompts
   * @returns {Promise<Object>} - Response with farm prompts
   */
  getFarmPrompts: async () => {
    try {
      const response = await api.get('/town/farm/prompts');
      return response.data;
    } catch (error) {
      console.error('Error fetching farm prompts:', error);
      throw error;
    }
  },

  /**
   * Complete farm work
   * @param {number} trainerId - Trainer ID
   * @param {number} promptId - Prompt ID
   * @returns {Promise<Object>} - Response with work result
   */
  completeFarmWork: async (trainerId, promptId) => {
    try {
      const response = await api.post(`/town/farm/work`, {
        trainerId,
        promptId
      });
      return response.data;
    } catch (error) {
      console.error(`Error completing farm work for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Breed monsters
   * @param {number} trainerId - Trainer ID
   * @param {number} parent1Id - First parent monster ID
   * @param {number} parent2Id - Second parent monster ID
   * @returns {Promise<Object>} - Response with breeding result
   */
  breedMonsters: async (trainerId, parent1Id, parent2Id) => {
    try {
      const response = await api.post(`/town/farm/breed`, {
        trainerId,
        parent1Id,
        parent2Id
      });
      return response.data;
    } catch (error) {
      console.error(`Error breeding monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get game corner state
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Response with game corner state
   */
  getGameCornerState: async (userId) => {
    try {
      const response = await api.get(`/town/game-corner/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching game corner state for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Start pomodoro session
   * @param {number} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} - Response with session result
   */
  startPomodoroSession: async (userId, sessionData) => {
    try {
      const response = await api.post(`/town/game-corner/pomodoro/start`, {
        userId,
        ...sessionData
      });
      return response.data;
    } catch (error) {
      console.error(`Error starting pomodoro session for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Complete pomodoro session
   * @param {number} sessionId - Session ID
   * @param {string} category - Productivity category
   * @returns {Promise<Object>} - Response with completion result
   */
  completePomodoroSession: async (sessionId, category) => {
    try {
      const response = await api.post(`/town/game-corner/pomodoro/complete`, {
        sessionId,
        category
      });
      return response.data;
    } catch (error) {
      console.error(`Error completing pomodoro session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Claim pomodoro rewards
   * @param {number} sessionId - Session ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with reward result
   */
  claimPomodoroRewards: async (sessionId, trainerId) => {
    try {
      const response = await api.post(`/town/game-corner/pomodoro/claim-reward`, {
        sessionId,
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error claiming pomodoro rewards for session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Get trade center listings
   * @param {Object} params - Query parameters (status, page, limit, sort)
   * @returns {Promise<Object>} - Response with trade listings
   */
  getTradeListings: async (params = {}) => {
    try {
      const response = await api.get('/town/trade-center/listings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trade listings:', error);
      throw error;
    }
  },

  /**
   * Create trade listing
   * @param {Object} tradeData - Trade data
   * @returns {Promise<Object>} - Response with created trade
   */
  createTradeListing: async (tradeData) => {
    try {
      const response = await api.post('/town/trade-center/listings', tradeData);
      return response.data;
    } catch (error) {
      console.error('Error creating trade listing:', error);
      throw error;
    }
  },

  /**
   * Get trade details
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object>} - Response with trade details
   */
  getTradeDetails: async (tradeId) => {
    try {
      const response = await api.get(`/town/trade-center/listings/${tradeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trade details for ${tradeId}:`, error);
      throw error;
    }
  },

  /**
   * Accept trade
   * @param {number} tradeId - Trade ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trade result
   */
  acceptTrade: async (tradeId, trainerId) => {
    try {
      const response = await api.post(`/town/trade-center/listings/${tradeId}/accept`, {
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error accepting trade ${tradeId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel trade
   * @param {number} tradeId - Trade ID
   * @returns {Promise<Object>} - Response with cancellation result
   */
  cancelTrade: async (tradeId) => {
    try {
      const response = await api.post(`/town/trade-center/listings/${tradeId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error cancelling trade ${tradeId}:`, error);
      throw error;
    }
  },

  /**
   * Get town events
   * @param {Object} params - Query parameters (status, page, limit, sort)
   * @returns {Promise<Object>} - Response with town events
   */
  getTownEvents: async (params = {}) => {
    try {
      const response = await api.get('/town/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching town events:', error);
      throw error;
    }
  },

  /**
   * Get town event details
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} - Response with event details
   */
  getTownEventDetails: async (eventId) => {
    try {
      const response = await api.get(`/town/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching town event details for ${eventId}:`, error);
      throw error;
    }
  }
};

export default townService;
