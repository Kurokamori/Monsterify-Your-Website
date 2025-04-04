const pool = require('../../db');
const ITEM_BASE_PRICES = require('../../utils/ItemPriceConstants');

class DailyShopItems {
  /**
   * Get daily items for a shop
   * @param {string} shopId - The shop ID
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of daily shop items
   */
  static async getShopItems(shopId, targetDate = null, playerId = null) {
    try {
      const date = targetDate || new Date().toISOString().split('T')[0];

      const query = `
        SELECT
          dsi.*,
          i.name as item_name,
          i.effect as item_description,
          i.icon as item_image,
          i.rarity as item_rarity,
          i.category as item_type,
          COALESCE(dsi.max_quantity, 1) as max_quantity
        FROM daily_shop_items dsi
        LEFT JOIN items i ON i.name = dsi.item_id
        WHERE dsi.shop_id = $1 AND dsi.date = $2
      `;

      const result = await pool.query(query, [shopId, date]);

      // Process each item to include remaining quantities
      const itemsWithQuantities = await Promise.all(
        result.rows.map(async (item) => {
          const remainingQuantity = await this.getRemainingQuantity(
            playerId,
            shopId,
            item.item_id,
            date
          );

          const maxQuantity = parseInt(item.max_quantity) || 1;

          return {
            ...item,
            remaining: remainingQuantity,
            remaining_quantity: remainingQuantity,
            purchaseLimit: maxQuantity,
            max_quantity: maxQuantity,
            canPurchase: remainingQuantity > 0
          };
        })
      );

      return itemsWithQuantities;
    } catch (error) {
      console.error('Error getting shop items:', error);
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
  static async getShopItem(shopId, itemId, date = null, playerId = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Getting shop item ${itemId} from ${shopId} on ${targetDate}${playerId ? ` for player ${playerId}` : ''}`);

      const query = `
        SELECT
          dsi.*,
          i.name as item_name,
          i.effect as item_description,
          i.icon as item_image,
          i.rarity as item_rarity,
          i.category as item_type,
          dsi.max_quantity
        FROM daily_shop_items dsi
        LEFT JOIN items i ON i.name = dsi.item_id
        WHERE dsi.shop_id = $1
        AND dsi.item_id = $2
        AND dsi.date = $3
      `;

      const result = await pool.query(query, [shopId, itemId, targetDate]);

      if (result.rows.length === 0) return null;

      const item = result.rows[0];

      // If no player ID is provided, use the max_quantity as the remaining quantity
      if (!playerId) {
        const purchaseLimit = parseInt(item.max_quantity) || 1;
        return {
          ...item,
          remaining: purchaseLimit,
          remaining_quantity: purchaseLimit,
          purchaseLimit: purchaseLimit,
          max_quantity: purchaseLimit, // Ensure max_quantity is set
          canPurchase: true
        };
      }

      // Get player-specific remaining quantity
      const remainingQuantity = await this.getRemainingQuantity(
        playerId,
        shopId,
        itemId,
        targetDate
      );

      const purchaseLimit = parseInt(item.max_quantity) || 1;
      return {
        ...item,
        remaining: remainingQuantity,
        remaining_quantity: remainingQuantity,
        purchaseLimit: purchaseLimit,
        max_quantity: purchaseLimit, // Ensure max_quantity is set
        canPurchase: remainingQuantity > 0
      };
    } catch (error) {
      console.error('Error getting shop item:', error);
      return null;
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

  static async getRemainingQuantity(playerId, shopId, itemId, targetDate = null) {
    try {
      // If no date provided, use today
      const date = targetDate || new Date().toISOString().split('T')[0];

      // Get the max quantity for this item
      const maxQuery = `
        SELECT max_quantity
        FROM daily_shop_items
        WHERE shop_id = $1 AND item_id = $2 AND date = $3
      `;
      const maxResult = await pool.query(maxQuery, [shopId, itemId, date]);
      const maxQuantity = parseInt(maxResult.rows[0]?.max_quantity) || 1;

      // If no playerId provided, return max quantity
      if (!playerId) {
        return maxQuantity;
      }

      // Get number of purchases made by this player
      const purchaseQuery = `
        SELECT COALESCE(SUM(quantity), 0) as total_purchased
        FROM player_shop_purchases
        WHERE player_id = $1 AND shop_id = $2 AND item_id = $3 AND date = $4
      `;
      const purchaseResult = await pool.query(purchaseQuery, [playerId, shopId, itemId, date]);
      const purchasedQuantity = parseInt(purchaseResult.rows[0]?.total_purchased) || 0;

      // Calculate remaining quantity
      const remainingQuantity = Math.max(0, maxQuantity - purchasedQuantity);
      return remainingQuantity;

    } catch (error) {
      console.error('Error getting remaining quantity:', error);
      return 1; // Default to 1 if there's an error
    }
  }

  /**
   * Restock a shop with new items
   * @param {string} shopId - The shop ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} - True if successful
   */
  static async restockShop(shopId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Restocking shop ${shopId} for date ${targetDate}`);

      // Get shop configuration
      const shopConfigQuery = `
        SELECT * FROM shop_config WHERE shop_id = $1
      `;
      const shopConfigResult = await pool.query(shopConfigQuery, [shopId]);

      if (shopConfigResult.rows.length === 0) {
        console.log(`Shop ${shopId} not found`);
        return false;
      }

      const shop = shopConfigResult.rows[0];
      console.log(`Found shop configuration:`, shop);

      // Check if shop is active
      if (shop.is_active === false) {
        console.log(`Shop ${shopId} is not active, but proceeding with restock anyway`);
      }

      // Clear existing items for this shop and date
      const clearQuery = `DELETE FROM daily_shop_items WHERE shop_id = $1 AND date = $2`;
      await pool.query(clearQuery, [shopId, targetDate]);
      console.log(`Cleared existing items for shop ${shopId} on ${targetDate}`);

      // Get items based on shop's category
      const category = shop.category || 'ALL';
      console.log(`Shop category from database: ${category}`);

      // Normalize category for comparison (uppercase)
      let normalizedCategory = category.toUpperCase();

      // Special case for specific shops
      if (shopId === 'antique_shop') {
        normalizedCategory = 'ANTIQUES'; // Force ANTIQUES for antique_shop
      } else if (shopId === 'nursery') {
        normalizedCategory = 'EGGS'; // Force EGGS for nursery
      } else if (shopId === 'apothecary') {
        normalizedCategory = 'BERRIES'; // Keep BERRIES for apothecary
      } else if (shopId === 'bakery') {
        normalizedCategory = 'PASTRIES'; // Keep PASTRIES for bakery
      } else if (shopId === 'megamart') {
        // Megamart should include both ITEMS and HELDITEMS
        normalizedCategory = 'SPECIAL_MEGAMART'; // Special flag for megamart
      } else {
        // General normalization for other shops
        if (normalizedCategory === 'ANTIQUES') normalizedCategory = 'ANTIQUE';
        if (normalizedCategory === 'BALLS') normalizedCategory = 'BALL';
      }

      console.log(`Normalized category for ${shopId}: ${normalizedCategory}`);

      let itemsQuery;
      let queryParams = [];

      if (normalizedCategory === 'ALL') {
        // For 'ALL' category, get items from all categories
        itemsQuery = `SELECT * FROM items WHERE rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
      } else if (normalizedCategory === 'SPECIAL_MEGAMART') {
        // Special case for megamart - include both ITEMS and HELDITEMS
        itemsQuery = `SELECT * FROM items WHERE (UPPER(category) = 'ITEMS' OR UPPER(category) = 'HELDITEMS') AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
      } else {
        // For specific category, get items from that category (case-insensitive)
        itemsQuery = `SELECT * FROM items WHERE UPPER(category) = $1 AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
        queryParams = [normalizedCategory];
      }

      console.log(`Executing query: ${itemsQuery} with params:`, queryParams);
      const itemsResult = await pool.query(itemsQuery, queryParams);
      const items = itemsResult.rows;

      if (!items || items.length === 0) {
        console.log(`No items found for category ${normalizedCategory}`);

        // Try alternative approach if no items found
        if (shopId === 'antique_shop') {
          // We already tried ANTIQUES, so try ANTIQUE as a last resort
          console.log('Trying alternative category ANTIQUE for antique_shop');
          const alternativeQuery = `SELECT * FROM items WHERE UPPER(category) = 'ANTIQUE' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
          const alternativeResult = await pool.query(alternativeQuery);
          items = alternativeResult.rows;

          if (!items || items.length === 0) {
            console.log('No items found for alternative category ANTIQUE either');
            return false;
          }

          console.log(`Found ${items.length} items for alternative category ANTIQUE`);
        } else if (shopId === 'nursery') {
          // Try BERRIES as an alternative for nursery
          console.log('Trying alternative category BERRIES for nursery');
          const alternativeQuery = `SELECT * FROM items WHERE UPPER(category) = 'BERRIES' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
          const alternativeResult = await pool.query(alternativeQuery);
          items = alternativeResult.rows;

          if (!items || items.length === 0) {
            console.log('No items found for alternative category BERRIES either');
            return false;
          }

          console.log(`Found ${items.length} items for alternative category BERRIES`);
        } else if (shopId === 'apothecary') {
          // Try ITEMS as an alternative for apothecary
          console.log('Trying alternative category ITEMS for apothecary');
          const alternativeQuery = `SELECT * FROM items WHERE UPPER(category) = 'ITEMS' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
          const alternativeResult = await pool.query(alternativeQuery);
          items = alternativeResult.rows;

          if (!items || items.length === 0) {
            console.log('No items found for alternative category ITEMS either');
            return false;
          }

          console.log(`Found ${items.length} items for alternative category ITEMS`);
        } else if (shopId === 'bakery') {
          // Try ITEMS as an alternative for bakery
          console.log('Trying alternative category ITEMS for bakery');
          const alternativeQuery = `SELECT * FROM items WHERE UPPER(category) = 'ITEMS' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
          const alternativeResult = await pool.query(alternativeQuery);
          items = alternativeResult.rows;

          if (!items || items.length === 0) {
            console.log('No items found for alternative category ITEMS either');
            return false;
          }

          console.log(`Found ${items.length} items for alternative category ITEMS`);
        } else if (shopId === 'megamart') {
          // Try just ITEMS as an alternative for megamart
          console.log('Trying alternative category ITEMS for megamart');
          const alternativeQuery = `SELECT * FROM items WHERE UPPER(category) = 'ITEMS' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
          const alternativeResult = await pool.query(alternativeQuery);
          items = alternativeResult.rows;

          if (!items || items.length === 0) {
            console.log('No items found for alternative category ITEMS either, trying HELDITEMS');
            // Try HELDITEMS as a last resort
            const lastResortQuery = `SELECT * FROM items WHERE UPPER(category) = 'HELDITEMS' AND rarity != 'mythic' ORDER BY RANDOM() LIMIT 50`;
            const lastResortResult = await pool.query(lastResortQuery);
            items = lastResortResult.rows;

            if (!items || items.length === 0) {
              console.log('No items found for alternative category HELDITEMS either');
              return false;
            }
          }

          console.log(`Found ${items.length} items for alternative category`);
        } else {
          return false;
        }
      } else {
        console.log(`Found ${items.length} items for category ${normalizedCategory}`);
      }

      // Determine how many items to select
      const minItems = parseInt(shop.min_items) || 3;
      const maxItems = parseInt(shop.max_items) || 10;
      const itemCount = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;
      console.log(`Will select between ${minItems} and ${maxItems} items, chosen: ${itemCount}`);

      // Randomly select items
      const selectedItems = [];
      const selectedItemIds = new Set();

      // Shuffle the items array
      const shuffledItems = [...items].sort(() => 0.5 - Math.random());

      // Select items until we have enough or run out of items
      for (const item of shuffledItems) {
        if (selectedItems.length >= itemCount) break;
        if (selectedItemIds.has(item.name)) continue;

          // Calculate base price based on item name, or fallback to rarity
        let basePrice;
          if (ITEM_BASE_PRICES[item.name]) {
              // Use the predefined base price from our constants
              basePrice = ITEM_BASE_PRICES[item.name];
              console.log(`Using predefined base price for ${item.name}: ${basePrice}`);
          } else {
              // Fallback to rarity-based pricing if item not in our dictionary
              switch (item.rarity?.toLowerCase()) {
                  case 'common':
                      basePrice = 500;
                      break;
                  case 'uncommon':
                      basePrice = 1000;
                      break;
                  case 'rare':
                      basePrice = 2000;
                      break;
                  case 'epic':
                      basePrice = 4000;
                      break;
                  case 'legendary':
                      basePrice = 8000;
                      break;
                  default:
                      basePrice = 1000;
              }
              console.log(`Using fallback price for ${item.name}: ${basePrice}`);
        }

        // Apply shop multiplier
        const minMultiplier = parseFloat(shop.price_multiplier_min) || 0.8;
        const maxMultiplier = parseFloat(shop.price_multiplier_max) || 1.2;
        const multiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;

        // Calculate final price
        const price = Math.round(basePrice * multiplier);

        // Determine purchase limit based on rarity
        let purchaseLimit = 1; // Default to 1 to ensure it's never null
        switch (item.rarity?.toLowerCase()) {
          case 'common': purchaseLimit = 5; break;
          case 'uncommon': purchaseLimit = 3; break;
          case 'rare': purchaseLimit = 2; break;
          case 'epic': purchaseLimit = 1; break;
          case 'legendary': purchaseLimit = 1; break;
          default: purchaseLimit = 1;
        }

        // Add to selected items
        const itemToAdd = {
          item_id: item.name,
          price,
          max_quantity: purchaseLimit
        };
        console.log(`Adding item with max_quantity: ${itemToAdd.max_quantity}`);
        selectedItems.push(itemToAdd);
        selectedItemIds.add(item.name);
        console.log(`Selected item: ${item.name}, price: ${price}, max_quantity: ${purchaseLimit}`);
      }

      console.log(`Selected ${selectedItems.length} items for shop ${shopId}`);

      // Insert selected items into daily_shop_items
      for (const item of selectedItems) {
        const insertQuery = `
          INSERT INTO daily_shop_items (
            shop_id, item_id, price, max_quantity, date
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (shop_id, item_id, date) DO NOTHING
        `;

        const maxQuantity = item.max_quantity || 1; // Ensure max_quantity is never null
        console.log(`Inserting item ${item.item_id} with max_quantity: ${maxQuantity}`);

        await pool.query(insertQuery, [
          shopId,
          item.item_id,
          item.price,
          maxQuantity,
          targetDate
        ]);
        console.log(`Inserted item ${item.item_id} into shop ${shopId}`);
      }

      console.log(`Successfully restocked shop ${shopId} with ${selectedItems.length} items`);
      return true;
    } catch (error) {
      console.error(`Error restocking shop ${shopId}:`, error);
      return false;
    }
  }

  /**
   * Restock all shops
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} - True if successful
   */
  static async restockAllShops(date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Restocking all shops for date ${targetDate}`);

      // Force clear existing items for today to ensure fresh restock
      const clearQuery = `DELETE FROM daily_shop_items WHERE date = $1`;
      await pool.query(clearQuery, [targetDate]);
      console.log(`Cleared existing shop items for ${targetDate}`);

      // Get all shops (including inactive ones)
      const shopConfigQuery = `SELECT * FROM shop_config`;
      const shopConfigResult = await pool.query(shopConfigQuery);
      const shops = shopConfigResult.rows;

      console.log(`Found ${shops ? shops.length : 0} shops in total`);

      if (!shops || shops.length === 0) {
        console.log('No shops found');
        return false;
      }

      // Restock each shop
      for (const shop of shops) {
        console.log(`Restocking shop ${shop.shop_id} (${shop.name})...`);
        const result = await this.restockShop(shop.shop_id, targetDate);
        console.log(`Restock result for ${shop.shop_id}: ${result ? 'Success' : 'Failed'}`);
      }

      return true;
    } catch (error) {
      console.error('Error restocking all shops:', error);
      return false;
    }
  }

  /**
   * Remove an item from a shop
   * @param {string} shopId - The shop ID
   * @param {string} itemId - The item ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} - True if successful
   */
  static async removeItem(shopId, itemId, date = null) {
    try {
      // If no date is provided, use today
      const targetDate = date || new Date().toISOString().split('T')[0];
      console.log(`Removing item ${itemId} from shop ${shopId} for date ${targetDate}`);

      // Delete the item from the shop
      const deleteQuery = `
        DELETE FROM daily_shop_items
        WHERE shop_id = $1 AND item_id = $2 AND date = $3
        RETURNING *
      `;

      const result = await pool.query(deleteQuery, [shopId, itemId, targetDate]);

      if (result.rows.length === 0) {
        console.log(`Item ${itemId} not found in shop ${shopId} on ${targetDate}`);
        return false;
      }

      console.log(`Successfully removed item ${itemId} from shop ${shopId} on ${targetDate}`);
      return true;
    } catch (error) {
      console.error(`Error removing item ${itemId} from shop ${shopId}:`, error);
      return false;
    }
  }
}

module.exports = DailyShopItems;
