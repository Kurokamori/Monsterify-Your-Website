import api from './api';

/**
 * User service for managing users
 */
const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} - Array of users
   */
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data.users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>} - User object
   */
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.user;
    } catch (error) {
      console.error(`Error getting user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.display_name - Display name (optional)
   * @param {string} userData.discord_id - Discord ID (optional)
   * @param {string} userData.password - Password
   * @param {boolean} userData.is_admin - Is admin (optional)
   * @returns {Promise<Object>} - Created user
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data.user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update a user
   * @param {number} id - User ID
   * @param {Object} userData - User data to update
   * @param {string} userData.username - Username
   * @param {string} userData.display_name - Display name (optional)
   * @param {string} userData.discord_id - Discord ID (optional)
   * @param {string} userData.password - Password (optional)
   * @param {boolean} userData.is_admin - Is admin (optional)
   * @returns {Promise<Object>} - Updated user
   */
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data.user;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<Object>} - Response object
   */
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }
};

export default userService;
