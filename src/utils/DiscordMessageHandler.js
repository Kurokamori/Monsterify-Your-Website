const pool = require('../db');
const Adventure = require('../models/Adventure');
const AdventureParticipant = require('../models/AdventureParticipant');
const Encounter = require('../models/Encounter');
const Area = require('../models/Area');
const Trainer = require('../models/Trainer');
const DiscordService = require('./DiscordService');
const DiscordServiceAlt = require('./DiscordServiceAlt');

class DiscordMessageHandler {
  /**
   * Process a Discord message for adventure tracking
   * @param {Object} message - Discord message object
   * @returns {Promise<Object>} - Processing result
   */
  static async processMessage(message) {
    try {
      // Skip messages from bots
      if (message.author.bot) {
        return { success: true, skipped: true, reason: 'Bot message' };
      }

      // Find the adventure by thread ID
      const adventure = await this._findAdventureByThreadId(message.channel_id);

      if (!adventure) {
        return { success: true, skipped: true, reason: 'Not in an adventure thread' };
      }

      // Check if the adventure is active
      if (adventure.status !== 'active') {
        return { success: true, skipped: true, reason: 'Adventure is not active' };
      }

      // Check for command messages
      if (message.content.toLowerCase().trim() === 'next') {
        return await this._handleNextCommand(adventure, message);
      }

      if (message.content.toLowerCase().trim() === 'end') {
        // Only the adventure starter can end the adventure
        if (message.author.id === adventure.starter_user_id) {
          return await this._handleEndCommand(adventure, message);
        } else {
          // Send a message that only the starter can end the adventure
          await this._sendMessage(adventure.thread_id, `Only <@${adventure.starter_user_id}> can end this adventure.`);
          return { success: true, command: 'end', allowed: false };
        }
      }

      // Process regular message
      return await this._processRegularMessage(adventure, message);
    } catch (error) {
      console.error('Error processing Discord message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find an adventure by thread ID
   * @param {string} threadId - Discord thread ID
   * @returns {Promise<Object|null>} - Adventure object or null if not found
   * @private
   */
  static async _findAdventureByThreadId(threadId) {
    try {
      const query = `
        SELECT a.*, ar.name as area_name, ar.image_url as area_image, ar.difficulty,
               r.name as region_name, r.image_url as region_image
        FROM adventures a
        LEFT JOIN areas ar ON a.area_id = ar.area_id
        LEFT JOIN regions r ON ar.region_id = r.region_id
        WHERE a.thread_id = $1
      `;

      const result = await pool.query(query, [threadId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error finding adventure by thread ID ${threadId}:`, error);
      return null;
    }
  }

  /**
   * Handle the 'next' command
   * @param {Object} adventure - Adventure object
   * @param {Object} message - Discord message object
   * @returns {Promise<Object>} - Command result
   * @private
   */
  static async _handleNextCommand(adventure, message) {
    try {
      // Get a random encounter for the area
      let encounter = null;

      if (adventure.area_id) {
        // Get area difficulty
        const area = await Area.getById(adventure.area_id);
        const difficulty = area ? area.difficulty || 'normal' : 'normal';

        // Determine rarity based on difficulty
        let rarity = null;
        const rarityRoll = Math.random() * 100;

        if (difficulty === 'easy') {
          // Easy areas have more common encounters
          if (rarityRoll < 80) rarity = 'common';
          else if (rarityRoll < 95) rarity = 'uncommon';
          else rarity = 'rare';
        } else if (difficulty === 'normal') {
          // Normal areas have balanced encounters
          if (rarityRoll < 60) rarity = 'common';
          else if (rarityRoll < 90) rarity = 'uncommon';
          else rarity = 'rare';
        } else if (difficulty === 'hard') {
          // Hard areas have more uncommon and rare encounters
          if (rarityRoll < 40) rarity = 'common';
          else if (rarityRoll < 80) rarity = 'uncommon';
          else rarity = 'rare';
        } else if (difficulty === 'expert') {
          // Expert areas have mostly uncommon and rare encounters
          if (rarityRoll < 20) rarity = 'common';
          else if (rarityRoll < 70) rarity = 'uncommon';
          else rarity = 'rare';
        }

        // Try to get an encounter of the determined rarity
        encounter = await Encounter.getRandomForArea(adventure.area_id, rarity);

        // If no encounter of that rarity is found, get any encounter
        if (!encounter) {
          encounter = await Encounter.getRandomForArea(adventure.area_id);
        }
      }

      // If no encounter is found or this is a custom adventure, create a generic encounter
      if (!encounter) {
        const genericEncounters = [
          { type: 'monster', content: 'You encounter a wild monster! It seems curious about you.' },
          { type: 'npc', content: 'A traveler approaches your group. They seem friendly and offer to share some information.' },
          { type: 'obstacle', content: 'Your path is blocked by a fallen tree. You\'ll need to find a way around or over it.' },
          { type: 'treasure', content: 'You discover a small cache of items hidden nearby. It might contain something valuable!' },
          { type: 'weather', content: 'The weather suddenly changes, making your journey more challenging.' }
        ];

        encounter = genericEncounters[Math.floor(Math.random() * genericEncounters.length)];
      }

      // Create an embed for the encounter
      const embedData = {
        title: `Random Encounter: ${this._capitalizeFirstLetter(encounter.type || 'Event')}`,
        description: encounter.content,
        color: this._getColorForEncounterType(encounter.type),
        fields: []
      };

      if (encounter.rarity) {
        embedData.fields.push({
          name: 'Rarity',
          value: this._capitalizeFirstLetter(encounter.rarity),
          inline: true
        });
      }

      if (adventure.area_name) {
        embedData.fields.push({
          name: 'Location',
          value: adventure.area_name,
          inline: true
        });
      }

      // Send the encounter as an embed
      try {
        await DiscordService.sendEmbed(adventure.thread_id, embedData);
      } catch (error) {
        // If sending the embed fails, send as a regular message
        const rarityText = encounter.rarity ? `\n**Rarity:** ${this._capitalizeFirstLetter(encounter.rarity)}` : '';
        const locationText = adventure.area_name ? `\n**Location:** ${adventure.area_name}` : '';

        await this._sendMessage(
          adventure.thread_id,
          `**Random Encounter: ${this._capitalizeFirstLetter(encounter.type || 'Event')}**\n\n${encounter.content}${rarityText}${locationText}`
        );
      }

      // Track the command usage
      await AdventureParticipant.addParticipation(
        adventure.adventure_id,
        message.author.id,
        1,
        0 // No words counted for commands
      );

      return { success: true, command: 'next', encounter };
    } catch (error) {
      console.error('Error handling next command:', error);
      await this._sendMessage(adventure.thread_id, 'Error generating a random encounter. Please try again.');
      return { success: false, command: 'next', error: error.message };
    }
  }

  /**
   * Handle the 'end' command
   * @param {Object} adventure - Adventure object
   * @param {Object} message - Discord message object
   * @returns {Promise<Object>} - Command result
   * @private
   */
  static async _handleEndCommand(adventure, message) {
    try {
      // Send a message that the adventure is ending
      await this._sendMessage(adventure.thread_id, 'Ending the adventure and calculating rewards...');

      // Calculate rewards for all participants
      const participants = await AdventureParticipant.calculateRewards(adventure.adventure_id);

      // Create a summary embed
      const embedData = {
        title: 'Adventure Completed!',
        description: `The adventure in ${adventure.area_name || 'the unknown'} has concluded.`,
        color: 0x9b59b6, // Purple color
        fields: [
          {
            name: 'Duration',
            value: `${this._calculateDuration(adventure.started_at)}`,
            inline: true
          },
          {
            name: 'Started By',
            value: `<@${adventure.starter_user_id}>`,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: `Adventure ID: ${adventure.adventure_id}`
        }
      };

      // Add participant rewards to the embed
      if (participants.length > 0) {
        embedData.fields.push({
          name: 'Participant Rewards',
          value: participants.map(p =>
            `<@${p.user_id}>: ${p.word_count} words, ${p.levels_earned} levels, ${p.coins_earned} coins`
          ).join('\\n'),
          inline: false
        });

        // Add instructions for claiming rewards
        embedData.fields.push({
          name: 'Claim Your Rewards',
          value: 'Use the `/claim` command to distribute your earned levels to your trainers and monsters.',
          inline: false
        });
      } else {
        embedData.fields.push({
          name: 'Participant Rewards',
          value: 'No participants recorded for this adventure.',
          inline: false
        });
      }

      // Send the summary embed
      try {
        await DiscordService.sendEmbed(adventure.thread_id, embedData);
      } catch (error) {
        // If sending the embed fails, send as a regular message
        const participantsText = participants.length > 0
          ? `\\n\\n**Participant Rewards:**\\n${participants.map(p =>
              `<@${p.user_id}>: ${p.word_count} words, ${p.levels_earned} levels, ${p.coins_earned} coins`
            ).join('\\n')}`
          : '\\n\\n**Participant Rewards:**\\nNo participants recorded for this adventure.';

        const claimText = participants.length > 0
          ? '\\n\\n**Claim Your Rewards:**\\nUse the `/claim` command to distribute your earned levels to your trainers and monsters.'
          : '';

        await this._sendMessage(
          adventure.thread_id,
          `**Adventure Completed!**\\n\\nThe adventure in ${adventure.area_name || 'the unknown'} has concluded.\\n\\n**Duration:** ${this._calculateDuration(adventure.started_at)}\\n**Started By:** <@${adventure.starter_user_id}>${participantsText}${claimText}\\n\\nAdventure ID: ${adventure.adventure_id}`
        );
      }

      // End the adventure in the database
      await Adventure.end(adventure.adventure_id);

      return {
        success: true,
        command: 'end',
        participants,
        totalLevels: participants.reduce((sum, p) => sum + p.levels_earned, 0),
        totalCoins: participants.reduce((sum, p) => sum + p.coins_earned, 0)
      };
    } catch (error) {
      console.error('Error handling end command:', error);
      await this._sendMessage(adventure.thread_id, 'Error ending the adventure. Please try again.');
      return { success: false, command: 'end', error: error.message };
    }
  }

  /**
   * Process a regular message
   * @param {Object} adventure - Adventure object
   * @param {Object} message - Discord message object
   * @returns {Promise<Object>} - Processing result
   * @private
   */
  static async _processRegularMessage(adventure, message) {
    try {
      // Count words in the message
      const wordCount = this._countWords(message.content);

      // Add participation record
      await AdventureParticipant.addParticipation(
        adventure.adventure_id,
        message.author.id,
        1, // One message
        wordCount
      );

      return {
        success: true,
        messageProcessed: true,
        userId: message.author.id,
        wordCount,
        adventure: adventure.adventure_id
      };
    } catch (error) {
      console.error('Error processing regular message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Count words in a string
   * @param {string} text - Text to count words in
   * @returns {number} - Word count
   * @private
   */
  static _countWords(text) {
    if (!text) return 0;

    // Remove URLs
    const textWithoutUrls = text.replace(/https?:\/\/\S+/g, '');

    // Remove Discord mentions, emojis, and other non-word characters
    const cleanText = textWithoutUrls.replace(/<[@#!&][^>]+>|:[^:]+:|[^\w\s]/g, '');

    // Split by whitespace and filter out empty strings
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);

    return words.length;
  }

  /**
   * Calculate duration between a start date and now
   * @param {string|Date} startDate - Start date
   * @returns {string} - Formatted duration
   * @private
   */
  static _calculateDuration(startDate) {
    const start = new Date(startDate);
    const end = new Date();

    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get color for encounter type
   * @param {string} type - Encounter type
   * @returns {number} - Color as a decimal number
   * @private
   */
  static _getColorForEncounterType(type) {
    switch (type?.toLowerCase()) {
      case 'monster':
        return 0xf44336; // Red
      case 'npc':
        return 0x4caf50; // Green
      case 'obstacle':
        return 0xff9800; // Orange
      case 'treasure':
        return 0xffc107; // Amber
      case 'weather':
        return 0x2196f3; // Blue
      default:
        return 0x9c27b0; // Purple
    }
  }

  /**
   * Capitalize the first letter of a string
   * @param {string} string - String to capitalize
   * @returns {string} - Capitalized string
   * @private
   */
  static _capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Send a message to a Discord channel or thread
   * @param {string} channelId - Discord channel or thread ID
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Sent message data
   * @private
   */
  static async _sendMessage(channelId, message) {
    try {
      return await DiscordService.sendMessage(channelId, message);
    } catch (error) {
      console.error('Error sending message with primary service:', error);
      return await DiscordServiceAlt.sendMessage(channelId, message);
    }
  }
}

module.exports = DiscordMessageHandler;
