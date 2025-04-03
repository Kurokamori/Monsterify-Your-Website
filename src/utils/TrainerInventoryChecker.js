const Trainer = require('../models/Trainer');

class TrainerInventoryChecker {
  /**
   * Check if a trainer has a Daycare Daypass
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Object with hasDaypass and daypassCount properties
   */
  static async checkDaycareDaypass(trainerId) {
    try {
      // Get trainer's inventory
      const inventory = await Trainer.getInventory(trainerId);
      
      // Default values
      let hasDaypass = false;
      let daypassCount = 0;

      // Check if inventory exists and has items
      if (inventory && inventory.inv_items) {
        // Parse the inventory items if needed
        let itemsInventory = {};

        if (typeof inventory.inv_items === 'string') {
          try {
            itemsInventory = JSON.parse(inventory.inv_items);
          } catch (e) {
            console.error('Error parsing inventory items:', e);
            itemsInventory = {};
          }
        } else {
          itemsInventory = inventory.inv_items;
        }

        // Get the daypass count
        daypassCount = itemsInventory['Daycare Daypass'] || 0;
        hasDaypass = daypassCount > 0;
      }

      return {
        hasDaypass,
        daypassCount
      };
    } catch (error) {
      console.error('Error checking daycare daypass:', error);
      return {
        hasDaypass: false,
        daypassCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get all adoption-related items for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} - Object with adoption-related items
   */
  static async getAdoptionItems(trainerId) {
    try {
      // Get trainer's inventory
      const inventory = await Trainer.getInventory(trainerId);
      
      // Default values
      const adoptionItems = {
        daycareDaypass: 0
      };

      // Check if inventory exists and has items
      if (inventory && inventory.inv_items) {
        // Parse the inventory items if needed
        let itemsInventory = {};

        if (typeof inventory.inv_items === 'string') {
          try {
            itemsInventory = JSON.parse(inventory.inv_items);
          } catch (e) {
            console.error('Error parsing inventory items:', e);
            itemsInventory = {};
          }
        } else {
          itemsInventory = inventory.inv_items;
        }

        // Get the daypass count
        adoptionItems.daycareDaypass = itemsInventory['Daycare Daypass'] || 0;
      }

      return adoptionItems;
    } catch (error) {
      console.error('Error getting adoption items:', error);
      return {
        daycareDaypass: 0,
        error: error.message
      };
    }
  }
}

module.exports = TrainerInventoryChecker;
