const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const trainerService = require('../services/trainerService');
const userLinkingSystem = require('../utils/userLinkingSystem');

class TrainerSelectComponent {
  // Create a trainer selection menu
  static async createTrainerSelectMenu(discordId, customId = 'trainer_select', placeholder = 'Select a trainer...') {
    try {
      // Get user's trainers
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        throw new Error('Discord account not linked. Please use /link-account first.');
      }

      const response = await trainerService.getTrainersByUserId(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trainers');
      }

      const trainers = response.data || [];
      
      if (trainers.length === 0) {
        throw new Error('No trainers found. Please create a trainer on the website first.');
      }

      // Create select menu options
      const options = trainers.map(trainer => ({
        label: trainer.name,
        value: trainer.id.toString(),
        description: `Level: ${trainer.level || 'Unknown'} | Monsters: ${trainer.monster_count || 0}`,
        emoji: '👤',
      }));

      // Limit to 25 options (Discord limit)
      const limitedOptions = options.slice(0, 25);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(limitedOptions);

      return new ActionRowBuilder().addComponents(selectMenu);

    } catch (error) {
      throw error;
    }
  }

  // Create a simplified trainer select for quick actions
  static async createQuickTrainerSelect(discordId, customId = 'quick_trainer_select') {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        return null; // No linked account
      }

      const response = await trainerService.getTrainersByUserId(userId);
      if (!response.success || !response.data || response.data.length === 0) {
        return null; // No trainers
      }

      const trainers = response.data;
      
      // If only one trainer, return it directly
      if (trainers.length === 1) {
        return {
          singleTrainer: trainers[0],
          selectMenu: null,
        };
      }

      // Create select menu for multiple trainers
      const selectMenu = await this.createTrainerSelectMenu(discordId, customId, 'Choose your trainer...');
      
      return {
        singleTrainer: null,
        selectMenu,
      };

    } catch (error) {
      console.error('Error creating quick trainer select:', error);
      return null;
    }
  }

  // Handle trainer selection
  static async handleTrainerSelection(interaction, selectedTrainerId) {
    try {
      const response = await trainerService.getTrainerById(selectedTrainerId);
      if (!response.success) {
        throw new Error(response.message || 'Trainer not found');
      }

      return response.data;

    } catch (error) {
      throw error;
    }
  }

  // Create trainer info display
  static formatTrainerOption(trainer) {
    const monsterCount = trainer.monster_count || 0;
    const location = trainer.location || 'Unknown';
    
    return {
      label: trainer.name,
      value: trainer.id.toString(),
      description: `${location} | ${monsterCount} monsters`,
      emoji: '👤',
    };
  }

  // Create paginated trainer select (for users with many trainers)
  static async createPaginatedTrainerSelect(discordId, page = 1, itemsPerPage = 25, customId = 'paginated_trainer_select') {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        throw new Error('Discord account not linked');
      }

      const response = await trainerService.getTrainersByUserId(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trainers');
      }

      const trainers = response.data || [];
      const totalPages = Math.ceil(trainers.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageTrainers = trainers.slice(startIndex, endIndex);

      if (pageTrainers.length === 0) {
        throw new Error('No trainers found on this page');
      }

      const options = pageTrainers.map(trainer => this.formatTrainerOption(trainer));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${customId}_${page}`)
        .setPlaceholder(`Select trainer (Page ${page}/${totalPages})...`)
        .addOptions(options);

      return {
        selectMenu: new ActionRowBuilder().addComponents(selectMenu),
        pagination: {
          currentPage: page,
          totalPages,
          totalTrainers: trainers.length,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

    } catch (error) {
      throw error;
    }
  }

  // Get trainer by Discord user (helper method)
  static async getDefaultTrainer(discordId) {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        return null;
      }

      const response = await trainerService.getTrainersByUserId(userId);
      if (!response.success || !response.data || response.data.length === 0) {
        return null;
      }

      // Return the first trainer as default
      return response.data[0];

    } catch (error) {
      console.error('Error getting default trainer:', error);
      return null;
    }
  }

  // Validate trainer ownership
  static async validateTrainerOwnership(discordId, trainerId) {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        return false;
      }

      const response = await trainerService.getTrainersByUserId(userId);
      if (!response.success || !response.data) {
        return false;
      }

      return response.data.some(trainer => trainer.id.toString() === trainerId.toString());

    } catch (error) {
      console.error('Error validating trainer ownership:', error);
      return false;
    }
  }
}

module.exports = TrainerSelectComponent;
