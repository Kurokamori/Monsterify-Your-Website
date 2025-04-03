const express = require('express');
const router = express.Router();
const Region = require('../../models/Region');
const Area = require('../../models/Area');
const Adventure = require('../../models/Adventure');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('Access denied');
  }
  next();
};

/**
 * @route GET /admin/areas
 * @desc Get all areas (admin view)
 * @access Admin
 */
router.get('/', isAdmin, async (req, res) => {
  try {
    // Ensure areas table exists
    await Area.createTableIfNotExists();

    // Get all areas with region information
    const areas = await Area.getAll(false);
    
    // Get all regions for the dropdown
    const regions = await Region.getAll(false);

    // Map region names to areas
    const areasWithRegions = await Promise.all(areas.map(async (area) => {
      const region = await Region.getById(area.region_id);
      return {
        ...area,
        region_name: region ? region.name : 'Unknown'
      };
    }));

    res.render('admin/areas/index', {
      title: 'Manage Areas',
      areas: areasWithRegions,
      regions,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting areas:', error);
    res.status(500).send('Error getting areas');
  }
});

/**
 * @route GET /admin/areas/create
 * @desc Show area creation form
 * @access Admin
 */
router.get('/create', isAdmin, async (req, res) => {
  try {
    // Get all regions for the dropdown
    const regions = await Region.getAll(true);

    res.render('admin/areas/create', {
      title: 'Create Area',
      regions
    });
  } catch (error) {
    console.error('Error getting regions for area creation:', error);
    res.status(500).send('Error getting regions');
  }
});

/**
 * @route POST /admin/areas/create
 * @desc Create a new area
 * @access Admin
 */
router.post('/create', isAdmin, async (req, res) => {
  try {
    const { region_id, name, description, image_url } = req.body;

    // Validate input
    if (!name || !region_id) {
      return res.status(400).send('Area name and region are required');
    }

    // Create the area
    await Area.create({
      region_id,
      name,
      description,
      image_url
    });

    res.redirect('/admin/areas?message=Area created successfully&messageType=success');
  } catch (error) {
    console.error('Error creating area:', error);
    res.status(500).send('Error creating area');
  }
});

/**
 * @route GET /admin/areas/edit/:areaId
 * @desc Show area edit form
 * @access Admin
 */
router.get('/edit/:areaId', isAdmin, async (req, res) => {
  try {
    const areaId = req.params.areaId;
    const area = await Area.getById(areaId);

    if (!area) {
      return res.status(404).send('Area not found');
    }

    // Get all regions for the dropdown
    const regions = await Region.getAll(false);

    res.render('admin/areas/edit', {
      title: 'Edit Area',
      area,
      regions
    });
  } catch (error) {
    console.error('Error getting area:', error);
    res.status(500).send('Error getting area');
  }
});

/**
 * @route POST /admin/areas/edit/:areaId
 * @desc Update an area
 * @access Admin
 */
router.post('/edit/:areaId', isAdmin, async (req, res) => {
  try {
    const areaId = req.params.areaId;
    const { region_id, name, description, image_url, is_active } = req.body;

    // Validate input
    if (!name || !region_id) {
      return res.status(400).send('Area name and region are required');
    }

    // Update the area
    await Area.update(areaId, {
      region_id,
      name,
      description,
      image_url,
      is_active: is_active === 'on' || is_active === true
    });

    res.redirect('/admin/areas?message=Area updated successfully&messageType=success');
  } catch (error) {
    console.error('Error updating area:', error);
    res.status(500).send('Error updating area');
  }
});

/**
 * @route POST /admin/areas/delete/:areaId
 * @desc Delete an area
 * @access Admin
 */
router.post('/delete/:areaId', isAdmin, async (req, res) => {
  try {
    const areaId = req.params.areaId;

    // Check if there are adventures associated with this area
    const adventures = await Adventure.getAll();
    const hasAdventures = adventures.some(adv => adv.area_id === parseInt(areaId));
    
    if (hasAdventures) {
      return res.redirect('/admin/areas?message=Cannot delete area with associated adventures&messageType=error');
    }

    // Delete the area
    await Area.delete(areaId);

    res.redirect('/admin/areas?message=Area deleted successfully&messageType=success');
  } catch (error) {
    console.error('Error deleting area:', error);
    res.redirect(`/admin/areas?message=${error.message || 'Error deleting area'}&messageType=error`);
  }
});

module.exports = router;
