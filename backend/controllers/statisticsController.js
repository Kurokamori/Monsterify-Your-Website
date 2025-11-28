const db = require('../config/db');

/**
 * Get overall statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOverallStats = async (req, res) => {
  try {

    // Get all monsters
    const monsters = await db.asyncAll('SELECT * FROM monsters');

    // Get all trainers
    const trainers = await db.asyncAll('SELECT * FROM trainers');

    // Calculate overall statistics
    const stats = {
      overview: {
        total_monsters: monsters.length,
        unique_species: new Set(monsters.map(m => m.species1)).size,
        average_level: Math.round(monsters.reduce((sum, m) => sum + (m.level || 0), 0) / monsters.length) || 0,
        highest_level: Math.max(...monsters.map(m => m.level || 0), 0),
        type_distribution: calculateTypeDistribution(monsters)
      },
      top_monsters: getTopMonsters(monsters),
      monsters: getMonstersList(monsters)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting overall statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer comparison statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerComparisonStats = async (req, res) => {
  try {

    // Get all monsters
    const monsters = await db.asyncAll('SELECT * FROM monsters');

    // Get all trainers
    const trainers = await db.asyncAll('SELECT * FROM trainers');

    // Group monsters by trainer
    const monstersByTrainer = {};
    monsters.forEach(monster => {
      if (!monstersByTrainer[monster.trainer_id]) {
        monstersByTrainer[monster.trainer_id] = [];
      }
      monstersByTrainer[monster.trainer_id].push(monster);
    });

    // Group trainers by player
    const trainersByPlayer = {};
    trainers.forEach(trainer => {
      if (!trainersByPlayer[trainer.player_user_id]) {
        trainersByPlayer[trainer.player_user_id] = [];
      }
      trainersByPlayer[trainer.player_user_id].push(trainer);
    });

    // Calculate global statistics
    const totalTrainers = trainers.length;
    const totalMonsters = monsters.length;
    const totalPlayers = Object.keys(trainersByPlayer).length;
    const averageMonstersPerTrainer = totalTrainers > 0 ? totalMonsters / totalTrainers : 0;

    // Calculate reference percentages for each trainer
    const trainerReferencePercentages = {};
    trainers.forEach(trainer => {
      const trainerMonsters = monstersByTrainer[trainer.id] || [];
      const totalTrainerMonsters = trainerMonsters.length;
      const referencedMonsters = trainerMonsters.filter(m => m.img_link && m.img_link !== '').length;
      const referencePercentage = totalTrainerMonsters > 0 ? (referencedMonsters / totalTrainerMonsters) * 100 : 0;
      trainerReferencePercentages[trainer.id] = {
        percentage: referencePercentage,
        total: totalTrainerMonsters,
        referenced: referencedMonsters
      };
    });

    // Calculate average reference percentage
    const averageReferencePercentage = Object.values(trainerReferencePercentages).reduce((sum, data) => sum + data.percentage, 0) / totalTrainers;

    // Find player with most trainers
    let mostTrainersPlayer = null;
    let mostTrainersCount = 0;
    Object.entries(trainersByPlayer).forEach(([playerId, playerTrainers]) => {
      if (playerTrainers.length > mostTrainersCount) {
        mostTrainersCount = playerTrainers.length;
        mostTrainersPlayer = playerId;
      }
    });

    // Find player with least trainers
    let leastTrainersPlayer = null;
    let leastTrainersCount = Infinity;
    Object.entries(trainersByPlayer).forEach(([playerId, playerTrainers]) => {
      if (playerTrainers.length < leastTrainersCount) {
        leastTrainersCount = playerTrainers.length;
        leastTrainersPlayer = playerId;
      }
    });

    // Calculate reference percentages for each player
    const playerReferencePercentages = {};
    Object.entries(trainersByPlayer).forEach(([playerId, playerTrainers]) => {
      let totalPlayerMonsters = 0;
      let totalPlayerReferencedMonsters = 0;

      playerTrainers.forEach(trainer => {
        const trainerMonsters = monstersByTrainer[trainer.id] || [];
        totalPlayerMonsters += trainerMonsters.length;
        totalPlayerReferencedMonsters += trainerMonsters.filter(m => m.img_link && m.img_link !== '').length;
      });

      const referencePercentage = totalPlayerMonsters > 0 ? (totalPlayerReferencedMonsters / totalPlayerMonsters) * 100 : 0;
      playerReferencePercentages[playerId] = {
        percentage: referencePercentage,
        total: totalPlayerMonsters,
        referenced: totalPlayerReferencedMonsters
      };
    });

    // Find player with highest reference percentage
    let mostReferencedPlayer = null;
    let highestReferencePercentage = 0;
    Object.entries(playerReferencePercentages).forEach(([playerId, data]) => {
      if (data.percentage > highestReferencePercentage && data.total > 0) {
        highestReferencePercentage = data.percentage;
        mostReferencedPlayer = playerId;
      }
    });

    // Find player with lowest reference percentage
    let leastReferencedPlayer = null;
    let lowestReferencePercentage = 100;
    Object.entries(playerReferencePercentages).forEach(([playerId, data]) => {
      if (data.percentage < lowestReferencePercentage && data.total > 0) {
        lowestReferencePercentage = data.percentage;
        leastReferencedPlayer = playerId;
      }
    });

    // Find trainer with highest level
    let highestLevelTrainer = null;
    let highestLevel = 0;
    trainers.forEach(trainer => {
      if ((trainer.level || 0) > highestLevel) {
        highestLevel = trainer.level || 0;
        highestLevelTrainer = trainer;
      }
    });

    // Find trainer with most monsters
    let mostMonstersTrainer = null;
    let mostMonstersCount = 0;
    Object.entries(monstersByTrainer).forEach(([trainerId, trainerMonsters]) => {
      if (trainerMonsters.length > mostMonstersCount) {
        mostMonstersCount = trainerMonsters.length;
        mostMonstersTrainer = trainers.find(t => t.id === parseInt(trainerId));
      }
    });

    // Find trainer with highest reference percentage
    let mostReferencedTrainer = null;
    let highestTrainerReferencePercentage = 0;
    Object.entries(trainerReferencePercentages).forEach(([trainerId, data]) => {
      if (data.percentage > highestTrainerReferencePercentage && data.total > 0) {
        highestTrainerReferencePercentage = data.percentage;
        mostReferencedTrainer = trainers.find(t => t.id === parseInt(trainerId));
      }
    });

    // Find trainer with lowest reference percentage
    let leastReferencedTrainer = null;
    let lowestTrainerReferencePercentage = 100;
    Object.entries(trainerReferencePercentages).forEach(([trainerId, data]) => {
      if (data.percentage < lowestTrainerReferencePercentage && data.total > 0) {
        lowestTrainerReferencePercentage = data.percentage;
        leastReferencedTrainer = trainers.find(t => t.id === parseInt(trainerId));
      }
    });

    // Calculate type distribution by player and trainer
    const typeDistributionByPlayer = {};
    const typeDistributionByTrainer = {};
    const typeLeaders = {};

    // Initialize type leaders
    const allTypes = new Set();
    monsters.forEach(monster => {
      ['type1', 'type2', 'type3', 'type4', 'type5'].forEach(typeField => {
        if (monster[typeField]) {
          allTypes.add(monster[typeField]);
        }
      });
    });

    allTypes.forEach(type => {
      typeLeaders[type] = {
        trainer_id: null,
        player_id: null,
        count: 0
      };
    });

    // Calculate type distribution and find type leaders
    trainers.forEach(trainer => {
      const trainerMonsters = monstersByTrainer[trainer.id] || [];
      const trainerTypeCount = {};

      trainerMonsters.forEach(monster => {
        ['type1', 'type2', 'type3', 'type4', 'type5'].forEach(typeField => {
          if (monster[typeField]) {
            const type = monster[typeField];
            trainerTypeCount[type] = (trainerTypeCount[type] || 0) + 1;

            // Update type leader if this trainer has more of this type
            if (trainerTypeCount[type] > (typeLeaders[type]?.count || 0)) {
              typeLeaders[type] = {
                trainer_id: trainer.id,
                player_id: trainer.player_user_id,
                count: trainerTypeCount[type]
              };
            }
          }
        });
      });

      // Store type distribution for this trainer
      typeDistributionByTrainer[trainer.id] = trainerTypeCount;

      // Add to player type distribution
      if (!typeDistributionByPlayer[trainer.player_user_id]) {
        typeDistributionByPlayer[trainer.player_user_id] = {};
      }

      Object.entries(trainerTypeCount).forEach(([type, count]) => {
        typeDistributionByPlayer[trainer.player_user_id][type] = (typeDistributionByPlayer[trainer.player_user_id][type] || 0) + count;
      });
    });

    // Calculate attribute distribution by player and trainer
    const attributeDistributionByPlayer = {};
    const attributeDistributionByTrainer = {};
    const attributeLeaders = {};

    // Initialize attribute leaders
    const allAttributes = new Set();
    monsters.forEach(monster => {
      if (monster.attribute) {
        allAttributes.add(monster.attribute);
      }
    });

    allAttributes.forEach(attribute => {
      attributeLeaders[attribute] = {
        trainer_id: null,
        player_id: null,
        count: 0
      };
    });

    // Calculate attribute distribution and find attribute leaders
    trainers.forEach(trainer => {
      const trainerMonsters = monstersByTrainer[trainer.id] || [];
      const trainerAttributeCount = {};

      trainerMonsters.forEach(monster => {
        if (monster.attribute) {
          const attribute = monster.attribute;
          trainerAttributeCount[attribute] = (trainerAttributeCount[attribute] || 0) + 1;

          // Update attribute leader if this trainer has more of this attribute
          if (trainerAttributeCount[attribute] > (attributeLeaders[attribute]?.count || 0)) {
            attributeLeaders[attribute] = {
              trainer_id: trainer.id,
              player_id: trainer.player_user_id,
              count: trainerAttributeCount[attribute]
            };
          }
        }
      });

      // Store attribute distribution for this trainer
      attributeDistributionByTrainer[trainer.id] = trainerAttributeCount;

      // Add to player attribute distribution
      if (!attributeDistributionByPlayer[trainer.player_user_id]) {
        attributeDistributionByPlayer[trainer.player_user_id] = {};
      }

      Object.entries(trainerAttributeCount).forEach(([attribute, count]) => {
        attributeDistributionByPlayer[trainer.player_user_id][attribute] = (attributeDistributionByPlayer[trainer.player_user_id][attribute] || 0) + count;
      });
    });

    // Get trainers with user information for comparison
    const trainersWithUsers = await db.asyncAll(`
      SELECT 
        t.*,
        u.display_name AS player_display_name,
        u.username AS player_username
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id
    `);

    // Get top trainers for comparison display
    const topTrainersByLevel = trainersWithUsers
      .sort((a, b) => (b.level || 0) - (a.level || 0))
      .slice(0, 5)
      .map(trainer => ({
        id: trainer.id,
        name: trainer.name || 'Unknown Trainer',
        title: trainer.title || null,
        faction: trainer.faction || null,
        main_ref: trainer.main_ref || null,
        level: trainer.level || 1,
        player_display_name: trainer.player_display_name || trainer.player_username || 'Unknown Player'
      }));

    const topTrainersByMonsters = Object.entries(monstersByTrainer)
      .map(([trainerId, monsters]) => {
        const trainer = trainersWithUsers.find(t => t.id === parseInt(trainerId));
        return {
          id: trainer?.id || parseInt(trainerId),
          name: trainer?.name || 'Unknown Trainer',
          title: trainer?.title || null,
          faction: trainer?.faction || null,
          main_ref: trainer?.main_ref || null,
          monster_count: monsters.length,
          player_display_name: trainer?.player_display_name || trainer?.player_username || 'Unknown Player'
        };
      })
      .sort((a, b) => b.monster_count - a.monster_count)
      .slice(0, 5);

    // Format the response
    const stats = {
      global_stats: {
        total_trainers: totalTrainers,
        total_monsters: totalMonsters,
        total_players: totalPlayers,
        average_monsters_per_trainer: Math.round(averageMonstersPerTrainer * 10) / 10,
        average_reference_percentage: Math.round(averageReferencePercentage * 10) / 10
      },
      top_trainers: {
        by_level: topTrainersByLevel,
        by_monsters: topTrainersByMonsters
      },
      player_rankings: {
        most_trainers: {
          player_name: mostTrainersPlayer,
          trainer_count: mostTrainersCount,
          trainers: trainersByPlayer[mostTrainersPlayer]?.map(t => t.name) || []
        },
        least_trainers: {
          player_name: leastTrainersPlayer,
          trainer_count: leastTrainersCount,
          trainers: trainersByPlayer[leastTrainersPlayer]?.map(t => t.name) || []
        },
        most_referenced: {
          player_name: mostReferencedPlayer,
          reference_percentage: Math.round(playerReferencePercentages[mostReferencedPlayer]?.percentage * 10) / 10 || 0,
          total_monsters: playerReferencePercentages[mostReferencedPlayer]?.total || 0,
          referenced_monsters: playerReferencePercentages[mostReferencedPlayer]?.referenced || 0
        },
        least_referenced: {
          player_name: leastReferencedPlayer,
          reference_percentage: Math.round(playerReferencePercentages[leastReferencedPlayer]?.percentage * 10) / 10 || 0,
          total_monsters: playerReferencePercentages[leastReferencedPlayer]?.total || 0,
          referenced_monsters: playerReferencePercentages[leastReferencedPlayer]?.referenced || 0
        }
      },
      trainer_rankings: {
        highest_level: {
          trainer_name: highestLevelTrainer?.name || '',
          player_name: highestLevelTrainer?.player_user_id || '',
          level: highestLevel
        },
        most_monsters: {
          trainer_name: mostMonstersTrainer?.name || '',
          player_name: mostMonstersTrainer?.player_user_id || '',
          monster_count: mostMonstersCount
        },
        most_referenced: {
          trainer_name: mostReferencedTrainer?.name || '',
          player_name: mostReferencedTrainer?.player_user_id || '',
          reference_percentage: Math.round(highestTrainerReferencePercentage * 10) / 10,
          total_monsters: trainerReferencePercentages[mostReferencedTrainer?.id]?.total || 0,
          referenced_monsters: trainerReferencePercentages[mostReferencedTrainer?.id]?.referenced || 0
        },
        least_referenced: {
          trainer_name: leastReferencedTrainer?.name || '',
          player_name: leastReferencedTrainer?.player_user_id || '',
          reference_percentage: Math.round(lowestTrainerReferencePercentage * 10) / 10,
          total_monsters: trainerReferencePercentages[leastReferencedTrainer?.id]?.total || 0,
          referenced_monsters: trainerReferencePercentages[leastReferencedTrainer?.id]?.referenced || 0
        }
      },
      type_distribution: {
        by_player: typeDistributionByPlayer,
        by_trainer: typeDistributionByTrainer,
        most_of_type: Object.fromEntries(
          Object.entries(typeLeaders).map(([type, data]) => [
            type,
            {
              trainer_name: trainers.find(t => t.id === data.trainer_id)?.name || '',
              player_name: data.player_id || '',
              count: data.count
            }
          ])
        )
      },
      attribute_distribution: {
        by_player: attributeDistributionByPlayer,
        by_trainer: attributeDistributionByTrainer,
        most_of_attribute: Object.fromEntries(
          Object.entries(attributeLeaders).map(([attribute, data]) => [
            attribute,
            {
              trainer_name: trainers.find(t => t.id === data.trainer_id)?.name || '',
              player_name: data.player_id || '',
              count: data.count
            }
          ])
        )
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting trainer comparison statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get monster statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonsterStats = async (req, res) => {
  try {
    const { type = 'all', sort = 'level', order = 'desc' } = req.query;

    // Get all monsters
    let query = 'SELECT * FROM monsters';
    const params = [];

    // Filter by type if specified
    if (type !== 'all') {
      query += ' WHERE type1 = $1 OR type2 = $2 OR type3 = $3 OR type4 = $4 OR type5 = $5';
      params.push(type, type, type, type, type);
    }

    const monsters = await db.asyncAll(query, params);

    // Calculate monster statistics
    const stats = {
      overview: {
        total_monsters: monsters.length,
        unique_species: new Set(monsters.map(m => m.species1)).size,
        average_level: Math.round(monsters.reduce((sum, m) => sum + (m.level || 0), 0) / monsters.length) || 0,
        highest_level: Math.max(...monsters.map(m => m.level || 0), 0),
        type_distribution: calculateTypeDistribution(monsters)
      },
      top_monsters: getTopMonsters(monsters),
      monsters: getMonstersList(monsters, sort, order)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting monster statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get trainer statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrainerStats = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { timeframe = 'all_time' } = req.query;

    // Get trainer
    const trainer = await db.asyncGet('SELECT * FROM trainers WHERE id = $1', [trainerId]);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Get all monsters for this trainer
    const monsters = await db.asyncAll('SELECT * FROM monsters WHERE trainer_id = $1', [trainerId]);

    // Calculate trainer statistics
    const stats = {
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level || 1,
        experience: trainer.experience || 0,
        next_level_exp: calculateNextLevelExp(trainer.level || 1),
        coins: trainer.currency_amount || 0,
        join_date: trainer.created_at || new Date().toISOString(),
        avatar_url: trainer.main_ref || '/images/default_trainer.png'
      },
      monsters: {
        total: monsters.length,
        unique_species: new Set(monsters.map(m => m.species1)).size,
        highest_level: Math.max(...monsters.map(m => m.level || 0), 0),
        types: calculateTypeDistribution(monsters)
      },
      activities: getTrainerActivities(trainer, timeframe),
      activity_chart: getActivityChart(timeframe)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(`Error getting trainer statistics for ID ${req.params.trainerId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Calculate type distribution from monsters
 * @param {Array} monsters - Array of monster objects
 * @returns {Object} Type distribution object
 */
const calculateTypeDistribution = (monsters) => {
  const typeCount = {};

  monsters.forEach(monster => {
    // Count each type
    ['type1', 'type2', 'type3', 'type4', 'type5'].forEach(typeField => {
      if (monster[typeField]) {
        const type = monster[typeField];
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    });
  });

  return typeCount;
};

/**
 * Get top monsters by level
 * @param {Array} monsters - Array of monster objects
 * @returns {Array} Top monsters
 */
const getTopMonsters = (monsters) => {
  // Sort monsters by level (descending)
  const sortedMonsters = [...monsters].sort((a, b) => (b.level || 0) - (a.level || 0));

  // Take top 5 monsters
  return sortedMonsters.slice(0, 5).map(monster => ({
    id: monster.id,
    name: monster.name || 'Unnamed',
    image_path: monster.img_link || '/images/default_monster.png',
    level: monster.level || 1,
    types: [
      monster.type1,
      monster.type2,
      monster.type3,
      monster.type4,
      monster.type5
    ].filter(Boolean),
    stats: {
      hp: monster.hp_total || 0,
      attack: monster.atk_total || 0,
      defense: monster.def_total || 0,
      sp_attack: monster.spa_total || 0,
      sp_defense: monster.spd_total || 0,
      speed: monster.spe_total || 0
    },
    battles_won: monster.battles_won || 0,
    battles_total: monster.battles_total || 0
  }));
};

/**
 * Get monsters list for table
 * @param {Array} monsters - Array of monster objects
 * @param {string} sort - Sort field
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Monsters list
 */
const getMonstersList = (monsters, sort = 'level', order = 'desc') => {
  // Map monsters to simplified objects
  const monstersList = monsters.map(monster => ({
    id: monster.id,
    name: monster.name || 'Unnamed',
    image_path: monster.img_link || '/images/default_monster.png',
    level: monster.level || 1,
    types: [
      monster.type1,
      monster.type2,
      monster.type3,
      monster.type4,
      monster.type5
    ].filter(Boolean),
    battles_won: monster.battles_won || 0,
    battles_total: monster.battles_total || 0,
    win_rate: monster.battles_total > 0
      ? Math.round((monster.battles_won / monster.battles_total) * 100 * 10) / 10
      : 0
  }));

  // Sort monsters
  return monstersList.sort((a, b) => {
    let comparison = 0;

    switch (sort) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
      case 'win_rate':
        comparison = a.win_rate - b.win_rate;
        break;
      default:
        comparison = a.level - b.level;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Get trainer activities
 * @param {Object} trainer - Trainer object
 * @param {string} timeframe - Timeframe for activities
 * @returns {Object} Trainer activities
 */
const getTrainerActivities = (trainer, timeframe) => {
  // In a real implementation, this would query the database for activities
  // For now, return mock data
  return {
    battles_won: trainer.battles_won || 87,
    battles_lost: trainer.battles_lost || 23,
    missions_completed: trainer.missions_completed || 35,
    bosses_defeated: trainer.bosses_defeated || 5,
    events_participated: trainer.events_participated || 8,
    monsters_caught: trainer.monsters_caught || 52,
    monsters_evolved: trainer.monsters_evolved || 15,
    items_collected: trainer.items_collected || 124
  };
};

/**
 * Get activity chart data
 * @param {string} timeframe - Timeframe for chart
 * @returns {Object} Chart data
 */
const getActivityChart = (timeframe) => {
  // In a real implementation, this would query the database for activity data
  // For now, return mock data
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [45, 60, 30, 75, 50, 90, 65]
  };
};

/**
 * Calculate experience needed for next level
 * @param {number} level - Current level
 * @returns {number} Experience needed for next level
 */
const calculateNextLevelExp = (level) => {
  // Simple formula: 1000 * level
  return 1000 * level;
};

/**
 * Get achievement statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAchievementStats = async (req, res) => {
  try {
    const TrainerAchievement = require('../models/TrainerAchievement');
    
    // Get all trainers with user information
    const trainersQuery = `
      SELECT 
        t.*,
        u.display_name AS player_display_name,
        u.username AS player_username
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id
    `;
    const trainers = await db.asyncAll(trainersQuery);

    // Get all achievement claims
    const claimsQuery = `
      SELECT 
        trainer_id,
        achievement_id,
        claimed_at,
        t.name as trainer_name,
        t.title,
        t.faction,
        t.main_ref,
        u.display_name as player_display_name,
        u.username as player_username
      FROM trainer_achievement_claims c
      JOIN trainers t ON c.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      ORDER BY claimed_at DESC
    `;
    const allClaims = await db.asyncAll(claimsQuery);

    // Count achievements per trainer
    const achievementCounts = {};
    const trainerAchievements = {};
    
    allClaims.forEach(claim => {
      if (!achievementCounts[claim.trainer_id]) {
        achievementCounts[claim.trainer_id] = {
          count: 0,
          trainer_name: claim.trainer_name,
          title: claim.title,
          faction: claim.faction,
          main_ref: claim.main_ref,
          player_display_name: claim.player_display_name || claim.player_username || 'Unknown Player',
          achievements: []
        };
      }
      achievementCounts[claim.trainer_id].count++;
      achievementCounts[claim.trainer_id].achievements.push(claim.achievement_id);
      
      if (!trainerAchievements[claim.trainer_id]) {
        trainerAchievements[claim.trainer_id] = [];
      }
      trainerAchievements[claim.trainer_id].push(claim.achievement_id);
    });

    // Get all possible achievement IDs and categorize them
    const allAchievementIds = TrainerAchievement.getAllAchievementIds();
    const achievementCategories = {
      type: [],
      attribute: [],
      level100: [],
      trainer_level: [],
      special: []
    };

    // Categorize achievements
    Object.entries(TrainerAchievement.achievements.TYPE_ACHIEVEMENTS).forEach(([type, achievements]) => {
      achievements.forEach(achievement => {
        achievementCategories.type.push({ ...achievement, subtype: type });
      });
    });

    Object.entries(TrainerAchievement.achievements.ATTRIBUTE_ACHIEVEMENTS).forEach(([attribute, achievements]) => {
      achievements.forEach(achievement => {
        achievementCategories.attribute.push({ ...achievement, subtype: attribute });
      });
    });

    TrainerAchievement.achievements.LEVEL_100_ACHIEVEMENTS.forEach(achievement => {
      achievementCategories.level100.push(achievement);
    });

    TrainerAchievement.achievements.TRAINER_LEVEL_ACHIEVEMENTS.forEach(achievement => {
      achievementCategories.trainer_level.push(achievement);
    });

    TrainerAchievement.achievements.SPECIAL_ACHIEVEMENTS.forEach(achievement => {
      achievementCategories.special.push(achievement);
    });

    // Count achievements by category per trainer
    const categoryStats = {};
    allClaims.forEach(claim => {
      if (!categoryStats[claim.trainer_id]) {
        categoryStats[claim.trainer_id] = {
          trainer_name: claim.trainer_name,
          title: claim.title,
          faction: claim.faction,
          main_ref: claim.main_ref,
          player_display_name: claim.player_display_name || claim.player_username || 'Unknown Player',
          type: 0,
          attribute: 0,
          level100: 0,
          trainer_level: 0,
          special: 0,
          type_subtypes: {},
          attribute_subtypes: {}
        };
      }

      // Find which category this achievement belongs to
      const achievementId = claim.achievement_id;
      
      // Check type achievements
      Object.entries(TrainerAchievement.achievements.TYPE_ACHIEVEMENTS).forEach(([type, achievements]) => {
        if (achievements.find(a => a.id === achievementId)) {
          categoryStats[claim.trainer_id].type++;
          categoryStats[claim.trainer_id].type_subtypes[type] = (categoryStats[claim.trainer_id].type_subtypes[type] || 0) + 1;
        }
      });

      // Check attribute achievements
      Object.entries(TrainerAchievement.achievements.ATTRIBUTE_ACHIEVEMENTS).forEach(([attribute, achievements]) => {
        if (achievements.find(a => a.id === achievementId)) {
          categoryStats[claim.trainer_id].attribute++;
          categoryStats[claim.trainer_id].attribute_subtypes[attribute] = (categoryStats[claim.trainer_id].attribute_subtypes[attribute] || 0) + 1;
        }
      });

      // Check other categories
      if (TrainerAchievement.achievements.LEVEL_100_ACHIEVEMENTS.find(a => a.id === achievementId)) {
        categoryStats[claim.trainer_id].level100++;
      }
      if (TrainerAchievement.achievements.TRAINER_LEVEL_ACHIEVEMENTS.find(a => a.id === achievementId)) {
        categoryStats[claim.trainer_id].trainer_level++;
      }
      if (TrainerAchievement.achievements.SPECIAL_ACHIEVEMENTS.find(a => a.id === achievementId)) {
        categoryStats[claim.trainer_id].special++;
      }
    });

    // Sort trainers by total achievements (most to least)
    const sortedByTotal = Object.entries(achievementCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([trainerId, data]) => ({ trainer_id: parseInt(trainerId), ...data }));

    // Sort trainers by least achievements (including those with 0)
    const trainersWithZero = trainers.map(trainer => {
      const achievements = achievementCounts[trainer.id];
      return {
        trainer_id: trainer.id,
        count: achievements ? achievements.count : 0,
        trainer_name: trainer.name,
        title: trainer.title,
        faction: trainer.faction,
        main_ref: trainer.main_ref,
        player_display_name: trainer.player_display_name || trainer.player_username || 'Unknown Player',
        achievements: achievements ? achievements.achievements : []
      };
    }).sort((a, b) => a.count - b.count);

    // Get top performers by category
    const topByCategory = {};
    Object.keys(achievementCategories).forEach(category => {
      topByCategory[category] = Object.entries(categoryStats)
        .filter(([, data]) => data[category] > 0)
        .sort(([,a], [,b]) => b[category] - a[category])
        .slice(0, 5)
        .map(([trainerId, data]) => ({
          trainer_id: parseInt(trainerId),
          count: data[category],
          trainer_name: data.trainer_name,
          title: data.title,
          faction: data.faction,
          main_ref: data.main_ref,
          player_display_name: data.player_display_name
        }));
    });

    // Get top performers by subtypes
    const topBySubtype = {
      types: {},
      attributes: {}
    };

    // Type subtypes
    Object.keys(TrainerAchievement.achievements.TYPE_ACHIEVEMENTS).forEach(type => {
      topBySubtype.types[type] = Object.entries(categoryStats)
        .filter(([, data]) => data.type_subtypes[type] > 0)
        .sort(([,a], [,b]) => (b.type_subtypes[type] || 0) - (a.type_subtypes[type] || 0))
        .slice(0, 3)
        .map(([trainerId, data]) => ({
          trainer_id: parseInt(trainerId),
          count: data.type_subtypes[type],
          trainer_name: data.trainer_name,
          title: data.title,
          faction: data.faction,
          main_ref: data.main_ref,
          player_display_name: data.player_display_name
        }));
    });

    // Attribute subtypes
    Object.keys(TrainerAchievement.achievements.ATTRIBUTE_ACHIEVEMENTS).forEach(attribute => {
      topBySubtype.attributes[attribute] = Object.entries(categoryStats)
        .filter(([, data]) => data.attribute_subtypes[attribute] > 0)
        .sort(([,a], [,b]) => (b.attribute_subtypes[attribute] || 0) - (a.attribute_subtypes[attribute] || 0))
        .slice(0, 3)
        .map(([trainerId, data]) => ({
          trainer_id: parseInt(trainerId),
          count: data.attribute_subtypes[attribute],
          trainer_name: data.trainer_name,
          title: data.title,
          faction: data.faction,
          main_ref: data.main_ref,
          player_display_name: data.player_display_name
        }));
    });

    const stats = {
      overview: {
        total_achievements_available: allAchievementIds.length,
        total_achievements_claimed: allClaims.length,
        trainers_with_achievements: Object.keys(achievementCounts).length,
        total_trainers: trainers.length,
        average_achievements_per_trainer: trainers.length > 0 ? Math.round((allClaims.length / trainers.length) * 10) / 10 : 0
      },
      most_achievements: sortedByTotal.slice(0, 10),
      least_achievements: trainersWithZero.slice(0, 10),
      top_by_category: topByCategory,
      top_by_subtype: topBySubtype,
      recent_claims: allClaims.slice(0, 20),
      category_breakdown: {
        type: achievementCategories.type.length,
        attribute: achievementCategories.attribute.length,
        level100: achievementCategories.level100.length,
        trainer_level: achievementCategories.trainer_level.length,
        special: achievementCategories.special.length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting achievement statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get leaderboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLeaderboardStats = async (req, res) => {
  try {

    // Get all monsters and trainers with user information for production
    const monsters = await db.asyncAll('SELECT * FROM monsters');
    const trainersQuery = `
      SELECT 
        t.*,
        u.display_name AS player_display_name,
        u.username AS player_username
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id
    `;
    const trainers = await db.asyncAll(trainersQuery);

    // Group monsters by trainer
    const monstersByTrainer = {};
    monsters.forEach(monster => {
      if (!monstersByTrainer[monster.trainer_id]) {
        monstersByTrainer[monster.trainer_id] = [];
      }
      monstersByTrainer[monster.trainer_id].push(monster);
    });

    // Calculate stats for each trainer
    const trainerStats = trainers.map(trainer => {
      const trainerMonsters = monstersByTrainer[trainer.id] || [];
      const totalMonsters = trainerMonsters.length;
      const referencedMonsters = trainerMonsters.filter(m => m.img_link && m.img_link !== '').length;
      const refPercent = totalMonsters > 0 ? Math.round((referencedMonsters / totalMonsters) * 100) : 0;
      const totalLevels = trainerMonsters.reduce((sum, m) => sum + (m.level || 0), 0);
      const level100Count = trainerMonsters.filter(m => (m.level || 0) === 100).length;

      return {
        id: trainer.id,
        name: trainer.name || 'Unknown Trainer',
        title: trainer.title || null,
        faction: trainer.faction || null,
        main_ref: trainer.main_ref || null,
        level: trainer.level || 1,
        player_display_name: trainer.player_display_name || trainer.player_username || 'Unknown Player',
        monster_count: totalMonsters,
        monster_ref_percent: refPercent,
        monster_ref_count: referencedMonsters,
        currency_amount: trainer.currency_amount || 0,
        total_earned_currency: trainer.total_earned_currency || trainer.currency_amount || 0,
        total_monster_levels: totalLevels,
        level_100_count: level100Count
      };
    });

    // Get real type specialists data
    const typeSpecialists = {};
    const typeQuery = `
      SELECT 
        t.name as trainer_name,
        t.title,
        t.faction,
        t.main_ref,
        u.display_name as player_display_name,
        u.username as player_username,
        m.type1 as type,
        COUNT(*) as count
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      WHERE m.type1 IS NOT NULL AND m.type1 != ''
      GROUP BY t.id, t.name, t.title, t.faction, t.main_ref, u.display_name, u.username, m.type1
      ORDER BY count DESC
    `;
    
    const typeResults = await db.asyncAll(typeQuery);
    
    // Group by type and find the trainer with most of each type
    typeResults.forEach(result => {
      if (!typeSpecialists[result.type] || typeSpecialists[result.type].count < result.count) {
        typeSpecialists[result.type] = {
          trainer_name: result.trainer_name,
          title: result.title,
          faction: result.faction,
          main_ref: result.main_ref,
          player_display_name: result.player_display_name || result.player_username || 'Unknown Player',
          count: result.count
        };
      }
    });

    // Get real attribute specialists data
    const attributeSpecialists = {};
    const attributeQuery = `
      SELECT 
        t.name as trainer_name,
        t.title,
        t.faction,
        t.main_ref,
        u.display_name as player_display_name,
        u.username as player_username,
        m.attribute,
        COUNT(*) as count
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      WHERE m.attribute IN ('Free', 'Data', 'Vaccine', 'Variable', 'Virus')
      GROUP BY t.id, t.name, t.title, t.faction, t.main_ref, u.display_name, u.username, m.attribute
      ORDER BY count DESC
    `;
    
    const attributeResults = await db.asyncAll(attributeQuery);
    
    // Group by attribute and find the trainer with most of each attribute
    attributeResults.forEach(result => {
      if (!attributeSpecialists[result.attribute] || attributeSpecialists[result.attribute].count < result.count) {
        attributeSpecialists[result.attribute] = {
          trainer_name: result.trainer_name,
          title: result.title,
          faction: result.faction,
          main_ref: result.main_ref,
          player_display_name: result.player_display_name || result.player_username || 'Unknown Player',
          count: result.count
        };
      }
    });

    // Get real species specialists data
    const speciesQuery = `
      SELECT 
        t.name as trainer_name,
        t.title,
        t.faction,
        t.main_ref,
        u.display_name as player_display_name,
        u.username as player_username,
        m.species1 as species,
        COUNT(*) as count,
        STRING_AGG(m.id::text || '|' || m.name || '|' || COALESCE(m.img_link, ''), ',') as monster_data
      FROM monsters m
      JOIN trainers t ON m.trainer_id = t.id
      LEFT JOIN users u ON t.player_user_id = u.discord_id
      WHERE m.species1 IS NOT NULL AND m.species1 != ''
      GROUP BY t.id, t.name, t.title, t.faction, t.main_ref, u.display_name, u.username, m.species1
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const speciesResults = await db.asyncAll(speciesQuery);
    
    const speciesSpecialists = speciesResults.map(result => {
      // Parse monster data
      const monsterDataParts = result.monster_data ? result.monster_data.split(',') : [];
      const sampleMonsters = [];
      
      for (let i = 0; i < Math.min(monsterDataParts.length, 3); i++) {
        const parts = monsterDataParts[i].split('|');
        if (parts.length >= 3) {
          sampleMonsters.push({
            id: parseInt(parts[0]) || 0,
            name: parts[1] || 'Unnamed Monster',
            img_link: parts[2] || null
          });
        }
      }
      
      return {
        trainer_name: result.trainer_name,
        title: result.title,
        faction: result.faction,
        main_ref: result.main_ref,
        player_display_name: result.player_display_name || result.player_username || 'Unknown Player',
        species: result.species,
        count: result.count,
        sample_monsters: sampleMonsters
      };
    });

    // Create real leaderboard data
    const realLeaderboardStats = {
      top_trainers_by_level: trainerStats
        .sort((a, b) => b.level - a.level)
        .slice(0, 5),
      
      top_trainers_by_monster_count: trainerStats
        .sort((a, b) => b.monster_count - a.monster_count)
        .slice(0, 5),
      
      top_trainers_by_ref_percent: trainerStats
        .filter(t => t.monster_count > 0)
        .sort((a, b) => b.monster_ref_percent - a.monster_ref_percent)
        .slice(0, 5),
      
      bottom_trainers_by_ref_percent: trainerStats
        .filter(t => t.monster_count > 0)
        .sort((a, b) => a.monster_ref_percent - b.monster_ref_percent)
        .slice(0, 5),
      
      top_trainers_by_currency: trainerStats
        .sort((a, b) => b.currency_amount - a.currency_amount)
        .slice(0, 5),
      
      top_trainers_by_total_currency: trainerStats
        .sort((a, b) => b.total_earned_currency - a.total_earned_currency)
        .slice(0, 5),
      
      top_trainers_by_total_level: trainerStats
        .sort((a, b) => b.total_monster_levels - a.total_monster_levels)
        .slice(0, 5),
      
      top_trainers_by_level_100_count: trainerStats
        .sort((a, b) => b.level_100_count - a.level_100_count)
        .slice(0, 5),
      
      type_specialists: typeSpecialists,
      attribute_specialists: attributeSpecialists,
      species_specialists: speciesSpecialists
    };

    return res.json({
      success: true,
      data: realLeaderboardStats
    });

  } catch (error) {
    console.error('Error getting leaderboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getOverallStats,
  getMonsterStats,
  getTrainerStats,
  getTrainerComparisonStats,
  getLeaderboardStats,
  getAchievementStats
};
