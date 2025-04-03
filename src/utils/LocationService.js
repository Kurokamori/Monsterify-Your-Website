const pool = require('../db');
const RewardSystem = require('./RewardSystem');
const Trainer = require('../models/Trainer');
const GardenHarvest = require('../models/GardenHarvest');

/**
 * Service for handling location-based activities
 */
class LocationService {
  // Location constants
  static LOCATIONS = {
    GARDEN: 'garden',
    FARM: 'farm',
    PIRATES_DOCK: 'pirates_dock',
    GAME_CORNER: 'game_corner'
  };

  // Activity timer ranges in minutes
  static TIMER_RANGES = {
    [this.LOCATIONS.GARDEN]: { min: 20, max: 60 },
    [this.LOCATIONS.FARM]: { min: 30, max: 90 },
    [this.LOCATIONS.PIRATES_DOCK]: { min: 45, max: 120 },
    [this.LOCATIONS.GAME_CORNER]: { min: 15, max: 45 }
  };

  // Location colors for UI
  static LOCATION_COLORS = {
    [this.LOCATIONS.GARDEN]: '#4CAF50', // Green
    [this.LOCATIONS.FARM]: '#FFC107',   // Amber
    [this.LOCATIONS.PIRATES_DOCK]: '#2196F3', // Blue
    [this.LOCATIONS.GAME_CORNER]: '#9C27B0'  // Purple
  };

  /**
   * Start a location activity for a trainer
   * @param {string} location - Location identifier
   * @param {number} trainerId - Trainer ID
   * @param {number} discordId - Discord user ID
   * @returns {Promise<Object>} - Activity data
   */
  static async startActivity(location, trainerId, discordId) {
    try {
      // Validate location
      if (!Object.values(this.LOCATIONS).includes(location)) {
        throw new Error(`Invalid location: ${location}`);
      }

      // Check if trainer exists
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Check if trainer already has an active activity at this location
      const existingActivity = await this.getActiveActivity(trainerId, location);
      if (existingActivity) {
        return {
          success: false,
          message: `You already have an active ${location} activity. Complete it first!`,
          activity: existingActivity
        };
      }

      // Generate random timer duration
      const timerRange = this.TIMER_RANGES[location];
      const durationMinutes = Math.floor(Math.random() * (timerRange.max - timerRange.min + 1)) + timerRange.min;

      // Calculate end time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Create activity in database
      const query = `
        INSERT INTO location_activities (
          location,
          trainer_id,
          discord_id,
          start_time,
          end_time,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, 'active'
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        location,
        trainerId,
        discordId,
        startTime,
        endTime
      ]);

      const activity = result.rows[0];

      return {
        success: true,
        message: `Started ${location} activity! It will be ready in ${durationMinutes} minutes.`,
        activity
      };
    } catch (error) {
      console.error(`Error starting ${location} activity:`, error);
      return {
        success: false,
        message: `Error starting activity: ${error.message}`
      };
    }
  }

  /**
   * Complete a location activity
   * @param {number} activityId - Activity ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Completion result with rewards
   */
  static async completeActivity(activityId, trainerId) {
    try {
      // Get the activity
      const query = `
        SELECT * FROM location_activities
        WHERE id = $1 AND trainer_id = $2
      `;
      const result = await pool.query(query, [activityId, trainerId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Activity not found or does not belong to this trainer'
        };
      }

      const activity = result.rows[0];

      // Check if activity is already completed
      if (activity.status === 'completed') {
        return {
          success: false,
          message: 'This activity has already been completed'
        };
      }

      // Check if activity is ready to be completed
      const now = new Date();
      const endTime = new Date(activity.end_time);

      if (now < endTime) {
        const remainingMinutes = Math.ceil((endTime - now) / 60000);
        return {
          success: false,
          message: `This activity is not ready yet. It will be ready in ${remainingMinutes} minutes.`,
          remainingMinutes
        };
      }

      // Calculate productivity score based on how quickly they completed after ready
      const readyTime = new Date(activity.end_time);
      const timeSinceReady = now - readyTime;
      const maxBonusTime = 30 * 60000; // 30 minutes

      // Higher score if completed quickly after becoming ready
      const productivityScore = Math.max(50, 100 - Math.min(100, (timeSinceReady / maxBonusTime) * 50));

      // Calculate time spent (in minutes)
      const timeSpent = Math.ceil((now - new Date(activity.start_time)) / 60000);

      // Generate rewards based on location and time spent
      const rewards = await RewardSystem.generateRewards(activity.location, {
        productivityScore,
        timeSpent,
        difficulty: 'normal'
      });

      // Mark activity as completed
      const updateQuery = `
        UPDATE location_activities
        SET
          status = 'completed',
          completed_at = $1,
          rewards = $2
        WHERE id = $3
        RETURNING *
      `;

      await pool.query(updateQuery, [
        now,
        JSON.stringify(rewards),
        activityId
      ]);

      // Process garden points if applicable
      if (activity.location === this.LOCATIONS.GARDEN) {
        await this.addGardenPoints(trainerId, 1);
      }

      return {
        success: true,
        message: `${activity.location} activity completed successfully!`,
        rewards,
        productivityScore,
        timeSpent
      };
    } catch (error) {
      console.error('Error completing activity:', error);
      return {
        success: false,
        message: `Error completing activity: ${error.message}`
      };
    }
  }

  /**
   * Get active activities for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of active activities
   */
  static async getActiveActivities(trainerId) {
    try {
      const query = `
        SELECT * FROM location_activities
        WHERE trainer_id = $1 AND status = 'active'
        ORDER BY end_time ASC
      `;
      const result = await pool.query(query, [trainerId]);

      return result.rows;
    } catch (error) {
      console.error('Error getting active activities:', error);
      throw error;
    }
  }

  /**
   * Get a specific active activity
   * @param {number} trainerId - Trainer ID
   * @param {string} location - Location identifier
   * @returns {Promise<Object|null>} - Activity data or null if not found
   */
  static async getActiveActivity(trainerId, location) {
    try {
      const query = `
        SELECT * FROM location_activities
        WHERE trainer_id = $1 AND location = $2 AND status = 'active'
      `;
      const result = await pool.query(query, [trainerId, location]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting active ${location} activity:`, error);
      throw error;
    }
  }

  /**
   * Add garden points to a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} points - Number of points to add
   * @returns {Promise<Object>} - Updated garden points
   */
  static async addGardenPoints(trainerId, points) {
    try {
      // Get trainer to get Discord ID
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        throw new Error(`Trainer with ID ${trainerId} not found`);
      }

      // Use Discord ID to update garden points
      const discordUserId = trainer.player_user_id;
      if (!discordUserId) {
        throw new Error(`Trainer with ID ${trainerId} has no Discord ID`);
      }

      // Update garden points using GardenHarvest model
      const updatedPoints = await GardenHarvest.updateGardenPoints(discordUserId, points);

      return {
        trainer_id: trainerId,
        discord_user_id: discordUserId,
        garden_points: updatedPoints,
        potential_harvest: points
      };
    } catch (error) {
      console.error('Error adding garden points:', error);
      throw error;
    }
  }

  /**
   * Harvest garden points
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Harvest result with rewards
   */
  static async harvestGarden(trainerId) {
    try {
      // Get trainer to get Discord ID
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          success: false,
          message: 'Trainer not found'
        };
      }

      // Use Discord ID to get garden points
      const discordUserId = trainer.player_user_id;
      if (!discordUserId) {
        return {
          success: false,
          message: 'Trainer has no Discord ID'
        };
      }

      // Check if user has already harvested today
      const hasHarvestedToday = await GardenHarvest.hasHarvestedToday(discordUserId);
      if (hasHarvestedToday) {
        return {
          success: false,
          message: 'You have already harvested your garden today. Come back tomorrow!'
        };
      }

      // Get current garden points
      const currentPoints = await GardenHarvest.getGardenPoints(discordUserId);

      // Generate rewards based on garden points (use a minimum of 1 point)
      const harvestPoints = Math.max(1, currentPoints);
      const rewards = await RewardSystem.generateGardenRewards({
        gardenPoints: harvestPoints
      });

      // Record the harvest
      const today = new Date().toISOString().split('T')[0];
      const updatedHarvest = await GardenHarvest.recordHarvest(discordUserId, 0); // Reset points to 0

      return {
        success: true,
        message: `Garden harvested successfully! You harvested ${harvestPoints} points.`,
        rewards,
        updatedGardenPoints: {
          trainer_id: trainerId,
          discord_user_id: discordUserId,
          garden_points: 0,
          last_harvest: today
        }
      };
    } catch (error) {
      console.error('Error harvesting garden:', error);
      return {
        success: false,
        message: `Error harvesting garden: ${error.message}`
      };
    }
  }

  /**
   * Get garden stats for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Garden stats
   */
  static async getGardenStats(trainerId) {
    try {
      // Get trainer to get Discord ID
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return {
          points: 0,
          potential_harvest: 0,
          last_harvest: null,
          total_harvests: 0
        };
      }

      // Use Discord ID to get garden points
      const discordUserId = trainer.player_user_id;
      if (!discordUserId) {
        return {
          points: 0,
          potential_harvest: 0,
          last_harvest: null,
          total_harvests: 0
        };
      }

      // Get garden harvest data
      const harvestData = await GardenHarvest.getByDiscordUserId(discordUserId);

      if (!harvestData) {
        return {
          points: 0,
          potential_harvest: 0,
          last_harvest: null,
          total_harvests: 0
        };
      }

      return {
        points: harvestData.garden_points || 0,
        potential_harvest: harvestData.garden_points || 0,
        last_harvest: harvestData.last_harvest_date,
        total_harvests: 0, // This information is not stored in the GardenHarvest model
        trainer_id: trainerId,
        discord_user_id: discordUserId
      };
    } catch (error) {
      console.error('Error getting garden stats:', error);
      throw error;
    }
  }
}

module.exports = LocationService;
