import api from './api';

/**
 * Service for fetching abilities from the backend
 */
const abilityService = {
  /**
   * Get all abilities with their names and descriptions
   * Used for autocomplete functionality
   * @returns {Promise<Array<{name: string, description: string}>>}
   */
  async getAbilityNames() {
    try {
      const response = await api.get('/abilities/names');
      if (response.data && response.data.success) {
        return response.data.abilities;
      }
      return [];
    } catch (error) {
      console.error('Error fetching ability names:', error);
      return [];
    }
  },

  /**
   * Get ability details by name
   * @param {string} name - The ability name
   * @returns {Promise<{name: string, description: string} | null>}
   */
  async getAbilityByName(name) {
    try {
      const response = await api.get(`/abilities/${encodeURIComponent(name)}`);
      if (response.data && response.data.success) {
        return response.data.ability;
      }
      return null;
    } catch (error) {
      console.error('Error fetching ability by name:', error);
      return null;
    }
  },

  /**
   * Search abilities by partial name
   * @param {string} search - Search query
   * @returns {Promise<Array<{name: string, description: string}>>}
   */
  async searchAbilities(search) {
    try {
      const response = await api.get('/abilities', { params: { search } });
      if (response.data && response.data.success) {
        return response.data.abilities.map(ability => ({
          name: ability.abilityname,
          description: ability.effect
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching abilities:', error);
      return [];
    }
  }
};

export default abilityService;
