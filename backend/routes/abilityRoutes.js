const express = require('express');
const router = express.Router();
const Ability = require('../models/Ability');

// Helper to parse PostgreSQL text[] literal strings like "{grass, fire}" into arrays
function parseTextArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  // Strip surrounding braces and split by comma
  const inner = value.replace(/^\{|\}$/g, '');
  if (!inner.trim()) return [];
  return inner.split(',').map(s => s.trim()).filter(s => s);
}

/**
 * @route   GET /api/abilities
 * @desc    Get all abilities with advanced filtering
 * @access  Public
 * @query   search - Search term for name/effect/description
 * @query   monsterSearch - Search term for signature monsters
 * @query   types - Comma-separated list of types to filter by
 * @query   typeLogic - 'AND' or 'OR' for type filtering (default: OR)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 100)
 * @query   sortBy - Field to sort by (default: name)
 * @query   sortOrder - Sort order: asc or desc (default: asc)
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      monsterSearch = '',
      types = '',
      typeLogic = 'OR',
      page = 1,
      limit = 100,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Parse types from comma-separated string to array
    const typesArray = types ? types.split(',').map(t => t.trim()).filter(t => t) : [];

    const result = await Ability.getAll({
      search,
      monsterSearch,
      types: typesArray,
      typeLogic: typeLogic.toUpperCase() === 'AND' ? 'AND' : 'OR',
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Map abilities to include all fields with normalized names
    // Parse text[] fields that may come back as strings like "{grass, fire}"
    const abilities = result.data.map(ability => ({
      name: ability.name,
      effect: ability.effect || '',
      description: ability.description || '',
      commonTypes: parseTextArray(ability.common_types),
      signatureMonsters: parseTextArray(ability.signature_monsters)
    }));

    res.json({
      success: true,
      abilities,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Error fetching abilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch abilities'
    });
  }
});

/**
 * @route   GET /api/abilities/types
 * @desc    Get all unique types from abilities
 * @access  Public
 */
router.get('/types', async (req, res) => {
  try {
    const types = await Ability.getAllTypes();

    res.json({
      success: true,
      types
    });
  } catch (error) {
    console.error('Error fetching ability types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability types'
    });
  }
});

/**
 * @route   GET /api/abilities/names
 * @desc    Get all ability names (for autocomplete)
 * @access  Public
 */
router.get('/names', async (req, res) => {
  try {
    const result = await Ability.getAll({
      page: 1,
      limit: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    // Return just names and descriptions for autocomplete
    const abilities = result.data.map(ability => ({
      name: ability.name,
      description: ability.effect || ability.description || ''
    }));

    res.json({
      success: true,
      abilities
    });
  } catch (error) {
    console.error('Error fetching ability names:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability names'
    });
  }
});

/**
 * @route   GET /api/abilities/:name
 * @desc    Get ability by name
 * @access  Public
 */
router.get('/:name', async (req, res) => {
  try {
    const ability = await Ability.getByName(req.params.name);

    if (!ability) {
      return res.status(404).json({
        success: false,
        message: 'Ability not found'
      });
    }

    res.json({
      success: true,
      ability: {
        name: ability.name,
        effect: ability.effect || '',
        description: ability.description || '',
        commonTypes: parseTextArray(ability.common_types),
        signatureMonsters: parseTextArray(ability.signature_monsters)
      }
    });
  } catch (error) {
    console.error('Error fetching ability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ability'
    });
  }
});

module.exports = router;
