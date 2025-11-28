const express = require('express');
const router = express.Router();
const {
  getAllNexomonMonsters,
  getNexomonMonsterByNr,
  createNexomonMonster,
  updateNexomonMonster,
  deleteNexomonMonster
} = require('../controllers/nexomonMonsterController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for /api/nexomon-monsters

// Public routes
router.get('/', getAllNexomonMonsters);
router.get('/:nr', getNexomonMonsterByNr);

// Admin routes - protected by authentication and admin middleware
router.post('/', protect, admin, createNexomonMonster);
router.put('/:nr', protect, admin, updateNexomonMonster);
router.delete('/:nr', protect, admin, deleteNexomonMonster);

module.exports = router;
