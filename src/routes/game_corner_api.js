/**
 * Game Corner API
 * Handles generating rewards for the Pomodoro Game Corner
 */

const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const MonsterRoller = require('../utils/MonsterRoller');

/**
 * Generate item rewards based on parameters
 */
router.post('/generate-items', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to generate rewards' });
    }

    const { rewardMultiplier, numItems, trainers } = req.body;

    if (!rewardMultiplier || !numItems || !trainers || !Array.isArray(trainers)) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Map rarity tiers to database rarity values
    const rarityMap = {
      1: 'common',
      2: 'uncommon',
      3: 'rare',
      4: 'very_rare',
      5: 'legendary'
    };

    // Get all items from the database
    const allItems = await Item.getAll();
    if (!allItems || allItems.length === 0) {
      return res.status(500).json({ success: false, message: 'No items found in database' });
    }

    // Group items by rarity
    const itemsByRarity = {
      common: allItems.filter(item => item.rarity === 'common'),
      uncommon: allItems.filter(item => item.rarity === 'uncommon'),
      rare: allItems.filter(item => item.rarity === 'rare'),
      very_rare: allItems.filter(item => item.rarity === 'very_rare'),
      legendary: allItems.filter(item => item.rarity === 'legendary')
    };

    // Fallback items in case database doesn't have items for a specific rarity
    const fallbackItems = {
      common: [
        { name: 'Potion', effect: 'Restores 20 HP', category: 'healing', rarity: 'common' },
        { name: 'Antidote', effect: 'Cures poison', category: 'status', rarity: 'common' }
      ],
      uncommon: [
        { name: 'Super Potion', effect: 'Restores 50 HP', category: 'healing', rarity: 'uncommon' },
        { name: 'Great Ball', effect: 'Better catch rate than a Poké Ball', category: 'ball', rarity: 'uncommon' }
      ],
      rare: [
        { name: 'Hyper Potion', effect: 'Restores 200 HP', category: 'healing', rarity: 'rare' },
        { name: 'Ultra Ball', effect: 'Higher catch rate than a Great Ball', category: 'ball', rarity: 'rare' }
      ],
      very_rare: [
        { name: 'Max Potion', effect: 'Fully restores HP', category: 'healing', rarity: 'very_rare' },
        { name: 'Full Restore', effect: 'Fully restores HP and cures all status conditions', category: 'healing', rarity: 'very_rare' }
      ],
      legendary: [
        { name: 'Master Ball', effect: 'Catches any monster without fail', category: 'ball', rarity: 'legendary' },
        { name: 'Rare Candy', effect: 'Raises a monster\'s level by 1', category: 'evolution', rarity: 'legendary' }
      ]
    };

    // Generate rewards
    const itemRewards = [];
    for (let i = 0; i < numItems; i++) {
      // Higher multiplier increases chance of better items
      const maxTier = Math.min(5, Math.ceil(rewardMultiplier * 2.5));
      let selectedTier;

      // Weighted random selection for tier
      const tierRoll = Math.random();
      if (tierRoll < 0.5) selectedTier = 1; // 50% chance for tier 1
      else if (tierRoll < 0.75) selectedTier = 2; // 25% chance for tier 2
      else if (tierRoll < 0.9) selectedTier = 3; // 15% chance for tier 3
      else if (tierRoll < 0.98) selectedTier = 4; // 8% chance for tier 4
      else selectedTier = 5; // 2% chance for tier 5

      // Cap the tier by the multiplier-determined max tier
      selectedTier = Math.min(selectedTier, maxTier);
      const rarityKey = rarityMap[selectedTier];

      // Get items for the selected rarity
      let tierItems = itemsByRarity[rarityKey];

      // Use fallback if no items found for this rarity
      if (!tierItems || tierItems.length === 0) {
        tierItems = fallbackItems[rarityKey];
      }

      if (tierItems && tierItems.length > 0) {
        // Select a random item from the tier
        const selectedItem = tierItems[Math.floor(Math.random() * tierItems.length)];

        // Select a random trainer to receive the item
        const trainerIndex = Math.floor(Math.random() * trainers.length);
        const trainer = trainers[trainerIndex];

        itemRewards.push({
          item: {
            name: selectedItem.name,
            description: selectedItem.effect,
            category: selectedItem.category,
            rarity: selectedItem.rarity
          },
          trainerName: trainer.name || `Trainer #${trainerIndex + 1}`,
          trainerId: trainer.id || trainerIndex,
          trainerImage: trainer.profile_img || 'https://via.placeholder.com/50'
        });
      }
    }

    res.json({
      success: true,
      items: itemRewards
    });
  } catch (error) {
    console.error('Error generating item rewards:', error);
    res.status(500).json({ success: false, message: 'Error generating rewards: ' + error.message });
  }
});

/**
 * Generate monster rewards based on parameters
 */
router.post('/generate-monsters', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to generate rewards' });
    }

    const { rewardMultiplier, numEncounters } = req.body;

    if (!rewardMultiplier || !numEncounters) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    const monsterRewards = [];

    // For each encounter, determine rarity based on multiplier and random chance
    for (let i = 0; i < numEncounters; i++) {
      // Base chance calculations
      const legendaryChance = 0.000001; // 0.001% chance for legendary (1/100,000)
      const mythicalChance = 0.00001;   // 0.01% chance for mythical (1/10,000)
      const rareChance = 0.005;         // 5% chance for rare
      const uncommonChance = 0.025;     // 25% chance for uncommon

      // Apply multiplier to increase chances (but keep legendaries extremely rare)
      // Even with max multiplier, legendary chance is capped at 0.002% (1/50,000)
      const adjustedLegendaryChance = Math.min(0.00002, legendaryChance * rewardMultiplier * 2);
      const adjustedMythicalChance = Math.min(0.001, mythicalChance * rewardMultiplier * 5);  // Cap at 0.1%
      const adjustedRareChance = Math.min(0.3, rareChance * rewardMultiplier * 2);          // Cap at 30%
      const adjustedUncommonChance = Math.min(0.6, uncommonChance * rewardMultiplier * 1.5); // Cap at 60%

      // Roll for monster rarity
      const rarityRoll = Math.random();
      let monsterOptions = {};

      if (rarityRoll < adjustedLegendaryChance) {
        // Legendary monster (extremely rare)
        monsterOptions = {
          filters: {
            pokemon: { rarity: 'Legendary' },
            includeSpecies: ['Pokemon']
          }
        };
      } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance) {
        // Mythical monster (very rare)
        monsterOptions = {
          filters: {
            pokemon: { rarity: 'Mythical' },
            includeSpecies: ['Pokemon']
          }
        };
      } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance + adjustedRareChance) {
        // Rare monster
        monsterOptions = {
          filters: {
            pokemon: { rarity: 'Rare' },
            includeSpecies: ['Pokemon']
          }
        };
      } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance + adjustedRareChance + adjustedUncommonChance) {
        // Uncommon monster
        monsterOptions = {
          filters: {
            pokemon: { rarity: 'Uncommon' },
            includeSpecies: ['Pokemon']
          }
        };
      } else {
        // Common monster (default)
        monsterOptions = {
          filters: {
            pokemon: { rarity: 'Common' },
            includeSpecies: ['Pokemon']
          }
        };
      }

      try {
        // Use MonsterRoller to generate a monster
        const monsterData = await MonsterRoller.rollOne(monsterOptions);

        // Determine if the monster is evolved based on multiplier
        const evolutionChance = rewardMultiplier * 0.2;
        const isEvolved = Math.random() < evolutionChance;

        // Extract relevant information from monster data
        const monster = {
          name: monsterData.species1,
          type: monsterData.type1 + (monsterData.type2 ? `/${monsterData.type2}` : ''),
          rarity: monsterData.speciesData[0]?.data?.Rarity || 'Common',
          isEvolved: isEvolved
        };

        monsterRewards.push(monster);
      } catch (error) {
        console.error('Error rolling monster:', error);
        // If MonsterRoller fails, add a fallback monster
        const fallbackMonster = {
          name: 'Mystery Monster',
          type: 'Normal',
          rarity: 'Common',
          isEvolved: false
        };
        monsterRewards.push(fallbackMonster);
      }
    }

    res.json({
      success: true,
      monsters: monsterRewards
    });
  } catch (error) {
    console.error('Error generating monster rewards:', error);
    res.status(500).json({ success: false, message: 'Error generating rewards: ' + error.message });
  }
});

/**
 * Generate all rewards for a game corner session
 */
router.post('/generate-rewards', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'You must be logged in to generate rewards' });
    }

    const { sessionLength, productivityScore, trainers } = req.body;

    if (!sessionLength || !productivityScore || !trainers || !Array.isArray(trainers)) {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }

    // Calculate reward multiplier
    const lengthMultiplier = Math.min(2, sessionLength / 25); // Cap at 2x for sessions longer than 50 minutes
    const productivityMultiplier = productivityScore / 100;
    const rewardMultiplier = lengthMultiplier * productivityMultiplier;

    // Initialize rewards object
    const rewards = {
      levels: [],
      items: [],
      coins: [],
      monsters: []
    };

    // Determine which reward types to include based on multiplier and randomness
    const includeLevel = Math.random() < 0.7 * rewardMultiplier; // 70% chance * multiplier
    const includeItems = Math.random() < 0.8 * rewardMultiplier; // 80% chance * multiplier
    const includeCoins = Math.random() < 0.9 * rewardMultiplier; // 90% chance * multiplier
    const includeMonster = Math.random() < 0.4 * rewardMultiplier; // 40% chance * multiplier

    // Generate level rewards
    if (includeLevel && trainers.length > 0) {
      // Determine how many trainers get levels
      const numRecipients = Math.max(1, Math.floor(Math.random() * 3 * rewardMultiplier));

      // For each recipient, generate a level reward
      for (let i = 0; i < numRecipients; i++) {
        // Select a random trainer
        const trainerIndex = Math.floor(Math.random() * trainers.length);
        const trainer = trainers[trainerIndex];

        // Determine level increase (1-3 based on multiplier)
        const levelIncrease = Math.max(1, Math.floor(Math.random() * 3 * rewardMultiplier));

        rewards.levels.push({
          type: 'trainer',
          name: trainer.name || `Trainer #${trainerIndex + 1}`,
          id: trainer.id || trainerIndex,
          levelIncrease,
          image: trainer.profile_img || 'https://via.placeholder.com/50'
        });
      }
    }

    // Generate item rewards
    if (includeItems && trainers.length > 0) {
      // Map rarity tiers to database rarity values
      const rarityMap = {
        1: 'common',
        2: 'uncommon',
        3: 'rare',
        4: 'very_rare',
        5: 'legendary'
      };

      // Get all items from the database
      const allItems = await Item.getAll();

      // Group items by rarity
      const itemsByRarity = {
        common: allItems.filter(item => item.rarity === 'common'),
        uncommon: allItems.filter(item => item.rarity === 'uncommon'),
        rare: allItems.filter(item => item.rarity === 'rare'),
        very_rare: allItems.filter(item => item.rarity === 'very_rare'),
        legendary: allItems.filter(item => item.rarity === 'legendary')
      };

      // Fallback items in case database doesn't have items for a specific rarity
      const fallbackItems = {
        common: [
          { name: 'Potion', effect: 'Restores 20 HP', category: 'healing', rarity: 'common' },
          { name: 'Antidote', effect: 'Cures poison', category: 'status', rarity: 'common' }
        ],
        uncommon: [
          { name: 'Super Potion', effect: 'Restores 50 HP', category: 'healing', rarity: 'uncommon' },
          { name: 'Great Ball', effect: 'Better catch rate than a Poké Ball', category: 'ball', rarity: 'uncommon' }
        ],
        rare: [
          { name: 'Hyper Potion', effect: 'Restores 200 HP', category: 'healing', rarity: 'rare' },
          { name: 'Ultra Ball', effect: 'Higher catch rate than a Great Ball', category: 'ball', rarity: 'rare' }
        ],
        very_rare: [
          { name: 'Max Potion', effect: 'Fully restores HP', category: 'healing', rarity: 'very_rare' },
          { name: 'Full Restore', effect: 'Fully restores HP and cures all status conditions', category: 'healing', rarity: 'very_rare' }
        ],
        legendary: [
          { name: 'Master Ball', effect: 'Catches any monster without fail', category: 'ball', rarity: 'legendary' },
          { name: 'Rare Candy', effect: 'Raises a monster\'s level by 1', category: 'evolution', rarity: 'legendary' }
        ]
      };

      // Determine number of items to award (1-3 based on multiplier)
      const numItems = Math.max(1, Math.floor(Math.random() * 3 * rewardMultiplier));

      // For each item, select based on rarity and multiplier
      for (let i = 0; i < numItems; i++) {
        // Higher multiplier increases chance of better items
        const maxTier = Math.min(5, Math.ceil(rewardMultiplier * 2.5));
        let selectedTier;

        // Weighted random selection for tier
        const tierRoll = Math.random();
        if (tierRoll < 0.5) selectedTier = 1; // 50% chance for tier 1
        else if (tierRoll < 0.75) selectedTier = 2; // 25% chance for tier 2
        else if (tierRoll < 0.9) selectedTier = 3; // 15% chance for tier 3
        else if (tierRoll < 0.98) selectedTier = 4; // 8% chance for tier 4
        else selectedTier = 5; // 2% chance for tier 5

        // Cap the tier by the multiplier-determined max tier
        selectedTier = Math.min(selectedTier, maxTier);
        const rarityKey = rarityMap[selectedTier];

        // Get items for the selected rarity
        let tierItems = itemsByRarity[rarityKey];

        // Use fallback if no items found for this rarity
        if (!tierItems || tierItems.length === 0) {
          tierItems = fallbackItems[rarityKey];
        }

        if (tierItems && tierItems.length > 0) {
          // Select a random item from the tier
          const selectedItem = tierItems[Math.floor(Math.random() * tierItems.length)];

          // Select a random trainer to receive the item
          const trainerIndex = Math.floor(Math.random() * trainers.length);
          const trainer = trainers[trainerIndex];

          rewards.items.push({
            item: {
              name: selectedItem.name,
              description: selectedItem.effect,
              category: selectedItem.category,
              rarity: selectedItem.rarity
            },
            trainerName: trainer.name || `Trainer #${trainerIndex + 1}`,
            trainerId: trainer.id || trainerIndex,
            trainerImage: trainer.profile_img || 'https://via.placeholder.com/50'
          });
        }
      }
    }

    // Generate coin rewards
    if (includeCoins && trainers.length > 0) {
      // Determine number of trainers to receive coins (1-3 based on multiplier)
      const numRecipients = Math.max(1, Math.floor(Math.random() * 3 * rewardMultiplier));

      // For each recipient, generate a coin reward
      for (let i = 0; i < numRecipients; i++) {
        // Select a random trainer
        const trainerIndex = Math.floor(Math.random() * trainers.length);
        const trainer = trainers[trainerIndex];

        // Base amount is 50-200 coins
        const baseAmount = 50 + Math.floor(Math.random() * 150);

        // Apply multiplier for final amount
        const coinAmount = Math.floor(baseAmount * rewardMultiplier);

        rewards.coins.push({
          amount: coinAmount,
          trainerName: trainer.name || `Trainer #${trainerIndex + 1}`,
          trainerId: trainer.id || trainerIndex,
          trainerImage: trainer.profile_img || 'https://via.placeholder.com/50'
        });
      }
    }

    // Generate monster encounter rewards
    if (includeMonster) {
      // Determine number of monster encounters (usually 1, but can be more with high multiplier)
      const numEncounters = Math.floor(Math.random() * rewardMultiplier) < 0.8 ? 1 : 2;

      // For each encounter, determine rarity based on multiplier and random chance
      for (let i = 0; i < numEncounters; i++) {
        // Base chance calculations
        const legendaryChance = 0.000001; // 0.001% chance for legendary (1/100,000)
        const mythicalChance = 0.00001;   // 0.01% chance for mythical (1/10,000)
        const rareChance = 0.005;         // 5% chance for rare
        const uncommonChance = 0.025;     // 25% chance for uncommon

        // Apply multiplier to increase chances (but keep legendaries extremely rare)
        // Even with max multiplier, legendary chance is capped at 0.002% (1/50,000)
        const adjustedLegendaryChance = Math.min(0.00002, legendaryChance * rewardMultiplier * 2);
        const adjustedMythicalChance = Math.min(0.001, mythicalChance * rewardMultiplier * 5);  // Cap at 0.1%
        const adjustedRareChance = Math.min(0.3, rareChance * rewardMultiplier * 2);          // Cap at 30%
        const adjustedUncommonChance = Math.min(0.6, uncommonChance * rewardMultiplier * 1.5); // Cap at 60%

        // Roll for monster rarity
        const rarityRoll = Math.random();
        let monsterOptions = {};

        if (rarityRoll < adjustedLegendaryChance) {
          // Legendary monster (extremely rare)
          monsterOptions = {
            filters: {
              pokemon: { rarity: 'Legendary' },
              includeSpecies: ['Pokemon']
            }
          };
        } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance) {
          // Mythical monster (very rare)
          monsterOptions = {
            filters: {
              pokemon: { rarity: 'Mythical' },
              includeSpecies: ['Pokemon']
            }
          };
        } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance + adjustedRareChance) {
          // Rare monster
          monsterOptions = {
            filters: {
              pokemon: { rarity: 'Rare' },
              includeSpecies: ['Pokemon']
            }
          };
        } else if (rarityRoll < adjustedLegendaryChance + adjustedMythicalChance + adjustedRareChance + adjustedUncommonChance) {
          // Uncommon monster
          monsterOptions = {
            filters: {
              pokemon: { rarity: 'Uncommon' },
              includeSpecies: ['Pokemon']
            }
          };
        } else {
          // Common monster (default)
          monsterOptions = {
            filters: {
              pokemon: { rarity: 'Common' },
              includeSpecies: ['Pokemon']
            }
          };
        }

        try {
          // Use MonsterRoller to generate a monster
          const monsterData = await MonsterRoller.rollOne(monsterOptions);

          // Determine if the monster is evolved based on multiplier
          const evolutionChance = rewardMultiplier * 0.2;
          const isEvolved = Math.random() < evolutionChance;

          // Extract relevant information from monster data
          const monster = {
            name: monsterData.species1,
            type: monsterData.type1 + (monsterData.type2 ? `/${monsterData.type2}` : ''),
            rarity: monsterData.speciesData[0]?.data?.Rarity || 'Common',
            isEvolved: isEvolved
          };

          rewards.monsters.push(monster);
        } catch (error) {
          console.error('Error rolling monster:', error);
          // If MonsterRoller fails, add a fallback monster
          const fallbackMonster = {
            name: 'Mystery Monster',
            type: 'Normal',
            rarity: 'Common',
            isEvolved: false
          };
          rewards.monsters.push(fallbackMonster);
        }
      }
    }

    res.json({
      success: true,
      rewards: rewards
    });
  } catch (error) {
    console.error('Error generating rewards:', error);
    res.status(500).json({ success: false, message: 'Error generating rewards: ' + error.message });
  }
});

module.exports = router;
