const asyncHandler = require('express-async-handler');
const Monster = require('../models/Monster');
const Ability = require('../models/Ability');
const Trainer = require('../models/Trainer');
const TrainerInventory = require('../models/TrainerInventory');
const MonsterInitializer = require('../utils/MonsterInitializer');

/**
 * @desc    Get monster abilities
 * @route   GET /api/town/mega-mart/monster/:id/abilities
 * @access  Private
 */
const getMonsterAbilities = asyncHandler(async (req, res) => {
  const monsterId = req.params.id;

  // Get monster
  const monster = await Monster.getById(monsterId);
  if (!monster) {
    res.status(404);
    throw new Error('Monster not found');
  }

  // Check if monster has abilities
  if (!monster.ability1) {
    // Generate random abilities
    const abilities = await MonsterInitializer.getRandomAbilities();
    
    // Update monster with new abilities
    await Monster.update(monsterId, {
      ability1: abilities.ability1,
      ability2: abilities.ability2
    });

    // Get updated monster
    const updatedMonster = await Monster.getById(monsterId);
    
    // Get ability details
    const ability1Details = await Ability.getByName(updatedMonster.ability1);
    const ability2Details = await Ability.getByName(updatedMonster.ability2);

    return res.json({
      success: true,
      abilities: {
        ability1: {
          name: updatedMonster.ability1,
          effect: ability1Details ? ability1Details.effect : 'No description available'
        },
        ability2: {
          name: updatedMonster.ability2,
          effect: ability2Details ? ability2Details.effect : 'No description available'
        },
        hidden_ability: null
      }
    });
  }

  // Get ability details
  const ability1Details = await Ability.getByName(monster.ability1);
  const ability2Details = await Ability.getByName(monster.ability2);
  const hiddenAbilityDetails = monster.hidden_ability ? await Ability.getByName(monster.hidden_ability) : null;

  res.json({
    success: true,
    abilities: {
      ability1: {
        name: monster.ability1,
        effect: ability1Details ? ability1Details.effect : 'No description available'
      },
      ability2: {
        name: monster.ability2,
        effect: ability2Details ? ability2Details.effect : 'No description available'
      },
      hidden_ability: hiddenAbilityDetails ? {
        name: monster.hidden_ability,
        effect: hiddenAbilityDetails.effect
      } : null
    }
  });
});

/**
 * @desc    Use ability capsule
 * @route   POST /api/town/mega-mart/use-ability-capsule
 * @access  Private
 */
const useAbilityCapsule = asyncHandler(async (req, res) => {
  const { monsterId, trainerId } = req.body;

  // Validate input
  if (!monsterId || !trainerId) {
    res.status(400);
    throw new Error('Monster ID and trainer ID are required');
  }

  // Get monster
  const monster = await Monster.getById(monsterId);
  if (!monster) {
    res.status(404);
    throw new Error('Monster not found');
  }

  // Check if monster belongs to trainer
  if (monster.trainer_id !== parseInt(trainerId)) {
    res.status(403);
    throw new Error('This monster does not belong to the specified trainer');
  }

  // Check if monster has both abilities
  if (!monster.ability1 || !monster.ability2) {
    res.status(400);
    throw new Error('Monster must have both ability 1 and ability 2 to use an ability capsule');
  }

  // Check if trainer has an ability capsule
  const inventory = await TrainerInventory.getByTrainerId(trainerId);
  const items = inventory.items ? JSON.parse(inventory.items) : {};
  
  if (!items['Ability Capsule'] || items['Ability Capsule'] < 1) {
    res.status(400);
    throw new Error('Trainer does not have an Ability Capsule');
  }

  // Swap abilities
  const temp = monster.ability1;
  await Monster.update(monsterId, {
    ability1: monster.ability2,
    ability2: temp
  });

  // Use the item
  items['Ability Capsule'] -= 1;
  await TrainerInventory.updateItemQuantity(inventory.id, 'items', 'Ability Capsule', items['Ability Capsule']);

  // Get updated monster
  const updatedMonster = await Monster.getById(monsterId);

  // Get ability details
  const ability1Details = await Ability.getByName(updatedMonster.ability1);
  const ability2Details = await Ability.getByName(updatedMonster.ability2);

  res.json({
    success: true,
    message: 'Ability Capsule used successfully. Abilities have been swapped.',
    abilities: {
      ability1: {
        name: updatedMonster.ability1,
        effect: ability1Details ? ability1Details.Effect : 'No description available'
      },
      ability2: {
        name: updatedMonster.ability2,
        effect: ability2Details ? ability2Details.Effect : 'No description available'
      }
    }
  });
});

/**
 * @desc    Use scroll of secrets
 * @route   POST /api/town/mega-mart/use-scroll-of-secrets
 * @access  Private
 */
const useScrollOfSecrets = asyncHandler(async (req, res) => {
  const { monsterId, trainerId, abilityName, abilitySlot } = req.body;

  // Validate input
  if (!monsterId || !trainerId || !abilityName || !abilitySlot) {
    res.status(400);
    throw new Error('Monster ID, trainer ID, ability name, and ability slot are required');
  }

  // Validate ability slot
  if (abilitySlot !== 'ability1' && abilitySlot !== 'ability2') {
    res.status(400);
    throw new Error('Ability slot must be either "ability1" or "ability2"');
  }

  // Get monster
  const monster = await Monster.getById(monsterId);
  if (!monster) {
    res.status(404);
    throw new Error('Monster not found');
  }

  // Check if monster belongs to trainer
  if (monster.trainer_id !== parseInt(trainerId)) {
    res.status(403);
    throw new Error('This monster does not belong to the specified trainer');
  }

  // Check if ability exists
  const ability = await Ability.getByName(abilityName);
  if (!ability) {
    res.status(404);
    throw new Error('Ability not found');
  }

  // Check if trainer has a scroll of secrets
  const inventory = await TrainerInventory.getByTrainerId(trainerId);
  const items = inventory.items ? JSON.parse(inventory.items) : {};
  
  if (!items['Scroll of Secrets'] || items['Scroll of Secrets'] < 1) {
    res.status(400);
    throw new Error('Trainer does not have a Scroll of Secrets');
  }

  // Update monster ability
  const updateData = {};
  updateData[abilitySlot] = abilityName;
  await Monster.update(monsterId, updateData);

  // Use the item
  items['Scroll of Secrets'] -= 1;
  await TrainerInventory.updateItemQuantity(inventory.id, 'items', 'Scroll of Secrets', items['Scroll of Secrets']);

  // Get updated monster
  const updatedMonster = await Monster.getById(monsterId);

  // Get ability details
  const ability1Details = await Ability.getByName(updatedMonster.ability1);
  const ability2Details = await Ability.getByName(updatedMonster.ability2);

  res.json({
    success: true,
    message: `Scroll of Secrets used successfully. ${abilitySlot === 'ability1' ? 'Ability 1' : 'Ability 2'} has been set to ${abilityName}.`,
    abilities: {
      ability1: {
        name: updatedMonster.ability1,
        effect: ability1Details ? ability1Details.effect : 'No description available'
      },
      ability2: {
        name: updatedMonster.ability2,
        effect: ability2Details ? ability2Details.effect : 'No description available'
      }
    }
  });
});

/**
 * @desc    Get all abilities
 * @route   GET /api/town/mega-mart/abilities
 * @access  Private
 */
const getAllAbilities = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'abilityname',
    sortOrder = 'asc'
  } = req.query;

  const result = await Ability.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    sortBy,
    sortOrder
  });

  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
});

module.exports = {
  getMonsterAbilities,
  useAbilityCapsule,
  useScrollOfSecrets,
  getAllAbilities
};
