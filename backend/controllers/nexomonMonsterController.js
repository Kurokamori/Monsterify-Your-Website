const NexomonMonster = require('../models/NexomonMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Nexomon monsters
 * @route   GET /api/nexomon-monsters
 * @access  Public
 */
const getAllNexomonMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'nr',
    sortOrder = 'asc',
    type = '',
    legendary = '',
    stage = ''
  } = req.query;

  // Convert string boolean values to actual booleans
  const legendaryBool = legendary === '' ? null : legendary === 'true';

  const result = await NexomonMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    type,
    legendary: legendaryBool,
    stage
  });

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
});

/**
 * @desc    Get Nexomon monster by number
 * @route   GET /api/nexomon-monsters/:nr
 * @access  Public
 */
const getNexomonMonsterByNr = asyncHandler(async (req, res) => {
  const nexomon = await NexomonMonster.getByNr(req.params.nr);

  if (!nexomon) {
    res.status(404);
    throw new Error('Nexomon monster not found');
  }

  res.json({
    success: true,
    data: nexomon
  });
});

/**
 * @desc    Create a new Nexomon monster
 * @route   POST /api/nexomon-monsters
 * @access  Admin
 */
const createNexomonMonster = asyncHandler(async (req, res) => {
  const {
    nr,
    name,
    is_legendary,
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  } = req.body;

  // Validate required fields
  if (!nr || !name || !type_primary || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: nr, name, type_primary, stage');
  }

  // Check if a Nexomon with the same number already exists
  const existingNexomon = await NexomonMonster.getByNr(nr);
  if (existingNexomon) {
    res.status(400);
    throw new Error(`A Nexomon with number ${nr} already exists`);
  }

  const nexomon = await NexomonMonster.create({
    nr: parseInt(nr),
    name,
    is_legendary: is_legendary === true || is_legendary === 'true',
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  });

  res.status(201).json({
    success: true,
    data: nexomon,
    message: 'Nexomon monster created successfully'
  });
});

/**
 * @desc    Update a Nexomon monster
 * @route   PUT /api/nexomon-monsters/:nr
 * @access  Admin
 */
const updateNexomonMonster = asyncHandler(async (req, res) => {
  const {
    name,
    is_legendary,
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  } = req.body;

  // Check if Nexomon exists
  const nexomon = await NexomonMonster.getByNr(req.params.nr);
  if (!nexomon) {
    res.status(404);
    throw new Error('Nexomon monster not found');
  }

  // Validate required fields
  if (!name || !type_primary || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, type_primary, stage');
  }

  const updatedNexomon = await NexomonMonster.update(req.params.nr, {
    name,
    is_legendary: is_legendary === true || is_legendary === 'true',
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  });

  res.json({
    success: true,
    data: updatedNexomon,
    message: 'Nexomon monster updated successfully'
  });
});

/**
 * @desc    Delete a Nexomon monster
 * @route   DELETE /api/nexomon-monsters/:nr
 * @access  Admin
 */
const deleteNexomonMonster = asyncHandler(async (req, res) => {
  // Check if Nexomon exists
  const nexomon = await NexomonMonster.getByNr(req.params.nr);
  if (!nexomon) {
    res.status(404);
    throw new Error('Nexomon monster not found');
  }

  await NexomonMonster.delete(req.params.nr);

  res.json({
    success: true,
    message: 'Nexomon monster deleted successfully'
  });
});

module.exports = {
  getAllNexomonMonsters,
  getNexomonMonsterByNr,
  createNexomonMonster,
  updateNexomonMonster,
  deleteNexomonMonster
};
