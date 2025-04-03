const pool = require('../config/database');
const ShopConfig = require('./shops/ShopConfig');
const ShopItemsManager = require('./shops/ShopItemsManager');

/**
 * Shop System
 */
const ShopSystem = {
  /**
   * Initialize shop configuration
   * @returns {Promise<void>}
   */
  async initializeShopConfig() {
    try {
      // Check if shop_config table exists
      const shopConfigQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'shop_config'
        );
      `;

      const shopConfigResult = await pool.query(shopConfigQuery);
      const shopConfigExists = shopConfigResult.rows[0].exists;

      if (!shopConfigExists) {
        console.log('shop_config table does not exist, creating it...');

        // Create shop_config table
        const createShopConfigQuery = `
          CREATE TABLE shop_config (
            id SERIAL PRIMARY KEY,
            shop_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            image_url TEXT,
            category VARCHAR(50) NOT NULL,
            price_multiplier_min NUMERIC(5,2) DEFAULT 0.8,
            price_multiplier_max NUMERIC(5,2) DEFAULT 1.2,
            min_items INTEGER DEFAULT 3,
            max_items INTEGER DEFAULT 10,
            restock_hour INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;

        await pool.query(createShopConfigQuery);
        console.log('shop_config table created successfully');
      }

      // Check if daily_shop_items table exists
      const dailyShopItemsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'daily_shop_items'
        );
      `;

      const dailyShopItemsResult = await pool.query(dailyShopItemsQuery);
      const dailyShopItemsExists = dailyShopItemsResult.rows[0].exists;

      if (!dailyShopItemsExists) {
        console.log('daily_shop_items table does not exist, creating it...');

        // Create daily_shop_items table
        const createDailyShopItemsQuery = `
          CREATE TABLE daily_shop_items (
            id SERIAL PRIMARY KEY,
            shop_id VARCHAR(50) NOT NULL,
            item_id VARCHAR(100) NOT NULL,
            price INTEGER NOT NULL,
            purchase_limit INTEGER DEFAULT 1,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(shop_id, item_id, date)
          );
        `;

        await pool.query(createDailyShopItemsQuery);
        console.log('daily_shop_items table created successfully');
      }

      // Check if there are any shops configured
      const countQuery = `SELECT COUNT(*) FROM shop_config`;
      const countResult = await pool.query(countQuery);
      const shopCount = parseInt(countResult.rows[0].count);

      if (shopCount === 0) {
        console.log('No shops configured, initializing default shops...');

        // Default shop configurations
        const defaultShops = [
          {
            shop_id: 'apothecary',
            name: 'Apothecary',
            description: 'A shop selling potions and remedies',
            category: 'ITEMS',
            price_multiplier_min: 0.8,
            price_multiplier_max: 1.2,
            min_items: 5,
            max_items: 10,
            is_active: true
          },
          {
            shop_id: 'bakery',
            name: 'Bakery',
            description: 'A shop selling delicious pastries',
            category: 'PASTRIES',
            price_multiplier_min: 0.9,
            price_multiplier_max: 1.1,
            min_items: 5,
            max_items: 8,
            is_active: true
          },
          {
            shop_id: 'witchs_hut',
            name: 'Witch\'s Hut',
            description: 'A mysterious shop selling magical items',
            category: 'EVOLUTION',
            price_multiplier_min: 1.0,
            price_multiplier_max: 1.5,
            min_items: 3,
            max_items: 6,
            is_active: true
          },
          {
            shop_id: 'megamart',
            name: 'Mega Mart',
            description: 'A large store with a variety of items',
            category: 'ITEMS',
            price_multiplier_min: 0.7,
            price_multiplier_max: 1.3,
            min_items: 8,
            max_items: 15,
            is_active: true
          },
          {
            shop_id: 'antique_shop',
            name: 'Antique Store',
            description: 'A shop selling rare and valuable antiques',
            category: 'ANTIQUE',
            price_multiplier_min: 1.2,
            price_multiplier_max: 1.8,
            min_items: 3,
            max_items: 5,
            is_active: true
          },
          {
            shop_id: 'nursery',
            name: 'Nursery',
            description: 'A shop selling plants and berries',
            category: 'BERRIES',
            price_multiplier_min: 0.8,
            price_multiplier_max: 1.2,
            min_items: 5,
            max_items: 10,
            is_active: true
          },
          {
            shop_id: 'pirates_dock',
            name: 'Pirate\'s Dock',
            description: 'A shady shop selling all kinds of items',
            category: 'ALL',
            price_multiplier_min: 1.0,
            price_multiplier_max: 1.5,
            min_items: 5,
            max_items: 10,
            is_active: true
          }
        ];

        // Insert default shops
        for (const shop of defaultShops) {
          const insertQuery = `
            INSERT INTO shop_config (
              shop_id, name, description, category,
              price_multiplier_min, price_multiplier_max, min_items, max_items,
              is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (shop_id) DO NOTHING
          `;

          await pool.query(insertQuery, [
            shop.shop_id,
            shop.name,
            shop.description,
            shop.category,
            shop.price_multiplier_min,
            shop.price_multiplier_max,
            shop.min_items,
            shop.max_items,
            shop.is_active
          ]);
        }

        console.log('Default shops initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing shop configuration:', error);
    }
  },

  /**
   * Get shop configuration
   * @param {string} shopId - Shop ID
   * @returns {Promise<Object>} - Shop configuration
   */
  async getShopConfig(shopId) {
    return await ShopConfig.getById(shopId);
  },

  /**
   * Get daily shop items
   * @param {string} shopId - Shop ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of shop items
   */
  async getDailyShopItems(shopId, date = null) {
    return await ShopItemsManager.getShopItems(shopId, date);
  },

  /**
   * Restock all shops
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} - True if successful
   */
  async restockAllShops(date = null) {
    try {
      // Initialize shop configuration if needed
      await this.initializeShopConfig();

      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Restocking all shops for date ${targetDate}`);

      // Force clear existing items for today to ensure fresh restock
      const clearQuery = `DELETE FROM daily_shop_items WHERE date = $1`;
      await pool.query(clearQuery, [targetDate]);
      console.log(`Cleared existing shop items for ${targetDate}`);

      // Get all active shops
      const shops = await ShopConfig.getAllActive();
      console.log(`Found ${shops ? shops.length : 0} active shops`);

      if (!shops || shops.length === 0) {
        console.log('No active shops found');
        return false;
      }

      // Restock each shop
      for (const shop of shops) {
        console.log(`Restocking shop ${shop.shop_id}...`);

        // Get items based on shop's category
        const category = shop.category;
        console.log(`Shop category: ${category}`);

        let items = [];

        // Special case for pirates_dock - get items from all categories except 'Special' and 'Key Items'
        if (shop.shop_id === 'pirates_dock') {
          console.log('Getting items for Pirate\'s Dock from all categories except Special and Key Items');
          // Get all items
          const allItemsQuery = `SELECT * FROM items`;
          const allItemsResult = await pool.query(allItemsQuery);
          const allItems = allItemsResult.rows;

          // Filter out Special and Key Items
          items = allItems.filter(item => {
            const itemCategory = (item.category || '').toLowerCase();
            return itemCategory !== 'special' && itemCategory !== 'key items';
          });

          console.log(`Found ${items.length} items for Pirate's Dock after filtering`);
        } else {
          // For other shops, get items with matching category
          const itemsQuery = `SELECT * FROM items WHERE LOWER(category) = LOWER($1)`;
          const itemsResult = await pool.query(itemsQuery, [category]);
          items = itemsResult.rows;

          console.log(`Found ${items.length} items for category ${category}`);
        }

        if (!items || items.length === 0) {
          console.log(`No items found for shop ${shop.shop_id} with category ${category}`);
          continue;
        }

        // Determine number of items to stock
        const minItems = shop.min_items || 3;
        const maxItems = shop.max_items || 10;
        const numItems = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

        console.log(`Stocking ${numItems} items for shop ${shop.shop_id}`);

        // Randomly select items
        const selectedItems = [];
        const selectedItemIds = new Set();

        for (let i = 0; i < numItems && i < items.length; i++) {
          let randomIndex;
          let attempts = 0;

          // Try to find a unique item (avoid duplicates)
          do {
            randomIndex = Math.floor(Math.random() * items.length);
            attempts++;
            // Check if the item is already selected using name
            const currentItem = items[randomIndex];
            const currentItemId = currentItem.name;
            if (selectedItemIds.has(currentItemId)) {
              continue;
            } else {
              break;
            }
          } while (attempts < 100);

          // Add item to selected items
          const item = items[randomIndex];
          const itemId = item.name; // Use name as the item ID
          selectedItemIds.add(itemId);

          // Calculate price based on rarity and shop multiplier
          const basePrice = item.price || this._getBasePriceByRarity(item.rarity);

          // Apply shop multiplier
          let shopMultiplierValue;

          // Check if shopMultiplier has valid min and max values
          if (typeof shop.price_multiplier_min === 'number' && typeof shop.price_multiplier_max === 'number') {
            shopMultiplierValue = Math.random() * (shop.price_multiplier_max - shop.price_multiplier_min) + shop.price_multiplier_min;
          } else {
            // Use default multiplier if values are invalid
            console.warn(`Invalid shop multiplier for ${shop.shop_id}. Using default 1.0.`);
            shopMultiplierValue = 1.0;
          }

          const price = Math.round(basePrice * shopMultiplierValue);

          // Add to selected items
          selectedItems.push({
            item_id: itemId, // Use the name as the item ID
            price,
            purchase_limit: this._getPurchaseLimitByRarity(item.rarity)
          });
        }

        // Insert selected items into daily_shop_items
        for (const item of selectedItems) {
          const insertQuery = `
            INSERT INTO daily_shop_items (
              shop_id, item_id, price, date
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (shop_id, item_id, date) DO NOTHING
          `;

          await pool.query(insertQuery, [
            shop.shop_id,
            item.item_id,
            item.price,
            targetDate
          ]);
        }

        console.log(`Successfully restocked shop ${shop.shop_id} with ${selectedItems.length} items`);
      }

      return true;
    } catch (error) {
      console.error('Error restocking all shops:', error);
      return false;
    }
  },

  /**
   * Get base price by rarity
   * @param {string} rarity - Item rarity
   * @returns {number} - Base price
   * @private
   */
  _getBasePriceByRarity(rarity) {
    const rarityPrices = {
      'common': 100,
      'uncommon': 250,
      'rare': 500,
      'epic': 1000,
      'legendary': 2500,
      'mythic': 5000
    };

    return rarityPrices[rarity?.toLowerCase()] || 100;
  },

  /**
   * Get purchase limit by rarity
   * @param {string} rarity - Item rarity
   * @returns {number} - Purchase limit
   * @private
   */
  _getPurchaseLimitByRarity(rarity) {
    const rarityLimits = {
      'common': 5,
      'uncommon': 3,
      'rare': 2,
      'epic': 1,
      'legendary': 1,
      'mythic': 1
    };

    return rarityLimits[rarity?.toLowerCase()] || 1;
  }
};

module.exports = {
  ...ShopSystem,
  ShopConfig,
  DailyShopItems: {
    getShopItems: ShopItemsManager.getShopItems,
    getShopItem: ShopItemsManager.getShopItem,
    getAllDailyItems: ShopItemsManager.getAllDailyItems,
    getRemainingQuantity: ShopItemsManager.getRemainingQuantity,
    restockShop: require('./shops/DailyShopItems').restockShop,
    restockAllShops: require('./shops/DailyShopItems').restockAllShops
  },
  PlayerShopPurchases: require('./shops/PlayerShopPurchases')
};

