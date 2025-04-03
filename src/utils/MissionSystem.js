const pool = require('../db');
const RewardSystem = require('./RewardSystem');
const Trainer = require('../models/Trainer');

/**
 * Service for handling missions and related functionality
 */
class MissionSystem {
  // Mission types
  static MISSION_TYPES = {
    WRITING: 'writing',
    ART: 'art',
    TASK: 'task',
    HABIT: 'habit',
    GARDEN: 'garden',
    BOSS: 'boss',
    COLLECTION: 'collection'
  };

  // Mission difficulties
  static MISSION_DIFFICULTIES = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard',
    EPIC: 'epic'
  };

  /**
   * Get available missions for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Array>} - Array of available missions
   */
  static async getAvailableMissions(trainerId) {
    try {
      // Get active mission for trainer
      const activeMission = await this.getActiveMission(trainerId);

      if (activeMission) {
        return {
          success: true,
          message: 'You already have an active mission. Complete it first!',
          activeMission,
          availableMissions: []
        };
      }

      // Get completed mission IDs for trainer
      const completedQuery = `
        SELECT mission_id
        FROM mission_history
        WHERE trainer_id = $1
      `;

      const completedResult = await pool.query(completedQuery, [trainerId]);
      const completedMissionIds = completedResult.rows.map(row => row.mission_id);

      // Get available missions (not completed by this trainer)
      const missionsQuery = `
        SELECT *
        FROM missions
        WHERE active = true
        ${completedMissionIds.length > 0 ? `AND id NOT IN (${completedMissionIds.join(',')})` : ''}
        ORDER BY difficulty, id
      `;

      const missionsResult = await pool.query(missionsQuery);

      return {
        success: true,
        availableMissions: missionsResult.rows,
        activeMission: null
      };
    } catch (error) {
      console.error('Error getting available missions:', error);
      return {
        success: false,
        message: `Error getting missions: ${error.message}`
      };
    }
  }

  /**
   * Get active mission for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object|null>} - Active mission or null if none
   */
  static async getActiveMission(trainerId) {
    try {
      const query = `
        SELECT *
        FROM active_missions
        WHERE trainer_id = $1
      `;

      const result = await pool.query(query, [trainerId]);

      if (result.rows.length === 0) {
        return null;
      }

      const activeMission = result.rows[0];

      // Get mission details
      const missionQuery = `
        SELECT *
        FROM missions
        WHERE id = $1
      `;

      const missionResult = await pool.query(missionQuery, [activeMission.mission_id]);

      if (missionResult.rows.length === 0) {
        return null;
      }

      // Parse mission data
      const missionData = {
        ...activeMission,
        mission: missionResult.rows[0],
        progress_data: JSON.parse(activeMission.progress_data || '{}')
      };

      return missionData;
    } catch (error) {
      console.error('Error getting active mission:', error);
      throw error;
    }
  }

  /**
   * Start a mission for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} missionId - Mission ID
   * @returns {Promise<Object>} - Result of starting the mission
   */
  static async startMission(trainerId, missionId) {
    try {
      // Check if trainer already has an active mission
      const activeMission = await this.getActiveMission(trainerId);

      if (activeMission) {
        return {
          success: false,
          message: 'You already have an active mission. Complete it first!',
          activeMission
        };
      }

      // Check if mission exists
      const missionQuery = `
        SELECT *
        FROM missions
        WHERE id = $1 AND active = true
      `;

      const missionResult = await pool.query(missionQuery, [missionId]);

      if (missionResult.rows.length === 0) {
        return {
          success: false,
          message: 'Mission not found or inactive'
        };
      }

      const mission = missionResult.rows[0];

      // Check if trainer has already completed this mission
      const historyQuery = `
        SELECT *
        FROM mission_history
        WHERE trainer_id = $1 AND mission_id = $2
      `;

      const historyResult = await pool.query(historyQuery, [trainerId, missionId]);

      if (historyResult.rows.length > 0) {
        return {
          success: false,
          message: 'You have already completed this mission'
        };
      }

      // Initialize progress data based on mission type
      const progressData = this.initializeProgressData(mission);

      // Create active mission
      const createQuery = `
        INSERT INTO active_missions (
          trainer_id,
          mission_id,
          progress_data,
          started_at
        ) VALUES (
          $1, $2, $3, NOW()
        ) RETURNING *
      `;

      const createResult = await pool.query(createQuery, [
        trainerId,
        missionId,
        JSON.stringify(progressData)
      ]);

      return {
        success: true,
        message: `Mission "${mission.name}" started!`,
        activeMission: {
          ...createResult.rows[0],
          mission,
          progress_data: progressData
        }
      };
    } catch (error) {
      console.error('Error starting mission:', error);
      return {
        success: false,
        message: `Error starting mission: ${error.message}`
      };
    }
  }

  /**
   * Initialize progress data for a mission
   * @param {Object} mission - Mission data
   * @returns {Object} - Initial progress data
   */
  static initializeProgressData(mission) {
    const missionType = mission.type;
    const requirements = JSON.parse(mission.requirements || '{}');

    switch (missionType) {
      case this.MISSION_TYPES.WRITING:
        return {
          current_words: 0,
          target_words: requirements.word_count || 1000,
          submissions: []
        };

      case this.MISSION_TYPES.ART:
        return {
          current_submissions: 0,
          target_submissions: requirements.submission_count || 3,
          submissions: []
        };

      case this.MISSION_TYPES.TASK:
        return {
          completed_tasks: 0,
          target_tasks: requirements.task_count || 5,
          tasks: []
        };

      case this.MISSION_TYPES.HABIT:
        return {
          completed_habits: 0,
          target_habits: requirements.habit_count || 7,
          habits: []
        };

      case this.MISSION_TYPES.GARDEN:
        return {
          current_points: 0,
          target_points: requirements.garden_points || 10,
          activities: []
        };

      case this.MISSION_TYPES.BOSS:
        return {
          current_damage: 0,
          target_damage: requirements.damage || 100,
          attacks: []
        };

      case this.MISSION_TYPES.COLLECTION:
        return {
          collected_types: [],
          target_types: requirements.types || ['Fire', 'Water', 'Grass'],
          collected_species: [],
          target_species: requirements.species || [],
          monsters: []
        };

      default:
        return {
          progress: 0,
          target: 100
        };
    }
  }

  /**
   * Progress a mission based on activity
   * @param {number} trainerId - Trainer ID
   * @param {string} activityType - Activity type (writing, art, task, etc.)
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} - Result of progressing the mission
   */
  static async progressMission(trainerId, activityType, activityData = {}) {
    try {
      // Get active mission
      const activeMission = await this.getActiveMission(trainerId);

      if (!activeMission) {
        return {
          success: false,
          message: 'No active mission found'
        };
      }

      const mission = activeMission.mission;
      const progressData = activeMission.progress_data;

      // Check if mission type matches activity type
      if (mission.type !== activityType && mission.type !== 'any') {
        return {
          success: false,
          message: `This mission requires ${mission.type} activities`
        };
      }

      // Update progress based on mission type
      let updated = false;
      let completed = false;
      let message = '';

      switch (mission.type) {
        case this.MISSION_TYPES.WRITING:
          updated = this.progressWritingMission(progressData, activityData);
          message = `${progressData.current_words}/${progressData.target_words} words`;
          completed = progressData.current_words >= progressData.target_words;
          break;

        case this.MISSION_TYPES.ART:
          updated = this.progressArtMission(progressData, activityData);
          message = `${progressData.current_submissions}/${progressData.target_submissions} submissions`;
          completed = progressData.current_submissions >= progressData.target_submissions;
          break;

        case this.MISSION_TYPES.TASK:
          updated = this.progressTaskMission(progressData, activityData);
          message = `${progressData.completed_tasks}/${progressData.target_tasks} tasks`;
          completed = progressData.completed_tasks >= progressData.target_tasks;
          break;

        case this.MISSION_TYPES.HABIT:
          updated = this.progressHabitMission(progressData, activityData);
          message = `${progressData.completed_habits}/${progressData.target_habits} habits`;
          completed = progressData.completed_habits >= progressData.target_habits;
          break;

        case this.MISSION_TYPES.GARDEN:
          updated = this.progressGardenMission(progressData, activityData);
          message = `${progressData.current_points}/${progressData.target_points} garden points`;
          completed = progressData.current_points >= progressData.target_points;
          break;

        case this.MISSION_TYPES.BOSS:
          updated = this.progressBossMission(progressData, activityData);
          message = `${progressData.current_damage}/${progressData.target_damage} damage`;
          completed = progressData.current_damage >= progressData.target_damage;
          break;

        case this.MISSION_TYPES.COLLECTION:
          updated = this.progressCollectionMission(progressData, activityData);

          const typesProgress = `${progressData.collected_types.length}/${progressData.target_types.length} types`;
          const speciesProgress = progressData.target_species.length > 0
            ? `, ${progressData.collected_species.length}/${progressData.target_species.length} species`
            : '';

          message = typesProgress + speciesProgress;

          const typesCompleted = progressData.collected_types.length >= progressData.target_types.length;
          const speciesCompleted = progressData.target_species.length === 0 ||
                                  progressData.collected_species.length >= progressData.target_species.length;

          completed = typesCompleted && speciesCompleted;
          break;

        default:
          return {
            success: false,
            message: 'Unknown mission type'
          };
      }

      if (!updated) {
        return {
          success: false,
          message: 'No progress made on mission'
        };
      }

      // Update mission progress in database
      const updateQuery = `
        UPDATE active_missions
        SET
          progress_data = $1,
          updated_at = NOW()
        WHERE trainer_id = $2
        RETURNING *
      `;

      await pool.query(updateQuery, [
        JSON.stringify(progressData),
        trainerId
      ]);

      // If mission is completed, handle completion
      if (completed) {
        await this.completeMission(trainerId, activeMission.id);

        return {
          success: true,
          message: `Mission "${mission.name}" completed!`,
          completed: true,
          mission,
          progressData
        };
      }

      return {
        success: true,
        message,
        progress: progressData,
        mission,
        completed: false
      };
    } catch (error) {
      console.error('Error progressing mission:', error);
      return {
        success: false,
        message: `Error progressing mission: ${error.message}`
      };
    }
  }

  /**
   * Progress a writing mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressWritingMission(progressData, activityData) {
    if (!activityData.wordCount) {
      return false;
    }

    const wordCount = parseInt(activityData.wordCount);

    if (isNaN(wordCount) || wordCount <= 0) {
      return false;
    }

    // Add submission to list
    progressData.submissions.push({
      word_count: wordCount,
      url: activityData.url || '',
      timestamp: new Date().toISOString()
    });

    // Update total word count
    progressData.current_words += wordCount;

    return true;
  }

  /**
   * Progress an art mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressArtMission(progressData, activityData) {
    if (!activityData.url) {
      return false;
    }

    // Add submission to list
    progressData.submissions.push({
      type: activityData.type || 'art',
      url: activityData.url,
      timestamp: new Date().toISOString()
    });

    // Increment submission count
    progressData.current_submissions += 1;

    return true;
  }

  /**
   * Progress a task mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressTaskMission(progressData, activityData) {
    if (!activityData.taskId) {
      return false;
    }

    const taskId = activityData.taskId;

    // Check if task already counted
    if (progressData.tasks.includes(taskId)) {
      return false;
    }

    // Add task to list
    progressData.tasks.push(taskId);

    // Increment task count
    progressData.completed_tasks += 1;

    return true;
  }

  /**
   * Progress a habit mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressHabitMission(progressData, activityData) {
    if (!activityData.habitId) {
      return false;
    }

    const habitId = activityData.habitId;
    const timestamp = activityData.timestamp || new Date().toISOString();

    // Check if habit already counted for today
    const today = new Date(timestamp).toISOString().split('T')[0];

    const alreadyCounted = progressData.habits.some(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entry.habitId === habitId && entryDate === today;
    });

    if (alreadyCounted) {
      return false;
    }

    // Add habit to list
    progressData.habits.push({
      habitId,
      timestamp
    });

    // Increment habit count
    progressData.completed_habits += 1;

    return true;
  }

  /**
   * Progress a garden mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressGardenMission(progressData, activityData) {
    if (!activityData.points) {
      return false;
    }

    const points = parseInt(activityData.points);

    if (isNaN(points) || points <= 0) {
      return false;
    }

    // Add activity to list
    progressData.activities.push({
      points,
      type: activityData.type || 'garden',
      timestamp: new Date().toISOString()
    });

    // Update total points
    progressData.current_points += points;

    return true;
  }

  /**
   * Progress a boss mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressBossMission(progressData, activityData) {
    if (!activityData.damage) {
      return false;
    }

    const damage = parseInt(activityData.damage);

    if (isNaN(damage) || damage <= 0) {
      return false;
    }

    // Add attack to list
    progressData.attacks.push({
      damage,
      bossId: activityData.bossId || null,
      timestamp: new Date().toISOString()
    });

    // Update total damage
    progressData.current_damage += damage;

    return true;
  }

  /**
   * Progress a collection mission
   * @param {Object} progressData - Progress data
   * @param {Object} activityData - Activity data
   * @returns {boolean} - True if progress was made, false otherwise
   */
  static progressCollectionMission(progressData, activityData) {
    if (!activityData.monster) {
      return false;
    }

    const monster = activityData.monster;

    // Check if monster already counted
    if (progressData.monsters.some(m => m.id === monster.mon_id)) {
      return false;
    }

    // Add monster to list
    progressData.monsters.push({
      id: monster.mon_id,
      name: monster.name,
      types: [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean),
      species: [monster.species1, monster.species2, monster.species3].filter(Boolean),
      timestamp: new Date().toISOString()
    });

    // Update collected types
    const monsterTypes = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean);

    for (const type of monsterTypes) {
      if (progressData.target_types.includes(type) && !progressData.collected_types.includes(type)) {
        progressData.collected_types.push(type);
      }
    }

    // Update collected species
    const monsterSpecies = [monster.species1, monster.species2, monster.species3].filter(Boolean);

    for (const species of monsterSpecies) {
      if (progressData.target_species.includes(species) && !progressData.collected_species.includes(species)) {
        progressData.collected_species.push(species);
      }
    }

    return true;
  }

  /**
   * Complete a mission
   * @param {number} trainerId - Trainer ID
   * @param {number} activeMissionId - Active mission ID
   * @returns {Promise<Object>} - Result of completing the mission
   */
  static async completeMission(trainerId, activeMissionId) {
    try {
      // Get active mission
      const query = `
        SELECT *
        FROM active_missions
        WHERE id = $1 AND trainer_id = $2
      `;

      const result = await pool.query(query, [activeMissionId, trainerId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          message: 'Active mission not found'
        };
      }

      const activeMission = result.rows[0];

      // Get mission details
      const missionQuery = `
        SELECT *
        FROM missions
        WHERE id = $1
      `;

      const missionResult = await pool.query(missionQuery, [activeMission.mission_id]);

      if (missionResult.rows.length === 0) {
        return {
          success: false,
          message: 'Mission not found'
        };
      }

      const mission = missionResult.rows[0];
      const rewards = JSON.parse(mission.rewards || '[]');

      // Add mission to history
      const historyQuery = `
        INSERT INTO mission_history (
          trainer_id,
          mission_id,
          completed_at,
          progress_data
        ) VALUES (
          $1, $2, NOW(), $3
        ) RETURNING *
      `;

      await pool.query(historyQuery, [
        trainerId,
        activeMission.mission_id,
        activeMission.progress_data
      ]);

      // Delete active mission
      const deleteQuery = `
        DELETE FROM active_missions
        WHERE id = $1
      `;

      await pool.query(deleteQuery, [activeMissionId]);

      // Process rewards
      const processedRewards = await RewardSystem.processRewards(rewards);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);

      // Apply rewards
      const rewardResults = [];

      for (const reward of processedRewards) {
        const result = await RewardSystem.processRewardClaim(
          reward,
          trainerId,
          [trainer],
          'mission'
        );

        rewardResults.push(result);
      }

      return {
        success: true,
        message: `Mission "${mission.name}" completed!`,
        mission,
        rewards: processedRewards,
        rewardResults
      };
    } catch (error) {
      console.error('Error completing mission:', error);
      return {
        success: false,
        message: `Error completing mission: ${error.message}`
      };
    }
  }

  /**
   * Abandon a mission
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Result of abandoning the mission
   */
  static async abandonMission(trainerId) {
    try {
      // Get active mission
      const activeMission = await this.getActiveMission(trainerId);

      if (!activeMission) {
        return {
          success: false,
          message: 'No active mission found'
        };
      }

      // Delete active mission
      const deleteQuery = `
        DELETE FROM active_missions
        WHERE trainer_id = $1
        RETURNING *
      `;

      const deleteResult = await pool.query(deleteQuery, [trainerId]);

      if (deleteResult.rows.length === 0) {
        return {
          success: false,
          message: 'Failed to abandon mission'
        };
      }

      return {
        success: true,
        message: 'Mission abandoned successfully'
      };
    } catch (error) {
      console.error('Error abandoning mission:', error);
      return {
        success: false,
        message: `Error abandoning mission: ${error.message}`
      };
    }
  }

  /**
   * Get mission history for a trainer
   * @param {number} trainerId - Trainer ID
   * @param {number} limit - Number of entries to return (optional, defaults to 10)
   * @returns {Promise<Object>} - Mission history
   */
  static async getMissionHistory(trainerId, limit = 10) {
    try {
      const query = `
        SELECT
          mh.*,
          m.name as mission_name,
          m.description as mission_description,
          m.type as mission_type,
          m.difficulty as mission_difficulty
        FROM mission_history mh
        JOIN missions m ON mh.mission_id = m.id
        WHERE mh.trainer_id = $1
        ORDER BY mh.completed_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [trainerId, limit]);

      return {
        success: true,
        history: result.rows.map(row => ({
          ...row,
          progress_data: JSON.parse(row.progress_data || '{}')
        }))
      };
    } catch (error) {
      console.error('Error getting mission history:', error);
      return {
        success: false,
        message: `Error getting mission history: ${error.message}`
      };
    }
  }

  /**
   * Create a new mission
   * @param {Object} missionData - Mission data
   * @returns {Promise<Object>} - Created mission
   */
  static async createMission(missionData) {
    try {
      const {
        name,
        description,
        type,
        difficulty,
        requirements,
        rewards,
        active = true
      } = missionData;

      // Validate mission data
      if (!name || !description || !type || !difficulty) {
        return {
          success: false,
          message: 'Missing required fields'
        };
      }

      // Create mission
      const query = `
        INSERT INTO missions (
          name,
          description,
          type,
          difficulty,
          requirements,
          rewards,
          active,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        ) RETURNING *
      `;

      const result = await pool.query(query, [
        name,
        description,
        type,
        difficulty,
        JSON.stringify(requirements || {}),
        JSON.stringify(rewards || []),
        active
      ]);

      return {
        success: true,
        mission: result.rows[0]
      };
    } catch (error) {
      console.error('Error creating mission:', error);
      return {
        success: false,
        message: `Error creating mission: ${error.message}`
      };
    }
  }
}

module.exports = MissionSystem;
