import api from './api';

/**
 * Content management service
 */
const contentService = {
  /**
   * Get all content categories
   * @returns {Promise<Object>} Categories data
   */
  getCategories: async () => {
    try {
      const response = await api.get('/content/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching content categories:', error);
      throw error;
    }
  },

  /**
   * Get content for a specific file
   * @param {string} category - Category name (e.g., 'guides', 'lore')
   * @param {string} path - Path to the file or directory
   * @returns {Promise<Object>} Content data
   */
  getContent: async (category, path = '') => {
    try {
      const response = await api.get(`/content/${category}/${path}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for ${category}/${path}:`, error);
      throw error;
    }
  },

  /**
   * Save content
   * @param {string} category - Category name (e.g., 'guides', 'lore')
   * @param {string} path - Path to the file or directory
   * @param {Object} data - Content data
   * @param {string} data.content - Markdown content
   * @param {string} data.title - Content title
   * @returns {Promise<Object>} Response data
   */
  saveContent: async (category, path, data) => {
    try {
      const response = await api.post(`/content/${category}/${path}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error saving content for ${category}/${path}:`, error);
      throw error;
    }
  },

  /**
   * Delete content
   * @param {string} category - Category name (e.g., 'guides', 'lore')
   * @param {string} path - Path to the file or directory
   * @returns {Promise<Object>} Response data
   */
  deleteContent: async (category, path) => {
    try {
      const response = await api.delete(`/content/${category}/${path}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting content for ${category}/${path}:`, error);
      throw error;
    }
  },

  /**
   * Create directory
   * @param {string} category - Category name (e.g., 'guides', 'lore')
   * @param {string} path - Parent directory path
   * @param {string} name - Directory name
   * @returns {Promise<Object>} Response data
   */
  createDirectory: async (category, path, name) => {
    try {
      const response = await api.post(`/content/${category}/directory/${path}`, { name });
      return response.data;
    } catch (error) {
      console.error(`Error creating directory in ${category}/${path}:`, error);
      throw error;
    }
  }
};

export default contentService;
