const SubmissionSelectHandler = require('./submissionSelectHandler');
const MarketCommandHandler = require('./marketCommandHandler');

/**
 * Handler for select menu interactions
 */
class SelectMenuHandler {
  /**
   * Handle select menu interactions
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   */
  static async handleSelectMenuInteraction(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Get the select menu ID
      const selectId = interaction.customId;

      // Handle different select menus
      if (selectId.startsWith('trainer_select')) {
        await this._handleTrainerSelect(interaction);
      } else if (selectId.startsWith('monster_select')) {
        await this._handleMonsterSelect(interaction);
      }
      // Handle submission select menus
      else if (selectId.startsWith('writing_trainer_select')) {
        await SubmissionSelectHandler.handleWritingTrainerSelect(interaction);
      } else if (selectId.startsWith('art_trainer_select')) {
        await SubmissionSelectHandler.handleArtTrainerSelect(interaction);
      } else if (selectId.startsWith('reference_trainer_select')) {
        await SubmissionSelectHandler.handleReferenceTrainerSelect(interaction);
      } else if (selectId.startsWith('prompt_trainer_select_')) {
        // Extract the prompt type from the custom ID
        // Format: prompt_trainer_select_TYPE_userId
        const parts = selectId.split('_');
        if (parts.length >= 4) {
          // Set the prompt type in the interaction object for use in the handler
          interaction.promptType = parts[3];
          console.log(`Extracted prompt type from select ID: ${interaction.promptType}`);
        }
        await SubmissionSelectHandler.handlePromptTrainerSelect(interaction);
      } else if (selectId.startsWith('prompt_select_')) {
        await SubmissionSelectHandler.handlePromptSelect(interaction);
      }
      // Handle market select menus
      else if (selectId.startsWith('market_trainer_select_')) {
        await MarketCommandHandler.handleTrainerSelection(interaction, selectId);
      } else if (selectId.startsWith('market_item_select_')) {
        await MarketCommandHandler.handleItemSelection(interaction, selectId);
      } else {
        await interaction.followUp({
          content: 'This select menu is not yet implemented.',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error handling select menu interaction:', error);

      // Reply with error message if interaction hasn't been replied to yet
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while processing this selection. Please try again later.',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: 'An error occurred while processing this selection. Please try again later.',
          ephemeral: true
        });
      }
    }
  }

  /**
   * Handle trainer select menu
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @private
   */
  static async _handleTrainerSelect(interaction) {
    // Get selected trainer ID
    const trainerId = interaction.values[0];

    // For now, just acknowledge the selection
    await interaction.followUp({
      content: `You selected trainer with ID: ${trainerId}. This feature is coming soon!`,
      ephemeral: true
    });
  }

  /**
   * Handle monster select menu
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @private
   */
  static async _handleMonsterSelect(interaction) {
    // Get selected monster ID
    const monsterId = interaction.values[0];

    // For now, just acknowledge the selection
    await interaction.followUp({
      content: `You selected monster with ID: ${monsterId}. This feature is coming soon!`,
      ephemeral: true
    });
  }
}

module.exports = SelectMenuHandler;
