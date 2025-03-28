/**
 * Garden Harvest Model
 * Handles garden harvest data storage and retrieval
 */

const pool = require('../db');

class GardenHarvest {
  /**
   * Get garden harvest data for a user
   * @param {string} discordUserId - Discord user ID
   * @returns {Object} - Garden harvest data
   */
  static async getByDiscordUserId(discordUserId) {
    try {
      const query = `
        SELECT * FROM garden_harvests
        WHERE discord_user_id = $1
      `;
      const result = await pool.query(query, [discordUserId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting garden harvest data:', error);
      return null;
    }
  }

  /**
   * Create or update garden harvest data for a user
   * @param {string} discordUserId - Discord user ID
   * @param {Object} data - Garden harvest data
   * @returns {Object} - Updated garden harvest data
   */
  static async upsert(discordUserId, data) {
    try {
      // Check if record exists
      const existingRecord = await this.getByDiscordUserId(discordUserId);

      if (existingRecord) {
        // Update existing record
        const query = `
          UPDATE garden_harvests
          SET 
            garden_points = $1,
            last_harvest_date = $2,
            updated_at = NOW()
          WHERE discord_user_id = $3
          RETURNING *
        `;
        const result = await pool.query(query, [
          data.garden_points,
          data.last_harvest_date,
          discordUserId
        ]);
        return result.rows[0];
      } else {
        // Create new record
        const query = `
          INSERT INTO garden_harvests (
            discord_user_id,
            garden_points,
            last_harvest_date,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING *
        `;
        const result = await pool.query(query, [
          discordUserId,
          data.garden_points,
          data.last_harvest_date
        ]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error upserting garden harvest data:', error);
      return null;
    }
  }

  /**
   * Initialize the garden_harvests table if it doesn't exist
   */
  static async initTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS garden_harvests (
          id SERIAL PRIMARY KEY,
          discord_user_id TEXT NOT NULL,
          garden_points INTEGER DEFAULT 0,
          last_harvest_date DATE,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          UNIQUE(discord_user_id)
        )
      `;
      await pool.query(query);
      console.log('Garden harvests table initialized');
    } catch (error) {
      console.error('Error initializing garden harvests table:', error);
    }
  }

  /**
   * Check if a user has harvested today
   * @param {string} discordUserId - Discord user ID
   * @returns {boolean} - True if user has harvested today
   */
  static async hasHarvestedToday(discordUserId) {
    try {
      const harvestData = await this.getByDiscordUserId(discordUserId);
      if (!harvestData || !harvestData.last_harvest_date) {
        return false;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastHarvestDate = new Date(harvestData.last_harvest_date).toISOString().split('T')[0];
      
      return lastHarvestDate === today;
    } catch (error) {
      console.error('Error checking if user has harvested today:', error);
      return false;
    }
  }

  /**
   * Get garden points for a user
   * @param {string} discordUserId - Discord user ID
   * @returns {number} - Garden points
   */
  static async getGardenPoints(discordUserId) {
    try {
      const harvestData = await this.getByDiscordUserId(discordUserId);
      return harvestData ? harvestData.garden_points : 0;
    } catch (error) {
      console.error('Error getting garden points:', error);
      return 0;
    }
  }

  /**
   * Update garden points for a user
   * @param {string} discordUserId - Discord user ID
   * @param {number} points - Garden points to add
   * @returns {number} - Updated garden points
   */
  static async updateGardenPoints(discordUserId, points) {
    try {
      const harvestData = await this.getByDiscordUserId(discordUserId);
      const currentPoints = harvestData ? harvestData.garden_points : 0;
      const newPoints = currentPoints + points;

      await this.upsert(discordUserId, {
        garden_points: newPoints,
        last_harvest_date: harvestData ? harvestData.last_harvest_date : null
      });

      return newPoints;
    } catch (error) {
      console.error('Error updating garden points:', error);
      return 0;
    }
  }

  /**
   * Record a harvest for a user
   * @param {string} discordUserId - Discord user ID
   * @param {number} points - Garden points to add
   * @returns {Object} - Updated garden harvest data
   */
  static async recordHarvest(discordUserId, points) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const harvestData = await this.getByDiscordUserId(discordUserId);
      const currentPoints = harvestData ? harvestData.garden_points : 0;
      
      return await this.upsert(discordUserId, {
        garden_points: currentPoints + points,
        last_harvest_date: today
      });
    } catch (error) {
      console.error('Error recording harvest:', error);
      return null;
    }
  }
}

module.exports = GardenHarvest;
