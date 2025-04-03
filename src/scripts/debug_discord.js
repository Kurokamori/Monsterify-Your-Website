require('dotenv').config();
const axios = require('axios');

/**
 * Debug the Discord API directly
 */
async function debugDiscordAPI() {
  try {
    console.log('Debugging Discord API...');
    
    // Get environment variables
    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DEFAULT_ADVENTURE_CHANNEL_ID;
    
    if (!token) {
      console.error('DISCORD_BOT_TOKEN not found in environment variables');
      return;
    }
    
    if (!channelId) {
      console.error('DEFAULT_ADVENTURE_CHANNEL_ID not found in environment variables');
      return;
    }
    
    console.log(`Using channel ID: ${channelId}`);
    console.log(`Bot token starts with: ${token.substring(0, 4)}...`);
    
    // Step 1: Get bot information
    console.log('\n--- Step 1: Get Bot Information ---');
    try {
      const botResponse = await axios.get(
        'https://discord.com/api/v10/users/@me',
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Bot information:');
      console.log(`- Username: ${botResponse.data.username}`);
      console.log(`- ID: ${botResponse.data.id}`);
      console.log(`- Discriminator: ${botResponse.data.discriminator}`);
    } catch (error) {
      console.error('Error getting bot information:', error.response?.data || error.message || error);
      console.log('This suggests the bot token is invalid or has insufficient permissions.');
      return;
    }
    
    // Step 2: Get channel information
    console.log('\n--- Step 2: Get Channel Information ---');
    try {
      const channelResponse = await axios.get(
        `https://discord.com/api/v10/channels/${channelId}`,
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Channel information:');
      console.log(`- Name: ${channelResponse.data.name}`);
      console.log(`- Type: ${channelResponse.data.type}`);
      console.log(`- Guild ID: ${channelResponse.data.guild_id}`);
      
      // Check if the channel type is valid for creating threads
      if (channelResponse.data.type !== 0 && channelResponse.data.type !== 5) {
        console.error(`Channel type ${channelResponse.data.type} does not support threads.`);
        console.log('Threads can only be created in text channels (type 0) or announcement channels (type 5).');
        return;
      }
    } catch (error) {
      console.error('Error getting channel information:', error.response?.data || error.message || error);
      console.log('This suggests the channel ID is invalid or the bot does not have access to it.');
      return;
    }
    
    // Step 3: Create a thread
    console.log('\n--- Step 3: Create a Thread ---');
    try {
      const threadName = 'Debug Thread - ' + new Date().toLocaleString();
      const threadResponse = await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/threads`,
        {
          name: threadName,
          type: 11, // Private thread
          auto_archive_duration: 1440 // 1 day (in minutes)
        },
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Thread created successfully:');
      console.log(`- Thread ID: ${threadResponse.data.id}`);
      console.log(`- Thread Name: ${threadResponse.data.name}`);
      
      // Step 4: Send a message to the thread
      console.log('\n--- Step 4: Send a Message to the Thread ---');
      const messageResponse = await axios.post(
        `https://discord.com/api/v10/channels/${threadResponse.data.id}/messages`,
        {
          content: 'This is a test message from the debug script.'
        },
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Message sent successfully:');
      console.log(`- Message ID: ${messageResponse.data.id}`);
    } catch (error) {
      console.error('Error creating thread or sending message:', error.response?.data || error.message || error);
      
      if (error.response?.status === 403) {
        console.log('This suggests the bot does not have permission to create threads in this channel.');
        console.log('Make sure the bot has the following permissions:');
        console.log('- Send Messages');
        console.log('- Create Public Threads');
        console.log('- Create Private Threads');
        console.log('- Send Messages in Threads');
        console.log('- Manage Threads');
      }
    }
    
    console.log('\nDebug completed.');
  } catch (error) {
    console.error('Unexpected error during debugging:', error);
  }
}

// Run the debug function
debugDiscordAPI();
