const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const TrainerService = require('../../services/TrainerService');
const SubmissionService = require('../services/SubmissionService');
const { getPromptById } = require('../../../database/helpers/promptHelpers');

/**
 * Handler for submission forms
 */
class SubmissionFormHandler {
  /**
   * Create a writing submission form
   * @param {string} userId - Discord user ID
   * @param {string} type - Writing type (game or external)
   * @returns {Modal} - Discord modal
   */
  static createWritingSubmissionForm(userId, type) {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId(`writing_submission_form_${type}_${userId}`)
      .setTitle(`${type === 'game' ? 'Game' : 'External'} Writing Submission`);

    // Create title input
    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the title of your writing')
      .setRequired(true);

    // Create URL input
    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Writing URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the URL to your writing (e.g., Google Docs, AO3)')
      .setRequired(true);

    // Create word count input
    const wordCountInput = new TextInputBuilder()
      .setCustomId('word_count')
      .setLabel('Word Count')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the word count')
      .setRequired(true);

    // Create difficulty modifier input
    const difficultyInput = new TextInputBuilder()
      .setCustomId('difficulty')
      .setLabel('Difficulty Modifier (1, 1.5, or 2)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('1 = Standard, 1.5 = Challenging, 2 = Difficult')
      .setValue('1')
      .setRequired(true);

    // Create notes input
    const notesInput = new TextInputBuilder()
      .setCustomId('notes')
      .setLabel('Notes (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter any additional notes')
      .setRequired(false);

    // Add inputs to modal
    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(urlInput),
      new ActionRowBuilder().addComponents(wordCountInput),
      new ActionRowBuilder().addComponents(difficultyInput),
      new ActionRowBuilder().addComponents(notesInput)
    );

    return modal;
  }

  /**
   * Create an art submission form
   * @param {string} userId - Discord user ID
   * @param {string} type - Art type (manual, external, simple)
   * @returns {Modal} - Discord modal
   */
  static createArtSubmissionForm(userId, type) {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId(`art_submission_form_${type}_${userId}`)
      .setTitle(`Art Submission - ${this._formatArtType(type)}`);

    // Create title input
    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the title of your artwork')
      .setRequired(true);

    // Create URL input
    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Artwork URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the URL to your artwork')
      .setRequired(true);

    // Create art type input for simple calculator
    let artTypeInput, levelsInput;

    if (type === 'simple') {
      artTypeInput = new TextInputBuilder()
        .setCustomId('art_type')
        .setLabel('Art Type')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('sketch, sketch_set, line_art, rendered, polished')
        .setRequired(true);
    } else if (type === 'manual') {
      levelsInput = new TextInputBuilder()
        .setCustomId('levels')
        .setLabel('Levels to Award')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the number of levels to award')
        .setRequired(true);
    }

    // Create notes input
    const notesInput = new TextInputBuilder()
      .setCustomId('notes')
      .setLabel('Notes (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter any additional notes')
      .setRequired(false);

    // Add inputs to modal
    const components = [
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(urlInput)
    ];

    if (type === 'simple') {
      components.push(new ActionRowBuilder().addComponents(artTypeInput));
    } else if (type === 'manual') {
      components.push(new ActionRowBuilder().addComponents(levelsInput));
    }

    components.push(new ActionRowBuilder().addComponents(notesInput));

    modal.addComponents(...components);

    return modal;
  }

  /**
   * Create a reference submission form
   * @param {string} userId - Discord user ID
   * @param {string} type - Reference type (trainer or monster)
   * @returns {Modal} - Discord modal
   */
  static createReferenceSubmissionForm(userId, type) {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId(`reference_submission_form_${type}_${userId}`)
      .setTitle(`${type === 'trainer' ? 'Trainer' : 'Monster'} Reference Submission`);

    // Create URL input
    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Reference URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the URL to your reference image')
      .setRequired(true);

    // Create notes input
    const notesInput = new TextInputBuilder()
      .setCustomId('notes')
      .setLabel('Notes (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter any additional notes')
      .setRequired(false);

    // Add inputs to modal
    modal.addComponents(
      new ActionRowBuilder().addComponents(urlInput),
      new ActionRowBuilder().addComponents(notesInput)
    );

    return modal;
  }

  /**
   * Create a prompt URL submission form
   * @param {string} userId - Discord user ID
   * @param {string} promptId - Prompt ID
   * @param {string} trainerId - Trainer ID
   * @returns {Modal} - Discord modal
   */
  static createPromptUrlForm(userId, promptId, trainerId) {
    // Create modal
    const modal = new ModalBuilder()
      .setCustomId(`prompt_url_form_${promptId}_${trainerId}_${userId}`)
      .setTitle('Prompt Submission');

    // Create URL input
    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Submission URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter the URL to your prompt submission')
      .setRequired(true);

    // Create notes input
    const notesInput = new TextInputBuilder()
      .setCustomId('notes')
      .setLabel('Notes (Optional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter any additional notes')
      .setRequired(false);

    // Add inputs to modal
    modal.addComponents(
      new ActionRowBuilder().addComponents(urlInput),
      new ActionRowBuilder().addComponents(notesInput)
    );

    return modal;
  }

  /**
   * Handle writing submission form submit
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleWritingSubmissionFormSubmit(interaction) {
    try {
      // Defer reply to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Get form data
      const customId = interaction.customId;
      const type = customId.includes('_game_') ? 'game' : 'external';
      const title = interaction.fields.getTextInputValue('title');
      const url = interaction.fields.getTextInputValue('url');
      const wordCount = parseInt(interaction.fields.getTextInputValue('word_count'));
      const difficultyModifier = parseFloat(interaction.fields.getTextInputValue('difficulty'));
      const notes = interaction.fields.getTextInputValue('notes');

      // Validate inputs
      if (isNaN(wordCount) || wordCount <= 0) {
        await interaction.editReply({ content: 'Word count must be a positive number.' });
        return;
      }

      if (![1, 1.5, 2].includes(difficultyModifier)) {
        await interaction.editReply({ content: 'Difficulty modifier must be 1, 1.5, or 2.' });
        return;
      }

      // Get user's trainers
      const trainers = await TrainerService.getTrainersByDiscordId(interaction.user.id);

      if (!trainers || trainers.length === 0) {
        await interaction.editReply({ content: 'You don\'t have any trainers. Please create a trainer first.' });
        return;
      }

      // Create trainer selection menu
      const trainerSelect = new StringSelectMenuBuilder()
        .setCustomId(`writing_trainer_select_${interaction.user.id}`)
        .setPlaceholder('Select a trainer to receive rewards')
        .addOptions(
          trainers.map(trainer =>
            new StringSelectMenuOptionBuilder()
              .setLabel(trainer.name)
              .setValue(trainer.id.toString())
          )
        );

      // Create buttons for gift option
      const giftButton = new ButtonBuilder()
        .setCustomId(`writing_gift_${interaction.user.id}`)
        .setLabel('Mark as Gift')
        .setStyle(ButtonStyle.Secondary);

      const submitButton = new ButtonBuilder()
        .setCustomId(`writing_submit_${interaction.user.id}`)
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);

      // Store submission data in temporary storage
      // In a real implementation, you would use a database or cache
      global.tempSubmissionData = global.tempSubmissionData || {};
      global.tempSubmissionData[interaction.user.id] = {
        type: 'writing',
        writingType: type,
        title,
        url,
        wordCount,
        difficultyModifier,
        notes,
        isGift: false
      };

      // Send trainer selection message
      await interaction.editReply({
        content: 'Please select a trainer to receive the rewards:',
        components: [
          new ActionRowBuilder().addComponents(trainerSelect),
          new ActionRowBuilder().addComponents(giftButton, submitButton)
        ]
      });
    } catch (error) {
      console.error('Error handling writing submission form:', error);
      await interaction.editReply({ content: 'An error occurred while processing your submission. Please try again later.' });
    }
  }

  /**
   * Handle art submission form submit
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleArtSubmissionFormSubmit(interaction) {
    try {
      // Defer reply to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Get form data
      const customId = interaction.customId;
      const type = customId.includes('_manual_') ? 'manual' :
                  customId.includes('_external_') ? 'external' : 'simple';
      const title = interaction.fields.getTextInputValue('title');
      const url = interaction.fields.getTextInputValue('url');
      const notes = interaction.fields.getTextInputValue('notes');

      let artType, levels;

      if (type === 'simple') {
        artType = interaction.fields.getTextInputValue('art_type');
        // Validate art type
        const validArtTypes = ['sketch', 'sketch_set', 'line_art', 'rendered', 'polished'];
        if (!validArtTypes.includes(artType)) {
          await interaction.editReply({
            content: `Invalid art type. Please use one of: ${validArtTypes.join(', ')}.`
          });
          return;
        }
      } else if (type === 'manual') {
        levels = parseInt(interaction.fields.getTextInputValue('levels'));
        // Validate levels
        if (isNaN(levels) || levels <= 0) {
          await interaction.editReply({ content: 'Levels must be a positive number.' });
          return;
        }
      }

      // Get user's trainers
      const trainers = await TrainerService.getTrainersByDiscordId(interaction.user.id);

      if (!trainers || trainers.length === 0) {
        await interaction.editReply({ content: 'You don\'t have any trainers. Please create a trainer first.' });
        return;
      }

      // Create trainer selection menu
      const trainerSelect = new StringSelectMenuBuilder()
        .setCustomId(`art_trainer_select_${interaction.user.id}`)
        .setPlaceholder('Select a trainer to receive rewards')
        .addOptions(
          trainers.map(trainer =>
            new StringSelectMenuOptionBuilder()
              .setLabel(trainer.name)
              .setValue(trainer.id.toString())
          )
        );

      // Create buttons for gift option
      const giftButton = new ButtonBuilder()
        .setCustomId(`art_gift_${interaction.user.id}`)
        .setLabel('Mark as Gift')
        .setStyle(ButtonStyle.Secondary);

      const submitButton = new ButtonBuilder()
        .setCustomId(`art_submit_${interaction.user.id}`)
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);

      // Store submission data in temporary storage
      global.tempSubmissionData = global.tempSubmissionData || {};
      global.tempSubmissionData[interaction.user.id] = {
        type: 'art',
        artType: type,
        specificArtType: artType,
        title,
        url,
        levels,
        notes,
        isGift: false
      };

      // Send trainer selection message
      await interaction.editReply({
        content: 'Please select a trainer to receive the rewards:',
        components: [
          new ActionRowBuilder().addComponents(trainerSelect),
          new ActionRowBuilder().addComponents(giftButton, submitButton)
        ]
      });
    } catch (error) {
      console.error('Error handling art submission form:', error);
      await interaction.editReply({ content: 'An error occurred while processing your submission. Please try again later.' });
    }
  }

  /**
   * Handle reference submission form submit
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleReferenceSubmissionFormSubmit(interaction) {
    try {
      // Defer reply to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Get form data
      const customId = interaction.customId;
      const type = customId.includes('_trainer_') ? 'trainer' : 'monster';
      const url = interaction.fields.getTextInputValue('url');
      const notes = interaction.fields.getTextInputValue('notes');

      // Get user's trainers
      const trainers = await TrainerService.getTrainersByDiscordId(interaction.user.id);

      if (!trainers || trainers.length === 0) {
        await interaction.editReply({ content: 'You don\'t have any trainers. Please create a trainer first.' });
        return;
      }

      // Create trainer selection menu
      const trainerSelect = new StringSelectMenuBuilder()
        .setCustomId(`reference_trainer_select_${interaction.user.id}`)
        .setPlaceholder('Select a trainer')
        .addOptions(
          trainers.map(trainer =>
            new StringSelectMenuOptionBuilder()
              .setLabel(trainer.name)
              .setValue(trainer.id.toString())
          )
        );

      // If monster reference, we'll need a monster name input
      let monsterNameInput;
      if (type === 'monster') {
        monsterNameInput = new TextInputBuilder()
          .setCustomId('monster_name')
          .setLabel('Monster Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter the name of your monster')
          .setRequired(true);
      }

      const submitButton = new ButtonBuilder()
        .setCustomId(`reference_submit_${interaction.user.id}`)
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);

      // Store submission data in temporary storage
      global.tempSubmissionData = global.tempSubmissionData || {};
      global.tempSubmissionData[interaction.user.id] = {
        type: 'reference',
        referenceType: type,
        url,
        notes
      };

      // Send trainer selection message
      if (type === 'trainer') {
        await interaction.editReply({
          content: 'Please select the trainer for this reference:',
          components: [
            new ActionRowBuilder().addComponents(trainerSelect),
            new ActionRowBuilder().addComponents(submitButton)
          ]
        });
      } else {
        // For monster references, we need to create a new modal for the monster name
        const monsterModal = new ModalBuilder()
          .setCustomId(`reference_monster_modal_${interaction.user.id}`)
          .setTitle('Monster Reference Details');

        monsterModal.addComponents(
          new ActionRowBuilder().addComponents(monsterNameInput)
        );

        // Show the monster modal
        await interaction.showModal(monsterModal);
      }
    } catch (error) {
      console.error('Error handling reference submission form:', error);
      await interaction.editReply({ content: 'An error occurred while processing your submission. Please try again later.' });
    }
  }

  /**
   * Handle prompt URL form submit
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @returns {Promise<void>}
   */
  static async handlePromptUrlFormSubmit(interaction) {
    try {
      // Defer reply to prevent timeout
      await interaction.deferReply({ ephemeral: true });

      // Get form data
      const customId = interaction.customId;
      const parts = customId.split('_');
      const promptId = parts[3];
      const trainerId = parts[4];
      const userId = parts[5];

      const url = interaction.fields.getTextInputValue('url');
      const notes = interaction.fields.getTextInputValue('notes');

      // Get the stored submission data
      const submissionData = global.tempSubmissionData?.[userId];
      if (!submissionData) {
        await interaction.editReply({ content: 'Your submission data was not found. Please try again.' });
        return;
      }

      // Update submission data
      submissionData.url = url;
      submissionData.notes = notes;
      submissionData.promptId = promptId;
      submissionData.trainerId = trainerId;

      // Get trainer details
      const trainer = await TrainerService.getTrainerById(trainerId);
      if (!trainer) {
        await interaction.editReply({ content: 'Selected trainer not found. Please try again.' });
        return;
      }

      // Get prompt details
      const prompt = await getPromptById(promptId);
      if (!prompt) {
        await interaction.editReply({ content: 'Selected prompt not found. Please try again.' });
        return;
      }

      // Process the submission
      const result = await SubmissionService.processPromptSubmission({
        promptId,
        trainerId,
        submissionUrl: url
      });

      if (result.success) {
        // Create success embed
        const embed = new DiscordEmbedBuilder()
          .setTitle('Prompt Submission Successful')
          .setDescription(`Your prompt submission has been processed successfully!`)
          .setColor('#2ecc71')
          .addFields(
            { name: 'Prompt', value: prompt.title, inline: false },
            { name: 'Trainer', value: trainer.name, inline: true }
          )
          .setTimestamp();

        // If there are rewards, add them to the embed
        if (prompt.rewards) {
          embed.addFields(
            { name: 'Rewards', value: `${prompt.rewards.levels} levels, ${prompt.rewards.coins} coins`, inline: true }
          );
        }

        // Send success message
        await interaction.editReply({
          content: null,
          embeds: [embed],
          components: []
        });

        // Clean up temporary data
        delete global.tempSubmissionData[userId];
      } else {
        await interaction.editReply({
          content: `Error: ${result.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Error handling prompt URL form:', error);
      await interaction.editReply({ content: 'An error occurred while processing your submission. Please try again later.' });
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
      case 'manual':
        return 'Manual Level Entry';
      case 'external':
        return 'External Artwork';
      case 'simple':
        return 'Simple Art Calculator';
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
}

module.exports = SubmissionFormHandler;
