const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const createButton = (customId, label, style = ButtonStyle.Primary, emoji = null, disabled = false) => {
  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
  
  if (emoji) {
    button.setEmoji(emoji);
  }
  
  return button;
};

const createLinkButton = (url, label, emoji = null) => {
  const button = new ButtonBuilder()
    .setURL(url)
    .setLabel(label)
    .setStyle(ButtonStyle.Link);
  
  if (emoji) {
    button.setEmoji(emoji);
  }
  
  return button;
};

const createActionRow = (...buttons) => {
  return new ActionRowBuilder().addComponents(...buttons);
};

// Common button configurations
const commonButtons = {
  // Navigation buttons
  back: () => createButton('back', 'Back', ButtonStyle.Secondary, '⬅️'),
  home: () => createButton('home', 'Home', ButtonStyle.Secondary, '🏠'),
  refresh: () => createButton('refresh', 'Refresh', ButtonStyle.Secondary, '🔄'),
  
  // Pagination buttons
  previous: () => createButton('previous', 'Previous', ButtonStyle.Primary, '⬅️'),
  next: () => createButton('next', 'Next', ButtonStyle.Primary, '➡️'),
  
  // Action buttons
  confirm: () => createButton('confirm', 'Confirm', ButtonStyle.Success, '✅'),
  cancel: () => createButton('cancel', 'Cancel', ButtonStyle.Danger, '❌'),
  
  // Town buttons
  townMenu: () => createButton('town_menu', 'Town Menu', ButtonStyle.Primary, '🏘️'),
  
  // Trainer buttons
  viewTrainer: () => createButton('view_trainer', 'View Trainer', ButtonStyle.Primary, '👤'),
  trainerInventory: () => createButton('trainer_inventory', 'Inventory', ButtonStyle.Secondary, '🎒'),
  trainerMonsters: () => createButton('trainer_monsters', 'Monsters', ButtonStyle.Secondary, '👾'),
  
  // Monster buttons
  viewMonster: () => createButton('view_monster', 'View Monster', ButtonStyle.Primary, '👾'),
  renameMonster: () => createButton('rename_monster', 'Rename', ButtonStyle.Secondary, '✏️'),
  
  // Market buttons
  shopMenu: () => createButton('shop_menu', 'Shop Menu', ButtonStyle.Primary, '🛒'),
  buyItem: () => createButton('buy_item', 'Buy', ButtonStyle.Success, '💰'),
  useItem: () => createButton('use_item', 'Use', ButtonStyle.Primary, '🔧'),
};

module.exports = {
  createButton,
  createLinkButton,
  createActionRow,
  commonButtons,
};
