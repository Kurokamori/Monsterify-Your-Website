const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require('../config/embeds');
const monsterService = require('../services/monsterService');
const trainerService = require('../services/trainerService');

class ModalSubmitHandler {
  async handleModalSubmit(interaction) {
    const { customId } = interaction;

    try {
      // Route modal submissions to appropriate handlers
      switch (customId) {
        case 'rename_monster_modal':
          await this.handleRenameMonster(interaction);
          break;
        case 'create_trainer_modal':
          await this.handleCreateTrainer(interaction);
          break;
        case 'edit_trainer_modal':
          await this.handleEditTrainer(interaction);
          break;
        case 'link_account_modal':
          await this.handleLinkAccount(interaction);
          break;
        case 'feedback_modal':
          await this.handleFeedback(interaction);
          break;
        case 'bug_report_modal':
          await this.handleBugReport(interaction);
          break;
        default:
          await this.handleUnknownModal(interaction);
      }

    } catch (error) {
      console.error(`Error handling modal ${customId}:`, error);
      
      const embed = createErrorEmbed(
        'An error occurred while processing your submission. Please try again.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  async handleRenameMonster(interaction) {
    const monsterId = interaction.fields.getTextInputValue('monster_id');
    const newName = interaction.fields.getTextInputValue('new_name');

    try {
      // Validate inputs
      if (!monsterId || isNaN(parseInt(monsterId))) {
        throw new Error('Invalid monster ID provided.');
      }

      if (!newName || newName.trim().length === 0) {
        throw new Error('Monster name cannot be empty.');
      }

      if (newName.length > 50) {
        throw new Error('Monster name must be 50 characters or less.');
      }

      // Rename the monster
      const response = await monsterService.renameMonster(parseInt(monsterId), newName.trim());
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to rename monster');
      }

      const embed = createSuccessEmbed(
        `Monster successfully renamed to "${newName.trim()}"!`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        error.isApiError ? error.message : error.message || 'Failed to rename monster. Please try again.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleCreateTrainer(interaction) {
    const name = interaction.fields.getTextInputValue('trainer_name');
    const pronouns = interaction.fields.getTextInputValue('trainer_pronouns');
    const age = interaction.fields.getTextInputValue('trainer_age');
    const location = interaction.fields.getTextInputValue('trainer_location');
    const bio = interaction.fields.getTextInputValue('trainer_bio');

    try {
      // Validate inputs
      if (!name || name.trim().length === 0) {
        throw new Error('Trainer name cannot be empty.');
      }

      if (name.length > 100) {
        throw new Error('Trainer name must be 100 characters or less.');
      }

      // Create trainer data
      const trainerData = {
        name: name.trim(),
        pronouns: pronouns?.trim() || null,
        age: age?.trim() || null,
        location: location?.trim() || null,
        bio: bio?.trim() || null,
      };

      // Create the trainer
      const response = await trainerService.createTrainer(trainerData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create trainer');
      }

      const embed = createSuccessEmbed(
        `Trainer "${name.trim()}" created successfully!\n\n` +
        'You can now use trainer commands to manage your new trainer.'
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        error.isApiError ? error.message : error.message || 'Failed to create trainer. Please try again.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleEditTrainer(interaction) {
    const trainerId = interaction.fields.getTextInputValue('trainer_id');
    const name = interaction.fields.getTextInputValue('trainer_name');
    const pronouns = interaction.fields.getTextInputValue('trainer_pronouns');
    const bio = interaction.fields.getTextInputValue('trainer_bio');

    try {
      // Validate inputs
      if (!trainerId || isNaN(parseInt(trainerId))) {
        throw new Error('Invalid trainer ID provided.');
      }

      // Create update data (only include non-empty fields)
      const updateData = {};
      if (name && name.trim()) updateData.name = name.trim();
      if (pronouns && pronouns.trim()) updateData.pronouns = pronouns.trim();
      if (bio && bio.trim()) updateData.bio = bio.trim();

      if (Object.keys(updateData).length === 0) {
        throw new Error('No changes provided.');
      }

      // Update the trainer
      const response = await trainerService.updateTrainer(parseInt(trainerId), updateData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update trainer');
      }

      const embed = createSuccessEmbed(
        'Trainer updated successfully!\n\n' +
        `Updated fields: ${Object.keys(updateData).join(', ')}`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        error.isApiError ? error.message : error.message || 'Failed to update trainer. Please try again.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleLinkAccount(interaction) {
    const token = interaction.fields.getTextInputValue('link_token');
    const username = interaction.fields.getTextInputValue('website_username');

    try {
      // Validate inputs
      if (!token || token.trim().length === 0) {
        throw new Error('Link token cannot be empty.');
      }

      // TODO: Implement actual account linking with API
      // For now, just show a success message
      const embed = createInfoEmbed(
        'Account Linking',
        `Account linking request received!\n\n` +
        `**Discord User:** ${interaction.user.tag}\n` +
        `**Website Username:** ${username || 'Not provided'}\n` +
        `**Token:** ${token.substring(0, 8)}...\n\n` +
        `*Account linking system is coming soon!*`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        error.message || 'Failed to process account linking. Please try again.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleFeedback(interaction) {
    const subject = interaction.fields.getTextInputValue('feedback_subject');
    const message = interaction.fields.getTextInputValue('feedback_message');

    try {
      // Log feedback (in a real implementation, this would be saved to database)
      console.log(`Feedback from ${interaction.user.tag} (${interaction.user.id}):`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);

      const embed = createSuccessEmbed(
        'Thank you for your feedback!\n\n' +
        'Your feedback has been received and will be reviewed by our team.'
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        'Failed to submit feedback. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleBugReport(interaction) {
    const title = interaction.fields.getTextInputValue('bug_title');
    const description = interaction.fields.getTextInputValue('bug_description');
    const steps = interaction.fields.getTextInputValue('bug_steps');

    try {
      // Log bug report (in a real implementation, this would be saved to database)
      console.log(`Bug report from ${interaction.user.tag} (${interaction.user.id}):`);
      console.log(`Title: ${title}`);
      console.log(`Description: ${description}`);
      console.log(`Steps to reproduce: ${steps}`);

      const embed = createSuccessEmbed(
        'Bug report submitted!\n\n' +
        'Thank you for reporting this issue. Our development team will investigate it.'
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      const embed = createErrorEmbed(
        'Failed to submit bug report. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  async handleUnknownModal(interaction) {
    const embed = createErrorEmbed(
      `Unknown modal: ${interaction.customId}. This feature may not be implemented yet.`
    );
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Helper method to validate text input length
  validateTextLength(text, fieldName, minLength = 0, maxLength = 1000) {
    if (text.length < minLength) {
      throw new Error(`${fieldName} must be at least ${minLength} characters long.`);
    }
    if (text.length > maxLength) {
      throw new Error(`${fieldName} must be ${maxLength} characters or less.`);
    }
  }
}

module.exports = new ModalSubmitHandler();
