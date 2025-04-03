const ActiveMission = require('../models/ActiveMission');
const Mission = require('../models/Mission');
const Monster = require('../models/Monster');
const pool = require('../db');

class MissionService {
  // Debug information storage
  static debugInfo = [];

  /**
   * Clear debug information
   */
  static clearDebugInfo() {
    this.debugInfo = [];
  }

  /**
   * Add debug information
   * @param {string} info - Debug information to add
   */
  static addDebugInfo(info) {
    this.debugInfo.push(info);
    console.log(`DEBUG: ${info}`);
  }

  /**
   * Get debug information
   * @returns {Array<string>} - Array of debug information
   */
  static getDebugInfo() {
    return this.debugInfo;
  }
  /**
   * Update mission progress when a task, habit, artwork, or writing is submitted
   * @param {string} userId - User ID
   * @param {number} progressAmount - Amount to increase progress by (default 1)
   * @returns {Promise<Object|null>} - Mission progress update result or null if no active mission
   */
  static async updateMissionProgress(userId, progressAmount = 1) {
    try {
      // Check if user has an active mission
      const activeMission = await ActiveMission.getByUserId(userId);
      if (!activeMission) {
        return null; // No active mission to update
      }

      // Update the mission progress with the specified amount
      const progressResult = await ActiveMission.updateProgress(userId, progressAmount);

      // If mission is completed, handle completion
      if (progressResult.isCompleted) {
        const completionResult = await ActiveMission.complete(userId);
        return {
          ...progressResult,
          completionResult,
          completed: true
        };
      }

      return progressResult;
    } catch (error) {
      console.error(`Error updating mission progress for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get available missions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of available missions
   */
  static async getAvailableMissions(userId) {
    try {
      // Clear previous debug info
      this.clearDebugInfo();

      console.log(`Getting available missions for user ${userId}`);
      this.addDebugInfo(`Getting available missions for user ${userId}`);

      // Check if user already has an active mission
      const activeMission = await ActiveMission.getByUserId(userId);
      if (activeMission) {
        console.log(`User ${userId} already has an active mission, returning empty array`);
        this.addDebugInfo(`User ${userId} already has an active mission, returning empty array`);
        return []; // User already has an active mission
      }

      // Get all active mission templates
      const allMissions = await Mission.getAll(true);
      console.log(`Found ${allMissions.length} active missions in the database`);
      this.addDebugInfo(`Found ${allMissions.length} active missions in the database`);

      // Get all monsters owned by the user's trainers
      const monstersQuery = `
        SELECT m.mon_id, m.name, m.level, m.type1, m.type2, m.type3, m.type4, m.type5, m.attribute,
               m.img_link, m.species1, t.name as trainer_name, t.id as trainer_id
        FROM mons m
        JOIN trainers t ON m.trainer_id = t.id
        WHERE t.player_user_id = $1
        ORDER BY t.name, m.name
      `;

      const monstersResult = await pool.query(monstersQuery, [userId]);
      const userMonsters = monstersResult.rows;
      console.log(`User ${userId} has ${userMonsters.length} monsters`);
      this.addDebugInfo(`User ${userId} has ${userMonsters.length} monsters`);

      // Filter missions based on monster eligibility
      const availableMissions = [];

      for (const mission of allMissions) {
        console.log(`Checking eligibility for mission: ${mission.name}`);

        // Check if mission is available today based on date restrictions
        if (!this.isMissionAvailableToday(mission)) {
          console.log(`Mission ${mission.name} is not available today due to date restrictions`);
          this.addDebugInfo(`Mission ${mission.name} is not available today due to date restrictions`);
          continue;
        }

        // Check if any monster meets the requirements
        const eligibleMonsters = userMonsters.filter(monster => {
          // Check level requirement
          if (mission.level_requirement && monster.level < mission.level_requirement) {
            return false;
          }

          // Check type requirements if specified
          if (mission.type_requirements && mission.type_requirements.length > 0) {
            const monsterTypes = [
              monster.type1, monster.type2, monster.type3,
              monster.type4, monster.type5
            ].filter(type => type);

            if (mission.requirements_type === 'AND') {
              // Must have ALL required types
              const hasAllTypes = mission.type_requirements.every(reqType =>
                monsterTypes.includes(reqType)
              );

              if (!hasAllTypes) {
                return false;
              }
            } else {
              // Must have at least one required type (OR)
              const hasRequiredType = mission.type_requirements.some(reqType =>
                monsterTypes.includes(reqType)
              );

              if (!hasRequiredType) {
                return false;
              }
            }
          }

          // Check attribute requirements if specified
          if (mission.attribute_requirements && mission.attribute_requirements.length > 0) {
            const hasRequiredAttribute = mission.attribute_requirements.includes(monster.attribute);

            if (!hasRequiredAttribute) {
              return false;
            }
          }

          return true;
        });

        console.log(`Mission ${mission.name} has ${eligibleMonsters.length} eligible monsters`);
        this.addDebugInfo(`Mission ${mission.name} has ${eligibleMonsters.length} eligible monsters`);

        if (eligibleMonsters.length > 0) {
          availableMissions.push({
            ...mission,
            eligibleMonsters
          });
        }
      }

      console.log(`Returning ${availableMissions.length} available missions for user ${userId}`);
      this.addDebugInfo(`Returning ${availableMissions.length} available missions for user ${userId}`);
      return availableMissions;
    } catch (error) {
      console.error(`Error getting available missions for user ${userId}:`, error);
      this.addDebugInfo(`Error getting available missions: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if a mission is available on the current date
   * @param {Object} mission - Mission object
   * @returns {boolean} - Whether the mission is available
   */
  static isMissionAvailableToday(mission) {
    // If the mission doesn't have date fields or they're not set, it's always available
    if (!mission.available_dates || !mission.available_days) {
      return true;
    }

    const today = new Date();

    // Check specific dates if specified and not empty
    if (mission.available_dates && Array.isArray(mission.available_dates) && mission.available_dates.length > 0) {
      // Format: MM/DD
      const todayFormatted = `${today.getMonth() + 1}/${today.getDate()}`;
      return mission.available_dates.includes(todayFormatted);
    }

    // Check days of week if specified and not empty
    if (mission.available_days && Array.isArray(mission.available_days) && mission.available_days.length > 0) {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDay = daysOfWeek[today.getDay()];
      return mission.available_days.includes(todayDay);
    }

    // If we get here, the fields exist but are empty arrays, so the mission is always available
    return true;
  }
}

module.exports = MissionService;
