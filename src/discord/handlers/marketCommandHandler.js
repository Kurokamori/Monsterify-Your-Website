const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ShopSystem = require('../../models/ShopSystem');
const ShopConfig = require('../../models/shops/ShopConfig');
const ShopItemsManager = require('../../models/shops/ShopItemsManager');
const Trainer = require('../../models/Trainer');
const Item = require('../../models/Item');
const PlayerShopPurchases = require('../../models/shops/PlayerShopPurchases');

/**
 * Handler for market-related commands
 */
class MarketCommandHandler {
  // Shop emoji mappings
  static SHOP_EMOJIS = {
    'apothecary': '🧪',
    'bakery': '🍰',
    'witchs_hut': '🧙‍♀️',
    'megamart': '🏪',
    'antique_shop': '🏺',
    'nursery': '🌱',
    'pirates_dock': '⚓'
  };

  // Shop display names
  static SHOP_NAMES = {
    'apothecary': 'Apothecary',
    'bakery': 'Bakery',
    'witchs_hut': 'Witch\'s Hut',
    'megamart': 'Mega Mart',
    'antique_shop': 'Antique Store',
    'nursery': 'Nursery',
    'pirates_dock': 'Pirate\'s Dock'
  };

  // Item category to inventory field mapping
  static CATEGORY_TO_INVENTORY = {
    'BERRIES': 'inv_berries',
    'PASTRIES': 'inv_pastries',
    'ITEMS': 'inv_items',
    'EVOLUTION': 'inv_evolution',
    'ANTIQUE': 'inv_antiques',
    'BALLS': 'inv_balls',
    'HELD_ITEMS': 'inv_helditems'
  };

  /**
   * Handle market command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleMarketCommand(interaction) {
    try {
      const shopId = interaction.options.getString('shop');
      console.log(`Market command received for shop: ${shopId}`);

      // Get shop configuration
      console.log(`Fetching shop configuration for ${shopId}...`);
      const shopConfig = await ShopConfig.getById(shopId);

      if (!shopConfig) {
        console.log(`Shop configuration not found for ${shopId}, initializing...`);
        // Try to initialize shop configuration
        await ShopSystem.initializeShopConfig();

        // Try again to get the shop configuration
        const updatedShopConfig = await ShopConfig.getById(shopId);

        if (!updatedShopConfig) {
          return await interaction.editReply({
            content: `The ${this.SHOP_NAMES[shopId]} is not available. Please try again later.`
          });
        }
      }

      // Get daily shop items
      console.log(`Fetching daily shop items for ${shopId}...`);
      let shopItems = await ShopItemsManager.getShopItems(shopId);
      console.log(`Received ${shopItems ? shopItems.length : 0} items for ${shopId}`);

      if (shopItems && shopItems.length > 0) {
        console.log('First shop item:', JSON.stringify(shopItems[0], null, 2));
      }

      if (!shopItems || shopItems.length === 0) {
        console.log(`No items found for ${shopId}, attempting to restock...`);
        // Try to restock the shop
        await ShopSystem.restockAllShops();

        // Try again to get the items
        console.log(`Fetching items again after restock...`);
        shopItems = await ShopItemsManager.getShopItems(shopId);
        console.log(`After restock: ${shopItems ? shopItems.length : 0} items for ${shopId}`);

        if (!shopItems || shopItems.length === 0) {
          return await interaction.editReply({
            content: `The ${this.SHOP_NAMES[shopId]} is closed today. Please check back tomorrow!`
          });
        }
      }

      // Get user's trainers
      const discordId = interaction.user.id;
      console.log(`Getting trainers for Discord ID: ${discordId}`);
      const trainers = await Trainer.getByDiscordId(discordId);

      if (trainers && trainers.length > 0) {
        console.log(`Found ${trainers.length} trainers for Discord ID ${discordId}`);
        console.log('First trainer:', JSON.stringify(trainers[0], null, 2));
      }

      if (!trainers || trainers.length === 0) {
        return await interaction.editReply({
          content: 'You don\'t have any trainers. Please create a trainer first!'
        });
      }

      // Create embed for the shop
      const embed = await this._createShopEmbed(shopId, shopItems);

      // Create trainer selection dropdown
      const trainerRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_trainer_select_${shopId}`)
            .setPlaceholder('Select a trainer')
            .addOptions(
              trainers.map(trainer =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${trainer.trainer_name || trainer.name || 'Unnamed Trainer'} (${trainer.currency_amount || trainer.currency || trainer.trainer_coins || 0} coins)`)
                  .setDescription(`Level ${trainer.level || 1}`)
                  .setValue(trainer.id.toString())
              )
            )
        );

      // Create item selection dropdown (initially disabled)
      const itemRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_item_select_${shopId}`)
            .setPlaceholder('Select an item to purchase')
            .setDisabled(true)
            .addOptions(
              shopItems.map(item => {
                const emoji = this._getItemEmoji(item);
                return new StringSelectMenuOptionBuilder()
                  .setLabel(`${item.item_name || item.name || 'Unknown Item'} (${item.price} coins)`)
                  .setDescription(item.item_description || item.description || item.effect || 'No description available')
                  .setValue((item.id || item.item_id).toString())
                  .setEmoji(emoji);
              })
            )
        );

      // Create purchase button (initially disabled)
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`market_purchase_${shopId}`)
            .setLabel('Purchase Item')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        );

      await interaction.editReply({
        embeds: [embed],
        components: [trainerRow, itemRow, buttonRow]
      });
    } catch (error) {
      console.error('Error handling market command:', error);
      await interaction.editReply({ content: `Error processing market command: ${error.message}` });
    }
  }

  /**
   * Handle restock-shops command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleRestockShopsCommand(interaction) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return await interaction.editReply({ content: 'You do not have permission to restock shops.' });
      }

      // Restock all shops
      await ShopSystem.restockAllShops();

      await interaction.editReply({ content: 'All shops have been restocked successfully!' });
    } catch (error) {
      console.error('Error handling restock-shops command:', error);
      await interaction.editReply({ content: `Error restocking shops: ${error.message}` });
    }
  }

  /**
   * Handle trainer selection
   * @param {SelectMenuInteraction} interaction - Discord select menu interaction
   * @param {string} customId - Custom ID of the select menu
   */
  static async handleTrainerSelection(interaction, customId) {
    try {
      // Check if the interaction has already been replied to
      if (interaction.replied || interaction.deferred) {
        console.log('Interaction already replied to, using followUp instead of update');
        await interaction.followUp({ content: 'Processing your selection...', ephemeral: true });
        return;
      }
      // Extract shop ID from custom ID
      const shopId = customId.split('_').pop();

      // Get selected trainer ID
      const trainerId = interaction.values[0];

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.update({ content: 'Trainer not found.', components: [] });
      }

      // Get daily shop items
      const shopItems = await ShopSystem.getDailyShopItems(shopId);

      if (!shopItems || shopItems.length === 0) {
        return await interaction.update({
          content: `The ${this.SHOP_NAMES[shopId]} is closed today. Please check back tomorrow!`,
          components: []
        });
      }

      // Get purchase history for this trainer
      const purchaseHistory = await PlayerShopPurchases.getByTrainerId(trainerId);

      // Create updated embed with trainer info
      const embed = await this._createShopEmbed(shopId, shopItems, trainer, purchaseHistory);

      // Create updated trainer selection dropdown
      const trainerRow = new ActionRowBuilder()
        .addComponents(
          StringSelectMenuBuilder.from(interaction.message.components[0].components[0])
            .setPlaceholder(`Selected: ${trainer.trainer_name || trainer.name || 'Unnamed Trainer'} (${trainer.currency || trainer.trainer_coins || trainer.currency_amount || 0} coins)`)
        );

      // Create updated item selection dropdown (now enabled)
      const itemRow = new ActionRowBuilder()
        .addComponents(
          StringSelectMenuBuilder.from(interaction.message.components[1].components[0])
            .setDisabled(false)  // Explicitly enable the dropdown
            .setPlaceholder('Select an item to purchase')
        );

      // Create purchase button (still disabled until item is selected)
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          ButtonBuilder.from(interaction.message.components[2].components[0])
            .setDisabled(true)
            .setLabel('Purchase Item')
        );

      // Store trainer ID in client for later use
      if (!interaction.client.marketSelections) {
        interaction.client.marketSelections = new Map();
      }

      interaction.client.marketSelections.set(interaction.user.id, {
        trainerId,
        shopId,
        selectedItemId: null
      });

      await interaction.update({
        embeds: [embed],
        components: [trainerRow, itemRow, buttonRow]
      });
    } catch (error) {
      console.error('Error handling trainer selection:', error);
      await interaction.update({ content: `Error selecting trainer: ${error.message}` });
    }
  }

  /**
   * Handle item selection
   * @param {SelectMenuInteraction} interaction - Discord select menu interaction
   * @param {string} customId - Custom ID of the select menu
   */
  static async handleItemSelection(interaction, customId) {
    try {
      // Check if the interaction has already been replied to
      if (interaction.replied || interaction.deferred) {
        console.log('Interaction already replied to, using followUp instead of update');
        await interaction.followUp({ content: 'Processing your selection...', ephemeral: true });
        return;
      }
      // Extract shop ID from custom ID
      const shopId = customId.split('_').pop();

      // Get selected item ID
      const itemId = interaction.values[0];

      // Get market selections from client
      if (!interaction.client.marketSelections || !interaction.client.marketSelections.has(interaction.user.id)) {
        return await interaction.update({
          content: 'Session expired. Please start over by using the /market command again.',
          components: []
        });
      }

      const selections = interaction.client.marketSelections.get(interaction.user.id);
      const trainerId = selections.trainerId;

      // Update selections with selected item
      selections.selectedItemId = itemId;
      interaction.client.marketSelections.set(interaction.user.id, selections);

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.update({ content: 'Trainer not found.', components: [] });
      }

      // Get daily shop items
      const shopItems = await ShopSystem.getDailyShopItems(shopId);

      if (!shopItems || shopItems.length === 0) {
        return await interaction.update({
          content: `The ${this.SHOP_NAMES[shopId]} is closed today. Please check back tomorrow!`,
          components: []
        });
      }

      // Get selected item
      const selectedItem = shopItems.find(item => item.id.toString() === itemId);

      if (!selectedItem) {
        return await interaction.update({ content: 'Item not found.', components: [] });
      }

      // Get purchase history for this trainer
      const purchaseHistory = await PlayerShopPurchases.getByTrainerId(trainerId);

      // Check if trainer can afford the item
      const canAfford = trainer.coins >= selectedItem.price;

      // Check if trainer has reached purchase limit for this item
      const purchaseLimit = selectedItem.purchase_limit || 1;
      const purchaseCount = this._getPurchaseCount(purchaseHistory, selectedItem.name);
      const canPurchase = purchaseCount < purchaseLimit;

      // Create updated embed with item info
      const embed = await this._createShopEmbed(shopId, shopItems, trainer, purchaseHistory, selectedItem);

      // Create updated trainer selection dropdown
      const trainerRow = new ActionRowBuilder()
        .addComponents(
          StringSelectMenuBuilder.from(interaction.message.components[0].components[0])
        );

      // Create updated item selection dropdown
      const itemRow = new ActionRowBuilder()
        .addComponents(
          StringSelectMenuBuilder.from(interaction.message.components[1].components[0])
            .setPlaceholder(`Selected: ${selectedItem.name} (${selectedItem.price} coins)`)
        );

      // Create purchase button (enabled if trainer can afford and hasn't reached limit)
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          ButtonBuilder.from(interaction.message.components[2].components[0])
            .setDisabled(!canAfford || !canPurchase)
            .setLabel(canAfford ? (canPurchase ? 'Purchase Item' : 'Purchase Limit Reached') : 'Not Enough Coins')
        );

      await interaction.update({
        embeds: [embed],
        components: [trainerRow, itemRow, buttonRow]
      });
    } catch (error) {
      console.error('Error handling item selection:', error);
      await interaction.update({ content: `Error selecting item: ${error.message}` });
    }
  }

  /**
   * Handle purchase button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} customId - Custom ID of the button
   */
  static async handlePurchaseButton(interaction, customId) {
    try {
      // Check if the interaction has already been replied to
      if (interaction.replied || interaction.deferred) {
        console.log('Interaction already replied to, using followUp instead of update');
        await interaction.followUp({ content: 'Processing your purchase...', ephemeral: true });
        return;
      }
      // Extract shop ID from custom ID
      const shopId = customId.split('_').pop();

      // Get market selections from client
      if (!interaction.client.marketSelections || !interaction.client.marketSelections.has(interaction.user.id)) {
        return await interaction.update({
          content: 'Session expired. Please start over by using the /market command again.',
          components: []
        });
      }

      const selections = interaction.client.marketSelections.get(interaction.user.id);
      const trainerId = selections.trainerId;
      const itemId = selections.selectedItemId;

      if (!itemId) {
        return await interaction.update({ content: 'No item selected.', components: [] });
      }

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.update({ content: 'Trainer not found.', components: [] });
      }

      // Get daily shop items
      const shopItems = await ShopSystem.getDailyShopItems(shopId);

      if (!shopItems || shopItems.length === 0) {
        return await interaction.update({
          content: `The ${this.SHOP_NAMES[shopId]} is closed today. Please check back tomorrow!`,
          components: []
        });
      }

      // Get selected item
      const selectedItem = shopItems.find(item => item.id.toString() === itemId);

      if (!selectedItem) {
        return await interaction.update({ content: 'Item not found.', components: [] });
      }

      // Get purchase history for this trainer
      const purchaseHistory = await PlayerShopPurchases.getByTrainerId(trainerId);

      // Check if trainer can afford the item
      if (trainer.coins < selectedItem.price) {
        return await interaction.update({
          content: `${trainer.name} doesn't have enough coins to purchase ${selectedItem.name}.`,
          components: []
        });
      }

      // Check if trainer has reached purchase limit for this item
      const purchaseLimit = selectedItem.purchase_limit || 1;
      const purchaseCount = this._getPurchaseCount(purchaseHistory, selectedItem.name);
      const remaining = purchaseLimit - purchaseCount;

      if (remaining <= 0) {
        return await interaction.update({
          content: `${trainer.name} has already purchased the maximum amount of ${selectedItem.name}.`,
          components: []
        });
      }

      // Process the purchase
      const result = await ShopSystem.processPurchase(trainerId, selectedItem.id, shopId);

      if (!result.success) {
        return await interaction.update({
          content: `Error purchasing item: ${result.message}`,
          components: []
        });
      }

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle(`Purchase Successful!`)
        .setDescription(`${trainer.name} purchased ${selectedItem.name} for ${selectedItem.price} coins.`)
        .setColor('#2ecc71')
        .addFields(
          { name: 'Item', value: selectedItem.name, inline: true },
          { name: 'Price', value: `${selectedItem.price} coins`, inline: true },
          { name: 'Remaining Coins', value: `${result.updatedCoins} coins`, inline: true }
        );

      if (selectedItem.emoji) {
        embed.setThumbnail(selectedItem.emoji);
      }

      // Create button to return to shop
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`market_return_${shopId}`)
            .setLabel('Return to Shop')
            .setStyle(ButtonStyle.Primary)
        );

      await interaction.update({
        embeds: [embed],
        components: [buttonRow],
        content: null
      });
    } catch (error) {
      console.error('Error handling purchase button:', error);
      await interaction.update({ content: `Error purchasing item: ${error.message}` });
    }
  }

  /**
   * Handle return to shop button
   * @param {ButtonInteraction} interaction - Discord button interaction
   * @param {string} customId - Custom ID of the button
   */
  static async handleReturnButton(interaction, customId) {
    try {
      // Check if the interaction has already been replied to
      if (interaction.replied || interaction.deferred) {
        console.log('Interaction already replied to, using followUp instead of update');
        await interaction.followUp({ content: 'Returning to shop...', ephemeral: true });
        return;
      }
      // Extract shop ID from custom ID
      const shopId = customId.split('_').pop();

      // Get market selections from client
      if (!interaction.client.marketSelections || !interaction.client.marketSelections.has(interaction.user.id)) {
        // Start fresh
        await this.handleMarketCommand({
          options: {
            getString: () => shopId
          },
          editReply: interaction.update.bind(interaction)
        });
        return;
      }

      const selections = interaction.client.marketSelections.get(interaction.user.id);
      const trainerId = selections.trainerId;

      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.update({ content: 'Trainer not found.', components: [] });
      }

      // Get daily shop items
      const shopItems = await ShopSystem.getDailyShopItems(shopId);

      if (!shopItems || shopItems.length === 0) {
        return await interaction.update({
          content: `The ${this.SHOP_NAMES[shopId]} is closed today. Please check back tomorrow!`,
          components: []
        });
      }

      // Get purchase history for this trainer
      const purchaseHistory = await PlayerShopPurchases.getByTrainerId(trainerId);

      // Create updated embed
      const embed = await this._createShopEmbed(shopId, shopItems, trainer, purchaseHistory);

      // Create trainer selection dropdown
      const trainerRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_trainer_select_${shopId}`)
            .setPlaceholder(`Selected: ${trainer.trainer_name || trainer.name || 'Unnamed Trainer'} (${trainer.currency || trainer.trainer_coins || trainer.currency_amount || 0} coins)`)
            .addOptions(
              (await Trainer.getByDiscordId(interaction.user.id)).map(t =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${t.trainer_name || t.name || 'Unnamed Trainer'} (${t.currency || t.trainer_coins || t.currency_amount || 0} coins)`)
                  .setDescription(`Level ${t.level}`)
                  .setValue(t.id.toString())
              )
            )
        );

      // Create item selection dropdown
      const itemRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`market_item_select_${shopId}`)
            .setPlaceholder('Select an item to purchase')
            .setDisabled(false)
            .addOptions(
              shopItems.map(item => {
                const emoji = item.icon || this._getItemEmoji(item);
                const purchaseLimit = item.purchase_limit || 1;
                const purchaseCount = this._getPurchaseCount(purchaseHistory, item.name);
                const remaining = Math.max(0, purchaseLimit - purchaseCount);
                
                return new StringSelectMenuOptionBuilder()
                  .setLabel(`${item.name} (${item.price} coins)`)
                  .setDescription(`${remaining}/${purchaseLimit} remaining`)
                  .setValue(item.name)  // Use name as the identifier
                  .setEmoji(emoji);
              })
            )
        );

      // Create purchase button (disabled until item is selected)
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`market_purchase_${shopId}`)
            .setLabel('Purchase Item')
            .setStyle(ButtonStyle.Success)
            .setDisabled(true)
        );

      await interaction.update({
        embeds: [embed],
        components: [trainerRow, itemRow, buttonRow],
        content: null
      });
    } catch (error) {
      console.error('Error handling return button:', error);
      await interaction.update({ content: `Error returning to shop: ${error.message}` });
    }
  }

  /**
   * Create shop embed
   * @param {string} shopId - Shop ID
   * @param {Array} shopItems - Shop items
   * @param {Object} trainer - Trainer object (optional)
   * @param {Array} purchaseHistory - Purchase history (optional)
   * @param {Object} selectedItem - Selected item (optional)
   * @returns {EmbedBuilder} - Shop embed
   * @private
   */
  static async _createShopEmbed(shopId, shopItems, trainer = null, purchaseHistory = [], selectedItem = null) {
    const shopName = this.SHOP_NAMES[shopId] || shopId;
    const shopEmoji = this.SHOP_EMOJIS[shopId] || '🛒';

    const embed = new EmbedBuilder()
      .setTitle(`${shopEmoji} ${shopName}`)
      .setColor('#3498db');

    if (trainer) {
      embed.setDescription(`Welcome to the ${shopName}, ${trainer.trainer_name || trainer.name}!\nYou have ${trainer.currency_amount || 0} coins.`);
    } else {
      embed.setDescription(`Welcome to the ${shopName}! Here are today's available items:`);
    }

    if (selectedItem) {
      const emoji = selectedItem.icon || this._getItemEmoji(selectedItem);
      const purchaseLimit = selectedItem.purchase_limit || 1;
      const purchaseCount = this._getPurchaseCount(purchaseHistory, selectedItem.name);
      const remaining = purchaseLimit - purchaseCount;

      embed.addFields(
        { name: `${emoji} ${selectedItem.name}`, value: `Price: ${selectedItem.price} coins`, inline: true },
        { name: 'Available', value: `${remaining}/${purchaseLimit}`, inline: true },
        { name: 'Description', value: selectedItem.effect || 'No description available' }
      );
    } else {
      shopItems.forEach(item => {
        const emoji = item.icon || this._getItemEmoji(item);
        const purchaseLimit = item.purchase_limit || 1;
        const purchaseCount = this._getPurchaseCount(purchaseHistory, item.name);
        const remaining = purchaseLimit - purchaseCount;

        embed.addFields({
          name: `${emoji} ${item.name}`,
          value: `Price: ${item.price} coins\nAvailable: ${remaining}/${purchaseLimit}\nDescription: ${item.effect || 'No description available'}`,
          inline: true
        });
      });
    }

    return embed;
  }

  /**
   * Get purchase count for an item
   * @param {Array} purchaseHistory - Purchase history
   * @param {string} itemName - Item name
   * @returns {number} - Purchase count
   * @private
   */
  static _getPurchaseCount(purchaseHistory, itemName) {
    if (!purchaseHistory || purchaseHistory.length === 0) return 0;
    
    const purchase = purchaseHistory.find(p => p.item_id === itemName);
    return purchase ? (purchase.quantity || 0) : 0;
  }

  /**
   * Get emoji for item category
   * @param {string} category - Item category
   * @returns {string} - Emoji
   * @private
   */
  static _getItemEmoji(item) {
    // If item is an object with an icon property, use that
    if (item && typeof item === 'object') {
      // Check if the item has an icon property
      if (item.icon) {
        // If the icon is a URL or path, return a generic emoji
        // Discord doesn't support custom images in select menu options
        return '🖼️';
      }

      // If the item has an emoji property, use that
      if (item.emoji) {
        return item.emoji;
      }

      // Otherwise, use the category
      const category = item.category || item.item_type;
      if (category) {
        return this._getCategoryEmoji(category);
      }
    }

    // If item is a string (category), use the category emoji
    if (typeof item === 'string') {
      return this._getCategoryEmoji(item);
    }

    // Default emoji
    return '🎁';
  }

  /**
   * Get emoji for item category
   * @param {string} category - Item category
   * @returns {string} - Emoji
   * @private
   */
  static _getCategoryEmoji(category) {
    if (!category) return '🎁';

    const categoryEmojis = {
      'BERRIES': '🍓',
      'PASTRIES': '🍰',
      'ITEMS': '🧪',
      'EVOLUTION': '✨',
      'ANTIQUE': '🏺',
      'BALLS': '⚾',
      'HELD_ITEMS': '🧤'
    };

    const upperCategory = category.toUpperCase();
    return categoryEmojis[upperCategory] || '🎁';
  }
}

module.exports = MarketCommandHandler;







