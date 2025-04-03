const TrainerSelect = require('./TrainerSelect');
const TrainerService = require('../../services/TrainerService');

/**
 * A component for selecting trainers belonging to a specific user
 */
class UserTrainerSelect extends TrainerSelect {
  /**
   * Create a new user trainer select component
   * @param {Object} options - Configuration options
   * @param {string} options.customId - Custom ID for the dropdown
   * @param {string} options.placeholder - Placeholder text for the dropdown
   * @param {string} options.userId - Discord user ID
   * @param {Function} [options.onSelect] - Callback function when a trainer is selected
   */
  constructor(options) {
    super({
      customId: options.customId,
      placeholder: options.placeholder,
      trainers: [], // Will be populated in loadTrainers
      onSelect: options.onSelect
    });
    
    this.userId = options.userId;
  }
  
  /**
   * Load trainers for the user
   * @returns {Promise<void>}
   */
  async loadTrainers() {
    try {
      // Get trainers for the user
      const trainers = await TrainerService.getTrainersByDiscordId(this.userId);
      
      // Update trainers
      this.trainers = trainers;
      
      // Update dropdown options
      this.dropdown.options = this._formatTrainerOptions();
      
      // Recalculate pagination
      this.dropdown.totalPages = Math.ceil(this.trainers.length / this.dropdown.pageSize);
      this.dropdown.currentPage = 0;
    } catch (error) {
      console.error('Error loading trainers for user:', error);
      throw error;
    }
  }
}

module.exports = UserTrainerSelect;
