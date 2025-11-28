const slashCommands = require('../commands/slashCommands');
const trainerCommands = require('../commands/trainerCommands');
const monsterCommands = require('../commands/monsterCommands');
const townCommands = require('../commands/townCommands');
const marketCommands = require('../commands/marketCommands');
const adventureCommands = require('../commands/adventureCommands');
const { createErrorEmbed } = require('../config/embeds');

class CommandHandler {
  async handleCommand(interaction) {
    const { commandName } = interaction;

    try {
      // Route commands to appropriate handlers
      switch (commandName) {
        // Basic slash commands
        case 'placeholder':
        case 'menu':
        case 'help':
        case 'link-account':
          if (slashCommands[commandName]) {
            await slashCommands[commandName](interaction);
          } else {
            throw new Error(`Command ${commandName} not implemented`);
          }
          break;

        // Adventure commands
        case 'encounter':
        case 'capture':
        case 'result':
        case 'end':
          if (adventureCommands[commandName]) {
            await adventureCommands[commandName](interaction);
          } else {
            throw new Error(`Adventure command ${commandName} not implemented`);
          }
          break;

        // Battle commands
        case 'battle':
        case 'attack':
        case 'use-item':
        case 'battle-status':
        case 'release':
        case 'withdraw':
        case 'set-weather':
        case 'set-terrain':
        case 'flee':
        case 'forfeit':
        case 'forcewin':
        case 'forcelose':
        case 'win-condition':
          const battleCommandName = commandName === 'use-item' ? 'useItem' :
                                   commandName === 'battle-status' ? 'battleStatus' :
                                   commandName === 'set-weather' ? 'setWeather' :
                                   commandName === 'set-terrain' ? 'setTerrain' :
                                   commandName === 'win-condition' ? 'winCondition' :
                                   commandName;
          if (adventureCommands[battleCommandName]) {
            await adventureCommands[battleCommandName](interaction);
          } else {
            throw new Error(`Battle command ${commandName} not implemented`);
          }
          break;

        // Trainer commands
        case 'trainer':
          const trainerSubcommand = interaction.options.getSubcommand();
          if (trainerCommands[trainerSubcommand]) {
            await trainerCommands[trainerSubcommand](interaction);
          } else {
            throw new Error(`Trainer subcommand ${trainerSubcommand} not implemented`);
          }
          break;

        // Monster commands
        case 'monster':
          const monsterSubcommand = interaction.options.getSubcommand();
          if (monsterCommands[monsterSubcommand]) {
            await monsterCommands[monsterSubcommand](interaction);
          } else {
            throw new Error(`Monster subcommand ${monsterSubcommand} not implemented`);
          }
          break;

        // Town commands
        case 'town':
          const townSubcommand = interaction.options.getSubcommand();
          if (townSubcommand === 'menu') {
            await townCommands.menu(interaction);
          } else if (townSubcommand === 'visit') {
            await townCommands.visit(interaction);
          } else {
            throw new Error(`Town subcommand ${townSubcommand} not implemented`);
          }
          break;

        // Shop commands
        case 'shop':
          const shopSubcommand = interaction.options.getSubcommand();
          if (marketCommands[shopSubcommand]) {
            await marketCommands[shopSubcommand](interaction);
          } else {
            throw new Error(`Shop subcommand ${shopSubcommand} not implemented`);
          }
          break;

        default:
          throw new Error(`Unknown command: ${commandName}`);
      }

    } catch (error) {
      console.error(`Error handling command ${commandName}:`, error);
      
      const embed = createErrorEmbed(
        error.message || 'An error occurred while processing your command.'
      );

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  // Helper method to check if user has required permissions
  checkPermissions(interaction, requiredPermissions = []) {
    if (requiredPermissions.length === 0) return true;

    const member = interaction.member;
    if (!member) return false;

    return requiredPermissions.every(permission => 
      member.permissions.has(permission)
    );
  }

  // Helper method to check if command is in cooldown
  checkCooldown(userId, commandName, cooldownSeconds = 3) {
    const now = Date.now();
    const cooldownKey = `${userId}-${commandName}`;
    
    if (!this.cooldowns) {
      this.cooldowns = new Map();
    }

    if (this.cooldowns.has(cooldownKey)) {
      const expirationTime = this.cooldowns.get(cooldownKey) + (cooldownSeconds * 1000);
      
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return { inCooldown: true, timeLeft: Math.ceil(timeLeft) };
      }
    }

    this.cooldowns.set(cooldownKey, now);
    return { inCooldown: false };
  }

  // Helper method to log command usage
  logCommandUsage(interaction) {
    const { commandName, user, guild } = interaction;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Command: ${commandName} | User: ${user.tag} (${user.id}) | Guild: ${guild?.name || 'DM'} (${guild?.id || 'N/A'})`);
  }
}

module.exports = new CommandHandler();
