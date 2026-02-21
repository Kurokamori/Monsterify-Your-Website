import {
  ActionRowBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type MessageActionRowComponentBuilder,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import { EmbedColor } from '../constants/colors.js';
import { SHOP } from '../constants/button-ids.js';
import { SHOPS, SHOP_BY_ID } from '../constants/shops.js';
import type { ShopItem, PurchaseResult } from '../services/market.service.js';
import type { Trainer } from '../services/trainer.service.js';
import { createEmbed, truncateText } from './base.presenter.js';
import { createButton, createActionRow } from './components/buttons.js';
import {
  getPage,
  getPaginationInfo,
  paginationButtons,
} from './components/pagination.js';

// ============================================================================
// Placeholder images
// ============================================================================

const MARKET_IMAGE = 'https://picture.com/market.png';

const SHOP_IMAGES: Record<string, string> = {
  apothecary: 'https://picture.com/apothecary.png',
  bakery: 'https://picture.com/bakery.png',
  witchs_hut: 'https://picture.com/witch.png',
  megamart: 'https://picture.com/megamart.png',
  kurts_cart: 'https://picture.com/kurts_cart.png',
  nursery: 'https://picture.com/nursery.png',
  antique_store: 'https://picture.com/antique.png',
  pirates_dock: 'https://picture.com/pirates.png',
};

// ============================================================================
// Items per page
// ============================================================================

export const ITEMS_PER_PAGE = 10;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert an item name to a Discord custom emoji reference.
 * e.g. "Bluk Berry" → ":Bluk_Berry:"
 */
function itemEmoji(name: string): string {
  return `:${name.replace(/\s+/g, '_')}:`;
}

/** Format a single shop item line for the stock embed. */
function formatItemLine(item: ShopItem): string {
  const emoji = itemEmoji(item.name);
  return `${emoji} **${item.name}** · ${item.price.toLocaleString()} coins`;
}

// ============================================================================
// Result types
// ============================================================================

export interface ShopEmbedResult {
  embed: ReturnType<typeof createEmbed>;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

// ============================================================================
// Market menu (list of shops as buttons)
// ============================================================================

/**
 * Build the market menu showing all available shops as buttons.
 */
export function marketMenuEmbed(): ShopEmbedResult {
  const embed = createEmbed(EmbedColor.MARKET)
    .setTitle('\uD83D\uDED2 Market')
    .setDescription('Welcome to the market! Choose a shop to browse.')
    .setImage(MARKET_IMAGE);

  const shopButtonIds: Record<string, string> = {
    apothecary: SHOP.APOTHECARY,
    bakery: SHOP.BAKERY,
    witchs_hut: SHOP.WITCHS_HUT,
    megamart: SHOP.MEGAMART,
    kurts_cart: SHOP.KURTS_CART,
    nursery: SHOP.NURSERY,
    antique_store: SHOP.ANTIQUE_STORE,
    pirates_dock: SHOP.PIRATES_DOCK,
  };

  const buttons = SHOPS.map((shop) =>
    createButton(
      shopButtonIds[shop.id] ?? `shop_${shop.id}`,
      shop.name,
      ButtonStyle.Secondary,
      { emoji: shop.emoji },
    ),
  );

  // 4 + 3 layout
  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(createActionRow(...buttons.slice(i, i + 4)));
  }

  rows.push(
    createActionRow(
      createButton('back', 'Back', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
    ),
  );

  return { embed, components: rows };
}

// ============================================================================
// Individual shop view
// ============================================================================

export interface ShopViewOptions {
  shopId: string;
  items: ShopItem[];
  selectedTrainer?: Trainer | null;
  page?: number;
}

/**
 * Build a shop view showing stock, the selected trainer's balance,
 * and buy / change-trainer / navigation buttons.
 */
export function shopViewEmbed(options: ShopViewOptions): ShopEmbedResult {
  const { shopId, items, selectedTrainer = null, page = 1 } = options;

  const shop = SHOP_BY_ID[shopId];
  const shopName = shop?.name ?? 'Shop';
  const shopEmoji = shop?.emoji ?? '\uD83C\uDFEA';
  const shopImage = SHOP_IMAGES[shopId];

  const embed = createEmbed(EmbedColor.MARKET)
    .setTitle(`${shopEmoji} ${shopName}`);

  if (shop?.description) {
    embed.setDescription(shop.description);
  }

  if (shopImage) {
    embed.setThumbnail(shopImage);
  }

  // -- Stock display --
  if (items.length === 0) {
    embed.addFields({
      name: '\uD83D\uDCE6 Stock',
      value: 'This shop has no items in stock.',
      inline: false,
    });
  } else {
    const pagination = getPaginationInfo(page, items.length, ITEMS_PER_PAGE);
    const pageItems = getPage(items, page, ITEMS_PER_PAGE);

    const stockLines = pageItems.map(formatItemLine);

    embed.addFields({
      name: `\uD83D\uDCE6 Stock (${pagination.currentPage}/${pagination.totalPages})`,
      value: stockLines.join('\n'),
      inline: false,
    });
  }

  // -- Trainer balance (at the bottom) --
  if (selectedTrainer) {
    embed.addFields({
      name: '\uD83D\uDCB0 Shopping with',
      value: `**${selectedTrainer.name}** \u2014 ${selectedTrainer.currencyAmount.toLocaleString()} coins`,
      inline: false,
    });
  } else {
    embed.addFields({
      name: '\uD83D\uDCB0 Trainer',
      value: 'No trainer selected. Use **Change Trainer** to pick one.',
      inline: false,
    });
  }

  // -- Components --
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  // Stock pagination (if needed)
  if (items.length > ITEMS_PER_PAGE) {
    const pagination = getPaginationInfo(page, items.length, ITEMS_PER_PAGE);
    components.push(paginationButtons(pagination, `shop_stock_page:${shopId}`));
  }

  // Action row: Buy, Change Trainer, Back
  components.push(
    createActionRow(
      createButton(
        `${SHOP.BUY}:${shopId}`,
        'Buy',
        ButtonStyle.Success,
        { emoji: '\uD83D\uDCB0', disabled: !selectedTrainer },
      ),
      createButton(
        `shop_change_trainer:${shopId}`,
        'Change Trainer',
        ButtonStyle.Primary,
        { emoji: '\uD83D\uDC64' },
      ),
      createButton(SHOP.MENU, 'Back to Market', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
    ),
  );

  return { embed, components };
}

// ============================================================================
// Trainer picker for shops
// ============================================================================

/**
 * Build an embed showing the user's trainers so they can pick one to shop with.
 */
export function shopTrainerPickerEmbed(
  shopId: string,
  trainers: Trainer[],
): ShopEmbedResult {
  const shop = SHOP_BY_ID[shopId];
  const shopName = shop?.name ?? 'Shop';

  const embed = createEmbed(EmbedColor.MARKET)
    .setTitle(`\uD83D\uDC64 Select a Trainer \u2014 ${shopName}`)
    .setDescription('Choose which trainer will be shopping.');

  if (trainers.length === 0) {
    embed.setDescription('You don\'t have any trainers yet.');
    return {
      embed,
      components: [
        createActionRow(
          createButton(SHOP.MENU, 'Back to Market', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
        ),
      ],
    };
  }

  const trainerLines = trainers.map(
    (t) => `\uD83D\uDC64 **${t.name}** \u2014 Lv. ${t.level} | ${t.currencyAmount.toLocaleString()} coins`,
  );
  embed.addFields({
    name: 'Your Trainers',
    value: trainerLines.join('\n'),
    inline: false,
  });

  // One button per trainer (max 5 per row, cap at 20 trainers / 4 rows + nav row)
  const trainerButtons = trainers.slice(0, 20).map((t) =>
    createButton(
      `shop_select_trainer:${shopId}:${t.id}`,
      truncateText(t.name, 40, 'Trainer'),
      ButtonStyle.Secondary,
      { emoji: '\uD83D\uDC64' },
    ),
  );

  const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
  for (let i = 0; i < trainerButtons.length; i += 5) {
    rows.push(createActionRow(...trainerButtons.slice(i, i + 5)));
  }

  // Nav row
  rows.push(
    createActionRow(
      createButton(`shop_back_to:${shopId}`, 'Back to Shop', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
    ),
  );

  return { embed, components: rows };
}

// ============================================================================
// Shop stock embed (standalone, no trainer — quick browse)
// ============================================================================

/**
 * Build just the stock embed for a shop (no trainer select or buy button).
 */
export function shopStockEmbed(
  shopId: string,
  items: ShopItem[],
  page = 1,
): ReturnType<typeof createEmbed> {
  const shop = SHOP_BY_ID[shopId];
  const shopName = shop?.name ?? 'Shop';
  const shopEmoji = shop?.emoji ?? '\uD83C\uDFEA';

  const embed = createEmbed(EmbedColor.MARKET)
    .setTitle(`${shopEmoji} ${shopName} \u2014 Stock`);

  if (items.length === 0) {
    embed.setDescription('This shop has no items in stock.');
    return embed;
  }

  const pagination = getPaginationInfo(page, items.length, ITEMS_PER_PAGE);
  const pageItems = getPage(items, page, ITEMS_PER_PAGE);

  const lines = pageItems.map((item, i) => {
    const num = pagination.startIndex + i + 1;
    return `\`${num}.\` ${formatItemLine(item)}`;
  });

  embed.setDescription(lines.join('\n'));

  if (pagination.totalPages > 1) {
    embed.setFooter({
      text: `Page ${pagination.currentPage}/${pagination.totalPages} | ${pagination.totalItems} items`,
    });
  }

  return embed;
}

// ============================================================================
// Purchase modal
// ============================================================================

/**
 * Build a modal for purchasing an item.
 * Inputs: item name (required), quantity (optional, default 1).
 */
export function purchaseModal(shopId: string): ModalBuilder {
  const shop = SHOP_BY_ID[shopId];
  const shopName = shop?.name ?? 'Shop';

  return new ModalBuilder()
    .setCustomId(`purchase_modal:${shopId}`)
    .setTitle(`Buy from ${shopName}`)
    .addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('item_name')
          .setLabel('Item Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter the item name...')
          .setRequired(true)
          .setMaxLength(100),
      ),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('quantity')
          .setLabel('Quantity')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('1')
          .setRequired(false)
          .setMaxLength(5)
          .setValue('1'),
      ),
    );
}

// ============================================================================
// Purchase result embeds
// ============================================================================

export function purchaseSuccessEmbed(result: PurchaseResult): ReturnType<typeof createEmbed> {
  return createEmbed(EmbedColor.SUCCESS)
    .setTitle('\uD83D\uDCB0 Purchase Successful!')
    .setDescription(
      `You bought **${result.quantity}x ${result.itemName}** `
      + `for **${result.totalCost.toLocaleString()} coins**.`,
    )
    .addFields({
      name: '\uD83D\uDCB5 Remaining Balance',
      value: `${result.newBalance.toLocaleString()} coins`,
      inline: true,
    });
}

export function purchaseFailureEmbed(reason: string): ReturnType<typeof createEmbed> {
  return createEmbed(EmbedColor.ERROR)
    .setTitle('\u274C Purchase Failed')
    .setDescription(reason);
}

// ============================================================================
// Daily deals embed
// ============================================================================

export function dealsEmbed(
  items: ShopItem[],
  page = 1,
): ShopEmbedResult {
  const embed = createEmbed(EmbedColor.MARKET)
    .setTitle('\uD83C\uDFF7\uFE0F Daily Deals');

  if (items.length === 0) {
    embed.setDescription('No deals available right now. Check back later!');
    return { embed, components: [] };
  }

  const pagination = getPaginationInfo(page, items.length, ITEMS_PER_PAGE);
  const pageItems = getPage(items, page, ITEMS_PER_PAGE);

  const lines = pageItems.map(formatItemLine);
  embed.setDescription(lines.join('\n'));

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (pagination.totalPages > 1) {
    components.push(paginationButtons(pagination, 'deals_page'));
  }

  components.push(
    createActionRow(
      createButton(SHOP.DEALS_BUY, 'Buy Deal', ButtonStyle.Success, { emoji: '\uD83D\uDCB0' }),
      createButton(SHOP.MENU, 'Back to Market', ButtonStyle.Secondary, { emoji: '\u2B05\uFE0F' }),
    ),
  );

  return { embed, components };
}
