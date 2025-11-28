const PalsMonster = require('../models/PalsMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Pals monsters
 * @route   GET /api/pals-monsters
 * @access  Public
 */
const getAllPalsMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const result = await PalsMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder
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
 * @desc    Get Pals monster by ID
 * @route   GET /api/pals-monsters/:id
 * @access  Public
 */
const getPalsMonsterById = asyncHandler(async (req, res) => {
  const pals = await PalsMonster.getById(req.params.id);

  if (!pals) {
    res.status(404);
    throw new Error('Pals monster not found');
  }

  res.json({
    success: true,
    data: pals
  });
});

/**
 * @desc    Create a new Pals monster
 * @route   POST /api/pals-monsters
 * @access  Admin
 */
const createPalsMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url
  } = req.body;

  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Please provide all required fields: name');
  }

  // Check if a Pals with the same name already exists
  const existingPals = await PalsMonster.getAll({ search: name, limit: 1 });
  if (existingPals.total > 0 && existingPals.data[0].name.toLowerCase() === name.toLowerCase()) {
    res.status(400);
    throw new Error(`A Pals with name ${name} already exists`);
  }

  const pals = await PalsMonster.create({
    name,
    image_url
  });

  res.status(201).json({
    success: true,
    data: pals,
    message: 'Pals monster created successfully'
  });
});

/**
 * @desc    Update a Pals monster
 * @route   PUT /api/pals-monsters/:id
 * @access  Admin
 */
const updatePalsMonster = asyncHandler(async (req, res) => {
  const {
    name,
    image_url
  } = req.body;

  // Check if Pals exists
  const pals = await PalsMonster.getById(req.params.id);
  if (!pals) {
    res.status(404);
    throw new Error('Pals monster not found');
  }

  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Please provide all required fields: name');
  }

  // Check if another Pals with the same name already exists (excluding this one)
  if (name.toLowerCase() !== pals.name.toLowerCase()) {
    const existingPals = await PalsMonster.getAll({ search: name, limit: 1 });
    if (existingPals.total > 0 && existingPals.data.some(p => p.name.toLowerCase() === name.toLowerCase() && p.id !== parseInt(req.params.id))) {
      res.status(400);
      throw new Error(`Another Pals with name ${name} already exists`);
    }
  }

  const updatedPals = await PalsMonster.update(req.params.id, {
    name,
    image_url
  });

  res.json({
    success: true,
    data: updatedPals,
    message: 'Pals monster updated successfully'
  });
});

/**
 * @desc    Delete a Pals monster
 * @route   DELETE /api/pals-monsters/:id
 * @access  Admin
 */
const deletePalsMonster = asyncHandler(async (req, res) => {
  // Check if Pals exists
  const pals = await PalsMonster.getById(req.params.id);
  if (!pals) {
    res.status(404);
    throw new Error('Pals monster not found');
  }

  await PalsMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Pals monster deleted successfully'
  });
});

module.exports = {
  getAllPalsMonsters,
  getPalsMonsterById,
  createPalsMonster,
  updatePalsMonster,
  deletePalsMonster
};
