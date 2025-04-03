const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EvolutionSystem = require('../../utils/EvolutionSystem');
const Monster = require('../../models/Monster');
const Trainer = require('../../models/Trainer');

/**
 * Handler for evolution-related commands
 */
class EvolutionCommandHandler {
  /**
   * Handle evolve command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleEvolveCommand(interaction) {
    try {
      const monsterId = interaction.options.getString('monster_id');
      const item = interaction.options.getString('item');
      
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
      
      // Prepare evolution data
      const evolutionData = {
        minLevel: 20,
        requireItem: !!item,
        itemName: item
      };
      
      // Evolve monster
      const result = await EvolutionSystem.evolveMonster(monsterId, evolutionData);
      
      if (!result.success) {
        return await interaction.editReply({ content: result.message });
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Evolution')
        .setDescription(`${result.originalMonster.name} evolved into ${result.evolvedMonster.name}!`)
        .setColor('#9b59b6')
        .addFields(
          { name: 'Original Species', value: this._formatSpecies(result.originalMonster), inline: true },
          { name: 'Evolved Species', value: this._formatSpecies(result.evolvedMonster), inline: true },
          { name: 'Level', value: result.evolvedMonster.level.toString(), inline: true },
          { name: 'Original Types', value: this._formatTypes(result.originalMonster), inline: true },
          { name: 'Evolved Types', value: this._formatTypes(result.evolvedMonster), inline: true }
        );
      
      if (item) {
        embed.addFields({ name: 'Item Used', value: item, inline: true });
      }
      
      // Add stat comparison
      embed.addFields({
        name: 'Stat Changes',
        value: this._formatStatChanges(result.originalMonster, result.evolvedMonster),
        inline: false
      });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling evolve command:', error);
      await interaction.editReply({ content: `Error evolving monster: ${error.message}` });
    }
  }

  /**
   * Handle fuse command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleFuseCommand(interaction) {
    try {
      const monsterAId = interaction.options.getString('monster_a_id');
      const monsterBId = interaction.options.getString('monster_b_id');
      const name = interaction.options.getString('name');
      const item = interaction.options.getString('item');
      
      // Get monsters
      const monsterA = await Monster.getById(monsterAId);
      const monsterB = await Monster.getById(monsterBId);
      
      if (!monsterA || !monsterB) {
        return await interaction.editReply({ content: 'One or both monsters not found.' });
      }
      
      // Check if monsters belong to the same trainer
      if (monsterA.trainer_id !== monsterB.trainer_id) {
        return await interaction.editReply({ content: 'Monsters must belong to the same trainer.' });
      }
      
      // Get trainer
      const trainer = await Trainer.getById(monsterA.trainer_id);
      if (!trainer) {
        return await interaction.editReply({ content: 'Trainer not found for these monsters.' });
      }
      
      // Prepare fusion data
      const fusionData = {
        name: name || monsterA.name,
        minLevel: 30,
        requireItem: !!item,
        itemName: item,
        levelBonus: 5,
        statBonus: 1.1
      };
      
      // Fuse monsters
      const result = await EvolutionSystem.fuseMonsters(monsterAId, monsterBId, fusionData);
      
      if (!result.success) {
        return await interaction.editReply({ content: result.message });
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('Monster Fusion')
        .setDescription(result.message)
        .setColor('#e74c3c')
        .addFields(
          { name: 'Fused Monster', value: result.fusedMonster.name, inline: true },
          { name: 'Level', value: result.fusedMonster.level.toString(), inline: true },
          { name: 'Species', value: this._formatSpecies(result.fusedMonster), inline: true },
          { name: 'Types', value: this._formatTypes(result.fusedMonster), inline: true }
        );
      
      if (item) {
        embed.addFields({ name: 'Item Used', value: item, inline: true });
      }
      
      // Add stat comparison
      embed.addFields({
        name: 'Stats',
        value: this._formatStats(result.fusedMonster),
        inline: false
      });
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling fuse command:', error);
      await interaction.editReply({ content: `Error fusing monsters: ${error.message}` });
    }
  }

  /**
   * Format species for display
   * @param {Object} monster - Monster data
   * @returns {string} - Formatted species
   * @private
   */
  static _formatSpecies(monster) {
    return [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join('/') || 'None';
  }

  /**
   * Format types for display
   * @param {Object} monster - Monster data
   * @returns {string} - Formatted types
   * @private
   */
  static _formatTypes(monster) {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(Boolean)
      .join(', ') || 'None';
  }

  /**
   * Format stat changes for display
   * @param {Object} originalMonster - Original monster data
   * @param {Object} evolvedMonster - Evolved monster data
   * @returns {string} - Formatted stat changes
   * @private
   */
  static _formatStatChanges(originalMonster, evolvedMonster) {
    const stats = [
      { name: 'HP', original: originalMonster.hp_total, evolved: evolvedMonster.hp_total },
      { name: 'Attack', original: originalMonster.atk_total, evolved: evolvedMonster.atk_total },
      { name: 'Defense', original: originalMonster.def_total, evolved: evolvedMonster.def_total },
      { name: 'Sp. Attack', original: originalMonster.spa_total, evolved: evolvedMonster.spa_total },
      { name: 'Sp. Defense', original: originalMonster.spd_total, evolved: evolvedMonster.spd_total },
      { name: 'Speed', original: originalMonster.spe_total, evolved: evolvedMonster.spe_total }
    ];
    
    return stats.map(stat => {
      const change = stat.evolved - stat.original;
      const changeSymbol = change > 0 ? '↑' : (change < 0 ? '↓' : '=');
      const changeText = change !== 0 ? ` (${changeSymbol}${Math.abs(change)})` : '';
      
      return `${stat.name}: ${stat.original} → ${stat.evolved}${changeText}`;
    }).join('\n');
  }

  /**
   * Format stats for display
   * @param {Object} monster - Monster data
   * @returns {string} - Formatted stats
   * @private
   */
  static _formatStats(monster) {
    return [
      `HP: ${monster.hp_total}`,
      `Attack: ${monster.atk_total}`,
      `Defense: ${monster.def_total}`,
      `Sp. Attack: ${monster.spa_total}`,
      `Sp. Defense: ${monster.spd_total}`,
      `Speed: ${monster.spe_total}`
    ].join('\n');
  }
}

module.exports = EvolutionCommandHandler;
