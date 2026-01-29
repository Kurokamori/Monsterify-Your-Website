const FinalFantasyMonster = require('../models/FinalFantasyMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Final Fantasy monsters
 * @route   GET /api/finalfantasy-monsters
 * @access  Public
 */
const getAllFinalFantasyMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    stage = ''
  } = req.query;

  const result = await FinalFantasyMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
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
 * @desc    Get Final Fantasy monster by ID
 * @route   GET /api/finalfantasy-monsters/:id
 * @access  Public
 */
const getFinalFantasyMonsterById = asyncHandler(async (req, res) => {
  const monster = await FinalFantasyMonster.getById(req.params.id);

  if (!monster) {
    res.status(404);
    throw new Error('Final Fantasy monster not found');
  }

  res.json({
    success: true,
    data: monster
  });
});

/**
 * @desc    Create a new Final Fantasy monster
 * @route   POST /api/finalfantasy-monsters
 * @access  Admin
 */
const createFinalFantasyMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url,
    evolves_from,
    evolves_to,
    stage,
    breeding_results
  } = req.body;

  // Validate required fields
  if (!name || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, stage');
  }

  const monster = await FinalFantasyMonster.create({
    name,
    image_url,
    evolves_from,
    evolves_to,
    stage,
    breeding_results
  });

  res.status(201).json({
    success: true,
    data: monster,
    message: 'Final Fantasy monster created successfully'
  });
});

/**
 * @desc    Update a Final Fantasy monster
 * @route   PUT /api/finalfantasy-monsters/:id
 * @access  Admin
 */
const updateFinalFantasyMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url,
    evolves_from,
    evolves_to,
    stage,
    breeding_results
  } = req.body;

  // Check if monster exists
  const monster = await FinalFantasyMonster.getById(req.params.id);
  if (!monster) {
    res.status(404);
    throw new Error('Final Fantasy monster not found');
  }

  // Validate required fields
  if (!name || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, stage');
  }

  const updatedMonster = await FinalFantasyMonster.update(req.params.id, {
    name,
    image_url,
    evolves_from,
    evolves_to,
    stage,
    breeding_results
  });

  res.json({
    success: true,
    data: updatedMonster,
    message: 'Final Fantasy monster updated successfully'
  });
});

/**
 * @desc    Delete a Final Fantasy monster
 * @route   DELETE /api/finalfantasy-monsters/:id
 * @access  Admin
 */
const deleteFinalFantasyMonster = asyncHandler(async (req, res) => {
  // Check if monster exists
  const monster = await FinalFantasyMonster.getById(req.params.id);
  if (!monster) {
    res.status(404);
    throw new Error('Final Fantasy monster not found');
  }

  await FinalFantasyMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Final Fantasy monster deleted successfully'
  });
});

/**
 * @desc    Get all stages
 * @route   GET /api/finalfantasy-monsters/stages
 * @access  Public
 */
const getStages = asyncHandler(async (req, res) => {
  const stages = await FinalFantasyMonster.getStages();

  res.json({
    success: true,
    data: stages
  });
});

module.exports = {
  getAllFinalFantasyMonsters,
  getFinalFantasyMonsterById,
  createFinalFantasyMonster,
  updateFinalFantasyMonster,
  deleteFinalFantasyMonster,
  getStages
};
