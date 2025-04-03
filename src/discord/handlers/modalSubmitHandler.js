const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const FormHandler = require('./formHandler');
const SubmissionFormHandler = require('./submissionFormHandler');
const TrainerService = require('../../services/TrainerService');
const MonsterService = require('../../utils/MonsterService');
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');

/**
 * Handler for modal submit interactions
 */
class ModalSubmitHandler {
  /**
   * Handle monster naming modal
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @param {string} modalId - Modal ID
   * @returns {Promise<void>}
   * @private
   */
  static async _handleMonsterNamingModal(interaction, modalId) {
    try {
      // Extract roll ID and trainer ID from modal ID
      // Format: name_monster_ROLLID_TRAINERID
      const parts = modalId.split('_');
      const rollId = parts[2];
      const trainerId = parts[3];

      // Get the monster name from the form
      const monsterName = interaction.fields.getTextInputValue('monster_name');

      // Get the rolled monster from the client
      if (!interaction.client.rolledMonsters || !interaction.client.rolledMonsters.has(rollId)) {
        return await interaction.reply({
          content: 'This monster is no longer available to claim.',
          ephemeral: true
        });
      }

      // Get the monster data
      const { monsterData } = interaction.client.rolledMonsters.get(rollId);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.reply({
          content: 'Trainer not found.',
          ephemeral: true
        });
      }

      // Claim the monster
      const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);

      // Remove the rolled monster from the session
      interaction.client.rolledMonsters.delete(rollId);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Claimed')
        .setDescription(`${trainer.name} claimed ${monsterName}!`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Species', value: [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/'), inline: true },
          { name: 'Types', value: [monster.type1, monster.type2, monster.type3].filter(Boolean).join(', ') || 'None', inline: true },
          { name: 'Attribute', value: monster.attribute || 'None', inline: true },
          { name: 'Level', value: monster.level.toString(), inline: true },
          { name: 'ID', value: monster.mon_id.toString(), inline: true }
        );

      // Reply with the embed
      await interaction.reply({
        embeds: [embed],
        ephemeral: false
      });
    } catch (error) {
      console.error('Error handling monster naming modal:', error);
      await interaction.reply({
        content: 'An error occurred while claiming the monster.',
        ephemeral: true
      });
    }
  }

  /**
   * Handle modal submit interaction
   * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
   * @returns {Promise<void>}
   */
  static async handleModalSubmit(interaction) {
    try {
      // Get the modal ID
      const modalId = interaction.customId;

      // Handle different modal submissions
      if (modalId.startsWith('add_task_form_')) {
        await FormHandler.handleTaskFormSubmit(interaction);
      } else if (modalId.startsWith('add_habit_form_')) {
        await FormHandler.handleHabitFormSubmit(interaction);
      }
      // Handle submission forms
      else if (modalId.startsWith('writing_submission_form_')) {
        await SubmissionFormHandler.handleWritingSubmissionFormSubmit(interaction);
      } else if (modalId.startsWith('art_submission_form_')) {
        await SubmissionFormHandler.handleArtSubmissionFormSubmit(interaction);
      } else if (modalId.startsWith('reference_submission_form_')) {
        await SubmissionFormHandler.handleReferenceSubmissionFormSubmit(interaction);
      } else if (modalId.startsWith('prompt_url_form_')) {
        await SubmissionFormHandler.handlePromptUrlFormSubmit(interaction);
      } else if (modalId.startsWith('reference_monster_modal_')) {
        // Handle monster reference modal (second step after initial reference submission)
        const userId = modalId.split('_').pop();
        const monsterName = interaction.fields.getTextInputValue('monster_name');

        // Get the stored submission data
        const submissionData = global.tempSubmissionData?.[userId];
        if (!submissionData) {
          await interaction.reply({
            content: 'Your submission data was not found. Please try again.',
            ephemeral: true
          });
          return;
        }
      } else if (modalId.startsWith('name_monster_')) {
        // Handle monster naming modal
        await this._handleMonsterNamingModal(interaction, modalId);
        return;
      } else if (modalId.startsWith('reference_monster_modal_')) {
        // For reference_monster_modal handling
        const userId = modalId.split('_').pop();
        const monsterName = interaction.fields.getTextInputValue('monster_name');

        // Get the stored submission data
        const submissionData = global.tempSubmissionData?.[userId];
        if (!submissionData) {
          await interaction.reply({
            content: 'Your submission data was not found. Please try again.',
            ephemeral: true
          });
          return;
        }

        // Store the monster name
        submissionData.monsterName = monsterName;

        // Get user's trainers
        const trainers = await TrainerService.getTrainersByDiscordId(interaction.user.id);

        if (!trainers || trainers.length === 0) {
          await interaction.reply({
            content: 'You don\'t have any trainers. Please create a trainer first.',
            ephemeral: true
          });
          return;
        }

        // Now show trainer selection for the monster's trainer
        await interaction.reply({
          content: 'Please select the trainer that owns this monster:',
          components: [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`reference_trainer_select_${userId}`)
                .setPlaceholder('Select a trainer')
                .addOptions(
                  trainers.map(trainer =>
                    new StringSelectMenuOptionBuilder()
                      .setLabel(trainer.name)
                      .setValue(trainer.id.toString())
                  )
                )
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`reference_submit_${userId}`)
                .setLabel('Submit')
                .setStyle(ButtonStyle.Success)
            )
          ],
          ephemeral: true
        });
      } else {
        // Unknown modal ID
        await interaction.reply({
          content: `Unknown modal ID: ${modalId}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error handling modal submit:', error);
      try {
        await interaction.reply({
          content: `There was an error processing your submission. Please try again later.`,
          ephemeral: true
        });
      } catch (replyError) {
        console.error('Error sending reply:', replyError);
      }
    }
  }
}

module.exports = ModalSubmitHandler;
