const { EmbedBuilder } = require('discord.js');

const colors = {
  primary: 0x5865F2,
  success: 0x57F287,
  warning: 0xFEE75C,
  error: 0xED4245,
  info: 0x5865F2,
  monster: 0x9B59B6,
  trainer: 0x3498DB,
  town: 0xE67E22,
  market: 0xF39C12,
};

const createBaseEmbed = (title, description, color = colors.primary) => {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
};

const createErrorEmbed = (message) => {
  return createBaseEmbed('❌ Error', message, colors.error);
};

const createSuccessEmbed = (message) => {
  return createBaseEmbed('✅ Success', message, colors.success);
};

const createInfoEmbed = (title, message) => {
  return createBaseEmbed(`ℹ️ ${title}`, message, colors.info);
};

const createWarningEmbed = (message) => {
  return createBaseEmbed('⚠️ Warning', message, colors.warning);
};

module.exports = {
  colors,
  createBaseEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  createInfoEmbed,
  createWarningEmbed,
};
