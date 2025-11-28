const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const Shop = require('../../models/Shop');
const ShopItem = require('../../models/ShopItem');
const Item = require('../../models/Item');

// All routes require admin privileges
router.use(protect);
router.use(admin);

// Get all shops
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.getAll();
    
    res.status(200).json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Error getting shops:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting shops',
      error: error.message
    });
  }
});

// Get shop by ID
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.getById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error(`Error getting shop with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting shop',
      error: error.message
    });
  }
});

// Create a shop
router.post('/', async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: shop_id, name, category'
      });
    }
    
    // Check if shop_id already exists
    const existingShop = await Shop.getById(shop_id);
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: 'Shop ID already exists'
      });
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
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating shop',
      error: error.message
    });
  }
});

// Update a shop
router.put('/:id', async (req, res) => {
  try {
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
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category'
      });
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
  } catch (error) {
    console.error(`Error updating shop with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop',
      error: error.message
    });
  }
});

// Delete a shop
router.delete('/:id', async (req, res) => {
  try {
    // Check if shop exists
    const shop = await Shop.getById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    await Shop.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting shop with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting shop',
      error: error.message
    });
  }
});

// Get shop items
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    // Check if shop exists
    const shop = await Shop.getById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    // Get shop items
    const items = await ShopItem.getByShopId(id, date);
    
    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error(`Error getting items for shop ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting shop items',
      error: error.message
    });
  }
});

// Stock shop with items
router.post('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, count, price_modifier, date } = req.body;
    
    // Check if shop exists
    const shop = await Shop.getById(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
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
  } catch (error) {
    console.error(`Error stocking shop ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error stocking shop',
      error: error.message
    });
  }
});

module.exports = router;
