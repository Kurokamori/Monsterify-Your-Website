const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMonsterAbilities,
  useAbilityCapsule,
  useScrollOfSecrets,
  getAllAbilities
} = require('../controllers/megaMartController');

// Routes for /api/town/mega-mart

// Get monster abilities
router.get('/monster/:id/abilities', protect, getMonsterAbilities);

// Use ability capsule
router.post('/use-ability-capsule', protect, useAbilityCapsule);

// Use scroll of secrets
router.post('/use-scroll-of-secrets', protect, useScrollOfSecrets);

// Get all abilities
router.get('/abilities', protect, getAllAbilities);

module.exports = router;
