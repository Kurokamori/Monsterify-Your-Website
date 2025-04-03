const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Import command definitions
const standardCommands = require('./slashCommands');
const monsterCommands = require('./monsterCommands');
const locationCommands = require('./locationCommands');
const bossCommands = require('./bossCommands');
const missionCommands = require('./missionCommands');
const evolutionCommands = require('./evolutionCommands');
const marketCommands = require('./marketCommands');

// Combine all commands
const commands = [
  ...standardCommands,
  ...monsterCommands,
  ...locationCommands,
  ...bossCommands,
  ...missionCommands,
  ...evolutionCommands,
  ...marketCommands
];

/**
 * Register slash commands with Discord
 */
async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    // Get token and client ID from environment variables
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment variables');
    }

    if (!clientId) {
      throw new Error('DISCORD_CLIENT_ID not found in environment variables');
    }

    // Create REST instance
    const rest = new REST({ version: '10' }).setToken(token);

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

module.exports = registerCommands;
