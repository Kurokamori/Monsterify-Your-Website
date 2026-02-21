import { Router } from 'express';
import { authenticate, requireAdmin } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  getAntiqueAuctions,
  getAuctionCatalogue,
  getCatalogueFilters,
  getTrainerAntiques,
  appraiseAntique,
  getAuctionOptions,
  auctionAntique,
  getAllAntiquesDropdown,
  getAntiqueAuctionById,
  createAntiqueAuction,
  updateAntiqueAuction,
  deleteAntiqueAuction,
  uploadAntiqueImage,
  getAppraisalConfigs,
  saveAppraisalConfig,
  deleteAppraisalConfig,
} from '@controllers/town/antique.controller';

const router = Router();

// =============================================================================
// Public Routes
// =============================================================================

// Catalogue
router.get('/catalogue', getAuctionCatalogue);
router.get('/catalogue/filters', getCatalogueFilters);

// =============================================================================
// Admin Routes (must be before parameterized routes)
// =============================================================================

// All antiques dropdown
router.get('/all-antiques', authenticate, requireAdmin, getAllAntiquesDropdown);

// Antique settings (appraisal configs)
router.get('/appraisal-configs', authenticate, requireAdmin, getAppraisalConfigs);
router.put('/appraisal-configs/:itemName', authenticate, requireAdmin, saveAppraisalConfig);
router.delete('/appraisal-configs/:itemName', authenticate, requireAdmin, deleteAppraisalConfig);

// Backwards compat: /settings now returns same data as /appraisal-configs
router.get('/settings', authenticate, requireAdmin, getAppraisalConfigs);

// Auctions CRUD
router.get('/auctions', authenticate, requireAdmin, getAntiqueAuctions);
router.get('/auctions/:id', authenticate, requireAdmin, getAntiqueAuctionById);
router.post('/auctions', authenticate, requireAdmin, createAntiqueAuction);
router.put('/auctions/:id', authenticate, requireAdmin, updateAntiqueAuction);
router.delete('/auctions/:id', authenticate, requireAdmin, deleteAntiqueAuction);

// Image upload
router.post('/upload', authenticate, requireAdmin, upload.single('image'), uploadAntiqueImage);

// =============================================================================
// Protected Routes
// =============================================================================

// Trainer antiques
router.get('/trainer/:trainerId', authenticate, getTrainerAntiques);

// Appraise an antique
router.post('/appraise', authenticate, appraiseAntique);

// Auction options for an antique
router.get('/auction-options/:antique', authenticate, getAuctionOptions);

// Auction an antique
router.post('/auction', authenticate, auctionAntique);

export default router;
