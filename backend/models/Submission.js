const db = require('../config/db');
const Trainer = require('./Trainer');
const Monster = require('./Monster');
const GardenPoint = require('./GardenPoint');
const MissionProgress = require('./MissionProgress');
const BossDamage = require('./BossDamage');
const ItemRoller = require('./ItemRoller');

// Detect database type
const isPostgreSQL = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

/**
 * Submission model
 */
class Submission {
  /**
   * Create a new submission
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Created submission
   */
  static async create(submissionData) {
    try {
      const {
        userId,
        trainerId,
        title,
        description,
        contentType,
        content,
        submissionType,
        isBook = 0,
        parentId = null,
        chapterNumber = null,
        status = 'pending'
      } = submissionData;

      console.log('Submitting to database with data:', {
        userId,
        trainerId,
        title,
        description,
        contentType,
        content: content ? `${content.substring(0, 50)}...` : 'null',
        submissionType,
        isBook,
        parentId,
        chapterNumber,
        status
      });

      let query, result, submissionId;
      const params = [
        userId,
        trainerId,
        title,
        description,
        contentType,
        content,
        submissionType,
        isBook,
        parentId,
        chapterNumber,
        status
      ];

      if (isPostgreSQL) {
        // PostgreSQL: Use $1, $2, etc. and RETURNING clause
        query = `
          INSERT INTO submissions (
            user_id, trainer_id, title, description, content_type,
            content, submission_type, is_book, parent_id, chapter_number, status, submission_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        result = await db.asyncRun(query, params);
        submissionId = result.rows[0].id;
      } else {
        // SQLite: Use ? placeholders and lastID
        query = `
          INSERT INTO submissions (
            user_id, trainer_id, title, description, content_type,
            content, submission_type, is_book, parent_id, chapter_number, status, submission_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        result = await db.asyncRun(query, params);
        submissionId = result.lastID;
      }

      console.log('Database insert result:', result);

      if (!submissionId) {
        console.error('No ID returned from database insert. Result:', result);
        throw new Error('Failed to get submission ID from database');
      }

      console.log('Created submission with ID:', submissionId);

      return {
        id: submissionId,
        ...submissionData
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for an art submission
   * @param {Object} artData - Art submission data
   * @param {number} userId - User ID for gift detection
   * @returns {Promise<Object>} Calculated rewards
   */
  static async calculateArtRewards(artData, userId = null) {
    try {
      const {
        quality,
        backgroundType,
        backgrounds = [],
        uniquelyDifficult,
        trainers = [],
        monsters = [],
        npcs = [],
        isGift = false,
        useStaticRewards = false
      } = artData;

      // Log the useStaticRewards value
      console.log(`Art rewards calculation - useStaticRewards input: ${useStaticRewards} (type: ${typeof useStaticRewards})`);

      // Force useStaticRewards to false unless explicitly set to true
      const shouldUseStaticRewards = useStaticRewards === true;
      console.log(`Art rewards calculation - using static rewards: ${shouldUseStaticRewards}`);


      // Debug logging
      console.log('Art rewards calculation:');
      console.log(`- Quality: ${quality}`);
      console.log(`- Background Type: ${backgroundType}`);
      console.log(`- Backgrounds: ${JSON.stringify(backgrounds)}`);
      console.log(`- Uniquely Difficult: ${uniquelyDifficult}`);
      console.log(`- Trainers: ${JSON.stringify(trainers)}`);
      console.log(`- Monsters: ${JSON.stringify(monsters)}`);
      console.log(`- Is Gift: ${isGift}`);
      console.log(`- Use Static Rewards: ${useStaticRewards}`);

      // Base levels based on quality
      let baseLevels = 0;
      switch (quality) {
        case 'sketch':
          baseLevels = 2;
          break;
        case 'sketchSet':
          baseLevels = 3;
          break;
        case 'lineArt':
          baseLevels = 4;
          break;
        case 'rendered':
          baseLevels = 5;
          break;
        case 'polished':
          baseLevels = 7;
          break;
        default:
          baseLevels = 2;
      }

      // Background bonus - handle multiple backgrounds or fallback to single backgroundType
      let backgroundBonus = 0;

      if (backgrounds && backgrounds.length > 0) {
        // Process each background and take the highest value if multiple
        for (const bg of backgrounds) {
          let bgValue = 0;
          switch (bg.type) {
            case 'simple':
              bgValue = 3;
              break;
            case 'complex':
              bgValue = 6;
              break;
            default:
              bgValue = 0;
          }
          // Take the highest background value
          backgroundBonus = Math.max(backgroundBonus, bgValue);
        }
      } else if (backgroundType) {
        // Fallback to legacy single backgroundType
        switch (backgroundType) {
          case 'simple':
            backgroundBonus = 3;
            break;
          case 'complex':
            backgroundBonus = 6;
            break;
          default:
            backgroundBonus = 0;
        }
      }

      // Uniquely difficult bonus
      const difficultyBonus = uniquelyDifficult ? 3 : 0;

      // Calculate overall image levels
      const overallLevels = baseLevels + backgroundBonus + difficultyBonus;

      // Calculate trainer and monster rewards
      const trainerRewards = [];
      const monsterRewards = [];
      let totalGiftLevels = 0;

      // Ensure trainers is an array
      if (!Array.isArray(trainers)) {
        console.error('trainers is not an array:', trainers);
        trainers = [];
      }

      // Process trainers
      for (const trainer of trainers) {
        if (!trainer || typeof trainer !== 'object') {
          console.error('Invalid trainer object:', trainer);
          continue;
        }

        const { trainerId, appearances = [], customLevels = 0, isOwned = true, isGift = false } = trainer;

        if (!trainerId) {
          console.error('Trainer missing trainerId:', trainer);
          continue;
        }

        let trainerLevels = 0;
        let appearancesData = [];

        if (shouldUseStaticRewards) {
          // Use static rewards: 6 levels
          trainerLevels = 6;

          // If custom levels are specified, use them
          if (customLevels > 0) {
            trainerLevels = customLevels;
          }

          // Still process appearances for display purposes
          for (const appearance of appearances) {
            let appearanceBonus = 0;
            switch (appearance.type) {
              case 'bust':
                appearanceBonus = 1;
                break;
              case 'halfBody':
                appearanceBonus = 2;
                break;
              case 'fullBody':
                appearanceBonus = 3;
                break;
            }

            appearancesData.push({
              type: appearance.type,
              bonus: appearanceBonus,
              count: appearance.count || 1
            });
          }
        } else {
          // Use dynamic reward calculation
          trainerLevels = overallLevels;

          // Add levels for each appearance
          for (const appearance of appearances) {
            let appearanceBonus = 0;
            switch (appearance.type) {
              case 'bust':
                appearanceBonus = 1;
                break;
              case 'halfBody':
                appearanceBonus = 2;
                break;
              case 'fullBody':
                appearanceBonus = 3;
                break;
            }

            appearancesData.push({
              type: appearance.type,
              bonus: appearanceBonus,
              count: appearance.count || 1
            });

            // Multiply by count if multiple appearances of same type
            trainerLevels += appearanceBonus * (appearance.count || 1);
          }

          // Add trainer bonus
          trainerLevels += 3;

          // If custom levels are specified, use them
          if (customLevels > 0) {
            trainerLevels = customLevels;
          }
        }

        // Calculate coins (50 per level)
        const trainerCoins = shouldUseStaticRewards && !customLevels ? 200 : trainerLevels * 50; // Static rewards: 200 coins

        // No level cap for trainers
        let cappedLevels = 0;
        // We're removing the level 100 cap for trainers
        // The cappedLevels variable is kept at 0 for trainers

        // Track gift levels only for non-owned trainers
        if (!isOwned) {
          totalGiftLevels += trainerLevels;
        }

        trainerRewards.push({
          trainerId,
          levels: trainerLevels,
          coins: trainerCoins,
          cappedLevels,
          appearances: appearancesData,
          isGift,
          isOwned
        });
      }

      // Ensure monsters is an array
      if (!Array.isArray(monsters)) {
        console.error('monsters is not an array:', monsters);
        monsters = [];
      }

      // Process monsters
      for (const monster of monsters) {
        if (!monster || typeof monster !== 'object') {
          console.error('Invalid monster object:', monster);
          continue;
        }

        const { monsterId, appearances = [], complexityBonus = 0, customLevels = 0, isGift = false, trainerId: monsterTrainerId } = monster;

        // Check if the monster's trainer is owned by the user
        let isTrainerOwned = true;
        if (monsterTrainerId) {
          try {
            // Check if the monster's trainer is owned by the user (using Discord ID)
            const trainerData = await Trainer.getById(monsterTrainerId);
            if (trainerData) {
              isTrainerOwned = trainerData.player_user_id === userId;
              console.log(`Gift detection for art monster ${monsterId}: trainer ${monsterTrainerId} (${trainerData.name}) player_user_id=${trainerData.player_user_id}, current userId=${userId}, isOwned=${isTrainerOwned}`);
            } else {
              console.log(`Gift detection: trainer ${monsterTrainerId} not found`);
            }
          } catch (err) {
            console.error(`Error checking trainer ownership for ID ${monsterTrainerId}:`, err);
            // Default to owned if we can't determine ownership
            isTrainerOwned = true;
          }
        }
        if (monsterTrainerId) {
          // Find the trainer in the trainers array to check ownership
          const monsterTrainer = trainers.find(t => t.trainerId === monsterTrainerId);
          if (monsterTrainer) {
            isTrainerOwned = monsterTrainer.isOwned !== false; // Default to true if not specified
          }
        }

        if (!monsterId) {
          console.error('Monster missing monsterId:', monster);
          continue;
        }

        let monsterLevels = 0;
        let appearancesData = [];

        // Parse complexity bonus value once for use throughout this monster's processing
        const complexityValue = parseInt(complexityBonus) || 0;

        if (shouldUseStaticRewards) {
          // Use static rewards: 6 levels
          monsterLevels = 6;

          // If custom levels are specified, use them
          if (customLevels > 0) {
            monsterLevels = customLevels;
          }

          // Still process appearances for display purposes
          for (const appearance of appearances) {
            let appearanceBonus = 0;
            switch (appearance.type) {
              case 'bust':
                appearanceBonus = 1;
                break;
              case 'halfBody':
                appearanceBonus = 2;
                break;
              case 'fullBody':
                appearanceBonus = 3;
                break;
            }

            appearancesData.push({
              type: appearance.type,
              bonus: appearanceBonus,
              count: appearance.count || 1
            });
          }

          // Complexity bonus is already parsed at the beginning of monster processing
        } else {
          // Use dynamic reward calculation
          monsterLevels = overallLevels;

          // Add levels for each appearance
          for (const appearance of appearances) {
            let appearanceBonus = 0;
            switch (appearance.type) {
              case 'bust':
                appearanceBonus = 1;
                break;
              case 'halfBody':
                appearanceBonus = 2;
                break;
              case 'fullBody':
                appearanceBonus = 3;
                break;
            }

            appearancesData.push({
              type: appearance.type,
              bonus: appearanceBonus,
              count: appearance.count || 1
            });

            // Multiply by count if multiple appearances of same type
            monsterLevels += appearanceBonus * (appearance.count || 1);
          }

          // Add complexity bonus
          monsterLevels += complexityValue;

          // If custom levels are specified, use them
          if (customLevels > 0) {
            monsterLevels = customLevels;
          }
        }

        // Calculate coins (50 per level)
        const monsterCoins = shouldUseStaticRewards && !customLevels ? 200 : monsterLevels * 50; // Static rewards: 200 coins

        // Check if monster would exceed level 100
        let cappedLevels = 0;
        try {
          // Skip level cap check if monsterId is not a valid database ID (temporary UI ID)
          if (monsterId && monsterId.toString().length < 10) {
            const monsterData = await Monster.getById(monsterId);
              if (monsterData) {
                if (!isGift) {
                  // Only apply level cap for non-gift rewards
                  if (monsterData.level >= 100) {
                    // Monster is already at max level, all levels are capped
                    cappedLevels = monsterLevels;
                    monsterLevels = 0;
                  } else if (monsterData.level + monsterLevels > 100) {
                    // Monster would exceed level 100, cap at 100
                    cappedLevels = monsterData.level + monsterLevels - 100;
                    monsterLevels = 100 - monsterData.level;
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error checking monster level for ID ${monsterId}:`, err);
          }

        // Track gift levels only for monsters with non-owned trainers
        if (!isTrainerOwned) {
          // For gift monsters, include both applied levels AND capped levels
          const totalGiftLevelsForMonster = monsterLevels + cappedLevels;
          totalGiftLevels += totalGiftLevelsForMonster;
          console.log(`Adding ${totalGiftLevelsForMonster} gift levels for art monster ${monsterId} (${monsterLevels} applied + ${cappedLevels} capped, trainer not owned). Total gift levels: ${totalGiftLevels}`);
        } else {
          console.log(`Art monster ${monsterId} trainer is owned, no gift levels added`);
        }

        // Add the monster reward
        monsterRewards.push({
          monsterId,
          name: monster.name,
          trainerId: monster.trainerId,
          levels: monsterLevels,
          coins: monsterCoins,
          cappedLevels,
          complexityBonus: complexityValue,
          appearances: appearancesData,
          isGift,
          isTrainerOwned
        });
      }

      // Process NPCs - all NPC levels become gift levels
      if (npcs && Array.isArray(npcs)) {
        for (const npc of npcs) {
          const npcLevels = npc.levels || 0;
          totalGiftLevels += npcLevels;
          console.log(`Adding ${npcLevels} gift levels for NPC ${npc.name || 'Unnamed'}. Total gift levels: ${totalGiftLevels}`);
        }
      }

      // Calculate garden points (1-3)
      const gardenPoints = Math.floor(Math.random() * 3) + 1;

      // Calculate mission progress (1-3)
      const missionProgress = Math.floor(Math.random() * 3) + 1;

      // Calculate boss damage (1-5)
      const bossDamage = Math.floor(Math.random() * 5) + 1;

      // Calculate gift item rewards (1 item per 5 gift levels)
      const giftItems = [];

      // Process gift rewards per participant
      if (isGift) {
        // Process trainers for gift rewards
        for (const trainer of trainerRewards) {
          if (trainer.isGift && trainer.levels > 0) {
            const itemCount = Math.ceil(trainer.levels / 5);

            // Generate random items for this trainer
            for (let i = 0; i < itemCount; i++) {
              try {
                // Roll a random item from the item pool
                const itemCategories = ['items', 'balls', 'berries', 'pastries', 'antique', 'helditems'];
                const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)];

                // Use ItemRoller to get a random item (if available)
                if (ItemRoller) {
                  const rolledItem = await ItemRoller.rollOne({ category: randomCategory });
                  if (rolledItem) {
                    giftItems.push({
                      category: randomCategory,
                      name: rolledItem.name,
                      quantity: 1,
                      recipientType: 'trainer',
                      recipientId: trainer.trainerId
                    });
                  }
                } else {
                  // Fallback if ItemRoller is not available
                  giftItems.push({
                    category: randomCategory,
                    name: `Random ${randomCategory.slice(0, -1)}`,
                    quantity: 1,
                    recipientType: 'trainer',
                    recipientId: trainer.trainerId
                  });
                }
              } catch (err) {
                console.error('Error generating gift item:', err);
              }
            }
          }
        }

        // Process monsters for gift rewards
        for (const monster of monsterRewards) {
          if (monster.isGift && monster.levels > 0) {
            const itemCount = Math.ceil(monster.levels / 5);

            // Generate random items for this monster
            for (let i = 0; i < itemCount; i++) {
              try {
                // Roll a random item from the item pool
                const itemCategories = ['items', 'balls', 'berries', 'pastries', 'antique', 'helditems'];
                const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)];

                // Use ItemRoller to get a random item (if available)
                if (ItemRoller) {
                  const rolledItem = await ItemRoller.rollOne({ category: randomCategory });
                  if (rolledItem) {
                    giftItems.push({
                      category: randomCategory,
                      name: rolledItem.name,
                      quantity: 1,
                      recipientType: 'monster',
                      recipientId: monster.monsterId
                    });
                  }
                } else {
                  // Fallback if ItemRoller is not available
                  giftItems.push({
                    category: randomCategory,
                    name: `Random ${randomCategory.slice(0, -1)}`,
                    quantity: 1,
                    recipientType: 'monster',
                    recipientId: monster.monsterId
                  });
                }
              } catch (err) {
                console.error('Error generating gift item:', err);
              }
            }
          }
        }
      }

      // Log reward calculation summary
      console.log('Art submission reward calculation:');
      console.log(`- Overall levels: ${overallLevels}`);
      console.log(`- Trainers: ${trainerRewards.length}`);
      console.log(`- Monsters: ${monsterRewards.length}`);
      console.log(`- Is gift: ${isGift}`);
      console.log(`- Using static rewards: ${shouldUseStaticRewards}`);

      // Log trainer rewards
      trainerRewards.forEach(tr => {
        console.log(`Trainer ${tr.trainerId}: ${tr.levels} levels, ${tr.coins} coins, isGift: ${tr.isGift}`);
      });

      // Log monster rewards
      monsterRewards.forEach(mr => {
        console.log(`Monster ${mr.monsterId}: ${mr.levels} levels, ${mr.coins} coins, cappedLevels: ${mr.cappedLevels}, isGift: ${mr.isGift}`);
      });

      return {
        overallLevels,
        trainerRewards,
        monsterRewards,
        gardenPoints,
        missionProgress,
        bossDamage,
        isGift,
        totalGiftLevels,
        giftItems
      };
    } catch (error) {
      console.error('Error calculating art rewards:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for a writing submission
   * @param {Object} writingData - Writing submission data
   * @param {number} userId - User ID for gift detection
   * @returns {Promise<Object>} Calculated rewards
   */
  static async calculateWritingRewards(writingData, userId = null) {
    try {
      const {
        wordCount,
        trainers = [],
        monsters = [],
        npcs = [],
        trainerId = null, // Legacy support
        monsterId = null, // Legacy support
        isGift = false
      } = writingData;

      // Calculate total levels (50 words = 1 level)
      const totalLevels = Math.floor(wordCount / 50);

      // Calculate total coins (1 coin per word)
      const totalCoins = wordCount;

      // Calculate garden points (1-3)
      const gardenPoints = Math.floor(Math.random() * 3) + 1;

      // Calculate mission progress (1-3)
      const missionProgress = Math.floor(Math.random() * 3) + 1;

      // Calculate boss damage (1-5)
      const bossDamage = Math.floor(Math.random() * 5) + 1;

      // Handle legacy format (single trainer/monster)
      let processedTrainers = Array.isArray(trainers) ? trainers : [];
      let processedMonsters = Array.isArray(monsters) ? monsters : [];

      if (trainerId && processedTrainers.length === 0) {
        processedTrainers = [{
          trainerId: trainerId,
          isOwned: true,
          isGift: isGift
        }];
      }

      if (monsterId && processedMonsters.length === 0) {
        processedMonsters = [{
          monsterId: monsterId,
          isGift: isGift
        }];
      }

      // Calculate total participants
      const totalParticipants = processedTrainers.length + processedMonsters.length;

      if (totalParticipants === 0) {
        throw new Error('No trainers or monsters specified for writing submission');
      }

      // Split levels and coins among participants
      const levelsPerParticipant = Math.floor(totalLevels / totalParticipants);
      const coinsPerParticipant = Math.floor(totalCoins / totalParticipants);

      // Handle remainder levels/coins
      const remainderLevels = totalLevels % totalParticipants;
      const remainderCoins = totalCoins % totalParticipants;

      // Process trainer rewards
      const trainerRewards = [];
      let totalGiftLevels = 0;

      for (let i = 0; i < processedTrainers.length; i++) {
        const trainer = processedTrainers[i];
        const { trainerId, isOwned = true, isGift = false } = trainer;

        // Calculate levels for this trainer (add remainder to first participants)
        let trainerLevels = levelsPerParticipant;
        if (i < remainderLevels) {
          trainerLevels += 1;
        }

        // Calculate coins for this trainer
        let trainerCoins = coinsPerParticipant;
        if (i < remainderCoins) {
          trainerCoins += 1;
        }

        // No level cap for trainers
        let cappedLevels = 0;

        // Track gift levels only for non-owned trainers
        if (!isOwned) {
          totalGiftLevels += trainerLevels;
        }

        // Get trainer name for display
        let trainerName = `Trainer #${trainerId}`;
        try {
          const trainerData = await Trainer.getById(trainerId);
          if (trainerData) {
            trainerName = trainerData.name;
          }
        } catch (err) {
          console.error(`Error getting trainer name for ID ${trainerId}:`, err);
        }

        trainerRewards.push({
          trainerId,
          trainerName,
          levels: trainerLevels,
          coins: trainerCoins,
          cappedLevels,
          isGift,
          isOwned
        });
      }

      // Process monster rewards
      const monsterRewards = [];

      for (let i = 0; i < processedMonsters.length; i++) {
        const monster = processedMonsters[i];
        const { monsterId, trainerId: monsterTrainerId, isGift = false } = monster;

        // Calculate levels for this monster (add remainder to first participants)
        let monsterLevels = levelsPerParticipant;
        const participantIndex = processedTrainers.length + i;
        if (participantIndex < remainderLevels) {
          monsterLevels += 1;
        }

        // Calculate coins for this monster (goes to monster's trainer)
        let monsterCoins = coinsPerParticipant;
        if (participantIndex < remainderCoins) {
          monsterCoins += 1;
        }

        // Check if monster would exceed level 100
        let cappedLevels = 0;
        try {
          // Skip level cap check if monsterId is not a valid database ID (temporary UI ID)
          if (monsterId && monsterId.toString().length < 10) {
            const monsterData = await Monster.getById(monsterId);
            if (monsterData) {
              if (!isGift) {
                // Only apply level cap for non-gift rewards
                if (monsterData.level >= 100) {
                  // Monster is already at max level, all levels are capped
                  cappedLevels = monsterLevels;
                  monsterLevels = 0;
                } else if (monsterData.level + monsterLevels > 100) {
                  // Monster would exceed level 100, cap at 100
                  cappedLevels = monsterData.level + monsterLevels - 100;
                  monsterLevels = 100 - monsterData.level;
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error checking monster level for ID ${monsterId}:`, err);
        }

        // Determine if this is a gift based on trainer ownership
        let isTrainerOwned = true;
        if (monsterTrainerId) {
          try {
            // Check if the monster's trainer is owned by the user (using Discord ID)
            const trainerData = await Trainer.getById(monsterTrainerId);
            if (trainerData) {
              isTrainerOwned = trainerData.player_user_id === userId;
              console.log(`Gift detection for monster ${monsterId}: trainer ${monsterTrainerId} (${trainerData.name}) player_user_id=${trainerData.player_user_id}, current userId=${userId}, isOwned=${isTrainerOwned}`);
            } else {
              console.log(`Gift detection: trainer ${monsterTrainerId} not found`);
            }
          } catch (err) {
            console.error(`Error checking trainer ownership for ID ${monsterTrainerId}:`, err);
            // Default to owned if we can't determine ownership
            isTrainerOwned = true;
          }
        }

        // Track gift levels only for monsters with non-owned trainers
        if (!isTrainerOwned) {
          // For gift monsters, include both applied levels AND capped levels
          const totalGiftLevelsForMonster = monsterLevels + cappedLevels;
          totalGiftLevels += totalGiftLevelsForMonster;
          console.log(`Adding ${totalGiftLevelsForMonster} gift levels for monster ${monsterId} (${monsterLevels} applied + ${cappedLevels} capped, trainer not owned). Total gift levels: ${totalGiftLevels}`);
        } else {
          console.log(`Monster ${monsterId} trainer is owned, no gift levels added`);
        }

        monsterRewards.push({
          monsterId,
          trainerId: monsterTrainerId,
          levels: monsterLevels,
          coins: monsterCoins,
          cappedLevels,
          isGift,
          isTrainerOwned
        });
      }

      // Process NPCs - all NPC levels become gift levels
      if (npcs && Array.isArray(npcs)) {
        for (const npc of npcs) {
          const npcLevels = npc.levels || 0;
          totalGiftLevels += npcLevels;
          console.log(`Adding ${npcLevels} gift levels for writing NPC ${npc.name || 'Unnamed'}. Total gift levels: ${totalGiftLevels}`);
        }
      }

      // Calculate gift item rewards (1 item per 5 gift levels)
      const giftItems = [];
      if (totalGiftLevels > 0) {
        const itemCount = Math.ceil(totalGiftLevels / 5);

        // Generate random items
        for (let i = 0; i < itemCount; i++) {
          try {
            // Roll a random item from the item pool
            const itemCategories = ['berries', 'pastries', 'balls', 'antiques', 'helditems'];
            const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)];

            // Use ItemRoller to get a random item (if available)
            if (ItemRoller) {
              try {
                const rolledItem = await ItemRoller.rollOne({ category: randomCategory });
                if (rolledItem) {
                  giftItems.push({
                    category: randomCategory,
                    name: rolledItem.name,
                    quantity: 1
                  });
                }
              } catch (rollError) {
                console.error(`Error rolling item for category ${randomCategory}:`, rollError);
                // Try rolling from all categories as fallback
                try {
                  const fallbackItem = await ItemRoller.rollOne({ category: 'ALL' });
                  if (fallbackItem) {
                    giftItems.push({
                      category: fallbackItem.category || 'items',
                      name: fallbackItem.name,
                      quantity: 1
                    });
                  }
                } catch (fallbackError) {
                  console.error('Error rolling fallback item:', fallbackError);
                  // Final fallback - add a generic item
                  giftItems.push({
                    category: randomCategory,
                    name: `Random ${randomCategory.slice(0, -1)}`,
                    quantity: 1
                  });
                }
              }
            } else {
              // Fallback if ItemRoller is not available
              giftItems.push({
                category: randomCategory,
                name: `Random ${randomCategory.slice(0, -1)}`,
                quantity: 1
              });
            }
          } catch (err) {
            console.error('Error generating gift item:', err);
          }
        }
      }

      return {
        totalLevels,
        totalCoins,
        trainerRewards,
        monsterRewards,
        gardenPoints,
        missionProgress,
        bossDamage,
        totalGiftLevels,
        giftItems
      };
    } catch (error) {
      console.error('Error calculating writing rewards:', error);
      throw error;
    }
  }

  /**
   * Check for monsters that would exceed level cap and calculate excess levels
   * @param {Array} monsterRewards - Array of monster rewards
   * @returns {Promise<Object>} Object with cappedMonsters and adjustedRewards
   */
  static async checkLevelCaps(monsterRewards) {
    const cappedMonsters = [];
    const adjustedRewards = [];

    // Define level cap (can be configured in the future)
    const LEVEL_CAP = 100; // Standard level cap

    for (const reward of monsterRewards) {
      try {
        const monster = await Monster.getById(reward.monsterId);
        if (!monster) {
          adjustedRewards.push(reward);
          continue;
        }

        const currentLevel = monster.level || 1;
        const levelsToGain = reward.levels || 0;
        const existingCappedLevels = reward.cappedLevels || 0;
        const originalLevels = levelsToGain + existingCappedLevels;
        const newLevel = currentLevel + originalLevels;

        // Check if there are any capped levels (either from exceeding 100 or already capped)
        if (newLevel > 100 || existingCappedLevels > 0) {
          const excessLevels = Math.max(newLevel - 100, existingCappedLevels);
          const cappedLevels = Math.max(levelsToGain - Math.max(0, newLevel - 100), existingCappedLevels);

          cappedMonsters.push({
            monsterId: reward.monsterId,
            name: monster.name,
            currentLevel,
            originalLevels,
            cappedLevels: existingCappedLevels,
            excessLevels,
            trainerId: monster.trainer_id,
            trainerName: monster.trainer_name || 'Unknown',
            image_url: monster.img_link
          });

          // Adjust the reward to only give levels up to 100
          adjustedRewards.push({
            ...reward,
            levels: levelsToGain, // Keep the actual levels that will be applied
            originalLevels,
            excessLevels
          });
        } else {
          adjustedRewards.push(reward);
        }
      } catch (error) {
        console.error(`Error checking level cap for monster ${reward.monsterId}:`, error);
        adjustedRewards.push(reward);
      }
    }

    return {
      cappedMonsters,
      adjustedRewards
    };
  }

  /**
   * Apply rewards from a submission
   * @param {Object} rewards - Calculated rewards
   * @param {number} userId - User ID (database ID)
   * @param {number} submissionId - Submission ID
   * @param {string} discordUserId - Discord user ID for missions and boss damage
   * @returns {Promise<Object>} Applied rewards
   */
  static async applyRewards(rewards, userId, submissionId, discordUserId = null) {
    try {
      console.log(`Applying rewards for submission ${submissionId} by user ${userId}`);

      const result = {
        trainers: [],
        monsters: [],
        gardenPoints: rewards.gardenPoints,
        missionProgress: rewards.missionProgress,
        bossDamage: rewards.bossDamage,
        giftLevels: 0,
        giftCoins: 0,
        giftItems: [],
        cappedLevels: 0
      };

      // Log the rewards being applied
      console.log('Rewards to apply:');
      if (rewards.trainerRewards) {
        console.log(`- ${rewards.trainerRewards.length} trainer rewards`);
      }
      if (rewards.monsterRewards) {
        console.log(`- ${rewards.monsterRewards.length} monster rewards`);
      }
      if (rewards.trainerId) {
        console.log(`- Direct trainer reward for trainer ${rewards.trainerId}`);
      }
      if (rewards.monsterId) {
        console.log(`- Direct monster reward for monster ${rewards.monsterId}`);
      }

      // Store gift and capped levels for later allocation
      let totalGiftLevels = 0;
      let totalGiftCoins = 0;
      let totalCappedLevels = 0;

      // Apply trainer rewards
      if (rewards.trainerRewards && Array.isArray(rewards.trainerRewards)) {
        for (const trainerReward of rewards.trainerRewards) {
          const { trainerId, trainerName, levels, coins, cappedLevels = 0, isGift, isOwned } = trainerReward;

          // For new system: track gift levels but don't store in database
          if (!isOwned) {
            totalGiftLevels += levels;
            totalGiftCoins += coins;
          }

          // Always apply rewards directly (no database storage for gifts)
          if (!isGift) {
            // Apply levels and coins directly
            if (levels > 0) {
              try {
                await Trainer.addLevels(trainerId, levels);
                console.log(`Successfully added ${levels} levels to trainer ${trainerId}`);
              } catch (error) {
                console.error(`Error adding levels to trainer ${trainerId}:`, error);
              }
            }

            if (coins > 0) {
              try {
                await Trainer.addCoins(trainerId, coins);
                console.log(`Successfully added ${coins} coins to trainer ${trainerId}`);
              } catch (error) {
                console.error(`Error adding coins to trainer ${trainerId}:`, error);
              }
            }

            // Track capped levels if any (for gift rewards interface)
            if (cappedLevels > 0) {
              totalCappedLevels += cappedLevels;
              // Capped levels are handled by the frontend gift rewards interface
              // No need to store them in the database
            }

            result.trainers.push({
              trainerId,
              levels,
              coins,
              cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0
            });
          }
        }
      } else if (rewards.trainerId && rewards.levels !== undefined) {
        // For writing submissions
        const { trainerId, monsterId, levels, coins = 0, cappedLevels = 0, isGift } = rewards;

        if (isGift) {
          // Track gift levels/coins for later allocation (handled by frontend)
          totalGiftLevels += levels;
          totalGiftCoins += coins;
          // Gift rewards are handled by the frontend gift rewards interface
          // No need to store them in the database
        } else {
          // Apply levels and coins directly
          if (monsterId) {
            // Apply levels to monster
            if (levels > 0) {
              try {
                await Monster.addLevels(monsterId, levels);
                console.log(`Successfully added ${levels} levels to monster ${monsterId} from writing submission`);
              } catch (error) {
                console.error(`Error adding levels to monster ${monsterId} from writing submission:`, error);
              }
            }

            // Apply coins to trainer
            if (coins > 0) {
              try {
                const monster = await Monster.getById(monsterId);
                if (monster && monster.trainer_id) {
                  await Trainer.addCoins(monster.trainer_id, coins);
                  console.log(`Successfully added ${coins} coins to trainer ${monster.trainer_id} for monster ${monsterId} from writing submission`);
                } else {
                  console.error(`Could not find trainer for monster ${monsterId} from writing submission`);
                }
              } catch (error) {
                console.error(`Error adding coins for monster ${monsterId} from writing submission:`, error);
              }
            }

            // Track capped levels if any (for gift rewards interface)
            if (cappedLevels > 0) {
              totalCappedLevels += cappedLevels;
              // Capped levels are handled by the frontend gift rewards interface
              // No need to store them in the database
            }

            result.monsters.push({
              monsterId,
              levels,
              cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0
            });
          } else if (trainerId) {
            // Apply levels and coins to trainer
            if (levels > 0) {
              try {
                await Trainer.addLevels(trainerId, levels);
                console.log(`Successfully added ${levels} levels to trainer ${trainerId} from writing submission`);
              } catch (error) {
                console.error(`Error adding levels to trainer ${trainerId} from writing submission:`, error);
              }
            }

            if (coins > 0) {
              try {
                await Trainer.addCoins(trainerId, coins);
                console.log(`Successfully added ${coins} coins to trainer ${trainerId} from writing submission`);
              } catch (error) {
                console.error(`Error adding coins to trainer ${trainerId} from writing submission:`, error);
              }
            }

            // Track capped levels if any (for gift rewards interface)
            if (cappedLevels > 0) {
              totalCappedLevels += cappedLevels;
              // Capped levels are handled by the frontend gift rewards interface
              // No need to store them in the database
            }

            result.trainers.push({
              trainerId,
              levels,
              coins,
              cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0
            });
          }
        }
      }

      // Apply monster rewards
      if (rewards.monsterRewards && Array.isArray(rewards.monsterRewards)) {
        for (const monsterReward of rewards.monsterRewards) {
          const { monsterId, levels, coins, cappedLevels = 0, isGift, isTrainerOwned } = monsterReward;

          // Verify that the monster exists in the database
          let actualMonsterId = monsterId;
          try {
            // Check if the monster exists with this ID
            const monsterExists = await Monster.getById(monsterId);

            if (!monsterExists) {
              console.log(`Monster with ID ${monsterId} not found in database. This might be a frontend-generated ID.`);

              // Try to find the monster by name and trainer ID if available
              if (monsterReward.name && monsterReward.trainerId) {
                console.log(`Attempting to find monster "${monsterReward.name}" for trainer ${monsterReward.trainerId}`);

                const monsterQuery = `
                  SELECT id FROM monsters
                  WHERE name = $1 AND trainer_id = $2
                `;
                const monsterData = await db.asyncGet(monsterQuery, [monsterReward.name, monsterReward.trainerId]);

                if (monsterData && monsterData.id) {
                  actualMonsterId = monsterData.id;
                  console.log(`Found monster in database: ${monsterReward.name} (ID: ${actualMonsterId}) for trainer ${monsterReward.trainerId}`);
                } else {
                  console.error(`Could not find monster in database: ${monsterReward.name} for trainer ${monsterReward.trainerId}`);
                  continue; // Skip this monster reward
                }
              } else {
                console.error(`Cannot find monster: missing name or trainer ID`);
                continue; // Skip this monster reward
              }
            }
          } catch (err) {
            console.error(`Error checking monster ${monsterId}:`, err);
            continue; // Skip this monster reward
          }

          // For new system: track gift levels but don't store in database
          if (!isTrainerOwned) {
            totalGiftLevels += levels;
          }

          // Always apply rewards directly (no database storage for gifts)
          if (!isGift) {
            // Apply levels directly
            if (levels > 0) {
              try {
                await Monster.addLevels(actualMonsterId, levels);
                console.log(`Successfully added ${levels} levels to monster ${actualMonsterId}`);
              } catch (error) {
                console.error(`Error adding levels for monster ${actualMonsterId}:`, error);
              }
            }

            // Apply coins to the monster's trainer
            if (coins > 0) {
              try {
                const monster = await Monster.getById(actualMonsterId);
                if (monster && monster.trainer_id) {
                  await Trainer.addCoins(monster.trainer_id, coins);
                  console.log(`Successfully added ${coins} coins to trainer ${monster.trainer_id} for monster ${actualMonsterId}`);
                } else {
                  console.error(`Could not find trainer for monster ${actualMonsterId}`);
                }
              } catch (error) {
                console.error(`Error adding coins for monster ${actualMonsterId}:`, error);
              }
            }

            // Track capped levels if any (for gift rewards interface)
            if (cappedLevels > 0) {
              totalCappedLevels += cappedLevels;
              // Capped levels are handled by the frontend gift rewards interface
              // No need to store them in the database
            }

            result.monsters.push({
              monsterId: actualMonsterId,
              levels,
              cappedLevels: cappedLevels > 0 ? Math.ceil(cappedLevels / 2) : 0
            });
          }
        }
      }

      // Gift items are handled by the frontend gift rewards interface
      // No need to store them in the database during reward application
      if (rewards.giftItems && Array.isArray(rewards.giftItems) && rewards.giftItems.length > 0) {
        result.giftItems = rewards.giftItems;
      }

      // Update submission with gift and capped levels
      if (totalGiftLevels > 0 || totalGiftCoins > 0 || totalCappedLevels > 0) {
        await this._updateSubmissionRewards(submissionId, totalGiftLevels, totalGiftCoins, totalCappedLevels);

        result.giftLevels = totalGiftLevels;
        result.giftCoins = totalGiftCoins;
        result.cappedLevels = Math.ceil(totalCappedLevels / 2); // Capped levels are halved (rounded up)
      }

      // Update garden points
      if (rewards.gardenPoints) {
        try {
          await GardenPoint.addPoints(userId, rewards.gardenPoints);
          result.gardenPoints = rewards.gardenPoints;
        } catch (error) {
          console.error('Error updating garden points:', error);
        }
      }

      // Update mission progress
      if (rewards.missionProgress) {
        try {
          // Update mission progress for the user (missions are per-user, not per-trainer)
          // Use Discord ID if available, otherwise fall back to database user ID
          const userIdForMissions = discordUserId || userId;
          const missionResult = await MissionProgress.addProgressByUserId(userIdForMissions, rewards.missionProgress);

          result.missionProgress = {
            amount: rewards.missionProgress,
            success: missionResult.success,
            message: missionResult.message,
            updatedMissions: missionResult.updatedMissions || [],
            completedMissions: missionResult.completedMissions || []
          };
        } catch (error) {
          console.error('Error updating mission progress:', error);
        }
      }

      // Update boss damage
      if (rewards.bossDamage) {
        try {
          // Get active boss
          const activeBoss = await BossDamage.getActiveBoss();

          if (activeBoss && discordUserId) {
            // Deal damage for the submitting user
            const damageResult = await BossDamage.addDamage(
              activeBoss.id,
              discordUserId,
              rewards.bossDamage,
              submissionId
            );

            if (damageResult.success) {
              result.bossDamage = {
                amount: rewards.bossDamage,
                results: [{
                  userId: discordUserId,
                  damage: rewards.bossDamage,
                  boss: damageResult.boss
                }]
              };
            } else {
              result.bossDamage = {
                amount: rewards.bossDamage,
                results: []
              };
            }
          } else {
            result.bossDamage = {
              amount: rewards.bossDamage,
              results: []
            };
          }
        } catch (error) {
          console.error('Error updating boss damage:', error);
          result.bossDamage = {
            amount: rewards.bossDamage,
            results: []
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error applying rewards:', error);
      throw error;
    }
  }

  /**
   * Store gift rewards in the database
   * @param {number} submissionId - Submission ID
   * @param {string} entityType - Entity type ('trainer' or 'monster')
   * @param {number} entityId - Entity ID
   * @param {number} levels - Gift levels
   * @param {number} coins - Gift coins
   * @returns {Promise<void>}
   * @private
   */
  static async _storeGiftRewards(submissionId, entityType, entityId, levels, coins) {
    try {
      const query = `
        INSERT INTO submission_rewards (
          submission_id, reward_type, recipient_type, recipient_id, amount
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      // Store levels
      if (levels > 0) {
        await db.asyncRun(query, [
          submissionId,
          'gift_level',
          entityType,
          entityId,
          levels
        ]);
      }

      // Store coins
      if (coins > 0) {
        await db.asyncRun(query, [
          submissionId,
          'gift_coin',
          entityType,
          entityId,
          coins
        ]);
      }
    } catch (error) {
      console.error('Error storing gift rewards:', error);
      throw error;
    }
  }

  /**
   * Store capped levels in the database
   * @param {number} submissionId - Submission ID
   * @param {number} cappedLevels - Capped levels
   * @returns {Promise<void>}
   * @private
   */
  static async _storeCappedLevels(submissionId, cappedLevels) {
    try {
      const query = `
        INSERT INTO submission_rewards (
          submission_id, reward_type, recipient_type, recipient_id, amount
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      // Store capped levels (recipient will be determined later)
      if (cappedLevels > 0) {
        await db.asyncRun(query, [
          submissionId,
          'capped_level',
          'pending',
          0,
          Math.ceil(cappedLevels / 2) // Capped levels are halved (rounded up)
        ]);
      }
    } catch (error) {
      console.error('Error storing capped levels:', error);
      throw error;
    }
  }

  /**
   * Store gift item in the database
   * @param {number} submissionId - Submission ID
   * @param {string} category - Item category
   * @param {string} name - Item name
   * @param {number} quantity - Item quantity
   * @param {string} [recipientType] - Recipient type ('trainer' or 'monster')
   * @param {number} [recipientId] - Recipient ID
   * @returns {Promise<void>}
   * @private
   */
  static async _storeGiftItem(submissionId, category, name, quantity, recipientType = null, recipientId = 0) {
    try {
      const query = `
        INSERT INTO submission_gift_items (
          submission_id, item_category, item_name, quantity, recipient_type, recipient_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      // Store gift item with recipient information if provided
      await db.asyncRun(query, [
        submissionId,
        category,
        name,
        quantity,
        recipientType || null,
        recipientId || 0
      ]);
    } catch (error) {
      console.error('Error storing gift item:', error);
      throw error;
    }
  }

  /**
   * Update submission with gift and capped levels
   * @param {number} submissionId - Submission ID
   * @param {number} giftLevels - Gift levels
   * @param {number} giftCoins - Gift coins
   * @param {number} cappedLevels - Capped levels
   * @returns {Promise<void>}
   * @private
   */
  static async _updateSubmissionRewards(submissionId, giftLevels, giftCoins, cappedLevels) {
    try {
      const query = `
        UPDATE submissions
        SET gift_levels = $1, gift_coins = $2, capped_levels = $3
        WHERE id = $4
      `;

      await db.asyncRun(query, [
        giftLevels,
        giftCoins,
        Math.ceil(cappedLevels / 2), // Capped levels are halved (rounded up)
        submissionId
      ]);
    } catch (error) {
      console.error('Error updating submission rewards:', error);
      throw error;
    }
  }

  /**
   * Allocate gift levels to a trainer or monster
   * @param {number} submissionId - Submission ID
   * @param {string} recipientType - Recipient type ('trainer' or 'monster')
   * @param {number} recipientId - Recipient ID
   * @param {number} levels - Levels to allocate
   * @returns {Promise<Object>} Result of allocation
   */
  static async allocateGiftLevels(submissionId, recipientType, recipientId, levels) {
    try {
      // Validate input
      if (!submissionId || !recipientType || !recipientId || levels <= 0) {
        throw new Error('Invalid input for gift level allocation');
      }

      // Get submission
      const submission = await this.getById(submissionId);
      if (!submission) {
        throw new Error(`Submission with ID ${submissionId} not found`);
      }

      // Check if there are enough gift levels available
      if (submission.gift_levels < levels) {
        throw new Error(`Not enough gift levels available. Requested: ${levels}, Available: ${submission.gift_levels}`);
      }

      // Apply levels to recipient
      if (recipientType === 'trainer') {
        await Trainer.addLevels(recipientId, levels);
      } else if (recipientType === 'monster') {
        await Monster.addLevels(recipientId, levels);
      } else {
        throw new Error(`Invalid recipient type: ${recipientType}`);
      }

      // Update submission gift levels
      const updateQuery = `
        UPDATE submissions
        SET gift_levels = gift_levels - $1
        WHERE id = $2
      `;
      await db.asyncRun(updateQuery, [levels, submissionId]);

      // Record allocation
      const recordQuery = `
        INSERT INTO submission_rewards (
          submission_id, reward_type, recipient_type, recipient_id, amount, is_claimed, claimed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.asyncRun(recordQuery, [
        submissionId,
        'allocated_gift_level',
        recipientType,
        recipientId,
        levels,
        1,
        new Date().toISOString()
      ]);

      return {
        success: true,
        submissionId,
        recipientType,
        recipientId,
        levels,
        remainingGiftLevels: submission.gift_levels - levels
      };
    } catch (error) {
      console.error('Error allocating gift levels:', error);
      throw error;
    }
  }

  /**
   * Allocate gift coins to a trainer
   * @param {number} submissionId - Submission ID
   * @param {number} trainerId - Trainer ID
   * @param {number} coins - Coins to allocate
   * @returns {Promise<Object>} Result of allocation
   */
  static async allocateGiftCoins(submissionId, trainerId, coins) {
    try {
      // Validate input
      if (!submissionId || !trainerId || coins <= 0) {
        throw new Error('Invalid input for gift coin allocation');
      }

      // Get submission
      const submission = await this.getById(submissionId);
      if (!submission) {
        throw new Error(`Submission with ID ${submissionId} not found`);
      }

      // Check if there are enough gift coins available
      if (submission.gift_coins < coins) {
        throw new Error(`Not enough gift coins available. Requested: ${coins}, Available: ${submission.gift_coins}`);
      }

      // Apply coins to trainer
      await Trainer.addCoins(trainerId, coins);

      // Update submission gift coins
      const updateQuery = `
        UPDATE submissions
        SET gift_coins = gift_coins - $1
        WHERE id = $2
      `;
      await db.asyncRun(updateQuery, [coins, submissionId]);

      // Record allocation
      const recordQuery = `
        INSERT INTO submission_rewards (
          submission_id, reward_type, recipient_type, recipient_id, amount, is_claimed, claimed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await db.asyncRun(recordQuery, [
        submissionId,
        'allocated_gift_coin',
        'trainer',
        trainerId,
        coins,
        1,
        new Date().toISOString()
      ]);

      return {
        success: true,
        submissionId,
        trainerId,
        coins,
        remainingGiftCoins: submission.gift_coins - coins
      };
    } catch (error) {
      console.error('Error allocating gift coins:', error);
      throw error;
    }
  }

  /**
   * Allocate capped levels to a trainer or monster
   * @param {number} submissionId - Submission ID
   * @param {string} recipientType - Recipient type ('trainer' or 'monster')
   * @param {number} recipientId - Recipient ID
   * @param {number} levels - Levels to allocate
   * @returns {Promise<Object>} Result of allocation
   */
  static async allocateCappedLevels(submissionId, recipientType, recipientId, levels) {
    try {
      // Validate input
      if (!submissionId || !recipientType || !recipientId || levels <= 0) {
        throw new Error('Invalid input for capped level allocation');
      }

      // Get submission
      const submission = await this.getById(submissionId);
      if (!submission) {
        throw new Error(`Submission with ID ${submissionId} not found`);
      }

      // Check if there are enough capped levels available
      if (submission.capped_levels < levels) {
        throw new Error(`Not enough capped levels available. Requested: ${levels}, Available: ${submission.capped_levels}`);
      }

      // Apply levels to recipient
      if (recipientType === 'trainer') {
        await Trainer.addLevels(recipientId, levels);
      } else if (recipientType === 'monster') {
        await Monster.addLevels(recipientId, levels);
      } else {
        throw new Error(`Invalid recipient type: ${recipientType}`);
      }

      // Update submission capped levels
      const updateQuery = `
        UPDATE submissions
        SET capped_levels = capped_levels - $1
        WHERE id = $2
      `;
      await db.asyncRun(updateQuery, [levels, submissionId]);

      // Record allocation
      const recordQuery = `
        INSERT INTO submission_capped_levels (
          submission_id, recipient_type, recipient_id, levels_amount
        ) VALUES ($1, $2, $3, $4)
      `;
      await db.asyncRun(recordQuery, [
        submissionId,
        recipientType,
        recipientId,
        levels
      ]);

      return {
        success: true,
        submissionId,
        recipientType,
        recipientId,
        levels,
        remainingCappedLevels: submission.capped_levels - levels
      };
    } catch (error) {
      console.error('Error allocating capped levels:', error);
      throw error;
    }
  }

  /**
   * Allocate gift item to a trainer
   * @param {number} itemId - Gift item ID
   * @param {number} trainerId - Trainer ID
   * @returns {Promise<Object>} Result of allocation
   */
  static async allocateGiftItem(itemId, trainerId) {
    try {
      // Validate input
      if (!itemId || !trainerId) {
        throw new Error('Invalid input for gift item allocation');
      }

      // Get gift item
      const query = `
        SELECT * FROM submission_gift_items
        WHERE id = $1 AND is_claimed = 0
      `;
      const giftItem = await db.asyncGet(query, [itemId]);

      if (!giftItem) {
        throw new Error(`Gift item with ID ${itemId} not found or already claimed`);
      }

      // Get trainer inventory
      const inventoryQuery = `
        SELECT * FROM trainer_inventory
        WHERE trainer_id = $1
      `;
      let inventory = await db.asyncGet(inventoryQuery, [trainerId]);

      // Create inventory if it doesn't exist
      if (!inventory) {
        const createInventoryQuery = `
          INSERT INTO trainer_inventory (trainer_id)
          VALUES (?)
        `;
        await db.asyncRun(createInventoryQuery, [trainerId]);
        inventory = await db.asyncGet(inventoryQuery, [trainerId]);
      }

      // Parse inventory JSON for the category
      const category = giftItem.item_category;
      let categoryItems = {};
      try {
        categoryItems = JSON.parse(inventory[category] || '{}');
      } catch (e) {
        categoryItems = {};
      }

      // Add item to inventory
      const itemName = giftItem.item_name;
      categoryItems[itemName] = (categoryItems[itemName] || 0) + giftItem.quantity;

      // Update inventory
      const updateInventoryQuery = `
        UPDATE trainer_inventory
        SET ${category} = $1
        WHERE trainer_id = $2
      `;
      await db.asyncRun(updateInventoryQuery, [JSON.stringify(categoryItems), trainerId]);

      // Mark gift item as claimed
      const updateGiftItemQuery = `
        UPDATE submission_gift_items
        SET is_claimed = 1, claimed_at = $1, recipient_id = $2
        WHERE id = $3
      `;
      await db.asyncRun(updateGiftItemQuery, [new Date().toISOString(), trainerId, itemId]);

      return {
        success: true,
        itemId,
        trainerId,
        category,
        itemName,
        quantity: giftItem.quantity
      };
    } catch (error) {
      console.error('Error allocating gift item:', error);
      throw error;
    }
  }

  /**
   * Get submission by ID
   * @param {number} id - Submission ID
   * @returns {Promise<Object|null>} Submission object or null if not found
   */
  static async getById(id) {
    try {
      const query = `
        SELECT * FROM submissions
        WHERE id = $1
      `;
      return await db.asyncGet(query, [id]);
    } catch (error) {
      console.error('Error getting submission by ID:', error);
      throw error;
    }
  }
}

module.exports = Submission;
