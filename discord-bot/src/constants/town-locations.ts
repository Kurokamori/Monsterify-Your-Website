// ============================================================================
// Static town location definitions for the Discord bot UI.
// ============================================================================

export interface TownLocation {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Optional shop button ID — when set, the location view includes a "Visit Shop" button. */
  shopButtonId?: string;
  /** Placeholder image URL for the location embed. */
  image?: string;
}

export const TOWN_LOCATIONS: TownLocation[] = [
  {
    id: 'apothecary',
    name: 'Apothecary',
    emoji: '\uD83E\uDDEA', // 🧪
    description:
      'Shelves of bubbling potions and dried herbs line the walls. '
      + 'The apothecary offers berries and elixirs that can modify your monsters\' traits.',
    shopButtonId: 'shop_apothecary',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    emoji: '\uD83C\uDF5E', // 🍞
    description:
      'The warm aroma of freshly baked goods fills the air. '
      + 'The baker crafts enchanted pastries that can set specific monster traits.',
    shopButtonId: 'shop_bakery',
  },
  {
    id: 'witch_hut',
    name: "Witch's Hut",
    emoji: '\uD83D\uDD2E', // 🔮
    description:
      'A crooked hut at the edge of town, surrounded by a faint purple glow. '
      + 'The witch sells magical evolution items and mystical artifacts.',
    shopButtonId: 'shop_witchs_hut',
  },
  {
    id: 'mega_mart',
    name: 'Mega Mart',
    emoji: '\uD83C\uDFEA', // 🏪
    description:
      'The one-stop shop for all your adventuring needs. '
      + 'Stock up on pok\u00e9balls, held items, and general supplies.',
    shopButtonId: 'shop_megamart',
  },
  {
    id: 'antique_store',
    name: 'Antique Store',
    emoji: '\uD83C\uDFFA', // 🏺
    description:
      'Dusty relics and peculiar curiosities crowd every surface. '
      + 'You never know what rare treasures you might uncover here.',
    shopButtonId: 'shop_antique_store',
  },
  {
    id: 'nursery',
    name: 'Nursery',
    emoji: '\uD83E\uDD5A', // 🥚
    description:
      'Rows of warm incubators hum softly in the nursery. '
      + 'Bring your eggs here to hatch and browse breeding supplies.',
    shopButtonId: 'shop_nursery',
  },
  {
    id: 'pirates_dock',
    name: "Pirate's Dock",
    emoji: '\uD83C\uDFF4\u200D\u2620\uFE0F', // 🏴‍☠️
    description:
      'Salt spray and sea shanties greet you at the dock. '
      + 'Swab the deck, go fishing, or hunt for buried treasure.',
    shopButtonId: 'shop_pirates_dock',
  },
  {
    id: 'garden',
    name: 'Garden',
    emoji: '\uD83C\uDF31', // 🌱
    description:
      'A peaceful plot of rich soil and blooming flowers. '
      + 'Tend your garden, plant seeds, and harvest the fruits of your labor.',
  },
  {
    id: 'game_corner',
    name: 'Game Corner',
    emoji: '\uD83C\uDFAE', // 🎮
    description:
      'Flashing lights and cheerful jingles fill this lively arcade. '
      + 'Try your luck at mini games, challenges, and pomodoro sessions.',
  },
  {
    id: 'farm',
    name: 'Farm',
    emoji: '\uD83D\uDE9C', // 🚜
    description:
      'Rolling fields stretch out before you under a wide sky. '
      + 'Breed monsters, tend to your livestock, and manage the homestead.',
  },
  {
    id: 'adoption_center',
    name: 'Adoption Center',
    emoji: '\uD83C\uDFE5', // 🏥
    description:
      'Give a monster in need a loving home. '
      + 'Browse the available adopts and claim a new companion each month.',
  },
  {
    id: 'trade_center',
    name: 'Trade Center',
    emoji: '\uD83D\uDD04', // 🔄
    description:
      'The bustling hub of commerce between trainers. '
      + 'Post trade offers, browse listings, and strike a deal.',
  },
  {
    id: 'bazaar',
    name: 'Bazaar',
    emoji: '\uD83C\uDFEA', // 🏪
    description:
      'A vibrant open-air market where trainers sell their wares. '
      + 'Find unique items, limited deals, and hidden bargains.',
  },
];

export const TOWN_LOCATION_BY_ID = Object.fromEntries(
  TOWN_LOCATIONS.map((loc) => [loc.id, loc]),
) as Record<string, TownLocation>;
