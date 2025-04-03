const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');
const MonsterService = require('../../utils/MonsterService');

/**
 * Handler for monster-related commands
 */
class MonsterCommandHandler {
  /**
   * Handle monster view command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleViewCommand(interaction) {
    try {
      const trainerId = interaction.options.getString('trainer_id');
      
      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.editReply({ content: 'Trainer not found.' });
      }
      
      // Get monsters for trainer
      const monsters = await Monster.getByTrainerId(trainerId);
      
      if (!monsters || monsters.length === 0) {
        return await interaction.editReply({ content: `${trainer.name} doesn't have any monsters yet.` });
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`${trainer.name}'s Monsters`)
        .setDescription(`Total monsters: ${monsters.length}`)
        .setColor('#3498db');
      
      // Add fields for first 10 monsters
      const displayMonsters = monsters.slice(0, 10);
      
      displayMonsters.forEach(monster => {
        const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/');
        const types = [monster.type1, monster.type2, monster.type3].filter(Boolean).join(', ');
        
        embed.addFields({
          name: `${monster.name} (Lv. ${monster.level})`,
          value: `ID: ${monster.mon_id}\nSpecies: ${species}\nTypes: ${types}\nAttribute: ${monster.attribute || 'None'}`
        });
      });
      
      // Add pagination buttons if needed
      let components = [];
      if (monsters.length > 10) {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`monster_list_next_${trainerId}_10`)
              .setLabel('Next Page')
              .setStyle(ButtonStyle.Primary)
          );
        components = [row];
      }
      
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      console.error('Error handling monster view command:', error);
      await interaction.editReply({ content: 'An error occurred while fetching monsters.' });
    }
  }
  
  /**
   * Handle monster roll command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleRollCommand(interaction) {
    try {
      const trainerId = interaction.options.getString('trainer_id');
      const monsterName = interaction.options.getString('name');
      
      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.editReply({ content: 'Trainer not found.' });
      }
      
      // Roll a monster
      const monsterData = await MonsterService.rollOne();
      
      // Store the rolled monster in the session for claiming later
      // This would normally be stored in a database or cache
      // For simplicity, we'll attach it to the client object
      if (!interaction.client.rolledMonsters) {
        interaction.client.rolledMonsters = new Map();
      }
      
      const rollId = Date.now().toString();
      interaction.client.rolledMonsters.set(rollId, {
        monsterData,
        trainerId,
        timestamp: Date.now()
      });
      
      // Format monster data for display
      const displayData = MonsterService.getDisplayData(monsterData);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Roll Result')
        .setDescription(`A wild ${displayData.title} appeared!`)
        .setColor('#2ecc71')
        .addFields(
          { name: 'Species', value: displayData.species.join('/'), inline: true },
          { name: 'Types', value: displayData.types.join(', ') || 'None', inline: true },
          { name: 'Attribute', value: displayData.attribute || 'None', inline: true }
        )
        .setFooter({ text: `Roll ID: ${rollId}` });
      
      // Create claim button
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`claim_monster_${rollId}_${trainerId}`)
            .setLabel('Claim Monster')
            .setStyle(ButtonStyle.Success)
        );
      
      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error handling monster roll command:', error);
      await interaction.editReply({ content: 'An error occurred while rolling a monster.' });
    }
  }
  
  /**
   * Handle monster claim command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleClaimCommand(interaction) {
    try {
      const trainerId = interaction.options.getString('trainer_id');
      const monsterName = interaction.options.getString('name');
      
      // Get trainer
      const trainer = await Trainer.getById(trainerId);
      if (!trainer) {
        return await interaction.editReply({ content: 'Trainer not found.' });
      }
      
      // Check if there's a rolled monster to claim
      if (!interaction.client.rolledMonsters || interaction.client.rolledMonsters.size === 0) {
        return await interaction.editReply({ content: 'No monster available to claim. Roll a monster first!' });
      }
      
      // Get the most recent rolled monster for this trainer
      let rollId = null;
      let monsterData = null;
      
      for (const [id, data] of interaction.client.rolledMonsters.entries()) {
        if (data.trainerId === trainerId) {
          rollId = id;
          monsterData = data.monsterData;
          break;
        }
      }
      
      if (!monsterData) {
        return await interaction.editReply({ content: 'No monster available to claim for this trainer. Roll a monster first!' });
      }
      
      // Claim the monster
      const monster = await MonsterService.claimMonster(monsterData, trainerId, monsterName);
      
      // Remove the rolled monster from the session
      interaction.client.rolledMonsters.delete(rollId);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Claimed')
        .setDescription(`${trainer.name} claimed ${monsterName}!`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Species', value: [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/'), inline: true },
          { name: 'Types', value: [monster.type1, monster.type2, monster.type3].filter(Boolean).join(', ') || 'None', inline: true },
          { name: 'Attribute', value: monster.attribute || 'None', inline: true },
          { name: 'Level', value: monster.level.toString(), inline: true },
          { name: 'ID', value: monster.mon_id.toString(), inline: true }
        );
      
      await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
      console.error('Error handling monster claim command:', error);
      await interaction.editReply({ content: 'An error occurred while claiming the monster.' });
    }
  }
  
  /**
   * Handle monster level command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleLevelCommand(interaction) {
    try {
      const monsterId = interaction.options.getString('monster_id');
      const levels = interaction.options.getInteger('levels');
      
      // Validate levels
      if (levels <= 0) {
        return await interaction.editReply({ content: 'Number of levels must be greater than 0.' });
      }
      
      // Get monster
      const monster = await Monster.getById(monsterId);
      if (!monster) {
        return await interaction.editReply({ content: 'Monster not found.' });
      }
      
      // Get trainer
      const trainer = await Trainer.getById(monster.trainer_id);
      if (!trainer) {
        return await interaction.editReply({ content: 'Trainer not found for this monster.' });
      }
      
      // Add levels to monster
      const success = await Monster.addLevels(monsterId, levels);
      
      if (!success) {
        return await interaction.editReply({ content: 'Failed to add levels to monster.' });
      }
      
      // Get updated monster
      const updatedMonster = await Monster.getById(monsterId);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Leveled Up')
        .setDescription(`${monster.name} gained ${levels} level(s)!`)
        .setColor('#f1c40f')
        .addFields(
          { name: 'Previous Level', value: monster.level.toString(), inline: true },
          { name: 'New Level', value: updatedMonster.level.toString(), inline: true },
          { name: 'Trainer', value: trainer.name, inline: true }
        );
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling monster level command:', error);
      await interaction.editReply({ content: 'An error occurred while leveling up the monster.' });
    }
  }
  
  /**
   * Handle roll-monster command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleRollMonsterCommand(interaction) {
    try {
      const species = interaction.options.getString('species');
      const type = interaction.options.getString('type');
      const attribute = interaction.options.getString('attribute');
      const count = interaction.options.getInteger('count') || 1;
      
      // Prepare options for monster roller
      const options = {
        overrideParams: {},
        filters: {}
      };
      
      // Set species filter
      if (species) {
        if (species === 'all') {
          options.filters.includeSpecies = ['Pokemon', 'Digimon', 'Yokai'];
        } else {
          options.filters.includeSpecies = [species];
        }
      }
      
      // Set type override
      if (type) {
        options.overrideParams.types = [type];
      }
      
      // Set attribute override
      if (attribute) {
        options.overrideParams.attributes = [attribute];
      }
      
      // Roll monsters
      let monsters;
      if (count === 1) {
        const monster = await MonsterService.rollOne(options);
        monsters = [monster];
      } else {
        monsters = await MonsterService.rollMultiple(count, options);
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Roll Results')
        .setDescription(`Rolled ${count} monster(s)`)
        .setColor('#3498db');
      
      // Add fields for each monster
      monsters.forEach((monster, index) => {
        const displayData = MonsterService.getDisplayData(monster);
        
        embed.addFields({
          name: `Monster ${index + 1}: ${displayData.title}`,
          value: `Species: ${displayData.species.join('/')}\nTypes: ${displayData.types.join(', ') || 'None'}\nAttribute: ${displayData.attribute || 'None'}`
        });
      });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling roll-monster command:', error);
      await interaction.editReply({ content: 'An error occurred while rolling monsters.' });
    }
  }
}

module.exports = MonsterCommandHandler;
