const db = require('../config/db');

/**
 * Shop model
 */
class Shop {
  /**
   * Get all shops
   * @returns {Promise<Array>} Array of shops
   */
  static async getAll() {
    try {
      const query = 'SELECT * FROM shops ORDER BY name ASC';
      const shops = await db.asyncAll(query);
      return shops;
    } catch (error) {
      console.error('Error getting all shops:', error);
      throw error;
    }
  }

  /**
   * Get all active shops
   * @returns {Promise<Array>} Array of active shops
   */
  static async getAllActive() {
    try {
      const query = 'SELECT * FROM shops WHERE is_active = 1 ORDER BY name ASC';
      const shops = await db.asyncAll(query);
      return shops;
    } catch (error) {
      console.error('Error getting active shops:', error);
      throw error;
    }
  }

  /**
   * Get shop by ID
   * @param {string} shopId Shop ID
   * @returns {Promise<Object>} Shop object
   */
  static async getById(shopId) {
    try {
      const query = 'SELECT * FROM shops WHERE shop_id = $1';
      const shop = await db.asyncGet(query, [shopId]);
      return shop;
    } catch (error) {
      console.error(`Error getting shop with ID ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new shop
   * @param {Object} shop Shop data
   * @returns {Promise<Object>} Created shop
   */
  static async create(shop) {
    try {
      const query = `
        INSERT INTO shops (
          shop_id, name, description, flavor_text, banner_image, 
          category, price_modifier, is_constant, is_active, visibility_condition
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        shop.shop_id,
        shop.name,
        shop.description,
        shop.flavor_text,
        shop.banner_image,
        shop.category,
        shop.price_modifier || 1.0,
        shop.is_constant !== undefined ? shop.is_constant : 1,
        shop.is_active !== undefined ? shop.is_active : 1,
        shop.visibility_condition
      ];

      const result = await db.asyncRun(query, params);
      return { id: result.lastID, ...shop };
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  }

  /**
   * Update a shop
   * @param {string} shopId Shop ID
   * @param {Object} shop Shop data
   * @returns {Promise<Object>} Updated shop
   */
  static async update(shopId, shop) {
    try {
      const query = `
        UPDATE shops SET
          name = ?, description = ?, flavor_text = ?, banner_image = ?,
          category = ?, price_modifier = ?, is_constant = ?, is_active = ?,
          visibility_condition = ?, updated_at = CURRENT_TIMESTAMP
        WHERE shop_id = $11
      `;

      const params = [
        shop.name,
        shop.description,
        shop.flavor_text,
        shop.banner_image,
        shop.category,
        shop.price_modifier || 1.0,
        shop.is_constant !== undefined ? shop.is_constant : 1,
        shop.is_active !== undefined ? shop.is_active : 1,
        shop.visibility_condition,
        shopId
      ];

      await db.asyncRun(query, params);
      return { shop_id: shopId, ...shop };
    } catch (error) {
      console.error(`Error updating shop with ID ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a shop
   * @param {string} shopId Shop ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(shopId) {
    try {
      const query = 'DELETE FROM shops WHERE shop_id = $1';
      await db.asyncRun(query, [shopId]);
      return true;
    } catch (error) {
      console.error(`Error deleting shop with ID ${shopId}:`, error);
      throw error;
    }
  }

  /**
   * Get visible shops for a user
   * @param {number} userId User ID
   * @returns {Promise<Array>} Array of visible shops
   */
  static async getVisibleShops(userId) {
    try {
      // Get all active shops
      const shops = await this.getAllActive();
      
      // Filter shops based on visibility conditions
      const visibleShops = shops.filter(shop => {
        // If shop is constant, it's always visible
        if (shop.is_constant === 1) {
          return true;
        }
        
        // Parse visibility condition
        if (shop.visibility_condition) {
          try {
            const condition = JSON.parse(shop.visibility_condition);
            
            // Check day of week condition
            if (condition.days_of_week) {
              const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
              if (!condition.days_of_week.includes(today)) {
                return false;
              }
            }
            
            // Check date range condition
            if (condition.start_date && condition.end_date) {
              const now = new Date();
              const startDate = new Date(condition.start_date);
              const endDate = new Date(condition.end_date);
              if (now < startDate || now > endDate) {
                return false;
              }
            }
            
            // Check random chance condition
            if (condition.random_chance) {
              // Use user ID and current date to create a deterministic random value
              const dateStr = new Date().toISOString().split('T')[0];
              const seed = `${userId}-${shop.shop_id}-${dateStr}`;
              const hash = this._hashString(seed);
              const randomValue = hash / Number.MAX_SAFE_INTEGER;
              
              if (randomValue > condition.random_chance) {
                return false;
              }
            }
            
            // Check manual enable condition
            if (condition.manually_enabled === false) {
              return false;
            }
          } catch (e) {
            console.error(`Error parsing visibility condition for shop ${shop.shop_id}:`, e);
            return true; // Default to visible if parsing fails
          }
        }
        
        return true;
      });
      
      return visibleShops;
    } catch (error) {
      console.error('Error getting visible shops:', error);
      throw error;
    }
  }
  
  /**
   * Simple hash function for deterministic randomness
   * @param {string} str String to hash
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
    return Math.abs(hash);
  }
}

module.exports = Shop;
