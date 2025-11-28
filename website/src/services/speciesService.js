import api from './api';

/**
 * Service for species-related API calls
 */
const speciesService = {
  /**
   * Get images for a list of species
   * @param {Array} speciesList - List of species names
   * @returns {Promise<Object>} - Response with species images
   */
  getSpeciesImages: async (speciesList) => {
    try {
      if (!speciesList || speciesList.length === 0) {
        return { success: true, speciesImages: {} };
      }

      const response = await api.get(`/species/images?species=${speciesList.join(',')}`);
      
      // Convert the array of images to an object with species as keys
      const speciesImages = {};
      if (response.data && response.data.success && response.data.images) {
        response.data.images.forEach(img => {
          speciesImages[img.species] = {
            image_url: img.url,
            species: img.species
          };
        });
      }
      
      return { 
        success: true, 
        speciesImages 
      };
    } catch (error) {
      console.error('Error fetching species images:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to fetch species images',
        speciesImages: {}
      };
    }
  },

  /**
   * Get random species
   * @param {number} count - Number of species to get
   * @returns {Promise<Object>} - Response with random species
   */
  getRandomSpecies: async (count = 10) => {
    try {
      const response = await api.get(`/species/random?count=${count}`);
      return response.data;
    } catch (error) {
      console.error('Error getting random species:', error);
      throw error;
    }
  },

  /**
   * Get species list
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with species list
   */
  getSpeciesList: async (params = {}) => {
    try {
      const response = await api.get('/species/list', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting species list:', error);
      throw error;
    }
  },

  /**
   * Search species
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Response with search results
   */
  searchSpecies: async (query) => {
    try {
      const response = await api.get(`/species/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching species:', error);
      throw error;
    }
  }
};

export default speciesService;
