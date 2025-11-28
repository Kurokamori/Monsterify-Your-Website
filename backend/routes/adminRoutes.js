const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
const PokemonMonster = require('../models/PokemonMonster');
const DigimonMonster = require('../models/DigimonMonster');
const YokaiMonster = require('../models/YokaiMonster');
const NexomonMonster = require('../models/NexomonMonster');
const PalsMonster = require('../models/PalsMonster');

// Import faction controllers
const {
  getAllFactionPeopleAdmin,
  createFactionPersonAdmin,
  updateFactionPersonAdmin,
  deleteFactionPersonAdmin,
  getPersonTeamAdmin,
  addMonsterToTeamAdmin,
  updateMonsterAdmin,
  deleteMonsterAdmin
} = require('../controllers/factionController');

// Import admin sub-routes
const shopManagerRoutes = require('./admin/shopManager');
const itemManagementRoutes = require('./admin/itemManagement');
const levelManagementRoutes = require('./admin/levelManagement');

// Use admin sub-routes
router.use('/shop-manager', shopManagerRoutes);
router.use('/item-management', itemManagementRoutes);
router.use('/level-management', levelManagementRoutes);

/**
 * @route GET /api/admin/stats
 * @desc Get admin dashboard statistics
 * @access Admin
 */
router.get('/stats', protect, admin, async (req, res) => {
  try {
    // Fetch real statistics from the database
    const stats = {
      users: {
        total: await getUserCount(),
        new_this_week: await getNewUserCount(7)
      },
      trainers: {
        total: await getTrainerCount(),
        new_this_week: await getNewTrainerCount(7)
      },
      monsters: {
        total: await getMonsterCount(),
        new_this_week: await getNewMonsterCount(7)
      },
      fakemon: {
        total: await getFakemonCount(),
        new_this_week: await getNewFakemonCount(7)
      },
      submissions: {
        total: await getSubmissionCount(),
        pending: await getPendingSubmissionCount()
      },
      shops: {
        total: await getShopCount(),
        active: await getActiveShopCount()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Get all users for admin dashboard
 * @access Admin
 */
router.get('/users', protect, admin, async (req, res) => {
  try {
    // Fetch users from the database
    const User = require('../models/User');
    const users = await User.getAll();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Real database functions for statistics
const db = require('../config/db');

async function getUserCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM users');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
}

async function getNewUserCount(days) {
  try {
    const result = await db.asyncGet(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-" || $1 || " days")',
      [days]
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting new user count:', error);
    return 0;
  }
}

async function getTrainerCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM trainers');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting trainer count:', error);
    return 0;
  }
}

async function getNewTrainerCount(days) {
  try {
    const result = await db.asyncGet(
      'SELECT COUNT(*) as count FROM trainers WHERE created_at >= datetime("now", "-" || $1 || " days")',
      [days]
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting new trainer count:', error);
    return 0;
  }
}

async function getMonsterCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM monsters');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting monster count:', error);
    return 0;
  }
}

async function getNewMonsterCount(days) {
  try {
    const result = await db.asyncGet(
      'SELECT COUNT(*) as count FROM monsters WHERE created_at >= datetime("now", "-" || $1 || " days")',
      [days]
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting new monster count:', error);
    return 0;
  }
}

async function getFakemonCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM fakemon');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting fakemon count:', error);
    return 0;
  }
}

async function getNewFakemonCount(days) {
  try {
    const result = await db.asyncGet(
      'SELECT COUNT(*) as count FROM fakemon WHERE created_at >= datetime("now", "-" || $1 || " days")',
      [days]
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting new fakemon count:', error);
    return 0;
  }
}

async function getSubmissionCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM submissions');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting submission count:', error);
    return 0;
  }
}

async function getPendingSubmissionCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM submissions WHERE status = $1', ['pending']);
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting pending submission count:', error);
    return 0;
  }
}

async function getShopCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM shops');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting shop count:', error);
    return 0;
  }
}

async function getActiveShopCount() {
  try {
    const result = await db.asyncGet('SELECT COUNT(*) as count FROM shops WHERE active = 1');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error getting active shop count:', error);
    return 0;
  }
}

// ============== FACTION PEOPLE ADMIN ROUTES ==============

/**
 * @route GET /api/admin/faction-people
 * @desc Get all faction people for admin management
 * @access Admin
 */
router.get('/faction-people', protect, admin, getAllFactionPeopleAdmin);

/**
 * @route POST /api/admin/faction-people
 * @desc Create new faction person
 * @access Admin
 */
router.post('/faction-people', protect, admin, createFactionPersonAdmin);

/**
 * @route PUT /api/admin/faction-people/:personId
 * @desc Update faction person
 * @access Admin
 */
router.put('/faction-people/:personId', protect, admin, updateFactionPersonAdmin);

/**
 * @route DELETE /api/admin/faction-people/:personId
 * @desc Delete faction person
 * @access Admin
 */
router.delete('/faction-people/:personId', protect, admin, deleteFactionPersonAdmin);

/**
 * @route GET /api/admin/faction-people/:personId/team
 * @desc Get person's monster team
 * @access Admin
 */
router.get('/faction-people/:personId/team', protect, admin, getPersonTeamAdmin);

/**
 * @route POST /api/admin/faction-people/:personId/team
 * @desc Add monster to person's team
 * @access Admin
 */
router.post('/faction-people/:personId/team', protect, admin, addMonsterToTeamAdmin);

/**
 * @route PUT /api/admin/monsters/:monsterId
 * @desc Update monster in team
 * @access Admin
 */
router.put('/monsters/:monsterId', protect, admin, updateMonsterAdmin);

/**
 * @route DELETE /api/admin/monsters/:monsterId
 * @desc Delete monster from team
 * @access Admin
 */
router.delete('/monsters/:monsterId', protect, admin, deleteMonsterAdmin);

/**
 * @route GET /api/admin/monster-types/pokemon
 * @desc Get all Pokemon monsters for admin dashboard
 * @access Admin
 */
router.get('/monster-types/pokemon', protect, admin, async (req, res) => {
  try {
    const result = await PokemonMonster.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching Pokemon monsters for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/monster-types/digimon
 * @desc Get all Digimon monsters for admin dashboard
 * @access Admin
 */
router.get('/monster-types/digimon', protect, admin, async (req, res) => {
  try {
    const result = await DigimonMonster.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching Digimon monsters for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/monster-types/yokai
 * @desc Get all Yokai monsters for admin dashboard
 * @access Admin
 */
router.get('/monster-types/yokai', protect, admin, async (req, res) => {
  try {
    const result = await YokaiMonster.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching Yokai monsters for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/monster-types/nexomon
 * @desc Get all Nexomon monsters for admin dashboard
 * @access Admin
 */
router.get('/monster-types/nexomon', protect, admin, async (req, res) => {
  try {
    const result = await NexomonMonster.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching Nexomon monsters for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/monster-types/pals
 * @desc Get all Pals monsters for admin dashboard
 * @access Admin
 */
router.get('/monster-types/pals', protect, admin, async (req, res) => {
  try {
    const result = await PalsMonster.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching Pals monsters for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/monsters/bulk-add
 * @desc Bulk add monsters to a trainer
 * @access Admin
 */
router.post('/monsters/bulk-add', protect, admin, async (req, res) => {
  try {
    const { trainer_id, monsters_text } = req.body;
    
    if (!trainer_id || !monsters_text) {
      return res.status(400).json({
        success: false,
        message: 'trainer_id and monsters_text are required'
      });
    }

    // Get trainer to validate it exists
    const Trainer = require('../models/Trainer');
    const trainer = await Trainer.getById(trainer_id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Parse monsters text
    const lines = monsters_text.split('\n').filter(line => line.trim());
    const results = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse format: Name of Monster | Level | Species1,Species2,Species3 | type1-type5 | attribute (optional)
        const parts = line.split('|').map(part => part.trim());
        
        if (parts.length < 4) {
          errors.push(`Line ${i + 1}: Invalid format - expected at least 4 parts separated by |`);
          continue;
        }

        const [name, levelStr, speciesStr, typesStr, attribute] = parts;
        
        // Validate and parse level
        const level = parseInt(levelStr);
        if (isNaN(level) || level < 1 || level > 100) {
          errors.push(`Line ${i + 1}: Invalid level "${levelStr}" - must be between 1-100`);
          continue;
        }

        // Parse species
        const species = speciesStr.split(',').map(s => s.trim()).filter(s => s);
        if (species.length === 0) {
          errors.push(`Line ${i + 1}: No species provided`);
          continue;
        }

        // Parse types
        const types = typesStr.split(',').map(t => t.trim()).filter(t => t);
        if (types.length === 0) {
          errors.push(`Line ${i + 1}: No types provided`);
          continue;
        }

        console.log(`Line ${i + 1}: Parsed types:`, types);

        // Generate random attribute if not provided
        const finalAttribute = attribute && attribute.trim() ? attribute.trim() : generateRandomAttribute();

        // Create monster data
        const monsterData = {
          name: name,
          trainer_id: trainer_id,
          level: level,
          species1: species[0] || null,
          species2: species[1] || null,
          species3: species[2] || null,
          type1: types[0] || null,
          type2: types[1] || null,
          type3: types[2] || null,
          type4: types[3] || null,
          type5: types[4] || null,
          attribute: finalAttribute
        };

        console.log(`Line ${i + 1}: Monster data being created:`, monsterData);

        // Create monster
        const Monster = require('../models/Monster');
        const createdMonster = await Monster.create(monsterData);
        
        // Initialize monster with stats, moves, abilities, etc.
        const MonsterInitializer = require('../utils/MonsterInitializer');
        await MonsterInitializer.initializeMonster(createdMonster.id);

        results.push({
          line: i + 1,
          name: name,
          level: level,
          species: species.slice(0, 3),
          types: types.slice(0, 5),
          attribute: finalAttribute,
          monster_id: createdMonster.id
        });

      } catch (error) {
        console.error(`Error processing line ${i + 1}:`, error);
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${results.length} monsters`,
      data: {
        trainer_id: trainer_id,
        trainer_name: trainer.name,
        processed_count: results.length,
        error_count: errors.length,
        results: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Error in bulk add monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Helper function to generate random attribute
function generateRandomAttribute() {
  const attributes = [
    'Data', 'Variable', 'Virus', 'Vaccine', 'Free'
  ];
  return attributes[Math.floor(Math.random() * attributes.length)];
}

module.exports = router;
