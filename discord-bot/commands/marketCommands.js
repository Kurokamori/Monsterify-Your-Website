const { createBaseEmbed, createInfoEmbed, createErrorEmbed, colors } = require('../config/embeds');
const { commonButtons, createActionRow, createButton } = require('../config/buttons');
const { ButtonStyle } = require('discord.js');
const marketService = require('../services/marketService');

const marketCommands = {
  // Show shop menu
  menu: async (interaction) => {
    const embed = createInfoEmbed(
      '🛒 Shop Menu',
      'Welcome to the marketplace! Choose a shop to visit:\n\n' +
      '🧪 **Apothecary** - Berries and trait modifiers\n' +
      '🥖 **Bakery** - Pastries and trait setters\n' +
      '🔮 **Witch\'s Hut** - Evolution items and magic\n' +
      '🏪 **Mega Mart** - Pokéballs and held items\n' +
      '🏺 **Antique Store** - Rare event items\n' +
      '🥚 **Nursery** - Eggs and breeding supplies\n' +
      '🏴‍☠️ **Pirate\'s Dock** - Maritime treasures'
    );

    // Create shop buttons
    const row1 = createActionRow(
      createButton('shop_apothecary', 'Apothecary', ButtonStyle.Success, '🧪'),
      createButton('shop_bakery', 'Bakery', ButtonStyle.Secondary, '🥖'),
      createButton('shop_witch', 'Witch\'s Hut', ButtonStyle.Primary, '🔮'),
      createButton('shop_megamart', 'Mega Mart', ButtonStyle.Primary, '🏪')
    );

    const row2 = createActionRow(
      createButton('shop_antique', 'Antique Store', ButtonStyle.Secondary, '🏺'),
      createButton('shop_nursery', 'Nursery', ButtonStyle.Success, '🥚'),
      createButton('shop_pirates', 'Pirate\'s Dock', ButtonStyle.Danger, '🏴‍☠️'),
      createButton('shop_deals', 'Daily Deals', ButtonStyle.Success, '💰')
    );

    await interaction.reply({ 
      embeds: [embed], 
      components: [row1, row2],
      ephemeral: true 
    });
  },

  // View items in a specific shop
  view: async (interaction) => {
    try {
      const shopType = interaction.options.getString('shop');
      const shopInfo = marketService.formatShopInfo(shopType);

      // Get items for this shop
      const itemsResponse = await marketService.getShopItems(shopType);
      
      if (!itemsResponse.success) {
        throw new Error(itemsResponse.message || 'Failed to load shop items');
      }

      const items = itemsResponse.data || [];
      
      const embed = createBaseEmbed(
        shopInfo.name,
        shopInfo.description,
        colors.market
      );

      if (items.length === 0) {
        embed.addFields([
          {
            name: '📦 Items',
            value: 'No items available in this shop right now. Check back later!',
            inline: false,
          },
        ]);
      } else {
        // Format items list (show first 10)
        const itemsList = marketService.formatItemsListForEmbed(items, 1, 10);
        
        embed.addFields([
          {
            name: `📦 Items (${itemsList.totalItems} total)`,
            value: itemsList.content,
            inline: false,
          },
        ]);

        if (itemsList.totalPages > 1) {
          embed.setFooter({ text: `Page ${itemsList.currentPage} of ${itemsList.totalPages}` });
        }
      }

      // Create action buttons
      const buttons = [
        createButton('shop_buy', 'Buy Item', ButtonStyle.Success, '💰'),
        createButton('shop_use', 'Use Item', ButtonStyle.Primary, '🔧'),
        commonButtons.back(),
        commonButtons.refresh()
      ];

      // Add pagination if needed
      if (items.length > 10) {
        buttons.splice(-2, 0, 
          createButton('shop_prev', 'Previous', ButtonStyle.Secondary, '⬅️'),
          createButton('shop_next', 'Next', ButtonStyle.Secondary, '➡️')
        );
      }

      // Split into rows
      const rows = [];
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(createActionRow(...buttons.slice(i, i + 4)));
      }

      await interaction.reply({ 
        embeds: [embed], 
        components: rows,
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error viewing shop:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to load shop. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Daily deals
  deals: async (interaction) => {
    try {
      const dealsResponse = await marketService.getDailyDeals();
      
      if (!dealsResponse.success) {
        throw new Error(dealsResponse.message || 'Failed to load daily deals');
      }

      const deals = dealsResponse.data || [];

      const embed = createBaseEmbed(
        '💰 Daily Deals',
        deals.length > 0 ? 
          'Special offers available today!' : 
          'No special deals available today. Check back tomorrow!',
        colors.market
      );

      if (deals.length > 0) {
        const dealsList = deals.map((deal, index) => {
          const discount = deal.discount ? ` (${deal.discount}% off!)` : '';
          return `${index + 1}. **${deal.name}**${discount}\n   💰 ${deal.price} - ${deal.description}`;
        }).join('\n\n');

        embed.addFields([
          {
            name: '🎯 Today\'s Deals',
            value: dealsList,
            inline: false,
          },
        ]);
      }

      embed.addFields([
        {
          name: '⏰ Refresh Time',
          value: 'Daily deals refresh at midnight UTC',
          inline: true,
        },
      ]);

      const row = createActionRow(
        createButton('deals_buy', 'Buy Deal', ButtonStyle.Success, '💰'),
        commonButtons.back(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error viewing daily deals:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to load daily deals. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Buy item (placeholder - would need item selection modal)
  buy: async (interaction) => {
    const embed = createInfoEmbed(
      '💰 Purchase Item',
      'Item purchasing system coming soon!\n\n' +
      'This will allow you to:\n' +
      '• Select items from shops\n' +
      '• Choose quantities\n' +
      '• Confirm purchases\n' +
      '• Add items to your inventory'
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  // Use item (placeholder - would need item and target selection)
  use: async (interaction) => {
    const embed = createInfoEmbed(
      '🔧 Use Item',
      'Item usage system coming soon!\n\n' +
      'This will allow you to:\n' +
      '• Select items from your inventory\n' +
      '• Choose target monsters\n' +
      '• Apply item effects\n' +
      '• See results and changes'
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  // Helper method to format shop items for display
  formatShopDisplay: (shopType, items, page = 1) => {
    const shopInfo = marketService.formatShopInfo(shopType);
    const itemsList = marketService.formatItemsListForEmbed(items, page, 10);
    
    return {
      shopInfo,
      itemsList,
    };
  },
};

module.exports = marketCommands;
