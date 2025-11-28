const { EmbedBuilder } = require('discord.js');
const { colors } = require('../config/embeds');

class EmbedBuilderUtil {
  constructor() {
    this.embed = new EmbedBuilder();
  }

  // Create a new embed builder instance
  static create() {
    return new EmbedBuilderUtil();
  }

  // Set basic embed properties
  setTitle(title) {
    this.embed.setTitle(title);
    return this;
  }

  setDescription(description) {
    this.embed.setDescription(description);
    return this;
  }

  setColor(color) {
    this.embed.setColor(color);
    return this;
  }

  setThumbnail(url) {
    if (url) {
      this.embed.setThumbnail(url);
    }
    return this;
  }

  setImage(url) {
    if (url) {
      this.embed.setImage(url);
    }
    return this;
  }

  setFooter(text, iconURL = null) {
    this.embed.setFooter({ text, iconURL });
    return this;
  }

  setTimestamp(timestamp = null) {
    this.embed.setTimestamp(timestamp);
    return this;
  }

  setAuthor(name, iconURL = null, url = null) {
    this.embed.setAuthor({ name, iconURL, url });
    return this;
  }

  // Add fields
  addField(name, value, inline = false) {
    this.embed.addFields({ name, value, inline });
    return this;
  }

  addFields(fields) {
    this.embed.addFields(fields);
    return this;
  }

  // Preset embed types
  success(title, description) {
    return this.setTitle(`✅ ${title}`)
      .setDescription(description)
      .setColor(colors.success)
      .setTimestamp();
  }

  error(title, description) {
    return this.setTitle(`❌ ${title}`)
      .setDescription(description)
      .setColor(colors.error)
      .setTimestamp();
  }

  warning(title, description) {
    return this.setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setColor(colors.warning)
      .setTimestamp();
  }

  info(title, description) {
    return this.setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setColor(colors.info)
      .setTimestamp();
  }

  // Game-specific embed types
  trainer(trainer) {
    return this.setTitle(`👤 Trainer: ${trainer.name}`)
      .setColor(colors.trainer)
      .setThumbnail(trainer.img_link)
      .addField('Pronouns', trainer.pronouns || 'Not specified', true)
      .addField('Age', trainer.age || 'Not specified', true)
      .addField('Location', trainer.location || 'Unknown', true)
      .addField('Monsters', trainer.monster_count?.toString() || '0', true)
      .addField('Bio', trainer.bio || 'No bio available', false)
      .setTimestamp();
  }

  monster(monster) {
    const species = [monster.species1, monster.species2, monster.species3]
      .filter(Boolean)
      .join(' / ');
    
    const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter(Boolean)
      .join(' / ');

    const traits = [];
    if (monster.shiny) traits.push('✨ Shiny');
    if (monster.alpha) traits.push('🔺 Alpha');
    if (monster.shadow) traits.push('🌑 Shadow');
    if (monster.paradox) traits.push('⚡ Paradox');
    if (monster.pokerus) traits.push('🦠 Pokérus');

    return this.setTitle(`👾 ${monster.name}`)
      .setColor(colors.monster)
      .setThumbnail(monster.img_link)
      .addField('Species', species || 'Unknown', true)
      .addField('Level', monster.level?.toString() || '1', true)
      .addField('Types', types || 'None', true)
      .addField('Traits', traits.join(', ') || 'None', false)
      .addField('Nature', monster.nature || 'Unknown', true)
      .addField('Friendship', `${monster.friendship || 0}/255`, true)
      .setTimestamp();
  }

  townLocation(location, locationInfo) {
    return this.setTitle(locationInfo.name)
      .setDescription(locationInfo.description)
      .setColor(colors.town)
      .addField('Available Activities', 
        locationInfo.activities.map(activity => `• ${activity}`).join('\n') || 'None',
        false
      )
      .setTimestamp();
  }

  shop(shopInfo, items = []) {
    const embed = this.setTitle(shopInfo.name)
      .setDescription(shopInfo.description)
      .setColor(colors.market)
      .setTimestamp();

    if (items.length > 0) {
      const itemsList = items.slice(0, 10).map((item, index) => {
        const price = item.price ? `💰 ${item.price}` : 'Free';
        return `${index + 1}. **${item.name}** - ${price}`;
      }).join('\n');

      embed.addField(`Items (${items.length} total)`, itemsList, false);
      
      if (items.length > 10) {
        embed.setFooter('Showing first 10 items');
      }
    } else {
      embed.addField('Items', 'No items available', false);
    }

    return embed;
  }

  // List embed for collections
  list(title, items, formatter = null, page = 1, itemsPerPage = 10) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    let description;
    if (pageItems.length === 0) {
      description = 'No items found.';
    } else {
      description = pageItems.map((item, index) => {
        const itemNumber = startIndex + index + 1;
        if (formatter) {
          return `${itemNumber}. ${formatter(item)}`;
        }
        return `${itemNumber}. ${item.name || item.toString()}`;
      }).join('\n');
    }

    this.setTitle(title)
      .setDescription(description)
      .setColor(colors.primary)
      .setTimestamp();

    if (totalPages > 1) {
      this.setFooter(`Page ${page} of ${totalPages} | Total: ${items.length} items`);
    } else if (items.length > 0) {
      this.setFooter(`Total: ${items.length} items`);
    }

    return this;
  }

  // Build and return the embed
  build() {
    return this.embed;
  }

  // Static helper methods
  static createTrainerEmbed(trainer) {
    return EmbedBuilderUtil.create().trainer(trainer).build();
  }

  static createMonsterEmbed(monster) {
    return EmbedBuilderUtil.create().monster(monster).build();
  }

  static createSuccessEmbed(title, description) {
    return EmbedBuilderUtil.create().success(title, description).build();
  }

  static createErrorEmbed(title, description) {
    return EmbedBuilderUtil.create().error(title, description).build();
  }

  static createInfoEmbed(title, description) {
    return EmbedBuilderUtil.create().info(title, description).build();
  }

  static createWarningEmbed(title, description) {
    return EmbedBuilderUtil.create().warning(title, description).build();
  }
}

module.exports = EmbedBuilderUtil;
