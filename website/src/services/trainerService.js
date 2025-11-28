import api from './api';

/**
 * Service for trainer-related API calls
 */
const trainerService = {
  /**
   * Get all trainers (non-paginated, for dropdowns and forms)
   * @param {Object} params - Query parameters (sort_by, sort_order, search)
   * @returns {Promise<Object>} - Response with trainers data
   */
  getAllTrainers: async (params = {}) => {
    try {
      // Use the new /trainers/all endpoint for forms to get all trainers without pagination
      const response = await api.get('/trainers/all', { params });

      // Handle different response formats
      console.log('Trainer list API response:', response.data);

      // Format 1: success property with trainers array
      if (response.data && response.data.success && response.data.trainers) {
        return {
          trainers: response.data.trainers || [],
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
          totalTrainers: response.data.totalTrainers || 0
        };
      }

      // Format 2: success property with data array
      if (response.data && response.data.success && response.data.data) {
        return {
          trainers: response.data.data || [],
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
          totalTrainers: response.data.totalTrainers || response.data.data.length || 0
        };
      }

      // Format 3: Direct array
      if (response.data && Array.isArray(response.data)) {
        return {
          trainers: response.data,
          totalPages: 1,
          currentPage: 1,
          totalTrainers: response.data.length
        };
      }

      // If the response doesn't match any expected format, return a default structure
      console.warn('Unexpected API response format:', response.data);
      return {
        trainers: [],
        totalPages: 1,
        currentPage: 1,
        totalTrainers: 0
      };
    } catch (error) {
      console.error('Error fetching trainers:', error);
      throw error;
    }
  },

  /**
   * Get trainers with pagination (for listing pages)
   * @param {Object} params - Query parameters (page, limit, sort_by, sort_order, search)
   * @returns {Promise<Object>} - Response with trainers data
   */
  getTrainersPaginated: async (params = {}) => {
    try {
      // Use the paginated /trainers endpoint for listing pages
      const response = await api.get('/trainers', { params });

      // Handle different response formats
      console.log('Paginated trainer list API response:', response.data);

      // Format 1: success property with trainers array
      if (response.data && response.data.success && response.data.trainers) {
        return {
          trainers: response.data.trainers || [],
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
          totalTrainers: response.data.totalTrainers || 0
        };
      }

      // Format 2: success property with data array
      if (response.data && response.data.success && response.data.data) {
        return {
          trainers: response.data.data || [],
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.currentPage || 1,
          totalTrainers: response.data.totalTrainers || response.data.data.length || 0
        };
      }

      // Format 3: Direct array
      if (response.data && Array.isArray(response.data)) {
        return {
          trainers: response.data,
          totalPages: 1,
          currentPage: 1,
          totalTrainers: response.data.length
        };
      }

      // If the response doesn't match any expected format, return a default structure
      console.warn('Unexpected API response format:', response.data);
      return {
        trainers: [],
        totalPages: 1,
        currentPage: 1,
        totalTrainers: 0
      };

    } catch (error) {
      console.error('Error fetching paginated trainers:', error);
      throw error;
    }
  },

  /**
   * Get trainer by ID
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} - Response with trainer data
   */
  getTrainerById: async (id) => {
    try {
      const response = await api.get(`/trainers/${id}`);

      // Log the response for debugging
      console.log(`Trainer detail API response for ID ${id}:`, response.data);

      // Handle different response formats

      // Format 1: success property with trainer object
      if (response.data && response.data.success && response.data.trainer) {
        return {
          success: true,
          trainer: response.data.trainer
        };
      }

      // Format 2: success property with data object
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          trainer: response.data.data
        };
      }

      // Format 3: Direct object with expected trainer properties
      if (response.data && !Array.isArray(response.data) &&
          (response.data.name || response.data.id || response.data.level)) {
        return {
          success: true,
          trainer: response.data
        };
      }

      // If the response doesn't match expected format, return a default structure
      console.warn(`Unexpected API response format for trainer ${id}:`, response.data);
      return {
        success: false,
        trainer: null,
        message: 'Failed to parse trainer data'
      };
    } catch (error) {
      console.error(`Error fetching trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get trainers for the current user
   * @param {string} userId - Optional user ID to fetch trainers for
   * @returns {Promise<Object>} - Response with user's trainers data
   */
  getUserTrainers: async (userId) => {
    try {
      console.log('Fetching user trainers from API');

      // If userId is not provided, use the /trainers/user endpoint without a specific ID
      const endpoint = userId ? `/trainers/user/${userId}` : '/trainers/user';
      console.log(`Using endpoint: ${endpoint}`);

      // Request all user trainers by setting a high limit
      const response = await api.get(endpoint, { params: { limit: 10000 } });
      console.log('User trainers API response:', response.data);

      // Handle different response formats
      if (response.data && response.data.success && response.data.data) {
        // New API format with data property
        return {
          success: true,
          trainers: response.data.data,
          totalTrainers: response.data.totalTrainers || response.data.data.length,
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1
        };
      } else if (Array.isArray(response.data)) {
        // Direct array format
        return {
          success: true,
          trainers: response.data,
          totalTrainers: response.data.length,
          currentPage: 1,
          totalPages: 1
        };
      } else if (response.data && response.data.trainers) {
        // Legacy format with trainers property
        return response.data;
      } else {
        // Unknown format, return empty data
        console.warn('Unexpected API response format:', response.data);
        return {
          success: false,
          trainers: [],
          message: 'Unexpected data format from server'
        };
      }
    } catch (error) {
      console.error('Error fetching user trainers:', error);
      throw error;
    }
  },

  /**
   * Create a new trainer
   * @param {Object} trainerData - Trainer data including all fields from the form
   * @returns {Promise<Object>} - Response with created trainer data
   */
  createTrainer: async (trainerData) => {
    try {
      console.log('Creating new trainer with data:', trainerData);

      // Get current user from localStorage as a fallback
      let player_user_id = null;
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          player_user_id = user.discord_id;
          console.log('Found user discord_id from localStorage:', player_user_id);
        }
      } catch (e) {
        console.error('Error getting user from localStorage:', e);
      }

      // Format the data for the API
      const formattedData = {
        ...trainerData,
        // Add player_user_id as a fallback
        player_user_id: player_user_id,
      };

      // Handle mega_info - ensure it's always a JSON string
      if (!trainerData.mega_info) {
        // Initialize mega_info with default values if not provided
        formattedData.mega_info = JSON.stringify({
          mega_ref: "",
          mega_artist: "",
          mega_species1: "",
          mega_species2: "",
          mega_species3: "",
          mega_type1: "",
          mega_type2: "",
          mega_type3: "",
          mega_type4: "",
          mega_type5: "",
          mega_type6: "",
          mega_ability: ""
        });
      } else if (typeof trainerData.mega_info === 'object') {
        // If it's an object, stringify it
        formattedData.mega_info = JSON.stringify(trainerData.mega_info);
      }
      // If it's already a string, it will be used as is

      const response = await api.post('/trainers', formattedData);
      console.log('Trainer creation response:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error creating trainer:', error);
      throw error;
    }
  },

  /**
   * Create a new trainer with file uploads
   * @param {FormData} formData - Trainer form data with files
   * @returns {Promise<Object>} - Response with created trainer data
   */
  createTrainerWithFiles: async (formData) => {
    try {
      console.log('Creating trainer with files');
      const response = await api.post('/trainers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Create trainer with files API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating trainer with files:', error);
      throw error;
    }
  },

  /**
   * Update a trainer
   * @param {number} id - Trainer ID
   * @param {Object|FormData} trainerData - Updated trainer data
   * @returns {Promise<Object>} - Response with updated trainer data
   */
  updateTrainer: async (id, trainerData) => {
    try {
      // Check if trainerData is FormData (for file uploads)
      const isFormData = trainerData instanceof FormData;

      const config = {};
      if (isFormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data'
        };
      }

      const response = await api.put(`/trainers/${id}`, trainerData, config);
      return response.data;
    } catch (error) {
      console.error(`Error updating trainer ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a trainer
   * @param {number} id - Trainer ID
   * @returns {Promise<Object>} - Response with deletion status
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
   * Get monsters for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with trainer's monsters data
   */
  getTrainerMonsters: async (trainerId, params = {}) => {
    try {
      console.log(`Fetching monsters for trainer ${trainerId} with params:`, params);
      const response = await api.get(`/trainers/${trainerId}/monsters`, { params });

      // Log the full response for debugging
      console.log(`Trainer monsters response for trainer ${trainerId}:`, response.data);

      // Handle the response format from the API
      if (response.data && response.data.success) {
        const result = {
          monsters: response.data.monsters || [],
          totalMonsters: response.data.totalMonsters || 0
        };
        console.log(`Processed trainer monsters result:`, result);
        return result;
      }

      // If the API returns an array directly
      if (Array.isArray(response.data)) {
        const result = {
          monsters: response.data,
          totalMonsters: response.data.length
        };
        console.log(`Processed trainer monsters from array:`, result);
        return result;
      }

      // If the response doesn't match expected format, return a default structure
      console.warn(`Unexpected response format for trainer ${trainerId} monsters:`, response.data);
      return {
        monsters: [],
        totalMonsters: 0
      };
    } catch (error) {
      console.error(`Error fetching monsters for trainer ${trainerId}:`, error);
      return {
        monsters: [],
        totalMonsters: 0,
        error: error.message
      };
    }
  },

  /**
   * Update monster box positions for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Array} monsterPositions - Array of monster positions with { id, boxNumber, position }
   * @returns {Promise<Object>} - Response with update status
   */
  updateMonsterBoxPositions: async (trainerId, monsterPositions) => {
    try {
      console.log(`Updating monster box positions for trainer ${trainerId}:`, monsterPositions);
      const response = await api.put(`/trainers/${trainerId}/monsters/boxes`, { positions: monsterPositions });
      console.log(`Update monster box positions response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating monster box positions for trainer ${trainerId}:`, error);

      // If the API endpoint is not available yet, return a mock success response
      if (error.response && error.response.status === 404) {
        console.warn('API endpoint for updating monster box positions not found. Returning mock success response.');
        return {
          success: true,
          message: 'Monster box positions updated successfully (mock response)'
        };
      }

      throw error;
    }
  },

  /**
   * Get trainer inventory
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's inventory data
   */
  getTrainerInventory: async (trainerId) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/inventory`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer additional references
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's additional references
   */
  getTrainerReferences: async (trainerId) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/references`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching references for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer stats
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer's stats data
   */
  getTrainerStats: async (trainerId) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer badges
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with trainer badges
   */
  getTrainerBadges: async (trainerId) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/badges`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching badges for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer adventures
   * @param {number} trainerId - Trainer ID
   * @param {Object} options - Query options (sorting, filtering, pagination)
   * @returns {Promise<Object>} - Response with trainer adventures
   */
  getTrainerAdventures: async (trainerId, options = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/adventures`, { params: options });
      return response.data;
    } catch (error) {
      console.error(`Error fetching adventures for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get trainer submissions
   * @param {number} trainerId - Trainer ID
   * @param {Object} options - Query options (sorting, filtering, pagination)
   * @returns {Promise<Object>} - Response with trainer submissions
   */
  getTrainerSubmissions: async (trainerId, options = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/submissions`, { params: options });
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Add experience to a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} amount - Amount of experience to add
   * @param {string} source - Source of the experience (e.g., 'adventure', 'submission', 'boss')
   * @returns {Promise<Object>} - Response with updated trainer data
   */
  addTrainerExperience: async (trainerId, amount, source) => {
    try {
      const response = await api.post(`/trainers/${trainerId}/experience`, { amount, source });
      return response.data;
    } catch (error) {
      console.error(`Error adding experience to trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Add coins to a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} amount - Amount of coins to add
   * @param {string} source - Source of the coins (e.g., 'adventure', 'submission', 'boss')
   * @returns {Promise<Object>} - Response with updated trainer data
   */
  addTrainerCoins: async (trainerId, amount, source) => {
    try {
      const response = await api.post(`/trainers/${trainerId}/coins`, { amount, source });
      return response.data;
    } catch (error) {
      console.error(`Error adding coins to trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get featured monsters for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with featured monsters data
   */
  getFeaturedMonsters: async (trainerId) => {
    try {
      console.log(`Getting featured monsters for trainer ${trainerId}`);
      const response = await api.get(`/trainers/${trainerId}/featured-monsters`);
      console.log(`Get featured monsters response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting featured monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Update featured monsters for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Array} featuredMonsters - Array of monster IDs (max 6)
   * @returns {Promise<Object>} - Response with update status
   */
  updateFeaturedMonsters: async (trainerId, featuredMonsters) => {
    try {
      console.log(`Updating featured monsters for trainer ${trainerId}:`, featuredMonsters);
      const response = await api.put(`/trainers/${trainerId}/featured-monsters`, { featuredMonsters });
      console.log(`Update featured monsters response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating featured monsters for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get achievements for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with achievements data
   */
  getAchievements: async (trainerId) => {
    try {
      console.log(`Getting achievements for trainer ${trainerId}`);
      const response = await api.get(`/trainers/${trainerId}/achievements`);
      console.log(`Get achievements response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting achievements for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Claim an achievement for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<Object>} - Response with claim result
   */
  claimAchievement: async (trainerId, achievementId) => {
    try {
      console.log(`Claiming achievement ${achievementId} for trainer ${trainerId}`);
      const response = await api.post(`/trainers/${trainerId}/achievements/${achievementId}/claim`);
      console.log(`Claim achievement response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error claiming achievement ${achievementId} for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Claim all achievements for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with claim all result
   */
  claimAllAchievements: async (trainerId) => {
    try {
      console.log(`Claiming all achievements for trainer ${trainerId}`);
      const response = await api.post(`/trainers/${trainerId}/achievements/claim-all`);
      console.log(`Claim all achievements response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error claiming all achievements for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Get achievement statistics for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with achievement stats
   */
  getAchievementStats: async (trainerId) => {
    try {
      console.log(`Getting achievement stats for trainer ${trainerId}`);
      const response = await api.get(`/trainers/${trainerId}/achievements/stats`);
      console.log(`Get achievement stats response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting achievement stats for trainer ${trainerId}:`, error);
      throw error;
    }
  }
};

export default trainerService;
