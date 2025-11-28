const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const trainerRoutes = require('./trainerRoutes');
const monsterRoutes = require('./monsterRoutes');
const fakemonRoutes = require('./fakemonRoutes');
const statisticsRoutes = require('./statisticsRoutes');
const contentRoutes = require('./contentRoutes');
const guidesRoutes = require('./guidesRoutes');
const submissionRoutes = require('./submissionRoutes');
const itemRoutes = require('./itemRoutes');
const pokemonMonsterRoutes = require('./pokemonMonsterRoutes');
const digimonMonsterRoutes = require('./digimonMonsterRoutes');
const yokaiMonsterRoutes = require('./yokaiMonsterRoutes');
const nexomonMonsterRoutes = require('./nexomonMonsterRoutes');
const palsMonsterRoutes = require('./palsMonsterRoutes');
const adminRoutes = require('./adminRoutes');
const evolutionRoutes = require('./evolutionRoutes');

// Import shop, item roller, monster roller, starter roller, and species routes
const shopRoutes = require('./api/shops');
const itemRollerRoutes = require('./api/itemRoller');
const monsterRollerRoutes = require('./api/monsterRoller');
const starterRollerRoutes = require('./api/starterRoller');
const speciesRoutes = require('./api/species');

// Import town activities, game corner, and adoption routes
const townActivitiesRoutes = require('./api/townActivities');
const gameCornerRoutes = require('./api/gameCorner');
const adoptionRoutes = require('./adoption');
const itemsRoutes = require('./itemsRoutes');
const megaMartRoutes = require('./megaMartRoutes');
const tradeRoutes = require('./tradeRoutes');
const automatedTradeRoutes = require('./automatedTradeRoutes');
const bazarRoutes = require('./bazarRoutes');
const gardenRoutes = require('./api/gardenRoutes');
const antiqueRoutes = require('./antiqueRoutes');
const breedingRoutes = require('./breedingRoutes');
const nurseryRoutes = require('./nurseryRoutes');
const scheduledTasksRoutes = require('./scheduledTasksRoutes');
const artTodoRoutes = require('./artTodoRoutes');
const bossRoutes = require('./bossRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const adventureRoutes = require('./adventureRoutes');
const missionRoutes = require('./missionRoutes');
const factionRoutes = require('./factionRoutes');
const eventsRoutes = require('./eventsRoutes');
const promptRoutes = require('./promptRoutes');
const areaRoutes = require('./areaRoutes');

// Use routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trainers', trainerRoutes);
router.use('/monsters', monsterRoutes);

// Monster metadata routes for admin tools
router.get('/monsters/types', async (req, res) => {
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

router.get('/monsters/attributes', async (req, res) => {
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

router.get('/monsters/species', async (req, res) => {
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

router.use('/fakedex', fakemonRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/content', contentRoutes);
router.use('/guides', guidesRoutes);
router.use('/submissions', submissionRoutes);
router.use('/items', itemRoutes);
router.use('/pokemon-monsters', pokemonMonsterRoutes);
router.use('/digimon-monsters', digimonMonsterRoutes);
router.use('/yokai-monsters', yokaiMonsterRoutes);
router.use('/nexomon-monsters', nexomonMonsterRoutes);
router.use('/pals-monsters', palsMonsterRoutes);

// Use shop, item roller, monster roller, starter roller, and species routes
router.use('/shops', shopRoutes);
router.use('/item-roller', itemRollerRoutes);
router.use('/monster-roller', monsterRollerRoutes);
router.use('/starter-roller', starterRollerRoutes);
router.use('/species', speciesRoutes);

// Use admin routes
router.use('/admin', adminRoutes);

// Use evolution routes
router.use('/evolution', evolutionRoutes);

// Use town activities, game corner, and adoption routes
router.use('/town/activities', townActivitiesRoutes);
router.use('/town/game-corner', gameCornerRoutes);
router.use('/town/mega-mart', megaMartRoutes);
router.use('/town/trade', tradeRoutes);
router.use('/town/automated-trade', automatedTradeRoutes);
router.use('/town/bazar', bazarRoutes);
router.use('/garden', gardenRoutes);
router.use('/adoption', adoptionRoutes);
router.use('/items', itemsRoutes);
router.use('/antiques', antiqueRoutes);
router.use('/town/farm/breed', breedingRoutes);
router.use('/nursery', nurseryRoutes);
router.use('/scheduled-tasks', scheduledTasksRoutes);
router.use('/art-todo', artTodoRoutes);
router.use('/bosses', bossRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/adventures', adventureRoutes);
router.use('/missions', missionRoutes);
router.use('/factions', factionRoutes);
router.use('/events', eventsRoutes);
router.use('/prompts', promptRoutes);
router.use('/areas', areaRoutes);

module.exports = router;
