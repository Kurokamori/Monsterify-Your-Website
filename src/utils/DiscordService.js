const axios = require('axios');
require('dotenv').config();

class DiscordService {
  /**
   * Get the Discord bot token from environment variables
   * @returns {string} - Discord bot token
   * @private
   */
  static _getToken() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.warn('DISCORD_BOT_TOKEN not found in environment variables. Discord integration will not work.');
    } else {
      // Log the first few characters of the token to verify it's loaded
      console.log(`Discord bot token loaded (starts with: ${token.substring(0, 4)}...)`);
    }
    return token;
  }

  /**
   * Create a new thread in a Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {string} threadName - Name for the new thread
   * @param {string} message - Initial message for the thread (optional)
   * @param {boolean} useMock - Whether to use mock data instead of making actual API calls (for testing)
   * @returns {Promise<Object>} - Created thread data
   */
  static async createThread(channelId, threadName, message = null, useMock = false) {
    try {
      console.log(`Creating Discord thread "${threadName}" in channel ${channelId}`);

      // If useMock is true or no token is available, return mock data
      if (useMock || !this._getToken()) {
        console.log('Using mock data for Discord thread creation');
        const mockThreadId = `mock-thread-${Date.now()}`;

        return {
          id: mockThreadId,
          name: threadName,
          parent_id: channelId,
          type: 11,
          owner_id: 'mock-owner',
          guild_id: 'mock-guild',
          member_count: 1,
          message_count: message ? 1 : 0,
          is_mock: true
        };
      }

      // Make actual API call to Discord
      console.log(`Making API call to create thread in channel ${channelId}...`);
      let response;
      try {
        const token = this._getToken();
        if (!token) {
          throw new Error('No Discord bot token available');
        }

        const requestData = {
          name: threadName,
          type: 11, // Try type 11 for private thread first
          auto_archive_duration: 1440 // 1 day (in minutes)
        };

        // If this fails, we'll try with a public thread in the catch block

        console.log('Request data:', JSON.stringify(requestData));

        response = await axios.post(
          `https://discord.com/api/v10/channels/${channelId}/threads`,
          requestData,
          {
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Discord API response status:', response.status);
      } catch (innerError) {
        console.error('Inner error creating thread:', innerError.response?.data || innerError.message || innerError);

        // If the error is Missing Access, try creating a public thread instead
        if (innerError.response?.data?.code === 50001 ||
            (innerError.response?.data?.message && innerError.response.data.message.includes('Missing Access'))) {
          console.log('Failed to create private thread. Trying public thread instead...');

          try {
            // Try creating a public thread (type 0 = public thread)
            const publicThreadResponse = await axios.post(
              `https://discord.com/api/v10/channels/${channelId}/threads`,
              {
                name: threadName,
                type: 0, // Public thread
                auto_archive_duration: 1440 // 1 day (in minutes)
              },
              {
                headers: {
                  'Authorization': `Bot ${this._getToken()}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            console.log('Public thread created successfully!');
            response = publicThreadResponse;
            return response.data; // Return early with the public thread data
          } catch (publicThreadError) {
            console.error('Error creating public thread:', publicThreadError.response?.data || publicThreadError.message || publicThreadError);
          }
        }

        throw innerError; // Re-throw to be caught by the outer catch block
      }

      const threadId = response.data.id;
      console.log(`Thread created successfully with ID: ${threadId}`);

      // If a message was provided, send it to the thread
      if (message) {
        await this.sendMessage(threadId, message);
      }

      return response.data;
    } catch (error) {
      console.error('Error creating Discord thread:', error.response?.data || error.message || error);

      // Check for rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.log(`Rate limited by Discord API. Retrying after ${retryAfter} seconds...`);

        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Try again
        return this.createThread(channelId, threadName, message, useMock);
      }

      // If the API call fails, return a mock thread as fallback
      console.log('Falling back to mock thread data');
      return {
        id: `fallback-thread-${Date.now()}`,
        name: threadName,
        parent_id: channelId,
        is_fallback: true,
        error: error.response?.data || error.message || 'Unknown error'
      };
    }
  }

  /**
   * Send a message to a Discord channel or thread
   * @param {string} channelId - Discord channel or thread ID
   * @param {string} message - Message content
   * @param {boolean} useMock - Whether to use mock data instead of making actual API calls (for testing)
   * @returns {Promise<Object>} - Sent message data
   */
  static async sendMessage(channelId, message, useMock = false) {
    try {
      console.log(`Sending message to Discord channel/thread ${channelId}: ${message}`);

      // If useMock is true or no token is available, return mock data
      if (useMock || !this._getToken()) {
        console.log('Using mock data for Discord message');
        return {
          id: `mock-message-${Date.now()}`,
          content: message,
          channel_id: channelId,
          author: {
            id: 'mock-bot-id',
            username: 'MockBot',
            discriminator: '0000'
          },
          timestamp: new Date().toISOString(),
          is_mock: true
        };
      }

      // Make actual API call to Discord
      const response = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          content: message
        },
        {
          headers: {
            'Authorization': `Bot ${this._getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Message sent successfully with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('Error sending Discord message:', error.response?.data || error.message || error);

      // Check for rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.log(`Rate limited by Discord API. Retrying after ${retryAfter} seconds...`);

        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Try again
        return this.sendMessage(channelId, message, useMock);
      }

      // If the API call fails, return a mock message as fallback
      console.log('Falling back to mock message data');
      return {
        id: `fallback-message-${Date.now()}`,
        content: message,
        channel_id: channelId,
        is_fallback: true,
        error: error.response?.data || error.message || 'Unknown error'
      };
    }
  }

  /**
   * Create an embed message
   * @param {string} channelId - Discord channel or thread ID
   * @param {Object} embedData - Embed data object
   * @param {boolean} useMock - Whether to use mock data instead of making actual API calls (for testing)
   * @returns {Promise<Object>} - Sent message data
   */
  static async sendEmbed(channelId, embedData, useMock = false) {
    try {
      console.log(`Sending embed to Discord channel/thread ${channelId}`);

      // If useMock is true or no token is available, return mock data
      if (useMock || !this._getToken()) {
        console.log('Using mock data for Discord embed');
        return {
          id: `mock-embed-${Date.now()}`,
          embeds: [embedData],
          channel_id: channelId,
          author: {
            id: 'mock-bot-id',
            username: 'MockBot',
            discriminator: '0000'
          },
          timestamp: new Date().toISOString(),
          is_mock: true
        };
      }

      // Make actual API call to Discord
      const response = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          embeds: [embedData]
        },
        {
          headers: {
            'Authorization': `Bot ${this._getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Embed sent successfully with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('Error sending Discord embed:', error.response?.data || error.message || error);

      // Check for rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.log(`Rate limited by Discord API. Retrying after ${retryAfter} seconds...`);

        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Try again
        return this.sendEmbed(channelId, embedData, useMock);
      }

      // If the API call fails, return a mock message as fallback
      console.log('Falling back to mock embed data');
      return {
        id: `fallback-embed-${Date.now()}`,
        embeds: [embedData],
        channel_id: channelId,
        is_fallback: true,
        error: error.response?.data || error.message || 'Unknown error'
      };
    }
  }

  /**
   * Get information about a Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {boolean} useMock - Whether to use mock data instead of making actual API calls (for testing)
   * @returns {Promise<Object>} - Channel data
   */
  static async getChannel(channelId, useMock = false) {
    try {
      console.log(`Getting information for Discord channel ${channelId}`);

      // If useMock is true or no token is available, return mock data
      if (useMock || !this._getToken()) {
        console.log('Using mock data for Discord channel');
        return {
          id: channelId,
          type: 0, // Text channel
          name: 'mock-channel',
          guild_id: 'mock-guild',
          position: 0,
          permission_overwrites: [],
          is_mock: true
        };
      }

      // Make actual API call to Discord
      const response = await axios.get(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bot ${this._getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting Discord channel:', error.response?.data || error.message || error);

      // Check for rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.log(`Rate limited by Discord API. Retrying after ${retryAfter} seconds...`);

        // Wait for the retry-after period
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

        // Try again
        return this.getChannel(channelId, useMock);
      }

      // If the API call fails, return a mock channel as fallback
      console.log('Falling back to mock channel data');
      return {
        id: channelId,
        type: 0, // Text channel
        name: 'fallback-channel',
        is_fallback: true,
        error: error.response?.data || error.message || 'Unknown error'
      };
    }
  }
}

module.exports = DiscordService;
