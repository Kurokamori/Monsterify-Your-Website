const DigimonMonster = require('../models/DigimonMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Digimon monsters
 * @route   GET /api/digimon-monsters
 * @access  Public
 */
const getAllDigimonMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    rank = '',
    attribute = ''
  } = req.query;

  const result = await DigimonMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    rank,
    attribute
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
 * @desc    Get Digimon monster by ID
 * @route   GET /api/digimon-monsters/:id
 * @access  Public
 */
const getDigimonMonsterById = asyncHandler(async (req, res) => {
  const digimon = await DigimonMonster.getById(req.params.id);

  if (!digimon) {
    res.status(404);
    throw new Error('Digimon monster not found');
  }

  res.json({
    success: true,
    data: digimon
  });
});

/**
 * @desc    Create a new Digimon monster
 * @route   POST /api/digimon-monsters
 * @access  Admin
 */
const createDigimonMonster = asyncHandler(async (req, res) => {
  const {
    name,
    rank,
    level_required,
    attribute,
    families,
    digimon_type,
    natural_attributes,
    digivolves_from,
    digivolves_to,
    breeding_results,
    image_url
  } = req.body;

  // Validate required fields
  if (!name || !rank || !attribute) {
    res.status(400);
    throw new Error('Please provide all required fields: name, rank, attribute');
  }

  // Check if a Digimon with the same name already exists
  const existingDigimon = await DigimonMonster.getAll({ search: name, limit: 1 });
  if (existingDigimon.total > 0 && existingDigimon.data[0].name.toLowerCase() === name.toLowerCase()) {
    res.status(400);
    throw new Error(`A Digimon with name ${name} already exists`);
  }

  const digimon = await DigimonMonster.create({
    name,
    rank,
    level_required: level_required ? parseInt(level_required) : null,
    attribute,
    families,
    digimon_type,
    natural_attributes,
    digivolves_from,
    digivolves_to,
    breeding_results,
    image_url
  });

  res.status(201).json({
    success: true,
    data: digimon,
    message: 'Digimon monster created successfully'
  });
});

/**
 * @desc    Update a Digimon monster
 * @route   PUT /api/digimon-monsters/:id
 * @access  Admin
 */
const updateDigimonMonster = asyncHandler(async (req, res) => {
  const {
    name,
    rank,
    level_required,
    attribute,
    families,
    digimon_type,
    natural_attributes,
    digivolves_from,
    digivolves_to,
    breeding_results,
    image_url
  } = req.body;

  // Check if Digimon exists
  const digimon = await DigimonMonster.getById(req.params.id);
  if (!digimon) {
    res.status(404);
    throw new Error('Digimon monster not found');
  }

  // Validate required fields
  if (!name || !rank || !attribute) {
    res.status(400);
    throw new Error('Please provide all required fields: name, rank, attribute');
  }

  // Check if another Digimon with the same name already exists (excluding this one)
  if (name.toLowerCase() !== digimon.name.toLowerCase()) {
    const existingDigimon = await DigimonMonster.getAll({ search: name, limit: 1 });
    if (existingDigimon.total > 0 && existingDigimon.data.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== parseInt(req.params.id))) {
      res.status(400);
      throw new Error(`Another Digimon with name ${name} already exists`);
    }
  }

  const updatedDigimon = await DigimonMonster.update(req.params.id, {
    name,
    rank,
    level_required: level_required ? parseInt(level_required) : null,
    attribute,
    families,
    digimon_type,
    natural_attributes,
    digivolves_from,
    digivolves_to,
    breeding_results,
    image_url
  });

  res.json({
    success: true,
    data: updatedDigimon,
    message: 'Digimon monster updated successfully'
  });
});

/**
 * @desc    Delete a Digimon monster
 * @route   DELETE /api/digimon-monsters/:id
 * @access  Admin
 */
const deleteDigimonMonster = asyncHandler(async (req, res) => {
  // Check if Digimon exists
  const digimon = await DigimonMonster.getById(req.params.id);
  if (!digimon) {
    res.status(404);
    throw new Error('Digimon monster not found');
  }

  await DigimonMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Digimon monster deleted successfully'
  });
});

module.exports = {
  getAllDigimonMonsters,
  getDigimonMonsterById,
  createDigimonMonster,
  updateDigimonMonster,
  deleteDigimonMonster
};
