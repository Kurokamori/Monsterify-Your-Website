const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const antiqueController = require('../controllers/antiqueController');
const upload = require('../middleware/uploadMiddleware');

// Public catalogue routes (no auth required to browse)
router.get('/catalogue', antiqueController.getAuctionCatalogue);
router.get('/catalogue/filters', antiqueController.getCatalogueFilters);

// Get antique roll settings (admin only)
router.get('/settings', protect, admin, antiqueController.getAntiqueRollSettings);

// Get all antiques for dropdown (admin only)
router.get('/all-antiques', protect, admin, antiqueController.getAllAntiquesDropdown);

// Get antique auctions (admin only)
router.get('/auctions', protect, admin, antiqueController.getAntiqueAuctions);

// Get specific antique auction by ID (admin only)
router.get('/auctions/:id', protect, admin, antiqueController.getAntiqueAuctionById);

// Create antique auction (admin only)
router.post('/auctions', protect, admin, antiqueController.createAntiqueAuction);

// Update antique auction (admin only)
router.put('/auctions/:id', protect, admin, antiqueController.updateAntiqueAuction);

// Delete antique auction (admin only)
router.delete('/auctions/:id', protect, admin, antiqueController.deleteAntiqueAuction);

// Upload image for antique auction (admin only)
router.post('/upload', protect, admin, upload.single('image'), antiqueController.uploadAntiqueImage);

// Get trainer's antiques
router.get('/trainer/:trainerId', protect, antiqueController.getTrainerAntiques);

// Appraise an antique
router.post('/appraise', protect, antiqueController.appraiseAntique);

// Get auction options for an antique
router.get('/auction-options/:antique', protect, antiqueController.getAuctionOptions);

// Auction an antique
router.post('/auction', protect, antiqueController.auctionAntique);

module.exports = router;
