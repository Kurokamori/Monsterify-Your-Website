const MonsterHunterMonster = require('../models/MonsterHunterMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Monster Hunter monsters
 * @route   GET /api/monsterhunter-monsters
 * @access  Public
 */
const getAllMonsterHunterMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    rank = '',
    element = ''
  } = req.query;

  const result = await MonsterHunterMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    rank: rank !== '' ? parseInt(rank) : null,
    element
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
 * @desc    Get Monster Hunter monster by ID
 * @route   GET /api/monsterhunter-monsters/:id
 * @access  Public
 */
const getMonsterHunterMonsterById = asyncHandler(async (req, res) => {
  const monster = await MonsterHunterMonster.getById(req.params.id);

  if (!monster) {
    res.status(404);
    throw new Error('Monster Hunter monster not found');
  }

  res.json({
    success: true,
    data: monster
  });
});

/**
 * @desc    Create a new Monster Hunter monster
 * @route   POST /api/monsterhunter-monsters
 * @access  Admin
 */
const createMonsterHunterMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url,
    rank,
    element
  } = req.body;

  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Please provide all required fields: name');
  }

  const monster = await MonsterHunterMonster.create({
    name,
    image_url,
    rank: rank ? parseInt(rank) : null,
    element
  });

  res.status(201).json({
    success: true,
    data: monster,
    message: 'Monster Hunter monster created successfully'
  });
});

/**
 * @desc    Update a Monster Hunter monster
 * @route   PUT /api/monsterhunter-monsters/:id
 * @access  Admin
 */
const updateMonsterHunterMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url,
    rank,
    element
  } = req.body;

  // Check if monster exists
  const monster = await MonsterHunterMonster.getById(req.params.id);
  if (!monster) {
    res.status(404);
    throw new Error('Monster Hunter monster not found');
  }

  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Please provide all required fields: name');
  }

  const updatedMonster = await MonsterHunterMonster.update(req.params.id, {
    name,
    image_url,
    rank: rank ? parseInt(rank) : null,
    element
  });

  res.json({
    success: true,
    data: updatedMonster,
    message: 'Monster Hunter monster updated successfully'
  });
});

/**
 * @desc    Delete a Monster Hunter monster
 * @route   DELETE /api/monsterhunter-monsters/:id
 * @access  Admin
 */
const deleteMonsterHunterMonster = asyncHandler(async (req, res) => {
  // Check if monster exists
  const monster = await MonsterHunterMonster.getById(req.params.id);
  if (!monster) {
    res.status(404);
    throw new Error('Monster Hunter monster not found');
  }

  await MonsterHunterMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Monster Hunter monster deleted successfully'
  });
});

/**
 * @desc    Get all elements
 * @route   GET /api/monsterhunter-monsters/elements
 * @access  Public
 */
const getElements = asyncHandler(async (req, res) => {
  const elements = await MonsterHunterMonster.getElements();

  res.json({
    success: true,
    data: elements
  });
});

/**
 * @desc    Get all ranks
 * @route   GET /api/monsterhunter-monsters/ranks
 * @access  Public
 */
const getRanks = asyncHandler(async (req, res) => {
  const ranks = await MonsterHunterMonster.getRanks();

  res.json({
    success: true,
    data: ranks
  });
});

module.exports = {
  getAllMonsterHunterMonsters,
  getMonsterHunterMonsterById,
  createMonsterHunterMonster,
  updateMonsterHunterMonster,
  deleteMonsterHunterMonster,
  getElements,
  getRanks
};
