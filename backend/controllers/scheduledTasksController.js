const Trainer = require('../models/Trainer');
const TrainerInventory = require('../models/TrainerInventory');
const db = require('../config/db');

/**
 * Controller for scheduled tasks
 */
const scheduledTasksController = {
  /**
   * Add monthly items to all trainers
   * @returns {Promise<Object>} - Result of the operation
   */
  addMonthlyItems: async () => {
    try {
      console.log('Starting monthly item distribution...');

      // Get all trainers
      const query = 'SELECT id FROM trainers';
      const trainers = await db.asyncAll(query);

      if (!trainers || trainers.length === 0) {
        console.log('No trainers found');
        return {
          success: false,
          message: 'No trainers found'
        };
      }

      console.log(`Found ${trainers.length} trainers`);

      // Items to add
      const items = [
        { name: 'Legacy Leeway', category: 'items', quantity: 1 },
        { name: 'Daycare Daypass', category: 'items', quantity: 1 },
        { name: 'Mission Mandate', category: 'keyitems', quantity: 1 }
      ];

      // Track results
      const results = {
        totalTrainers: trainers.length,
        successCount: 0,
        failCount: 0,
        errors: []
      };

      // Add items to each trainer
      for (const trainer of trainers) {
        try {
          const trainerId = trainer.id;

          // Add each item
          for (const item of items) {
            await TrainerInventory.addItem(
              trainerId,
              item.category,
              item.name,
              item.quantity
            );

            console.log(`Added ${item.quantity} ${item.name} to trainer ${trainerId}`);
          }

          results.successCount++;
        } catch (trainerError) {
          console.error(`Error adding items to trainer ${trainer.id}:`, trainerError);
          results.failCount++;
          results.errors.push({
            trainerId: trainer.id,
            error: trainerError.message
          });
        }
      }

      console.log('Monthly item distribution completed');
      console.log(`Success: ${results.successCount}, Failed: ${results.failCount}`);

      return {
        success: true,
        message: 'Monthly items added successfully',
        results
      };
    } catch (error) {
      console.error('Error adding monthly items:', error);
      return {
        success: false,
        message: 'Error adding monthly items',
        error: error.message
      };
    }
  },

  /**
   * Run monthly tasks
   * @returns {Promise<Object>} - Result of the operation
   */
  runMonthlyTasks: async () => {
    try {
      console.log('Running monthly tasks...');

      // Add monthly items
      const itemsResult = await scheduledTasksController.addMonthlyItems();

      // Add more monthly tasks here as needed

      return {
        success: true,
        message: 'Monthly tasks completed successfully',
        results: {
          items: itemsResult
        }
      };
    } catch (error) {
      console.error('Error running monthly tasks:', error);
      return {
        success: false,
        message: 'Error running monthly tasks',
        error: error.message
      };
    }
  },

  /**
   * Check if it's the first day of the month
   * @returns {boolean} - True if it's the first day of the month
   */
  isFirstDayOfMonth: () => {
    const now = new Date();
    return now.getDate() === 1;
  }
};

module.exports = scheduledTasksController;
