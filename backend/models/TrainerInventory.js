const db = require('../config/db');

/**
 * TrainerInventory model
 */
class TrainerInventory {
  /**
   * Get inventory by trainer ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Inventory object
   */
  static async getByTrainerId(trainerId) {
    try {
      console.log(`Getting inventory for trainer ${trainerId}`);

      // First check if the trainer exists
      const trainerQuery = db.isPostgreSQL ? 'SELECT id FROM trainers WHERE id = $1' : 'SELECT id FROM trainers WHERE id = ?';
      const trainer = await db.asyncGet(trainerQuery, [trainerId]);

      if (!trainer) {
        console.log(`Trainer with ID ${trainerId} does not exist`);
        return null;
      }

      const query = db.isPostgreSQL ? 'SELECT * FROM trainer_inventory WHERE trainer_id = $1' : 'SELECT * FROM trainer_inventory WHERE trainer_id = ?';
      const inventory = await db.asyncGet(query, [trainerId]);

      if (!inventory) {
        // Create a new inventory for the trainer
        console.log(`No inventory found for trainer ${trainerId}, creating a new one`);
        return await this.createInventory(trainerId);
      }

      console.log(`Raw inventory for trainer ${trainerId}:`, inventory);

      // Parse JSON fields
      const parsedInventory = { ...inventory };
      const jsonFields = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

      jsonFields.forEach(field => {
        if (parsedInventory[field]) {
          try {
            if (typeof parsedInventory[field] === 'string') {
              parsedInventory[field] = JSON.parse(parsedInventory[field]);
              console.log(`Parsed ${field} for trainer ${trainerId}:`, parsedInventory[field]);
            }
          } catch (e) {
            console.error(`Error parsing ${field} for trainer ${trainerId}:`, e);
            parsedInventory[field] = {};
          }
        } else {
          parsedInventory[field] = {};
        }
      });

      console.log(`Parsed inventory for trainer ${trainerId}:`, parsedInventory);
      return parsedInventory;
    } catch (error) {
      console.error(`Error getting inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new inventory for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - New inventory object
   */
  static async createInventory(trainerId) {
    try {
      console.log(`Creating new inventory for trainer ${trainerId}`);

      // Create empty inventory
      const query = db.isPostgreSQL ? 'INSERT INTO trainer_inventory (trainer_id) VALUES ($1)' : 'INSERT INTO trainer_inventory (trainer_id) VALUES (?)';
      const result = await db.asyncRun(query, [trainerId]);

      if (!result || !result.lastID) {
        throw new Error(`Failed to create inventory for trainer ${trainerId}`);
      }

      console.log(`Created inventory with ID ${result.lastID} for trainer ${trainerId}`);

      // Return the new inventory
      const newInventory = {
        id: result.lastID,
        trainer_id: trainerId,
        items: {},
        balls: {},
        berries: {},
        pastries: {},
        evolution: {},
        eggs: {},
        antiques: {},
        helditems: {},
        seals: {},
        keyitems: {}
      };

      return newInventory;
    } catch (error) {
      console.error(`Error creating inventory for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Get item by trainer ID and item name
   * @param {number} trainerId - Trainer ID
   * @param {string} itemName - Item name
   * @returns {Promise<Object|null>} - Item object or null if not found
   */
  static async getItemByTrainerAndName(trainerId, itemName) {
    try {
      const inventory = await this.getByTrainerId(trainerId);
      if (!inventory) {
        return null;
      }

      // Check all inventory categories for the item
      const categories = ['items', 'berries', 'pastries', 'balls', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

      for (const category of categories) {
        const items = inventory[category] || {};
        if (items[itemName]) {
          return {
            id: inventory.id,
            trainerId: inventory.trainer_id,
            category,
            name: itemName,
            quantity: items[itemName]
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting item ${itemName} for trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Update item quantity
   * @param {number} inventoryId - Inventory ID
   * @param {string} category - Item category
   * @param {string} itemName - Item name
   * @param {number} quantity - New quantity
   * @returns {Promise<boolean>} - Success status
   */
  static async updateItemQuantity(inventoryId, category, itemName, quantity) {
    try {
      // Get inventory
      const query = db.isPostgreSQL ? 'SELECT * FROM trainer_inventory WHERE id = $1' : 'SELECT * FROM trainer_inventory WHERE id = ?';
      const inventory = await db.asyncGet(query, [inventoryId]);

      if (!inventory) {
        return false;
      }

      // Parse JSON field
      let items = {};
      try {
        items = JSON.parse(inventory[category] || '{}');
      } catch (e) {
        items = {};
      }

      // Update quantity
      if (quantity <= 0) {
        delete items[itemName];
      } else {
        items[itemName] = quantity;
      }

      // Update inventory
      const updateQuery = db.isPostgreSQL ? 
        `UPDATE trainer_inventory SET ${category} = $1 WHERE id = $2` :
        `UPDATE trainer_inventory SET ${category} = ? WHERE id = ?`;
      await db.asyncRun(updateQuery, [JSON.stringify(items), inventoryId]);

      return true;
    } catch (error) {
      console.error(`Error updating item ${itemName} quantity for inventory ${inventoryId}:`, error);
      throw error;
    }
  }

  /**
   * Update quantity directly
   * @param {number} inventoryId - Inventory ID
   * @param {number} quantity - New quantity
   * @returns {Promise<boolean>} - Success status
   */
  static async updateQuantity(inventoryId, quantity) {
    try {
      // Get inventory item
      const query = db.isPostgreSQL ? 'SELECT * FROM trainer_inventory WHERE id = $1' : 'SELECT * FROM trainer_inventory WHERE id = ?';
      const inventory = await db.asyncGet(query, [inventoryId]);

      if (!inventory) {
        return false;
      }

      // Find the category and item name
      const categories = ['items', 'berries', 'pastries', 'balls', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];

      for (const category of categories) {
        try {
          const items = JSON.parse(inventory[category] || '{}');
          for (const itemName in items) {
            // Update the first item found (this is a simplified approach)
            return await this.updateItemQuantity(inventoryId, category, itemName, quantity);
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }

      return false;
    } catch (error) {
      console.error(`Error updating quantity for inventory ${inventoryId}:`, error);
      throw error;
    }
  }

  /**
   * Update entire category with new items object
   * @param {number} inventoryId - Inventory ID
   * @param {string} category - Item category
   * @param {Object} items - Items object to set for the category
   * @returns {Promise<boolean>} - Success status
   */
  static async updateCategory(inventoryId, category, items) {
    try {
      // Validate category
      const validCategories = ['items', 'balls', 'berries', 'pastries', 'evolution', 'eggs', 'antiques', 'helditems', 'seals', 'keyitems'];
      if (!validCategories.includes(category)) {
        throw new Error(`Invalid inventory category: ${category}`);
      }

      // Update inventory
      const updateQuery = db.isPostgreSQL ?
        `UPDATE trainer_inventory SET ${category} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2` :
        `UPDATE trainer_inventory SET ${category} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await db.asyncRun(updateQuery, [JSON.stringify(items), inventoryId]);

      return true;
    } catch (error) {
      console.error(`Error updating category ${category} for inventory ${inventoryId}:`, error);
      throw error;
    }
  }

  /**
   * Add item to inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} category - Item category
   * @param {string} itemName - Item name
   * @param {number} quantity - Quantity to add
   * @returns {Promise<boolean>} - Success status
   */
  static async addItem(trainerId, category, itemName, quantity) {
    try {
      // Get inventory
      const inventory = await this.getByTrainerId(trainerId);
      if (!inventory) {
        return false;
      }

      // Get current quantity
      const items = inventory[category] || {};
      const currentQuantity = items[itemName] || 0;
      const newQuantity = currentQuantity + quantity;

      // Update inventory
      return await this.updateItemQuantity(inventory.id, category, itemName, newQuantity);
    } catch (error) {
      console.error(`Error adding item ${itemName} to trainer ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Remove item from inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} category - Item category
   * @param {string} itemName - Item name
   * @param {number} quantity - Quantity to remove
   * @returns {Promise<boolean>} - Success status
   */
  static async removeItem(trainerId, category, itemName, quantity) {
    try {
      console.log(`TrainerInventory.removeItem called: trainerId=${trainerId}, category=${category}, itemName=${itemName}, quantity=${quantity}`);
      
      // Get inventory
      const inventory = await this.getByTrainerId(trainerId);
      if (!inventory) {
        console.log(`No inventory found for trainer ${trainerId}`);
        return false;
      }

      // Get current quantity
      const items = inventory[category] || {};
      const currentQuantity = items[itemName] || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);

      console.log(`Current quantity of ${itemName}: ${currentQuantity}, new quantity: ${newQuantity}`);

      // Update inventory
      const result = await this.updateItemQuantity(inventory.id, category, itemName, newQuantity);
      console.log(`TrainerInventory.removeItem result: ${result}`);
      return result;
    } catch (error) {
      console.error(`Error removing item ${itemName} from trainer ${trainerId}:`, error);
      throw error;
    }
  }
}

module.exports = TrainerInventory;
