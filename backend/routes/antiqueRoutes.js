const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const antiqueController = require('../controllers/antiqueController');

// Public catalogue routes (no auth required to browse)
router.get('/catalogue', antiqueController.getAuctionCatalogue);
router.get('/catalogue/filters', antiqueController.getCatalogueFilters);

// Get antique roll settings (admin only)
router.get('/settings', protect, admin, antiqueController.getAntiqueRollSettings);

// Get antique auctions (admin only)
router.get('/auctions', protect, admin, antiqueController.getAntiqueAuctions);

// Get trainer's antiques
router.get('/trainer/:trainerId', protect, antiqueController.getTrainerAntiques);

// Appraise an antique
router.post('/appraise', protect, antiqueController.appraiseAntique);

// Get auction options for an antique
router.get('/auction-options/:antique', protect, antiqueController.getAuctionOptions);

// Auction an antique
router.post('/auction', protect, antiqueController.auctionAntique);

module.exports = router;
