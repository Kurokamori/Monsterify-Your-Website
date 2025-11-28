const PokemonMonster = require('../models/PokemonMonster');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all Pokemon monsters
 * @route   GET /api/pokemon-monsters
 * @access  Public
 */
const getAllPokemonMonsters = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'ndex',
    sortOrder = 'asc',
    type = '',
    legendary = '',
    mythical = '',
    stage = ''
  } = req.query;

  // Convert string boolean values to actual booleans
  const legendaryBool = legendary === '' ? null : legendary === 'true';
  const mythicalBool = mythical === '' ? null : mythical === 'true';

  const result = await PokemonMonster.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    type,
    legendary: legendaryBool,
    mythical: mythicalBool,
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
 * @desc    Get Pokemon monster by ID
 * @route   GET /api/pokemon-monsters/:id
 * @access  Public
 */
const getPokemonMonsterById = asyncHandler(async (req, res) => {
  const pokemon = await PokemonMonster.getById(req.params.id);

  if (!pokemon) {
    res.status(404);
    throw new Error('Pokemon monster not found');
  }

  res.json({
    success: true,
    data: pokemon
  });
});

/**
 * @desc    Create a new Pokemon monster
 * @route   POST /api/pokemon-monsters
 * @access  Admin
 */
const createPokemonMonster = asyncHandler(async (req, res) => {
  const {
    name,
    ndex,
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    is_legendary,
    is_mythical,
    image_url
  } = req.body;

  // Validate required fields
  if (!name || !ndex || !type_primary || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, ndex, type_primary, stage');
  }

  // Check if a Pokemon with the same ndex already exists
  const existingPokemon = await PokemonMonster.getAll({ search: name, limit: 1 });
  if (existingPokemon.total > 0 && existingPokemon.data[0].ndex === parseInt(ndex)) {
    res.status(400);
    throw new Error(`A Pokemon with ndex ${ndex} already exists`);
  }

  const pokemon = await PokemonMonster.create({
    name,
    ndex: parseInt(ndex),
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    is_legendary: is_legendary === true || is_legendary === 'true',
    is_mythical: is_mythical === true || is_mythical === 'true',
    image_url
  });

  res.status(201).json({
    success: true,
    data: pokemon,
    message: 'Pokemon monster created successfully'
  });
});

/**
 * @desc    Update a Pokemon monster
 * @route   PUT /api/pokemon-monsters/:id
 * @access  Admin
 */
const updatePokemonMonster = asyncHandler(async (req, res) => {
  const {
    name,
    ndex,
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    is_legendary,
    is_mythical,
    image_url
  } = req.body;

  // Check if Pokemon exists
  const pokemon = await PokemonMonster.getById(req.params.id);
  if (!pokemon) {
    res.status(404);
    throw new Error('Pokemon monster not found');
  }

  // Validate required fields
  if (!name || !ndex || !type_primary || !stage) {
    res.status(400);
    throw new Error('Please provide all required fields: name, ndex, type_primary, stage');
  }

  // Check if another Pokemon with the same ndex already exists (excluding this one)
  if (parseInt(ndex) !== pokemon.ndex) {
    const existingPokemon = await PokemonMonster.getAll({ search: '', limit: 1 });
    if (existingPokemon.total > 0 && existingPokemon.data.some(p => p.ndex === parseInt(ndex) && p.id !== parseInt(req.params.id))) {
      res.status(400);
      throw new Error(`Another Pokemon with ndex ${ndex} already exists`);
    }
  }

  const updatedPokemon = await PokemonMonster.update(req.params.id, {
    name,
    ndex: parseInt(ndex),
    type_primary,
    type_secondary,
    evolves_from,
    evolves_to,
    breeding_results,
    stage,
    is_legendary: is_legendary === true || is_legendary === 'true',
    is_mythical: is_mythical === true || is_mythical === 'true',
    image_url
  });

  res.json({
    success: true,
    data: updatedPokemon,
    message: 'Pokemon monster updated successfully'
  });
});

/**
 * @desc    Delete a Pokemon monster
 * @route   DELETE /api/pokemon-monsters/:id
 * @access  Admin
 */
const deletePokemonMonster = asyncHandler(async (req, res) => {
  // Check if Pokemon exists
  const pokemon = await PokemonMonster.getById(req.params.id);
  if (!pokemon) {
    res.status(404);
    throw new Error('Pokemon monster not found');
  }

  await PokemonMonster.delete(req.params.id);

  res.json({
    success: true,
    message: 'Pokemon monster deleted successfully'
  });
});

module.exports = {
  getAllPokemonMonsters,
  getPokemonMonsterById,
  createPokemonMonster,
  updatePokemonMonster,
  deletePokemonMonster
};
