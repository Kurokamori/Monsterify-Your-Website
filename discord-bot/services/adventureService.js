const axios = require('axios');
const config = require('../config/config');

class AdventureService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a Discord thread for an adventure
   * @param {Object} client - Discord client
   * @param {number} adventureId - Adventure ID
   * @param {string} adventureName - Adventure name
   * @param {string} channelId - Discord channel ID
   * @returns {Promise<Object>} Thread information
   */
  async createAdventureThread(client, adventureId, adventureName, channelId) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // Create thread
      const thread = await channel.threads.create({
        name: `🗡️ ${adventureName}`,
        autoArchiveDuration: 10080, // 7 days
        reason: `Adventure thread for: ${adventureName}`
      });

      // Generate area-specific welcome message
      const welcomeMessage = await this.generateWelcomeMessage(adventureId, adventureName);

      await thread.send(welcomeMessage);

      // Store thread information in database
      await this.apiClient.post('/adventures/discord/thread', {
        adventureId,
        discordThreadId: thread.id,
        discordChannelId: channelId,
        threadName: thread.name
      });

      return {
        threadId: thread.id,
        threadName: thread.name,
        channelId: channelId
      };

    } catch (error) {
      console.error('Error creating adventure thread:', error);
      throw error;
    }
  }

  /**
   * Generate area-specific welcome message for an adventure
   * @param {number} adventureId - Adventure ID
   * @param {string} adventureName - Adventure name
   * @returns {Promise<string>} Welcome message
   */
  async generateWelcomeMessage(adventureId, adventureName) {
    try {
      // Get adventure details from backend
      const response = await this.apiClient.get(`/adventures/${adventureId}`);
      const adventure = response.data.adventure;

      // Check if adventure has area configuration
      if (adventure.area_config && adventure.area_id) {
        let areaConfig = adventure.area_config;

        // Parse area_config if it's a string
        if (typeof areaConfig === 'string') {
          areaConfig = JSON.parse(areaConfig);
        }

        // Use area-specific welcome message if available
        if (areaConfig.welcomeMessages) {
          // Randomly select from variations or use base message
          const variations = areaConfig.welcomeMessages.variations || [];
          if (variations.length > 0) {
            const randomIndex = Math.floor(Math.random() * variations.length);
            return variations[randomIndex];
          } else if (areaConfig.welcomeMessages.base) {
            return areaConfig.welcomeMessages.base;
          }
        }
      }

      // Fallback to default welcome message
      return `🌟 **Welcome to ${adventureName}!** 🌟\n\n` +
        `This is your adventure thread! Here's how it works:\n\n` +
        `📝 **Every message you send counts toward your word count**\n` +
        `⚔️ Use \`/encounter\` to roll random encounters\n` +
        `🎯 Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
        `🎲 Use \`/result\` to resolve battle encounters\n` +
        `🏁 Use \`/end\` to complete the adventure and claim rewards\n\n` +
        `**Maximum encounters:** 3 per adventure\n` +
        `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n` +
        `Good luck, adventurers! 🚀`;

    } catch (error) {
      console.error('Error generating welcome message:', error);

      // Return default message on error
      return `🌟 **Welcome to ${adventureName}!** 🌟\n\n` +
        `This is your adventure thread! Here's how it works:\n\n` +
        `📝 **Every message you send counts toward your word count**\n` +
        `⚔️ Use \`/encounter\` to roll random encounters\n` +
        `🎯 Use \`/capture [trainer] [pokeball]\` to catch wild monsters\n` +
        `🎲 Use \`/result\` to resolve battle encounters\n` +
        `🏁 Use \`/end\` to complete the adventure and claim rewards\n\n` +
        `**Maximum encounters:** 3 per adventure\n` +
        `**Rewards:** 50 words = 1 level, 1 word = 1 coin, every 1,000 words = 1 item\n\n` +
        `Good luck, adventurers! 🚀`;
    }
  }

  /**
   * Track message word count for a user in an adventure
   * @param {string} discordThreadId - Discord thread ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} messageContent - Message content
   * @returns {Promise<Object>} Updated participant data
   */
  async trackMessageWordCount(discordThreadId, discordUserId, messageContent) {
    try {
      // Count words (simple word count by splitting on whitespace)
      const wordCount = messageContent.trim().split(/\s+/).filter(word => word.length > 0).length;

      const response = await this.apiClient.post('/adventures/discord/message', {
        discordThreadId,
        discordUserId,
        wordCount,
        messageCount: 1
      });

      return response.data;

    } catch (error) {
      console.error('Error tracking message word count:', error);
      throw error;
    }
  }

  /**
   * Get adventure by Discord thread ID
   * @param {string} discordThreadId - Discord thread ID
   * @returns {Promise<Object>} Adventure data
   */
  async getAdventureByThreadId(discordThreadId) {
    try {
      const response = await this.apiClient.get(`/adventures/discord/thread/${discordThreadId}`);
      return response.data.adventure;
    } catch (error) {
      console.error('Error getting adventure by thread ID:', error);
      throw error;
    }
  }

  /**
   * Generate random encounter
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID who triggered encounter
   * @returns {Promise<Object>} Encounter data
   */
  async generateEncounter(adventureId, discordUserId) {
    try {
      const response = await this.apiClient.post('/adventures/discord/encounter', {
        adventureId,
        discordUserId
      });
      return response.data.encounter;
    } catch (error) {
      console.error('Error generating encounter:', error);
      throw error;
    }
  }

  /**
   * Attempt to capture a monster
   * @param {number} encounterId - Encounter ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} trainerName - Trainer name
   * @param {string} pokeballType - Pokeball type
   * @param {number} pokepuffCount - Number of pokepuffs used
   * @param {number} monsterIndex - Index of monster to capture (1-based)
   * @param {boolean} isBattleCapture - Whether this is a capture during battle
   * @returns {Promise<Object>} Capture result
   */
  async attemptCapture(encounterId, discordUserId, trainerName, pokeballType, pokepuffCount = 0, monsterIndex = 1, isBattleCapture = false) {
    try {
      const response = await this.apiClient.post('/adventures/discord/capture', {
        encounterId,
        discordUserId,
        trainerName,
        pokeballType,
        pokepuffCount,
        monsterIndex,
        isBattleCapture
      });
      return response.data;
    } catch (error) {
      console.error('Error attempting capture:', error);
      throw error;
    }
  }

  /**
   * Resolve battle encounter
   * @param {number} encounterId - Encounter ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object>} Battle result
   */
  async resolveBattle(encounterId, discordUserId) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/resolve', {
        encounterId,
        discordUserId
      });
      return response.data;
    } catch (error) {
      console.error('Error resolving battle:', error);
      throw error;
    }
  }

  /**
   * Initiate or join a battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} trainerName - Trainer name
   * @returns {Promise<Object>} Battle initiation result
   */
  async initiateBattle(adventureId, discordUserId, trainerName) {
    try {
      console.log('AdventureService.initiateBattle called with:', {
        adventureId,
        discordUserId,
        trainerName
      });

      const response = await this.apiClient.post('/adventures/discord/battle/initiate', {
        adventureId,
        discordUserId,
        trainerName
      });

      console.log('Battle initiation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initiating battle:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  }

  /**
   * Execute an attack in battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} moveName - Move name
   * @param {string} targetName - Target monster name
   * @param {string} message - Battle message
   * @param {string} attackerName - Attacking monster name (optional)
   * @returns {Promise<Object>} Attack result
   */
  async executeAttack(adventureId, discordUserId, moveName, targetName, message, attackerName = null) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/attack', {
        adventureId,
        discordUserId,
        moveName,
        targetName,
        message,
        attackerName
      });
      return response.data;
    } catch (error) {
      console.error('Error executing attack:', error);
      throw error;
    }
  }

  /**
   * Use an item in battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} itemName - Item name
   * @param {string} targetName - Target monster name
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Item use result
   */
  async useItem(adventureId, discordUserId, itemName, targetName, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/use-item', {
        adventureId,
        discordUserId,
        itemName,
        targetName,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error using item:', error);
      throw error;
    }
  }

  /**
   * Get battle status
   * @param {number} adventureId - Adventure ID
   * @returns {Promise<Object>} Battle status
   */
  async getBattleStatus(adventureId) {
    try {
      const response = await this.apiClient.get(`/adventures/discord/battle/status/${adventureId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting battle status:', error);
      throw error;
    }
  }

  /**
   * Initiate a PvP battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} trainerName - Trainer name
   * @param {Array<string>} opponentTrainers - Array of opponent trainer names
   * @returns {Promise<Object>} PvP battle initiation result
   */
  async initiatePvPBattle(adventureId, discordUserId, trainerName, opponentTrainers) {
    try {
      const requestData = {
        adventureId,
        discordUserId,
        trainerName,
        opponentTrainers
      };

      console.log('AdventureService.initiatePvPBattle - Sending request:', requestData);

      const response = await this.apiClient.post('/adventures/discord/battle/pvp', requestData);
      return response.data;
    } catch (error) {
      console.error('Error initiating PvP battle:', error);
      console.error('Request data that was sent:', { adventureId, discordUserId, trainerName, opponentTrainers });
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Release a monster to the battlefield
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} monsterName - Monster name
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Release result
   */
  async releaseMonster(adventureId, discordUserId, monsterName, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/release', {
        adventureId,
        discordUserId,
        monsterName,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error releasing monster:', error);
      throw error;
    }
  }

  /**
   * Withdraw a monster from the battlefield
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} monsterName - Monster name
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Withdraw result
   */
  async withdrawMonster(adventureId, discordUserId, monsterName, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/withdraw', {
        adventureId,
        discordUserId,
        monsterName,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error withdrawing monster:', error);
      throw error;
    }
  }

  /**
   * Set battle weather
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} weather - Weather type
   * @returns {Promise<Object>} Weather set result
   */
  async setBattleWeather(adventureId, discordUserId, weather) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/weather', {
        adventureId,
        discordUserId,
        weather
      });
      return response.data;
    } catch (error) {
      console.error('Error setting battle weather:', error);
      throw error;
    }
  }

  /**
   * Set battle terrain
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} terrain - Terrain type
   * @returns {Promise<Object>} Terrain set result
   */
  async setBattleTerrain(adventureId, discordUserId, terrain) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/terrain', {
        adventureId,
        discordUserId,
        terrain
      });
      return response.data;
    } catch (error) {
      console.error('Error setting battle terrain:', error);
      throw error;
    }
  }

  /**
   * Attempt to flee from battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} message - Flee message
   * @returns {Promise<Object>} Flee result
   */
  async fleeBattle(adventureId, discordUserId, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/flee', {
        adventureId,
        discordUserId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error fleeing battle:', error);
      throw error;
    }
  }

  /**
   * Forfeit the current battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} message - Forfeit message
   * @returns {Promise<Object>} Forfeit result
   */
  async forfeitBattle(adventureId, discordUserId, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/forfeit', {
        adventureId,
        discordUserId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error forfeiting battle:', error);
      throw error;
    }
  }

  /**
   * Force win the current battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} message - Victory message
   * @returns {Promise<Object>} Force win result
   */
  async forceWinBattle(adventureId, discordUserId, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/forcewin', {
        adventureId,
        discordUserId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error force winning battle:', error);
      throw error;
    }
  }

  /**
   * Force lose the current battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} message - Defeat message
   * @returns {Promise<Object>} Force lose result
   */
  async forceLoseBattle(adventureId, discordUserId, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/forcelose', {
        adventureId,
        discordUserId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error force losing battle:', error);
      throw error;
    }
  }

  /**
   * Set win condition for battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {number} count - Number of monsters to knock out
   * @returns {Promise<Object>} Win condition result
   */
  async setWinCondition(adventureId, discordUserId, count) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/win-condition', {
        adventureId,
        discordUserId,
        count
      });
      return response.data;
    } catch (error) {
      console.error('Error setting win condition:', error);
      throw error;
    }
  }

  /**
   * Initiate a PvP battle
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} trainerName - Trainer name
   * @param {Array<string>} opponentIds - Array of opponent Discord user IDs
   * @returns {Promise<Object>} PvP battle initiation result
   */
  async initiatePvPBattle(adventureId, discordUserId, trainerName, opponentIds) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/pvp', {
        adventureId,
        discordUserId,
        trainerName,
        opponentIds
      });
      return response.data;
    } catch (error) {
      console.error('Error initiating PvP battle:', error);
      throw error;
    }
  }

  /**
   * Release a monster to the battlefield
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {number} monsterIndex - Monster index
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Release result
   */
  async releaseMonster(adventureId, discordUserId, monsterIndex, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/release', {
        adventureId,
        discordUserId,
        monsterIndex,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error releasing monster:', error);
      throw error;
    }
  }

  /**
   * Withdraw a monster from the battlefield
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {number} monsterIndex - Monster index
   * @param {string} message - Battle message
   * @returns {Promise<Object>} Withdraw result
   */
  async withdrawMonster(adventureId, discordUserId, monsterIndex, message) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/withdraw', {
        adventureId,
        discordUserId,
        monsterIndex,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error withdrawing monster:', error);
      throw error;
    }
  }

  /**
   * Set battle weather
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} weather - Weather type
   * @returns {Promise<Object>} Weather set result
   */
  async setBattleWeather(adventureId, discordUserId, weather) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/weather', {
        adventureId,
        discordUserId,
        weather
      });
      return response.data;
    } catch (error) {
      console.error('Error setting battle weather:', error);
      throw error;
    }
  }

  /**
   * Set battle terrain
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID
   * @param {string} terrain - Terrain type
   * @returns {Promise<Object>} Terrain set result
   */
  async setBattleTerrain(adventureId, discordUserId, terrain) {
    try {
      const response = await this.apiClient.post('/adventures/discord/battle/terrain', {
        adventureId,
        discordUserId,
        terrain
      });
      return response.data;
    } catch (error) {
      console.error('Error setting battle terrain:', error);
      throw error;
    }
  }

  /**
   * End adventure and calculate rewards
   * @param {number} adventureId - Adventure ID
   * @param {string} discordUserId - Discord user ID who ended adventure
   * @returns {Promise<Object>} Adventure completion data with rewards
   */
  async endAdventure(adventureId, discordUserId) {
    try {
      const response = await this.apiClient.post('/adventures/discord/end', {
        adventureId,
        discordUserId
      });
      return response.data;
    } catch (error) {
      console.error('Error ending adventure:', error);
      throw error;
    }
  }

  /**
   * Get user's unclaimed adventure rewards
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Array>} Array of unclaimed rewards
   */
  async getUnclaimedRewards(discordUserId) {
    try {
      const response = await this.apiClient.get(`/adventures/discord/rewards/unclaimed/${discordUserId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting unclaimed rewards:', error);
      throw error;
    }
  }

  /**
   * Get linked user ID from Discord user ID
   * @param {string} discordUserId - Discord user ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getLinkedUser(discordUserId) {
    try {
      const response = await this.apiClient.get(`/adventures/discord/user/${discordUserId}`);
      return response.data.user;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting linked user:', error);
      throw error;
    }
  }

  /**
   * Format encounter message for Discord
   * @param {Object} encounter - Encounter data
   * @param {Object} adventure - Adventure data for environmental conditions
   * @returns {string} Formatted message
   */
  formatEncounterMessage(encounter, adventure = null) {
    // Handle both 'type' and 'encounter_type' properties
    const encounterType = encounter.type || encounter.encounter_type;

    switch (encounterType) {
      case 'battle':
        return this.formatBattleEncounter(encounter, adventure);
      case 'wild':
        return this.formatWildEncounter(encounter);
      case 'item':
        return this.formatItemEncounter(encounter);
      case 'special':
        return this.formatSpecialEncounter(encounter);
      default:
        return 'An unknown encounter appears!';
    }
  }

  /**
   * Format battle encounter message
   * @param {Object} encounter - Battle encounter data
   * @param {Object} adventure - Adventure data for environmental conditions
   * @returns {string} Formatted message
   */
  formatBattleEncounter(encounter, adventure = null) {
    // Handle different data structures
    const encounterData = encounter.data || encounter.encounter_data || {};
    const { trainers, monsters } = encounterData;
    let message = `⚔️ **BATTLE ENCOUNTER!** ⚔️\n\n`;

    // Add environmental conditions if available
    if (adventure && adventure.area_config) {
      const areaConfig = typeof adventure.area_config === 'string' ?
        JSON.parse(adventure.area_config) : adventure.area_config;

      if (areaConfig.battleParameters) {
        const { weather, terrain } = areaConfig.battleParameters;
        if (weather || terrain) {
          message += `**Environmental Conditions:**\n`;
          if (weather) {
            message += `🌤️ Weather: ${this.formatWeatherName(weather)}\n`;
          }
          if (terrain) {
            message += `🗺️ Terrain: ${this.formatTerrainName(terrain)}\n`;
          }
          message += `\n`;
        }
      }
    }

    if (trainers && trainers.length > 0) {
      message += `**Enemy Trainers:**\n`;
      trainers.forEach(trainer => {
        message += `• ${trainer.name} (Level ${trainer.level})\n`;
      });
      message += `\n`;
    }

    if (monsters && monsters.length > 0) {
      message += `**Enemy Monsters:**\n`;
      monsters.forEach((monster, index) => {
        const species = [monster.species1, monster.species2, monster.species3].filter(Boolean).join('/');
        const types = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean).join(', ');
        const targetIndex = monster.targetIndex || (index + 1);
        const healthInfo = monster.health !== undefined ? ` (${monster.health}/${monster.maxHealth || 100} HP)` : '';
        const wildIndicator = monster.isWild ? ' 🌿' : '';

        message += `**${targetIndex}.** ${species} (${types}) - Level ${monster.level}${healthInfo}${wildIndicator}\n`;
      });

      if (monsters.some(m => m.isWild)) {
        message += `\n🌿 = Wild monsters (can be captured during battle)\n`;
      }
    }

    message += `\n🎲 Use \`/result\` to resolve this battle!`;
    return message;
  }

  /**
   * Format weather name for display
   * @param {string} weather - Weather condition
   * @returns {string} Formatted weather name
   */
  formatWeatherName(weather) {
    const weatherNames = {
      'clear': 'Clear Skies',
      'sunny': 'Harsh Sunlight',
      'rain': 'Heavy Rain',
      'sandstorm': 'Sandstorm',
      'hail': 'Hailstorm',
      'fog': 'Dense Fog',
      'snow': 'Snowfall'
    };
    return weatherNames[weather] || weather;
  }

  /**
   * Format terrain name for display
   * @param {string} terrain - Terrain type
   * @returns {string} Formatted terrain name
   */
  formatTerrainName(terrain) {
    const terrainNames = {
      'normal': 'Normal Ground',
      'electric': 'Electric Terrain',
      'grassy': 'Grassy Terrain',
      'psychic': 'Psychic Terrain',
      'misty': 'Misty Terrain'
    };
    return terrainNames[terrain] || terrain;
  }

  /**
   * Format special encounter message
   * @param {Object} encounter - Special encounter data
   * @returns {string} Formatted message
   */
  formatSpecialEncounter(encounter) {
    // Handle different data structures
    const encounterData = encounter.data || encounter.encounter_data || {};
    const { encounterType, description } = encounterData;
    let message = `✨ **SPECIAL ENCOUNTER!** ✨\n\n`;

    if (encounterType) {
      message += `**${this.formatSpecialEncounterType(encounterType)}**\n\n`;
    }

    if (description) {
      message += `${description}\n\n`;
    }

    // Add type-specific instructions
    if (encounterType) {
      switch (encounterType) {
        case 'legendary_guardian':
          message += `🛡️ A legendary guardian blocks your path! This is a rare opportunity for a challenging battle.`;
          break;
        case 'champion_battle':
          message += `🏆 A skilled champion challenges you to prove your worth in combat!`;
          break;
        case 'rare_item':
          message += `💎 Ancient knowledge reveals rare treasures! Items have been added to your inventory.`;
          break;
        case 'community_festival':
          message += `🎉 Join the celebration and meet fellow trainers and their monsters!`;
          break;
        case 'fire_trial':
          message += `🔥 The sacred flames test your courage and determination!`;
          break;
        case 'divine_blessing':
          message += `🙏 The eternal flame bestows its blessing upon your journey!`;
          break;
        default:
          message += `🌟 This unique encounter offers special opportunities for those brave enough to engage!`;
      }
    } else {
      message += `🌟 A mysterious encounter awaits! This unique event offers special opportunities for those brave enough to engage!`;
    }

    return message;
  }

  /**
   * Format special encounter type name
   * @param {string} encounterType - Special encounter type
   * @returns {string} Formatted type name
   */
  formatSpecialEncounterType(encounterType) {
    const typeNames = {
      'legendary_guardian': 'Legendary Guardian',
      'champion_battle': 'Champion Challenge',
      'rare_item': 'Ancient Discovery',
      'community_festival': 'Community Festival',
      'fire_trial': 'Trial of Fire',
      'divine_blessing': 'Divine Blessing',
      'phoenix_sighting': 'Phoenix Sighting',
      'frost_giant_challenge': 'Frost Giant Challenge',
      'sea_palace_audience': 'Sea Palace Audience',
      'crystal_dome_mystery': 'Crystal Dome Mystery'
    };
    return typeNames[encounterType] || 'Special Event';
  }

  /**
   * Format wild encounter message
   * @param {Object} encounter - Wild encounter data
   * @returns {string} Formatted message
   */
  formatWildEncounter(encounter) {
    // Handle different data structures
    const encounterData = encounter.data || encounter.encounter_data || {};
    const groups = encounterData.groups || [];
    let message = `🌿 **WILD ENCOUNTER!** 🌿\n\n`;

    if (groups.length === 0) {
      message += `No wild monsters found in this area.\n`;
    } else {
      groups.forEach((group, index) => {
        const species = [group.species1, group.species2, group.species3].filter(Boolean).join('/');
        const types = [group.type1, group.type2, group.type3, group.type4, group.type5].filter(Boolean).join(', ');
        const attribute = group.attribute ? ` (${group.attribute})` : '';

        message += `You encounter ${group.count} ${species}${attribute} (${types}) ${group.activity}\n`;
      });
    }

    message += `\n🎯 Use \`/capture [trainer] [pokeball]\` to attempt captures!`;
    return message;
  }

  /**
   * Get helpful instructions based on encounter type
   * @param {Object} encounter - Encounter data
   * @returns {string|null} Instruction message
   */
  getEncounterInstructions(encounter) {
    // Handle both 'type' and 'encounter_type' properties
    const encounterType = encounter.type || encounter.encounter_type;

    switch (encounterType) {
      case 'wild':
        return `💡 **Wild Encounter Instructions:**\n` +
               `• Use \`/capture [trainer_name] [pokeball_type]\` to catch monsters\n` +
               `• Example: \`/capture Ash pokeball\` or \`/capture Ash great ball\`\n` +
               `• Different pokeballs have different capture rates\n` +
               `• You can capture multiple monsters from the same encounter!`;

      case 'battle':
        if (encounter.isAutoBattle) {
          return `⚔️ **Auto-Battle Started!**\n` +
                 `• Aggressive monsters have attacked you!\n` +
                 `• Use \`/battle [trainer_name]\` to join the battle\n` +
                 `• Use \`/attack [move_name] [target]\` to attack enemies\n` +
                 `  - Target enemies by their **number** (e.g., \`/attack tackle 1\` for enemy #1)\n` +
                 `• Use \`/release [monster_name]\` to send out monsters\n` +
                 `• Use \`/withdraw [monster_name]\` to recall monsters\n` +
                 `• Use \`/battle-status\` to check current battle state\n` +
                 `• Wild monsters 🌿 in battle can be captured with \`/capture [trainer] [pokeball]\`!`;
        } else {
          return `⚔️ **Battle Encounter Instructions:**\n` +
                 `• Use \`/battle [trainer_name]\` to join the battle\n` +
                 `• Use \`/attack [move_name] [target]\` to attack enemies\n` +
                 `  - Target enemies by their **number** (e.g., \`/attack tackle 1\` for enemy #1)\n` +
                 `• Use \`/release [monster_name]\` to send out monsters\n` +
                 `• Use \`/withdraw [monster_name]\` to recall monsters\n` +
                 `• Use \`/battle-status\` to check current battle state`;
        }

      case 'item':
        return `🎁 **Item Encounter Instructions:**\n` +
               `• Items have been automatically added to your inventory\n` +
               `• Check your trainer's inventory on the website to see what you found!`;

      case 'special':
        return `✨ **Special Encounter Instructions:**\n` +
               `• This is a unique area-specific encounter!\n` +
               `• Follow any special instructions provided\n` +
               `• These encounters may have unique rewards or challenges\n` +
               `• Some special encounters may require specific actions or responses`;

      default:
        return null;
    }
  }

  /**
   * Format item encounter message
   * @param {Object} encounter - Item encounter data
   * @returns {string} Formatted message
   */
  formatItemEncounter(encounter) {
    // Handle different data structures
    const encounterData = encounter.data || encounter.encounter_data || {};
    const { item } = encounterData;

    if (!item) {
      return `💎 **ITEM FOUND!** 💎\n\nYou discovered something valuable!\n\nThis item has been added to all participants' adventure logs!`;
    }

    return `💎 **ITEM FOUND!** 💎\n\n` +
           `You discovered: **${item.name}**\n` +
           `${item.description}\n\n` +
           `This item has been added to all participants' adventure logs!`;
  }
}

module.exports = new AdventureService();
