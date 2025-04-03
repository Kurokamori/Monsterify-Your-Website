const MonsterSelect = require('./MonsterSelect');
const MonsterService = require('../../services/MonsterService');

/**
 * A component for selecting monsters belonging to a specific trainer
 */
class TrainerMonsterSelect extends MonsterSelect {
  /**
   * Create a new trainer monster select component
   * @param {Object} options - Configuration options
   * @param {string} options.customId - Custom ID for the dropdown
   * @param {string} options.placeholder - Placeholder text for the dropdown
   * @param {string|number} options.trainerId - Trainer ID
   * @param {Function} [options.onSelect] - Callback function when a monster is selected
   */
  constructor(options) {
    super({
      customId: options.customId,
      placeholder: options.placeholder,
      monsters: [], // Will be populated in loadMonsters
      onSelect: options.onSelect
    });
    
    this.trainerId = options.trainerId;
  }
  
  /**
   * Load monsters for the trainer
   * @returns {Promise<void>}
   */
  async loadMonsters() {
    try {
      // Get monsters for the trainer
      const monsters = await MonsterService.getMonstersByTrainerId(this.trainerId);
      
      // Update monsters
      this.monsters = monsters;
      
      // Update dropdown options
      this.dropdown.options = this._formatMonsterOptions();
      
      // Recalculate pagination
      this.dropdown.totalPages = Math.ceil(this.monsters.length / this.dropdown.pageSize);
      this.dropdown.currentPage = 0;
    } catch (error) {
      console.error('Error loading monsters for trainer:', error);
      throw error;
    }
  }
}

module.exports = TrainerMonsterSelect;
