const axios = require('axios');
require('dotenv').config();

class DiscordServiceAlt {
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
   * Create a new thread in a Discord channel using the message-first approach
   * @param {string} channelId - Discord channel ID
   * @param {string} threadName - Name for the new thread
   * @param {string} message - Initial message for the thread
   * @param {boolean} useMock - Whether to use mock data instead of making actual API calls (for testing)
   * @returns {Promise<Object>} - Created thread data
   */
  static async createThread(channelId, threadName, message = "New adventure thread", useMock = false) {
    try {
      console.log(`Creating Discord thread "${threadName}" in channel ${channelId} using message-first approach...`);
      
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
      
      // Step 1: Send a message to the channel
      console.log('Step 1: Sending a message to the channel...');
      const messageResponse = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          content: message || "New adventure thread"
        },
        {
          headers: {
            'Authorization': `Bot ${this._getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Message sent successfully with ID: ${messageResponse.data.id}`);
      
      // Step 2: Create a thread from the message
      console.log('Step 2: Creating a thread from the message...');
      const threadResponse = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageResponse.data.id}/threads`,
        {
          name: threadName,
          auto_archive_duration: 1440 // 1 day (in minutes)
        },
        {
          headers: {
            'Authorization': `Bot ${this._getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`Thread created successfully with ID: ${threadResponse.data.id}`);
      
      return threadResponse.data;
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
}

module.exports = DiscordServiceAlt;
