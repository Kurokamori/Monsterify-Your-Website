const express = require('express');
const router = express.Router();
const ShopConfig = require('../../models/ShopSystem').ShopConfig;
const DailyShopItems = require('../../models/ShopSystem').DailyShopItems;

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }
  next();
};

// Shop Management Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    res.render('admin/shops/index', {
      title: 'Shop Management',
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading shop management dashboard:', error);
    res.status(500).render('error', {
      message: 'Error loading shop management dashboard',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Shop Configuration Management
router.get('/config', isAdmin, async (req, res) => {
  try {
    // Get all shops
    const shops = await ShopConfig.getAll();
    
    res.render('admin/shops/config', {
      title: 'Shop Configuration Management',
      shops,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading shop configurations:', error);
    res.status(500).render('error', {
      message: 'Error loading shop configurations',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// New Shop Form
router.get('/config/new', isAdmin, (req, res) => {
  res.render('admin/shops/config-form', {
    title: 'Create New Shop',
    shop: null,
    message: req.query.message,
    messageType: req.query.messageType
  });
});

// Edit Shop Form
router.get('/config/edit/:shopId', isAdmin, async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await ShopConfig.getById(shopId);
    
    if (!shop) {
      return res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Shop not found'));
    }
    
    res.render('admin/shops/config-form', {
      title: `Edit Shop: ${shop.name}`,
      shop,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading shop for editing:', error);
    res.status(500).render('error', {
      message: 'Error loading shop for editing',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Create Shop
router.post('/config/create', isAdmin, async (req, res) => {
  try {
    const {
      shop_id,
      name,
      description,
      image_url,
      category,
      price_multiplier_min,
      price_multiplier_max,
      min_items,
      max_items,
      restock_hour,
      is_active
    } = req.body;
    
    // Check if shop_id already exists
    const existingShop = await ShopConfig.getById(shop_id);
    if (existingShop) {
      return res.redirect('/admin/shops/config/new?messageType=error&message=' + encodeURIComponent('Shop ID already exists'));
    }
    
    // Create new shop
    const shopData = {
      shop_id,
      name,
      description,
      image_url,
      category,
      price_multiplier_min: parseFloat(price_multiplier_min),
      price_multiplier_max: parseFloat(price_multiplier_max),
      min_items: parseInt(min_items),
      max_items: parseInt(max_items),
      restock_hour: parseInt(restock_hour),
      is_active: is_active === 'true'
    };
    
    await ShopConfig.create(shopData);
    
    res.redirect('/admin/shops/config?message=' + encodeURIComponent('Shop created successfully'));
  } catch (error) {
    console.error('Error creating shop:', error);
    res.redirect('/admin/shops/config/new?messageType=error&message=' + encodeURIComponent('Error creating shop: ' + error.message));
  }
});

// Update Shop
router.post('/config/update/:shopId', isAdmin, async (req, res) => {
  try {
    const { shopId } = req.params;
    const {
      name,
      description,
      image_url,
      category,
      price_multiplier_min,
      price_multiplier_max,
      min_items,
      max_items,
      restock_hour,
      is_active
    } = req.body;
    
    // Check if shop exists
    const existingShop = await ShopConfig.getById(shopId);
    if (!existingShop) {
      return res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Shop not found'));
    }
    
    // Update shop
    const shopData = {
      name,
      description,
      image_url,
      category,
      price_multiplier_min: parseFloat(price_multiplier_min),
      price_multiplier_max: parseFloat(price_multiplier_max),
      min_items: parseInt(min_items),
      max_items: parseInt(max_items),
      restock_hour: parseInt(restock_hour),
      is_active: is_active === 'true'
    };
    
    await ShopConfig.update(shopId, shopData);
    
    res.redirect('/admin/shops/config?message=' + encodeURIComponent('Shop updated successfully'));
  } catch (error) {
    console.error('Error updating shop:', error);
    res.redirect(`/admin/shops/config/edit/${req.params.shopId}?messageType=error&message=` + encodeURIComponent('Error updating shop: ' + error.message));
  }
});

// Activate Shop
router.post('/config/activate/:shopId', isAdmin, async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // Check if shop exists
    const existingShop = await ShopConfig.getById(shopId);
    if (!existingShop) {
      return res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Shop not found'));
    }
    
    // Activate shop
    await ShopConfig.update(shopId, { is_active: true });
    
    res.redirect('/admin/shops/config?message=' + encodeURIComponent('Shop activated successfully'));
  } catch (error) {
    console.error('Error activating shop:', error);
    res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Error activating shop: ' + error.message));
  }
});

// Deactivate Shop
router.post('/config/deactivate/:shopId', isAdmin, async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // Check if shop exists
    const existingShop = await ShopConfig.getById(shopId);
    if (!existingShop) {
      return res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Shop not found'));
    }
    
    // Deactivate shop
    await ShopConfig.update(shopId, { is_active: false });
    
    res.redirect('/admin/shops/config?message=' + encodeURIComponent('Shop deactivated successfully'));
  } catch (error) {
    console.error('Error deactivating shop:', error);
    res.redirect('/admin/shops/config?messageType=error&message=' + encodeURIComponent('Error deactivating shop: ' + error.message));
  }
});

// Shop Inventory Management
router.get('/inventory', isAdmin, async (req, res) => {
  try {
    // Get date parameter or use today
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // Get all active shops
    const shops = await ShopConfig.getAllActive();
    
    // Get items for each shop
    const shopItems = {};
    for (const shop of shops) {
      shopItems[shop.shop_id] = await DailyShopItems.getShopItems(shop.shop_id, date);
    }
    
    res.render('admin/shops/inventory', {
      title: 'Shop Inventory Management',
      shops,
      shopItems,
      currentDate: date,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error loading shop inventories:', error);
    res.status(500).render('error', {
      message: 'Error loading shop inventories',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
});

// Restock Shop
router.post('/inventory/restock', isAdmin, async (req, res) => {
  try {
    const { shop_id, date } = req.body;
    
    // Restock shop
    await DailyShopItems.restockShop(shop_id, date);
    
    res.redirect(`/admin/shops/inventory?date=${date}&message=` + encodeURIComponent('Shop restocked successfully'));
  } catch (error) {
    console.error('Error restocking shop:', error);
    res.redirect(`/admin/shops/inventory?date=${req.body.date}&messageType=error&message=` + encodeURIComponent('Error restocking shop: ' + error.message));
  }
});

// Restock All Shops
router.post('/inventory/restock-all', isAdmin, async (req, res) => {
  try {
    const { date } = req.body;
    
    // Restock all shops
    await DailyShopItems.restockAllShops(date);
    
    res.redirect(`/admin/shops/inventory?date=${date}&message=` + encodeURIComponent('All shops restocked successfully'));
  } catch (error) {
    console.error('Error restocking all shops:', error);
    res.redirect(`/admin/shops/inventory?date=${req.body.date}&messageType=error&message=` + encodeURIComponent('Error restocking all shops: ' + error.message));
  }
});

// Restock All Shops (from dashboard)
router.get('/restock-all', isAdmin, async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    
    // Restock all shops
    await DailyShopItems.restockAllShops(date);
    
    res.redirect('/admin/shops?message=' + encodeURIComponent('All shops restocked successfully'));
  } catch (error) {
    console.error('Error restocking all shops:', error);
    res.redirect('/admin/shops?messageType=error&message=' + encodeURIComponent('Error restocking all shops: ' + error.message));
  }
});

// Remove Item from Shop
router.post('/inventory/remove-item', isAdmin, async (req, res) => {
  try {
    const { shop_id, item_id, date } = req.body;
    
    // Remove item from shop
    await DailyShopItems.removeItem(shop_id, item_id, date);
    
    res.redirect(`/admin/shops/inventory?date=${date}&message=` + encodeURIComponent('Item removed successfully'));
  } catch (error) {
    console.error('Error removing item from shop:', error);
    res.redirect(`/admin/shops/inventory?date=${req.body.date}&messageType=error&message=` + encodeURIComponent('Error removing item: ' + error.message));
  }
});

module.exports = router;
