import api from './api';

/**
 * Events Service for making events-related API requests
 */
const eventsService = {
  /**
   * Get all event categories
   * @returns {Promise<Object>} - Response with event categories
   */
  getEventCategories: async () => {
    try {
      const response = await api.get('/events/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching event categories:', error);
      throw error;
    }
  },

  /**
   * Get current events
   * @returns {Promise<Object>} - Response with current events data
   */
  getCurrentEvents: async () => {
    try {
      const response = await api.get('/events/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current events:', error);
      throw error;
    }
  },

  /**
   * Get past events
   * @returns {Promise<Object>} - Response with past events data
   */
  getPastEvents: async () => {
    try {
      const response = await api.get('/events/past');
      return response.data;
    } catch (error) {
      console.error('Error fetching past events:', error);
      throw error;
    }
  },

  /**
   * Get upcoming events
   * @returns {Promise<Object>} - Response with upcoming events data
   */
  getUpcomingEvents: async () => {
    try {
      const response = await api.get('/events/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  /**
   * Get specific event content by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Response with event content
   */
  getEventContent: async (eventId) => {
    try {
      const response = await api.get(`/events/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event content for ${eventId}:`, error);
      throw error;
    }
  }
};

export default eventsService;
