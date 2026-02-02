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
  },

  /**
   * Get all berry items with images
   * @returns {Promise<Object>} Berry items with image_url
   */
  getBerryItems: async () => {
    try {
      const response = await api.get('/items', {
        params: {
          category: 'Berry',
          limit: 1000
        }
      });
      if (response.data.success) {
        // Create a map of berry name to image URL
        const berryImages = {};
        (response.data.data || []).forEach(item => {
          berryImages[item.name] = item.image_url || null;
        });
        return { success: true, berryImages };
      }
      return { success: false, berryImages: {} };
    } catch (error) {
      console.error('Error fetching berry items:', error);
      return { success: false, berryImages: {} };
    }
  },

  /**
   * Get all pastry items with images
   * @returns {Promise<Object>} Pastry items with image_url
   */
  getPastryItems: async () => {
    try {
      const response = await api.get('/items', {
        params: {
          category: 'Pastry',
          limit: 1000
        }
      });
      if (response.data.success) {
        // Create a map of pastry name to image URL
        const pastryImages = {};
        (response.data.data || []).forEach(item => {
          pastryImages[item.name] = item.image_url || null;
        });
        return { success: true, pastryImages };
      }
      return { success: false, pastryImages: {} };
    } catch (error) {
      console.error('Error fetching pastry items:', error);
      return { success: false, pastryImages: {} };
    }
  },

  /**
   * Get all berry and pastry items with images in a single call
   * @returns {Promise<Object>} Object with berryImages and pastryImages maps
   */
  getBerryAndPastryImages: async () => {
    try {
      // Fetch all items to find berries and pastries (categories may vary)
      const response = await api.get('/items', { params: { limit: 2000 } });

      const berryImages = {};
      const pastryImages = {};

      if (response.data.success) {
        (response.data.data || []).forEach(item => {
          const name = item.name || '';
          const category = (item.category || '').toLowerCase();
          const hasImage = item.image_url || null;

          // Match berries by category or name pattern
          if (category.includes('berry') || category.includes('berries') ||
              name.toLowerCase().includes('berry')) {
            berryImages[name] = hasImage;
          }
          // Match pastries by category or name pattern
          if (category.includes('pastry') || category.includes('pastries') ||
              name.toLowerCase().includes('pastry')) {
            pastryImages[name] = hasImage;
          }
        });
      }

      console.log('Fetched berry images:', Object.keys(berryImages).length);
      console.log('Fetched pastry images:', Object.keys(pastryImages).length);

      return { success: true, berryImages, pastryImages };
    } catch (error) {
      console.error('Error fetching berry and pastry items:', error);
      return { success: false, berryImages: {}, pastryImages: {} };
    }
  }
};

export default itemsApi;
