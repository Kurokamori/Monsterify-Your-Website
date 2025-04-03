const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const CommandHandler = require('./handlers/commandHandler');
const ButtonHandler = require('./handlers/buttonHandler');
const SelectMenuHandler = require('./handlers/selectMenuHandler');
const ModalSubmitHandler = require('./handlers/modalSubmitHandler');
const registerCommands = require('./commands/registerCommands');
const ReminderSystem = require('./utils/reminderSystem');
require('dotenv').config();

// Command prefix for standard commands
const PREFIX = '!';

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Create reminder system
const reminderSystem = new ReminderSystem(client);

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  // Register slash commands
  registerCommands()
    .then(() => console.log('Commands registered'))
    .catch(error => console.error('Error registering commands:', error));

  // Start the reminder system
  reminderSystem.start();
});

// Handle all interactions (commands, buttons, select menus, modals)
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      await CommandHandler.handleCommandInteraction(interaction);
    } else if (interaction.isButton()) {
      await ButtonHandler.handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await SelectMenuHandler.handleSelectMenuInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await ModalSubmitHandler.handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    try {
      const reply = { content: 'An error occurred while processing this interaction.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  }
});

// Handle standard message commands
client.on(Events.MessageCreate, async message => {
  try {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if message starts with prefix
    if (!message.content.startsWith(PREFIX)) return;

    // Parse command and arguments
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Handle commands
    if (commandName === 'menu') {
      await CommandHandler.handleStandardCommand(message, commandName, args);
    } else if (['town', 'market', 'submission', 'schedule'].includes(commandName)) {
      await CommandHandler.handleStandardCommand(message, commandName, args);
    }
  } catch (error) {
    console.error('Error handling message command:', error);
    await message.reply('An error occurred while processing this command.');
  }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log('Logged in successfully'))
  .catch(error => console.error('Error logging in:', error));
