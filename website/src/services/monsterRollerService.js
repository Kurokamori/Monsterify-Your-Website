import api from './api';
import { MONSTER_TYPES, MONSTER_ATTRIBUTES, MONSTER_SOURCES } from './mockData';

/**
 * Service for monster roller-related API calls
 */
const monsterRollerService = {
  /**
   * Roll a new monster
   * @param {Object} rollParams - Roll parameters
   * @returns {Promise<Object>} - Response with rolled monster data
   */
  rollMonster: async (rollParams = {}) => {
    try {
      const response = await api.post('/monsters/roll', rollParams);
      return response.data;
    } catch (error) {
      console.error('Error rolling monster:', error);
      throw error;
    }
  },

  /**
   * Initialize a monster for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} monster - Monster data
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} - Response with initialized monster data
   */
  initializeMonster: async (trainerId, monster, options = {}) => {
    try {
      const response = await api.post('/monsters/initialize', {
        trainerId,
        monster,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error initializing monster:', error);
      throw error;
    }
  },

  /**
   * Roll starter monsters for a new trainer
   * @param {number} trainerId - Trainer ID
   * @param {Object} userSettings - User settings
   * @returns {Promise<Object>} - Response with starter monsters data
   */
  rollStarterMonsters: async (trainerId, userSettings = {}) => {
    try {
      const response = await api.post('/monsters/roll-starters', {
        trainerId,
        userSettings
      });
      return response.data;
    } catch (error) {
      console.error('Error rolling starter monsters:', error);
      throw error;
    }
  },

  /**
   * Get available monster types
   * @returns {Promise<string[]>} - Array of monster types
   */
  getMonsterTypes: async () => {
    try {
      const response = await api.get('/monsters/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching monster types:', error);
      // Fallback to mock data
      return MONSTER_TYPES;
    }
  },

  /**
   * Get available monster attributes
   * @returns {Promise<string[]>} - Array of monster attributes
   */
  getMonsterAttributes: async () => {
    try {
      const response = await api.get('/monsters/attributes');
      return response.data;
    } catch (error) {
      console.error('Error fetching monster attributes:', error);
      // Fallback to mock data
      return MONSTER_ATTRIBUTES;
    }
  },

  /**
   * Get available monster sources
   * @returns {Promise<string[]>} - Array of monster sources
   */
  getMonsterSources: async () => {
    try {
      const response = await api.get('/monsters/sources');
      return response.data;
    } catch (error) {
      console.error('Error fetching monster sources:', error);
      // Fallback to mock data
      return MONSTER_SOURCES;
    }
  },

  /**
   * Get user's monster roller settings
   * @returns {Promise<Object>} - Response with user's monster roller settings
   */
  getUserRollerSettings: async () => {
    try {
      const response = await api.get('/users/roller-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user roller settings:', error);
      // Fallback to default settings
      return {
        enabledTypes: MONSTER_SOURCES,
        allowedMonsters: MONSTER_SOURCES,
        excludedMonsters: [],
        rarityBoost: 0,
        legendaryEnabled: false,
        mythicalEnabled: false
      };
    }
  },

  /**
   * Update user's monster roller settings
   * @param {Object} settings - New settings
   * @returns {Promise<Object>} - Response with updated settings
   */
  updateUserRollerSettings: async (settings) => {
    try {
      const response = await api.put('/users/roller-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user roller settings:', error);
      throw error;
    }
  },

  /**
   * Build default roll parameters based on context
   * @param {string} context - Roll context (starter, adoption, event, item, breeding)
   * @param {Object} userSettings - User settings
   * @returns {Object} - Roll parameters
   */
  buildDefaultRollParams: (context, userSettings = {}) => {
    const baseParams = {
      enabledTypes: userSettings.enabledTypes || MONSTER_SOURCES,
      allowedMonsters: userSettings.allowedMonsters || MONSTER_SOURCES,
      excludedMonsters: userSettings.excludedMonsters || [],
      minTypes: 1,
      maxTypes: 2,
      userId: userSettings.userId || 1,
      context
    };

    // Customize based on context
    switch (context) {
      case 'starter':
        return {
          ...baseParams,
          rarityBoost: 0,
          legendaryEnabled: false,
          mythicalEnabled: false
        };
      case 'adoption':
        return {
          ...baseParams,
          rarityBoost: 1,
          legendaryEnabled: false,
          mythicalEnabled: false
        };
      case 'event':
        return {
          ...baseParams,
          rarityBoost: 2,
          legendaryEnabled: true,
          mythicalEnabled: false
        };
      case 'item':
        return {
          ...baseParams,
          rarityBoost: 3,
          legendaryEnabled: true,
          mythicalEnabled: true
        };
      case 'breeding':
        return {
          ...baseParams,
          rarityBoost: 1,
          legendaryEnabled: false,
          mythicalEnabled: false
        };
      default:
        return baseParams;
    }
  }
};

export default monsterRollerService;
