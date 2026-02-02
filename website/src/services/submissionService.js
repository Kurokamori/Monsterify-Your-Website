import api from './api';

/**
 * Service for submission-related API calls
 */
const submissionService = {
  /**
   * Get all submissions
   * @param {Object} params - Query parameters (type, status, page, limit)
   * @returns {Promise<Object>} - Response with submissions data
   */
  getAllSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/submissions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  /**
   * Get available prompts for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {string} category - Prompt category (general, progression, monthly, etc.)
   * @returns {Promise<Object>} - Response with available prompts
   */
  getAvailablePrompts: async (trainerId, category = 'general') => {
    try {
      const response = await api.get(`/submissions/prompt/available`, {
        params: { trainerId, category }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available prompts:', error);
      throw error;
    }
  },

  /**
   * Get submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise<Object>} - Response with submission data
   */
  getSubmissionById: async (id) => {
    try {
      const response = await api.get(`/submissions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching submission ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get user's submissions
   * @param {Object} params - Query parameters (type, status, page, limit)
   * @returns {Promise<Object>} - Response with user's submissions data
   */
  getUserSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/submissions/user', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  },

  /**
   * Get trainer's submissions
   * @param {number} trainerId - Trainer ID
   * @param {Object} params - Query parameters (type, status, page, limit)
   * @returns {Promise<Object>} - Response with trainer's submissions data
   */
  getTrainerSubmissions: async (trainerId, params = {}) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/submissions`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching submissions for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Submit art
   * @param {Object} artData - Art submission data
   * @returns {Promise<Object>} - Response with submission result
   */
  submitArt: async (artData) => {
    try {
      const formData = new FormData();

      // Add basic submission data
      formData.append('title', artData.title);
      formData.append('description', artData.description || '');
      formData.append('contentType', artData.contentType || 'general');
      formData.append('quality', artData.quality || 'rendered');
      formData.append('backgroundType', artData.backgroundType || 'none');

      // Add backgrounds if provided
      if (artData.backgrounds && artData.backgrounds.length > 0) {
        formData.append('backgrounds', JSON.stringify(artData.backgrounds));
      }

      formData.append('uniquelyDifficult', artData.uniquelyDifficult || false);
      formData.append('useStaticRewards', artData.useStaticRewards || false);

      // Add trainer data
      if (artData.trainers && Array.isArray(artData.trainers) && artData.trainers.length > 0) {
        console.log('Sending trainers to backend:', artData.trainers);
        formData.append('trainers', JSON.stringify(artData.trainers));
      } else if (artData.trainerId) {
        // Legacy support for old format
        const trainers = [{
          trainerId: artData.trainerId,
          appearances: artData.trainerAppearances || []
        }];
        console.log('Sending legacy trainer to backend:', trainers);
        formData.append('trainers', JSON.stringify(trainers));
      } else {
        // Send empty array to ensure trainers is always defined
        console.log('Sending empty trainers array to backend');
        formData.append('trainers', JSON.stringify([]));
      }

      // Add monster data if provided
      if (artData.monsters && Array.isArray(artData.monsters) && artData.monsters.length > 0) {
        console.log('Sending monsters to backend:', artData.monsters);
        formData.append('monsters', JSON.stringify(artData.monsters));
      } else {
        // Send empty array to ensure monsters is always defined
        console.log('Sending empty monsters array to backend');
        formData.append('monsters', JSON.stringify([]));
      }

      // Add NPC data if provided
      if (artData.npcs && Array.isArray(artData.npcs) && artData.npcs.length > 0) {
        console.log('Sending NPCs to backend:', artData.npcs);
        formData.append('npcs', JSON.stringify(artData.npcs));
      } else {
        // Send empty array to ensure npcs is always defined
        console.log('Sending empty NPCs array to backend');
        formData.append('npcs', JSON.stringify([]));
      }

      // Add gift flag if provided
      if (artData.isGift) {
        formData.append('isGift', artData.isGift);
      }

      // Add tags if provided
      if (artData.tags && artData.tags.length > 0) {
        formData.append('tags', JSON.stringify(artData.tags));
      }

      // Add image file or URL
      if (artData.imageFile) {
        formData.append('image', artData.imageFile);
      } else if (artData.imageUrl) {
        formData.append('imageUrl', artData.imageUrl);
      }

      // Add additional images if provided
      if (artData.additionalImages && artData.additionalImages.length > 0) {
        artData.additionalImages.forEach((image, index) => {
          if (image instanceof File) {
            formData.append(`additionalImage${index}`, image);
          } else if (typeof image === 'string') {
            formData.append(`additionalImageUrl${index}`, image);
          }
        });
      }

      const response = await api.post('/submissions/art', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting art:', error);
      throw error;
    }
  },

  /**
   * Submit writing
   * @param {Object} writingData - Writing submission data
   * @returns {Promise<Object>} - Response with submission result
   */
  submitWriting: async (writingData) => {
    try {
      const formData = new FormData();

      // Add basic submission data
      formData.append('title', writingData.title);
      formData.append('description', writingData.description || '');
      formData.append('type', 'writing');
      formData.append('contentType', writingData.contentType || 'story');
      formData.append('wordCount', writingData.wordCount || 0);

      // Add trainer data
      if (writingData.trainers && Array.isArray(writingData.trainers) && writingData.trainers.length > 0) {
        console.log('Sending trainers to backend:', writingData.trainers);
        formData.append('trainers', JSON.stringify(writingData.trainers));
      } else if (writingData.trainerId) {
        // Legacy support for old format
        const trainers = [{
          trainerId: writingData.trainerId,
          isOwned: true,
          isGift: writingData.isGift || false
        }];
        console.log('Sending legacy trainer to backend:', trainers);
        formData.append('trainers', JSON.stringify(trainers));
      } else {
        // Send empty array to ensure trainers is always defined
        console.log('Sending empty trainers array to backend');
        formData.append('trainers', JSON.stringify([]));
      }

      // Add monster data if provided
      if (writingData.monsters && Array.isArray(writingData.monsters) && writingData.monsters.length > 0) {
        console.log('Sending monsters to backend:', writingData.monsters);
        formData.append('monsters', JSON.stringify(writingData.monsters));
      } else {
        // Send empty array to ensure monsters is always defined
        console.log('Sending empty monsters array to backend');
        formData.append('monsters', JSON.stringify([]));
      }

      // Add NPC data if provided
      if (writingData.npcs && Array.isArray(writingData.npcs) && writingData.npcs.length > 0) {
        console.log('Sending NPCs to backend:', writingData.npcs);
        formData.append('npcs', JSON.stringify(writingData.npcs));
      } else {
        // Send empty array to ensure npcs is always defined
        console.log('Sending empty NPCs array to backend');
        formData.append('npcs', JSON.stringify([]));
      }

      // Add tags if provided
      if (writingData.tags && writingData.tags.length > 0) {
        formData.append('tags', JSON.stringify(writingData.tags));
      }

      // Add book/chapter data
      if (writingData.isBook !== undefined) {
        formData.append('isBook', writingData.isBook);
      }
      if (writingData.parentId) {
        formData.append('parentId', writingData.parentId);
      }
      if (writingData.chapterNumber) {
        formData.append('chapterNumber', writingData.chapterNumber);
      }

      // Add content or file
      if (writingData.content) {
        formData.append('content', writingData.content);
      } else if (writingData.contentFile) {
        formData.append('contentFile', writingData.contentFile);
      } else if (writingData.contentUrl) {
        formData.append('contentUrl', writingData.contentUrl);
      }

      // Add cover image if provided
      if (writingData.coverImage) {
        formData.append('coverImage', writingData.coverImage);
      } else if (writingData.coverImageUrl) {
        formData.append('coverImageUrl', writingData.coverImageUrl);
      }

      const response = await api.post('/submissions/writing', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting writing:', error);
      throw error;
    }
  },

  /**
   * Calculate art submission rewards
   * @param {Object} artData - Art submission data
   * @returns {Promise<Object>} - Response with reward calculation
   */
  calculateArtRewards: async (artData) => {
    try {
      // Create a deep copy of the data to avoid modifying the original
      const processedData = JSON.parse(JSON.stringify(artData));

      // Ensure trainers and monsters are valid arrays
      processedData.trainers = Array.isArray(processedData.trainers) ? processedData.trainers : [];
      processedData.monsters = Array.isArray(processedData.monsters) ? processedData.monsters : [];
      processedData.backgrounds = Array.isArray(processedData.backgrounds) ? processedData.backgrounds : [{type: 'none'}];

      // Ensure other fields have default values
      processedData.quality = processedData.quality || 'rendered';
      processedData.backgroundType = processedData.backgroundType || 'none';
      processedData.uniquelyDifficult = !!processedData.uniquelyDifficult;
      processedData.isGift = !!processedData.isGift;
      processedData.useStaticRewards = !!processedData.useStaticRewards;

      // Log the processed data being sent to the backend
      console.log('Art rewards calculation - processed data:', JSON.stringify(processedData, null, 2));

      // Verify trainers and monsters arrays
      console.log('Trainers array check:', {
        isArray: Array.isArray(processedData.trainers),
        length: processedData.trainers.length,
        sample: processedData.trainers.length > 0 ? processedData.trainers[0] : null
      });

      console.log('Monsters array check:', {
        isArray: Array.isArray(processedData.monsters),
        length: processedData.monsters.length,
        sample: processedData.monsters.length > 0 ? processedData.monsters[0] : null
      });

      // Send the processed data to the backend
      const response = await api.post('/submissions/art/calculate', processedData);
      return response.data.rewards;
    } catch (error) {
      console.error('Error calculating art rewards:', error);
      throw error;
    }
  },

  /**
   * Calculate writing submission rewards
   * @param {Object} writingData - Writing submission data
   * @returns {Promise<Object>} - Response with reward calculation
   */
  calculateWritingRewards: async (writingData) => {
    try {
      const requestData = {
        wordCount: writingData.wordCount,
        trainers: writingData.trainers || [],
        monsters: writingData.monsters || []
      };

      // Legacy support
      if (writingData.trainerId) {
        requestData.trainerId = writingData.trainerId;
        requestData.isGift = writingData.isGift || false;
      }

      const response = await api.post('/submissions/writing/calculate', requestData);
      return response.data.rewards;
    } catch (error) {
      console.error('Error calculating writing rewards:', error);
      throw error;
    }
  },

  /**
   * Get art gallery
   * @param {Object} params - Query parameters (contentType, tags, page, limit)
   * @returns {Promise<Object>} - Response with gallery data
   */
  getArtGallery: async (params = {}) => {
    try {
      const response = await api.get('submissions/gallery', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching art gallery:', error);
      throw error;
    }
  },

  /**
   * Get writing library
   * @param {Object} params - Query parameters (contentType, tags, page, limit, booksOnly, excludeChapters)
   * @returns {Promise<Object>} - Response with library data
   */
  getWritingLibrary: async (params = {}) => {
    try {
      const response = await api.get('submissions/library', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching writing library:', error);
      throw error;
    }
  },

  /**
   * Get user's books (for chapter assignment)
   * @returns {Promise<Object>} - Response with user's books
   */
  getUserBooks: async () => {
    try {
      const response = await api.get('/submissions/user/books');
      return response.data;
    } catch (error) {
      console.error('Error fetching user books:', error);
      throw error;
    }
  },

  /**
   * Get chapters for a book
   * @param {number} bookId - Book submission ID
   * @returns {Promise<Object>} - Response with chapters
   */
  getBookChapters: async (bookId) => {
    try {
      const response = await api.get(`/submissions/books/${bookId}/chapters`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chapters for book ${bookId}:`, error);
      throw error;
    }
  },

  /**
   * Update chapter order in a book
   * @param {number} bookId - Book submission ID
   * @param {Array} chapterOrder - Array of chapter IDs in order
   * @returns {Promise<Object>} - Response with updated chapters
   */
  updateChapterOrder: async (bookId, chapterOrder) => {
    try {
      const response = await api.put(`/submissions/books/${bookId}/chapters/order`, {
        chapterOrder
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating chapter order for book ${bookId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new book
   * @param {Object} bookData - Book data (title, description, coverImage)
   * @returns {Promise<Object>} - Response with created book
   */
  createBook: async (bookData) => {
    try {
      const formData = new FormData();
      formData.append('title', bookData.title);
      formData.append('description', bookData.description || '');
      formData.append('isBook', '1');

      if (bookData.coverImage) {
        formData.append('coverImage', bookData.coverImage);
      } else if (bookData.coverImageUrl) {
        formData.append('coverImageUrl', bookData.coverImageUrl);
      }

      if (bookData.tags && bookData.tags.length > 0) {
        formData.append('tags', JSON.stringify(bookData.tags));
      }

      const response = await api.post('/submissions/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  },

  /**
   * Get submission tags
   * @returns {Promise<Object>} - Response with tags data
   */
  getSubmissionTags: async () => {
    try {
      const response = await api.get('/submissions/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching submission tags:', error);
      throw error;
    }
  },

  /**
   * Add comment to submission
   * @param {number} submissionId - Submission ID
   * @param {string} comment - Comment text
   * @returns {Promise<Object>} - Response with comment data
   */
  addComment: async (submissionId, comment) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Like submission
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Object>} - Response with like data
   */
  likeSubmission: async (submissionId) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Unlike submission
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Object>} - Response with unlike data
   */
  unlikeSubmission: async (submissionId) => {
    try {
      const response = await api.delete(`/submissions/${submissionId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error unliking submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Get submission rewards
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Object>} - Response with rewards data
   */
  getSubmissionRewards: async (submissionId) => {
    try {
      const response = await api.get(`/submissions/${submissionId}/rewards`);
      return response.data.rewards;
    } catch (error) {
      console.error(`Error getting rewards for submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Get gift items for a submission
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Object>} - Response with gift items data
   */
  getGiftItems: async (submissionId) => {
    try {
      const response = await api.get(`/submissions/${submissionId}/gift-items`);
      return response.data.giftItems;
    } catch (error) {
      console.error(`Error getting gift items for submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Allocate gift levels
   * @param {number} submissionId - Submission ID
   * @param {string} recipientType - Recipient type ('trainer' or 'monster')
   * @param {number} recipientId - Recipient ID
   * @param {number} levels - Levels to allocate
   * @returns {Promise<Object>} - Response with allocation data
   */
  allocateGiftLevels: async (submissionId, recipientType, recipientId, levels) => {
    try {
      const response = await api.post('/submissions/gift-levels/allocate', {
        submissionId,
        recipientType,
        recipientId,
        levels
      });
      return response.data.allocation;
    } catch (error) {
      console.error('Error allocating gift levels:', error);
      throw error;
    }
  },

  /**
   * Allocate gift coins
   * @param {number} submissionId - Submission ID
   * @param {number} trainerId - Trainer ID
   * @param {number} coins - Coins to allocate
   * @returns {Promise<Object>} - Response with allocation data
   */
  allocateGiftCoins: async (submissionId, trainerId, coins) => {
    try {
      const response = await api.post('/submissions/gift-coins/allocate', {
        submissionId,
        trainerId,
        coins
      });
      return response.data.allocation;
    } catch (error) {
      console.error('Error allocating gift coins:', error);
      throw error;
    }
  },

  /**
   * Allocate capped levels
   * @param {number} submissionId - Submission ID
   * @param {string} recipientType - Recipient type ('trainer' or 'monster')
   * @param {number} recipientId - Recipient ID
   * @param {number} levels - Levels to allocate
   * @returns {Promise<Object>} - Response with allocation data
   */
  allocateCappedLevels: async (submissionId, recipientType, recipientId, levels) => {
    try {
      const response = await api.post('/submissions/capped-levels/allocate', {
        submissionId,
        recipientType,
        recipientId,
        levels
      });
      return response.data.allocation;
    } catch (error) {
      console.error('Error allocating capped levels:', error);
      throw error;
    }
  },

  /**
   * Allocate gift item
   * @param {number} itemId - Gift item ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with allocation data
   */
  allocateGiftItem: async (itemId, trainerId) => {
    try {
      const response = await api.post('/submissions/gift-items/allocate', {
        itemId,
        trainerId
      });
      return response.data.allocation;
    } catch (error) {
      console.error('Error allocating gift item:', error);
      throw error;
    }
  },

  /**
   * Calculate reference submission rewards
   * @param {Object} referenceData - Reference submission data
   * @returns {Promise<Object>} - Response with reward calculation
   */
  calculateReferenceRewards: async (referenceData) => {
    try {
      const response = await api.post('/submissions/reference/calculate', referenceData);
      return response.data.rewards;
    } catch (error) {
      console.error('Error calculating reference rewards:', error);
      throw error;
    }
  },

  /**
   * Submit reference
   * @param {FormData} formData - Reference submission form data
   * @returns {Promise<Object>} - Response with submission result
   */
  submitReference: async (formData) => {
    try {
      const response = await api.post('/submissions/reference/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting reference:', error);
      throw error;
    }
  },

  /**
   * Calculate prompt submission rewards
   * @param {Object} promptData - Prompt submission data
   * @returns {Promise<Object>} - Response with reward calculation
   */
  calculatePromptRewards: async (promptData) => {
    try {
      const response = await api.post('/submissions/prompt/calculate', promptData);
      return response.data.rewards;
    } catch (error) {
      console.error('Error calculating prompt rewards:', error);
      throw error;
    }
  },

  /**
   * Submit prompt
   * @param {FormData} formData - Prompt submission form data
   * @returns {Promise<Object>} - Response with submission result
   */
  submitPrompt: async (formData) => {
    try {
      const response = await api.post('/submissions/prompt/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting prompt:', error);
      throw error;
    }
  },

  /**
   * Get related submissions
   * @param {number} submissionId - Current submission ID to exclude
   * @param {number} userId - User ID to find related submissions
   * @param {string} contentType - Content type to filter by
   * @returns {Promise<Object>} - Response with related submissions
   */
  getRelatedSubmissions: async (submissionId, userId, contentType) => {
    try {
      const params = {
        excludeId: submissionId,
        contentType
      };

      const response = await api.get(`/users/${userId}/submissions/related`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching related submissions:', error);
      throw error;
    }
  },

  /**
   * Get available berries for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with available berries
   */
  getAvailableBerries: async (trainerId) => {
    try {
      const response = await api.get(`/trainers/${trainerId}/berries`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching berries for trainer ${trainerId}:`, error);
      throw error;
    }
  },

  /**
   * Reroll items for a submission
   * @param {number} submissionId - Submission ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with new items
   */
  rerollItems: async (submissionId, trainerId) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/reroll-items`, {
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error rerolling items for submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Reroll monsters for a submission
   * @param {number} submissionId - Submission ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with new monsters
   */
  rerollMonsters: async (submissionId, trainerId) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/reroll-monsters`, {
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error(`Error rerolling monsters for submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Claim a monster from a submission
   * @param {number} submissionId - Submission ID
   * @param {number} trainerId - Trainer ID
   * @param {number} monsterIndex - Index of monster in rewards array
   * @param {string} monsterName - Name for the monster
   * @returns {Promise<Object>} - Response with claimed monster data
   */
  claimMonster: async (submissionId, trainerId, monsterIndex, monsterName) => {
    try {
      const response = await api.post(`/submissions/${submissionId}/claim-monster`, {
        trainerId,
        monsterIndex,
        monsterName
      });
      return response.data;
    } catch (error) {
      console.error(`Error claiming monster from submission ${submissionId}:`, error);
      throw error;
    }
  },



};

export default submissionService;
