/**
 * /buy command — purchase items directly without navigating the shop UI.
 *
 * Usage:
 *   /buy trainer:<name> item:<name> [quantity:<n>] [shop:<id>]
 */

import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.types.js';
import { errorHandler } from '../../middleware/error.middleware.js';
import { requireAuth, requireContext } from '../../middleware/auth.middleware.js';
import { getContext } from '../../middleware/auth.middleware.js';
import { cooldowns } from '../../middleware/cooldown.middleware.js';
import { SHOPS } from '../../constants/shops.js';
import {
  purchaseSuccessEmbed,
  purchaseFailureEmbed,
} from '../../presenters/shop.presenter.js';
import * as marketService from '../../services/market.service.js';
import * as trainerService from '../../services/trainer.service.js';

// ============================================================================
// Helpers
// ============================================================================

const shopChoices = SHOPS.map((s) => ({ name: s.name, value: s.id }));

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
// /buy command
// ============================================================================

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from a shop')
    .addStringOption((opt) =>
      opt
        .setName('trainer')
        .setDescription('Trainer making the purchase')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('item')
        .setDescription('Item to buy')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('quantity')
        .setDescription('Number to buy (default 1)')
        .setRequired(false)
        .setMinValue(1),
    )
    .addStringOption((opt) =>
      opt
        .setName('shop')
        .setDescription('Buy from a specific shop')
        .setRequired(false)
        .addChoices(...shopChoices),
    ),

  middleware: [errorHandler, requireAuth, cooldowns.standard()],

  meta: {
    name: 'buy',
    description: 'Purchase an item from a shop without navigating the shop UI.',
    category: 'Market',
    usage: '/buy trainer:<name> item:<name> [quantity:<n>] [shop:<id>]',
    examples: [
      '/buy trainer:Ash item:Bluk Berry',
      '/buy trainer:Ash item:Bluk Berry quantity:2',
      '/buy trainer:Ash item:Bluk Berry quantity:1 shop:Apothecary',
    ],
  },

  async execute(interaction) {
    const ctx = requireContext(interaction);
    const trainerName = interaction.options.getString('trainer', true);
    const itemName = interaction.options.getString('item', true);
    const quantity = interaction.options.getInteger('quantity') ?? 1;
    const shopId = interaction.options.getString('shop');

    // Resolve trainer
    const trainer = await trainerService.findTrainerByName(ctx.discordId, trainerName);
    if (!trainer) {
      const embed = purchaseFailureEmbed(`Could not find a trainer named **${trainerName}**.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Find the item in the specified shop or across all shops
    let foundShopId: string | null = null;
    let foundItem: marketService.ShopItem | null = null;

    if (shopId) {
      const items = await marketService.getShopItems(shopId);
      const lower = itemName.toLowerCase();
      const match = items.find((i) => i.name.toLowerCase() === lower);
      if (match) {
        foundShopId = shopId;
        foundItem = match;
      }
    } else {
      // Search all shops
      for (const shop of SHOPS) {
        const items = await marketService.getShopItems(shop.id);
        const lower = itemName.toLowerCase();
        const match = items.find((i) => i.name.toLowerCase() === lower);
        if (match) {
          foundShopId = shop.id;
          foundItem = match;
          break;
        }
      }
    }

    if (!foundShopId || !foundItem) {
      const where = shopId
        ? `in **${SHOPS.find((s) => s.id === shopId)?.name ?? shopId}**`
        : 'in any shop';
      const embed = purchaseFailureEmbed(
        `Could not find **${itemName}** ${where}. Check the spelling and try again.`,
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Purchase
    try {
      await interaction.deferReply({ ephemeral: true });

      const result = await marketService.purchaseItem(
        foundShopId,
        foundItem.id,
        trainer.id,
        quantity,
        ctx.discordId,
      );

      const embed = purchaseSuccessEmbed(result);
      await interaction.editReply({ embeds: [embed] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      const apiMessage = extractApiMessage(err) ?? message;
      const embed = purchaseFailureEmbed(apiMessage);

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    const ctx = getContext(interaction as never);

    if (focused.name === 'trainer') {
      if (!ctx) {
        await interaction.respond([]);
        return;
      }
      const trainers = await trainerService.searchTrainersByName(ctx.discordId, focused.value, 25);
      await interaction.respond(
        trainers.map((t) => ({
          name: `${t.name} (Lv. ${t.level})`,
          value: t.name,
        })),
      );
      return;
    }

    if (focused.name === 'item') {
      const shopId = interaction.options.getString('shop');
      const value = focused.value.toLowerCase();

      let items: { name: string }[];
      if (shopId) {
        items = await marketService.getShopItems(shopId);
      } else {
        items = await marketService.getAllItems();
      }

      const filtered = value
        ? items.filter((i) => i.name.toLowerCase().includes(value))
        : items;

      await interaction.respond(
        filtered.slice(0, 25).map((i) => ({
          name: i.name,
          value: i.name,
        })),
      );
      return;
    }

    await interaction.respond([]);
  },
};
