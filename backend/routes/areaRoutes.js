const express = require('express');
const router = express.Router();
const areaConfigurations = require('../config/areaConfigurations');

/**
 * @route GET /api/areas/landmasses
 * @desc Get all available landmasses
 * @access Public
 */
router.get('/landmasses', async (req, res) => {
  try {
    // Extract unique landmasses from area configurations
    const landmasses = {};
    
    Object.values(areaConfigurations).forEach(area => {
      if (!landmasses[area.landmass]) {
        landmasses[area.landmass] = {
          id: area.landmass,
          name: area.landmassName,
          regions: {}
        };
      }
    });

    res.json({
      success: true,
      landmasses: Object.values(landmasses)
    });

  } catch (error) {
    console.error('Error getting landmasses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get landmasses',
      error: error.message
    });
  }
});

/**
 * @route GET /api/areas/landmasses/:landmassId/regions
 * @desc Get regions for a specific landmass
 * @access Public
 */
router.get('/landmasses/:landmassId/regions', async (req, res) => {
  try {
    const { landmassId } = req.params;
    const regions = {};
    
    // Extract regions for the specified landmass
    Object.values(areaConfigurations).forEach(area => {
      if (area.landmass === landmassId) {
        if (!regions[area.region]) {
          regions[area.region] = {
            id: area.region,
            name: area.regionName,
            landmassId: area.landmass,
            landmassName: area.landmassName,
            areas: []
          };
        }
      }
    });

    res.json({
      success: true,
      regions: Object.values(regions)
    });

  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get regions',
      error: error.message
    });
  }
});

/**
 * @route GET /api/areas/regions/:regionId/areas
 * @desc Get areas for a specific region
 * @access Public
 */
router.get('/regions/:regionId/areas', async (req, res) => {
  try {
    const { regionId } = req.params;
    const areas = [];
    
    // Extract areas for the specified region
    Object.entries(areaConfigurations).forEach(([areaId, area]) => {
      if (area.region === regionId) {
        areas.push({
          id: areaId,
          name: area.area_name || areaId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          regionId: area.region,
          regionName: area.regionName,
          landmassId: area.landmass,
          landmassName: area.landmassName,
          welcomeMessage: area.welcomeMessages?.base || `Welcome to ${area.area_name || areaId}!`,
          battleParameters: area.battleParameters,
          monsterRollerParameters: area.monsterRollerParameters
        });
      }
    });

    res.json({
      success: true,
      areas: areas
    });

  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get areas',
      error: error.message
    });
  }
});

/**
 * @route GET /api/areas/:areaId/configuration
 * @desc Get configuration for a specific area
 * @access Public
 */
router.get('/:areaId/configuration', async (req, res) => {
  try {
    const { areaId } = req.params;
    const areaConfig = areaConfigurations[areaId];
    
    if (!areaConfig) {
      return res.status(404).json({
        success: false,
        message: 'Area configuration not found'
      });
    }

    res.json({
      success: true,
      configuration: {
        areaId,
        landmass: areaConfig.landmass,
        landmassName: areaConfig.landmassName,
        region: areaConfig.region,
        regionName: areaConfig.regionName,
        welcomeMessages: areaConfig.welcomeMessages,
        battleParameters: areaConfig.battleParameters,
        monsterRollerParameters: areaConfig.monsterRollerParameters,
        specialEncounters: areaConfig.specialEncounters,
        itemRequirements: areaConfig.itemRequirements,
        levelRange: areaConfig.levelRange,
        agroRange: areaConfig.agroRange
      }
    });

  } catch (error) {
    console.error('Error getting area configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area configuration',
      error: error.message
    });
  }
});

/**
 * @route GET /api/areas/hierarchy
 * @desc Get complete area hierarchy (landmasses -> regions -> areas)
 * @access Public
 */
router.get('/hierarchy', async (req, res) => {
  try {
    const hierarchy = {};
    
    // Build complete hierarchy from area configurations
    Object.entries(areaConfigurations).forEach(([areaId, area]) => {
      // Initialize landmass if not exists
      if (!hierarchy[area.landmass]) {
        hierarchy[area.landmass] = {
          id: area.landmass,
          name: area.landmassName,
          regions: {}
        };
      }
      
      // Initialize region if not exists
      if (!hierarchy[area.landmass].regions[area.region]) {
        hierarchy[area.landmass].regions[area.region] = {
          id: area.region,
          name: area.regionName,
          areas: {}
        };
      }
      
      // Add area
      hierarchy[area.landmass].regions[area.region].areas[areaId] = {
        id: areaId,
        name: area.area_name || areaId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        welcomeMessage: area.welcomeMessages?.base || `Welcome to ${area.area_name || areaId}!`
      };
    });

    // Convert to arrays for easier frontend consumption
    const landmasses = Object.values(hierarchy).map(landmass => ({
      ...landmass,
      regions: Object.values(landmass.regions).map(region => ({
        ...region,
        areas: Object.values(region.areas)
      }))
    }));

    res.json({
      success: true,
      hierarchy: landmasses
    });

  } catch (error) {
    console.error('Error getting area hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area hierarchy',
      error: error.message
    });
  }
});

module.exports = router;
