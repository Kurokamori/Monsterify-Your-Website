/**
 * Item Service
 * Handles item-related functionality
 */

const pool = require('../db');
const Item = require('../models/Item');

class ItemService {
  /**
   * Get a random item from a specific category
   * @param {string} category - The item category
   * @returns {Promise<Object|null>} - A random item from the category or null if none found
   */
  static async getRandomItemFromCategory(category) {
    try {
      // Get all items in the category
      const items = await Item.getByCategory(category);
      
      // If no items found, return null
      if (!items || items.length === 0) {
        console.log(`No items found in category: ${category}`);
        return null;
      }
      
      // Select a random item from the category
      const randomIndex = Math.floor(Math.random() * items.length);
      return items[randomIndex];
    } catch (error) {
      console.error(`Error getting random item from category ${category}:`, error);
      return null;
    }
  }

  /**
   * Add an item to a trainer's inventory
   * @param {number} trainerId - The trainer ID
   * @param {string} itemName - The item name
   * @param {number} quantity - The quantity to add
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  static async addItemToTrainer(trainerId, itemName, quantity = 1) {
    try {
      // Check if the trainer already has this item
      const checkQuery = `
        SELECT * FROM trainer_inventory 
        WHERE trainer_id = $1 AND item_name = $2
      `;
      const checkResult = await pool.query(checkQuery, [trainerId, itemName]);
      
      if (checkResult.rows.length > 0) {
        // Update existing inventory entry
        const updateQuery = `
          UPDATE trainer_inventory 
          SET quantity = quantity + $1 
          WHERE trainer_id = $2 AND item_name = $3
          RETURNING *
        `;
        await pool.query(updateQuery, [quantity, trainerId, itemName]);
      } else {
        // Create new inventory entry
        const insertQuery = `
          INSERT INTO trainer_inventory (trainer_id, item_name, quantity) 
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        await pool.query(insertQuery, [trainerId, itemName, quantity]);
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding item ${itemName} to trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Remove an item from a trainer's inventory
   * @param {number} trainerId - The trainer ID
   * @param {string} itemName - The item name
   * @param {number} quantity - The quantity to remove
   * @returns {Promise<boolean>} - True if successful, false otherwise
   */
  static async removeItemFromTrainer(trainerId, itemName, quantity = 1) {
    try {
      // Check if the trainer has this item
      const checkQuery = `
        SELECT * FROM trainer_inventory 
        WHERE trainer_id = $1 AND item_name = $2
      `;
      const checkResult = await pool.query(checkQuery, [trainerId, itemName]);
      
      if (checkResult.rows.length === 0) {
        // Trainer doesn't have this item
        return false;
      }
      
      const currentQuantity = checkResult.rows[0].quantity;
      
      if (currentQuantity <= quantity) {
        // Remove the item entirely
        const deleteQuery = `
          DELETE FROM trainer_inventory 
          WHERE trainer_id = $1 AND item_name = $2
          RETURNING *
        `;
        await pool.query(deleteQuery, [trainerId, itemName]);
      } else {
        // Reduce the quantity
        const updateQuery = `
          UPDATE trainer_inventory 
          SET quantity = quantity - $1 
          WHERE trainer_id = $2 AND item_name = $3
          RETURNING *
        `;
        await pool.query(updateQuery, [quantity, trainerId, itemName]);
      }
      
      return true;
    } catch (error) {
      console.error(`Error removing item ${itemName} from trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Check if a trainer has a specific item
   * @param {number} trainerId - The trainer ID
   * @param {string} itemName - The item name
   * @param {number} quantity - The minimum quantity required
   * @returns {Promise<boolean>} - True if the trainer has the item, false otherwise
   */
  static async trainerHasItem(trainerId, itemName, quantity = 1) {
    try {
      const query = `
        SELECT quantity FROM trainer_inventory 
        WHERE trainer_id = $1 AND item_name = $2
      `;
      const result = await pool.query(query, [trainerId, itemName]);
      
      if (result.rows.length === 0) {
        return false;
      }
      
      return result.rows[0].quantity >= quantity;
    } catch (error) {
      console.error(`Error checking if trainer ${trainerId} has item ${itemName}:`, error);
      return false;
    }
  }

  /**
   * Get all items in a trainer's inventory
   * @param {number} trainerId - The trainer ID
   * @returns {Promise<Array>} - Array of inventory items
   */
  static async getTrainerInventory(trainerId) {
    try {
      const query = `
        SELECT ti.item_name, ti.quantity, i.category, i.effect, i.rarity, i.icon
        FROM trainer_inventory ti
        LEFT JOIN items i ON ti.item_name = i.name
        WHERE ti.trainer_id = $1
        ORDER BY i.category, i.name
      `;
      const result = await pool.query(query, [trainerId]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting inventory for trainer ${trainerId}:`, error);
      return [];
    }
  }

  /**
   * Create the trainer_inventory table if it doesn't exist
   * @returns {Promise<void>}
   */
  static async createInventoryTableIfNotExists() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS trainer_inventory (
          id SERIAL PRIMARY KEY,
          trainer_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(trainer_id, item_name)
        )
      `;
      await pool.query(query);
      console.log('Trainer inventory table created or already exists');
    } catch (error) {
      console.error('Error creating trainer inventory table:', error);
    }
  }
}

module.exports = ItemService;
