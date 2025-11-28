const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config/config');
const commandHandler = require('./handlers/commandHandler');
const buttonHandler = require('./handlers/buttonHandler');
const selectMenuHandler = require('./handlers/selectMenuHandler');
const modalSubmitHandler = require('./handlers/modalSubmitHandler');
const messageHandler = require('./handlers/messageHandler');
const express = require('express');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Initialize collections for commands
client.commands = new Collection();

// Event: Bot ready
client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online and ready!`);
  console.log(`🔗 Connected to ${client.guilds.cache.size} guild(s)`);

  // Set bot status
  client.user.setActivity('Dusk and Dawn RPG', { type: 'PLAYING' });

  // Start HTTP server for backend communication
  startHttpServer();
});

// Event: Interaction create (slash commands, buttons, etc.)
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await commandHandler.handleCommand(interaction);
    } else if (interaction.isButton()) {
      await buttonHandler.handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await selectMenuHandler.handleSelectMenu(interaction);
    } else if (interaction.isModalSubmit()) {
      await modalSubmitHandler.handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    const errorMessage = 'There was an error while executing this command!';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Event: Message create (for word count tracking in adventure threads)
client.on('messageCreate', async (message) => {
  try {
    await messageHandler.handleMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Event: Thread create
client.on('threadCreate', async (thread) => {
  try {
    await messageHandler.handleThreadCreate(thread);
  } catch (error) {
    console.error('Error handling thread create:', error);
  }
});

// Event: Thread delete
client.on('threadDelete', async (thread) => {
  try {
    await messageHandler.handleThreadDelete(thread);
  } catch (error) {
    console.error('Error handling thread delete:', error);
  }
});

// Event: Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// Event: Warning handling
client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// HTTP server for backend communication
function startHttpServer() {
  const app = express();
  app.use(express.json());

  // Endpoint to send messages to Discord threads
  app.post('/send-message', async (req, res) => {
    try {
      const { threadId, message } = req.body;

      if (!threadId || !message) {
        return res.status(400).json({
          success: false,
          message: 'threadId and message are required'
        });
      }

      console.log(`📤 Sending message to thread ${threadId}:`, message);

      const thread = await client.channels.fetch(threadId);
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: `Thread ${threadId} not found`
        });
      }

      const sentMessage = await thread.send(message);

      res.json({
        success: true,
        messageId: sentMessage.id
      });

    } catch (error) {
      console.error('Error sending message to Discord thread:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  const port = process.env.DISCORD_BOT_HTTP_PORT || 3001;
  app.listen(port, () => {
    console.log(`🌐 Discord bot HTTP server running on port ${port}`);
  });
}

// Login to Discord
client.login(config.discord.token).catch((error) => {
  console.error('Failed to login to Discord:', error);
  process.exit(1);
});
