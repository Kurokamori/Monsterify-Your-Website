import api from './api';

/**
 * Service for Mega Mart-related API calls
 */
const megaMartService = {
  /**
   * Get monster abilities
   * @param {number} monsterId - Monster ID
   * @returns {Promise<Object>} - Response with monster abilities
   */
  getMonsterAbilities: async (monsterId) => {
    try {
      const response = await api.get(`/town/mega-mart/monster/${monsterId}/abilities`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching abilities for monster ${monsterId}:`, error);
      throw error;
    }
  },

  /**
   * Get all abilities
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Response with abilities
   */
  getAllAbilities: async (params = {}) => {
    try {
      const response = await api.get('/town/mega-mart/abilities', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching abilities:', error);
      throw error;
    }
  },

  /**
   * Use ability capsule
   * @param {number} monsterId - Monster ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Response with updated abilities
   */
  useAbilityCapsule: async (monsterId, trainerId) => {
    try {
      const response = await api.post('/town/mega-mart/use-ability-capsule', {
        monsterId,
        trainerId
      });
      return response.data;
    } catch (error) {
      console.error('Error using ability capsule:', error);
      throw error;
    }
  },

  /**
   * Use scroll of secrets
   * @param {number} monsterId - Monster ID
   * @param {number} trainerId - Trainer ID
   * @param {string} abilityName - Ability name
   * @param {string} abilitySlot - Ability slot (ability1 or ability2)
   * @returns {Promise<Object>} - Response with updated abilities
   */
  useScrollOfSecrets: async (monsterId, trainerId, abilityName, abilitySlot) => {
    try {
      const response = await api.post('/town/mega-mart/use-scroll-of-secrets', {
        monsterId,
        trainerId,
        abilityName,
        abilitySlot
      });
      return response.data;
    } catch (error) {
      console.error('Error using scroll of secrets:', error);
      throw error;
    }
  }
};

export default megaMartService;
