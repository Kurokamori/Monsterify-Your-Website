// ============================================================================
// Static shop definitions — avoids fetching shop metadata from the API.
// IDs must match the `shop_id` column in the database `shops` table.
// ============================================================================

export interface ShopDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const SHOPS: ShopDefinition[] = [
  {
    id: 'apothecary',
    name: 'Apothecary',
    emoji: '\uD83E\uDDEA', // 🧪
    description: 'Berries and potions that modify monster traits',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    emoji: '\uD83C\uDF5E', // 🍞
    description: 'Delicious pastries that set specific monster traits',
  },
  {
    id: 'witchs_hut',
    name: "Witch's Hut",
    emoji: '\uD83D\uDD2E', // 🔮
    description: 'Magical evolution items and mystical artifacts',
  },
  {
    id: 'megamart',
    name: 'Mega Mart',
    emoji: '\uD83C\uDFEA', // 🏪
    description: 'Balls, held items, and general supplies',
  },
  {
    id: 'kurts_cart',
    name: "Kurt's Cart",
    emoji: '\uD83D\uDED2', // 🛒
    description: 'A wandering merchant with unique wares and custom pokeballs',
  },
  {
    id: 'nursery',
    name: 'Nursery',
    emoji: '\uD83E\uDD5A', // 🥚
    description: 'Eggs for hatching and breeding supplies',
  },
  {
    id: 'antique_store',
    name: 'Antique Store',
    emoji: '\uD83C\uDFFA', // 🏺
    description: 'Rare and unique event items with special properties',
  },
  {
    id: 'pirates_dock',
    name: "Pirate's Dock",
    emoji: '\uD83C\uDFF4\u200D\u2620\uFE0F', // 🏴‍☠️
    description: 'Maritime items and pirate treasures',
  },
];

export const SHOP_BY_ID = Object.fromEntries(
  SHOPS.map((shop) => [shop.id, shop]),
) as Record<string, ShopDefinition>;
