const db = require('../config/db');

class FactionStore {
  /**
   * Get all items in a faction's store
   * @param {number} factionId - Faction ID
   * @param {number} trainerId - Trainer ID (for standing requirements)
   * @returns {Promise<Array>} Array of store items
   */
  static async getStoreItems(factionId, trainerId = null) {
    try {
      let query = `
        SELECT fs.*, f.name as faction_name
        FROM faction_stores fs
        JOIN factions f ON fs.faction_id = f.id
        WHERE fs.faction_id = $1 AND fs.is_active = 1
      `;
      
      const params = [factionId];
      
      // If trainer ID is provided, check standing requirements
      if (trainerId) {
        query += `
          AND fs.standing_requirement <= COALESCE(
            (SELECT standing FROM faction_standings WHERE trainer_id = $2 AND faction_id = $3), 0
          )
        `;
        params.push(trainerId, factionId);
      }
      
      query += ' ORDER BY fs.standing_requirement ASC, fs.price ASC';
      
      return await db.asyncAll(query, params);
    } catch (error) {
      console.error('Error getting faction store items:', error);
      throw error;
    }
  }

  /**
   * Get a specific store item
   * @param {number} itemId - Store item ID
   * @returns {Promise<Object|null>} Store item or null if not found
   */
  static async getStoreItem(itemId) {
    try {
      const query = `
        SELECT fs.*, f.name as faction_name
        FROM faction_stores fs
        JOIN factions f ON fs.faction_id = f.id
        WHERE fs.id = $1
      `;
      return await db.asyncGet(query, [itemId]);
    } catch (error) {
      console.error('Error getting store item:', error);
      throw error;
    }
  }

  /**
   * Purchase an item from a faction store
   * @param {number} trainerId - Trainer ID
   * @param {number} itemId - Store item ID
   * @param {number} quantity - Quantity to purchase
   * @returns {Promise<Object>} Purchase result
   */
  static async purchaseItem(trainerId, itemId, quantity = 1) {
    try {
      // Get store item details
      const storeItem = await this.getStoreItem(itemId);
      if (!storeItem) {
        throw new Error('Store item not found');
      }

      // Check if item is active
      if (!storeItem.is_active) {
        throw new Error('Item is not available for purchase');
      }

      // Check stock if limited
      if (storeItem.stock_quantity !== -1 && storeItem.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      // Get trainer's standing with the faction
      const standingQuery = `
        SELECT standing FROM faction_standings 
        WHERE trainer_id = $1 AND faction_id = $2
      `;
      const standing = await db.asyncGet(standingQuery, [trainerId, storeItem.faction_id]);
      const trainerStanding = standing ? standing.standing : 0;

      // Check standing requirement
      if (trainerStanding < storeItem.standing_requirement) {
        throw new Error('Insufficient standing with faction');
      }

      // Get trainer's currency
      const trainerQuery = 'SELECT currency_amount FROM trainers WHERE id = $1';
      const trainer = await db.asyncGet(trainerQuery, [trainerId]);
      if (!trainer) {
        throw new Error('Trainer not found');
      }

      const totalCost = storeItem.price * quantity;

      // Check if trainer has enough currency
      if (trainer.currency_amount < totalCost) {
        throw new Error('Insufficient currency');
      }

      // Deduct currency from trainer
      await db.asyncRun(
        'UPDATE trainers SET currency_amount = currency_amount - $1 WHERE id = $2',
        [totalCost, trainerId]
      );

      // Add item to trainer's inventory
      await this.addItemToInventory(trainerId, storeItem, quantity);

      // Update stock if limited
      if (storeItem.stock_quantity !== -1) {
        await db.asyncRun(
          'UPDATE faction_stores SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [quantity, itemId]
        );
      }

      return {
        success: true,
        item: storeItem,
        quantity: quantity,
        totalCost: totalCost,
        remainingCurrency: trainer.currency_amount - totalCost
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  /**
   * Add purchased item to trainer's inventory
   * @param {number} trainerId - Trainer ID
   * @param {Object} storeItem - Store item details
   * @param {number} quantity - Quantity purchased
   * @returns {Promise<void>}
   */
  static async addItemToInventory(trainerId, storeItem, quantity) {
    try {
      // Get trainer's current inventory
      const inventoryQuery = `
        SELECT * FROM trainer_inventory WHERE trainer_id = $1
      `;
      let inventory = await db.asyncGet(inventoryQuery, [trainerId]);

      if (!inventory) {
        // Create new inventory record
        await db.asyncRun(
          `INSERT INTO trainer_inventory (trainer_id, ${storeItem.item_type})
           VALUES ($1, $2)`,
          [trainerId, JSON.stringify({ [storeItem.item_name]: quantity })]
        );
      } else {
        // Update existing inventory
        let categoryItems = {};
        try {
          categoryItems = JSON.parse(inventory[storeItem.item_type] || '{}');
        } catch (e) {
          categoryItems = {};
        }

        // Add the new item
        categoryItems[storeItem.item_name] = (categoryItems[storeItem.item_name] || 0) + quantity;

        // Update the inventory
        await db.asyncRun(
          `UPDATE trainer_inventory 
           SET ${storeItem.item_type} = $1, updated_at = CURRENT_TIMESTAMP
           WHERE trainer_id = $2`,
          [JSON.stringify(categoryItems), trainerId]
        );
      }
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      throw error;
    }
  }

  /**
   * Create a new store item
   * @param {Object} itemData - Store item data
   * @returns {Promise<Object>} Created store item
   */
  static async createStoreItem(itemData) {
    try {
      const {
        faction_id,
        item_name,
        item_description,
        item_type,
        price,
        currency_type = 'currency',
        standing_requirement = 0,
        stock_quantity = -1
      } = itemData;

      const query = `
        INSERT INTO faction_stores 
        (faction_id, item_name, item_description, item_type, price, currency_type, standing_requirement, stock_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const result = await db.asyncRun(query, [
        faction_id, item_name, item_description, item_type, price, 
        currency_type, standing_requirement, stock_quantity
      ]);

      return await this.getStoreItem(result.lastID);
    } catch (error) {
      console.error('Error creating store item:', error);
      throw error;
    }
  }

  /**
   * Update a store item
   * @param {number} itemId - Store item ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated store item
   */
  static async updateStoreItem(itemId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = $1`).join(', ');

      const query = `UPDATE faction_stores SET ${setClause} WHERE id = $2`;
      await db.asyncRun(query, [...values, itemId]);

      return await this.getStoreItem(itemId);
    } catch (error) {
      console.error('Error updating store item:', error);
      throw error;
    }
  }

  /**
   * Delete a store item
   * @param {number} itemId - Store item ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteStoreItem(itemId) {
    try {
      const query = 'DELETE FROM faction_stores WHERE id = $1';
      const result = await db.asyncRun(query, [itemId]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting store item:', error);
      throw error;
    }
  }
}

module.exports = FactionStore;
