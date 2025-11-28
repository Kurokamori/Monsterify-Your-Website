const asyncHandler = require('express-async-handler');
const Shop = require('../models/Shop');
const ShopItem = require('../models/ShopItem');
const Trainer = require('../models/Trainer');

/**
 * @desc    Get all shops
 * @route   GET /api/shops
 * @access  Public
 */
const getShops = asyncHandler(async (req, res) => {
  const shops = await Shop.getAll();
  
  res.status(200).json({
    success: true,
    data: shops
  });
});

/**
 * @desc    Get all active shops
 * @route   GET /api/shops/active
 * @access  Public
 */
const getActiveShops = asyncHandler(async (req, res) => {
  const shops = await Shop.getAllActive();
  
  res.status(200).json({
    success: true,
    data: shops
  });
});

/**
 * @desc    Get visible shops for user
 * @route   GET /api/shops/visible
 * @access  Private
 */
const getVisibleShops = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const shops = await Shop.getVisibleShops(userId);
  
  res.status(200).json({
    success: true,
    data: shops
  });
});

/**
 * @desc    Get shop by ID
 * @route   GET /api/shops/:id
 * @access  Public
 */
const getShopById = asyncHandler(async (req, res) => {
  const shop = await Shop.getById(req.params.id);
  
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  res.status(200).json({
    success: true,
    data: shop
  });
});

/**
 * @desc    Create a shop
 * @route   POST /api/shops
 * @access  Admin
 */
const createShop = asyncHandler(async (req, res) => {
  const {
    shop_id,
    name,
    description,
    flavor_text,
    banner_image,
    category,
    price_modifier,
    is_constant,
    is_active,
    visibility_condition
  } = req.body;
  
  // Validate required fields
  if (!shop_id || !name || !category) {
    res.status(400);
    throw new Error('Please provide all required fields: shop_id, name, category');
  }
  
  // Check if shop_id already exists
  const existingShop = await Shop.getById(shop_id);
  if (existingShop) {
    res.status(400);
    throw new Error('Shop ID already exists');
  }
  
  const shop = await Shop.create({
    shop_id,
    name,
    description,
    flavor_text,
    banner_image,
    category,
    price_modifier: price_modifier ? parseFloat(price_modifier) : 1.0,
    is_constant: is_constant !== undefined ? parseInt(is_constant) : 1,
    is_active: is_active !== undefined ? parseInt(is_active) : 1,
    visibility_condition
  });
  
  res.status(201).json({
    success: true,
    data: shop,
    message: 'Shop created successfully'
  });
});

/**
 * @desc    Update a shop
 * @route   PUT /api/shops/:id
 * @access  Admin
 */
const updateShop = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    flavor_text,
    banner_image,
    category,
    price_modifier,
    is_constant,
    is_active,
    visibility_condition
  } = req.body;
  
  // Check if shop exists
  const shop = await Shop.getById(req.params.id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Validate required fields
  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide all required fields: name, category');
  }
  
  const updatedShop = await Shop.update(req.params.id, {
    name,
    description,
    flavor_text,
    banner_image,
    category,
    price_modifier: price_modifier ? parseFloat(price_modifier) : 1.0,
    is_constant: is_constant !== undefined ? parseInt(is_constant) : 1,
    is_active: is_active !== undefined ? parseInt(is_active) : 1,
    visibility_condition
  });
  
  res.status(200).json({
    success: true,
    data: updatedShop,
    message: 'Shop updated successfully'
  });
});

/**
 * @desc    Delete a shop
 * @route   DELETE /api/shops/:id
 * @access  Admin
 */
const deleteShop = asyncHandler(async (req, res) => {
  // Check if shop exists
  const shop = await Shop.getById(req.params.id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  await Shop.delete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Shop deleted successfully'
  });
});

/**
 * @desc    Get shop items
 * @route   GET /api/shops/:id/items
 * @access  Public
 */
const getShopItems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  // Check if shop exists
  const shop = await Shop.getById(id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Get shop items
  const items = await ShopItem.getByShopId(id, date);
  
  res.status(200).json({
    success: true,
    data: items
  });
});

/**
 * @desc    Add item to shop
 * @route   POST /api/shops/:id/items
 * @access  Admin
 */
const addShopItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { item_id, price, max_quantity, current_quantity, date } = req.body;
  
  // Check if shop exists
  const shop = await Shop.getById(id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Validate required fields
  if (!item_id || !price) {
    res.status(400);
    throw new Error('Please provide all required fields: item_id, price');
  }
  
  // Add item to shop
  const shopItem = await ShopItem.add({
    shop_id: id,
    item_id,
    price: parseInt(price),
    max_quantity: max_quantity ? parseInt(max_quantity) : 999,
    current_quantity: current_quantity ? parseInt(current_quantity) : (max_quantity ? parseInt(max_quantity) : 999),
    date
  });
  
  res.status(201).json({
    success: true,
    data: shopItem,
    message: 'Item added to shop successfully'
  });
});

/**
 * @desc    Update shop item
 * @route   PUT /api/shops/:shopId/items/:itemId
 * @access  Admin
 */
const updateShopItem = asyncHandler(async (req, res) => {
  const { shopId, itemId } = req.params;
  const { price, max_quantity, current_quantity } = req.body;
  
  // Check if shop exists
  const shop = await Shop.getById(shopId);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Update shop item
  const updatedShopItem = await ShopItem.update(itemId, {
    price: parseInt(price),
    max_quantity: max_quantity ? parseInt(max_quantity) : 999,
    current_quantity: current_quantity ? parseInt(current_quantity) : null
  });
  
  res.status(200).json({
    success: true,
    data: updatedShopItem,
    message: 'Shop item updated successfully'
  });
});

/**
 * @desc    Remove item from shop
 * @route   DELETE /api/shops/:shopId/items/:itemId
 * @access  Admin
 */
const removeShopItem = asyncHandler(async (req, res) => {
  const { shopId, itemId } = req.params;
  
  // Check if shop exists
  const shop = await Shop.getById(shopId);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Remove item from shop
  await ShopItem.remove(itemId);
  
  res.status(200).json({
    success: true,
    message: 'Item removed from shop successfully'
  });
});

/**
 * @desc    Stock shop with items
 * @route   POST /api/shops/:id/stock
 * @access  Admin
 */
const stockShop = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, count, price_modifier, date } = req.body;
  
  // Check if shop exists
  const shop = await Shop.getById(id);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Stock shop with items
  const items = await ShopItem.stockShop(
    id,
    category || shop.category,
    count ? parseInt(count) : 10,
    price_modifier ? parseFloat(price_modifier) : (shop.price_modifier || 1.0),
    date
  );
  
  res.status(200).json({
    success: true,
    data: items,
    message: 'Shop stocked successfully'
  });
});

/**
 * @desc    Purchase item from shop
 * @route   POST /api/shops/:shopId/purchase
 * @access  Private
 */
const purchaseItem = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { trainer_id, item_id, quantity } = req.body;
  
  // Validate required fields
  if (!trainer_id || !item_id || !quantity) {
    res.status(400);
    throw new Error('Please provide all required fields: trainer_id, item_id, quantity');
  }
  
  // Check if shop exists
  const shop = await Shop.getById(shopId);
  if (!shop) {
    res.status(404);
    throw new Error('Shop not found');
  }
  
  // Check if trainer exists
  const trainer = await Trainer.getById(trainer_id);
  if (!trainer) {
    res.status(404);
    throw new Error('Trainer not found');
  }
  
  // Purchase item
  const result = await ShopItem.purchase(
    trainer_id,
    shopId,
    item_id,
    parseInt(quantity)
  );
  
  res.status(200).json({
    success: true,
    data: result,
    message: 'Item purchased successfully'
  });
});

module.exports = {
  getShops,
  getActiveShops,
  getVisibleShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getShopItems,
  addShopItem,
  updateShopItem,
  removeShopItem,
  stockShop,
  purchaseItem
};
