const { createSuccessEmbed, createInfoEmbed, createErrorEmbed } = require('../config/embeds');
const { commonButtons, createActionRow } = require('../config/buttons');

const slashCommands = {
  // Placeholder command
  placeholder: async (interaction) => {
    const embed = createSuccessEmbed('Hello! 👋\n\nThis is a placeholder command for the Dusk and Dawn Discord bot. The bot is now connected and ready to serve your monster collection needs!');
    
    const row = createActionRow(
      commonButtons.home(),
      commonButtons.refresh()
    );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },

  // Main menu command
  menu: async (interaction) => {
    const embed = createInfoEmbed(
      'Main Menu',
      '🏘️ **Town** - Visit locations and perform activities\n' +
      '🛒 **Shop** - Browse shops and purchase items\n' +
      '👤 **Trainer** - Manage your trainers\n' +
      '👾 **Monster** - View and manage your monsters\n' +
      '🔗 **Link Account** - Connect your Discord to the website\n' +
      '❓ **Help** - Get help and information'
    );
    
    const row = createActionRow(
      commonButtons.townMenu(),
      commonButtons.shopMenu(),
      commonButtons.viewTrainer()
    );
    
    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },

  // Help command
  help: async (interaction) => {
    const embed = createInfoEmbed(
      'Help & Commands',
      '**Getting Started:**\n' +
      '1. Use `/link-account` to connect your Discord to your website account\n' +
      '2. Use `/menu` to access the main menu\n' +
      '3. Use `/trainer view` to see your trainer information\n\n' +
      '**Main Commands:**\n' +
      '• `/menu` - Main menu\n' +
      '• `/trainer` - Trainer management\n' +
      '• `/monster` - Monster management\n' +
      '• `/town` - Town activities\n' +
      '• `/shop` - Shopping\n' +
      '• `/link-account` - Account linking\n\n' +
      '**Need more help?** Visit the website or ask in the support channel!'
    );
    
    await interaction.reply({ 
      embeds: [embed], 
      ephemeral: true 
    });
  },

  // Link account command
  'link-account': async (interaction) => {
    const token = interaction.options.getString('token');
    
    // TODO: Implement actual account linking with API
    const embed = createInfoEmbed(
      'Account Linking',
      `🔗 Account linking feature is coming soon!\n\n` +
      `**Token received:** \`${token.substring(0, 8)}...\`\n\n` +
      `This will connect your Discord account (${interaction.user.tag}) to your website account.`
    );
    
    await interaction.reply({ 
      embeds: [embed], 
      ephemeral: true 
    });
  },
};

module.exports = slashCommands;
