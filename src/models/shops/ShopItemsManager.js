const pool = require('../../db');

/**
 * Manager for shop items
 */
class ShopItemsManager {
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
      console.log(`Getting shop items for ${shopId} on ${targetDate}`);

      // First, check if the daily_shop_items table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'daily_shop_items'
        );
      `;

      const tableCheckResult = await pool.query(tableCheckQuery);
      const tableExists = tableCheckResult.rows[0].exists;

      if (!tableExists) {
        console.log('daily_shop_items table does not exist, creating it...');

        // Create the table
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS daily_shop_items (
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

        await pool.query(createTableQuery);
        console.log('daily_shop_items table created successfully');

        // No items yet, so return empty array
        return [];
      }

      // Check if there are any items for this shop and date
      const countQuery = `
        SELECT COUNT(*) FROM daily_shop_items
        WHERE shop_id = $1 AND date = $2
      `;

      const countResult = await pool.query(countQuery, [shopId, targetDate]);
      const itemCount = parseInt(countResult.rows[0].count);

      console.log(`Found ${itemCount} items for shop ${shopId} on ${targetDate}`);

      if (itemCount === 0) {
        // No items found, try to restock
        console.log(`No items found for ${shopId}, attempting to restock...`);
        return [];
      }

      // Get the items without joining to the items table first
      const shopItemsQuery = `
        SELECT * FROM daily_shop_items
        WHERE shop_id = $1 AND date = $2
      `;

      const shopItemsResult = await pool.query(shopItemsQuery, [shopId, targetDate]);
      const shopItems = shopItemsResult.rows;

      console.log(`Retrieved ${shopItems.length} shop items from daily_shop_items`);

      // Now get the item details from the items table
      const itemDetails = [];

      for (const shopItem of shopItems) {
        try {
          // Get item details
          const itemQuery = `
            SELECT name, effect, icon, rarity, category
            FROM items
            WHERE name = $1
          `;

          const itemResult = await pool.query(itemQuery, [shopItem.item_id]);

          if (itemResult.rows.length > 0) {
            const item = itemResult.rows[0];

            // Combine shop item and item details
            itemDetails.push({
              ...shopItem,
              name: item.name, // Keep original name
              item_name: item.name,
              description: item.effect, // Keep original description
              item_description: item.effect,
              effect: item.effect,
              item_image: item.icon || 'https://via.placeholder.com/150',
              item_rarity: item.rarity,
              item_type: item.category,
              category: item.category // Keep original category
            });
          } else {
            // Item not found, just use the shop item data
            itemDetails.push({
              ...shopItem,
              name: shopItem.item_id, // Keep original name
              item_name: shopItem.item_id,
              description: 'No description available', // Keep original description
              item_description: 'No description available',
              effect: 'No description available',
              item_image: 'https://via.placeholder.com/150',
              item_rarity: 'common',
              item_type: 'unknown',
              category: 'unknown' // Keep original category
            });
          }
        } catch (itemError) {
          console.error(`Error getting details for item ${shopItem.item_id}:`, itemError);

          // Add the item with minimal details
          itemDetails.push({
            ...shopItem,
            name: shopItem.item_id, // Keep original name
            item_name: shopItem.item_id,
            description: 'Error retrieving item details', // Keep original description
            item_description: 'Error retrieving item details',
            effect: 'Error retrieving item details',
            item_image: 'https://via.placeholder.com/150',
            item_rarity: 'common',
            item_type: 'unknown',
            category: 'unknown' // Keep original category
          });
        }
      }

      console.log(`Returning ${itemDetails.length} items with details`);
      return itemDetails;
    } catch (error) {
      console.error(`Error getting daily shop items for ${shopId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific item from a shop
   * @param {string} itemId - The item ID
   * @param {string} shopId - The shop ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Object>} Shop item
   */
  static async getShopItem(itemId, shopId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Getting shop item ${itemId} from ${shopId} on ${targetDate}`);

      // Check if the daily_shop_items table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'daily_shop_items'
        );
      `;

      const tableCheckResult = await pool.query(tableCheckQuery);
      const tableExists = tableCheckResult.rows[0].exists;

      if (!tableExists) {
        console.log('daily_shop_items table does not exist');
        return null;
      }

      // Get the shop item
      const shopItemQuery = `
        SELECT * FROM daily_shop_items
        WHERE item_id = $1 AND shop_id = $2 AND date = $3
      `;

      const shopItemResult = await pool.query(shopItemQuery, [itemId, shopId, targetDate]);

      if (shopItemResult.rows.length === 0) {
        console.log(`Shop item ${itemId} not found in ${shopId} on ${targetDate}`);
        return null;
      }

      const shopItem = shopItemResult.rows[0];

      // Get item details
      try {
        const itemQuery = `
          SELECT name, effect, icon, rarity, category
          FROM items
          WHERE name = $1
        `;

        const itemResult = await pool.query(itemQuery, [shopItem.item_id]);

        if (itemResult.rows.length > 0) {
          const item = itemResult.rows[0];

          // Combine shop item and item details
          return {
            ...shopItem,
            item_name: item.name,
            item_description: item.effect,
            item_image: item.icon || 'https://via.placeholder.com/150',
            item_rarity: item.rarity,
            item_type: item.category
          };
        } else {
          // Item not found, just use the shop item data
          return {
            ...shopItem,
            item_name: shopItem.item_id,
            item_description: 'No description available',
            item_image: 'https://via.placeholder.com/150',
            item_rarity: 'common',
            item_type: 'unknown'
          };
        }
      } catch (itemError) {
        console.error(`Error getting details for item ${shopItem.item_id}:`, itemError);

        // Return the item with minimal details
        return {
          ...shopItem,
          item_name: shopItem.item_id,
          item_description: 'Error retrieving item details',
          item_image: 'https://via.placeholder.com/150',
          item_rarity: 'common',
          item_type: 'unknown'
        };
      }
    } catch (error) {
      console.error(`Error getting shop item ${itemId} from ${shopId}:`, error);
      return null;
    }
  }

  /**
   * Get remaining purchase quantity for an item
   * @param {string} playerId - Player ID
   * @param {string} shopId - Shop ID
   * @param {string} itemId - Item ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<number>} Remaining purchase quantity
   */
  static async getRemainingQuantity(playerId, shopId, itemId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Getting remaining quantity for player ${playerId}, shop ${shopId}, item ${itemId} on ${targetDate}`);

      // Get the item's max quantity (changed from purchase_limit to max_quantity)
      const shopItemQuery = `
        SELECT max_quantity
        FROM daily_shop_items
        WHERE shop_id = $1 AND item_id = $2 AND date = $3
      `;

      const shopItemResult = await pool.query(shopItemQuery, [shopId, itemId, targetDate]);
      const maxQuantity = parseInt(shopItemResult.rows[0]?.max_quantity) || 1;

      // If no playerId provided, return max quantity
      if (!playerId) {
        return maxQuantity;
      }

      // Get the number of purchases made by this player
      const purchasesQuery = `
        SELECT COALESCE(SUM(quantity), 0) as purchased_quantity
        FROM player_shop_purchases
        WHERE player_id = $1 AND shop_id = $2 AND item_id = $3 AND date = $4
      `;

      const purchasesResult = await pool.query(purchasesQuery, [playerId, shopId, itemId, targetDate]);
      const purchasedQuantity = parseInt(purchasesResult.rows[0].purchased_quantity) || 0;
      console.log(`Purchased quantity for item ${itemId}: ${purchasedQuantity}`);

      // Calculate remaining quantity
      const remainingQuantity = Math.max(0, maxQuantity - purchasedQuantity);
      console.log(`Remaining quantity for item ${itemId}: ${remainingQuantity}`);

      return remainingQuantity;
    } catch (error) {
      console.error(`Error getting remaining quantity for item ${itemId}:`, error);
      return 0;
    }
  }

  /**
   * Get all daily shop items
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of daily shop items
   */
  static async getAllDailyItems(date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Getting all daily shop items for ${targetDate}`);

      // Check if the daily_shop_items table exists
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'daily_shop_items'
        );
      `;

      const tableCheckResult = await pool.query(tableCheckQuery);
      const tableExists = tableCheckResult.rows[0].exists;

      if (!tableExists) {
        console.log('daily_shop_items table does not exist');
        return [];
      }

      // Get all shop items for the date
      const shopItemsQuery = `
        SELECT dsi.*, sc.name as shop_name
        FROM daily_shop_items dsi
        LEFT JOIN shop_config sc ON dsi.shop_id = sc.shop_id
        WHERE dsi.date = $1
        ORDER BY sc.name, dsi.price
      `;

      const shopItemsResult = await pool.query(shopItemsQuery, [targetDate]);
      const shopItems = shopItemsResult.rows;

      console.log(`Retrieved ${shopItems.length} shop items for ${targetDate}`);

      if (shopItems.length === 0) {
        return [];
      }

      // Get item details for all items
      const itemDetails = [];

      for (const shopItem of shopItems) {
        try {
          // Get item details
          const itemQuery = `
            SELECT name, effect, icon, rarity, category
            FROM items
            WHERE name = $1
          `;

          const itemResult = await pool.query(itemQuery, [shopItem.item_id]);

          if (itemResult.rows.length > 0) {
            const item = itemResult.rows[0];

            // Combine shop item and item details
            itemDetails.push({
              ...shopItem,
              item_name: item.name,
              item_description: item.effect,
              item_image: item.icon || 'https://via.placeholder.com/150',
              item_rarity: item.rarity,
              item_type: item.category
            });
          } else {
            // Item not found, just use the shop item data
            itemDetails.push({
              ...shopItem,
              item_name: shopItem.item_id,
              item_description: 'No description available',
              item_image: 'https://via.placeholder.com/150',
              item_rarity: 'common',
              item_type: 'unknown'
            });
          }
        } catch (itemError) {
          console.error(`Error getting details for item ${shopItem.item_id}:`, itemError);

          // Add the item with minimal details
          itemDetails.push({
            ...shopItem,
            item_name: shopItem.item_id,
            item_description: 'Error retrieving item details',
            item_image: 'https://via.placeholder.com/150',
            item_rarity: 'common',
            item_type: 'unknown'
          });
        }
      }

      console.log(`Returning ${itemDetails.length} items with details`);
      return itemDetails;
    } catch (error) {
      console.error(`Error getting all daily shop items:`, error);
      return [];
    }
  }
}

module.exports = ShopItemsManager;

