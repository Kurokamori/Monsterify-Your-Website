const asyncHandler = require('express-async-handler');
const ArtTodoList = require('../models/ArtTodoList');
const ArtTodoItem = require('../models/ArtTodoItem');
const ArtTodoReference = require('../models/ArtTodoReference');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');

/**
 * @desc    Get all art todo lists for the current user
 * @route   GET /api/art-todo/lists
 * @access  Private
 */
const getLists = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const lists = await ArtTodoList.getWithItemCounts(userId);

  res.json({
    success: true,
    data: lists
  });
});

/**
 * @desc    Get a specific art todo list with items
 * @route   GET /api/art-todo/lists/:id
 * @access  Private
 */
const getListById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const list = await ArtTodoList.getById(id, userId);

  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }

  const items = await ArtTodoItem.getWithReferences(id, userId);

  res.json({
    success: true,
    data: {
      ...list,
      items
    }
  });
});

/**
 * @desc    Create a new art todo list
 * @route   POST /api/art-todo/lists
 * @access  Private
 */
const createList = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;

  if (!title || title.trim().length === 0) {
    res.status(400);
    throw new Error('Title is required');
  }

  const list = await ArtTodoList.create({
    user_id: userId,
    title: title.trim(),
    description: description?.trim()
  });

  res.status(201).json({
    success: true,
    data: list
  });
});

/**
 * @desc    Update an art todo list
 * @route   PUT /api/art-todo/lists/:id
 * @access  Private
 */
const updateList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const userId = req.user.id;

  if (!title || title.trim().length === 0) {
    res.status(400);
    throw new Error('Title is required');
  }

  const list = await ArtTodoList.update(id, userId, {
    title: title.trim(),
    description: description?.trim()
  });

  if (!list) {
    res.status(404);
    throw new Error('List not found');
  }

  res.json({
    success: true,
    data: list
  });
});

/**
 * @desc    Delete an art todo list
 * @route   DELETE /api/art-todo/lists/:id
 * @access  Private
 */
const deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deleted = await ArtTodoList.delete(id, userId);

  if (!deleted) {
    res.status(404);
    throw new Error('List not found');
  }

  res.json({
    success: true,
    message: 'List deleted successfully'
  });
});

/**
 * @desc    Get items for a specific list
 * @route   GET /api/art-todo/lists/:listId/items
 * @access  Private
 */
const getItems = asyncHandler(async (req, res) => {
  const { listId } = req.params;
  const userId = req.user.id;

  const items = await ArtTodoItem.getWithReferences(listId, userId);

  res.json({
    success: true,
    data: items
  });
});

/**
 * @desc    Create a new art todo item
 * @route   POST /api/art-todo/lists/:listId/items
 * @access  Private
 */
const createItem = asyncHandler(async (req, res) => {
  const { listId } = req.params;
  const {
    title,
    description,
    status,
    priority,
    due_date,
    is_persistent,
    steps_total,
    references
  } = req.body;
  const userId = req.user.id;

  if (!title || title.trim().length === 0) {
    res.status(400);
    throw new Error('Title is required');
  }

  const item = await ArtTodoItem.create({
    list_id: listId,
    title: title.trim(),
    description: description?.trim(),
    status: status || 'pending',
    priority: priority || 'medium',
    due_date: due_date || null,
    is_persistent: is_persistent || 0,
    steps_total: steps_total || 0,
    steps_completed: 0
  }, userId);

  // Add references if provided
  if (references && Array.isArray(references) && references.length > 0) {
    await ArtTodoReference.bulkCreate(item.id, references, userId);
  }

  // Get the item with references
  const itemWithReferences = await ArtTodoItem.getWithReferences(listId, userId);
  const createdItem = itemWithReferences.find(i => i.id === item.id);

  res.status(201).json({
    success: true,
    data: createdItem
  });
});

/**
 * @desc    Update an art todo item
 * @route   PUT /api/art-todo/items/:id
 * @access  Private
 */
const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    priority,
    due_date,
    is_persistent,
    steps_total,
    steps_completed
  } = req.body;
  const userId = req.user.id;

  if (!title || title.trim().length === 0) {
    res.status(400);
    throw new Error('Title is required');
  }

  const item = await ArtTodoItem.update(id, userId, {
    title: title.trim(),
    description: description?.trim(),
    status: status || 'pending',
    priority: priority || 'medium',
    due_date: due_date || null,
    is_persistent: is_persistent || 0,
    steps_total: steps_total || 0,
    steps_completed: steps_completed || 0
  });

  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  res.json({
    success: true,
    data: item
  });
});

/**
 * @desc    Move item to different list
 * @route   PUT /api/art-todo/items/:id/move
 * @access  Private
 */
const moveItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { list_id } = req.body;
  const userId = req.user.id;

  if (!list_id) {
    res.status(400);
    throw new Error('Target list ID is required');
  }

  const item = await ArtTodoItem.moveToList(id, list_id, userId);

  if (!item) {
    res.status(404);
    throw new Error('Item not found or access denied');
  }

  res.json({
    success: true,
    data: item
  });
});

/**
 * @desc    Delete an art todo item
 * @route   DELETE /api/art-todo/items/:id
 * @access  Private
 */
const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deleted = await ArtTodoItem.delete(id, userId);

  if (!deleted) {
    res.status(404);
    throw new Error('Item not found');
  }

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
});

/**
 * @desc    Get references for an item
 * @route   GET /api/art-todo/items/:id/references
 * @access  Private
 */
const getItemReferences = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const references = await ArtTodoReference.getByItemId(id, userId);

  res.json({
    success: true,
    data: references
  });
});

/**
 * @desc    Get reference matrix for an item
 * @route   GET /api/art-todo/items/:id/reference-matrix
 * @access  Private
 */
const getItemReferenceMatrix = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const matrix = await ArtTodoReference.getReferenceMatrix(id, userId);

  res.json({
    success: true,
    data: matrix
  });
});

/**
 * @desc    Add reference to an item
 * @route   POST /api/art-todo/items/:id/references
 * @access  Private
 */
const addItemReference = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reference_type, reference_id } = req.body;
  const userId = req.user.id;

  console.log('Adding reference:', { id, reference_type, reference_id, userId });

  if (!reference_type || !reference_id) {
    res.status(400);
    throw new Error('Reference type and ID are required');
  }

  if (!['trainer', 'monster'].includes(reference_type)) {
    res.status(400);
    throw new Error('Reference type must be "trainer" or "monster"');
  }

  try {
    const reference = await ArtTodoReference.create({
      item_id: id,
      reference_type,
      reference_id
    }, userId);

    res.status(201).json({
      success: true,
      data: reference
    });
  } catch (error) {
    console.error('Error adding reference:', error);
    res.status(500);
    throw new Error(error.message || 'Failed to add reference');
  }
});

/**
 * @desc    Remove reference from an item
 * @route   DELETE /api/art-todo/references/:id
 * @access  Private
 */
const removeItemReference = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const deleted = await ArtTodoReference.delete(id, userId);

  if (!deleted) {
    res.status(404);
    throw new Error('Reference not found');
  }

  res.json({
    success: true,
    message: 'Reference removed successfully'
  });
});

/**
 * @desc    Get user's trainers for reference selection
 * @route   GET /api/art-todo/trainers
 * @access  Private
 */
const getUserTrainers = asyncHandler(async (req, res) => {
  const userId = req.user.discord_id || req.user.id;

  console.log('Getting trainers for user:', { userId, discord_id: req.user.discord_id, user_id: req.user.id });

  const trainers = await Trainer.getByUserId(req.user.discord_id);

  console.log('Found trainers:', trainers.length);

  const trainerData = trainers.map(trainer => ({
    id: trainer.id,
    name: trainer.name,
    main_ref: trainer.main_ref,
    species1: trainer.species1,
    type1: trainer.type1
  }));

  res.json({
    success: true,
    data: trainerData
  });
});

/**
 * @desc    Get user's monsters for reference selection
 * @route   GET /api/art-todo/monsters
 * @access  Private
 */
const getUserMonsters = asyncHandler(async (req, res) => {
  const userId = req.user.discord_id || req.user.id;

  console.log('Getting monsters for user:', { userId, discord_id: req.user.discord_id, user_id: req.user.id });

  const monsters = await Monster.getByUserId(req.user.discord_id);

  console.log('Found monsters:', monsters.length);

  const monsterData = monsters.map(monster => ({
    id: monster.id,
    name: monster.name,
    img_link: monster.img_link,
    species1: monster.species1,
    type1: monster.type1,
    trainer_id: monster.trainer_id
  }));

  res.json({
    success: true,
    data: monsterData
  });
});

module.exports = {
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getItems,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  getItemReferences,
  getItemReferenceMatrix,
  addItemReference,
  removeItemReference,
  getUserTrainers,
  getUserMonsters
};
