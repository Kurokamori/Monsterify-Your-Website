const express = require('express');
const router = express.Router();
const Mission = require('../../models/Mission');
const ActiveMission = require('../../models/ActiveMission');
const MissionHistory = require('../../models/MissionHistory');
const MissionService = require('../../utils/MissionService');
const MissionSetup = require('../../models/MissionSetup');

// Initialize mission tables
(async () => {
  try {
    await MissionSetup.initializeTables();
  } catch (error) {
    console.error('Failed to initialize mission tables:', error);
  }
})();

/**
 * @route GET /api/missions/available
 * @desc Get available missions for the current user
 * @access Private
 */
router.get('/available', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Ensure missions table exists
    await Mission.createTableIfNotExists();

    const userId = req.session.user.discord_id;
    console.log(`API: Getting available missions for user ${userId}`);

    // Get total number of active missions in the database for debugging
    const allMissions = await Mission.getAll(true);
    console.log(`API: Total active missions in database: ${allMissions.length}`);

    const availableMissions = await MissionService.getAvailableMissions(userId);
    console.log(`API: Found ${availableMissions.length} available missions for user ${userId}`);

    res.json({
      success: true,
      missions: availableMissions,
      totalMissions: allMissions.length,
      debugInfo: MissionService.getDebugInfo() // Get any debug info collected during mission filtering
    });
  } catch (error) {
    console.error('Error getting available missions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting available missions'
    });
  }
});

/**
 * @route GET /api/missions/active
 * @desc Get the user's active mission
 * @access Private
 */
router.get('/active', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Ensure missions and active_missions tables exist
    await Mission.createTableIfNotExists();
    await ActiveMission.createTableIfNotExists();

    const userId = req.session.user.discord_id;
    console.log(`API: Getting active mission for user ${userId}`);

    const activeMission = await ActiveMission.getByUserId(userId);
    console.log(`API: Active mission found: ${activeMission ? 'Yes' : 'No'}`);

    res.json({
      success: true,
      mission: activeMission
    });
  } catch (error) {
    console.error('Error getting active mission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting active mission'
    });
  }
});

/**
 * @route POST /api/missions/start
 * @desc Start a new mission
 * @access Private
 */
router.post('/start', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { missionId, monIds } = req.body;
    const userId = req.session.user.discord_id;

    // Validate input
    if (!missionId || !monIds || !Array.isArray(monIds) || monIds.length === 0 || monIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mission or monster selection'
      });
    }

    // Start the mission
    const mission = await ActiveMission.start(userId, missionId, monIds);

    res.json({
      success: true,
      message: 'Mission started successfully',
      mission
    });
  } catch (error) {
    console.error('Error starting mission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error starting mission'
    });
  }
});

/**
 * @route GET /api/missions/history
 * @desc Get mission history for the current user
 * @access Private
 */
router.get('/history', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const userId = req.session.user.discord_id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const history = await MissionHistory.getByUserId(userId, limit, offset);
    const total = await MissionHistory.countByUserId(userId);

    res.json({
      success: true,
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting mission history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting mission history'
    });
  }
});

/**
 * @route GET /api/missions/templates
 * @desc Get all mission templates (admin only)
 * @access Private (Admin)
 */
router.get('/templates', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const templates = await Mission.getAll();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error getting mission templates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting mission templates'
    });
  }
});

/**
 * @route POST /api/missions/templates
 * @desc Create a new mission template (admin only)
 * @access Private (Admin)
 */
router.post('/templates', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const template = await Mission.create(req.body);

    res.json({
      success: true,
      message: 'Mission template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating mission template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating mission template'
    });
  }
});

/**
 * @route PUT /api/missions/templates/:id
 * @desc Update a mission template (admin only)
 * @access Private (Admin)
 */
router.put('/templates/:id', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const id = parseInt(req.params.id, 10);
    const template = await Mission.update(id, req.body);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Mission template not found'
      });
    }

    res.json({
      success: true,
      message: 'Mission template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating mission template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating mission template'
    });
  }
});

/**
 * @route DELETE /api/missions/templates/:id
 * @desc Delete a mission template (admin only)
 * @access Private (Admin)
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.session.user || !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const id = parseInt(req.params.id, 10);
    const success = await Mission.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Mission template not found'
      });
    }

    res.json({
      success: true,
      message: 'Mission template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mission template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting mission template'
    });
  }
});

module.exports = router;
