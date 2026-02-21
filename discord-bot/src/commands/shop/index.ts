import {
  SlashCommandBuilder,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import type { Command, ButtonHandler, ModalHandler } from '../../types/command.types.js';
import { errorHandler } from '../../middleware/error.middleware.js';
import { requireAuth, requireContext } from '../../middleware/auth.middleware.js';
import { cooldowns } from '../../middleware/cooldown.middleware.js';
import { SHOP } from '../../constants/button-ids.js';
import { SHOPS } from '../../constants/shops.js';
import {
  marketMenuEmbed,
  shopViewEmbed,
  shopTrainerPickerEmbed,
  purchaseModal,
  purchaseSuccessEmbed,
  purchaseFailureEmbed,
} from '../../presenters/shop.presenter.js';

import { ITEMS_PER_PAGE } from '../../presenters/shop.presenter.js';
import * as marketService from '../../services/market.service.js';
import * as trainerService from '../../services/trainer.service.js';
import {
  getPaginationInfo,
  resolvePageFromButton,
} from '../../presenters/components/pagination.js';

// ============================================================================
// Per-user state: which trainer is selected for each shop
// ============================================================================

interface ShopSession {
  trainerId: number;
  /** Timestamp of last interaction — for cleanup. */
  lastUsed: number;
}

/**
 * In-memory map: `discordUserId:shopId` → selected trainer ID.
 * Cleaned up periodically to avoid unbounded growth.
 */
const shopSessions = new Map<string, ShopSession>();

function sessionKey(discordId: string, shopId: string): string {
  return `${discordId}:${shopId}`;
}

function getSession(discordId: string, shopId: string): ShopSession | undefined {
  const s = shopSessions.get(sessionKey(discordId, shopId));
  if (s) {
    s.lastUsed = Date.now();
  }
  return s;
}

function setSession(discordId: string, shopId: string, trainerId: number): void {
  shopSessions.set(sessionKey(discordId, shopId), {
    trainerId,
    lastUsed: Date.now(),
  });
}

// Prune sessions older than 30 minutes every 5 minutes
const SESSION_TTL = 30 * 60 * 1000;
const pruneInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, session] of shopSessions) {
    if (now - session.lastUsed > SESSION_TTL) {
      shopSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (pruneInterval.unref) {
  pruneInterval.unref();
}

// ============================================================================
// Helpers
// ============================================================================

const shopChoices = SHOPS.map((s) => ({ name: s.name, value: s.id }));

/** Map shop button IDs → shop string IDs (must match DB shop_id). */
const BUTTON_TO_SHOP: Record<string, string> = {
  [SHOP.APOTHECARY]: 'apothecary',
  [SHOP.BAKERY]: 'bakery',
  [SHOP.WITCHS_HUT]: 'witchs_hut',
  [SHOP.MEGAMART]: 'megamart',
  [SHOP.KURTS_CART]: 'kurts_cart',
  [SHOP.NURSERY]: 'nursery',
  [SHOP.ANTIQUE_STORE]: 'antique_store',
  [SHOP.PIRATES_DOCK]: 'pirates_dock',
};

/** Build the full shop view for a user, resolving their selected trainer. */
async function buildShopView(
  discordId: string,
  shopId: string,
  page = 1,
): Promise<ReturnType<typeof shopViewEmbed>> {
  const items = await marketService.getShopItems(shopId);

  const session = getSession(discordId, shopId);
  let selectedTrainer: trainerService.Trainer | null = null;

  if (session) {
    selectedTrainer = await trainerService.getTrainerById(session.trainerId);
  }

  // If no trainer selected yet, auto-select first trainer
  if (!selectedTrainer) {
    const trainers = await trainerService.getTrainersByUserId(discordId);
    const first = trainers[0];
    if (first) {
      selectedTrainer = first;
      setSession(discordId, shopId, first.id);
    }
  }

  return shopViewEmbed({ shopId, items, selectedTrainer, page });
}

// ============================================================================
// /shop command
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse and buy items from the market shops')
    .addStringOption((opt) =>
      opt
        .setName('shop')
        .setDescription('Go directly to a specific shop')
        .setRequired(false)
        .addChoices(...shopChoices),
    ),

  middleware: [errorHandler, requireAuth, cooldowns.standard()],

  meta: {
    name: 'shop',
    description: 'Browse and buy items from the market shops.',
    category: 'Market',
    usage: '/shop [shop]',
  },

  async execute(interaction) {
    const shopId = interaction.options.getString('shop');

    if (shopId) {
      const ctx = requireContext(interaction);
      const { embed, components } = await buildShopView(ctx.discordId, shopId);
      await interaction.reply({ embeds: [embed], components });
      return;
    }

    // Default: market menu
    const { embed, components } = marketMenuEmbed();
    await interaction.reply({ embeds: [embed], components });
  },
};

// ============================================================================
// Button handlers
// ============================================================================

/** Show the market menu. */
async function handleShopMenu(interaction: ButtonInteraction): Promise<void> {
  const { embed, components } = marketMenuEmbed();
  await interaction.update({ embeds: [embed], components });
}

/** Visit a specific shop from a market menu button. */
async function handleShopButton(interaction: ButtonInteraction): Promise<void> {
  const shopId = BUTTON_TO_SHOP[interaction.customId];
  if (!shopId) {
    await interaction.reply({ content: 'Unknown shop.', ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;
  const { embed, components } = await buildShopView(discordId, shopId);
  await interaction.update({ embeds: [embed], components });
}

/** Handle stock pagination. customId format: `shop_stock_page:{shopId}_{action}` */
async function handleStockPagination(interaction: ButtonInteraction): Promise<void> {
  // Parse shop ID and action from custom ID
  // Format: shop_stock_page:{shopId}_{first|prev|next|last}
  const fullId = interaction.customId;
  const prefixMatch = fullId.match(/^shop_stock_page:([^_]+)/);
  if (!prefixMatch) {
    await interaction.reply({ content: 'Invalid pagination.', ephemeral: true });
    return;
  }
  const shopId = prefixMatch[1] ?? '';
  const prefix = `shop_stock_page:${shopId}`;

  // Get current page from existing embed field header
  const existingEmbed = interaction.message.embeds[0];
  const stockField = existingEmbed?.fields.find((f) => f.name.startsWith('\uD83D\uDCE6 Stock'));
  let currentPage = 1;
  const pageMatch = stockField?.name.match(/\((\d+)\/(\d+)\)/);
  if (pageMatch?.[1]) {
    currentPage = parseInt(pageMatch[1], 10);
  }

  const items = await marketService.getShopItems(shopId);
  const pagination = getPaginationInfo(currentPage, items.length, ITEMS_PER_PAGE);
  const newPage = resolvePageFromButton(fullId, prefix, pagination.currentPage, pagination.totalPages);

  if (newPage === null) {
    await interaction.deferUpdate();
    return;
  }

  const discordId = interaction.user.id;
  const session = getSession(discordId, shopId);
  let selectedTrainer: trainerService.Trainer | null = null;
  if (session) {
    selectedTrainer = await trainerService.getTrainerById(session.trainerId);
  }

  const { embed, components } = shopViewEmbed({
    shopId,
    items,
    selectedTrainer,
    page: newPage,
  });
  await interaction.update({ embeds: [embed], components });
}

/** Open the trainer picker for a shop. customId: `shop_change_trainer:{shopId}` */
async function handleChangeTrainer(interaction: ButtonInteraction): Promise<void> {
  const shopId = interaction.customId.split(':')[1];
  if (!shopId) {
    await interaction.reply({ content: 'Invalid shop.', ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;
  const trainers = await trainerService.getTrainersByUserId(discordId);
  const { embed, components } = shopTrainerPickerEmbed(shopId, trainers);
  await interaction.update({ embeds: [embed], components });
}

/** Select a trainer. customId: `shop_select_trainer:{shopId}:{trainerId}` */
async function handleSelectTrainer(interaction: ButtonInteraction): Promise<void> {
  const parts = interaction.customId.split(':');
  const shopId = parts[1];
  const trainerId = parseInt(parts[2] ?? '', 10);

  if (!shopId || isNaN(trainerId)) {
    await interaction.reply({ content: 'Invalid selection.', ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;
  setSession(discordId, shopId, trainerId);

  const { embed, components } = await buildShopView(discordId, shopId);
  await interaction.update({ embeds: [embed], components });
}

/** Go back to shop view from trainer picker. customId: `shop_back_to:{shopId}` */
async function handleBackToShop(interaction: ButtonInteraction): Promise<void> {
  const shopId = interaction.customId.split(':')[1];
  if (!shopId) {
    await interaction.reply({ content: 'Invalid shop.', ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;
  const { embed, components } = await buildShopView(discordId, shopId);
  await interaction.update({ embeds: [embed], components });
}

/** Open the purchase modal. customId: `shop_buy:{shopId}` */
async function handleBuyButton(interaction: ButtonInteraction): Promise<void> {
  const shopId = interaction.customId.split(':')[1];
  if (!shopId) {
    await interaction.reply({ content: 'Invalid shop.', ephemeral: true });
    return;
  }

  const modal = purchaseModal(shopId);
  await interaction.showModal(modal);
}

// ============================================================================
// Modal handler: purchase submission
// ============================================================================

/** Process the purchase modal. customId: `purchase_modal:{shopId}` */
async function handlePurchaseModal(interaction: ModalSubmitInteraction): Promise<void> {
  const shopId = interaction.customId.split(':')[1];
  if (!shopId) {
    await interaction.reply({ content: 'Invalid shop.', ephemeral: true });
    return;
  }

  const itemName = interaction.fields.getTextInputValue('item_name').trim();
  const quantityStr = interaction.fields.getTextInputValue('quantity').trim() || '1';
  const quantity = parseInt(quantityStr, 10);

  if (!itemName) {
    const embed = purchaseFailureEmbed('Please enter an item name.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (isNaN(quantity) || quantity < 1) {
    const embed = purchaseFailureEmbed('Quantity must be a positive number.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const discordId = interaction.user.id;
  const session = getSession(discordId, shopId);

  if (!session) {
    const embed = purchaseFailureEmbed('No trainer selected. Please select a trainer first.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // Find the item in the shop stock
  const items = await marketService.getShopItems(shopId);
  const lowerName = itemName.toLowerCase();
  const item = items.find((i) => i.name.toLowerCase() === lowerName);

  if (!item) {
    const embed = purchaseFailureEmbed(
      `Could not find **${itemName}** in this shop. Check the spelling and try again.`,
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    const result = await marketService.purchaseItem(
      shopId,
      item.id,
      session.trainerId,
      quantity,
      discordId,
    );

    const embed = purchaseSuccessEmbed(result);
    await interaction.editReply({ embeds: [embed] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    // Try to extract a cleaner message from axios errors
    const apiMessage = extractApiMessage(err) ?? message;
    const embed = purchaseFailureEmbed(apiMessage);

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

function extractApiMessage(err: unknown): string | null {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err
  ) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return null;
}

// ============================================================================
// Exported handlers
// ============================================================================

export const buttons: ButtonHandler[] = [
  // Market menu
  { customId: SHOP.MENU, execute: handleShopMenu },

  // Individual shop buttons
  ...Object.keys(BUTTON_TO_SHOP).map(
    (buttonId): ButtonHandler => ({
      customId: buttonId,
      execute: handleShopButton,
    }),
  ),

  // Stock pagination (regex: shop_stock_page:{shopId}_{action})
  {
    customId: /^shop_stock_page:[^_]+_(first|prev|next|last|indicator)$/,
    execute: handleStockPagination,
  },

  // Buy button (shop_buy:{shopId})
  { customId: /^shop_buy:/, execute: handleBuyButton },

  // Change trainer (shop_change_trainer:{shopId})
  { customId: /^shop_change_trainer:/, execute: handleChangeTrainer },

  // Select trainer (shop_select_trainer:{shopId}:{trainerId})
  { customId: /^shop_select_trainer:/, execute: handleSelectTrainer },

  // Back to shop from trainer picker (shop_back_to:{shopId})
  { customId: /^shop_back_to:/, execute: handleBackToShop },
];

export const modals: ModalHandler[] = [
  // Purchase modal (purchase_modal:{shopId})
  { customId: /^purchase_modal:/, execute: handlePurchaseModal },
];
