/**
 * /adventure command module — adventure lifecycle management.
 *
 * Subcommands:
 *   start     — Start a new adventure (wizard or direct)
 *   encounter — Generate a random encounter
 *   capture   — Attempt to capture a monster
 *   end       — End the adventure and calculate rewards
 */

import { SlashCommandBuilder } from 'discord.js';
import type { Command, ButtonHandler, SelectMenuHandler, ModalHandler } from '../../types/command.types.js';
import { errorHandler, optionalAuth, cooldowns } from '../../middleware/index.js';
import { handleStart } from './start.js';
import {
  landmassSelectHandler,
  regionSelectHandler,
  areaSelectHandler,
  adventureMenuButtonHandler,
  customButtonHandler,
  startModalHandler,
  customModalHandler,
} from './start.js';
import { handleEncounter } from './encounter.js';
import { handleCapture } from './capture.js';
import { handleEnd } from './end.js';

// ============================================================================
// Slash command definition
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('adventure')
    .setDescription('Manage your adventure — start, encounter, capture, or end')
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a new adventure')
        .addStringOption((opt) =>
          opt.setName('trainer').setDescription('Your trainer\'s name').setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName('location').setDescription('Area ID for direct start (skip wizard)').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('encounter')
        .setDescription('Generate a random encounter in the current adventure'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('capture')
        .setDescription('Attempt to capture a monster from an encounter')
        .addStringOption((opt) =>
          opt.setName('trainer').setDescription('Your trainer\'s name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('pokeball').setDescription('Type of pokeball to use').setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('index')
            .setDescription('Monster index to target (default: 1)')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('pokepuffs')
            .setDescription('Number of pokepuffs to use (default: 0)')
            .setMinValue(0)
            .setMaxValue(10)
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('End the current adventure and calculate rewards'),
    ) as SlashCommandBuilder,

  middleware: [errorHandler, optionalAuth, cooldowns.standard()],

  meta: {
    name: 'adventure',
    description: 'Start, manage, and complete adventures. Generate encounters and capture monsters.',
    category: 'Adventure',
    usage: '/adventure start | /adventure encounter | /adventure capture | /adventure end',
    examples: [
      '/adventure start',
      '/adventure start trainer:Ash location:heimdal-city',
      '/adventure encounter',
      '/adventure capture trainer:Ash pokeball:Great Ball',
      '/adventure capture trainer:Ash pokeball:Ultra Ball index:2 pokepuffs:3',
      '/adventure end',
    ],
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'start':
        await handleStart(interaction);
        break;
      case 'encounter':
        await handleEncounter(interaction);
        break;
      case 'capture':
        await handleCapture(interaction);
        break;
      case 'end':
        await handleEnd(interaction);
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

export const buttons: ButtonHandler[] = [
  adventureMenuButtonHandler,
  customButtonHandler,
];

export const selectMenus: SelectMenuHandler[] = [
  landmassSelectHandler,
  regionSelectHandler,
  areaSelectHandler,
];

export const modals: ModalHandler[] = [
  startModalHandler,
  customModalHandler,
];
