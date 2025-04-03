const TrainerSelect = require('./TrainerSelect');
const TrainerService = require('../../services/TrainerService');

/**
 * A component for selecting from all trainers
 */
class AllTrainerSelect extends TrainerSelect {
  /**
   * Create a new all trainer select component
   * @param {Object} options - Configuration options
   * @param {string} options.customId - Custom ID for the dropdown
   * @param {string} options.placeholder - Placeholder text for the dropdown
   * @param {Function} [options.onSelect] - Callback function when a trainer is selected
   */
  constructor(options) {
    super({
      customId: options.customId,
      placeholder: options.placeholder,
      trainers: [], // Will be populated in loadTrainers
      onSelect: options.onSelect
    });
  }
  
  /**
   * Load all trainers
   * @returns {Promise<void>}
   */
  async loadTrainers() {
    try {
      // Get all trainers
      const trainers = await TrainerService.getAllTrainers();
      
      // Update trainers
      this.trainers = trainers;
      
      // Update dropdown options
      this.dropdown.options = this._formatTrainerOptions();
      
      // Recalculate pagination
      this.dropdown.totalPages = Math.ceil(this.trainers.length / this.dropdown.pageSize);
      this.dropdown.currentPage = 0;
    } catch (error) {
      console.error('Error loading all trainers:', error);
      throw error;
    }
  }
}

module.exports = AllTrainerSelect;
