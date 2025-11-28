const adventureService = require('../services/adventureService');

class MessageHandler {
  /**
   * Handle incoming messages for word count tracking
   * @param {Object} message - Discord message object
   */
  async handleMessage(message) {
    try {
      // Ignore bot messages
      if (message.author.bot) return;

      // Check if message is in a thread
      if (!message.channel.isThread()) return;

      // Check if this is an adventure thread
      const adventure = await adventureService.getAdventureByThreadId(message.channel.id);
      if (!adventure) return;

      // Skip if adventure is completed
      if (adventure.status === 'completed') {
        console.log(`Skipping message tracking - adventure "${adventure.title}" is completed`);
        return;
      }

      // Track word count for this message
      await adventureService.trackMessageWordCount(
        message.channel.id,
        message.author.id,
        message.content
      );

      console.log(`Tracked message from ${message.author.username} in adventure "${adventure.title}"`);

    } catch (error) {
      console.error('Error handling message for word count tracking:', error);
      // Don't send error messages to avoid spam
    }
  }

  /**
   * Handle thread creation (when adventure threads are created)
   * @param {Object} thread - Discord thread object
   */
  async handleThreadCreate(thread) {
    try {
      // Check if this is an adventure thread by checking the name pattern
      if (thread.name.startsWith('🗡️')) {
        console.log(`Adventure thread created: ${thread.name}`);
        // Additional setup could be done here if needed
      }
    } catch (error) {
      console.error('Error handling thread creation:', error);
    }
  }

  /**
   * Handle thread deletion (cleanup if needed)
   * @param {Object} thread - Discord thread object
   */
  async handleThreadDelete(thread) {
    try {
      // Check if this was an adventure thread
      const adventure = await adventureService.getAdventureByThreadId(thread.id);
      if (adventure) {
        console.log(`Adventure thread deleted: ${thread.name} for adventure ${adventure.id}`);
        // Could mark adventure as cancelled or handle cleanup here
      }
    } catch (error) {
      console.error('Error handling thread deletion:', error);
    }
  }
}

module.exports = new MessageHandler();
