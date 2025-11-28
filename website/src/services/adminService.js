import api from './api';

/**
 * Admin API service
 * Contains methods for admin-specific API calls
 */
const adminService = {
  /**
   * Get admin dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Get all users for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated users
   */
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      throw error;
    }
  },

  /**
   * Get all trainers for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated trainers
   */
  getTrainers: async (params = {}) => {
    try {
      const response = await api.get('/api/trainers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trainers for admin:', error);
      throw error;
    }
  },

  /**
   * Get all monsters for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated monsters
   */
  getMonsters: async (params = {}) => {
    try {
      const response = await api.get('/api/monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching monsters for admin:', error);
      throw error;
    }
  },

  /**
   * Get all fakemon for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated fakemon
   */
  getFakemon: async (params = {}) => {
    try {
      const response = await api.get('/api/fakedex', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching fakemon for admin:', error);
      throw error;
    }
  },

  /**
   * Get all submissions for admin management
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated submissions
   */
  getSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/api/submissions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions for admin:', error);
      throw error;
    }
  },

  /**
   * Bulk add monsters to a trainer
   * @param {Object} data - { trainer_id, monsters_text }
   * @returns {Promise<Object>} Results of bulk add operation
   */
  bulkAddMonsters: async (data) => {
    try {
      const response = await api.post('/admin/monsters/bulk-add', data);
      return response.data;
    } catch (error) {
      console.error('Error bulk adding monsters:', error);
      throw error;
    }
  }
};

export default adminService;
