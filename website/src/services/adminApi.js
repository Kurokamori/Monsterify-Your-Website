import api from './api';

/**
 * Admin API service
 * Contains methods for admin-specific API calls
 */
const adminApi = {
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
   * Get all trainers with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated trainers
   */
  getTrainers: async (params = {}) => {
    try {
      const response = await api.get('/trainers', { params });
      // Ensure consistent response format
      return {
        data: {
          success: response.data.success || true,
          data: response.data.data || response.data.trainers || response.data,
          totalPages: response.data.totalPages || 1,
          message: response.data.message || ''
        }
      };
    } catch (error) {
      console.error('Error fetching trainers:', error);
      throw error;
    }
  },

  /**
   * Get trainer by ID
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} Trainer details
   */
  getTrainerById: async (id) => {
    try {
      const response = await api.get(`/trainers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new trainer
   * @param {Object} trainerData - Trainer data
   * @returns {Promise<Object>} Created trainer
   */
  createTrainer: async (trainerData) => {
    try {
      const response = await api.post('/trainers', trainerData);
      return response.data;
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw error;
    }
  },

  /**
   * Update a trainer
   * @param {number} id - Trainer ID
   * @param {Object} trainerData - Updated trainer data
   * @returns {Promise<Object>} Updated trainer
   */
  updateTrainer: async (id, trainerData) => {
    try {
      const response = await api.put(`/trainers/${id}`, trainerData);
      return response.data;
    } catch (error) {
      console.error(`Error updating trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a trainer
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} Response data
   */
  deleteTrainer: async (id) => {
    try {
      const response = await api.delete(`/trainers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer inventory
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} Trainer inventory
   */
  getTrainerInventory: async (id) => {
    try {
      const response = await api.get(`/trainers/${id}/inventory`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory for trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer monsters
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} Trainer monsters
   */
  getTrainerMonsters: async (id) => {
    try {
      const response = await api.get(`/trainers/${id}/monsters`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching monsters for trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated monsters
   */
  getMonsters: async (params = {}) => {
    try {
      const response = await api.get('/monsters', { params });
      // Ensure consistent response format
      return {
        data: {
          success: response.data.success || true,
          data: response.data.data || response.data.monsters || response.data,
          totalPages: response.data.totalPages || 1,
          message: response.data.message || ''
        }
      };
    } catch (error) {
      console.error('Error fetching monsters:', error);
      throw error;
    }
  }
};

export default adminApi;

