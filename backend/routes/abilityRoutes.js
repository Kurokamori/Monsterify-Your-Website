const express = require('express');
const router = express.Router();
const Ability = require('../models/Ability');

/**
 * @route   GET /api/abilities
 * @desc    Get all abilities with optional search
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 100 } = req.query;

    const result = await Ability.getAll({
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'abilityname',
      sortOrder: 'asc'
    });

    res.json({
      success: true,
      abilities: result.data,
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
 * @route   GET /api/abilities/names
 * @desc    Get all ability names (for autocomplete)
 * @access  Public
 */
router.get('/names', async (req, res) => {
  try {
    const result = await Ability.getAll({
      page: 1,
      limit: 1000,
      sortBy: 'abilityname',
      sortOrder: 'asc'
    });

    // Return just names and descriptions for autocomplete
    const abilities = result.data.map(ability => ({
      name: ability.abilityname,
      description: ability.effect
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
        name: ability.abilityname,
        description: ability.effect
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
