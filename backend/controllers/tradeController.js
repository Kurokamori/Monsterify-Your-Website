const asyncHandler = require('express-async-handler');
const Trade = require('../models/Trade');
const Monster = require('../models/Monster');
const Trainer = require('../models/Trainer');
const TrainerInventory = require('../models/TrainerInventory');

/**
 * @desc    Get all trade listings
 * @route   GET /api/town/trade/listings
 * @access  Private
 */
const getTradeListings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'pending'
  } = req.query;

  const listings = await Trade.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });

  res.json({
    success: true,
    listings: listings.data,
    pagination: {
      page: listings.page,
      limit: listings.limit,
      total: listings.total,
      totalPages: listings.totalPages
    }
  });
});

/**
 * @desc    Get trade listing by ID
 * @route   GET /api/town/trade/listings/:id
 * @access  Private
 */
const getTradeListingById = asyncHandler(async (req, res) => {
  const listing = await Trade.getById(req.params.id);
  
  if (!listing) {
    res.status(404);
    throw new Error('Trade listing not found');
  }

  res.json({
    success: true,
    listing
  });
});

/**
 * @desc    Create a trade listing
 * @route   POST /api/town/trade/create
 * @access  Private
 */
const createTradeListing = asyncHandler(async (req, res) => {
  const {
    title,
    trainer_id,
    monster_id,
    items,
    notes
  } = req.body;

  // Validate input
  if (!title || !trainer_id) {
    res.status(400);
    throw new Error('Title and trainer ID are required');
  }

  // Check if at least one monster or item is being offered
  if (!monster_id && (!items || Object.keys(items).length === 0)) {
    res.status(400);
    throw new Error('At least one monster or item must be offered');
  }

  // Check if trainer exists
  const trainer = await Trainer.getById(trainer_id);
  if (!trainer) {
    res.status(404);
    throw new Error('Trainer not found');
  }

  // Check if monster exists and belongs to trainer
  if (monster_id) {
    const monster = await Monster.getById(monster_id);
    if (!monster) {
      res.status(404);
      throw new Error('Monster not found');
    }

    if (monster.trainer_id !== parseInt(trainer_id)) {
      res.status(403);
      throw new Error('This monster does not belong to the specified trainer');
    }
  }

  // Check if items exist and belong to trainer
  if (items && Object.keys(items).length > 0) {
    const inventory = await TrainerInventory.getByTrainerId(trainer_id);
    if (!inventory) {
      res.status(404);
      throw new Error('Trainer inventory not found');
    }

    // Parse inventory items
    const inventoryItems = inventory.items ? JSON.parse(inventory.items) : {};
    
    // Check if trainer has all the items
    for (const [itemName, quantity] of Object.entries(items)) {
      if (!inventoryItems[itemName] || inventoryItems[itemName] < quantity) {
        res.status(400);
        throw new Error(`Trainer does not have enough ${itemName}`);
      }
    }
  }

  // Create trade listing
  const listing = await Trade.create({
    title,
    initiator_trainer_id: trainer_id,
    initiator_monsters: monster_id ? [monster_id] : [],
    initiator_items: items || {},
    notes,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Trade listing created successfully',
    listing
  });
});

/**
 * @desc    Offer a trade
 * @route   POST /api/town/trade/offer
 * @access  Private
 */
const offerTrade = asyncHandler(async (req, res) => {
  const {
    listing_id,
    trainer_id,
    monster_id,
    items
  } = req.body;

  // Validate input
  if (!listing_id || !trainer_id) {
    res.status(400);
    throw new Error('Listing ID and trainer ID are required');
  }

  // Check if at least one monster or item is being offered
  if (!monster_id && (!items || Object.keys(items).length === 0)) {
    res.status(400);
    throw new Error('At least one monster or item must be offered');
  }

  // Check if listing exists
  const listing = await Trade.getById(listing_id);
  if (!listing) {
    res.status(404);
    throw new Error('Trade listing not found');
  }

  // Check if listing is still pending
  if (listing.status !== 'pending') {
    res.status(400);
    throw new Error('This trade listing is no longer available');
  }

  // Check if trainer exists
  const trainer = await Trainer.getById(trainer_id);
  if (!trainer) {
    res.status(404);
    throw new Error('Trainer not found');
  }

  // Check if trainer is not the initiator
  if (listing.initiator_trainer_id === parseInt(trainer_id)) {
    res.status(400);
    throw new Error('You cannot offer a trade to your own listing');
  }

  // Check if monster exists and belongs to trainer
  if (monster_id) {
    const monster = await Monster.getById(monster_id);
    if (!monster) {
      res.status(404);
      throw new Error('Monster not found');
    }

    if (monster.trainer_id !== parseInt(trainer_id)) {
      res.status(403);
      throw new Error('This monster does not belong to the specified trainer');
    }
  }

  // Check if items exist and belong to trainer
  if (items && Object.keys(items).length > 0) {
    const inventory = await TrainerInventory.getByTrainerId(trainer_id);
    if (!inventory) {
      res.status(404);
      throw new Error('Trainer inventory not found');
    }

    // Parse inventory items
    const inventoryItems = inventory.items ? JSON.parse(inventory.items) : {};
    
    // Check if trainer has all the items
    for (const [itemName, quantity] of Object.entries(items)) {
      if (!inventoryItems[itemName] || inventoryItems[itemName] < quantity) {
        res.status(400);
        throw new Error(`Trainer does not have enough ${itemName}`);
      }
    }
  }

  // Update trade listing with offer
  const updatedListing = await Trade.update(listing_id, {
    recipient_trainer_id: trainer_id,
    recipient_monsters: monster_id ? [monster_id] : [],
    recipient_items: items || {},
    status: 'offered'
  });

  res.json({
    success: true,
    message: 'Trade offer submitted successfully',
    listing: updatedListing
  });
});

/**
 * @desc    Accept a trade
 * @route   POST /api/town/trade/accept/:id
 * @access  Private
 */
const acceptTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if listing exists
  const listing = await Trade.getById(id);
  if (!listing) {
    res.status(404);
    throw new Error('Trade listing not found');
  }

  // Check if listing has an offer
  if (listing.status !== 'offered') {
    res.status(400);
    throw new Error('This trade listing does not have a pending offer');
  }

  // Process the trade
  const result = await Trade.processTrade(id);

  res.json({
    success: true,
    message: 'Trade accepted and processed successfully',
    trade: result
  });
});

/**
 * @desc    Reject a trade
 * @route   POST /api/town/trade/reject/:id
 * @access  Private
 */
const rejectTrade = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if listing exists
  const listing = await Trade.getById(id);
  if (!listing) {
    res.status(404);
    throw new Error('Trade listing not found');
  }

  // Check if listing has an offer
  if (listing.status !== 'offered') {
    res.status(400);
    throw new Error('This trade listing does not have a pending offer');
  }

  // Update trade listing
  const updatedListing = await Trade.update(id, {
    recipient_trainer_id: null,
    recipient_monsters: [],
    recipient_items: {},
    status: 'pending'
  });

  res.json({
    success: true,
    message: 'Trade offer rejected',
    listing: updatedListing
  });
});

/**
 * @desc    Cancel a trade listing
 * @route   POST /api/town/trade/cancel/:id
 * @access  Private
 */
const cancelTradeListing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if listing exists
  const listing = await Trade.getById(id);
  if (!listing) {
    res.status(404);
    throw new Error('Trade listing not found');
  }

  // Check if listing is still pending or offered
  if (listing.status !== 'pending' && listing.status !== 'offered') {
    res.status(400);
    throw new Error('This trade listing cannot be cancelled');
  }

  // Update trade listing
  const updatedListing = await Trade.update(id, {
    status: 'cancelled'
  });

  res.json({
    success: true,
    message: 'Trade listing cancelled',
    listing: updatedListing
  });
});

module.exports = {
  getTradeListings,
  getTradeListingById,
  createTradeListing,
  offerTrade,
  acceptTrade,
  rejectTrade,
  cancelTradeListing
};
