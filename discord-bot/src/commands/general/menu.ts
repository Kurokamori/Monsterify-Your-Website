import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.types.js';
import { mainMenuEmbed } from '../../presenters/town.presenter.js';

// ============================================================================
// /menu — Main hub menu (Town / Market / Adventure)
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Open the main menu to visit the town, market, or go on an adventure'),

  meta: {
    name: 'menu',
    description: 'Open the main menu to visit the town, market, or go on an adventure.',
    category: 'General',
  },

  async execute(interaction) {
    const { embed, components } = mainMenuEmbed();
    await interaction.reply({ embeds: [embed], components });
  },
};
