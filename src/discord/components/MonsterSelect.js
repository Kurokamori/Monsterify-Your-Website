const PaginatedDropdown = require('./PaginatedDropdown');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * A component for selecting monsters
 */
class MonsterSelect {
  /**
   * Create a new monster select component
   * @param {Object} options - Configuration options
   * @param {string} options.customId - Custom ID for the dropdown
   * @param {string} options.placeholder - Placeholder text for the dropdown
   * @param {Array<Object>} options.monsters - Array of monsters to select from
   * @param {Function} [options.onSelect] - Callback function when a monster is selected
   */
  constructor(options) {
    this.customId = options.customId;
    this.placeholder = options.placeholder;
    this.monsters = options.monsters;
    this.onSelect = options.onSelect;
    
    // Create paginated dropdown
    this.dropdown = new PaginatedDropdown({
      customId: this.customId,
      placeholder: this.placeholder,
      options: this._formatMonsterOptions(),
      onSelect: this.onSelect
    });
  }
  
  /**
   * Format monster data for dropdown options
   * @returns {Array<Object>} - Formatted monster options
   * @private
   */
  _formatMonsterOptions() {
    return this.monsters.map(monster => {
      // Format species (up to 3)
      const species = monster.species ? 
        (Array.isArray(monster.species) ? monster.species.slice(0, 3).join('/') : monster.species) : 
        'Unknown';
      
      // Format types (up to 3)
      const types = monster.types ? 
        (Array.isArray(monster.types) ? monster.types.slice(0, 3).join('/') : monster.types) : 
        'Unknown';
      
      return {
        label: monster.nickname || species,
        value: monster.id.toString(),
        description: `Lvl ${monster.level || 1} - ${types} - ${monster.attribute || 'No Attribute'}`
      };
    });
  }
  
  /**
   * Build the monster select component
   * @returns {Array<ActionRowBuilder>} - Array of action rows with dropdown and pagination buttons
   */
  build() {
    const components = [];
    
    // Add dropdown
    components.push(this.dropdown.build());
    
    // Add pagination buttons if needed
    if (this.dropdown.totalPages > 1) {
      const paginationRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`${this.customId}_prev`)
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(this.dropdown.currentPage === 0),
          new ButtonBuilder()
            .setCustomId(`${this.customId}_next`)
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(this.dropdown.currentPage === this.dropdown.totalPages - 1)
        );
      
      components.push(paginationRow);
    }
    
    return components;
  }
  
  /**
   * Handle interaction with the dropdown
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   */
  async handleInteraction(interaction) {
    await this.dropdown.handleInteraction(interaction);
  }
  
  /**
   * Handle pagination button interactions
   * @param {ButtonInteraction} interaction - Discord button interaction
   */
  async handlePaginationInteraction(interaction) {
    const buttonId = interaction.customId;
    
    if (buttonId === `${this.customId}_prev`) {
      this.dropdown.previousPage();
    } else if (buttonId === `${this.customId}_next`) {
      this.dropdown.nextPage();
    }
    
    // Update the message with new dropdown
    await interaction.update({ components: this.build() });
  }
}

module.exports = MonsterSelect;
