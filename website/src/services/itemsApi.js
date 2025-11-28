import api from './api';

/**
 * Items API service
 */
const itemsApi = {
  /**
   * Get all items with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated items
   */
  getItems: async (params = {}) => {
    try {
      const response = await api.get('/items', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  /**
   * Get item by ID
   * @param {number} id - Item ID
   * @returns {Promise<Object>} Item
   */
  getItemById: async (id) => {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all categories
   * @returns {Promise<Array<string>>} Categories
   */
  getCategories: async () => {
    try {
      const response = await api.get('/items/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Get all types
   * @returns {Promise<Array<string>>} Types
   */
  getTypes: async () => {
    try {
      const response = await api.get('/items/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching types:', error);
      throw error;
    }
  },

  /**
   * Get all rarities
   * @returns {Promise<Array<string>>} Rarities
   */
  getRarities: async () => {
    try {
      const response = await api.get('/items/rarities');
      return response.data;
    } catch (error) {
      console.error('Error fetching rarities:', error);
      throw error;
    }
  },

  /**
   * Create a new item
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Created item
   */
  createItem: async (item) => {
    try {
      const response = await api.post('/items', item);
      return response.data;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  },

  /**
   * Create multiple items
   * @param {Array<Object>} items - Array of item data
   * @returns {Promise<Object>} Created items
   */
  createBulkItems: async (items) => {
    try {
      const response = await api.post('/items/bulk', { items });
      return response.data;
    } catch (error) {
      console.error('Error creating items in bulk:', error);
      throw error;
    }
  },

  /**
   * Upload an image
   * @param {File} image - Image file
   * @returns {Promise<Object>} Uploaded image data
   */
  uploadImage: async (image) => {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post('/items/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Update an item
   * @param {number} id - Item ID
   * @param {Object} item - Item data
   * @returns {Promise<Object>} Updated item
   */
  updateItem: async (id, item) => {
    try {
      const response = await api.put(`/items/${id}`, item);
      return response.data;
    } catch (error) {
      console.error(`Error updating item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item
   * @param {number} id - Item ID
   * @returns {Promise<Object>} Success message
   */
  deleteItem: async (id) => {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting item with ID ${id}:`, error);
      throw error;
    }
  }
};

export default itemsApi;
