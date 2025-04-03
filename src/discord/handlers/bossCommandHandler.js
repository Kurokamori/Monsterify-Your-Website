const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const BossSystem = require('../../utils/BossSystem');
const Trainer = require('../../models/Trainer');

/**
 * Handler for boss-related commands
 */
class BossCommandHandler {
  /**
   * Handle boss command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleBossCommand(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'status':
          await this._handleBossStatus(interaction);
          break;
        case 'attack':
          await this._handleBossAttack(interaction);
          break;
        case 'contribution':
          await this._handleBossContribution(interaction);
          break;
        case 'leaderboard':
          await this._handleBossLeaderboard(interaction);
          break;
        case 'claim-rewards':
          await this._handleClaimBossRewards(interaction);
          break;
        default:
          await interaction.editReply({ content: 'Unknown boss subcommand.' });
      }
    } catch (error) {
      console.error('Error handling boss command:', error);
      await interaction.editReply({ content: `Error processing boss command: ${error.message}` });
    }
  }

  /**
   * Handle create-boss command
   * @param {CommandInteraction} interaction - Discord command interaction
   */
  static async handleCreateBossCommand(interaction) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return await interaction.editReply({ content: 'You do not have permission to create bosses.' });
      }
      
      // Get boss data
      const name = interaction.options.getString('name');
      const description = interaction.options.getString('description');
      const maxHealth = interaction.options.getInteger('max_health');
      const imageUrl = interaction.options.getString('image_url') || null;
      const type = interaction.options.getString('type') || 'normal';
      
      // Create boss
      const boss = await BossSystem.createBoss({
        name,
        description,
        image_url: imageUrl,
        max_health: maxHealth,
        type
      });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('New Boss Created')
        .setDescription(`A new boss has appeared: ${boss.name}!`)
        .setColor('#ff0000')
        .addFields(
          { name: 'Description', value: boss.description, inline: false },
          { name: 'Health', value: `${boss.current_health}/${boss.max_health}`, inline: true },
          { name: 'Type', value: boss.type, inline: true },
          { name: 'ID', value: boss.id.toString(), inline: true }
        );
      
      if (boss.image_url) {
        embed.setImage(boss.image_url);
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error handling create-boss command:', error);
      await interaction.editReply({ content: `Error creating boss: ${error.message}` });
    }
  }

  /**
   * Handle boss status
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleBossStatus(interaction) {
    // Get current boss
    const boss = await BossSystem.getCurrentBoss();
    
    if (!boss) {
      return await interaction.editReply({ content: 'No active boss found.' });
    }
    
    // Calculate health percentage
    const healthPercentage = (boss.current_health / boss.max_health) * 100;
    
    // Create health bar
    const healthBarLength = 20;
    const filledBars = Math.round((healthPercentage / 100) * healthBarLength);
    const emptyBars = healthBarLength - filledBars;
    const healthBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Boss: ${boss.name}`)
      .setDescription(boss.description)
      .setColor('#ff0000')
      .addFields(
        { name: 'Health', value: `${boss.current_health}/${boss.max_health} (${Math.round(healthPercentage)}%)`, inline: true },
        { name: 'Type', value: boss.type, inline: true },
        { name: 'Health Bar', value: healthBar, inline: false }
      );
    
    if (boss.image_url) {
      embed.setImage(boss.image_url);
    }
    
    // Create attack button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`boss_attack_${boss.id}`)
          .setLabel('Attack Boss')
          .setStyle(ButtonStyle.Danger)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle boss attack
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleBossAttack(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    const damage = interaction.options.getInteger('damage');
    const source = interaction.options.getString('source') || 'activity';
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Deal damage to boss
    const result = await BossSystem.dealDamage(trainerId, damage, source);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Calculate health percentage
    const healthPercentage = (result.boss.current_health / result.boss.max_health) * 100;
    
    // Create health bar
    const healthBarLength = 20;
    const filledBars = Math.round((healthPercentage / 100) * healthBarLength);
    const emptyBars = healthBarLength - filledBars;
    const healthBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name} Attacked ${result.boss.name}`)
      .setDescription(result.message)
      .setColor('#ff0000')
      .addFields(
        { name: 'Damage Dealt', value: result.damage.toString(), inline: true },
        { name: 'Boss Health', value: `${result.boss.current_health}/${result.boss.max_health} (${Math.round(healthPercentage)}%)`, inline: true },
        { name: 'Health Bar', value: healthBar, inline: false }
      );
    
    if (result.boss.image_url) {
      embed.setThumbnail(result.boss.image_url);
    }
    
    // Create buttons
    const row = new ActionRowBuilder();
    
    // Add attack button if boss is not defeated
    if (!result.defeated) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`boss_attack_${result.boss.id}_${trainerId}`)
          .setLabel('Attack Again')
          .setStyle(ButtonStyle.Danger)
      );
    }
    
    // Add contribution button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`boss_contribution_${trainerId}`)
        .setLabel('View Contribution')
        .setStyle(ButtonStyle.Secondary)
    );
    
    await interaction.editReply({ 
      embeds: [embed], 
      components: row.components.length > 0 ? [row] : [] 
    });
  }

  /**
   * Handle boss contribution
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleBossContribution(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Get contribution
    const result = await BossSystem.getTrainerContribution(trainerId);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name}'s Contribution to ${result.boss.name}`)
      .setColor('#ff0000')
      .addFields(
        { name: 'Damage Dealt', value: result.trainerDamage.toString(), inline: true },
        { name: 'Total Boss Damage', value: result.totalDamage.toString(), inline: true },
        { name: 'Contribution', value: `${Math.round(result.contributionPercentage)}%`, inline: true },
        { name: 'Rank', value: result.rank.toString(), inline: true },
        { name: 'Total Participants', value: result.totalParticipants.toString(), inline: true },
        { name: 'Attack Count', value: result.attackCount.toString(), inline: true }
      );
    
    if (result.boss.image_url) {
      embed.setThumbnail(result.boss.image_url);
    }
    
    // Create buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`boss_attack_${result.boss.id}_${trainerId}`)
          .setLabel('Attack Boss')
          .setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`boss_leaderboard_${result.boss.id}`)
          .setLabel('View Leaderboard')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  /**
   * Handle boss leaderboard
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleBossLeaderboard(interaction) {
    const bossId = interaction.options.getString('boss_id');
    const limit = interaction.options.getInteger('limit') || 10;
    
    // Get leaderboard
    const result = await BossSystem.getBossLeaderboard(bossId, limit);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`Boss Leaderboard: ${result.boss.name}`)
      .setColor('#ff0000')
      .setDescription(`Total Damage: ${result.totalDamage} | Participants: ${result.totalParticipants}`);
    
    // Add leaderboard entries
    result.leaderboard.forEach((entry, index) => {
      embed.addFields({
        name: `#${index + 1}: ${entry.trainer_name}`,
        value: `Damage: ${entry.total_damage} (${Math.round(entry.contribution_percentage)}%) | Attacks: ${entry.attack_count}`,
        inline: false
      });
    });
    
    if (result.boss.image_url) {
      embed.setThumbnail(result.boss.image_url);
    }
    
    await interaction.editReply({ embeds: [embed] });
  }

  /**
   * Handle claim boss rewards
   * @param {CommandInteraction} interaction - Discord command interaction
   * @private
   */
  static async _handleClaimBossRewards(interaction) {
    const trainerId = interaction.options.getString('trainer_id');
    const bossId = interaction.options.getString('boss_id');
    
    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return await interaction.editReply({ content: 'Trainer not found.' });
    }
    
    // Claim rewards
    const result = await BossSystem.claimBossRewards(trainerId, bossId);
    
    if (!result.success) {
      return await interaction.editReply({ content: result.message });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`${trainer.name} Claimed Boss Rewards`)
      .setDescription(`You claimed rewards for defeating ${result.boss.name}!`)
      .setColor('#ff0000')
      .addFields(
        { name: 'Damage Dealt', value: result.contribution.damage_dealt.toString(), inline: true },
        { name: 'Contribution', value: `${Math.round(result.contribution.contribution_percentage)}%`, inline: true }
      );
    
    // Add reward fields
    result.rewards.forEach(reward => {
      const rewardData = reward.reward.reward_data;
      
      if (reward.reward.type === 'coin') {
        embed.addFields({ 
          name: 'Coins Earned', 
          value: rewardData.amount.toString(), 
          inline: true 
        });
      } else if (reward.reward.type === 'item') {
        embed.addFields({ 
          name: 'Item Earned', 
          value: `${rewardData.name} (${rewardData.quantity}x)`, 
          inline: true 
        });
      } else if (reward.reward.type === 'monster') {
        embed.addFields({ 
          name: 'Monster Reward', 
          value: 'You earned a special monster!', 
          inline: true 
        });
      }
    });
    
    await interaction.editReply({ embeds: [embed] });
  }
}

module.exports = BossCommandHandler;
