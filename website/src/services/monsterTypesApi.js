import api from './api';

/**
 * Monster Types API service
 */
const monsterTypesApi = {
  /**
   * Get all Pokemon monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Pokemon monsters
   */
  getPokemonMonsters: async (params = {}) => {
    try {
      const response = await api.get('/pokemon-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Pokemon monsters:', error);
      throw error;
    }
  },

  /**
   * Get Pokemon monster by ID
   * @param {number} id - Pokemon monster ID
   * @returns {Promise<Object>} Pokemon monster
   */
  getPokemonMonsterById: async (id) => {
    try {
      const response = await api.get(`/pokemon-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Pokemon monster
   * @param {Object} pokemon - Pokemon monster data
   * @returns {Promise<Object>} Created Pokemon monster
   */
  createPokemonMonster: async (pokemon) => {
    try {
      const response = await api.post('/pokemon-monsters', pokemon);
      return response.data;
    } catch (error) {
      console.error('Error creating Pokemon monster:', error);
      throw error;
    }
  },

  /**
   * Update a Pokemon monster
   * @param {number} id - Pokemon monster ID
   * @param {Object} pokemon - Pokemon monster data
   * @returns {Promise<Object>} Updated Pokemon monster
   */
  updatePokemonMonster: async (id, pokemon) => {
    try {
      const response = await api.put(`/pokemon-monsters/${id}`, pokemon);
      return response.data;
    } catch (error) {
      console.error(`Error updating Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Pokemon monster
   * @param {number} id - Pokemon monster ID
   * @returns {Promise<Object>} Success message
   */
  deletePokemonMonster: async (id) => {
    try {
      const response = await api.delete(`/pokemon-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Pokemon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all Digimon monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Digimon monsters
   */
  getDigimonMonsters: async (params = {}) => {
    try {
      const response = await api.get('/digimon-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Digimon monsters:', error);
      throw error;
    }
  },

  /**
   * Get Digimon monster by ID
   * @param {number} id - Digimon monster ID
   * @returns {Promise<Object>} Digimon monster
   */
  getDigimonMonsterById: async (id) => {
    try {
      const response = await api.get(`/digimon-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Digimon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Digimon monster
   * @param {Object} digimon - Digimon monster data
   * @returns {Promise<Object>} Created Digimon monster
   */
  createDigimonMonster: async (digimon) => {
    try {
      const response = await api.post('/digimon-monsters', digimon);
      return response.data;
    } catch (error) {
      console.error('Error creating Digimon monster:', error);
      throw error;
    }
  },

  /**
   * Update a Digimon monster
   * @param {number} id - Digimon monster ID
   * @param {Object} digimon - Digimon monster data
   * @returns {Promise<Object>} Updated Digimon monster
   */
  updateDigimonMonster: async (id, digimon) => {
    try {
      const response = await api.put(`/digimon-monsters/${id}`, digimon);
      return response.data;
    } catch (error) {
      console.error(`Error updating Digimon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Digimon monster
   * @param {number} id - Digimon monster ID
   * @returns {Promise<Object>} Success message
   */
  deleteDigimonMonster: async (id) => {
    try {
      const response = await api.delete(`/digimon-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Digimon monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all Yokai monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Yokai monsters
   */
  getYokaiMonsters: async (params = {}) => {
    try {
      const response = await api.get('/yokai-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Yokai monsters:', error);
      throw error;
    }
  },

  /**
   * Get Yokai monster by ID
   * @param {number} id - Yokai monster ID
   * @returns {Promise<Object>} Yokai monster
   */
  getYokaiMonsterById: async (id) => {
    try {
      const response = await api.get(`/yokai-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Yokai monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Yokai monster
   * @param {Object} yokai - Yokai monster data
   * @returns {Promise<Object>} Created Yokai monster
   */
  createYokaiMonster: async (yokai) => {
    try {
      const response = await api.post('/yokai-monsters', yokai);
      return response.data;
    } catch (error) {
      console.error('Error creating Yokai monster:', error);
      throw error;
    }
  },

  /**
   * Update a Yokai monster
   * @param {number} id - Yokai monster ID
   * @param {Object} yokai - Yokai monster data
   * @returns {Promise<Object>} Updated Yokai monster
   */
  updateYokaiMonster: async (id, yokai) => {
    try {
      const response = await api.put(`/yokai-monsters/${id}`, yokai);
      return response.data;
    } catch (error) {
      console.error(`Error updating Yokai monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Yokai monster
   * @param {number} id - Yokai monster ID
   * @returns {Promise<Object>} Success message
   */
  deleteYokaiMonster: async (id) => {
    try {
      const response = await api.delete(`/yokai-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Yokai monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all Nexomon monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Nexomon monsters
   */
  getNexomonMonsters: async (params = {}) => {
    try {
      const response = await api.get('/nexomon-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Nexomon monsters:', error);
      throw error;
    }
  },

  /**
   * Get Nexomon monster by number
   * @param {number} nr - Nexomon monster number
   * @returns {Promise<Object>} Nexomon monster
   */
  getNexomonMonsterByNr: async (nr) => {
    try {
      const response = await api.get(`/nexomon-monsters/${nr}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Nexomon monster
   * @param {Object} nexomon - Nexomon monster data
   * @returns {Promise<Object>} Created Nexomon monster
   */
  createNexomonMonster: async (nexomon) => {
    try {
      const response = await api.post('/nexomon-monsters', nexomon);
      return response.data;
    } catch (error) {
      console.error('Error creating Nexomon monster:', error);
      throw error;
    }
  },

  /**
   * Update a Nexomon monster
   * @param {number} nr - Nexomon monster number
   * @param {Object} nexomon - Nexomon monster data
   * @returns {Promise<Object>} Updated Nexomon monster
   */
  updateNexomonMonster: async (nr, nexomon) => {
    try {
      const response = await api.put(`/nexomon-monsters/${nr}`, nexomon);
      return response.data;
    } catch (error) {
      console.error(`Error updating Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Nexomon monster
   * @param {number} nr - Nexomon monster number
   * @returns {Promise<Object>} Success message
   */
  deleteNexomonMonster: async (nr) => {
    try {
      const response = await api.delete(`/nexomon-monsters/${nr}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Nexomon monster with number ${nr}:`, error);
      throw error;
    }
  },

  /**
   * Get all Pals monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Pals monsters
   */
  getPalsMonsters: async (params = {}) => {
    try {
      const response = await api.get('/pals-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Pals monsters:', error);
      throw error;
    }
  },

  /**
   * Get Pals monster by ID
   * @param {number} id - Pals monster ID
   * @returns {Promise<Object>} Pals monster
   */
  getPalsMonsterById: async (id) => {
    try {
      const response = await api.get(`/pals-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pals monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Pals monster
   * @param {Object} pals - Pals monster data
   * @returns {Promise<Object>} Created Pals monster
   */
  createPalsMonster: async (pals) => {
    try {
      const response = await api.post('/pals-monsters', pals);
      return response.data;
    } catch (error) {
      console.error('Error creating Pals monster:', error);
      throw error;
    }
  },

  /**
   * Update a Pals monster
   * @param {number} id - Pals monster ID
   * @param {Object} pals - Pals monster data
   * @returns {Promise<Object>} Updated Pals monster
   */
  updatePalsMonster: async (id, pals) => {
    try {
      const response = await api.put(`/pals-monsters/${id}`, pals);
      return response.data;
    } catch (error) {
      console.error(`Error updating Pals monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Pals monster
   * @param {number} id - Pals monster ID
   * @returns {Promise<Object>} Success message
   */
  deletePalsMonster: async (id) => {
    try {
      const response = await api.delete(`/pals-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Pals monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all Monster Hunter monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Monster Hunter monsters
   */
  getMonsterHunterMonsters: async (params = {}) => {
    try {
      const response = await api.get('/monsterhunter-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Monster Hunter monsters:', error);
      throw error;
    }
  },

  /**
   * Get Monster Hunter monster by ID
   * @param {number} id - Monster Hunter monster ID
   * @returns {Promise<Object>} Monster Hunter monster
   */
  getMonsterHunterMonsterById: async (id) => {
    try {
      const response = await api.get(`/monsterhunter-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Monster Hunter monster
   * @param {Object} monster - Monster Hunter monster data
   * @returns {Promise<Object>} Created Monster Hunter monster
   */
  createMonsterHunterMonster: async (monster) => {
    try {
      const response = await api.post('/monsterhunter-monsters', monster);
      return response.data;
    } catch (error) {
      console.error('Error creating Monster Hunter monster:', error);
      throw error;
    }
  },

  /**
   * Update a Monster Hunter monster
   * @param {number} id - Monster Hunter monster ID
   * @param {Object} monster - Monster Hunter monster data
   * @returns {Promise<Object>} Updated Monster Hunter monster
   */
  updateMonsterHunterMonster: async (id, monster) => {
    try {
      const response = await api.put(`/monsterhunter-monsters/${id}`, monster);
      return response.data;
    } catch (error) {
      console.error(`Error updating Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Monster Hunter monster
   * @param {number} id - Monster Hunter monster ID
   * @returns {Promise<Object>} Success message
   */
  deleteMonsterHunterMonster: async (id) => {
    try {
      const response = await api.delete(`/monsterhunter-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Monster Hunter monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all Final Fantasy monsters with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated Final Fantasy monsters
   */
  getFinalFantasyMonsters: async (params = {}) => {
    try {
      const response = await api.get('/finalfantasy-monsters', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Final Fantasy monsters:', error);
      throw error;
    }
  },

  /**
   * Get Final Fantasy monster by ID
   * @param {number} id - Final Fantasy monster ID
   * @returns {Promise<Object>} Final Fantasy monster
   */
  getFinalFantasyMonsterById: async (id) => {
    try {
      const response = await api.get(`/finalfantasy-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new Final Fantasy monster
   * @param {Object} monster - Final Fantasy monster data
   * @returns {Promise<Object>} Created Final Fantasy monster
   */
  createFinalFantasyMonster: async (monster) => {
    try {
      const response = await api.post('/finalfantasy-monsters', monster);
      return response.data;
    } catch (error) {
      console.error('Error creating Final Fantasy monster:', error);
      throw error;
    }
  },

  /**
   * Update a Final Fantasy monster
   * @param {number} id - Final Fantasy monster ID
   * @param {Object} monster - Final Fantasy monster data
   * @returns {Promise<Object>} Updated Final Fantasy monster
   */
  updateFinalFantasyMonster: async (id, monster) => {
    try {
      const response = await api.put(`/finalfantasy-monsters/${id}`, monster);
      return response.data;
    } catch (error) {
      console.error(`Error updating Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a Final Fantasy monster
   * @param {number} id - Final Fantasy monster ID
   * @returns {Promise<Object>} Success message
   */
  deleteFinalFantasyMonster: async (id) => {
    try {
      const response = await api.delete(`/finalfantasy-monsters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting Final Fantasy monster with ID ${id}:`, error);
      throw error;
    }
  }
};

export default monsterTypesApi;
