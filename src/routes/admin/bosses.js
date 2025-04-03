const express = require('express');
const router = express.Router();
const pool = require('../../db');
const Boss = require('../../models/Boss');
const BossRewardTemplate = require('../../models/BossRewardTemplate');
const rewardTemplatesRouter = require('./boss-reward-templates');

// Import authentication middleware
const { ensureAdmin } = require('../../middleware/auth');

// Boss Management Dashboard
router.get('/', ensureAdmin, async (req, res) => {
  try {
    // Get all bosses
    const query = `
      SELECT * FROM bosses
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    const bosses = result.rows;

    res.render('admin/bosses/index', {
      title: 'Boss Management',
      bosses,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error loading bosses:', error);
    res.status(500).render('error', {
      message: 'Error loading bosses',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create Boss Form
router.get('/create', ensureAdmin, (req, res) => {
  res.render('admin/bosses/create', {
    title: 'Create New Boss'
  });
});

// Create Boss Action
router.post('/create', ensureAdmin, async (req, res) => {
  try {
    const { name, flavor_text, image_url, max_health } = req.body;

    // Validate required fields
    if (!name || !max_health) {
      return res.render('admin/bosses/create', {
        title: 'Create New Boss',
        message: 'Name and Max Health are required fields',
        messageType: 'error',
        formData: req.body
      });
    }

    // Create the boss
    const boss = await Boss.create({
      name,
      flavor_text: flavor_text || '',
      image_url: image_url || '',
      max_health: parseInt(max_health)
    });

    if (!boss) {
      return res.render('admin/bosses/create', {
        title: 'Create New Boss',
        message: 'Error creating boss',
        messageType: 'error',
        formData: req.body
      });
    }

    // Redirect to boss management with success message
    res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss created successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error creating boss:', error);
    res.render('admin/bosses/create', {
      title: 'Create New Boss',
      message: 'Error creating boss: ' + error.message,
      messageType: 'error',
      formData: req.body
    });
  }
});

// Edit Boss Form
router.get('/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const bossId = req.params.id;

    // Get boss details
    const boss = await Boss.getById(bossId);

    if (!boss) {
      return res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss not found') + '&messageType=error');
    }

    res.render('admin/bosses/edit', {
      title: 'Edit Boss',
      boss
    });
  } catch (error) {
    console.error('Error loading boss for editing:', error);
    res.status(500).render('error', {
      message: 'Error loading boss for editing',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Update Boss Action
router.post('/edit/:id', ensureAdmin, async (req, res) => {
  try {
    const bossId = req.params.id;
    const { name, flavor_text, image_url, max_health, current_health, is_active, is_defeated } = req.body;

    // Validate required fields
    if (!name || !max_health) {
      return res.render('admin/bosses/edit', {
        title: 'Edit Boss',
        message: 'Name and Max Health are required fields',
        messageType: 'error',
        boss: { ...req.body, boss_id: bossId }
      });
    }

    // Update the boss
    const query = `
      UPDATE bosses
      SET name = $1,
          flavor_text = $2,
          image_url = $3,
          max_health = $4,
          current_health = $5,
          is_active = $6,
          is_defeated = $7
      WHERE boss_id = $8
      RETURNING *
    `;

    const values = [
      name,
      flavor_text || '',
      image_url || '',
      parseInt(max_health),
      parseInt(current_health),
      is_active === 'on',
      is_defeated === 'on',
      bossId
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.render('admin/bosses/edit', {
        title: 'Edit Boss',
        message: 'Boss not found',
        messageType: 'error',
        boss: { ...req.body, boss_id: bossId }
      });
    }

    // If this boss is now active, deactivate all other bosses
    if (is_active === 'on') {
      await pool.query(`
        UPDATE bosses
        SET is_active = false
        WHERE boss_id != $1
      `, [bossId]);
    }

    // Redirect to boss management with success message
    res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss updated successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error updating boss:', error);
    res.render('admin/bosses/edit', {
      title: 'Edit Boss',
      message: 'Error updating boss: ' + error.message,
      messageType: 'error',
      boss: { ...req.body, boss_id: req.params.id }
    });
  }
});

// Delete Boss Confirmation
router.get('/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const bossId = req.params.id;

    // Get boss details
    const boss = await Boss.getById(bossId);

    if (!boss) {
      return res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss not found') + '&messageType=error');
    }

    res.render('admin/bosses/delete', {
      title: 'Delete Boss',
      boss
    });
  } catch (error) {
    console.error('Error loading boss for deletion:', error);
    res.status(500).render('error', {
      message: 'Error loading boss for deletion',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Delete Boss Action
router.post('/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const bossId = req.params.id;

    // Delete the boss
    const query = `
      DELETE FROM bosses
      WHERE boss_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [bossId]);

    if (result.rows.length === 0) {
      return res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss not found') + '&messageType=error');
    }

    // Redirect to boss management with success message
    res.redirect('/admin/bosses?message=' + encodeURIComponent('Boss deleted successfully') + '&messageType=success');
  } catch (error) {
    console.error('Error deleting boss:', error);
    res.status(500).render('error', {
      message: 'Error deleting boss: ' + error.message,
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Use reward templates router
router.use('/reward-templates', rewardTemplatesRouter);

module.exports = router;
