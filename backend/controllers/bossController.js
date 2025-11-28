const BossDamage = require('../models/BossDamage');
const db = require('../config/db');

/**
 * Boss Controller
 */

/**
 * Get current active boss
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getCurrentBoss = async (req, res) => {
  try {
    const boss = await BossDamage.getActiveBoss();
    
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'No active boss found'
      });
    }

    // Calculate health percentage
    const healthPercentage = Math.floor((boss.current_hp / boss.total_hp) * 100);

    res.json({
      success: true,
      data: {
        ...boss,
        healthPercentage
      }
    });
  } catch (error) {
    console.error('Error getting current boss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current boss'
    });
  }
};

/**
 * Get boss by ID
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getBossById = async (req, res) => {
  try {
    const { id } = req.params;
    const boss = await BossDamage.getBossById(id);
    
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'Boss not found'
      });
    }

    // Calculate health percentage
    const healthPercentage = Math.floor((boss.current_hp / boss.total_hp) * 100);

    res.json({
      success: true,
      data: {
        ...boss,
        healthPercentage
      }
    });
  } catch (error) {
    console.error('Error getting boss by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boss'
    });
  }
};

/**
 * Get boss damage leaderboard
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getBossLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    const leaderboard = await BossDamage.getLeaderboard(id, parseInt(limit));
    
    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error) {
    console.error('Error getting boss leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boss leaderboard'
    });
  }
};

/**
 * Get current boss with leaderboard
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getCurrentBossWithLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const boss = await BossDamage.getActiveBoss();
    
    if (!boss) {
      return res.status(404).json({
        success: false,
        message: 'No active boss found'
      });
    }

    // Get leaderboard for this boss
    const leaderboard = await BossDamage.getLeaderboard(boss.id, parseInt(limit));
    
    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    // Calculate health percentage
    const healthPercentage = Math.floor((boss.current_hp / boss.total_hp) * 100);

    res.json({
      success: true,
      data: {
        boss: {
          ...boss,
          healthPercentage
        },
        leaderboard: rankedLeaderboard
      }
    });
  } catch (error) {
    console.error('Error getting current boss with leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current boss with leaderboard'
    });
  }
};

/**
 * Get defeated bosses with rankings
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getDefeatedBosses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const bosses = await BossDamage.getDefeatedBosses(parseInt(limit));
    
    res.json({
      success: true,
      data: bosses
    });
  } catch (error) {
    console.error('Error getting defeated bosses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get defeated bosses'
    });
  }
};

/**
 * Get defeated boss by ID with full rankings
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getDefeatedBossById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;
    
    const bossData = await BossDamage.getDefeatedBossById(id, userId);
    
    if (!bossData) {
      return res.status(404).json({
        success: false,
        message: 'Defeated boss not found'
      });
    }
    
    res.json({
      success: true,
      data: bossData
    });
  } catch (error) {
    console.error('Error getting defeated boss by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get defeated boss'
    });
  }
};

/**
 * Create a new boss (Admin only)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const createBoss = async (req, res) => {
  try {
    const {
      name,
      description,
      image_url,
      total_hp,
      month,
      year,
      reward_monster_data,
      grunt_monster_data
    } = req.body;

    if (!name || !total_hp || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Name, total HP, month, and year are required'
      });
    }

    const query = `
      INSERT INTO bosses (
        name, description, image_url, total_hp, current_hp, 
        month, year, reward_monster_data, grunt_monster_data, status
      )
      VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9)
    `;

    await db.asyncRun(query, [
      name,
      description,
      image_url,
      total_hp,
      month,
      year,
      reward_monster_data ? JSON.stringify(reward_monster_data) : null,
      grunt_monster_data ? JSON.stringify(grunt_monster_data) : null,
      'active'
    ]);

    res.json({
      success: true,
      message: 'Boss created successfully'
    });
  } catch (error) {
    console.error('Error creating boss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create boss'
    });
  }
};

/**
 * Update boss (Admin only)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const updateBoss = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      image_url,
      total_hp,
      current_hp,
      month,
      year,
      status,
      reward_monster_data,
      grunt_monster_data
    } = req.body;

    const query = `
      UPDATE bosses 
      SET name = $1, description = $2, image_url = $3, total_hp = $4, 
          current_hp = $5, month = $6, year = $7, status = $8,
          reward_monster_data = $9, grunt_monster_data = $10
      WHERE id = $11
    `;

    await db.asyncRun(query, [
      name,
      description,
      image_url,
      total_hp,
      current_hp,
      month,
      year,
      status,
      reward_monster_data ? JSON.stringify(reward_monster_data) : null,
      grunt_monster_data ? JSON.stringify(grunt_monster_data) : null,
      id
    ]);

    res.json({
      success: true,
      message: 'Boss updated successfully'
    });
  } catch (error) {
    console.error('Error updating boss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update boss'
    });
  }
};

/**
 * Delete boss (Admin only)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const deleteBoss = async (req, res) => {
  try {
    const { id } = req.params;

    await db.asyncRun('DELETE FROM bosses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Boss deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting boss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete boss'
    });
  }
};

/**
 * Get all bosses (Admin only)
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getAllBosses = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.name,
        b.description,
        b.image_url,
        b.total_hp,
        b.current_hp,
        b.month,
        b.year,
        b.status,
        b.reward_monster_data,
        b.grunt_monster_data,
        b.start_date,
        b.created_at,
        COUNT(bd.id) as total_damage_entries,
        COUNT(DISTINCT bd.user_id) as total_participants
      FROM bosses b
      LEFT JOIN boss_damage bd ON b.id = bd.boss_id
      GROUP BY b.id, b.name, b.description, b.image_url, b.total_hp, b.current_hp, 
               b.month, b.year, b.status, b.reward_monster_data, b.grunt_monster_data,
               b.start_date, b.created_at
      ORDER BY b.year DESC, b.month DESC, b.created_at DESC
    `;
    
    const bosses = await db.asyncAll(query, []);
    
    // Parse JSON data
    const processedBosses = bosses.map(boss => ({
      ...boss,
      reward_monster_data: boss.reward_monster_data ? JSON.parse(boss.reward_monster_data) : null,
      grunt_monster_data: boss.grunt_monster_data ? JSON.parse(boss.grunt_monster_data) : null
    }));

    res.json({
      success: true,
      data: processedBosses
    });
  } catch (error) {
    console.error('Error getting all bosses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bosses'
    });
  }
};

/**
 * Add damage to boss
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const addBossDamage = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, damageAmount, submissionId } = req.body;

    if (!userId || !damageAmount) {
      return res.status(400).json({
        success: false,
        message: 'User ID and damage amount are required'
      });
    }

    const result = await BossDamage.addDamage(id, userId, damageAmount, submissionId);
    
    res.json(result);
  } catch (error) {
    console.error('Error adding boss damage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add boss damage'
    });
  }
};

/**
 * Get current boss with unclaimed rewards for user
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getCurrentBossWithRewards = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    const data = await BossDamage.getCurrentBossWithRewards(userId);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting current boss with rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current boss with rewards'
    });
  }
};

/**
 * Get unclaimed rewards for user
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const getUnclaimedRewards = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    
    console.log('Getting unclaimed rewards for userId:', userId);
    console.log('req.user:', req.user);
    console.log('req.query:', req.query);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const rewards = await BossDamage.getUnclaimedRewards(userId);
    console.log('Found rewards:', rewards);
    
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Error getting unclaimed rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unclaimed rewards'
    });
  }
};

/**
 * Claim boss reward
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
const claimBossReward = async (req, res) => {
  try {
    const { bossId } = req.params;
    const { userId, monsterName, trainerId } = req.body;

    if (!userId || !monsterName || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'User ID, monster name, and trainer ID are required'
      });
    }

    const result = await BossDamage.claimReward(bossId, userId, monsterName, trainerId);
    
    res.json(result);
  } catch (error) {
    console.error('Error claiming boss reward:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim boss reward'
    });
  }
};

module.exports = {
  getCurrentBoss,
  getBossById,
  getBossLeaderboard,
  getCurrentBossWithLeaderboard,
  getDefeatedBosses,
  getDefeatedBossById,
  createBoss,
  updateBoss,
  deleteBoss,
  getAllBosses,
  addBossDamage,
  getCurrentBossWithRewards,
  getUnclaimedRewards,
  claimBossReward
};
