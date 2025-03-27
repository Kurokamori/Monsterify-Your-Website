const db = require('../db');
const Item = require('./Item');

/**
 * Shop Configuration Model
 */
class ShopConfig {
  /**
   * Create the shop_config table if it doesn't exist and initialize shop data
   * @returns {Promise<void>}
   */
  static async createTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS shop_config (
          shop_id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          image_url TEXT,
          category VARCHAR(50) NOT NULL,
          price_multiplier_min FLOAT DEFAULT 1.0,
          price_multiplier_max FLOAT DEFAULT 2.0,
          min_items INTEGER DEFAULT 5,
          max_items INTEGER DEFAULT 10,
          restock_hour INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_shop_items (
          id SERIAL PRIMARY KEY,
          shop_id VARCHAR(50) REFERENCES shop_config(shop_id),
          item_id VARCHAR(100),
          price INTEGER NOT NULL,
          max_quantity INTEGER DEFAULT 1,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS player_shop_purchases (
          id SERIAL PRIMARY KEY,
          player_id VARCHAR(50) NOT NULL,
          shop_id VARCHAR(50) NOT NULL,
          item_id VARCHAR(100) NOT NULL,
          quantity INTEGER NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_daily_shop_items_shop_date ON daily_shop_items(shop_id, date);
        CREATE INDEX IF NOT EXISTS idx_player_shop_purchases_player ON player_shop_purchases(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_shop_purchases_shop_date ON player_shop_purchases(shop_id, date);
      `;

      await db.query(query);
      console.log('Shop tables created or already exist');

      // Check if we need to initialize shop data
      const checkQuery = 'SELECT COUNT(*) as count FROM shop_config';
      const checkResult = await db.query(checkQuery);
      const shopCount = parseInt(checkResult.rows[0].count);

      if (shopCount === 0) {
        await this.initializeShopData();
      }
    } catch (error) {
      console.error('Error creating shop tables:', error);
      throw error;
    }
  }

  /**
   * Initialize shop data with default shops
   * @returns {Promise<void>}
   */
  static async initializeShopData() {
    try {
      const shops = [
        {
          shop_id: 'berry_shop',
          name: 'Apothecary',
          description: 'Purchase berries and healing items for your monsters.',
          image_url: 'https://i.imgur.com/HViAPDq.jpeg',
          category: 'berries',
          price_multiplier_min: 1.0,
          price_multiplier_max: 1.5,
          min_items: 5,
          max_items: 10
        },
        {
          shop_id: 'pastry_shop',
          name: 'Bakery',
          description: 'Purchase delicious pastries for your monsters.',
          image_url: 'https://i.imgur.com/5cgcSGC.png',
          category: 'pastries',
          price_multiplier_min: 1.0,
          price_multiplier_max: 1.5,
          min_items: 5,
          max_items: 10
        },
        {
          shop_id: 'evolution_shop',
          name: 'Witch\'s Hut',
          description: 'Purchase evolution items and learn new abilities.',
          image_url: 'https://i.imgur.com/5cgcSGC.png',
          category: 'evolution',
          price_multiplier_min: 1.5,
          price_multiplier_max: 2.5,
          min_items: 3,
          max_items: 8
        },
        {
          shop_id: 'ball_shop',
          name: 'Mega Mart',
          description: 'Purchase Poké Balls and other catching items.',
          image_url: 'https://i.imgur.com/RmKySNO.png',
          category: 'balls',
          price_multiplier_min: 1.0,
          price_multiplier_max: 2.0,
          min_items: 4,
          max_items: 8
        },
        {
          shop_id: 'antique_shop',
          name: 'Antique Store',
          description: 'Purchase rare antiques and collectibles.',
          image_url: 'https://i.imgur.com/Yg6BWUm.jpeg',
          category: 'antiques',
          price_multiplier_min: 2.0,
          price_multiplier_max: 3.0,
          min_items: 3,
          max_items: 6
        },
        {
          shop_id: 'egg_shop',
          name: 'Nursery',
          description: 'Purchase egg items and accessories.',
          image_url: 'https://i.imgur.com/IhtWUxD.png',
          category: 'EGGS',
          price_multiplier_min: 1.5,
          price_multiplier_max: 2.5,
          min_items: 3,
          max_items: 7
        },
        {
          shop_id: 'black_market_shop',
          name: 'Pirate\'s Dock',
          description: 'Purchase black market items at a markup.',
          image_url: 'https://i.imgur.com/RmKySNO.png',
          category: 'black_market',
          price_multiplier_min: 2.5,
          price_multiplier_max: 4.0,
          min_items: 2,
          max_items: 5
        }
      ];

      for (const shop of shops) {
        await this.create(shop);
        console.log(`Created shop: ${shop.name}`);
      }

      console.log('Shop data initialized successfully');
    } catch (error) {
      console.error('Error initializing shop data:', error);
      throw error;
    }
  }

  /**
   * Get all active shops
   * @returns {Promise<Array>} Array of shop configurations
   */
  static async getAllActive() {
    try {
      const query = 'SELECT * FROM shop_config WHERE is_active = true ORDER BY name';
      console.log('Executing query for active shops:', query);
      const result = await db.query(query);
      console.log(`Found ${result.rows.length} active shops:`, result.rows);
      return result.rows;
    } catch (error) {
      console.error('Error getting active shops:', error);
      throw error;
    }
  }

  /**
   * Get a shop by ID
   * @param {string} shopId - The shop ID
   * @returns {Promise<Object>} Shop configuration
   */
  static async getById(shopId) {
    try {
      const query = 'SELECT * FROM shop_config WHERE shop_id = $1';
      const result = await db.query(query, [shopId]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new shop
   * @param {Object} shopData - The shop data
   * @returns {Promise<Object>} Created shop
   */
  static async create(shopData) {
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
      } = shopData;

      const query = `
        INSERT INTO shop_config (
          shop_id, name, description, image_url, category,
          price_multiplier_min, price_multiplier_max, min_items, max_items,
          restock_hour, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
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
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  }

  /**
   * Update a shop
   * @param {string} shopId - The shop ID
   * @param {Object} shopData - The shop data to update
   * @returns {Promise<Object>} Updated shop
   */
  static async update(shopId, shopData) {
    try {
      const columns = [];
      const values = [];
      let paramIndex = 1;

      // Build the SET clause dynamically based on provided data
      for (const [key, value] of Object.entries(shopData)) {
        if (value !== undefined && key !== 'shop_id') {
          columns.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      // Add the shop_id as the last parameter
      values.push(shopId);

      const query = `
        UPDATE shop_config
        SET ${columns.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a shop
   * @param {string} shopId - The shop ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(shopId) {
    try {
      const query = 'DELETE FROM shop_config WHERE shop_id = $1 RETURNING *';
      const result = await db.query(query, [shopId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error deleting shop ${shopId}:`, error);
      throw error;
    }
  }
}

/**
 * Daily Shop Items Model
 */
class DailyShopItems {
  /**
   * Get daily items for a shop
   * @param {string} shopId - The shop ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of daily shop items
   */
  static async getShopItems(shopId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT dsi.*, i.name as item_name, i.effect as item_description,
               COALESCE(i.icon, 'https://via.placeholder.com/150') as item_image,
               i.rarity as item_rarity, i.category as item_type
        FROM daily_shop_items dsi
        JOIN items i ON dsi.item_id = i.name
        WHERE dsi.shop_id = $1 AND dsi.date = $2
        ORDER BY i.name
      `;

      const result = await db.query(query, [shopId, targetDate]);
      console.log(`Shop ${shopId} items for ${targetDate}:`, result.rows);
      return result.rows;
    } catch (error) {
      console.error(`Error getting daily items for shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Get remaining purchase quantity for a player
   * @param {string} playerId - The player ID
   * @param {string} shopId - The shop ID
   * @param {string} itemId - The item ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<number>} Remaining purchase quantity
   */
  static async getRemainingQuantity(playerId, shopId, itemId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get the max quantity from daily_shop_items
      const maxQuery = `
        SELECT max_quantity
        FROM daily_shop_items
        WHERE shop_id = $1 AND item_id = $2 AND date = $3
      `;

      const maxResult = await db.query(maxQuery, [shopId, itemId, targetDate]);

      if (maxResult.rows.length === 0) {
        return 0; // Item not available today
      }

      const maxQuantity = maxResult.rows[0].max_quantity;

      // Get the purchased quantity from player_shop_purchases
      const purchasedQuery = `
        SELECT COALESCE(SUM(quantity), 0) as purchased
        FROM player_shop_purchases
        WHERE player_id = $1 AND shop_id = $2 AND item_id = $3 AND date = $4
      `;

      const purchasedResult = await db.query(purchasedQuery, [playerId, shopId, itemId, targetDate]);
      const purchasedQuantity = parseInt(purchasedResult.rows[0].purchased) || 0;

      // Calculate remaining quantity
      return Math.max(0, maxQuantity - purchasedQuantity);
    } catch (error) {
      console.error(`Error getting remaining quantity for player ${playerId}, shop ${shopId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Restock a shop with new items
   * @param {string} shopId - The shop ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of new daily shop items
   */
  static async restockShop(shopId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Restocking shop ${shopId} for date ${targetDate}`);

      // Get shop configuration
      const shop = await ShopConfig.getById(shopId);

      if (!shop) {
        throw new Error(`Shop ${shopId} not found`);
      }

      // Delete existing items for this shop and date
      await db.query(
        "DELETE FROM daily_shop_items WHERE shop_id = $1 AND date = $2",
        [shopId, targetDate]
      );

      // Get items of the shop's category
      const items = await Item.getByCategory(shop.category);
      console.log(`Found ${items ? items.length : 0} items for category ${shop.category}:`, items);

      if (!items || items.length === 0) {
        console.warn(`No items found for category ${shop.category}`);
        return [];
      }

      // Randomly select items
      const numItems = Math.floor(
        Math.random() * (shop.max_items - shop.min_items + 1) + shop.min_items
      );

      // Shuffle items and take the first numItems
      const shuffledItems = items.sort(() => 0.5 - Math.random()).slice(0, numItems);

      // Insert new daily shop items
      const insertPromises = shuffledItems.map(async (item) => {
        // Calculate price based on item rarity and shop multiplier
        const multiplier =
          Math.random() * (shop.price_multiplier_max - shop.price_multiplier_min) +
          shop.price_multiplier_min;

        const basePrice = item.rarity * 100; // Base price calculation
        const price = Math.round(basePrice * multiplier);

        // Random quantity between 1 and 10
        const maxQuantity = Math.floor(Math.random() * 10) + 1;

        const query = `
          INSERT INTO daily_shop_items (shop_id, item_id, price, max_quantity, date)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const result = await db.query(query, [
          shopId,
          item.name,
          price,
          maxQuantity,
          targetDate
        ]);

        return result.rows[0];
      });

      const results = await Promise.all(insertPromises);
      return results;
    } catch (error) {
      console.error(`Error restocking shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Restock all shops
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} Results of restocking all shops
   */
  static async restockAllShops(date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Restocking all shops for date ${targetDate}`);

      // Get all active shops
      const shops = await ShopConfig.getAllActive();
      console.log(`Found ${shops ? shops.length : 0} active shops:`, shops);

      if (!shops || shops.length === 0) {
        console.warn("No active shops found");
        return { success: false, message: "No active shops found" };
      }

      // Restock each shop
      const results = {};

      for (const shop of shops) {
        try {
          const items = await this.restockShop(shop.shop_id, targetDate);
          results[shop.shop_id] = {
            success: true,
            count: items.length,
            items
          };
        } catch (error) {
          console.error(`Error restocking shop ${shop.shop_id}:`, error);
          results[shop.shop_id] = {
            success: false,
            error: error.message
          };
        }
      }

      return {
        success: true,
        date: targetDate,
        results
      };
    } catch (error) {
      console.error("Error restocking all shops:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize shop items for all shops
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if shops were initialized
   */
  static async initializeShopItems(date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Initializing shop items for ${targetDate}`);

      // Check if we have any items for today
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM daily_shop_items
        WHERE date = $1
      `;

      const checkResult = await db.query(checkQuery, [targetDate]);
      const itemCount = parseInt(checkResult.rows[0].count);

      if (itemCount > 0) {
        console.log(`Shops already have ${itemCount} items for ${targetDate}`);
        return false;
      }

      // Restock all shops
      console.log(`Initializing all shops for ${targetDate}`);
      await this.restockAllShops(targetDate);
      return true;
    } catch (error) {
      console.error('Error initializing shop items:', error);
      return false;
    }
  }

  /**
   * Check if shops need to be restocked
   * @returns {Promise<boolean>} True if shops were restocked
   */
  static async checkAndRestockIfNeeded() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      console.log(`Checking if shops need to be restocked for ${today} at hour ${currentHour}`);

      // Check if we have any items for today
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM daily_shop_items
        WHERE date = $1
      `;

      const checkResult = await db.query(checkQuery, [today]);
      const itemCount = parseInt(checkResult.rows[0].count);

      // If we have items and it's not restock hour, no need to restock
      if (itemCount > 0) {
        console.log(`Shops already have ${itemCount} items for today`);
        // Let's check which shops have items
        const shopItemsQuery = `
          SELECT shop_id, COUNT(*) as item_count
          FROM daily_shop_items
          WHERE date = $1
          GROUP BY shop_id
        `;

        const shopItemsResult = await db.query(shopItemsQuery, [today]);
        console.log('Shop items distribution:', shopItemsResult.rows);

        return false;
      }

      // Restock all shops
      console.log("Restocking all shops for today");
      await this.restockAllShops(today);
      return true;
    } catch (error) {
      console.error("Error checking and restocking shops:", error);
      return false;
    }
  }
}

/**
 * Player Shop Purchases Model
 */
class PlayerShopPurchases {
  /**
   * Record a player purchase from a shop
   * @param {string} playerId - The player ID
   * @param {string} shopId - The shop ID
   * @param {string} itemId - The item ID
   * @param {number} quantity - The quantity purchased
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} The purchase record
   */
  static async recordPurchase(playerId, shopId, itemId, quantity, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Check if there is an existing purchase record for today
      const checkQuery = `
        SELECT id, quantity
        FROM player_shop_purchases
        WHERE player_id = $1 AND shop_id = $2 AND item_id = $3 AND date = $4
      `;

      const checkResult = await db.query(checkQuery, [playerId, shopId, itemId, targetDate]);

      if (checkResult.rows.length > 0) {
        // Update existing record
        const existingRecord = checkResult.rows[0];
        const newQuantity = existingRecord.quantity + quantity;

        const updateQuery = `
          UPDATE player_shop_purchases
          SET quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;

        const updateResult = await db.query(updateQuery, [newQuantity, existingRecord.id]);
        return updateResult.rows[0];
      } else {
        // Create new record
        const insertQuery = `
          INSERT INTO player_shop_purchases (player_id, shop_id, item_id, quantity, date)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const insertResult = await db.query(insertQuery, [playerId, shopId, itemId, quantity, targetDate]);
        return insertResult.rows[0];
      }
    } catch (error) {
      console.error(`Error recording purchase for player ${playerId}, shop ${shopId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get purchase history for a player
   * @param {string} playerId - The player ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of purchase records
   */
  static async getPlayerPurchases(playerId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT psp.*, i.name as item_name, i.effect as item_description,
               i.icon as item_image, i.rarity as item_rarity, i.category as item_type,
               sc.name as shop_name
        FROM player_shop_purchases psp
        JOIN items i ON psp.item_id = i.name
        JOIN shop_config sc ON psp.shop_id = sc.shop_id
        WHERE psp.player_id = $1 AND psp.date = $2
        ORDER BY psp.created_at DESC
      `;

      const result = await db.query(query, [playerId, targetDate]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting purchase history for player ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Get total purchases for a player on a specific date
   * @param {string} playerId - The player ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} Total purchases by shop
   */
  static async getTotalPurchases(playerId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];

      const query = `
        SELECT shop_id, SUM(quantity) as total_quantity, COUNT(DISTINCT item_id) as unique_items
        FROM player_shop_purchases
        WHERE player_id = $1 AND date = $2
        GROUP BY shop_id
      `;

      const result = await db.query(query, [playerId, targetDate]);

      // Convert to object with shop_id as key
      const totals = {};
      result.rows.forEach(row => {
        totals[row.shop_id] = {
          total_quantity: parseInt(row.total_quantity),
          unique_items: parseInt(row.unique_items)
        };
      });

      return totals;
    } catch (error) {
      console.error(`Error getting total purchases for player ${playerId}:`, error);
      throw error;
    }
  }
}

module.exports = {
  ShopConfig,
  DailyShopItems,
  PlayerShopPurchases
};