import api from './api';

/**
 * Service for Trade Center-related API calls
 */
const tradeService = {
  /**
   * Get all trade listings
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with trade listings
   */
  getTradeListings: async (params = {}) => {
    try {
      const response = await api.get('/town/trade/listings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trade listings:', error);
      throw error;
    }
  },

  /**
   * Get trade listing by ID
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object>} - Response with trade listing
   */
  getTradeListingById: async (listingId) => {
    try {
      const response = await api.get(`/town/trade/listings/${listingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trade listing ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Create a trade listing
   * @param {Object} listingData - Listing data
   * @returns {Promise<Object>} - Response with created listing
   */
  createTradeListing: async (listingData) => {
    try {
      const response = await api.post('/town/trade/create', listingData);
      return response.data;
    } catch (error) {
      console.error('Error creating trade listing:', error);
      throw error;
    }
  },

  /**
   * Offer a trade
   * @param {Object} offerData - Offer data
   * @returns {Promise<Object>} - Response with offer result
   */
  offerTrade: async (offerData) => {
    try {
      const response = await api.post('/town/trade/offer', offerData);
      return response.data;
    } catch (error) {
      console.error('Error offering trade:', error);
      throw error;
    }
  },

  /**
   * Accept a trade
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object>} - Response with accept result
   */
  acceptTrade: async (listingId) => {
    try {
      const response = await api.post(`/town/trade/accept/${listingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error accepting trade ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Reject a trade
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object>} - Response with reject result
   */
  rejectTrade: async (listingId) => {
    try {
      const response = await api.post(`/town/trade/reject/${listingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting trade ${listingId}:`, error);
      throw error;
    }
  },

  /**
   * Cancel a trade listing
   * @param {number} listingId - Listing ID
   * @returns {Promise<Object>} - Response with cancel result
   */
  cancelTradeListing: async (listingId) => {
    try {
      const response = await api.post(`/town/trade/cancel/${listingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling trade listing ${listingId}:`, error);
      throw error;
    }
  }
};

export default tradeService;
