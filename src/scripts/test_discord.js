require('dotenv').config();
const DiscordService = require('../utils/DiscordService');

/**
 * Test the Discord integration
 */
async function testDiscordIntegration() {
  try {
    console.log('Testing Discord integration...');
    
    // Get the channel ID from environment variables
    const channelId = process.env.DEFAULT_ADVENTURE_CHANNEL_ID;
    
    if (!channelId) {
      console.error('DEFAULT_ADVENTURE_CHANNEL_ID not found in environment variables');
      return;
    }
    
    // Test getting channel information
    console.log(`Getting information for channel ${channelId}...`);
    const channel = await DiscordService.getChannel(channelId);
    console.log('Channel information:', channel);
    
    // Test creating a thread
    console.log('Creating a test thread...');
    const thread = await DiscordService.createThread(
      channelId,
      'Test Thread - ' + new Date().toLocaleString(),
      'This is a test thread created by the Discord integration test script.'
    );
    console.log('Thread created:', thread);
    
    // Test sending a message to the thread
    console.log(`Sending a message to thread ${thread.id}...`);
    const message = await DiscordService.sendMessage(
      thread.id,
      'This is a test message sent by the Discord integration test script.'
    );
    console.log('Message sent:', message);
    
    // Test sending an embed to the thread
    console.log(`Sending an embed to thread ${thread.id}...`);
    const embed = await DiscordService.sendEmbed(
      thread.id,
      {
        title: 'Test Embed',
        description: 'This is a test embed sent by the Discord integration test script.',
        color: 0x00ff00,
        fields: [
          {
            name: 'Field 1',
            value: 'Value 1',
            inline: true
          },
          {
            name: 'Field 2',
            value: 'Value 2',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Test Footer'
        }
      }
    );
    console.log('Embed sent:', embed);
    
    console.log('Discord integration test completed successfully!');
  } catch (error) {
    console.error('Error testing Discord integration:', error);
  }
}

// Run the test
testDiscordIntegration();
