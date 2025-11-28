const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('../config/config');

// Define all slash commands
const commands = [
  // Placeholder command
  new SlashCommandBuilder()
    .setName('placeholder')
    .setDescription('A placeholder command that says hello'),

  // General commands
  new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Show the main menu'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information'),

  new SlashCommandBuilder()
    .setName('link-account')
    .setDescription('Link your Discord account to your website account')
    .addStringOption(option =>
      option.setName('token')
        .setDescription('Your account linking token from the website')
        .setRequired(true)),

  // Adventure commands
  new SlashCommandBuilder()
    .setName('encounter')
    .setDescription('Generate a random encounter in the current adventure'),

  new SlashCommandBuilder()
    .setName('capture')
    .setDescription('Attempt to capture a monster from a wild encounter')
    .addStringOption(option =>
      option.setName('trainer')
        .setDescription('Name of the trainer to assign the captured monster to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('pokeball')
        .setDescription('Type of pokeball to use (e.g., Poke Ball, Great Ball, Ultra Ball, etc.)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('index')
        .setDescription('Monster index to capture (1-based, defaults to first uncaptured)')
        .setMinValue(1)
        .setMaxValue(20))
    .addIntegerOption(option =>
      option.setName('pokepuffs')
        .setDescription('Number of pokepuffs to use (increases capture chance by 25% each)')
        .setMinValue(0)
        .setMaxValue(10)),

  new SlashCommandBuilder()
    .setName('result')
    .setDescription('Resolve the outcome of a battle encounter'),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('End the current adventure and calculate rewards'),

  // Battle commands
  new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Initiate or join a battle in the current adventure')
    .addStringOption(option =>
      option.setName('trainer')
        .setDescription('Name of the trainer to use in battle')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opponent1')
        .setDescription('First opponent trainer name to challenge (for PvP battles)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('opponent2')
        .setDescription('Second opponent trainer name to challenge (for PvP battles)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('opponent3')
        .setDescription('Third opponent trainer name to challenge (for PvP battles)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('attack')
    .setDescription('Use an attack move in battle')
    .addStringOption(option =>
      option.setName('move')
        .setDescription('Name of the move to use')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('target')
        .setDescription('Name of the target monster (defaults to first opponent)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('attacker')
        .setDescription('Name of your monster to attack with (defaults to first active monster)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional battle message for word count bonus')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('use-item')
    .setDescription('Use an item in battle')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Name of the item to use')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('target')
        .setDescription('Name of the target monster (defaults to active monster)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional battle message for word count bonus')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('battle-status')
    .setDescription('View the current battle status and information'),

  new SlashCommandBuilder()
    .setName('release')
    .setDescription('Send out a monster to the battlefield')
    .addStringOption(option =>
      option.setName('monster')
        .setDescription('Name of the monster to release')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional battle message for word count bonus')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw a monster from the battlefield')
    .addStringOption(option =>
      option.setName('monster')
        .setDescription('Name of the monster to withdraw')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional battle message for word count bonus')
        .setRequired(false)),

  // Weather and environment commands
  new SlashCommandBuilder()
    .setName('set-weather')
    .setDescription('Set the weather for the current battle (admin only)')
    .addStringOption(option =>
      option.setName('weather')
        .setDescription('Weather type to set')
        .setRequired(true)
        .addChoices(
          { name: 'Clear', value: 'clear' },
          { name: 'Rain', value: 'rain' },
          { name: 'Sunny', value: 'sunny' },
          { name: 'Sandstorm', value: 'sandstorm' },
          { name: 'Hail', value: 'hail' },
          { name: 'Snow', value: 'snow' },
          { name: 'Fog', value: 'fog' }
        )),

  new SlashCommandBuilder()
    .setName('set-terrain')
    .setDescription('Set the terrain for the current battle (admin only)')
    .addStringOption(option =>
      option.setName('terrain')
        .setDescription('Terrain type to set')
        .setRequired(true)
        .addChoices(
          { name: 'Normal', value: 'normal' },
          { name: 'Electric', value: 'electric' },
          { name: 'Grassy', value: 'grassy' },
          { name: 'Misty', value: 'misty' },
          { name: 'Psychic', value: 'psychic' }
        )),

  new SlashCommandBuilder()
    .setName('flee')
    .setDescription('Attempt to flee from the current battle')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional flee message')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('forfeit')
    .setDescription('Forfeit the current battle')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional forfeit message')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('forcewin')
    .setDescription('Force win the current battle (admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional victory message')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('forcelose')
    .setDescription('Force lose the current battle (admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Optional defeat message')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('win-condition')
    .setDescription('Set how many monsters need to be knocked out to win (admin only)')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of monsters that need to be knocked out to win')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20)),

  // Trainer commands
  new SlashCommandBuilder()
    .setName('trainer')
    .setDescription('Trainer management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View trainer information')
        .addIntegerOption(option =>
          option.setName('trainer_id')
            .setDescription('Trainer ID (optional, defaults to your active trainer)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('View trainer inventory'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('monsters')
        .setDescription('View trainer monsters'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View trainer stats and achievements')),

  // Monster commands
  new SlashCommandBuilder()
    .setName('monster')
    .setDescription('Monster management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View monster details')
        .addIntegerOption(option =>
          option.setName('monster_id')
            .setDescription('Monster ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('rename')
        .setDescription('Rename a monster')
        .addIntegerOption(option =>
          option.setName('monster_id')
            .setDescription('Monster ID')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('new_name')
            .setDescription('New name for the monster')
            .setRequired(true))),

  // Town commands
  new SlashCommandBuilder()
    .setName('town')
    .setDescription('Visit town locations and perform activities')
    .addSubcommand(subcommand =>
      subcommand
        .setName('menu')
        .setDescription('Show town menu with all locations'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('visit')
        .setDescription('Visit a town location')
        .addStringOption(option =>
          option.setName('location')
            .setDescription('Location to visit')
            .setRequired(true)
            .addChoices(
              { name: 'Home', value: 'home' },
              { name: 'Adoption Center', value: 'adoption' },
              { name: 'Garden', value: 'garden' },
              { name: 'Farm', value: 'farm' },
              { name: 'Game Corner', value: 'game' },
              { name: 'Antique Shop', value: 'antique' },
              { name: 'Pirate\'s Dock', value: 'pirates' },
              { name: 'Laboratory', value: 'lab' }
            ))),

  // Shop commands
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Visit shops and purchase items')
    .addSubcommand(subcommand =>
      subcommand
        .setName('menu')
        .setDescription('Show shop menu with all locations'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View items in a specific shop')
        .addStringOption(option =>
          option.setName('shop')
            .setDescription('Shop to view')
            .setRequired(true)
            .addChoices(
              { name: 'Apothecary', value: 'apothecary' },
              { name: 'Bakery', value: 'bakery' },
              { name: 'Witch\'s Hut', value: 'witch' },
              { name: 'Mega Mart', value: 'megamart' },
              { name: 'Antique Store', value: 'antique' },
              { name: 'Nursery', value: 'nursery' },
              { name: 'Pirate\'s Dock', value: 'pirates' }
            ))),
].map(command => command.toJSON());

// Create REST instance
const rest = new REST({ version: '10' }).setToken(config.discord.token);

// Deploy commands
async function deployCommands() {
  try {
    console.log('🚀 Started refreshing application (/) commands.');

    // Register commands globally or to a specific guild
    if (config.discord.guildId) {
      // Guild-specific commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded ${commands.length} guild commands.`);
    } else {
      // Global commands (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded ${commands.length} global commands.`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

// Run if called directly
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands, commands };
