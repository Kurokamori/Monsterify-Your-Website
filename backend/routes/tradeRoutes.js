const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTradeListings,
  getTradeListingById,
  createTradeListing,
  offerTrade,
  acceptTrade,
  rejectTrade,
  cancelTradeListing
} = require('../controllers/tradeController');

// Routes for /api/town/trade

// Get all trade listings
router.get('/listings', protect, getTradeListings);

// Get trade listing by ID
router.get('/listings/:id', protect, getTradeListingById);

// Create a trade listing
router.post('/create', protect, createTradeListing);

// Offer a trade
router.post('/offer', protect, offerTrade);

// Accept a trade
router.post('/accept/:id', protect, acceptTrade);

// Reject a trade
router.post('/reject/:id', protect, rejectTrade);

// Cancel a trade listing
router.post('/cancel/:id', protect, cancelTradeListing);

module.exports = router;
