const express = require('express');
const router = express.Router();

// Item definitions with their effects on monster rolling
const EGG_ITEMS = {
  'Species Items': [
    { 
      id: 'pokemon_essence',
      name: 'Pokémon Essence',
      effect: {
        overrideParams: { species: 'Pokemon' }
      }
    },
    {
      id: 'digimon_essence',
      name: 'Digimon Essence',
      effect: {
        overrideParams: { species: 'Digimon' }
      }
    },
    {
      id: 'yokai_essence',
      name: 'Yokai Essence',
      effect: {
        overrideParams: { species: 'Yokai' }
      }
    }
  ],
  'Type Items': [
    {
      id: 'fire_shard',
      name: 'Fire Shard',
      effect: {
        overrideParams: { types: 'Fire' }
      }
    },
    {
      id: 'water_shard',
      name: 'Water Shard',
      effect: {
        overrideParams: { types: 'Water' }
      }
    },
    // Add more type items as needed
  ],
  'Fusion Items': [
    {
      id: 'fusion_catalyst',
      name: 'Fusion Catalyst',
      effect: {
        overrideParams: { forceFusion: true }
      }
    },
    {
      id: 'pure_essence',
      name: 'Pure Essence',
      effect: {
        overrideParams: { forceNoFusion: true }
      }
    }
  ],
  'Rarity Items': [
    {
      id: 'rare_incense',
      name: 'Rare Incense',
      effect: {
        filters: {
          pokemon: { rarity: ['Rare', 'Very Rare'] },
          digimon: { stage: ['Champion', 'Ultimate'] },
          yokai: { rank: ['A', 'S'] }
        }
      }
    }
  ]
};

/**
 * Get available egg items
 * GET /api/items/egg-items
 */
router.get('/egg-items', (req, res) => {
  try {
    res.json(EGG_ITEMS);
  } catch (error) {
    console.error('Error fetching egg items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;