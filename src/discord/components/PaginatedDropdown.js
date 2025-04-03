const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

/**
 * A paginated dropdown component that allows for more than 25 options
 */
class PaginatedDropdown {
  /**
   * Create a new paginated dropdown
   * @param {Object} options - Configuration options
   * @param {string} options.customId - Custom ID for the dropdown
   * @param {string} options.placeholder - Placeholder text for the dropdown
   * @param {Array<Object>} options.options - Array of options for the dropdown
   * @param {string} options.options[].label - Label for the option
   * @param {string} options.options[].value - Value for the option
   * @param {string} [options.options[].description] - Description for the option
   * @param {string} [options.options[].emoji] - Emoji for the option
   * @param {number} [options.pageSize=25] - Number of options per page (max 25)
   * @param {Function} [options.onSelect] - Callback function when an option is selected
   */
  constructor(options) {
    this.customId = options.customId;
    this.placeholder = options.placeholder;
    this.options = options.options;
    this.pageSize = options.pageSize || 25;
    this.onSelect = options.onSelect;
    
    // Ensure pageSize is not greater than 25 (Discord limit)
    if (this.pageSize > 25) {
      this.pageSize = 25;
    }
    
    // Calculate number of pages
    this.totalPages = Math.ceil(this.options.length / this.pageSize);
    this.currentPage = 0;
  }
  
  /**
   * Get the current page of options
   * @returns {Array<Object>} - Current page of options
   * @private
   */
  _getCurrentPageOptions() {
    const start = this.currentPage * this.pageSize;
    const end = Math.min(start + this.pageSize, this.options.length);
    return this.options.slice(start, end);
  }
  
  /**
   * Build the dropdown component
   * @returns {ActionRowBuilder} - Action row with dropdown
   */
  build() {
    // Get current page options
    const currentOptions = this._getCurrentPageOptions();
    
    // Create select menu options
    const selectOptions = currentOptions.map(option => {
      const selectOption = new StringSelectMenuOptionBuilder()
        .setLabel(option.label)
        .setValue(option.value);
      
      // Add description if provided
      if (option.description) {
        selectOption.setDescription(option.description);
      }
      
      // Add emoji if provided
      if (option.emoji) {
        selectOption.setEmoji(option.emoji);
      }
      
      return selectOption;
    });
    
    // Create pagination info if needed
    let placeholder = this.placeholder;
    if (this.totalPages > 1) {
      placeholder += ` (Page ${this.currentPage + 1}/${this.totalPages})`;
    }
    
    // Create select menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(this.customId)
      .setPlaceholder(placeholder)
      .addOptions(selectOptions);
    
    // Create action row
    const row = new ActionRowBuilder()
      .addComponents(selectMenu);
    
    return row;
  }
  
  /**
   * Handle interaction with the dropdown
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   */
  async handleInteraction(interaction) {
    // Get selected value
    const selectedValue = interaction.values[0];
    
    // Call onSelect callback if provided
    if (this.onSelect) {
      await this.onSelect(interaction, selectedValue);
    }
  }
  
  /**
   * Go to the next page
   * @returns {boolean} - Whether the page was changed
   */
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      return true;
    }
    return false;
  }
  
  /**
   * Go to the previous page
   * @returns {boolean} - Whether the page was changed
   */
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      return true;
    }
    return false;
  }
  
  /**
   * Go to a specific page
   * @param {number} page - Page number (0-based)
   * @returns {boolean} - Whether the page was changed
   */
  goToPage(page) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      return true;
    }
    return false;
  }
}

module.exports = PaginatedDropdown;
