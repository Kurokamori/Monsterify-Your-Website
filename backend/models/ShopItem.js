const db = require('../config/db');
const Item = require('./Item');

/**
 * ShopItem model
 */
class ShopItem {
  /**
   * Get all items for a shop
   * @param {string} shopId Shop ID
   * @param {string} date Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of shop items
   */
  static async getByShopId(shopId, date = null) {
    try {
      // Use current date if not provided
      const targetDate = date || new Date().toISOString().split('T')[0];

      // First, get the shop to check if it's a constant shop
      const Shop = require('./Shop');
      const shop = await Shop.getById(shopId);

      if (!shop) {
        throw new Error(`Shop with ID ${shopId} not found`);
      }

      // If it's a constant shop, return all items in its category
      if (shop.is_constant === 1) {
        // Get all items in the shop's category
        const Item = require('./Item');
        const categoryItems = await Item.getByCategory(shop.category);

        // Format items to match the expected structure
        return categoryItems.map(item => ({
          shop_id: shopId,
          item_id: item.id,
          price: this._calculateDailyPrice(item.base_price, shop.price_modifier || 1.0, shopId, item.id, targetDate),
          max_quantity: 999,
          current_quantity: 999,
          date: targetDate,
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          category: item.category,
          type: item.type,
          rarity: item.rarity,
          effect: item.effect
        }));
      } else {
        // For non-constant shops, use the existing logic
        const query = `
          SELECT si.*, i.name, i.description, i.image_url, i.category, i.type, i.rarity, i.effect
          FROM shop_items si
          JOIN items i ON si.item_id = i.id
          WHERE si.shop_id = $1 AND si.date = $2
          ORDER BY i.name ASC
        `;

        const items = await db.asyncAll(query, [shopId, targetDate]);
        return items;
      }
    } catch (error) {
      console.error(`Error getting items for shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific item from a shop
   * @param {string} shopId Shop ID
   * @param {number} itemId Item ID
   * @param {string} date Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Shop item
   */
  static async getByShopAndItemId(shopId, itemId, date = null) {
    try {
      // Use current date if not provided
      const targetDate = date || new Date().toISOString().split('T')[0];

      // First, get the shop to check if it's a constant shop
      const Shop = require('./Shop');
      const shop = await Shop.getById(shopId);

      if (!shop) {
        throw new Error(`Shop with ID ${shopId} not found`);
      }

      // If it's a constant shop, get the item directly
      if (shop.is_constant === 1) {
        const Item = require('./Item');
        const item = await Item.getById(itemId);

        if (!item) {
          return null;
        }

        // Check if the item belongs to the shop's category
        if (item.category !== shop.category) {
          return null;
        }

        // Format item to match the expected structure
        return {
          id: null, // No actual shop_items entry
          shop_id: shopId,
          item_id: itemId,
          price: this._calculateDailyPrice(item.base_price, shop.price_modifier || 1.0, shopId, itemId, targetDate),
          max_quantity: 999,
          current_quantity: 999,
          date: targetDate,
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          category: item.category,
          type: item.type,
          rarity: item.rarity,
          effect: item.effect
        };
      } else {
        // For non-constant shops, use the existing logic
        const query = `
          SELECT si.*, i.name, i.description, i.image_url, i.category, i.type, i.rarity, i.effect
          FROM shop_items si
          JOIN items i ON si.item_id = i.id
          WHERE si.shop_id = $1 AND si.item_id = $2 AND si.date = $3
        `;

        const item = await db.asyncGet(query, [shopId, itemId, targetDate]);
        return item;
      }
    } catch (error) {
      console.error(`Error getting item ${itemId} from shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Add an item to a shop
   * @param {Object} shopItem Shop item data
   * @returns {Promise<Object>} Created shop item
   */
  static async add(shopItem) {
    try {
      // Use current date if not provided
      const targetDate = shopItem.date || new Date().toISOString().split('T')[0];

      const query = `
        INSERT INTO shop_items (
          shop_id, item_id, price, max_quantity, current_quantity, date
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const params = [
        shopItem.shop_id,
        shopItem.item_id,
        shopItem.price,
        shopItem.max_quantity || 999,
        shopItem.current_quantity || shopItem.max_quantity || 999,
        targetDate
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...shopItem, date: targetDate };
    } catch (error) {
      console.error('Error adding item to shop:', error);
      throw error;
    }
  }

  /**
   * Update a shop item
   * @param {number} id Shop item ID
   * @param {Object} shopItem Shop item data
   * @returns {Promise<Object>} Updated shop item
   */
  static async update(id, shopItem) {
    try {
      const query = `
        UPDATE shop_items SET
          price = $1, max_quantity = $2, current_quantity = $3
        WHERE id = $4
      `;

      const params = [
        shopItem.price,
        shopItem.max_quantity || 999,
        shopItem.current_quantity,
        id
      ];

      await db.asyncRun(query, params);
      return { id, ...shopItem };
    } catch (error) {
      console.error(`Error updating shop item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove an item from a shop
   * @param {number} id Shop item ID
   * @returns {Promise<boolean>} Success status
   */
  static async remove(id) {
    try {
      const query = 'DELETE FROM shop_items WHERE id = $1';
      await db.asyncRun(query, [id]);
      return true;
    } catch (error) {
      console.error(`Error removing shop item with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Stock a shop with items
   * @param {string} shopId Shop ID
   * @param {string} category Item category
   * @param {number} count Number of items to stock
   * @param {number} priceModifier Price modifier
   * @param {string} date Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Stocked items
   */
  static async stockShop(shopId, category, count, priceModifier = 1.0, date = null) {
    try {
      // Use current date if not provided
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get items by category
      let items;
      if (category === 'ALL') {
        const allItems = await Item.getAll();
        items = allItems.data || [];
      } else {
        items = await Item.getByCategory(category);
      }

      if (items.length === 0) {
        throw new Error(`No items found for category: ${category}`);
      }

      // Shuffle items
      const shuffledItems = [...items].sort(() => 0.5 - Math.random());

      // Select items
      const selectedItems = shuffledItems.slice(0, Math.min(count, shuffledItems.length));

      // Add items to shop
      const addedItems = [];
      for (const item of selectedItems) {
        // Calculate price with modifier and daily randomization
        const price = this._calculateDailyPrice(item.base_price, priceModifier, shopId, item.id, targetDate);

        // Set max quantity to 999 for all items
        const maxQuantity = 999;

        // Add item to shop
        const shopItem = await this.add({
          shop_id: shopId,
          item_id: item.id,
          price,
          max_quantity: maxQuantity,
          current_quantity: maxQuantity,
          date: targetDate
        });

        addedItems.push({
          ...shopItem,
          name: item.name,
          description: item.description,
          image_url: item.image_url,
          category: item.category,
          type: item.type,
          rarity: item.rarity,
          effect: item.effect
        });
      }

      return addedItems;
    } catch (error) {
      console.error(`Error stocking shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Purchase an item from a shop
   * @param {number} trainerId Trainer ID
   * @param {string} shopId Shop ID
   * @param {number} itemId Item ID
   * @param {number} quantity Quantity to purchase
   * @param {string} date Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Purchase result
   */
  static async purchase(trainerId, shopId, itemId, quantity, date = null) {
    try {
      // Use current date if not provided
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get shop details to check if it's a constant shop
      const Shop = require('./Shop');
      const shop = await Shop.getById(shopId);

      if (!shop) {
        throw new Error(`Shop with ID ${shopId} not found`);
      }

      // Get item details
      const item = await Item.getById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      let shopItem;
      let totalPrice;
      let newQuantity = 999; // Default for constant shops

      // For constant shops, we don't need to check or update quantity
      if (shop.is_constant === 1) {
        // Calculate price based on shop's price modifier and daily randomization
        const price = this._calculateDailyPrice(item.base_price, shop.price_modifier || 1.0, shopId, itemId, targetDate);
        totalPrice = price * quantity;

        // Create a virtual shop item for the response
        shopItem = {
          shop_id: shopId,
          item_id: itemId,
          price: price,
          max_quantity: 999,
          current_quantity: 999
        };
      } else {
        // For non-constant shops, use the existing logic
        shopItem = await this.getByShopAndItemId(shopId, itemId, targetDate);
        if (!shopItem) {
          throw new Error('Item not found in shop');
        }

        // Check if enough quantity is available
        if (shopItem.current_quantity < quantity) {
          throw new Error('Not enough items available');
        }

        // Calculate total price
        totalPrice = shopItem.price * quantity;

        // Update shop item quantity for non-constant shops
        newQuantity = shopItem.current_quantity - quantity;
      }

      // Start transaction
      await db.asyncRun('BEGIN TRANSACTION');

      try {
        // Only update shop item quantity for non-constant shops
        if (shop.is_constant !== 1 && shopItem.id) {
          await this.update(shopItem.id, {
            ...shopItem,
            current_quantity: newQuantity
          });
        }

        // Record purchase
        const purchaseQuery = `
          INSERT INTO shop_purchases (
            trainer_id, shop_id, item_id, quantity, price_paid
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        await db.asyncRun(purchaseQuery, [
          trainerId,
          shopId,
          itemId,
          quantity,
          totalPrice
        ]);

        // Update trainer inventory
        const Trainer = require('./Trainer');

        // Map item category to inventory field
        const categoryToInventory = {
          'berries': 'berries',
          'pastries': 'pastries',
          'evolution': 'evolution',
          'balls': 'balls',
          'antiques': 'antiques',
          'helditems': 'helditems',
          'eggs': 'eggs',
          'seals': 'seals',
          'keyitems': 'keyitems'
        };

        // Make sure item.category is a string and convert to lowercase
        const category = item.category ? item.category.toString().toLowerCase() : '';
        const inventoryField = categoryToInventory[category] || 'items';

        // Update trainer inventory
        await Trainer.updateInventoryItem(trainerId, inventoryField, item.name, quantity);

        // Update trainer currency
        await Trainer.updateCurrency(trainerId, -totalPrice);

        // Commit transaction
        await db.asyncRun('COMMIT');

        return {
          success: true,
          item: item.name,
          quantity,
          totalPrice,
          remainingQuantity: shop.is_constant === 1 ? 999 : newQuantity
        };
      } catch (error) {
        // Rollback transaction
        await db.asyncRun('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Error purchasing item ${itemId} from shop ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate daily randomized price for an item
   * @param {number} basePrice - Item's base price
   * @param {number} shopModifier - Shop's price modifier
   * @param {string} shopId - Shop ID
   * @param {number} itemId - Item ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {number} Randomized daily price
   * @private
   */
  static _calculateDailyPrice(basePrice, shopModifier, shopId, itemId, date) {
    // Create a deterministic seed based on shop, item, and date
    const seed = `${shopId}-${itemId}-${date}`;
    const hash = this._hashString(seed);
    
    // Convert hash to a value between 0 and 1
    const randomValue = (hash % 1000000) / 1000000;
    
    // Apply shop modifier to base price first
    const modifiedBasePrice = basePrice * shopModifier;
    
    // Determine price tier based on randomValue (5 equal probability tiers)
    let finalPrice;
    if (randomValue < 0.2) {
      // VERY CHEAP: 200-400
      finalPrice = 200 + Math.round((randomValue / 0.2) * 200);
    } else if (randomValue < 0.4) {
      // CHEAP: 400-1000
      finalPrice = 400 + Math.round(((randomValue - 0.2) / 0.2) * 600);
    } else if (randomValue < 0.6) {
      // MID-LOW: 1000-2000
      finalPrice = 1000 + Math.round(((randomValue - 0.4) / 0.2) * 1000);
    } else if (randomValue < 0.8) {
      // MID-HIGH: 2000-3000
      finalPrice = 2000 + Math.round(((randomValue - 0.6) / 0.2) * 1000);
    } else {
      // HIGH: 3000-5000
      finalPrice = 3000 + Math.round(((randomValue - 0.8) / 0.2) * 2000);
    }
    
    // Ensure minimum price of 1
    return Math.max(1, finalPrice);
  }

  /**
   * Simple hash function for deterministic randomness
   * @param {string} str - String to hash
   * @returns {number} Hash value
   * @private
   */
  static _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Apply additional mixing to increase variation between similar strings
    hash = hash ^ (hash >>> 16);
    hash = Math.imul(hash, 0x85ebca6b);
    hash = hash ^ (hash >>> 13);
    hash = Math.imul(hash, 0xc2b2ae35);
    hash = hash ^ (hash >>> 16);
    
    return Math.abs(hash);
  }
}

module.exports = ShopItem;
