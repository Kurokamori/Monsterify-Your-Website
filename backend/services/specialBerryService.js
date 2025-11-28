const TrainerInventory = require('../models/TrainerInventory');

/**
 * Service for managing special berries (forget-me-not and edenwiess)
 */
class SpecialBerryService {
  
  /**
   * Check if trainer has a specific special berry
   * @param {number} trainerId - Trainer ID
   * @param {string} berryName - Berry name ('Forget-Me-Not' or 'Edenwiess')
   * @returns {Promise<boolean>} Whether trainer has the berry
   */
  static async hasSpecialBerry(trainerId, berryName) {
    try {
      console.log(`Checking special berry ${berryName} for trainer ${trainerId}`);
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      if (!inventory || !inventory.berries) {
        console.log('No inventory or berries found');
        return false;
      }

      const berries = typeof inventory.berries === 'string'
        ? JSON.parse(inventory.berries)
        : inventory.berries;

      console.log('Available berries:', berries);

      // Check both possible casings
      const normalizedName = berryName === 'Forget-Me-Not' ? 'Forget-Me-Not' : berryName;
      const hasNormal = berries[berryName] && berries[berryName] > 0;
      const hasNormalized = berries[normalizedName] && berries[normalizedName] > 0;

      console.log(`Has ${berryName}: ${hasNormal}, Has ${normalizedName}: ${hasNormalized}`);

      return hasNormal || hasNormalized;
    } catch (error) {
      console.error(`Error checking special berry ${berryName} for trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Consume a special berry from trainer inventory
   * @param {number} trainerId - Trainer ID
   * @param {string} berryName - Berry name ('Forget-Me-Not' or 'Edenwiess')
   * @returns {Promise<boolean>} Whether berry was successfully consumed
   */
  static async consumeSpecialBerry(trainerId, berryName) {
    try {
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      if (!inventory || !inventory.berries) {
        return false;
      }

      const berries = typeof inventory.berries === 'string'
        ? JSON.parse(inventory.berries)
        : inventory.berries;

      // Check both possible casings and use the one that exists
      const normalizedName = berryName === 'Forget-Me-Not' ? 'Forget-Me-Not' : berryName;
      let actualBerryName = berryName;

      if (berries[berryName] && berries[berryName] > 0) {
        actualBerryName = berryName;
      } else if (berries[normalizedName] && berries[normalizedName] > 0) {
        actualBerryName = normalizedName;
      } else {
        return false;
      }

      // Consume one berry
      berries[actualBerryName] = berries[actualBerryName] - 1;

      // Update inventory
      await TrainerInventory.updateItemQuantity(inventory.id, 'berries', actualBerryName, berries[actualBerryName]);

      console.log(`Consumed 1 ${actualBerryName} from trainer ${trainerId}. Remaining: ${berries[actualBerryName]}`);
      return true;
    } catch (error) {
      console.error(`Error consuming special berry ${berryName} for trainer ${trainerId}:`, error);
      return false;
    }
  }

  /**
   * Get available special berries for a trainer
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} Object with berry counts
   */
  static async getAvailableSpecialBerries(trainerId) {
    try {
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      if (!inventory || !inventory.berries) {
        return { 'Forget-Me-Not': 0, 'Edenwiess': 0 };
      }

      const berries = typeof inventory.berries === 'string'
        ? JSON.parse(inventory.berries)
        : inventory.berries;

      return {
        'Forget-Me-Not': berries['Forget-Me-Not'] || 0,
        'Edenwiess': berries['Edenwiess'] || 0
      };
    } catch (error) {
      console.error(`Error getting special berries for trainer ${trainerId}:`, error);
      return { 'Forget-Me-Not': 0, 'Edenwiess': 0 };
    }
  }

  /**
   * Add special berries to trainer inventory (for testing/admin)
   * @param {number} trainerId - Trainer ID
   * @param {string} berryName - Berry name
   * @param {number} quantity - Quantity to add
   * @returns {Promise<boolean>} Whether berries were successfully added
   */
  static async addSpecialBerry(trainerId, berryName, quantity = 1) {
    try {
      const inventory = await TrainerInventory.getByTrainerId(trainerId);
      if (!inventory) {
        return false;
      }

      const berries = inventory.berries 
        ? (typeof inventory.berries === 'string' ? JSON.parse(inventory.berries) : inventory.berries)
        : {};
      
      berries[berryName] = (berries[berryName] || 0) + quantity;
      
      // Update inventory
      await TrainerInventory.updateItemQuantity(inventory.id, 'berries', berryName, berries[berryName]);
      
      console.log(`Added ${quantity} ${berryName} to trainer ${trainerId}. Total: ${berries[berryName]}`);
      return true;
    } catch (error) {
      console.error(`Error adding special berry ${berryName} to trainer ${trainerId}:`, error);
      return false;
    }
  }
}

module.exports = SpecialBerryService;
