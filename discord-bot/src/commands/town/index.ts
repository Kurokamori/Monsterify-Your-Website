import { SlashCommandBuilder, type ButtonInteraction } from 'discord.js';
import type { Command, ButtonHandler } from '../../types/command.types.js';
import { errorHandler } from '../../middleware/error.middleware.js';
import { cooldowns } from '../../middleware/cooldown.middleware.js';
import { TOWN } from '../../constants/button-ids.js';
import { TOWN_LOCATIONS } from '../../constants/town-locations.js';
import {
  mainMenuEmbed,
  townMenuEmbed,
  townLocationById,
} from '../../presenters/town.presenter.js';

// ============================================================================
// /town — Show the town overview (or visit a specific location)
// ============================================================================

const locationChoices = TOWN_LOCATIONS.map((loc) => ({
  name: loc.name,
  value: loc.id,
}));

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('town')
    .setDescription('Visit the town and explore its locations')
    .addSubcommand((sub) =>
      sub
        .setName('menu')
        .setDescription('Open the town overview'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('Visit a specific town location')
        .addStringOption((opt) =>
          opt
            .setName('location')
            .setDescription('The location to visit')
            .setRequired(true)
            .addChoices(...locationChoices),
        ),
    ),

  middleware: [errorHandler, cooldowns.standard()],

  meta: {
    name: 'town',
    description: 'Visit the town and explore its locations.',
    category: 'Town',
    usage: '/town menu | /town view <location>',
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      const locationId = interaction.options.getString('location', true);
      const { embed, components } = townLocationById(locationId);
      await interaction.reply({ embeds: [embed], components });
      return;
    }

    // Default: show town menu
    const { embed, components } = townMenuEmbed();
    await interaction.reply({ embeds: [embed], components });
  },
};

// ============================================================================
// Button handlers
// ============================================================================

/**
 * Map town button IDs → location IDs so we can resolve which location
 * a button press corresponds to.
 */
const BUTTON_TO_LOCATION: Record<string, string> = {
  [TOWN.APOTHECARY]: 'apothecary',
  [TOWN.BAKERY]: 'bakery',
  [TOWN.WITCH_HUT]: 'witch_hut',
  [TOWN.MEGA_MART]: 'mega_mart',
  [TOWN.ANTIQUE_STORE]: 'antique_store',
  [TOWN.NURSERY]: 'nursery',
  [TOWN.PIRATES_DOCK]: 'pirates_dock',
  [TOWN.GARDEN]: 'garden',
  [TOWN.GAME_CORNER]: 'game_corner',
  [TOWN.FARM]: 'farm',
  [TOWN.ADOPTION_CENTER]: 'adoption_center',
  [TOWN.TRADE_CENTER]: 'trade_center',
  [TOWN.BAZAAR]: 'bazaar',
};

/** Show a specific town location when its button is pressed. */
async function handleLocationButton(interaction: ButtonInteraction): Promise<void> {
  const locationId = BUTTON_TO_LOCATION[interaction.customId];
  if (!locationId) {
    await interaction.reply({
      content: 'Unknown location.',
      ephemeral: true,
    });
    return;
  }

  const { embed, components } = townLocationById(locationId);
  await interaction.update({ embeds: [embed], components });
}

/** Show the town menu (from the main menu "Visit Town" button or "Back to Town"). */
async function handleTownMenu(interaction: ButtonInteraction): Promise<void> {
  const { embed, components } = townMenuEmbed();
  await interaction.update({ embeds: [embed], components });
}

/** Return to the main hub menu (from the town "Back" button). */
async function handleBack(interaction: ButtonInteraction): Promise<void> {
  const { embed, components } = mainMenuEmbed();
  await interaction.update({ embeds: [embed], components });
}

// ============================================================================
// Exported button handlers
// ============================================================================

export const buttons: ButtonHandler[] = [
  // Town menu button (from main menu or location "Back to Town")
  { customId: TOWN.MENU, execute: handleTownMenu },

  // Back button (from town menu → main menu)
  { customId: 'back', execute: handleBack },

  // Individual location buttons
  ...Object.keys(BUTTON_TO_LOCATION).map(
    (buttonId): ButtonHandler => ({
      customId: buttonId,
      execute: handleLocationButton,
    }),
  ),
];
