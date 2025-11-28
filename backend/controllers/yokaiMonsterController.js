const YokaiMonster = require('../models/YokaiMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Yokai monsters
 * @route   GET /api/yokai-monsters
 * @access  Public
 */
const getAllYokaiMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    tribe = '',
    rank = '',
    stage = ''
  } = req.query;

  const result = await YokaiMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    tribe,
    rank,
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
 * @desc    Get Yokai monster by ID
 * @route   GET /api/yokai-monsters/:id
 * @access  Public
 */
const getYokaiMonsterById = asyncHandler(async (req, res) => {
  const yokai = await YokaiMonster.getById(req.params.id);

  if (!yokai) {
    res.status(404);
    throw new Error('Yokai monster not found');
  }

  res.json({
    success: true,
    data: yokai
  });
});

/**
 * @desc    Create a new Yokai monster
 * @route   POST /api/yokai-monsters
 * @access  Admin
 */
const createYokaiMonster = asyncHandler(async (req, res) => {
  const {
    name,
    tribe,
    rank,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  } = req.body;

  // Validate required fields
  if (!name || !tribe || !rank || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, tribe, rank, stage');
  }

  // Check if a Yokai with the same name already exists
  const existingYokai = await YokaiMonster.getAll({ search: name, limit: 1 });
  if (existingYokai.total > 0 && existingYokai.data[0].name.toLowerCase() === name.toLowerCase()) {
    res.status(400);
    throw new Error(`A Yokai with name ${name} already exists`);
  }

  const yokai = await YokaiMonster.create({
    name,
    tribe,
    rank,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  });

  res.status(201).json({
    success: true,
    data: yokai,
    message: 'Yokai monster created successfully'
  });
});

/**
 * @desc    Update a Yokai monster
 * @route   PUT /api/yokai-monsters/:id
 * @access  Admin
 */
const updateYokaiMonster = asyncHandler(async (req, res) => {
  const {
    name,
    tribe,
    rank,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  } = req.body;

  // Check if Yokai exists
  const yokai = await YokaiMonster.getById(req.params.id);
  if (!yokai) {
    res.status(404);
    throw new Error('Yokai monster not found');
  }

  // Validate required fields
  if (!name || !tribe || !rank || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, tribe, rank, stage');
  }

  // Check if another Yokai with the same name already exists (excluding this one)
  if (name.toLowerCase() !== yokai.name.toLowerCase()) {
    const existingYokai = await YokaiMonster.getAll({ search: name, limit: 1 });
    if (existingYokai.total > 0 && existingYokai.data.some(y => y.name.toLowerCase() === name.toLowerCase() && y.id !== parseInt(req.params.id))) {
      res.status(400);
      throw new Error(`Another Yokai with name ${name} already exists`);
    }
  }

  const updatedYokai = await YokaiMonster.update(req.params.id, {
    name,
    tribe,
    rank,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    image_url
  });

  res.json({
    success: true,
    data: updatedYokai,
    message: 'Yokai monster updated successfully'
  });
});

/**
 * @desc    Delete a Yokai monster
 * @route   DELETE /api/yokai-monsters/:id
 * @access  Admin
 */
const deleteYokaiMonster = asyncHandler(async (req, res) => {
  // Check if Yokai exists
  const yokai = await YokaiMonster.getById(req.params.id);
  if (!yokai) {
    res.status(404);
    throw new Error('Yokai monster not found');
  }

  await YokaiMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Yokai monster deleted successfully'
  });
});

module.exports = {
  getAllYokaiMonsters,
  getYokaiMonsterById,
  createYokaiMonster,
  updateYokaiMonster,
  deleteYokaiMonster
};
