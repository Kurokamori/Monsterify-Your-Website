const express = require('express');
const router = express.Router();
const BattleOpponent = require('../../models/BattleOpponent');
const Battle = require('../../models/Battle');
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');
const MonsterInitializer = require('../../utils/MonsterInitializer');
const pool = require('../../db');

// Import authentication middleware
const { ensureAdmin } = require('../../middleware/auth');

/**
 * @route GET /admin/battles
 * @description Battle system management dashboard
 * @access Admin
 */
router.get('/', ensureAdmin, async (req, res) => {
  try {
    // Check if battle tables exist
    try {
      // Check if battles table exists
      await pool.query('SELECT 1 FROM battles LIMIT 1');
      await pool.query('SELECT 1 FROM battle_opponents LIMIT 1');
    } catch (error) {
      // Tables don't exist yet, render with empty stats
      console.log('Battle tables do not exist yet:', error.message);
      return res.render('admin/battles/index', {
        title: 'Battle System Management',
        stats: {
          total_battles: 0,
          wins: 0,
          losses: 0,
          avg_wpm: 0,
          total_opponents: 0
        },
        message: 'Battle system tables have not been created yet. Please run the battle_system.sql migration.',
        messageType: 'error'
      });
    }

    // Get battle statistics
    const statsQuery = `
      SELECT
        COUNT(*) AS total_battles,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS losses,
        AVG(wpm) AS avg_wpm
      FROM battles
      WHERE status != 'in_progress'
    `;

    const statsResult = await pool.query(statsQuery);
    const battleStats = statsResult.rows[0];

    // Get opponent count
    const opponentCountQuery = 'SELECT COUNT(*) AS total_opponents FROM battle_opponents';
    const opponentCountResult = await pool.query(opponentCountQuery);
    const opponentCount = opponentCountResult.rows[0];

    // Combine stats
    const stats = {
      ...battleStats,
      ...opponentCount
    };

    res.render('admin/battles/index', {
      title: 'Battle System Management',
      stats,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading battle management dashboard:', error);
    res.render('admin/battles/index', {
      title: 'Battle System Management',
      stats: {},
      message: 'Error loading battle management dashboard',
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/run-migration
 * @description Run the battle system migration script
 * @access Admin
 */
router.get('/run-migration', ensureAdmin, async (req, res) => {
  try {
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../../db/migrations/battle_system.sql');

    if (!fs.existsSync(migrationPath)) {
      return res.redirect('/admin/battles?message=Migration+file+not+found&messageType=error');
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSql);

    // Redirect back to the battles page with success message
    res.redirect('/admin/battles?message=Battle+system+migration+completed+successfully&messageType=success');
  } catch (error) {
    console.error('Error running battle system migration:', error);
    res.redirect(`/admin/battles?message=${encodeURIComponent('Error running migration: ' + error.message)}&messageType=error`);
  }
});

/**
 * @route GET /admin/battles/opponents
 * @description Get all battle opponents (admin view)
 * @access Admin
 */
router.get('/opponents', ensureAdmin, async (req, res) => {
  try {
    // Check if battle_opponents table exists
    try {
      await pool.query('SELECT 1 FROM battle_opponents LIMIT 1');
    } catch (error) {
      // Table doesn't exist yet, render with empty data
      console.log('battle_opponents table does not exist yet:', error.message);
      return res.render('admin/battles/opponents', {
        title: 'Battle Opponents',
        opponents: [],
        message: 'Battle system tables have not been created yet. Please run the battle_system.sql migration.',
        messageType: 'error'
      });
    }

    const opponents = await BattleOpponent.getAll(false);

    res.render('admin/battles/opponents', {
      title: 'Battle Opponents',
      opponents,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting battle opponents:', error);
    res.render('admin/battles/opponents', {
      title: 'Battle Opponents',
      opponents: [],
      message: 'Error getting battle opponents',
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/opponents/new
 * @description Show form to create a new battle opponent
 * @access Admin
 */
router.get('/opponents/new', ensureAdmin, async (req, res) => {
  res.render('admin/battles/opponent-form', {
    title: 'Create Battle Opponent',
    opponent: {},
    isNew: true,
    message: req.query.message,
    messageType: req.query.messageType
  });
});

/**
 * @route POST /admin/battles/opponents/new
 * @description Create a new battle opponent
 * @access Admin
 */
router.post('/opponents/new', ensureAdmin, async (req, res) => {
  try {
    const { name, description, image_url, difficulty, level, type, is_active } = req.body;

    // Validate required fields
    if (!name || !difficulty || !level) {
      return res.render('admin/battles/opponent-form', {
        title: 'Create Battle Opponent',
        opponent: req.body,
        isNew: true,
        message: 'Name, difficulty, and level are required',
        messageType: 'error'
      });
    }

    // Create opponent
    const opponent = await BattleOpponent.create({
      name,
      description,
      image_url,
      difficulty,
      level: parseInt(level),
      type,
      is_active: is_active === 'on'
    });

    if (!opponent) {
      return res.render('admin/battles/opponent-form', {
        title: 'Create Battle Opponent',
        opponent: req.body,
        isNew: true,
        message: 'Failed to create opponent',
        messageType: 'error'
      });
    }

    res.redirect(`/admin/battles/opponents/${opponent.opponent_id}`);
  } catch (error) {
    console.error('Error creating battle opponent:', error);
    res.render('admin/battles/opponent-form', {
      title: 'Create Battle Opponent',
      opponent: req.body,
      isNew: true,
      message: `Error creating opponent: ${error.message}`,
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/opponents/:id
 * @description Get a battle opponent by ID (admin view)
 * @access Admin
 */
router.get('/opponents/:id', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.redirect('/admin/battles/opponents');
    }

    // Get opponent's monsters
    const monsters = await BattleOpponent.getMonsters(opponentId);

    res.render('admin/battles/opponent-detail', {
      title: `Battle Opponent: ${opponent.name}`,
      opponent,
      monsters,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting battle opponent:', error);
    res.redirect('/admin/battles/opponents');
  }
});

/**
 * @route GET /admin/battles/opponents/:id/delete
 * @description Delete a battle opponent
 * @access Admin
 */
router.get('/opponents/:id/delete', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;

    // Get opponent to confirm it exists
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.redirect('/admin/battles/opponents?message=Opponent+not+found&messageType=error');
    }

    // Delete the opponent using the model method
    const deleted = await BattleOpponent.delete(opponentId);

    if (!deleted) {
      return res.redirect('/admin/battles/opponents?message=Failed+to+delete+opponent&messageType=error');
    }

    // Redirect with success message
    res.redirect('/admin/battles/opponents?message=Opponent+deleted+successfully&messageType=success');
  } catch (error) {
    console.error('Error deleting battle opponent:', error);
    res.redirect(`/admin/battles/opponents?message=${encodeURIComponent('Error deleting opponent: ' + error.message)}&messageType=error`);
  }
});

/**
 * @route GET /admin/battles/opponents/:opponentId/monsters/:monsterId/delete
 * @description Delete a monster from an opponent's team
 * @access Admin
 */
router.get('/opponents/:opponentId/monsters/:monsterId/delete', ensureAdmin, async (req, res) => {
  try {
    const { opponentId, monsterId } = req.params;

    // Delete the monster
    await pool.query('DELETE FROM battle_opponent_monsters WHERE monster_id = $1 AND opponent_id = $2', [monsterId, opponentId]);

    // Redirect with success message
    res.redirect(`/admin/battles/opponents/${opponentId}?message=Monster+removed+successfully&messageType=success`);
  } catch (error) {
    console.error('Error deleting opponent monster:', error);
    res.redirect(`/admin/battles/opponents/${req.params.opponentId}?message=${encodeURIComponent('Error removing monster: ' + error.message)}&messageType=error`);
  }
});

/**
 * @route GET /admin/battles/opponents/:id/edit
 * @description Show form to edit a battle opponent
 * @access Admin
 */
router.get('/opponents/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.redirect('/admin/battles/opponents');
    }

    res.render('admin/battles/opponent-form', {
      title: `Edit Battle Opponent: ${opponent.name}`,
      opponent,
      isNew: false,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting battle opponent for edit:', error);
    res.redirect('/admin/battles/opponents');
  }
});

/**
 * @route POST /admin/battles/opponents/:id/edit
 * @description Update a battle opponent
 * @access Admin
 */
router.post('/opponents/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const { name, description, image_url, difficulty, level, type, is_active } = req.body;

    // Validate required fields
    if (!name || !difficulty || !level) {
      return res.render('admin/battles/opponent-form', {
        title: 'Edit Battle Opponent',
        opponent: { ...req.body, opponent_id: opponentId },
        isNew: false,
        message: 'Name, difficulty, and level are required',
        messageType: 'error'
      });
    }

    // Update opponent
    const opponent = await BattleOpponent.update(opponentId, {
      name,
      description,
      image_url,
      difficulty,
      level: parseInt(level),
      type,
      is_active: is_active === 'on'
    });

    if (!opponent) {
      return res.render('admin/battles/opponent-form', {
        title: 'Edit Battle Opponent',
        opponent: { ...req.body, opponent_id: opponentId },
        isNew: false,
        message: 'Failed to update opponent',
        messageType: 'error'
      });
    }

    res.redirect(`/admin/battles/opponents/${opponentId}`);
  } catch (error) {
    console.error('Error updating battle opponent:', error);
    res.render('admin/battles/opponent-form', {
      title: 'Edit Battle Opponent',
      opponent: { ...req.body, opponent_id: req.params.id },
      isNew: false,
      message: `Error updating opponent: ${error.message}`,
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/opponents/:id/add-monster
 * @description Show form to add a monster to an opponent
 * @access Admin
 */
router.get('/opponents/:id/add-monster', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.redirect('/admin/battles/opponents');
    }

    res.render('admin/battles/monster-form', {
      title: `Add Monster to ${opponent.name}`,
      opponent,
      monster: {},
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error showing add monster form:', error);
    res.redirect(`/admin/battles/opponents/${req.params.id}`);
  }
});

/**
 * @route POST /admin/battles/opponents/:id/add-monster
 * @description Add a monster to an opponent
 * @access Admin
 */
router.post('/opponents/:id/add-monster', ensureAdmin, async (req, res) => {
  try {
    const opponentId = req.params.id;
    const opponent = await BattleOpponent.getById(opponentId);

    if (!opponent) {
      return res.redirect('/admin/battles/opponents');
    }

    const {
      name, level, species1, species2, species3,
      type1, type2, type3, type4, type5, attribute,
      image_url
    } = req.body;

    // Validate required fields
    if (!name || !level || !species1 || !type1) {
      return res.render('admin/battles/monster-form', {
        title: `Add Monster to ${opponent.name}`,
        opponent,
        monster: req.body,
        message: 'Name, level, species1, and type1 are required',
        messageType: 'error'
      });
    }

    // Calculate stats based on level
    const stats = MonsterInitializer.calculateBaseStats(parseInt(level));

    // Create monster data
    const monsterData = {
      name,
      level: parseInt(level),
      species1,
      species2,
      species3,
      type1,
      type2,
      type3,
      type4,
      type5,
      attribute,
      hp_total: stats.hp_total,
      atk_total: stats.atk_total,
      def_total: stats.def_total,
      spa_total: stats.spa_total,
      spd_total: stats.spd_total,
      spe_total: stats.spe_total,
      image_url
    };

    // Add monster to opponent
    const monster = await BattleOpponent.addMonster(opponentId, monsterData);

    if (!monster) {
      return res.render('admin/battles/monster-form', {
        title: `Add Monster to ${opponent.name}`,
        opponent,
        monster: req.body,
        message: 'Failed to add monster',
        messageType: 'error'
      });
    }

    res.redirect(`/admin/battles/opponents/${opponentId}`);
  } catch (error) {
    console.error('Error adding monster to opponent:', error);
    res.render('admin/battles/monster-form', {
      title: `Add Monster to Opponent`,
      opponent: { opponent_id: req.params.id },
      monster: req.body,
      message: `Error adding monster: ${error.message}`,
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/test
 * @description Battle system testing interface
 * @access Admin
 */
router.get('/test', ensureAdmin, async (req, res) => {
  try {
    // Check if battle tables exist
    try {
      // Check if battles table exists
      await pool.query('SELECT 1 FROM battles LIMIT 1');
      await pool.query('SELECT 1 FROM battle_opponents LIMIT 1');
    } catch (error) {
      // Tables don't exist yet, render with empty data
      console.log('Battle tables do not exist yet:', error.message);
      return res.render('admin/battles/test', {
        title: 'Battle System Testing',
        trainers: [],
        opponents: [],
        recentBattles: [],
        message: 'Battle system tables have not been created yet. Please run the battle_system.sql migration.',
        messageType: 'error'
      });
    }

    // Get all trainers
    const trainers = await Trainer.getAll();

    // Get all battle opponents
    const opponents = await BattleOpponent.getAll(true);

    // Get recent battles
    const recentBattlesQuery = `
      SELECT b.*, t.name AS trainer_name, bo.name AS opponent_name
      FROM battles b
      JOIN trainers t ON b.trainer_id = t.id
      JOIN battle_opponents bo ON b.opponent_id = bo.opponent_id
      ORDER BY b.started_at DESC
      LIMIT 10
    `;

    const recentBattlesResult = await pool.query(recentBattlesQuery);
    const recentBattles = recentBattlesResult.rows;

    res.render('admin/battles/test', {
      title: 'Battle System Testing',
      trainers,
      opponents,
      recentBattles,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading battle test page:', error);
    res.render('admin/battles/test', {
      title: 'Battle System Testing',
      trainers: [],
      opponents: [],
      recentBattles: [],
      message: 'Error loading battle test page',
      messageType: 'error'
    });
  }
});

/**
 * @route GET /admin/battles/stats
 * @description View battle statistics
 * @access Admin
 */
router.get('/stats', ensureAdmin, async (req, res) => {
  try {
    // Check if battle tables exist
    try {
      // Check if battles table exists
      await pool.query('SELECT 1 FROM battles LIMIT 1');
      await pool.query('SELECT 1 FROM battle_opponents LIMIT 1');
    } catch (error) {
      // Tables don't exist yet, render with empty stats
      console.log('Battle tables do not exist yet:', error.message);
      return res.render('admin/battles/stats', {
        title: 'Battle Statistics',
        stats: {
          total_battles: 0,
          wins: 0,
          losses: 0,
          abandoned: 0,
          avg_wpm: 0,
          avg_accuracy: 0
        },
        recentBattles: [],
        message: 'Battle system tables have not been created yet. Please run the battle_system.sql migration.',
        messageType: 'error'
      });
    }

    // Get battle statistics
    const query = `
      SELECT
        COUNT(*) AS total_battles,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS losses,
        SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned,
        AVG(wpm) AS avg_wpm,
        AVG(accuracy) AS avg_accuracy
      FROM battles
      WHERE status != 'in_progress'
    `;

    const statsResult = await pool.query(query);
    const stats = statsResult.rows[0];

    // Get recent battles
    const recentBattlesQuery = `
      SELECT b.*, t.name AS trainer_name, bo.name AS opponent_name
      FROM battles b
      JOIN trainers t ON b.trainer_id = t.id
      JOIN battle_opponents bo ON b.opponent_id = bo.opponent_id
      ORDER BY b.started_at DESC
      LIMIT 20
    `;

    const recentBattlesResult = await pool.query(recentBattlesQuery);
    const recentBattles = recentBattlesResult.rows;

    res.render('admin/battles/stats', {
      title: 'Battle Statistics',
      stats,
      recentBattles,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting battle statistics:', error);
    res.render('admin/battles/stats', {
      title: 'Battle Statistics',
      stats: {},
      recentBattles: [],
      message: 'Error getting battle statistics',
      messageType: 'error'
    });
  }
});

module.exports = router;
