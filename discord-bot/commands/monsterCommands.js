const { createBaseEmbed, createErrorEmbed, createSuccessEmbed, colors } = require('../config/embeds');
const { commonButtons, createActionRow } = require('../config/buttons');
const monsterService = require('../services/monsterService');

const monsterCommands = {
  // View monster details
  view: async (interaction) => {
    try {
      const monsterId = interaction.options.getInteger('monster_id');
      
      const response = await monsterService.getMonsterById(monsterId);
      if (!response.success) {
        throw new Error(response.message || 'Monster not found');
      }

      const monster = response.data;
      const formattedMonster = monsterService.formatMonsterForEmbed(monster);

      const embed = createBaseEmbed(
        `👾 ${formattedMonster.name}`,
        `**Species:** ${formattedMonster.species}\n` +
        `**Level:** ${formattedMonster.level}\n` +
        `**Types:** ${formattedMonster.types}\n` +
        `**Attribute:** ${formattedMonster.attribute || 'None'}\n` +
        `**Traits:** ${formattedMonster.traits}\n\n` +
        `**Nature:** ${formattedMonster.nature || 'Unknown'}\n` +
        `**Characteristic:** ${formattedMonster.characteristic || 'Unknown'}\n` +
        `**Gender:** ${formattedMonster.gender || 'Unknown'} (${formattedMonster.pronouns || 'they/them'})\n` +
        `**Friendship:** ${formattedMonster.friendship || 0}/255`,
        colors.monster
      );

      if (formattedMonster.imageUrl) {
        embed.setThumbnail(formattedMonster.imageUrl);
      }

      // Add stats field
      embed.addFields([
        {
          name: '📊 Base Stats',
          value: monsterService.formatStatsForEmbed(formattedMonster.stats),
          inline: true,
        },
        {
          name: '📍 Origin',
          value: `**Date Met:** ${formattedMonster.dateMet || 'Unknown'}\n**Where Met:** ${formattedMonster.whereMet || 'Unknown'}`,
          inline: true,
        },
      ]);

      // Add additional info if available
      if (formattedMonster.heldItem) {
        embed.addFields([
          {
            name: '🎒 Held Item',
            value: formattedMonster.heldItem,
            inline: true,
          },
        ]);
      }

      if (formattedMonster.favBerry) {
        embed.addFields([
          {
            name: '🍓 Favorite Berry',
            value: formattedMonster.favBerry,
            inline: true,
          },
        ]);
      }

      // Add bio if available
      if (formattedMonster.bio && formattedMonster.bio.trim()) {
        embed.addFields([
          {
            name: '📝 Bio',
            value: formattedMonster.bio.length > 1024 ? 
              formattedMonster.bio.substring(0, 1021) + '...' : 
              formattedMonster.bio,
            inline: false,
          },
        ]);
      }

      embed.setFooter({ 
        text: `Monster ID: ${monsterId} | Box: ${formattedMonster.boxNumber || 'Unknown'} | Position: ${formattedMonster.trainerIndex || 'Unknown'}` 
      });

      const row = createActionRow(
        commonButtons.renameMonster(),
        commonButtons.back(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in monster view command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to fetch monster information. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Rename monster
  rename: async (interaction) => {
    try {
      const monsterId = interaction.options.getInteger('monster_id');
      const newName = interaction.options.getString('new_name');

      // Validate name length
      if (newName.length > 50) {
        const embed = createErrorEmbed('Monster name must be 50 characters or less.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if monster exists first
      const monsterResponse = await monsterService.getMonsterById(monsterId);
      if (!monsterResponse.success) {
        throw new Error(monsterResponse.message || 'Monster not found');
      }

      const oldName = monsterResponse.data.name;

      // Rename the monster
      const response = await monsterService.renameMonster(monsterId, newName);
      if (!response.success) {
        throw new Error(response.message || 'Failed to rename monster');
      }

      const embed = createSuccessEmbed(
        `Monster successfully renamed!\n\n` +
        `**Old Name:** ${oldName}\n` +
        `**New Name:** ${newName}`
      );

      const row = createActionRow(
        commonButtons.viewMonster(),
        commonButtons.back()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in monster rename command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to rename monster. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Evolve monster (placeholder for future implementation)
  evolve: async (interaction) => {
    try {
      const monsterId = interaction.options.getInteger('monster_id');

      // Get evolution options
      const optionsResponse = await monsterService.getEvolutionOptions(monsterId);
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || 'Failed to get evolution options');
      }

      const options = optionsResponse.data || [];
      
      if (options.length === 0) {
        const embed = createErrorEmbed('This monster has no available evolution options.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // For now, just show available options
      const optionsList = options.map((option, index) => 
        `${index + 1}. **${option.name}** - ${option.requirements || 'Requirements unknown'}`
      ).join('\n');

      const embed = createBaseEmbed(
        '🔄 Evolution Options',
        `Available evolution options for this monster:\n\n${optionsList}\n\n*Evolution system coming soon!*`,
        colors.monster
      );

      await interaction.reply({ 
        embeds: [embed], 
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in monster evolve command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to get evolution options. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Fuse monsters (placeholder for future implementation)
  fuse: async (interaction) => {
    const embed = createBaseEmbed(
      '🔀 Monster Fusion',
      'Monster fusion system is coming soon! This will allow you to combine monsters to create new, unique creatures.',
      colors.monster
    );

    await interaction.reply({ 
      embeds: [embed], 
      ephemeral: true 
    });
  },
};

module.exports = monsterCommands;
