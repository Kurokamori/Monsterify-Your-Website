const { createErrorEmbed, createInfoEmbed, createSuccessEmbed } = require('../config/embeds');

class SelectMenuHandler {
  async handleSelectMenu(interaction) {
    const { customId, values } = interaction;

    try {
      // Route select menu interactions to appropriate handlers
      switch (customId) {
        case 'trainer_select':
          await this.handleTrainerSelect(interaction, values);
          break;
        case 'monster_select':
          await this.handleMonsterSelect(interaction, values);
          break;
        case 'item_select':
          await this.handleItemSelect(interaction, values);
          break;
        case 'shop_select':
          await this.handleShopSelect(interaction, values);
          break;
        case 'location_select':
          await this.handleLocationSelect(interaction, values);
          break;
        case 'activity_select':
          await this.handleActivitySelect(interaction, values);
          break;
        default:
          await this.handleUnknownSelectMenu(interaction);
      }

    } catch (error) {
      console.error(`Error handling select menu ${customId}:`, error);
      
      const embed = createErrorEmbed(
        'An error occurred while processing your selection. Please try again.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  async handleTrainerSelect(interaction, values) {
    const selectedTrainerId = values[0];
    
    const embed = createSuccessEmbed(
      `Selected trainer with ID: ${selectedTrainerId}\n\n` +
      'Trainer selection system coming soon! This will allow you to switch between multiple trainers.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleMonsterSelect(interaction, values) {
    const selectedMonsterId = values[0];
    
    const embed = createSuccessEmbed(
      `Selected monster with ID: ${selectedMonsterId}\n\n` +
      'Monster selection system coming soon! This will allow you to perform actions on specific monsters.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleItemSelect(interaction, values) {
    const selectedItemId = values[0];
    
    const embed = createSuccessEmbed(
      `Selected item with ID: ${selectedItemId}\n\n` +
      'Item selection system coming soon! This will allow you to use or manage specific items.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleShopSelect(interaction, values) {
    const selectedShop = values[0];
    
    const embed = createInfoEmbed(
      'Shop Selection',
      `You selected: ${selectedShop}\n\n` +
      'Shop navigation system coming soon! This will take you directly to the selected shop.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleLocationSelect(interaction, values) {
    const selectedLocation = values[0];
    
    const embed = createInfoEmbed(
      'Location Selection',
      `You selected: ${selectedLocation}\n\n` +
      'Location navigation system coming soon! This will take you directly to the selected location.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleActivitySelect(interaction, values) {
    const selectedActivity = values[0];
    
    const embed = createInfoEmbed(
      'Activity Selection',
      `You selected: ${selectedActivity}\n\n` +
      'Activity system coming soon! This will start the selected activity.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleUnknownSelectMenu(interaction) {
    const embed = createErrorEmbed(
      `Unknown select menu: ${interaction.customId}. This feature may not be implemented yet.`
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Helper method to create select menu options
  static createSelectOptions(items, valueKey = 'id', labelKey = 'name', descriptionKey = 'description') {
    return items.map(item => ({
      label: item[labelKey] || 'Unknown',
      value: item[valueKey]?.toString() || 'unknown',
      description: item[descriptionKey] ? 
        (item[descriptionKey].length > 100 ? 
          item[descriptionKey].substring(0, 97) + '...' : 
          item[descriptionKey]) : 
        undefined,
    }));
  }

  // Helper method to create paginated select options
  static createPaginatedOptions(items, page = 1, itemsPerPage = 25) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);
    
    return {
      options: this.createSelectOptions(pageItems),
      totalPages: Math.ceil(items.length / itemsPerPage),
      currentPage: page,
      totalItems: items.length,
    };
  }
}

module.exports = new SelectMenuHandler();
