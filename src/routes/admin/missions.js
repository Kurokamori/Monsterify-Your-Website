const express = require('express');
const router = express.Router();
const pool = require('../../db');
const Mission = require('../../models/Mission');
const ActiveMission = require('../../models/ActiveMission');
const MissionHistory = require('../../models/MissionHistory');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }
  next();
};

// Mission Management Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    // Ensure the missions table exists
    await Mission.createTableIfNotExists();

    // Get all missions
    const missions = await Mission.getAll();
    console.log(`Admin: Found ${missions.length} missions`);

    const message = req.query.message || '';
    const messageType = req.query.messageType || 'success';

    res.render('admin/missions/index', {
      title: 'Mission Management',
      missions,
      message,
      messageType
    });
  } catch (error) {
    console.error('Error loading missions:', error);
    res.status(500).render('error', {
      message: 'Error loading missions',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create Mission Form
router.get('/create', isAdmin, async (req, res) => {
  try {
    // Get available types and attributes for the form
    const availableTypes = await Mission.getAvailableTypes();
    const availableAttributes = await Mission.getAvailableAttributes();
    const availableItems = await Mission.getAvailableItems();

    res.render('admin/missions/form', {
      title: 'Create New Mission',
      isNew: true,
      mission: {},
      availableTypes,
      availableAttributes,
      availableItems
    });
  } catch (error) {
    console.error('Error loading mission form data:', error);
    res.status(500).render('error', {
      message: 'Error loading mission form data',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Add Mission Form (alias for create)
router.get('/add', isAdmin, async (req, res) => {
  try {
    // Get available types and attributes for the form
    const availableTypes = await Mission.getAvailableTypes();
    const availableAttributes = await Mission.getAvailableAttributes();
    const availableItems = await Mission.getAvailableItems();

    res.render('admin/missions/form', {
      title: 'Add New Mission',
      isNew: true,
      mission: {},
      availableTypes,
      availableAttributes,
      availableItems
    });
  } catch (error) {
    console.error('Error loading mission form data:', error);
    res.status(500).render('error', {
      message: 'Error loading mission form data',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create Mission Action
router.post('/create', isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      progress_flavor_1,
      progress_flavor_2,
      progress_flavor_3,
      progress_flavor_4,
      progress_flavor_5,
      completion_message,
      completion_image_url,
      progress_image_url,
      level_requirement,
      type_requirements,
      attribute_requirements,
      requirements_type,
      level_rewards,
      coin_rewards,
      item_rewards,
      item_reward_amount,
      min_progress_needed,
      max_progress_needed,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !description || !level_rewards || !coin_rewards || !min_progress_needed) {
      return res.render('admin/missions/create', {
        title: 'Create New Mission',
        message: 'Missing required fields',
        messageType: 'error',
        formData: req.body
      });
    }

    // Process type and attribute requirements
    const typeReqs = type_requirements ? type_requirements.split(',').map(t => t.trim()) : [];
    const attrReqs = attribute_requirements ? attribute_requirements.split(',').map(a => a.trim()) : [];
    const itemRewards = item_rewards ? item_rewards.split(',').map(i => i.trim()) : [];

    // Create the mission
    const mission = await Mission.create({
      name,
      description,
      progress_flavor_1: progress_flavor_1 || '',
      progress_flavor_2: progress_flavor_2 || '',
      progress_flavor_3: progress_flavor_3 || '',
      progress_flavor_4: progress_flavor_4 || '',
      progress_flavor_5: progress_flavor_5 || '',
      completion_message: completion_message || '',
      completion_image_url: completion_image_url || '',
      progress_image_url: progress_image_url || '',
      level_requirement: level_requirement ? parseInt(level_requirement) : null,
      type_requirements: typeReqs,
      attribute_requirements: attrReqs,
      requirements_type: requirements_type || 'OR',
      level_rewards: parseInt(level_rewards),
      coin_rewards: parseInt(coin_rewards),
      item_rewards: itemRewards,
      item_reward_amount: item_reward_amount ? parseInt(item_reward_amount) : 0,
      min_progress_needed: parseInt(min_progress_needed),
      max_progress_needed: max_progress_needed ? parseInt(max_progress_needed) : null,
      is_active: is_active === 'on'
    });

    // Redirect to mission management with success message
    res.redirect('/admin/missions?message=' + encodeURIComponent('Mission created successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error creating mission:', error);
    res.render('admin/missions/create', {
      title: 'Create New Mission',
      message: 'Error creating mission: ' + error.message,
      messageType: 'error',
      formData: req.body
    });
  }
});

// Add Mission Action (alias for create)
router.post('/add', isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      progress_flavor_1,
      progress_flavor_2,
      progress_flavor_3,
      progress_flavor_4,
      progress_flavor_5,
      completion_message,
      completion_image_url,
      progress_image_url,
      level_requirement,
      type_requirements,
      attribute_requirements,
      requirements_type,
      level_rewards,
      coin_rewards,
      item_rewards,
      item_reward_amount,
      min_progress_needed,
      max_progress_needed,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !description || !level_rewards || !coin_rewards || !min_progress_needed) {
      // Get available types and attributes for the form
      const availableTypes = await Mission.getAvailableTypes();
      const availableAttributes = await Mission.getAvailableAttributes();
      const availableItems = await Mission.getAvailableItems();

      return res.render('admin/missions/form', {
        title: 'Add New Mission',
        isNew: true,
        message: 'Missing required fields',
        messageType: 'error',
        mission: req.body,
        availableTypes,
        availableAttributes,
        availableItems
      });
    }

    // Process type and attribute requirements
    const typeReqs = type_requirements ? type_requirements.split(',').map(t => t.trim()) : [];
    const attrReqs = attribute_requirements ? attribute_requirements.split(',').map(a => a.trim()) : [];
    const itemRewards = item_rewards ? item_rewards.split(',').map(i => i.trim()) : [];

    // Create the mission
    const mission = await Mission.create({
      name,
      description,
      progress_flavor_1,
      progress_flavor_2,
      progress_flavor_3,
      progress_flavor_4,
      progress_flavor_5,
      completion_message,
      completion_image_url,
      progress_image_url,
      level_requirement: level_requirement ? parseInt(level_requirement) : null,
      type_requirements: typeReqs,
      attribute_requirements: attrReqs,
      requirements_type: requirements_type || 'OR',
      level_rewards: parseInt(level_rewards),
      coin_rewards: parseInt(coin_rewards),
      item_rewards: itemRewards,
      item_reward_amount: item_reward_amount ? parseInt(item_reward_amount) : 0,
      min_progress_needed: parseInt(min_progress_needed),
      max_progress_needed: max_progress_needed ? parseInt(max_progress_needed) : null,
      is_active: is_active === 'on'
    });

    // Redirect to mission management with success message
    res.redirect('/admin/missions?message=' + encodeURIComponent('Mission created successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error creating mission:', error);
    // Get available types and attributes for the form
    const availableTypes = await Mission.getAvailableTypes();
    const availableAttributes = await Mission.getAvailableAttributes();
    const availableItems = await Mission.getAvailableItems();

    res.render('admin/missions/form', {
      title: 'Add New Mission',
      isNew: true,
      message: 'Error creating mission: ' + error.message,
      messageType: 'error',
      mission: req.body,
      availableTypes,
      availableAttributes,
      availableItems
    });
  }
});

// Edit Mission Form
router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const missionId = req.params.id;

    // Get mission details
    const mission = await Mission.getById(missionId);

    if (!mission) {
      return res.redirect('/admin/missions?message=' + encodeURIComponent('Mission not found') + '&messageType=error');
    }

    // Get available types and attributes for the form
    const availableTypes = await Mission.getAvailableTypes();
    const availableAttributes = await Mission.getAvailableAttributes();
    const availableItems = await Mission.getAvailableItems();

    res.render('admin/missions/form', {
      title: 'Edit Mission',
      isNew: false,
      mission,
      availableTypes,
      availableAttributes,
      availableItems
    });
  } catch (error) {
    console.error('Error loading mission for editing:', error);
    res.status(500).render('error', {
      message: 'Error loading mission for editing',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update Mission Action
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const missionId = req.params.id;
    const {
      name,
      description,
      progress_flavor_1,
      progress_flavor_2,
      progress_flavor_3,
      progress_flavor_4,
      progress_flavor_5,
      completion_message,
      completion_image_url,
      progress_image_url,
      level_requirement,
      type_requirements,
      attribute_requirements,
      requirements_type,
      level_rewards,
      coin_rewards,
      item_rewards,
      item_reward_amount,
      min_progress_needed,
      max_progress_needed,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !description || !level_rewards || !coin_rewards || !min_progress_needed) {
      // Get available types and attributes for the form
      const availableTypes = await Mission.getAvailableTypes();
      const availableAttributes = await Mission.getAvailableAttributes();
      const availableItems = await Mission.getAvailableItems();

      return res.render('admin/missions/form', {
        title: 'Edit Mission',
        isNew: false,
        message: 'Missing required fields',
        messageType: 'error',
        mission: { ...req.body, id: missionId },
        availableTypes,
        availableAttributes,
        availableItems
      });
    }

    // Process type and attribute requirements
    const typeReqs = type_requirements ? type_requirements.split(',').map(t => t.trim()) : [];
    const attrReqs = attribute_requirements ? attribute_requirements.split(',').map(a => a.trim()) : [];
    const itemRewards = item_rewards ? item_rewards.split(',').map(i => i.trim()) : [];

    // Update the mission
    const mission = await Mission.update(missionId, {
      name,
      description,
      progress_flavor_1: progress_flavor_1 || '',
      progress_flavor_2: progress_flavor_2 || '',
      progress_flavor_3: progress_flavor_3 || '',
      progress_flavor_4: progress_flavor_4 || '',
      progress_flavor_5: progress_flavor_5 || '',
      completion_message: completion_message || '',
      completion_image_url: completion_image_url || '',
      progress_image_url: progress_image_url || '',
      level_requirement: level_requirement ? parseInt(level_requirement) : null,
      type_requirements: typeReqs,
      attribute_requirements: attrReqs,
      requirements_type: requirements_type || 'OR',
      level_rewards: parseInt(level_rewards),
      coin_rewards: parseInt(coin_rewards),
      item_rewards: itemRewards,
      item_reward_amount: item_reward_amount ? parseInt(item_reward_amount) : 0,
      min_progress_needed: parseInt(min_progress_needed),
      max_progress_needed: max_progress_needed ? parseInt(max_progress_needed) : null,
      is_active: is_active === 'on'
    });

    // Redirect to mission management with success message
    res.redirect('/admin/missions?message=' + encodeURIComponent('Mission updated successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error updating mission:', error);

    // Get available types and attributes for the form
    const availableTypes = await Mission.getAvailableTypes();
    const availableAttributes = await Mission.getAvailableAttributes();
    const availableItems = await Mission.getAvailableItems();

    res.render('admin/missions/form', {
      title: 'Edit Mission',
      isNew: false,
      message: 'Error updating mission: ' + error.message,
      messageType: 'error',
      mission: { ...req.body, id: req.params.id },
      availableTypes,
      availableAttributes,
      availableItems
    });
  }
});

// Delete Mission Confirmation
router.get('/delete/:id', isAdmin, async (req, res) => {
  try {
    const missionId = req.params.id;

    // Get mission details
    const mission = await Mission.getById(missionId);

    if (!mission) {
      return res.redirect('/admin/missions?message=' + encodeURIComponent('Mission not found') + '&messageType=error');
    }

    res.render('admin/missions/delete', {
      title: 'Delete Mission',
      mission
    });
  } catch (error) {
    console.error('Error loading mission for deletion:', error);
    res.status(500).render('error', {
      message: 'Error loading mission for deletion',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Delete Mission Action
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const missionId = req.params.id;

    // Delete the mission
    const result = await Mission.delete(missionId);

    if (!result) {
      return res.redirect('/admin/missions?message=' + encodeURIComponent('Mission not found') + '&messageType=error');
    }

    // Redirect to mission management with success message
    res.redirect('/admin/missions?message=' + encodeURIComponent('Mission deleted successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error deleting mission:', error);
    res.status(500).render('error', {
      message: 'Error deleting mission: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// View Active Missions
router.get('/active', isAdmin, async (req, res) => {
  try {
    // Ensure the active_missions table exists
    await ActiveMission.createTableIfNotExists();

    // Get all active missions
    const query = `
      SELECT am.*, m.name, m.description, t.name as trainer_name
      FROM active_missions am
      JOIN missions m ON am.mission_id = m.id
      JOIN trainers t ON am.user_id = t.player_user_id
      ORDER BY am.start_time DESC
    `;

    const result = await pool.query(query);
    const activeMissions = result.rows;

    res.render('admin/missions/active', {
      title: 'Active Missions',
      activeMissions,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading active missions:', error);
    res.status(500).render('error', {
      message: 'Error loading active missions',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// View Mission History
router.get('/history', isAdmin, async (req, res) => {
  try {
    // Ensure the mission_history table exists
    await MissionHistory.createTableIfNotExists();

    // Get mission history
    const query = `
      SELECT mh.*, m.name, m.description, t.name as trainer_name
      FROM mission_history mh
      JOIN missions m ON mh.mission_id = m.id
      JOIN trainers t ON mh.user_id = t.player_user_id
      ORDER BY mh.completed_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);
    const missionHistory = result.rows;

    res.render('admin/missions/history', {
      title: 'Mission History',
      missionHistory,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading mission history:', error);
    res.status(500).render('error', {
      message: 'Error loading mission history',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

module.exports = router;
