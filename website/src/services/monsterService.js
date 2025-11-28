import api from './api';

/**
 * Service for monster-related API calls
 */
const monsterService = {
  /**
   * Get all monsters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with monsters data
   */
  getAllMonsters: async (params = {}) => {
    try {
      const response = await api.get('/monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching monsters:', error);
      throw error;
    }
  },

  /**
   * Get monster by ID
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with monster data
   */
  getMonsterById: async (id) => {
    try {
      // Validate ID is not undefined, null, or 'undefined' string
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid monster ID provided to getMonsterById:', id);
        return {
          success: false,
          message: 'Invalid monster ID',
          data: null
        };
      }

      // Ensure ID is a valid number
      const monsterId = parseInt(id);
      if (isNaN(monsterId)) {
        console.error('Monster ID is not a valid number:', id);
        return {
          success: false,
          message: 'Monster ID must be a number',
          data: null
        };
      }

      console.log(`Making API request to /monsters/${monsterId}`);
      const response = await api.get(`/monsters/${monsterId}`);
      console.log('API response received:', response.data);

      // Ensure response has the expected format
      if (!response.data) {
        return {
          success: false,
          message: 'Empty response from API',
          data: null
        };
      }

      // If the API returns a success field, use that
      if (response.data.hasOwnProperty('success')) {
        return response.data;
      }

      // Otherwise, wrap the response in a success object
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching monster ${id}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch monster',
        data: null
      };
    }
  },

  /**
   * Create a new monster
   * @param {Object} monsterData - Monster data
   * @returns {Promise<Object>} - Response with created monster data
   */
  createMonster: async (monsterData) => {
    try {
      const response = await api.post('/monsters', monsterData);
      return response.data;
    } catch (error) {
      console.error('Error creating monster:', error);
      throw error;
    }
  },

  /**
   * Update a monster
   * @param {number} id - Monster ID
   * @param {Object} monsterData - Updated monster data
   * @returns {Promise<Object>} - Response with updated monster data
   */
  updateMonster: async (id, monsterData) => {
    try {
      const response = await api.put(`/monsters/${id}`, monsterData);
      return response.data;
    } catch (error) {
      console.error(`Error updating monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a monster
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with deletion status
   */
  deleteMonster: async (id) => {
    try {
      const response = await api.delete(`/monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Level up a monster
   * @param {number} id - Monster ID
   * @param {number} levels - Number of levels to add
   * @returns {Promise<Object>} - Response with updated monster data
   */
  levelUpMonster: async (id, levels = 1) => {
    try {
      const response = await api.post(`/monsters/${id}/level-up`, { levels });
      return response.data;
    } catch (error) {
      console.error(`Error leveling up monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Evolve a monster
   * @param {number} id - Monster ID
   * @param {Object} evolutionData - Evolution data
   * @param {File} imageFile - Image file (optional)
   * @returns {Promise<Object>} - Response with evolved monster data
   */
  evolveMonster: async (id, evolutionData, imageFile) => {
    try {
      // Create form data if image file is provided
      if (imageFile) {
        const formData = new FormData();

        // Add image file
        formData.append('image', imageFile);

        // Add other evolution data
        Object.keys(evolutionData).forEach(key => {
          formData.append(key, evolutionData[key]);
        });

        const response = await api.post(`/monsters/${id}/evolve`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return response.data;
      } else {
        // No image file, just send JSON data
        const response = await api.post(`/monsters/${id}/evolve`, evolutionData);
        return response.data;
      }
    } catch (error) {
      console.error(`Error evolving monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get evolution options for a monster
   * @param {number} id - Monster ID
   * @param {string} speciesSlot - Species slot (species1, species2, species3)
   * @returns {Promise<Object>} - Response with evolution options
   */
  getEvolutionOptions: async (id, speciesSlot = 'species1') => {
    try {
      const response = await api.get(`/monsters/${id}/evolution-options`, {
        params: { speciesSlot }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting evolution options for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get monster moves
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with monster moves data
   */
  getMonsterMoves: async (id) => {
    try {
      // Validate ID is not undefined, null, or 'undefined' string
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid monster ID provided to getMonsterMoves:', id);
        return {
          success: false,
          data: [],
          message: 'Invalid monster ID'
        };
      }

      // Ensure ID is a valid number
      const monsterId = parseInt(id);
      if (isNaN(monsterId)) {
        console.error('Monster ID is not a valid number:', id);
        return {
          success: false,
          data: [],
          message: 'Monster ID must be a number'
        };
      }

      console.log(`Making API request to /monsters/${monsterId}/moves`);
      const response = await api.get(`/monsters/${monsterId}/moves`);
      console.log('API moves response received:', response.data);

      // Ensure response has the expected format
      if (!response.data) {
        return {
          success: false,
          data: [],
          message: 'Empty response from API'
        };
      }

      // If the API returns a success field, use that
      if (response.data.hasOwnProperty('success')) {
        return response.data;
      }

      // Otherwise, wrap the response in a success object
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error(`Error fetching moves for monster ${id}:`, error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch monster moves'
      };
    }
  },

  /**
   * Update monster moves
   * @param {number} id - Monster ID
   * @param {Array} moves - Updated moves array
   * @returns {Promise<Object>} - Response with updated monster moves data
   */
  updateMonsterMoves: async (id, moves) => {
    try {
      const response = await api.put(`/monsters/${id}/moves`, { moves });
      return response.data;
    } catch (error) {
      console.error(`Error updating moves for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get monster evolution chain
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with evolution chain data
   */
  getMonsterEvolutionChain: async (id) => {
    try {
      // Validate ID is not undefined, null, or 'undefined' string
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid monster ID provided to getMonsterEvolutionChain:', id);
        return {
          success: false,
          data: [],
          message: 'Invalid monster ID'
        };
      }

      // Ensure ID is a valid number
      const monsterId = parseInt(id);
      if (isNaN(monsterId)) {
        console.error('Monster ID is not a valid number:', id);
        return {
          success: false,
          data: [],
          message: 'Monster ID must be a number'
        };
      }

      console.log(`Making API request to /monsters/${monsterId}/evolution-chain`);
      const response = await api.get(`/monsters/${monsterId}/evolution-chain`);
      console.log('API evolution chain response received:', response.data);

      // Ensure response has the expected format
      if (!response.data) {
        return {
          success: false,
          data: [],
          message: 'Empty response from API'
        };
      }

      // If the API returns a success field, use that
      if (response.data.hasOwnProperty('success')) {
        return response.data;
      }

      // Otherwise, wrap the response in a success object
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error(`Error fetching evolution chain for monster ${id}:`, error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch evolution chain'
      };
    }
  },

  /**
   * Get monster gallery images
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with gallery images data
   */
  getMonsterGallery: async (id) => {
    try {
      // Validate ID is not undefined, null, or 'undefined' string
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid monster ID provided to getMonsterGallery:', id);
        return {
          success: false,
          data: [],
          message: 'Invalid monster ID'
        };
      }

      // Ensure ID is a valid number
      const monsterId = parseInt(id);
      if (isNaN(monsterId)) {
        console.error('Monster ID is not a valid number:', id);
        return {
          success: false,
          data: [],
          message: 'Monster ID must be a number'
        };
      }

      console.log(`Making API request to /monsters/${monsterId}/gallery`);
      const response = await api.get(`/monsters/${monsterId}/gallery`);
      console.log('API gallery response received:', response.data);

      // Ensure response has the expected format
      if (!response.data) {
        return {
          success: false,
          data: [],
          message: 'Empty response from API'
        };
      }

      // If the API returns a success field, use that
      if (response.data.hasOwnProperty('success')) {
        return response.data;
      }

      // Otherwise, wrap the response in a success object
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error(`Error fetching gallery for monster ${id}:`, error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch gallery'
      };
    }
  },

  /**
   * Get monsters by trainer ID (admin version with more details)
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with monster data
   */
  getMonstersByTrainerId: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/monsters`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Add an image to a monster
   * @param {number} id - Monster ID
   * @param {Object} imageData - Image data
   * @returns {Promise<Object>} - Response with added image
   */
  addMonsterImage: async (id, imageData) => {
    try {
      const response = await api.post(`/monsters/${id}/images`, imageData);
      return response.data;
    } catch (error) {
      console.error(`Error adding image to monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get monster images
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with monster images
   */
  getMonsterImages: async (id) => {
    try {
      const response = await api.get(`/monsters/${id}/images`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching images for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get mega images for a monster
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with mega images
   */
  getMegaImages: async (id) => {
    try {
      const response = await api.get(`/monsters/${id}/mega-images`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching mega images for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add mega stone image to a monster
   * @param {number} id - Monster ID
   * @param {Object} imageData - Image data
   * @returns {Promise<Object>} - Response with added image
   */
  addMegaStoneImage: async (id, imageData) => {
    try {
      const response = await api.post(`/monsters/${id}/mega-stone-image`, imageData);
      return response.data;
    } catch (error) {
      console.error(`Error adding mega stone image to monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add mega image to a monster
   * @param {number} id - Monster ID
   * @param {Object} imageData - Image data
   * @returns {Promise<Object>} - Response with added image
   */
  addMegaImage: async (id, imageData) => {
    try {
      const response = await api.post(`/monsters/${id}/mega-image`, imageData);
      return response.data;
    } catch (error) {
      console.error(`Error adding mega image to monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Set monster evolution data
   * @param {number} id - Monster ID
   * @param {Object} evolutionData - Evolution data
   * @returns {Promise<Object>} - Response with evolution data
   */
  setMonsterEvolutionData: async (id, evolutionData) => {
    try {
      const response = await api.post(`/monsters/${id}/evolution`, { evolution_data: evolutionData });
      return response.data;
    } catch (error) {
      console.error(`Error setting evolution data for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get monster evolution data
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with evolution data
   */
  getMonsterEvolutionData: async (id) => {
    try {
      const response = await api.get(`/monsters/${id}/evolution`);
      return response.data;
    } catch (error) {
      console.error(`Error getting evolution data for monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all trainers (for monster assignment)
   * @returns {Promise<Object>} - Response with trainers data
   */
  getAllTrainers: async () => {
    try {
      const response = await api.get('/trainers/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching trainers:', error);
      throw error;
    }
  },

  /**
   * Get all fakemon (for monster species selection)
   * @returns {Promise<Object>} - Response with fakemon data
   */
  getAllFakemon: async () => {
    try {
      const response = await api.get('/fakedex', { params: { limit: 1000 } });
      return response.data;
    } catch (error) {
      console.error('Error fetching fakemon:', error);
      throw error;
    }
  },

  /**
   * Get all types (for monster type selection)
   * @returns {Promise<Object>} - Response with types data
   */
  getAllTypes: async () => {
    try {
      const response = await api.get('/fakedex/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching types:', error);
      throw error;
    }
  },

  /**
   * Initialize a monster with stats, moves, etc.
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with initialized monster
   */
  initializeMonster: async (id) => {
    try {
      const response = await api.post(`/monsters/${id}/initialize`);
      return response.data;
    } catch (error) {
      console.error(`Error initializing monster ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get monsters by trainer ID (non-paginated, for dropdowns and forms)
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with monster data
   */
  getTrainerMonsters: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/monsters/all`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get monsters by trainer ID with pagination (for listing pages)
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} - Response with monster data
   */
  getTrainerMonstersPaginated: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/monsters`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching paginated monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Initialize a monster from breeding
   * @param {number} trainerId - Trainer ID
   * @param {Object} monster - Monster data
   * @returns {Promise<Object>} - Response with initialized monster
   */
  initializeBreedingMonster: async (trainerId, monster) => {
    try {
      const response = await api.post('/monsters/initialize', {
        trainerId,
        monster,
        context: 'breeding'
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing breeding monster:', error);
      throw error;
    }
  },

  /**
   * Search monsters by name, species, or trainer name
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} - Response with search results
   */
  searchMonsters: async (searchTerm, limit = 10) => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: true,
          data: []
        };
      }

      const response = await api.get('/monsters/search', { 
        params: { 
          search: searchTerm.trim(),
          limit: limit
        } 
      });

      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Error searching monsters:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to search monsters'
      };
    }
  },

  /**
   * Get monster lineage
   * @param {number} id - Monster ID
   * @returns {Promise<Object>} - Response with lineage data
   */
  getMonsterLineage: async (id) => {
    try {
      // Validate ID is not undefined, null, or 'undefined' string
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid monster ID provided to getMonsterLineage:', id);
        return {
          success: false,
          data: null,
          message: 'Invalid monster ID'
        };
      }

      // Ensure ID is a valid number
      const monsterId = parseInt(id);
      if (isNaN(monsterId)) {
        console.error('Monster ID is not a valid number:', id);
        return {
          success: false,
          data: null,
          message: 'Monster ID must be a number'
        };
      }

      console.log(`Making API request to /monsters/${monsterId}/lineage`);
      const response = await api.get(`/monsters/${monsterId}/lineage`);
      console.log('API lineage response received:', response.data);

      // Ensure response has the expected format
      if (!response.data) {
        return {
          success: false,
          data: null,
          message: 'Empty response from API'
        };
      }

      // If the API returns a success field, use that
      if (response.data.hasOwnProperty('success')) {
        return response.data;
      }

      // Otherwise, wrap the response in a success object
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching lineage for monster ${id}:`, error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch lineage'
      };
    }
  },

  /**
   * Add manual lineage relationship
   * @param {number} monsterId - Monster ID
   * @param {number} relatedMonsterId - Related monster ID
   * @param {string} relationshipType - Type of relationship (parent, child, sibling)
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} - Response with created relationship data
   */
  addLineageRelationship: async (monsterId, relatedMonsterId, relationshipType, notes = '') => {
    try {
      const response = await api.post(`/monsters/${monsterId}/lineage`, {
        related_monster_id: relatedMonsterId,
        relationship_type: relationshipType,
        notes: notes
      });
      return response.data;
    } catch (error) {
      console.error('Error adding lineage relationship:', error);
      throw error;
    }
  },

  /**
   * Remove lineage relationship
   * @param {number} monsterId - Monster ID
   * @param {number} relatedMonsterId - Related monster ID
   * @param {string} relationshipType - Type of relationship to remove
   * @returns {Promise<Object>} - Response confirming removal
   */
  removeLineageRelationship: async (monsterId, relatedMonsterId, relationshipType) => {
    try {
      const response = await api.delete(`/monsters/${monsterId}/lineage`, {
        data: {
          related_monster_id: relatedMonsterId,
          relationship_type: relationshipType
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing lineage relationship:', error);
      throw error;
    }
  }
};

export default monsterService;
