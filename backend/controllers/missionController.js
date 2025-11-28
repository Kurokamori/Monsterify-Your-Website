const Mission = require('../models/Mission');
const MissionProgress = require('../models/MissionProgress');
const Monster = require('../models/Monster');

/**
 * Get all missions
 */
const getAllMissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      status = 'active'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      difficulty,
      status
    };

    const result = await Mission.getAll(options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting missions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get missions',
      error: error.message
    });
  }
};

/**
 * Get mission by ID
 */
const getMissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await Mission.getById(id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found'
      });
    }

    res.json({
      success: true,
      data: mission
    });
  } catch (error) {
    console.error('Error getting mission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mission',
      error: error.message
    });
  }
};

/**
 * Get available missions for user
 */
const getAvailableMissions = async (req, res) => {
  try {
    const userId = req.user?.discord_id || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const missionData = await Mission.getAvailableForUser(userId);

    res.json({
      success: true,
      data: missionData.availableMissions,
      hasActiveMission: missionData.hasActiveMission,
      activeMissions: missionData.activeMissions
    });
  } catch (error) {
    console.error('Error getting available missions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available missions',
      error: error.message
    });
  }
};

/**
 * Get active missions for user
 */
const getActiveMissions = async (req, res) => {
  try {
    const userId = req.user?.discord_id || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const missions = await MissionProgress.getActiveByUserId(userId);

    res.json({
      success: true,
      data: missions
    });
  } catch (error) {
    console.error('Error getting active missions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active missions',
      error: error.message
    });
  }
};

/**
 * Get eligible monsters for a mission
 */
const getEligibleMonsters = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user?.discord_id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const monsters = await Mission.getEligibleMonsters(userId, missionId);

    res.json({
      success: true,
      data: monsters
    });
  } catch (error) {
    console.error('Error getting eligible monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible monsters',
      error: error.message
    });
  }
};

/**
 * Start a mission
 */
const startMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const { monsterIds = [] } = req.body;
    const userId = req.user?.discord_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const result = await Mission.startMission(userId, missionId, monsterIds);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error starting mission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start mission',
      error: error.message
    });
  }
};

/**
 * Claim mission rewards
 */
const claimRewards = async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user?.discord_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const result = await MissionProgress.claimRewardsByUserId(missionId, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error claiming mission rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim mission rewards',
      error: error.message
    });
  }
};

/**
 * Create a new mission (admin only)
 */
const createMission = async (req, res) => {
  try {
    const missionData = req.body;
    const mission = await Mission.create(missionData);

    res.status(201).json({
      success: true,
      data: mission,
      message: 'Mission created successfully'
    });
  } catch (error) {
    console.error('Error creating mission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mission',
      error: error.message
    });
  }
};

module.exports = {
  getAllMissions,
  getMissionById,
  getAvailableMissions,
  getActiveMissions,
  getEligibleMonsters,
  startMission,
  claimRewards,
  createMission
};
