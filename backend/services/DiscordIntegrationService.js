const axios = require('axios');

class DiscordIntegrationService {
  constructor() {
    this.discordBotUrl = process.env.DISCORD_BOT_URL || 'http://localhost:3002';
    this.defaultChannelId = process.env.DEFAULT_ADVENTURE_CHANNEL_ID;
    this.websiteUrl = process.env.NODE_ENV === 'production'
      ? 'https://duskanddawn.net'
      : (process.env.WEBSITE_URL || 'http://localhost:4890');
  }

  /**
   * Create a Discord thread for an adventure
   * @param {Object} adventure - Adventure data
   * @param {string} emoji - Emoji for thread name (default: 🗡️)
   * @param {string} channelId - Discord channel ID (optional, uses default if not provided)
   * @returns {Promise<Object>} Thread creation result
   */
  async createAdventureThread(adventure, emoji = '🗡️', channelId = null) {
    try {
      const targetChannelId = channelId || this.defaultChannelId;
      
      if (!targetChannelId) {
        console.warn('No Discord channel ID provided for adventure thread creation');
        return {
          success: false,
          message: 'No Discord channel configured'
        };
      }

      // Use Discord.js REST API directly instead of bot endpoint
      const { Client, GatewayIntentBits } = require('discord.js');
      
      // Create a temporary Discord client for thread creation
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      // Login and create thread
      await client.login(process.env.DISCORD_BOT_TOKEN);
      
      const channel = await client.channels.fetch(targetChannelId);
      if (!channel) {
        throw new Error(`Channel ${targetChannelId} not found`);
      }

      // Create thread
      const thread = await channel.threads.create({
        name: `${emoji} ${adventure.title}`,
        autoArchiveDuration: 10080, // 7 days
        reason: `Adventure thread for: ${adventure.title}`
      });

      // Generate area-specific welcome message
      const welcomeMessage = await this.generateWelcomeMessage(adventure);

      await thread.send(welcomeMessage);

      // Store thread information in database
      const AdventureThread = require('../models/AdventureThread');
      await AdventureThread.create({
        adventure_id: adventure.id,
        discord_thread_id: thread.id,
        discord_channel_id: targetChannelId,
        thread_name: thread.name
      });

      // Update adventure with Discord thread info
      const Adventure = require('../models/Adventure');
      await Adventure.update(adventure.id, {
        discord_thread_id: thread.id,
        discord_channel_id: targetChannelId
      });

      // Cleanup - destroy the client
      await client.destroy();

      console.log(`✅ Discord thread created for adventure "${adventure.title}": ${thread.id}`);

      return {
        success: true,
        threadId: thread.id,
        threadName: thread.name,
        channelId: targetChannelId,
        threadUrl: `https://discord.com/channels/${thread.guildId}/${thread.id}`
      };

    } catch (error) {
      console.error('Error creating Discord thread for adventure:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Create adventure thread using HTTP request to Discord bot
   * @param {Object} adventure - Adventure data
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<Object>} Thread creation result
   */
  async createAdventureThreadViaBot(adventure, channelId = null) {
    try {
      const targetChannelId = channelId || this.defaultChannelId;
      
      if (!targetChannelId) {
        console.warn('No Discord channel ID provided for adventure thread creation');
        return {
          success: false,
          message: 'No Discord channel configured'
        };
      }

      // Make HTTP request to Discord bot endpoint
      const response = await axios.post(`${this.discordBotUrl}/api/create-thread`, {
        adventureId: adventure.id,
        adventureName: adventure.title,
        channelId: targetChannelId
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log(`✅ Discord thread created for adventure "${adventure.title}": ${response.data.threadId}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create thread');
      }

    } catch (error) {
      console.error('Error creating Discord thread via bot:', error);
      
      // If HTTP request fails, fall back to direct creation
      console.log('Falling back to direct Discord thread creation...');
      return this.createAdventureThread(adventure, channelId);
    }
  }

  /**
   * Generate area-specific welcome message for an adventure
   * @param {Object} adventure - Adventure object
   * @returns {Promise<string>} Welcome message
   */
  async generateWelcomeMessage(adventure) {
    try {
      // Check if adventure has area configuration
      if (adventure.area_config && adventure.area_id) {
        let areaConfig = adventure.area_config;

        // Parse area_config if it's a string
        if (typeof areaConfig === 'string') {
          areaConfig = JSON.parse(areaConfig);
        }

        // Use area-specific welcome message if available
        if (areaConfig.welcomeMessages) {
          // Randomly select from variations or use base message
          const variations = areaConfig.welcomeMessages.variations || [];
          if (variations.length > 0) {
            const randomIndex = Math.floor(Math.random() * variations.length);
            return variations[randomIndex];
          } else if (areaConfig.welcomeMessages.base) {
            return areaConfig.welcomeMessages.base;
          }
        }
      }

      // Fallback to default welcome message
      return `🌟 **Welcome to ${adventure.title}!** 🌟\n\n` +
        `This is your adventure thread! Here's how it works:\n\n` +
        `📝 **Every message you send counts toward your word count**\n` +
        `⚔️ Use \`/encounter\` to roll random encounters\n` +
        `🎯 Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
        `🎲 Use \`/result\` to resolve battle encounters\n` +
        `🏁 Use \`/end\` to complete the adventure and claim rewards\n\n` +
        `**Maximum encounters:** 3 per adventure\n` +
        `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n` +
        `Good luck, adventurers! 🚀`;

    } catch (error) {
      console.error('Error generating welcome message:', error);

      // Return default message on error
      return `🌟 **Welcome to ${adventure.title}!** 🌟\n\n` +
        `This is your adventure thread! Here's how it works:\n\n` +
        `📝 **Every message you send counts toward your word count**\n` +
        `⚔️ Use \`/encounter\` to roll random encounters\n` +
        `🎯 Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
        `🎲 Use \`/result\` to resolve battle encounters\n` +
        `🏁 Use \`/end\` to complete the adventure and claim rewards\n\n` +
        `**Maximum encounters:** 3 per adventure\n` +
        `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n` +
        `Good luck, adventurers! 🚀`;
    }
  }

  /**
   * Check if Discord integration is available
   * @returns {boolean} Whether Discord integration is available
   */
  isDiscordAvailable() {
    return !!(process.env.DISCORD_BOT_TOKEN && this.defaultChannelId);
  }

  /**
   * Get Discord thread URL for an adventure
   * @param {Object} adventure - Adventure data with discord_thread_id
   * @param {string} guildId - Discord guild ID
   * @returns {string|null} Discord thread URL or null
   */
  getThreadUrl(adventure, guildId = null) {
    if (!adventure.discord_thread_id) {
      return null;
    }

    // If no guild ID provided, try to get it from environment or return generic URL
    const targetGuildId = guildId || process.env.DISCORD_GUILD_ID || '@me';
    
    return `https://discord.com/channels/${targetGuildId}/${adventure.discord_thread_id}`;
  }

  /**
   * Send message to adventure thread
   * @param {string} threadId - Discord thread ID
   * @param {string} message - Message to send
   * @returns {Promise<Object>} Send result
   */
  async sendMessageToThread(threadId, message) {
    try {
      const axios = require('axios');

      const discordBotPort = process.env.DISCORD_BOT_HTTP_PORT || 3001;
      const discordBotUrl = `http://localhost:${discordBotPort}`;

      console.log(`Sending message to Discord bot at ${discordBotUrl}/send-message`);

      const response = await axios.post(`${discordBotUrl}/send-message`, {
        threadId,
        message
      }, {
        timeout: 10000 // 10 second timeout
      });

      return response.data;

    } catch (error) {
      console.error('Error sending message to Discord thread:', error);

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Discord bot HTTP server is not running'
        };
      }

      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Archive adventure thread
   * @param {string} threadId - Discord thread ID
   * @returns {Promise<Object>} Archive result
   */
  async archiveThread(threadId) {
    try {
      const { Client, GatewayIntentBits } = require('discord.js');
      
      const client = new Client({
        intents: [GatewayIntentBits.Guilds],
      });

      await client.login(process.env.DISCORD_BOT_TOKEN);
      
      const thread = await client.channels.fetch(threadId);
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      await thread.setArchived(true, 'Adventure completed');
      await client.destroy();

      return {
        success: true,
        message: 'Thread archived successfully'
      };

    } catch (error) {
      console.error('Error archiving Discord thread:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new DiscordIntegrationService();
