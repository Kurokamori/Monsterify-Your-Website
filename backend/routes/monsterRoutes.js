const express = require('express');
const router = express.Router();
const {
  getAllMonsters,
  searchMonsters,
  getMonsterById,
  getMonstersByUserId,
  createMonster,
  updateMonster,
  deleteMonster,
  addMonsterImage,
  getMonsterImages,
  setMonsterEvolutionData,
  getMonsterEvolutionData,
  getMonsterMoves,
  getMonsterEvolutionChain,
  getMonsterGallery,
  getMonsterReferences,
  uploadMonsterImage,
  addMonsterLevels,
  addMegaStoneImage,
  addMegaImage,
  getMegaImages,
  getMonsterLineage,
  addMonsterLineage,
  removeMonsterLineage
} = require('../controllers/monsterController');
const { evolveMonster, getEvolutionOptions } = require('../controllers/evolutionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes for /api/monsters

// Get all monsters
router.get('/', getAllMonsters);

// Search monsters
router.get('/search', searchMonsters);

// Get monsters by user ID
router.get('/user/:userId', getMonstersByUserId);

// Get current user's monsters
router.get('/user', getMonstersByUserId);

// Create a new monster
router.post('/', createMonster);

// Get monster by ID
router.get('/:id', getMonsterById);

// Update monster
router.put('/:id', updateMonster);

// Delete monster
router.delete('/:id', deleteMonster);

// Add monster image
router.post('/:id/images', addMonsterImage);

// Get monster images
router.get('/:id/images', getMonsterImages);

// Set monster evolution data
router.post('/:id/evolution', setMonsterEvolutionData);

// Get monster evolution data
router.get('/:id/evolution', getMonsterEvolutionData);

// Get monster evolution chain
router.get('/:id/evolution-chain', getMonsterEvolutionChain);

// Get monster moves
router.get('/:id/moves', getMonsterMoves);

// Get monster gallery
router.get('/:id/gallery', getMonsterGallery);

// Get monster references
router.get('/:id/references', getMonsterReferences);

// Get evolution options for a monster
router.get('/:id/evolution-options', protect, getEvolutionOptions);

// Evolve a monster
router.post('/:id/evolve', protect, upload.single('image'), evolveMonster);

// Upload monster image
router.post('/upload-image', protect, upload.single('image'), uploadMonsterImage);

// Add levels to monster (for level cap reallocation)
router.post('/add-levels', protect, addMonsterLevels);

// Mega image routes
router.get('/:id/mega-images', getMegaImages);
router.post('/:id/mega-stone-image', protect, addMegaStoneImage);
router.post('/:id/mega-image', protect, addMegaImage);

// Lineage routes
router.get('/:id/lineage', getMonsterLineage);
router.post('/:id/lineage', protect, addMonsterLineage);
router.delete('/:id/lineage', protect, removeMonsterLineage);

// Initialize monster (stats, moves, abilities, etc.)
const { initializeMonsterController } = require('../controllers/monsterController');
router.post('/:id/initialize', protect, initializeMonsterController);

// Metadata routes for admin tools
const db = require('../config/db');

router.get('/types', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT type FROM monster_types ORDER BY type';
    const types = await db.asyncAll(query);
    res.json({
      success: true,
      types: types.map(t => t.type)
    });
  } catch (error) {
    console.error('Error fetching monster types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monster types'
    });
  }
});

router.get('/attributes', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT attribute FROM monsters WHERE attribute IS NOT NULL ORDER BY attribute';
    const attributes = await db.asyncAll(query);
    res.json({
      success: true,
      attributes: attributes.map(a => a.attribute)
    });
  } catch (error) {
    console.error('Error fetching monster attributes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monster attributes'
    });
  }
});

router.get('/species', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const query = 'SELECT DISTINCT species_name FROM monsters ORDER BY species_name LIMIT $1';
    const species = await db.asyncAll(query, [limit]);
    res.json({
      success: true,
      species: species.map(s => s.species_name)
    });
  } catch (error) {
    console.error('Error fetching monster species:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monster species'
    });
  }
});

module.exports = router;
