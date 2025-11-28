const { createErrorEmbed, createInfoEmbed } = require('../config/embeds');
const slashCommands = require('../commands/slashCommands');
const townCommands = require('../commands/townCommands');
const marketCommands = require('../commands/marketCommands');

class ButtonHandler {
  async handleButton(interaction) {
    const { customId } = interaction;

    try {
      // Route button interactions to appropriate handlers
      switch (customId) {
        // Navigation buttons
        case 'back':
          await this.handleBack(interaction);
          break;
        case 'home':
          await slashCommands.menu(interaction);
          break;
        case 'refresh':
          await this.handleRefresh(interaction);
          break;

        // Pagination buttons
        case 'previous':
        case 'next':
          await this.handlePagination(interaction);
          break;

        // Main menu buttons
        case 'town_menu':
          await townCommands.menu(interaction);
          break;
        case 'shop_menu':
          await marketCommands.menu(interaction);
          break;
        case 'view_trainer':
          await this.handleViewTrainer(interaction);
          break;

        // Town location buttons
        case 'town_home':
        case 'town_adoption':
        case 'town_garden':
        case 'town_farm':
        case 'town_game':
        case 'town_antique':
        case 'town_pirates':
        case 'town_lab':
          await this.handleTownLocation(interaction);
          break;

        // Town activity buttons
        case 'adoption_view':
          await townCommands.adoption.view(interaction);
          break;
        case 'garden_points':
          await townCommands.garden.points(interaction);
          break;
        case 'farm_status':
          await townCommands.farm.status(interaction);
          break;

        // Shop buttons
        case 'shop_apothecary':
        case 'shop_bakery':
        case 'shop_witch':
        case 'shop_megamart':
        case 'shop_antique':
        case 'shop_nursery':
        case 'shop_pirates':
          await this.handleShopVisit(interaction);
          break;
        case 'shop_deals':
          await marketCommands.deals(interaction);
          break;
        case 'shop_buy':
          await marketCommands.buy(interaction);
          break;
        case 'shop_use':
          await marketCommands.use(interaction);
          break;

        // Trainer buttons
        case 'trainer_inventory':
        case 'trainer_monsters':
          await this.handleTrainerAction(interaction);
          break;

        // Monster buttons
        case 'view_monster':
        case 'rename_monster':
          await this.handleMonsterAction(interaction);
          break;

        // Generic action buttons
        case 'confirm':
        case 'cancel':
          await this.handleConfirmation(interaction);
          break;

        default:
          // Handle unknown button
          await this.handleUnknownButton(interaction);
      }

    } catch (error) {
      console.error(`Error handling button ${customId}:`, error);
      
      const embed = createErrorEmbed(
        'An error occurred while processing your request. Please try again.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  async handleBack(interaction) {
    // For now, just show the main menu
    await slashCommands.menu(interaction);
  }

  async handleRefresh(interaction) {
    // Get the original command from the interaction and re-execute it
    const embed = createInfoEmbed(
      'Refreshed',
      'Content has been refreshed! Use the buttons to navigate.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handlePagination(interaction) {
    const embed = createInfoEmbed(
      'Pagination',
      'Pagination system coming soon! This will allow you to browse through multiple pages of content.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleViewTrainer(interaction) {
    // Simulate trainer view command
    const embed = createInfoEmbed(
      'View Trainer',
      'Please use `/trainer view` command to see your trainer information.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleTownLocation(interaction) {
    // Extract location from button ID
    const location = interaction.customId.replace('town_', '');
    
    // Create a mock interaction for the town visit command
    const mockOptions = {
      getString: (name) => name === 'location' ? location : null
    };
    
    const mockInteraction = {
      ...interaction,
      options: mockOptions
    };
    
    await townCommands.visit(mockInteraction);
  }

  async handleShopVisit(interaction) {
    // Extract shop type from button ID
    const shopType = interaction.customId.replace('shop_', '');
    
    // Create a mock interaction for the shop view command
    const mockOptions = {
      getString: (name) => name === 'shop' ? shopType : null
    };
    
    const mockInteraction = {
      ...interaction,
      options: mockOptions
    };
    
    await marketCommands.view(mockInteraction);
  }

  async handleTrainerAction(interaction) {
    const action = interaction.customId.replace('trainer_', '');
    
    const embed = createInfoEmbed(
      'Trainer Action',
      `Please use \`/trainer ${action}\` command for this action.`
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleMonsterAction(interaction) {
    const action = interaction.customId.replace('_monster', '');
    
    const embed = createInfoEmbed(
      'Monster Action',
      `Please use \`/monster ${action}\` command for this action.`
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleConfirmation(interaction) {
    const isConfirm = interaction.customId === 'confirm';
    
    const embed = createInfoEmbed(
      isConfirm ? 'Confirmed' : 'Cancelled',
      isConfirm ? 'Action confirmed!' : 'Action cancelled.'
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  async handleUnknownButton(interaction) {
    const embed = createErrorEmbed(
      `Unknown button: ${interaction.customId}. This feature may not be implemented yet.`
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Helper method to extract data from button custom IDs
  parseButtonData(customId) {
    const parts = customId.split('_');
    return {
      action: parts[0],
      target: parts[1],
      id: parts[2],
      extra: parts.slice(3)
    };
  }
}

module.exports = new ButtonHandler();
