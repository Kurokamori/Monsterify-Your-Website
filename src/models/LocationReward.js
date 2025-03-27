const pool = require(\"../db\");

class LocationReward {
  /**
   * Get random rewards for a specific location
   * @param {string} location - Location identifier
   * @param {number} count - Number of rewards to get (default: 1)
   * @returns {Promise<Array>} - Array of random rewards
   */
  static async getRandomForLocation(location, count = 1) {
    try {
      // Use weighted random selection based on the weight field
      const query = `
        SELECT * FROM location_rewards
        WHERE location = $1
        ORDER BY 
          CASE 
            WHEN random() < (weight::float / 1000) THEN 1 
            ELSE 0 
          END DESC, 
          random() 
        LIMIT $2
      `;
      
      const result = await pool.query(query, [location, count]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting random rewards for location ${location}:`, error);
      throw error;
    }
  }

  /**
   * Get all rewards for a specific location
   * @param {string} location - Location identifier
   * @returns {Promise<Array>} - Array of rewards
   */
  static async getAllForLocation(location) {
    try {
      const query = `
        SELECT * FROM location_rewards
        WHERE location = $1
        ORDER BY rarity, reward_type, reward_id
      `;
      
      const result = await pool.query(query, [location]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting all rewards for location ${location}:`, error);
      throw error;
    }
  }

  /**
   * Get a reward by ID
   * @param {number} rewardId - Reward ID
   * @returns {Promise<Object>} - Reward
   */
  static async getById(rewardId) {
    try {
      const query = `
        SELECT * FROM location_rewards
        WHERE reward_id = $1
      `;
      
      const result = await pool.query(query, [rewardId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting reward by ID ${rewardId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new reward
   * @param {Object} rewardData - Reward data
   * @param {string} rewardData.location - Location identifier
   * @param {string} rewardData.reward_type - Reward type (item, monster, coin, etc.)
   * @param {Object} rewardData.reward_data - Reward data (JSON)
   * @param {string} rewardData.rarity - Rarity (common, uncommon, rare, epic, legendary)
   * @param {number} rewardData.weight - Weight for random selection
   * @returns {Promise<Object>} - Created reward
   */
  static async create({
    location,
    reward_type,
    reward_data,
    rarity = \"common\",
    weight = 100
  }) {
    try {
      const query = `
        INSERT INTO location_rewards (
          location, reward_type, reward_data, rarity, weight
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [
        location, 
        reward_type, 
        typeof reward_data === \"object\" ? JSON.stringify(reward_data) : reward_data,
        rarity,
        weight
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(\"Error creating reward:\", error);
      throw error;
    }
  }

  /**
   * Update a reward
   * @param {number} rewardId - Reward ID
   * @param {Object} rewardData - Updated reward data
   * @param {string} rewardData.location - Location identifier
   * @param {string} rewardData.reward_type - Reward type (item, monster, coin, etc.)
   * @param {Object} rewardData.reward_data - Reward data (JSON)
   * @param {string} rewardData.rarity - Rarity (common, uncommon, rare, epic, legendary)
   * @param {number} rewardData.weight - Weight for random selection
   * @returns {Promise<Object>} - Updated reward
   */
  static async update(rewardId, {
    location,
    reward_type,
    reward_data,
    rarity,
    weight
  }) {
    try {
      // Build the SET clause dynamically based on provided fields
      const updates = [];
      const values = [rewardId];
      let valueIndex = 2;
      
      if (location !== undefined) {
        updates.push(`location = $${valueIndex}`);
        values.push(location);
        valueIndex++;
      }
      
      if (reward_type !== undefined) {
        updates.push(`reward_type = $${valueIndex}`);
        values.push(reward_type);
        valueIndex++;
      }
      
      if (reward_data !== undefined) {
        updates.push(`reward_data = $${valueIndex}`);
        values.push(typeof reward_data === \"object\" ? JSON.stringify(reward_data) : reward_data);
        valueIndex++;
      }
      
      if (rarity !== undefined) {
        updates.push(`rarity = $${valueIndex}`);
        values.push(rarity);
        valueIndex++;
      }
      
      if (weight !== undefined) {
        updates.push(`weight = $${valueIndex}`);
        values.push(weight);
        valueIndex++;
      }
      
      // Add updated_at timestamp
      updates.push(\"updated_at = CURRENT_TIMESTAMP\");
      
      // If no fields to update, return the existing reward
      if (updates.length === 1) {
        return this.getById(rewardId);
      }
      
      const query = `
        UPDATE location_rewards
        SET ${updates.join(\", \")}
        WHERE reward_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating reward ${rewardId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a reward
   * @param {number} rewardId - Reward ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  static async delete(rewardId) {
    try {
      const query = `
        DELETE FROM location_rewards
        WHERE reward_id = $1
        RETURNING reward_id
      `;
      
      const result = await pool.query(query, [rewardId]);
      return result.rowCount > 0;
    } catch (error) {
      console.error(`Error deleting reward ${rewardId}:`, error);
      throw error;
    }
  }
}

module.exports = LocationReward;
