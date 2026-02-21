/**
 * /battle command module — battle management during adventures.
 *
 * Subcommands:
 *   start          — Start or join a battle
 *   attack         — Execute an attack
 *   use-item       — Use an item in battle
 *   status         — View battle status
 *   release        — Send out a monster
 *   withdraw       — Recall a monster
 *   flee           — Flee from battle
 *   forfeit        — Forfeit the battle
 *   result         — Resolve/end the battle
 *   win-condition  — Set KO win condition
 *
 * Admin subcommand group:
 *   admin forcewin     — Force win the battle
 *   admin forcelose    — Force lose the battle
 *   admin set-weather  — Set battle weather
 *   admin set-terrain  — Set battle terrain
 */

import { SlashCommandBuilder } from 'discord.js';
import type { Command, ButtonHandler, SelectMenuHandler, ModalHandler } from '../../types/command.types.js';
import { errorHandler, optionalAuth, cooldowns } from '../../middleware/index.js';
import { handleStart } from './start.js';
import { handleAttack } from './attack.js';
import { handleUseItem } from './use-item.js';
import { handleStatus } from './status.js';
import { handleRelease } from './release.js';
import { handleWithdraw } from './withdraw.js';
import { handleFlee } from './flee.js';
import { handleForfeit } from './forfeit.js';
import { handleResult } from './result.js';
import { handleWinCondition } from './win-condition.js';
import { handleAdmin } from './admin.js';

// ============================================================================
// Slash command definition
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Manage battles during adventures')

    // -- Top-level subcommands -----------------------------------------------

    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start or join a battle')
        .addStringOption((opt) =>
          opt.setName('trainer').setDescription('Your trainer\'s name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('opponent1').setDescription('First opponent trainer name (PvP)').setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName('opponent2').setDescription('Second opponent trainer name (PvP)').setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName('opponent3').setDescription('Third opponent trainer name (PvP)').setRequired(false),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName('attack')
        .setDescription('Execute an attack in battle')
        .addStringOption((opt) =>
          opt.setName('monster').setDescription('Your attacking monster\'s name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('attack').setDescription('The move name to use').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('target').setDescription('Target monster name').setRequired(false),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName('use-item')
        .setDescription('Use an item during battle')
        .addStringOption((opt) =>
          opt.setName('monster').setDescription('Target monster name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('item').setDescription('Item name to use').setRequired(true),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('View current battle status'),
    )

    .addSubcommand((sub) =>
      sub
        .setName('release')
        .setDescription('Send out a monster to the battlefield')
        .addStringOption((opt) =>
          opt.setName('monster').setDescription('Monster name to send out').setRequired(true),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName('withdraw')
        .setDescription('Recall a monster from the battlefield')
        .addStringOption((opt) =>
          opt.setName('monster').setDescription('Monster name to recall').setRequired(true),
        ),
    )

    .addSubcommand((sub) =>
      sub
        .setName('flee')
        .setDescription('Flee from the current battle'),
    )

    .addSubcommand((sub) =>
      sub
        .setName('forfeit')
        .setDescription('Forfeit the current battle'),
    )

    .addSubcommand((sub) =>
      sub
        .setName('result')
        .setDescription('Resolve the battle and calculate rewards'),
    )

    .addSubcommand((sub) =>
      sub
        .setName('win-condition')
        .setDescription('Set the KO count needed to win')
        .addIntegerOption((opt) =>
          opt
            .setName('count')
            .setDescription('Number of KOs needed to win')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(true),
        ),
    )

    // -- Admin subcommand group ----------------------------------------------

    .addSubcommandGroup((group) =>
      group
        .setName('admin')
        .setDescription('Admin battle management commands')
        .addSubcommand((sub) =>
          sub
            .setName('forcewin')
            .setDescription('Force win the current battle')
            .addStringOption((opt) =>
              opt.setName('message').setDescription('Optional message').setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('forcelose')
            .setDescription('Force lose the current battle')
            .addStringOption((opt) =>
              opt.setName('message').setDescription('Optional message').setRequired(false),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('set-weather')
            .setDescription('Set the battle weather')
            .addStringOption((opt) =>
              opt
                .setName('weather')
                .setDescription('Weather condition')
                .setRequired(true)
                .addChoices(
                  { name: 'Clear', value: 'clear' },
                  { name: 'Sunny', value: 'sunny' },
                  { name: 'Rain', value: 'rain' },
                  { name: 'Sandstorm', value: 'sandstorm' },
                  { name: 'Hail', value: 'hail' },
                  { name: 'Fog', value: 'fog' },
                  { name: 'Snow', value: 'snow' },
                  { name: 'Thunderstorm', value: 'thunderstorm' },
                  { name: 'Wind', value: 'wind' },
                ),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('set-terrain')
            .setDescription('Set the battle terrain')
            .addStringOption((opt) =>
              opt
                .setName('terrain')
                .setDescription('Terrain type')
                .setRequired(true)
                .addChoices(
                  { name: 'Normal', value: 'normal' },
                  { name: 'Electric', value: 'electric' },
                  { name: 'Grassy', value: 'grassy' },
                  { name: 'Psychic', value: 'psychic' },
                  { name: 'Misty', value: 'misty' },
                ),
            ),
        ),
    ) as SlashCommandBuilder,

  middleware: [errorHandler, optionalAuth, cooldowns.standard()],

  meta: {
    name: 'battle',
    description: 'Manage battles during adventures — attack, use items, release monsters, and more.',
    category: 'Battle',
    usage: '/battle start | /battle attack | /battle status | /battle flee',
    examples: [
      '/battle start trainer:Ash',
      '/battle start trainer:Ash opponent1:Brock',
      '/battle attack monster:Pikachu attack:Thunderbolt',
      '/battle attack monster:Pikachu attack:Thunderbolt target:Onix',
      '/battle use-item monster:Pikachu item:Potion',
      '/battle status',
      '/battle release monster:Charizard',
      '/battle withdraw monster:Pikachu',
      '/battle flee',
      '/battle forfeit',
      '/battle result',
      '/battle win-condition count:3',
    ],
  },

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(false);

    if (group === 'admin') {
      await handleAdmin(interaction);
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'start':
        await handleStart(interaction);
        break;
      case 'attack':
        await handleAttack(interaction);
        break;
      case 'use-item':
        await handleUseItem(interaction);
        break;
      case 'status':
        await handleStatus(interaction);
        break;
      case 'release':
        await handleRelease(interaction);
        break;
      case 'withdraw':
        await handleWithdraw(interaction);
        break;
      case 'flee':
        await handleFlee(interaction);
        break;
      case 'forfeit':
        await handleForfeit(interaction);
        break;
      case 'result':
        await handleResult(interaction);
        break;
      case 'win-condition':
        await handleWinCondition(interaction);
        break;
      default:
        await interaction.reply({
          content: `Unknown subcommand: ${subcommand}`,
          ephemeral: true,
        });
    }
  },
};

// ============================================================================
// Component handlers
// ============================================================================

export const buttons: ButtonHandler[] = [];

export const selectMenus: SelectMenuHandler[] = [];

export const modals: ModalHandler[] = [];
