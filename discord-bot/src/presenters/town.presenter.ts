import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { EmbedColor } from '../constants/colors.js';
import { TOWN, SHOP, ADVENTURE } from '../constants/button-ids.js';
import {
  TOWN_LOCATIONS,
  TOWN_LOCATION_BY_ID,
  type TownLocation,
} from '../constants/town-locations.js';
import { createEmbed } from './base.presenter.js';
import { createButton, createActionRow } from './components/buttons.js';

// ============================================================================
// Placeholder images — replace with real URLs later
// ============================================================================

const TOWN_IMAGE = 'https://picture.com/town.png';
const TOWN_MENU_IMAGE = 'https://picture.com/town-menu.png';

// ============================================================================
// Result types
// ============================================================================

export interface EmbedResult {
  embed: ReturnType<typeof createEmbed>;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

// ============================================================================
// Location → button ID mapping
// ============================================================================

const LOCATION_BUTTON_IDS: Record<string, string> = {
  apothecary: TOWN.APOTHECARY,
  bakery: TOWN.BAKERY,
  witch_hut: TOWN.WITCH_HUT,
  mega_mart: TOWN.MEGA_MART,
  antique_store: TOWN.ANTIQUE_STORE,
  nursery: TOWN.NURSERY,
  pirates_dock: TOWN.PIRATES_DOCK,
  garden: TOWN.GARDEN,
  game_corner: TOWN.GAME_CORNER,
  farm: TOWN.FARM,
  adoption_center: TOWN.ADOPTION_CENTER,
  trade_center: TOWN.TRADE_CENTER,
  bazaar: TOWN.BAZAAR,
};

// ============================================================================
// Main menu (entry point — Visit Town / Visit Market / Adventure)
// ============================================================================

/**
 * Build the main hub menu with buttons for Town, Market, and Adventure.
 */
export function mainMenuEmbed(): EmbedResult {
  const embed = createEmbed(EmbedColor.TOWN)
    .setTitle('Welcome to Dusk & Dawn!')
    .setDescription(
      'Choose where you\'d like to go. Visit the town to explore locations, '
      + 'head to the market to buy supplies, or set out on an adventure!',
    )
    .setImage(TOWN_IMAGE);

  const row = createActionRow(
    createButton(TOWN.MENU, 'Visit Town', ButtonStyle.Primary, { emoji: '\uD83C\uDFD8\uFE0F' }),
    createButton(SHOP.MENU, 'Visit Market', ButtonStyle.Primary, { emoji: '\uD83D\uDED2' }),
    createButton(ADVENTURE.ENCOUNTER, 'Adventure', ButtonStyle.Success, { emoji: '\u2694\uFE0F' }),
  );

  return { embed, components: [row] };
}

// ============================================================================
// Town menu (grid of all town locations)
// ============================================================================

/**
 * Build the town overview showing all available locations as buttons.
 *
 * Locations are laid out across action rows (max 5 buttons per row,
 * max 5 rows — Discord limits). With 13 locations this yields 3 rows.
 */
export function townMenuEmbed(): EmbedResult {
  const embed = createEmbed(EmbedColor.TOWN)
    .setTitle('\uD83C\uDFD8\uFE0F Town')
    .setDescription(
      'Welcome to town! Each corner has something unique to offer. '
      + 'Choose a location to visit.',
    )
    .setImage(TOWN_MENU_IMAGE);

  const buttons = TOWN_LOCATIONS.map((loc) =>
    createButton(
      LOCATION_BUTTON_IDS[loc.id] ?? `town_${loc.id}`,
      loc.name,
      ButtonStyle.Secondary,
      { emoji: loc.emoji },
    ),
  );

  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(createActionRow(...buttons.slice(i, i + 5)));
  }

  // Back button row
  rows.push(
    createActionRow(
      createButton('back', 'Back', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
    ),
  );

  return { embed, components: rows };
}

// ============================================================================
// Reusable town location presenter
// ============================================================================

export interface LocationViewOptions {
  /** The town location to display. */
  location: TownLocation;
  /** Extra buttons specific to this location (e.g. activities). */
  activityButtons?: ButtonBuilder[];
  /** Whether to show an "under construction" notice instead of activities. */
  underConstruction?: boolean;
}

/**
 * Generic, reusable presenter for any town location.
 *
 * Renders an embed with:
 * - Title (emoji + name)
 * - Flavor text description
 * - Optional location image
 * - "Under construction" notice when applicable
 * - Optional shop button (if the location has an associated shop)
 * - Custom activity buttons
 * - Back to Town button
 */
export function townLocationEmbed(options: LocationViewOptions): EmbedResult {
  const { location, activityButtons = [], underConstruction = false } = options;

  const embed = createEmbed(EmbedColor.TOWN)
    .setTitle(`${location.emoji} ${location.name}`);

  if (underConstruction) {
    embed.setDescription(
      `${location.description}\n\n`
      + '\uD83D\uDEA7 **Under Construction**\n'
      + 'This location is still being built. Check back soon!',
    );
  } else {
    embed.setDescription(location.description);
  }

  if (location.image) {
    embed.setImage(location.image);
  }

  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // Activity buttons (only when not under construction)
  if (!underConstruction && activityButtons.length > 0) {
    for (let i = 0; i < activityButtons.length; i += 5) {
      rows.push(createActionRow(...activityButtons.slice(i, i + 5)));
    }
  }

  // Navigation row: optional shop button + back to town
  const navButtons: ButtonBuilder[] = [];

  if (location.shopButtonId) {
    navButtons.push(
      createButton(location.shopButtonId, 'Visit Shop', ButtonStyle.Success, { emoji: '\uD83D\uDED2' }),
    );
  }

  navButtons.push(
    createButton(TOWN.MENU, 'Back to Town', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
  );

  rows.push(createActionRow(...navButtons));

  return { embed, components: rows };
}

// ============================================================================
// Convenience: render a location by ID (under construction by default)
// ============================================================================

/**
 * Look up a town location by ID and render it.
 * Returns an error embed if the location ID is invalid.
 */
export function townLocationById(
  locationId: string,
  options?: Partial<Omit<LocationViewOptions, 'location'>>,
): EmbedResult {
  const location = TOWN_LOCATION_BY_ID[locationId];
  if (!location) {
    const embed = createEmbed(EmbedColor.ERROR)
      .setDescription('Unknown location.');
    return { embed, components: [] };
  }

  return townLocationEmbed({
    location,
    underConstruction: true,
    ...options,
  });
}
