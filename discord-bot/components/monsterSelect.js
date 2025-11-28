const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const monsterService = require('../services/monsterService');
const trainerService = require('../services/trainerService');
const userLinkingSystem = require('../utils/userLinkingSystem');

class MonsterSelectComponent {
  // Create a monster selection menu for a trainer
  static async createMonsterSelectMenu(trainerId, customId = 'monster_select', placeholder = 'Select a monster...') {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monsters');
      }

      const monsters = response.data || [];
      
      if (monsters.length === 0) {
        throw new Error('No monsters found for this trainer.');
      }

      // Create select menu options
      const options = monsters.map(monster => this.formatMonsterOption(monster));

      // Limit to 25 options (Discord limit)
      const limitedOptions = options.slice(0, 25);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(limitedOptions);

      return new ActionRowBuilder().addComponents(selectMenu);

    } catch (error) {
      throw error;
    }
  }

  // Create monster select for user's default trainer
  static async createUserMonsterSelect(discordId, customId = 'user_monster_select', placeholder = 'Select a monster...') {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        throw new Error('Discord account not linked. Please use /link-account first.');
      }

      // Get user's default trainer
      const trainersResponse = await trainerService.getTrainersByUserId(userId);
      if (!trainersResponse.success || !trainersResponse.data || trainersResponse.data.length === 0) {
        throw new Error('No trainers found. Please create a trainer on the website first.');
      }

      const defaultTrainer = trainersResponse.data[0];
      return await this.createMonsterSelectMenu(defaultTrainer.id, customId, placeholder);

    } catch (error) {
      throw error;
    }
  }

  // Create filtered monster select (by type, species, etc.)
  static async createFilteredMonsterSelect(trainerId, filter = {}, customId = 'filtered_monster_select') {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monsters');
      }

      let monsters = response.data || [];
      
      // Apply filters
      if (filter.species) {
        monsters = monsters.filter(monster => 
          monster.species1?.toLowerCase().includes(filter.species.toLowerCase()) ||
          monster.species2?.toLowerCase().includes(filter.species.toLowerCase()) ||
          monster.species3?.toLowerCase().includes(filter.species.toLowerCase())
        );
      }

      if (filter.type) {
        monsters = monsters.filter(monster => 
          monster.type1?.toLowerCase().includes(filter.type.toLowerCase()) ||
          monster.type2?.toLowerCase().includes(filter.type.toLowerCase()) ||
          monster.type3?.toLowerCase().includes(filter.type.toLowerCase()) ||
          monster.type4?.toLowerCase().includes(filter.type.toLowerCase()) ||
          monster.type5?.toLowerCase().includes(filter.type.toLowerCase())
        );
      }

      if (filter.minLevel) {
        monsters = monsters.filter(monster => (monster.level || 1) >= filter.minLevel);
      }

      if (filter.maxLevel) {
        monsters = monsters.filter(monster => (monster.level || 1) <= filter.maxLevel);
      }

      if (filter.shiny !== undefined) {
        monsters = monsters.filter(monster => monster.shiny === filter.shiny);
      }

      if (filter.alpha !== undefined) {
        monsters = monsters.filter(monster => monster.alpha === filter.alpha);
      }

      if (monsters.length === 0) {
        throw new Error('No monsters found matching the specified criteria.');
      }

      const options = monsters.map(monster => this.formatMonsterOption(monster));
      const limitedOptions = options.slice(0, 25);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(`Select monster (${monsters.length} found)...`)
        .addOptions(limitedOptions);

      return new ActionRowBuilder().addComponents(selectMenu);

    } catch (error) {
      throw error;
    }
  }

  // Create paginated monster select
  static async createPaginatedMonsterSelect(trainerId, page = 1, itemsPerPage = 25, customId = 'paginated_monster_select') {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monsters');
      }

      const monsters = response.data || [];
      const totalPages = Math.ceil(monsters.length / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageMonsters = monsters.slice(startIndex, endIndex);

      if (pageMonsters.length === 0) {
        throw new Error('No monsters found on this page');
      }

      const options = pageMonsters.map(monster => this.formatMonsterOption(monster));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`${customId}_${page}`)
        .setPlaceholder(`Select monster (Page ${page}/${totalPages})...`)
        .addOptions(options);

      return {
        selectMenu: new ActionRowBuilder().addComponents(selectMenu),
        pagination: {
          currentPage: page,
          totalPages,
          totalMonsters: monsters.length,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

    } catch (error) {
      throw error;
    }
  }

  // Format monster for select menu option
  static formatMonsterOption(monster) {
    const species = monster.species1 || 'Unknown';
    const level = monster.level || 1;
    
    // Add special indicators
    const indicators = [];
    if (monster.shiny) indicators.push('✨');
    if (monster.alpha) indicators.push('🔺');
    if (monster.shadow) indicators.push('🌑');
    
    const indicatorString = indicators.length > 0 ? ` ${indicators.join('')}` : '';
    
    // Truncate name if too long
    const displayName = monster.name.length > 20 ? 
      monster.name.substring(0, 17) + '...' : 
      monster.name;

    return {
      label: `${displayName}${indicatorString}`,
      value: monster.id.toString(),
      description: `Lv. ${level} ${species}`,
      emoji: '👾',
    };
  }

  // Handle monster selection
  static async handleMonsterSelection(interaction, selectedMonsterId) {
    try {
      const response = await monsterService.getMonsterById(selectedMonsterId);
      if (!response.success) {
        throw new Error(response.message || 'Monster not found');
      }

      return response.data;

    } catch (error) {
      throw error;
    }
  }

  // Validate monster ownership
  static async validateMonsterOwnership(discordId, monsterId) {
    try {
      const userId = await userLinkingSystem.getUserIdFromDiscord(discordId);
      if (!userId) {
        return false;
      }

      const monstersResponse = await monsterService.getMonstersByUserId(userId);
      if (!monstersResponse.success || !monstersResponse.data) {
        return false;
      }

      return monstersResponse.data.some(monster => monster.id.toString() === monsterId.toString());

    } catch (error) {
      console.error('Error validating monster ownership:', error);
      return false;
    }
  }

  // Get monsters by box number
  static async createBoxMonsterSelect(trainerId, boxNumber, customId = 'box_monster_select') {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monsters');
      }

      const monsters = response.data || [];
      const boxMonsters = monsters.filter(monster => monster.box_number === boxNumber);

      if (boxMonsters.length === 0) {
        throw new Error(`No monsters found in box ${boxNumber}.`);
      }

      const options = boxMonsters.map(monster => this.formatMonsterOption(monster));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(`Select monster from Box ${boxNumber}...`)
        .addOptions(options);

      return new ActionRowBuilder().addComponents(selectMenu);

    } catch (error) {
      throw error;
    }
  }

  // Create monster select for specific actions (breeding, evolution, etc.)
  static async createActionMonsterSelect(trainerId, action, customId = 'action_monster_select') {
    try {
      const response = await trainerService.getTrainerMonsters(trainerId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch monsters');
      }

      let monsters = response.data || [];

      // Filter monsters based on action
      switch (action) {
        case 'breed':
          // Filter for breedable monsters (could add more specific criteria)
          monsters = monsters.filter(monster => (monster.level || 1) >= 10);
          break;
        case 'evolve':
          // Filter for monsters that can evolve (would need evolution data)
          break;
        case 'rename':
          // All monsters can be renamed
          break;
        default:
          // No filtering
          break;
      }

      if (monsters.length === 0) {
        throw new Error(`No monsters available for ${action}.`);
      }

      const options = monsters.map(monster => this.formatMonsterOption(monster));
      const limitedOptions = options.slice(0, 25);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(`Select monster to ${action}...`)
        .addOptions(limitedOptions);

      return new ActionRowBuilder().addComponents(selectMenu);

    } catch (error) {
      throw error;
    }
  }
}

module.exports = MonsterSelectComponent;
