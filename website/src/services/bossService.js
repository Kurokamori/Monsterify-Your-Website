import api from './api';

/**
 * Boss Service for making boss-related API requests
 */
class BossService {
  /**
   * Get current active boss
   * @returns {Promise<Object>} Current boss data
   */
  static async getCurrentBoss() {
    try {
      const response = await api.get('/bosses/current');
      return response.data;
    } catch (error) {
      console.error('Error getting current boss:', error);
      throw error;
    }
  }

  /**
   * Get current boss with leaderboard
   * @param {number} limit Number of leaderboard entries to return
   * @returns {Promise<Object>} Boss data with leaderboard
   */
  static async getCurrentBossWithLeaderboard(limit = 10) {
    try {
      const response = await api.get(`/bosses/current/full?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting current boss with leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get boss by ID
   * @param {number} bossId Boss ID
   * @returns {Promise<Object>} Boss data
   */
  static async getBossById(bossId) {
    try {
      const response = await api.get(`/bosses/${bossId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get boss leaderboard
   * @param {number} bossId Boss ID
   * @param {number} limit Number of entries to return
   * @returns {Promise<Array>} Leaderboard data
   */
  static async getBossLeaderboard(bossId, limit = 10) {
    try {
      const response = await api.get(`/bosses/${bossId}/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting leaderboard for boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get defeated bosses with rankings
   * @param {number} limit Number of bosses to return
   * @returns {Promise<Array>} Defeated bosses data
   */
  static async getDefeatedBosses(limit = 10) {
    try {
      const response = await api.get(`/bosses/defeated?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting defeated bosses:', error);
      throw error;
    }
  }

  /**
   * Get defeated boss by ID with full rankings
   * @param {number} bossId Boss ID
   * @param {number} userId Optional user ID to check reward claim status
   * @returns {Promise<Object>} Defeated boss data with rankings
   */
  static async getDefeatedBossById(bossId, userId = null) {
    try {
      const url = userId 
        ? `/bosses/defeated/${bossId}?userId=${userId}`
        : `/bosses/defeated/${bossId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error getting defeated boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Add damage to boss
   * @param {number} bossId Boss ID
   * @param {Object} damageData Damage data
   * @returns {Promise<Object>} Damage result
   */
  static async addBossDamage(bossId, damageData) {
    try {
      const response = await api.post(`/bosses/${bossId}/damage`, damageData);
      return response.data;
    } catch (error) {
      console.error(`Error adding damage to boss ${bossId}:`, error);
      throw error;
    }
  }

  /**
   * Get current boss with unclaimed rewards
   * @param {number} userId User ID to check for unclaimed rewards
   * @returns {Promise<Object>} Current boss with unclaimed rewards info
   */
  static async getCurrentBossWithRewards(userId = null) {
    try {
      const url = userId 
        ? `/bosses/current/rewards?userId=${userId}`
        : '/bosses/current/rewards';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting current boss with rewards:', error);
      throw error;
    }
  }

  /**
   * Get unclaimed rewards for user
   * @param {number} userId User ID
   * @returns {Promise<Array>} Unclaimed rewards
   */
  static async getUnclaimedRewards(userId) {
    try {
      const response = await api.get(`/bosses/rewards/unclaimed?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting unclaimed rewards:', error);
      throw error;
    }
  }

  /**
   * Claim boss reward
   * @param {number} bossId Boss ID
   * @param {Object} claimData Claim data (userId, monsterName, trainerId)
   * @returns {Promise<Object>} Claim result
   */
  static async claimBossReward(bossId, claimData) {
    try {
      const response = await api.post(`/bosses/rewards/${bossId}/claim`, claimData);
      return response.data;
    } catch (error) {
      console.error(`Error claiming boss reward for boss ${bossId}:`, error);
      throw error;
    }
  }
}

export default BossService;
