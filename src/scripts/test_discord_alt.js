require('dotenv').config();
const DiscordServiceAlt = require('../utils/DiscordServiceAlt');

/**
 * Test the alternative Discord integration approach
 */
async function testDiscordAltIntegration() {
  try {
    console.log('Testing alternative Discord integration approach...');
    
    // Get the channel ID from environment variables
    const channelId = process.env.DEFAULT_ADVENTURE_CHANNEL_ID;
    
    if (!channelId) {
      console.error('DEFAULT_ADVENTURE_CHANNEL_ID not found in environment variables');
      return;
    }
    
    // Test creating a thread using the message-first approach
    console.log('Creating a test thread using message-first approach...');
    const thread = await DiscordServiceAlt.createThread(
      channelId,
      'Test Thread (Alt) - ' + new Date().toLocaleString(),
      'This is a test thread created by the alternative Discord integration test script.'
    );
    console.log('Thread created:', thread);
    
    // Test sending a message to the thread
    console.log(`Sending a message to thread ${thread.id}...`);
    const message = await DiscordServiceAlt.sendMessage(
      thread.id,
      'This is a test message sent by the alternative Discord integration test script.'
    );
    console.log('Message sent:', message);
    
    console.log('Alternative Discord integration test completed successfully!');
  } catch (error) {
    console.error('Error testing alternative Discord integration:', error);
  }
}

// Run the test
testDiscordAltIntegration();
