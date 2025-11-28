const { createBaseEmbed, createErrorEmbed, createInfoEmbed, colors } = require('../config/embeds');
const { commonButtons, createActionRow } = require('../config/buttons');
const trainerService = require('../services/trainerService');

const trainerCommands = {
  // View trainer information
  view: async (interaction) => {
    try {
      const trainerId = interaction.options.getInteger('trainer_id');
      const userId = interaction.user.id;

      let trainer;
      if (trainerId) {
        // Get specific trainer by ID
        const response = await trainerService.getTrainerById(trainerId);
        if (!response.success) {
          throw new Error(response.message || 'Trainer not found');
        }
        trainer = response.data;
      } else {
        // Get user's trainers and use the first one (or let them select)
        const response = await trainerService.getTrainersByUserId(userId);
        if (!response.success || !response.data || response.data.length === 0) {
          const embed = createErrorEmbed(
            'No trainers found for your account. Please create a trainer on the website first, or link your Discord account.'
          );
          return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        trainer = response.data[0]; // Use first trainer for now
      }

      const formattedTrainer = trainerService.formatTrainerForEmbed(trainer);
      
      const embed = createBaseEmbed(
        `👤 Trainer: ${formattedTrainer.name}`,
        `**Pronouns:** ${formattedTrainer.pronouns}\n` +
        `**Age:** ${formattedTrainer.age}\n` +
        `**Location:** ${formattedTrainer.location}\n` +
        `**Monsters:** ${formattedTrainer.monsterCount}\n\n` +
        `**Bio:**\n${formattedTrainer.bio}`,
        colors.trainer
      );

      if (formattedTrainer.imageUrl) {
        embed.setThumbnail(formattedTrainer.imageUrl);
      }

      embed.addFields([
        {
          name: '📅 Trainer Since',
          value: new Date(formattedTrainer.createdAt).toLocaleDateString(),
          inline: true,
        },
        {
          name: '🆔 Trainer ID',
          value: trainer.id.toString(),
          inline: true,
        },
      ]);

      const row = createActionRow(
        commonButtons.trainerInventory(),
        commonButtons.trainerMonsters(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in trainer view command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to fetch trainer information. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // View trainer inventory
  inventory: async (interaction) => {
    try {
      const userId = interaction.user.id;
      
      // Get user's trainers first
      const trainersResponse = await trainerService.getTrainersByUserId(userId);
      if (!trainersResponse.success || !trainersResponse.data || trainersResponse.data.length === 0) {
        const embed = createErrorEmbed('No trainers found for your account.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const trainer = trainersResponse.data[0]; // Use first trainer
      const inventoryResponse = await trainerService.getTrainerInventory(trainer.id);
      
      if (!inventoryResponse.success) {
        throw new Error(inventoryResponse.message || 'Failed to fetch inventory');
      }

      const inventory = inventoryResponse.data || [];
      const formattedInventory = trainerService.formatInventoryForEmbed(inventory);

      const embed = createBaseEmbed(
        `🎒 ${trainer.name}'s Inventory`,
        formattedInventory,
        colors.trainer
      );

      embed.addFields([
        {
          name: '📊 Inventory Stats',
          value: `Total Items: ${inventory.length}`,
          inline: true,
        },
      ]);

      const row = createActionRow(
        commonButtons.back(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in trainer inventory command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to fetch trainer inventory. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // View trainer monsters
  monsters: async (interaction) => {
    try {
      const userId = interaction.user.id;
      
      // Get user's trainers first
      const trainersResponse = await trainerService.getTrainersByUserId(userId);
      if (!trainersResponse.success || !trainersResponse.data || trainersResponse.data.length === 0) {
        const embed = createErrorEmbed('No trainers found for your account.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const trainer = trainersResponse.data[0]; // Use first trainer
      const monstersResponse = await trainerService.getTrainerMonsters(trainer.id);
      
      if (!monstersResponse.success) {
        throw new Error(monstersResponse.message || 'Failed to fetch monsters');
      }

      const monsters = monstersResponse.data || [];
      
      if (monsters.length === 0) {
        const embed = createInfoEmbed(
          `👾 ${trainer.name}'s Monsters`,
          'No monsters found. Visit the Adoption Center to get your first monster!'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Show first 10 monsters (implement pagination later)
      const displayMonsters = monsters.slice(0, 10);
      const monsterList = displayMonsters.map((monster, index) => {
        const species = monster.species1 || 'Unknown';
        const level = monster.level || 1;
        const traits = [];
        
        if (monster.shiny) traits.push('✨');
        if (monster.alpha) traits.push('🔺');
        if (monster.shadow) traits.push('🌑');
        
        const traitString = traits.length > 0 ? ` ${traits.join('')}` : '';
        
        return `${index + 1}. **${monster.name}** (Lv. ${level} ${species})${traitString}`;
      }).join('\n');

      const embed = createBaseEmbed(
        `👾 ${trainer.name}'s Monsters`,
        monsterList,
        colors.monster
      );

      embed.addFields([
        {
          name: '📊 Monster Stats',
          value: `Total Monsters: ${monsters.length}${monsters.length > 10 ? '\nShowing first 10' : ''}`,
          inline: true,
        },
      ]);

      const row = createActionRow(
        commonButtons.back(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in trainer monsters command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to fetch trainer monsters. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // View trainer stats
  stats: async (interaction) => {
    try {
      const userId = interaction.user.id;
      
      // Get user's trainers first
      const trainersResponse = await trainerService.getTrainersByUserId(userId);
      if (!trainersResponse.success || !trainersResponse.data || trainersResponse.data.length === 0) {
        const embed = createErrorEmbed('No trainers found for your account.');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const trainer = trainersResponse.data[0]; // Use first trainer
      const statsResponse = await trainerService.getTrainerStats(trainer.id);
      
      if (!statsResponse.success) {
        throw new Error(statsResponse.message || 'Failed to fetch trainer stats');
      }

      const stats = statsResponse.data;

      const embed = createBaseEmbed(
        `📊 ${trainer.name}'s Stats`,
        `**Monster Collection:** ${stats.monsterCount || 0}\n` +
        `**Inventory Items:** ${stats.inventoryCount || 0}\n` +
        `**Trainer Since:** ${new Date(trainer.created_at).toLocaleDateString()}\n\n` +
        `*More detailed stats coming soon!*`,
        colors.trainer
      );

      const row = createActionRow(
        commonButtons.back(),
        commonButtons.refresh()
      );

      await interaction.reply({ 
        embeds: [embed], 
        components: [row],
        ephemeral: true 
      });

    } catch (error) {
      console.error('Error in trainer stats command:', error);
      const embed = createErrorEmbed(
        error.isApiError ? error.message : 'Failed to fetch trainer stats. Please try again later.'
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

module.exports = trainerCommands;
