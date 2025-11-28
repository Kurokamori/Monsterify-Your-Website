const db = require('../config/db');
const { buildLimitOffset } = require('../utils/dbUtils');

/**
 * Mission model
 */
class Mission {
  /**
   * Get all missions with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Missions with pagination
   */
  static async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        difficulty = null,
        status = 'active'
      } = options;

      let query = `
        SELECT *
        FROM missions
        WHERE 1=1
      `;
      const params = [];

      // Add filters
      if (difficulty) {
        query += ` AND difficulty = $${params.length + 1}`;
        params.push(difficulty);
      }

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      // Add sorting
      query += ' ORDER BY difficulty ASC, title ASC';

      // Get total count for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const countResult = await db.asyncGet(countQuery, params);
      const total = countResult ? countResult.total : 0;

      // Add pagination
      const offset = (page - 1) * limit;
      query += buildLimitOffset(limit, offset, params);

      const missions = await db.asyncAll(query, params);
      const totalPages = Math.ceil(total / limit);

      return {
        missions: missions || [],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting missions:', error);
      throw error;
    }
  }

  /**
   * Get mission by ID
   * @param {number} id - Mission ID
   * @returns {Promise<Object|null>} Mission object or null
   */
  static async getById(id) {
    try {
      const query = 'SELECT * FROM missions WHERE id = $1';
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error(`Error getting mission with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available missions for a user
   * @param {string} userId - User ID (Discord ID)
   * @returns {Promise<Object>} Object containing available missions and active mission info
   */
  static async getAvailableForUser(userId) {
    try {
      // Check if user has any active missions
      const activeMissionQuery = `
        SELECT um.*, m.title, m.description, m.difficulty, m.duration, m.required_progress
        FROM user_missions um
        JOIN missions m ON um.mission_id = m.id
        WHERE um.user_id = $1 AND um.status = 'active'
      `;
      const activeMissions = await db.asyncAll(activeMissionQuery, [userId]);
      const hasActiveMission = activeMissions && activeMissions.length > 0;

      if (hasActiveMission) {
        // Return active mission info instead of empty array
        return {
          hasActiveMission: true,
          activeMissions: activeMissions,
          availableMissions: []
        };
      }

      // Get all available missions
      const query = `
        SELECT *
        FROM missions
        WHERE status = 'active'
        ORDER BY difficulty ASC, title ASC
      `;
      const availableMissions = await db.asyncAll(query);

      return {
        hasActiveMission: false,
        activeMissions: [],
        availableMissions: availableMissions
      };
    } catch (error) {
      console.error(`Error getting available missions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Start a mission for a user
   * @param {string} userId - User ID (Discord ID)
   * @param {number} missionId - Mission ID
   * @param {Array} monsterIds - Array of monster IDs to send on mission
   * @returns {Promise<Object>} Result of starting mission
   */
  static async startMission(userId, missionId, monsterIds = []) {
    try {
      // Check if user already has an active mission
      const activeMissionQuery = `
        SELECT COUNT(*) as count
        FROM user_missions
        WHERE user_id = $1 AND status = 'active'
      `;
      const activeMissionResult = await db.asyncGet(activeMissionQuery, [userId]);
      const hasActiveMission = activeMissionResult && activeMissionResult.count > 0;

      if (hasActiveMission) {
        return { success: false, message: 'You already have an active mission' };
      }

      // Get mission details
      const mission = await this.getById(missionId);
      if (!mission) {
        return { success: false, message: 'Mission not found' };
      }

      if (mission.status !== 'active') {
        return { success: false, message: 'Mission is not available' };
      }

      // Validate monster count
      if (monsterIds.length > (mission.max_monsters || 3)) {
        return { success: false, message: `Too many monsters selected. Maximum: ${mission.max_monsters || 3}` };
      }

      // Calculate required progress with RNG (base + 0-50% variation)
      const baseProgress = mission.required_progress || 100;
      const variation = Math.floor(Math.random() * (baseProgress * 0.5));
      const totalRequiredProgress = baseProgress + variation;

      // Start the mission
      const insertQuery = `
        INSERT INTO user_missions (user_id, mission_id, status, current_progress, required_progress, started_at)
        VALUES ($1, $2, 'active', 0, $3, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const result = await db.asyncRun(insertQuery, [userId, missionId, totalRequiredProgress]);
      const userMissionId = result.rows ? result.rows[0].id : result.lastID;

      // Store selected monsters for the mission
      if (monsterIds.length > 0 && userMissionId) {
        for (const monsterId of monsterIds) {
          await db.asyncRun(
            'INSERT INTO mission_monsters (user_mission_id, monster_id) VALUES ($1, $2)',
            [userMissionId, monsterId]
          );
        }
      }

      return {
        success: true,
        message: `Mission "${mission.title}" started successfully!`,
        userMissionId,
        requiredProgress: totalRequiredProgress
      };
    } catch (error) {
      console.error(`Error starting mission for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get eligible monsters for a mission
   * @param {string} userId - User ID (Discord ID)
   * @param {number} missionId - Mission ID
   * @returns {Promise<Array>} Eligible monsters
   */
  static async getEligibleMonsters(userId, missionId) {
    try {
      const mission = await this.getById(missionId);
      if (!mission) {
        return [];
      }

      // Parse requirements (handle both string and object formats)
      let requirements = {};
      if (mission.requirements) {
        if (typeof mission.requirements === 'string') {
          try {
            requirements = JSON.parse(mission.requirements);
          } catch (e) {
            console.error('Error parsing mission requirements:', e);
            requirements = {};
          }
        } else {
          requirements = mission.requirements;
        }
      }
      
      let query = `
        SELECT m.*, t.name as trainer_name
        FROM monsters m
        JOIN trainers t ON m.trainer_id = t.id
        WHERE t.player_user_id = $1
        AND m.img_link IS NOT NULL
        AND m.img_link != ''
        AND m.img_link != 'null'
      `;
      const params = [userId];

      // Add type requirements
      if (requirements.types && requirements.types.length > 0) {
        const typeConditions = requirements.types.map((type, index) => {
          params.push(type);
          return `(m.type_primary = $${params.length} OR m.type_secondary = $${params.length})`;
        }).join(' OR ');
        query += ` AND (${typeConditions})`;
      }

      // Add level requirements
      if (requirements.min_level) {
        query += ` AND m.level >= $${params.length + 1}`;
        params.push(requirements.min_level);
      }

      // Add attribute requirements (for Digimon)
      if (requirements.attributes && requirements.attributes.length > 0) {
        const attrConditions = requirements.attributes.map((attr, index) => {
          params.push(attr);
          return `m.attribute = $${params.length}`;
        }).join(' OR ');
        query += ` AND (${attrConditions})`;
      }

      query += ' ORDER BY m.level DESC, m.name ASC';

      return await db.asyncAll(query, params);
    } catch (error) {
      console.error(`Error getting eligible monsters for mission ${missionId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new mission
   * @param {Object} missionData - Mission data
   * @returns {Promise<Object>} Created mission
   */
  static async create(missionData) {
    try {
      const {
        title,
        description,
        difficulty = 'easy',
        duration = 24,
        min_level = 1,
        max_monsters = 3,
        requirements = '{}',
        reward_config = '{}',
        required_progress = 100,
        status = 'active'
      } = missionData;

      const query = `
        INSERT INTO missions (
          title, description, difficulty, duration, min_level, max_monsters,
          requirements, reward_config, required_progress, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const result = await db.asyncRun(query, [
        title, description, difficulty, duration, min_level, max_monsters,
        requirements, reward_config, required_progress, status
      ]);

      const missionId = result.rows ? result.rows[0].id : result.lastID;
      return await this.getById(missionId);
    } catch (error) {
      console.error('Error creating mission:', error);
      throw error;
    }
  }
}

module.exports = Mission;
