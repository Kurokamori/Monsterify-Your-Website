require('dotenv').config();
const axios = require('axios');

/**
 * Check the bot's permissions in a channel
 */
async function checkBotPermissions() {
  try {
    console.log('Checking bot permissions...');
    
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
    let botId;
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
      
      botId = botResponse.data.id;
      console.log('Bot information:');
      console.log(`- Username: ${botResponse.data.username}`);
      console.log(`- ID: ${botId}`);
      console.log(`- Discriminator: ${botResponse.data.discriminator}`);
    } catch (error) {
      console.error('Error getting bot information:', error.response?.data || error.message || error);
      console.log('This suggests the bot token is invalid.');
      return;
    }
    
    // Step 2: Get channel information
    console.log('\n--- Step 2: Get Channel Information ---');
    let guildId;
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
      
      guildId = channelResponse.data.guild_id;
      console.log('Channel information:');
      console.log(`- Name: ${channelResponse.data.name}`);
      console.log(`- Type: ${channelResponse.data.type}`);
      console.log(`- Guild ID: ${guildId}`);
      
      // Check if the channel type is valid for creating threads
      if (channelResponse.data.type !== 0 && channelResponse.data.type !== 5) {
        console.error(`Channel type ${channelResponse.data.type} does not support threads.`);
        console.log('Threads can only be created in text channels (type 0) or announcement channels (type 5).');
        return;
      }
      
      // Check permission overwrites for the bot
      const permissionOverwrites = channelResponse.data.permission_overwrites || [];
      const botOverwrites = permissionOverwrites.find(overwrite => overwrite.id === botId);
      
      if (botOverwrites) {
        console.log('\nBot has channel-specific permission overwrites:');
        console.log(`- Allow: ${botOverwrites.allow}`);
        console.log(`- Deny: ${botOverwrites.deny}`);
        
        // Check if any thread-related permissions are denied
        const threadPermissions = [
          0x0000000000000010, // SEND_MESSAGES
          0x0000000000400000, // CREATE_PUBLIC_THREADS
          0x0000000000800000, // CREATE_PRIVATE_THREADS
          0x0000000000200000, // SEND_MESSAGES_IN_THREADS
          0x0000000004000000  // MANAGE_THREADS
        ];
        
        const deniedPermissions = [];
        for (const perm of threadPermissions) {
          if ((BigInt(botOverwrites.deny) & BigInt(perm)) === BigInt(perm)) {
            deniedPermissions.push(perm);
          }
        }
        
        if (deniedPermissions.length > 0) {
          console.log('\nThe following thread-related permissions are explicitly denied for the bot:');
          for (const perm of deniedPermissions) {
            console.log(`- ${perm.toString(16)}`);
          }
          console.log('This is likely causing the "Missing Access" error.');
        }
      } else {
        console.log('\nBot does not have channel-specific permission overwrites.');
      }
    } catch (error) {
      console.error('Error getting channel information:', error.response?.data || error.message || error);
      console.log('This suggests the channel ID is invalid or the bot does not have access to it.');
      return;
    }
    
    // Step 3: Get guild information
    console.log('\n--- Step 3: Get Guild Information ---');
    try {
      const guildResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}`,
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Guild information:');
      console.log(`- Name: ${guildResponse.data.name}`);
      console.log(`- ID: ${guildResponse.data.id}`);
      console.log(`- Owner ID: ${guildResponse.data.owner_id}`);
    } catch (error) {
      console.error('Error getting guild information:', error.response?.data || error.message || error);
      console.log('This suggests the bot does not have access to the guild.');
    }
    
    // Step 4: Get bot's guild member information
    console.log('\n--- Step 4: Get Bot\'s Guild Member Information ---');
    try {
      const memberResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/members/${botId}`,
        {
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Bot\'s guild member information:');
      console.log(`- Roles: ${memberResponse.data.roles.join(', ')}`);
      
      // Check if the bot has administrator permission
      if (memberResponse.data.roles.length > 0) {
        console.log('\nChecking bot\'s roles...');
        
        // Get guild roles
        const rolesResponse = await axios.get(
          `https://discord.com/api/v10/guilds/${guildId}/roles`,
          {
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const botRoles = rolesResponse.data.filter(role => memberResponse.data.roles.includes(role.id));
        
        console.log('Bot has the following roles:');
        for (const role of botRoles) {
          console.log(`- ${role.name} (ID: ${role.id})`);
          
          // Check if the role has administrator permission
          if ((role.permissions & 0x8) === 0x8) {
            console.log(`  - This role has administrator permission`);
          }
          
          // Check thread-related permissions
          const threadPermissions = [
            { value: 0x0000000000000010, name: 'SEND_MESSAGES' },
            { value: 0x0000000000400000, name: 'CREATE_PUBLIC_THREADS' },
            { value: 0x0000000000800000, name: 'CREATE_PRIVATE_THREADS' },
            { value: 0x0000000000200000, name: 'SEND_MESSAGES_IN_THREADS' },
            { value: 0x0000000004000000, name: 'MANAGE_THREADS' }
          ];
          
          for (const perm of threadPermissions) {
            if ((BigInt(role.permissions) & BigInt(perm.value)) === BigInt(perm.value)) {
              console.log(`  - This role has ${perm.name} permission`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting bot\'s guild member information:', error.response?.data || error.message || error);
      console.log('This suggests the bot is not a member of the guild.');
    }
    
    console.log('\nPermission check completed.');
  } catch (error) {
    console.error('Unexpected error during permission check:', error);
  }
}

// Run the permission check
checkBotPermissions();
