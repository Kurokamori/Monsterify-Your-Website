const Item = require('../models/Item');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../utils/cloudinary');

/**
 * @desc    Get all items
 * @route   GET /api/items
 * @access  Public
 */
const getAllItems = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    category = '',
    type = '',
    rarity = ''
  } = req.query;

  const result = await Item.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder,
    category,
    type,
    rarity
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
 * @desc    Get all categories
 * @route   GET /api/items/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Item.getAllCategories();
  res.json({
    success: true,
    data: categories.map(cat => cat.category)
  });
});

/**
 * @desc    Get all types
 * @route   GET /api/items/types
 * @access  Public
 */
const getAllTypes = asyncHandler(async (req, res) => {
  const types = await Item.getAllTypes();
  res.json({
    success: true,
    data: types.map(type => type.type)
  });
});

/**
 * @desc    Get all rarities
 * @route   GET /api/items/rarities
 * @access  Public
 */
const getAllRarities = asyncHandler(async (req, res) => {
  const rarities = await Item.getAllRarities();
  res.json({
    success: true,
    data: rarities.map(rarity => rarity.rarity)
  });
});

/**
 * @desc    Get item by ID
 * @route   GET /api/items/:id
 * @access  Public
 */
const getItemById = asyncHandler(async (req, res) => {
  const item = await Item.getById(req.params.id);

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
 * @desc    Create a new item
 * @route   POST /api/items
 * @access  Admin
 */
const createItem = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    image_url,
    category,
    type,
    rarity,
    effect,
    base_price
  } = req.body;

  // Validate required fields
  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide all required fields: name, category');
  }

  const item = await Item.create({
    name,
    description,
    image_url,
    category,
    type,
    rarity,
    effect,
    base_price: base_price ? parseInt(base_price) : 0
  });

  res.status(201).json({
    success: true,
    data: item,
    message: 'Item created successfully'
  });
});

/**
 * @desc    Create multiple items
 * @route   POST /api/items/bulk
 * @access  Admin
 */
const createBulkItems = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of items');
  }

  // Validate each item
  for (const item of items) {
    if (!item.name || !item.category) {
      res.status(400);
      throw new Error('Each item must have a name and category');
    }
  }

  const createdItems = await Item.createBulk(items.map(item => ({
    name: item.name,
    description: item.description,
    image_url: item.image_url,
    category: item.category,
    type: item.type,
    rarity: item.rarity,
    effect: item.effect,
    base_price: item.base_price ? parseInt(item.base_price) : 0
  })));

  res.status(201).json({
    success: true,
    data: createdItems,
    message: `${createdItems.length} items created successfully`
  });
});

/**
 * @desc    Upload image to Cloudinary
 * @route   POST /api/items/upload
 * @access  Admin
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'items',
      use_filename: true
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    res.status(500);
    throw new Error('Error uploading image');
  }
});

/**
 * @desc    Update an item
 * @route   PUT /api/items/:id
 * @access  Admin
 */
const updateItem = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    image_url,
    category,
    type,
    rarity,
    effect,
    base_price
  } = req.body;

  // Check if item exists
  const item = await Item.getById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  // Validate required fields
  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide all required fields: name, category');
  }

  const updatedItem = await Item.update(req.params.id, {
    name,
    description,
    image_url,
    category,
    type,
    rarity,
    effect,
    base_price: base_price ? parseInt(base_price) : 0
  });

  res.json({
    success: true,
    data: updatedItem,
    message: 'Item updated successfully'
  });
});

/**
 * @desc    Delete an item
 * @route   DELETE /api/items/:id
 * @access  Admin
 */
const deleteItem = asyncHandler(async (req, res) => {
  // Check if item exists
  const item = await Item.getById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  await Item.delete(req.params.id);

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
});

module.exports = {
  getAllItems,
  getAllCategories,
  getAllTypes,
  getAllRarities,
  getItemById,
  createItem,
  createBulkItems,
  uploadImage,
  updateItem,
  deleteItem
};
