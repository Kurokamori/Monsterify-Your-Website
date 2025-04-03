const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const SubmissionService = require('../services/SubmissionService');
const TrainerService = require('../../services/TrainerService');
const MonsterService = require('../../services/MonsterService');
const SubmissionFormHandler = require('./submissionFormHandler');
const { getPromptsByCategory, getPromptById } = require('../../../database/helpers/promptHelpers');

/**
 * Handler for submission-related select menu interactions
 */
class SubmissionSelectHandler {
  /**
   * Handle writing submission trainer select
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @returns {Promise<void>}
   */
  static async handleWritingTrainerSelect(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Get the selected trainer ID
      const trainerId = interaction.values[0];
      const userId = interaction.user.id;

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        await interaction.followUp({
          content: 'Your submission data was not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Store the trainer ID
      submissionData.trainerId = trainerId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        await interaction.followUp({
          content: 'Selected trainer not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Check if this is a gift submission
      if (submissionData.isGift) {
        // Process as gift
        await this._processWritingGiftSubmission(interaction, submissionData, trainer);
      } else {
        // Process normal submission
        await this._processWritingSubmission(interaction, submissionData, trainer);
      }
    } catch (error) {
      console.error('Error handling writing trainer select:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your selection. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle art submission trainer select
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @returns {Promise<void>}
   */
  static async handleArtTrainerSelect(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Get the selected trainer ID
      const trainerId = interaction.values[0];
      const userId = interaction.user.id;

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        await interaction.followUp({
          content: 'Your submission data was not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Store the trainer ID
      submissionData.trainerId = trainerId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        await interaction.followUp({
          content: 'Selected trainer not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Check if this is a gift submission
      if (submissionData.isGift) {
        // Process as gift
        await this._processArtGiftSubmission(interaction, submissionData, trainer);
      } else {
        // Process normal submission
        await this._processArtSubmission(interaction, submissionData, trainer);
      }
    } catch (error) {
      console.error('Error handling art trainer select:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your selection. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle reference submission trainer select
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @returns {Promise<void>}
   */
  static async handleReferenceTrainerSelect(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Get the selected trainer ID
      const trainerId = interaction.values[0];
      const userId = interaction.user.id;

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        await interaction.followUp({
          content: 'Your submission data was not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Store the trainer ID
      submissionData.trainerId = trainerId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        await interaction.followUp({
          content: 'Selected trainer not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Process reference submission based on type
      if (submissionData.referenceType === 'trainer') {
        await this._processTrainerReferenceSubmission(interaction, submissionData, trainer);
      } else if (submissionData.referenceType === 'monster') {
        await this._processMonsterReferenceSubmission(interaction, submissionData, trainer);
      } else {
        await interaction.followUp({
          content: 'Invalid reference type. Please try again.',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error handling reference trainer select:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your selection. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle prompt submission trainer select
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @returns {Promise<void>}
   */
  static async handlePromptTrainerSelect(interaction) {
    try {
      // Defer the update to prevent timeout
      await interaction.deferUpdate().catch(() => {});

      // Get the selected trainer ID
      const trainerId = interaction.values[0];
      const userId = interaction.user.id;

      // Get the prompt type from the interaction object
      const promptType = interaction.promptType || 'general';
      console.log(`Using prompt type: ${promptType}`);

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        await interaction.followUp({
          content: 'Your submission data was not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Store the trainer ID
      submissionData.trainerId = trainerId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        await interaction.followUp({
          content: 'Selected trainer not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Fetch prompts for this type
      const prompts = await this._fetchPromptsByType(promptType);

      console.log(`Fetched ${prompts ? prompts.length : 0} prompts for type ${promptType}:`, prompts);

      if (!prompts || prompts.length === 0) {
        await interaction.followUp({
          content: `No ${this._formatPromptType(promptType)} prompts found in the database. Please check the database connection and ensure the prompt_templates table is properly populated.`,
          ephemeral: true
        });
        return;
      }

      // Create prompt selection menu
      // We'll paginate if there are more than 25 prompts
      const maxPromptsPerPage = 25;
      const totalPages = Math.ceil(prompts.length / maxPromptsPerPage);
      const currentPage = 1;

      const promptsForPage = prompts.slice(0, maxPromptsPerPage);

      const promptSelect = new StringSelectMenuBuilder()
        .setCustomId(`prompt_select_${promptType}_${trainerId}_${currentPage}_${userId}`)
        .setPlaceholder(`Select a ${this._formatPromptType(promptType)} prompt`)
        .addOptions(
          promptsForPage.map(prompt =>
            new StringSelectMenuOptionBuilder()
              .setLabel(prompt.title.substring(0, 100)) // Discord limits label to 100 chars
              .setDescription(prompt.description.substring(0, 100)) // Discord limits description to 100 chars
              .setValue(prompt.prompt_id.toString())
          )
        );

      // Create pagination buttons if needed
      const components = [new ActionRowBuilder().addComponents(promptSelect)];

      if (totalPages > 1) {
        const paginationRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`prompt_prev_${promptType}_${trainerId}_${currentPage}_${userId}`)
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId(`prompt_next_${promptType}_${trainerId}_${currentPage}_${userId}`)
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages)
          );

        components.push(paginationRow);
      }

      // Send prompt selection message
      await interaction.followUp({
        content: `Please select a prompt for your ${this._formatPromptType(promptType)} submission:`,
        components,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error handling prompt trainer select:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your selection. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle prompt selection
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @returns {Promise<void>}
   */
  static async handlePromptSelect(interaction) {
    try {
      // Get the selected prompt ID
      const promptId = interaction.values[0];

      // Parse the custom ID to get the prompt type and trainer ID
      const customId = interaction.customId;
      const parts = customId.split('_');
      const promptType = parts[2];
      const trainerId = parts[3];
      const userId = interaction.user.id;

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        // Don't defer the update since we need to show a modal
        await interaction.reply({
          content: 'Your submission data was not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Store the prompt ID
      submissionData.promptId = promptId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        // Don't defer the update since we need to show a modal
        await interaction.reply({
          content: 'Selected trainer not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Get prompt details
      const prompt = await this._fetchPromptById(promptId);
      if (!prompt) {
        // Don't defer the update since we need to show a modal
        await interaction.reply({
          content: 'Selected prompt not found. Please try again.',
          ephemeral: true
        });
        return;
      }

      // Show the URL submission form
      // We can show a modal directly without deferring the update
      const urlForm = SubmissionFormHandler.createPromptUrlForm(userId, promptId, trainerId);
      await interaction.showModal(urlForm);
    } catch (error) {
      console.error('Error handling prompt select:', error);
      try {
        // Try to reply if we haven't already
        await interaction.reply({
          content: 'An error occurred while processing your selection. Please try again later.',
          ephemeral: true
        });
      } catch (replyError) {
        // If we've already replied, try to follow up
        try {
          await interaction.followUp({
            content: 'An error occurred while processing your selection. Please try again later.',
            ephemeral: true
          });
        } catch (followUpError) {
          console.error('Error sending error message:', followUpError);
        }
      }
    }
  }

  /**
   * Process writing submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processWritingSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object
      const submission = {
        wordCount: submissionData.wordCount,
        url: submissionData.url,
        trainerId: trainer.id,
        discordId: interaction.user.id
      };

      // Process submission
      const result = await SubmissionService.processWritingSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Writing Submission Successful')
          .setDescription(`Your writing submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Title', value: submissionData.title, inline: true },
            { name: 'Word Count', value: submissionData.wordCount.toString(), inline: true },
            { name: 'Difficulty', value: `x${submissionData.difficultyModifier}`, inline: true },
            { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` },
            { name: 'Recipient', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing writing submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process writing gift submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processWritingGiftSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object with gift flag
      const submission = {
        wordCount: submissionData.wordCount,
        url: submissionData.url,
        trainerId: trainer.id,
        discordId: interaction.user.id,
        isGift: true
      };

      // Process submission
      const result = await SubmissionService.processWritingSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Gift Writing Submission Successful')
          .setDescription(`Your gift writing submission has been processed successfully!`)
          .setColor('#9b59b6')
          .addFields(
            { name: 'Title', value: submissionData.title, inline: true },
            { name: 'Word Count', value: submissionData.wordCount.toString(), inline: true },
            { name: 'Difficulty', value: `x${submissionData.difficultyModifier}`, inline: true },
            { name: 'Gift Levels', value: `${Math.floor(result.rewards.levels / 5)}` },
            { name: 'Recipient', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing gift writing submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process art submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processArtSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object
      const submission = {
        type: submissionData.specificArtType || 'sketch', // Default to sketch if not specified
        url: submissionData.url,
        trainerId: trainer.id,
        discordId: interaction.user.id
      };

      // For manual entry, we need to handle levels differently
      if (submissionData.artType === 'manual' && submissionData.levels) {
        submission.manualLevels = submissionData.levels;
      }

      // Process submission
      const result = await SubmissionService.processArtSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Art Submission Successful')
          .setDescription(`Your art submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Title', value: submissionData.title, inline: true },
            { name: 'Art Type', value: this._formatArtType(submissionData.specificArtType || submissionData.artType), inline: true },
            { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` },
            { name: 'Recipient', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing art submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process art gift submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processArtGiftSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object with gift flag
      const submission = {
        type: submissionData.specificArtType || 'sketch', // Default to sketch if not specified
        url: submissionData.url,
        trainerId: trainer.id,
        discordId: interaction.user.id,
        isGift: true
      };

      // For manual entry, we need to handle levels differently
      if (submissionData.artType === 'manual' && submissionData.levels) {
        submission.manualLevels = submissionData.levels;
      }

      // Process submission
      const result = await SubmissionService.processArtSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Gift Art Submission Successful')
          .setDescription(`Your gift art submission has been processed successfully!`)
          .setColor('#9b59b6')
          .addFields(
            { name: 'Title', value: submissionData.title, inline: true },
            { name: 'Art Type', value: this._formatArtType(submissionData.specificArtType || submissionData.artType), inline: true },
            { name: 'Gift Levels', value: `${Math.floor(result.rewards.levels / 5)}` },
            { name: 'Recipient', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing gift art submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process trainer reference submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processTrainerReferenceSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object
      const submission = {
        url: submissionData.url,
        trainerId: trainer.id,
        discordId: interaction.user.id
      };

      // Process submission
      const result = await SubmissionService.processReferenceSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Trainer Reference Submission Successful')
          .setDescription(`Your trainer reference submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` },
            { name: 'Trainer', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing trainer reference submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process monster reference submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processMonsterReferenceSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object
      const submission = {
        url: submissionData.url,
        monsterId: null, // We don't have the monster ID, just the name
        monsterName: submissionData.monsterName,
        trainerId: trainer.id,
        discordId: interaction.user.id
      };

      // Process submission
      const result = await SubmissionService.processReferenceSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Monster Reference Submission Successful')
          .setDescription(`Your monster reference submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Rewards', value: `${result.rewards.levels} levels, ${result.rewards.coins} coins` },
            { name: 'Monster', value: submissionData.monsterName },
            { name: 'Trainer', value: trainer.name }
          )
          .setTimestamp();

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing monster reference submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Process prompt submission
   * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
   * @param {Object} submissionData - Submission data
   * @param {Object} trainer - Trainer object
   * @returns {Promise<void>}
   * @private
   */
  static async _processPromptSubmission(interaction, submissionData, trainer) {
    try {
      // Create submission object
      const submission = {
        promptId: submissionData.promptId,
        trainerId: trainer.id,
        submissionUrl: submissionData.url
      };

      // Process submission
      const result = await SubmissionService.processPromptSubmission(submission);

      if (result.success) {
        // Create success embed
        const embed = new EmbedBuilder()
          .setTitle('Prompt Submission Successful')
          .setDescription(`Your prompt submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Prompt ID', value: submissionData.promptId, inline: true },
            { name: 'Prompt Type', value: this._formatPromptType(submissionData.promptType), inline: true },
            { name: 'Trainer', value: trainer.name }
          )
          .setTimestamp();

        // If there are rewards, add them to the embed
        if (result.calculation && result.calculation.rewards) {
          embed.addFields(
            { name: 'Rewards', value: `${result.calculation.rewards.levels} levels, ${result.calculation.rewards.coins} coins` }
          );
        }

        // Send success message
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true
        });

        // Clean up temporary data
        delete global.tempSubmissionData[interaction.user.id];
      } else {
        await interaction.followUp({
          content: `Error: ${result.error || 'Unknown error'}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error processing prompt submission:', error);
      await interaction.followUp({
        content: 'An error occurred while processing your submission. Please try again later.',
        ephemeral: true
      });
    }
  }

  /**
   * Format art type for display
   * @param {string} type - Art type
   * @returns {string} - Formatted art type
   * @private
   */
  static _formatArtType(type) {
    switch (type) {
      case 'sketch':
        return 'Sketch';
      case 'sketch_set':
        return 'Sketch Set';
      case 'line_art':
        return 'Line Art';
      case 'rendered':
        return 'Rendered';
      case 'polished':
        return 'Polished';
      case 'manual':
        return 'Manual Entry';
      case 'external':
        return 'External Artwork';
      case 'simple':
        return 'Simple Calculator';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  /**
   * Format prompt type for display
   * @param {string} type - Prompt type
   * @returns {string} - Formatted prompt type
   * @private
   */
  static _formatPromptType(type) {
    switch (type) {
      case 'general':
        return 'General';
      case 'progression':
        return 'Trainer Progression';
      case 'legendary':
        return 'Legendary';
      case 'event':
        return 'Event';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  /**
   * Fetch prompts by type
   * @param {string} type - Prompt type
   * @returns {Promise<Array>} - Array of prompts
   * @private
   */
  static async _fetchPromptsByType(type) {
    try {
      console.log(`Fetching prompts for type: ${type}`);

      // Map the type to the category in the database
      const categoryMap = {
        'general': 'general',
        'progression': 'progression',
        'legendary': 'legendary',
        'monthly': 'monthly',
        'event': 'event'
      };

      const category = categoryMap[type] || 'general';
      console.log(`Mapped type ${type} to category ${category}`);

      // Fetch prompts from the database
      let prompts = await getPromptsByCategory(category);

      // Log the result of the database query
      if (prompts && prompts.length > 0) {
        console.log(`Successfully retrieved ${prompts.length} prompts from database for category ${category}`);
        // Return the prompts from the database
        return prompts;
      }

      // If we get here, no prompts were found in the database
      console.log(`No prompts found in database for category ${category}. This is likely a database connection issue.`);
      console.log('Please check that the prompt_templates table exists and contains data.');
      console.log('Returning empty array to prevent fallback prompts from being used.');

      // Return an empty array instead of using fallback prompts
      // This will make it clear there's a database issue that needs to be fixed
      return [];
    } catch (error) {
      console.error('Error fetching prompts by type:', error);
      console.log('Database error occurred. Please check the database connection and schema.');
      return [];
    }
  }

  /**
   * Get month name from month number
   * @param {number} month - Month number (1-12)
   * @returns {string} - Month name
   * @private
   */
  static _getMonthName(month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  }

  /**
   * Fetch prompt by ID
   * @param {string} promptId - Prompt ID
   * @returns {Promise<Object>} - Prompt object
   * @private
   */
  static async _fetchPromptById(promptId) {
    try {
      console.log(`Fetching prompt by ID: ${promptId}`);

      // Fetch the prompt from the database
      const prompt = await getPromptById(promptId);

      if (prompt) {
        console.log(`Found prompt with ID ${promptId}:`, prompt);
        return prompt;
      }

      console.log(`No prompt found in database with ID ${promptId}.`);
      console.log('This is likely a database connection issue or the prompt does not exist.');
      console.log('Please check that the prompt_templates table exists and contains the requested prompt.');

      return null;
    } catch (error) {
      console.error('Error fetching prompt by ID:', error);
      console.log('Database error occurred. Please check the database connection and schema.');
      return null;
    }
  }
}

module.exports = SubmissionSelectHandler;
