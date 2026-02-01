const asyncHandler = require('express-async-handler');
const RerollSession = require('../models/RerollSession');
const RerollClaim = require('../models/RerollClaim');
const MonsterRoller = require('../models/MonsterRoller');
const ItemRoller = require('../models/ItemRoller');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const MonsterInitializer = require('../utils/MonsterInitializer');

/**
 * Get default user settings for monster roller
 */
const getDefaultUserSettings = () => ({
  pokemon_enabled: true,
  digimon_enabled: true,
  yokai_enabled: true,
  nexomon_enabled: true,
  pals_enabled: true,
  fakemon_enabled: true,
  finalfantasy_enabled: true,
  monsterhunter_enabled: true,
  species_min: 1,
  species_max: 2,
  types_min: 1,
  types_max: 3
});

/**
 * Get default monster roll parameters (for gift/base-stage rolls)
 */
const getDefaultMonsterParams = () => ({
  includeStages: ['base stage', "doesn't evolve"],
  legendary: false,
  mythical: false,
  tableFilters: {
    // Digimon: Only allow Baby I, Baby II, and Rookie (no Champion, Ultimate, Mega, etc.)
    digimon: { includeRanks: ['Baby I', 'Baby II', 'In-Training', 'Rookie'] },
    // Yokai: Only allow lower ranks (E, D, C - no B, A, S)
    yokai: { includeRanks: ['E', 'D', 'C'] },
    // Final Fantasy: Base stage only
    finalfantasy: { includeStages: ['base stage', "doesn't evolve"] },
    // Monster Hunter: Low ranks only
    monsterhunter: { includeRanks: [1, 2, 3] }
  }
});

/**
 * Roll monsters with given parameters
 */
const rollMonsters = async (params, count, userSettings = null) => {
  const settings = userSettings || getDefaultUserSettings();
  const monsters = [];

  for (let i = 0; i < count; i++) {
    const monsterRoller = new MonsterRoller({
      seed: params.seed ? `${params.seed}-${i}` : `${Date.now()}-${i}`,
      userSettings: settings
    });

    const rollParams = {
      ...getDefaultMonsterParams(),
      ...params
    };

    try {
      const monster = await monsterRoller.rollMonster(rollParams);
      if (monster) {
        monsters.push({
          ...monster,
          index: i
        });
      }
    } catch (error) {
      console.error(`Error rolling monster ${i}:`, error);
    }
  }

  return monsters;
};

/**
 * Roll items with given parameters
 */
const rollItems = async (params, count) => {
  const defaultCategories = ['berries', 'pastries', 'evolution', 'helditems', 'balls', 'antiques'];
  const categories = params.categories || defaultCategories;

  const items = await ItemRoller.rollMany({
    category: categories,
    rarity: params.rarity || null,
    quantity: count
  });

  return items.map((item, index) => ({
    ...item,
    index,
    quantity: item.quantity || 1
  }));
};

/**
 * Calculate gift roll counts from gift levels
 */
const calculateGiftCounts = (giftLevels) => ({
  itemCount: Math.ceil(giftLevels / 5),    // 1 item per 5 levels
  monsterCount: Math.floor(giftLevels / 10) // 1 monster per 10 levels
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @desc    Create a new reroll session
 * @route   POST /api/reroller/sessions
 * @access  Private/Admin
 */
const createSession = asyncHandler(async (req, res) => {
  const {
    rollType,
    targetUserId,
    monsterParams,
    itemParams,
    giftLevels,
    monsterCount,
    itemCount,
    monsterClaimLimit,
    itemClaimLimit,
    notes
  } = req.body;

  // Validate roll type
  const validRollTypes = ['monster', 'item', 'combined', 'gift'];
  if (!validRollTypes.includes(rollType)) {
    res.status(400);
    throw new Error('Invalid roll type. Must be monster, item, combined, or gift.');
  }

  // Validate target user exists
  if (!targetUserId) {
    res.status(400);
    throw new Error('Target user ID is required.');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error('Target user not found.');
  }

  // Get target user's monster roller settings (use their preferences, not admin's)
  const targetUserSettings = await User.getMonsterRollerSettings(targetUserId);

  let rolledMonsters = [];
  let rolledItems = [];

  // Generate rolls based on type, using target user's settings
  if (rollType === 'monster') {
    const count = monsterCount || 1;
    rolledMonsters = await rollMonsters(monsterParams || {}, count, targetUserSettings);
  } else if (rollType === 'item') {
    const count = itemCount || 1;
    rolledItems = await rollItems(itemParams || {}, count);
  } else if (rollType === 'combined') {
    const mCount = monsterCount || 1;
    const iCount = itemCount || 1;
    rolledMonsters = await rollMonsters(monsterParams || {}, mCount, targetUserSettings);
    rolledItems = await rollItems(itemParams || {}, iCount);
  } else if (rollType === 'gift') {
    if (!giftLevels || giftLevels < 1) {
      res.status(400);
      throw new Error('Gift levels must be at least 1.');
    }
    const { itemCount: giftItemCount, monsterCount: giftMonsterCount } = calculateGiftCounts(giftLevels);

    // Roll with gift-specific parameters (base stage, no legendaries)
    const giftMonsterParams = {
      ...getDefaultMonsterParams(),
      legendary: false,
      mythical: false
    };

    if (giftMonsterCount > 0) {
      rolledMonsters = await rollMonsters(giftMonsterParams, giftMonsterCount, targetUserSettings);
    }
    if (giftItemCount > 0) {
      rolledItems = await rollItems({
        categories: ['berries', 'pastries', 'evolution', 'balls', 'antiques', 'helditems']
      }, giftItemCount);
    }
  }

  // Create session
  const session = await RerollSession.create({
    rollType,
    targetUserId,
    monsterParams: monsterParams || null,
    itemParams: itemParams || null,
    giftLevels: giftLevels || 0,
    rolledMonsters,
    rolledItems,
    monsterClaimLimit: rollType === 'gift' ? null : (monsterClaimLimit !== undefined ? monsterClaimLimit : null),
    itemClaimLimit: rollType === 'gift' ? null : (itemClaimLimit !== undefined ? itemClaimLimit : null),
    createdBy: req.user.id,
    notes
  });

  res.status(201).json({
    success: true,
    data: session,
    claimUrl: `/claim/${session.token}`
  });
});

/**
 * @desc    List all reroll sessions
 * @route   GET /api/reroller/sessions
 * @access  Private/Admin
 */
const listSessions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const result = await RerollSession.getAll({
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    data: result.sessions,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

/**
 * @desc    Get a single reroll session
 * @route   GET /api/reroller/sessions/:id
 * @access  Private/Admin
 */
const getSession = asyncHandler(async (req, res) => {
  const session = await RerollSession.getById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  // Get claims for this session
  const claims = await RerollClaim.getBySession(session.id);

  res.json({
    success: true,
    data: {
      ...session,
      claims
    }
  });
});

/**
 * @desc    Update a reroll session
 * @route   PUT /api/reroller/sessions/:id
 * @access  Private/Admin
 */
const updateSession = asyncHandler(async (req, res) => {
  const { monsterClaimLimit, itemClaimLimit, status, notes } = req.body;

  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  const updatedSession = await RerollSession.update(req.params.id, {
    monsterClaimLimit,
    itemClaimLimit,
    status,
    notes
  });

  res.json({
    success: true,
    data: updatedSession
  });
});

/**
 * @desc    Delete a reroll session
 * @route   DELETE /api/reroller/sessions/:id
 * @access  Private/Admin
 */
const deleteSession = asyncHandler(async (req, res) => {
  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  await RerollSession.delete(req.params.id);

  res.json({
    success: true,
    message: 'Session deleted successfully.'
  });
});

/**
 * @desc    Update a specific result in a session
 * @route   PUT /api/reroller/sessions/:id/result
 * @access  Private/Admin
 */
const updateResult = asyncHandler(async (req, res) => {
  const { type, index, data } = req.body;

  if (!type || index === undefined || !data) {
    res.status(400);
    throw new Error('Type, index, and data are required.');
  }

  if (!['monster', 'item'].includes(type)) {
    res.status(400);
    throw new Error('Type must be monster or item.');
  }

  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  // Check if this result is already claimed
  const isClaimed = await RerollClaim.isIndexClaimed(session.id, type, index);
  if (isClaimed) {
    res.status(400);
    throw new Error('Cannot modify a claimed result.');
  }

  const updatedSession = await RerollSession.updateResult(req.params.id, type, index, data);

  res.json({
    success: true,
    data: updatedSession
  });
});

/**
 * @desc    Delete a specific result from a session
 * @route   DELETE /api/reroller/sessions/:id/result/:type/:index
 * @access  Private/Admin
 */
const deleteResult = asyncHandler(async (req, res) => {
  const { type, index } = req.params;

  if (!['monster', 'item'].includes(type)) {
    res.status(400);
    throw new Error('Type must be monster or item.');
  }

  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  // Check if this result is already claimed
  const isClaimed = await RerollClaim.isIndexClaimed(session.id, type, parseInt(index));
  if (isClaimed) {
    res.status(400);
    throw new Error('Cannot delete a claimed result.');
  }

  const updatedSession = await RerollSession.deleteResult(req.params.id, type, parseInt(index));

  res.json({
    success: true,
    data: updatedSession
  });
});

/**
 * @desc    Reroll a specific result
 * @route   POST /api/reroller/sessions/:id/reroll-result
 * @access  Private/Admin
 */
const rerollResult = asyncHandler(async (req, res) => {
  const { type, index } = req.body;

  if (!type || index === undefined) {
    res.status(400);
    throw new Error('Type and index are required.');
  }

  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  // Check if this result is already claimed
  const isClaimed = await RerollClaim.isIndexClaimed(session.id, type, index);
  if (isClaimed) {
    res.status(400);
    throw new Error('Cannot reroll a claimed result.');
  }

  // Get target user's settings for reroll
  const targetUserSettings = await User.getMonsterRollerSettings(session.targetUserId);

  let newResult;
  if (type === 'monster') {
    const monsters = await rollMonsters(session.monsterParams || {}, 1, targetUserSettings);
    newResult = monsters[0];
  } else {
    const items = await rollItems(session.itemParams || {}, 1);
    newResult = items[0];
  }

  if (!newResult) {
    res.status(500);
    throw new Error('Failed to generate new result.');
  }

  const updatedSession = await RerollSession.updateResult(req.params.id, type, index, newResult);

  res.json({
    success: true,
    data: updatedSession
  });
});

/**
 * @desc    Reroll entire session
 * @route   POST /api/reroller/sessions/:id/reroll-all
 * @access  Private/Admin
 */
const rerollAll = asyncHandler(async (req, res) => {
  const session = await RerollSession.getById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found.');
  }

  // Check if any results are claimed
  const claims = await RerollClaim.getBySession(session.id);
  if (claims.length > 0) {
    res.status(400);
    throw new Error('Cannot reroll session with existing claims.');
  }

  // Get target user's settings for reroll
  const targetUserSettings = await User.getMonsterRollerSettings(session.targetUserId);

  let rolledMonsters = [];
  let rolledItems = [];

  if (session.rollType === 'monster') {
    rolledMonsters = await rollMonsters(session.monsterParams || {}, session.rolledMonsters.length, targetUserSettings);
  } else if (session.rollType === 'item') {
    rolledItems = await rollItems(session.itemParams || {}, session.rolledItems.length);
  } else if (session.rollType === 'combined') {
    rolledMonsters = await rollMonsters(session.monsterParams || {}, session.rolledMonsters.length, targetUserSettings);
    rolledItems = await rollItems(session.itemParams || {}, session.rolledItems.length);
  } else if (session.rollType === 'gift') {
    const { itemCount, monsterCount } = calculateGiftCounts(session.giftLevels);
    if (monsterCount > 0) {
      rolledMonsters = await rollMonsters(getDefaultMonsterParams(), monsterCount, targetUserSettings);
    }
    if (itemCount > 0) {
      rolledItems = await rollItems({
        categories: ['berries', 'pastries', 'evolution', 'balls', 'antiques', 'helditems']
      }, itemCount);
    }
  }

  const updatedSession = await RerollSession.update(req.params.id, {
    rolledMonsters,
    rolledItems
  });

  res.json({
    success: true,
    data: updatedSession
  });
});

// ============================================================================
// PLAYER ENDPOINTS
// ============================================================================

/**
 * @desc    Check if a token is valid (public, for pre-login check)
 * @route   GET /api/reroller/check/:token
 * @access  Public
 */
const checkToken = asyncHandler(async (req, res) => {
  const session = await RerollSession.getByToken(req.params.token);

  if (!session) {
    res.status(404);
    throw new Error('Invalid or expired claim link.');
  }

  if (session.status !== 'active') {
    res.status(400);
    throw new Error(`This claim link is ${session.status}.`);
  }

  res.json({
    success: true,
    data: {
      valid: true,
      rollType: session.rollType,
      targetUserId: session.targetUserId
    }
  });
});

/**
 * @desc    Get session for claiming (player view)
 * @route   GET /api/reroller/claim/:token
 * @access  Private
 */
const getClaimSession = asyncHandler(async (req, res) => {
  const session = await RerollSession.getByToken(req.params.token);

  if (!session) {
    res.status(404);
    throw new Error('Invalid or expired claim link.');
  }

  if (session.status !== 'active') {
    res.status(400);
    throw new Error(`This claim link is ${session.status}.`);
  }

  // Check if user is the target user
  if (session.targetUserId !== req.user.id) {
    res.status(403);
    throw new Error('This claim link is not for your account.');
  }

  // Get claimed indices
  const monsterClaimedIndices = await RerollSession.getClaimedIndices(session.id, 'monster');
  const itemClaimedIndices = await RerollSession.getClaimedIndices(session.id, 'item');

  // Get remaining claims
  const remaining = await RerollClaim.getRemainingClaims(
    session.id,
    req.user.id,
    session.monsterClaimLimit,
    session.itemClaimLimit
  );

  // Get user's trainers
  const trainers = await Trainer.getByUserId(req.user.discord_id || req.user.id);

  // Mark which results are available (not claimed)
  const availableMonsters = session.rolledMonsters.map((m, i) => ({
    ...m,
    index: i,
    claimed: monsterClaimedIndices.includes(i)
  }));

  const availableItems = session.rolledItems.map((item, i) => ({
    ...item,
    index: i,
    claimed: itemClaimedIndices.includes(i)
  }));

  res.json({
    success: true,
    data: {
      rollType: session.rollType,
      giftLevels: session.giftLevels,
      monsters: availableMonsters,
      items: availableItems,
      monsterClaimLimit: session.monsterClaimLimit,
      itemClaimLimit: session.itemClaimLimit,
      remaining,
      trainers
    }
  });
});

/**
 * @desc    Submit claims
 * @route   POST /api/reroller/claim/:token
 * @access  Private
 */
const submitClaims = asyncHandler(async (req, res) => {
  const { claims } = req.body;

  if (!claims || !Array.isArray(claims) || claims.length === 0) {
    res.status(400);
    throw new Error('Claims array is required.');
  }

  const session = await RerollSession.getByToken(req.params.token);

  if (!session) {
    res.status(404);
    throw new Error('Invalid or expired claim link.');
  }

  if (session.status !== 'active') {
    res.status(400);
    throw new Error(`This claim link is ${session.status}.`);
  }

  // Check if user is the target user
  if (session.targetUserId !== req.user.id) {
    res.status(403);
    throw new Error('This claim link is not for your account.');
  }

  // Separate claims by type
  const monsterClaims = claims.filter(c => c.type === 'monster');
  const itemClaims = claims.filter(c => c.type === 'item');

  // Validate claim limits
  const currentRemaining = await RerollClaim.getRemainingClaims(
    session.id,
    req.user.id,
    session.monsterClaimLimit,
    session.itemClaimLimit
  );

  if (session.monsterClaimLimit !== null &&
      currentRemaining.monstersRemaining !== 'unlimited' &&
      monsterClaims.length > currentRemaining.monstersRemaining) {
    res.status(400);
    throw new Error(`You can only claim ${currentRemaining.monstersRemaining} more monster(s).`);
  }

  if (session.itemClaimLimit !== null &&
      currentRemaining.itemsRemaining !== 'unlimited' &&
      itemClaims.length > currentRemaining.itemsRemaining) {
    res.status(400);
    throw new Error(`You can only claim ${currentRemaining.itemsRemaining} more item(s).`);
  }

  const createdMonsters = [];
  const addedItems = [];

  // Process each claim
  for (const claim of claims) {
    const { type, index, trainerId, name } = claim;

    // Validate trainer ownership
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      res.status(404);
      throw new Error(`Trainer ${trainerId} not found.`);
    }

    // Check trainer belongs to user
    const userDiscordId = req.user.discord_id || req.user.id.toString();
    if (trainer.player_user_id !== userDiscordId && trainer.player_user_id !== req.user.id.toString()) {
      res.status(403);
      throw new Error(`Trainer ${trainer.name} does not belong to you.`);
    }

    // Check if already claimed
    const alreadyClaimed = await RerollClaim.isIndexClaimed(session.id, type, index);
    if (alreadyClaimed) {
      res.status(400);
      throw new Error(`${type} at index ${index} has already been claimed.`);
    }

    if (type === 'monster') {
      const monsterData = session.rolledMonsters[index];
      if (!monsterData) {
        res.status(400);
        throw new Error(`Invalid monster index ${index}.`);
      }

      // Create the monster
      const monsterName = name || monsterData.species1 || 'New Monster';

      // Prepare monster data for creation
      // Note: Don't save species images to the monster record - those are reference only
      const newMonsterData = {
        name: monsterName,
        trainer_id: trainerId,
        level: 1,
        species1: monsterData.species1,
        species2: monsterData.species2 || null,
        species3: monsterData.species3 || null,
        type1: monsterData.type1,
        type2: monsterData.type2 || null,
        type3: monsterData.type3 || null,
        type4: monsterData.type4 || null,
        type5: monsterData.type5 || null,
        attribute: monsterData.attribute || null,
        where_met: 'Reroller Reward',
        date_met: new Date().toISOString().split('T')[0],
        player_user_id: userDiscordId
      };

      // Initialize the monster (adds IVs, stats, moves, abilities)
      const initializedMonster = await MonsterInitializer.initializeMonster(newMonsterData);

      // Create in database
      const createdMonsterId = await Monster.create(initializedMonster);

      createdMonsters.push({
        id: createdMonsterId,
        name: monsterName,
        species1: monsterData.species1,
        trainerId
      });

      // Record claim
      await RerollClaim.create({
        sessionId: session.id,
        userId: req.user.id,
        trainerId,
        claimType: 'monster',
        resultIndex: index,
        claimedData: monsterData,
        monsterName
      });

    } else if (type === 'item') {
      const itemData = session.rolledItems[index];
      if (!itemData) {
        res.status(400);
        throw new Error(`Invalid item index ${index}.`);
      }

      // Add item to trainer's inventory
      const categoryToInventory = {
        'berries': 'berries',
        'pastries': 'pastries',
        'evolution': 'evolution',
        'balls': 'balls',
        'antiques': 'antiques',
        'helditems': 'helditems',
        'eggs': 'eggs',
        'seals': 'seals',
        'keyitems': 'keyitems'
      };

      const category = itemData.category ? itemData.category.toString().toLowerCase() : '';
      const inventoryField = categoryToInventory[category] || 'items';
      const quantity = itemData.quantity || 1;

      await Trainer.updateInventoryItem(trainerId, inventoryField, itemData.name, quantity);

      addedItems.push({
        name: itemData.name,
        category: itemData.category,
        quantity,
        trainerId
      });

      // Record claim
      await RerollClaim.create({
        sessionId: session.id,
        userId: req.user.id,
        trainerId,
        claimType: 'item',
        resultIndex: index,
        claimedData: itemData,
        itemQuantity: quantity
      });
    }
  }

  // Check if session is fully claimed and update status
  const isFullyClaimed = await RerollSession.isFullyClaimed(session.id);
  if (isFullyClaimed) {
    await RerollSession.update(session.id, { status: 'claimed' });
  }

  res.json({
    success: true,
    message: 'Claims processed successfully.',
    data: {
      monsters: createdMonsters,
      items: addedItems
    }
  });
});

module.exports = {
  // Admin
  createSession,
  listSessions,
  getSession,
  updateSession,
  deleteSession,
  updateResult,
  deleteResult,
  rerollResult,
  rerollAll,
  // Player
  checkToken,
  getClaimSession,
  submitClaims
};
