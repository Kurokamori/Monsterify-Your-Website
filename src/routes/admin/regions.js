const express = require('express');
const router = express.Router();
const Region = require('../../models/Region');
const Area = require('../../models/Area');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('Access denied');
  }
  next();
};

/**
 * @route GET /admin/regions
 * @desc Get all regions (admin view)
 * @access Admin
 */
router.get('/', isAdmin, async (req, res) => {
  try {
    // Ensure regions table exists
    await Region.createTableIfNotExists();

    const regions = await Region.getAll(false);

    res.render('admin/regions/index', {
      title: 'Manage Regions',
      regions,
      message: req.query.message,
      messageType: req.query.messageType
    });
  } catch (error) {
    console.error('Error getting regions:', error);
    res.status(500).send('Error getting regions');
  }
});

/**
 * @route GET /admin/regions/create
 * @desc Show region creation form
 * @access Admin
 */
router.get('/create', isAdmin, (req, res) => {
  res.render('admin/regions/create', {
    title: 'Create Region'
  });
});

/**
 * @route POST /admin/regions/create
 * @desc Create a new region
 * @access Admin
 */
router.post('/create', isAdmin, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).send('Region name is required');
    }

    // Create the region
    await Region.create({
      name,
      description,
      image_url
    });

    res.redirect('/admin/regions?message=Region created successfully&messageType=success');
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).send('Error creating region');
  }
});

/**
 * @route GET /admin/regions/edit/:regionId
 * @desc Show region edit form
 * @access Admin
 */
router.get('/edit/:regionId', isAdmin, async (req, res) => {
  try {
    const regionId = req.params.regionId;
    const region = await Region.getById(regionId);

    if (!region) {
      return res.status(404).send('Region not found');
    }

    res.render('admin/regions/edit', {
      title: 'Edit Region',
      region
    });
  } catch (error) {
    console.error('Error getting region:', error);
    res.status(500).send('Error getting region');
  }
});

/**
 * @route POST /admin/regions/edit/:regionId
 * @desc Update a region
 * @access Admin
 */
router.post('/edit/:regionId', isAdmin, async (req, res) => {
  try {
    const regionId = req.params.regionId;
    const { name, description, image_url, is_active } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).send('Region name is required');
    }

    // Update the region
    await Region.update(regionId, {
      name,
      description,
      image_url,
      is_active: is_active === 'on' || is_active === true
    });

    res.redirect('/admin/regions?message=Region updated successfully&messageType=success');
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).send('Error updating region');
  }
});

/**
 * @route POST /admin/regions/delete/:regionId
 * @desc Delete a region
 * @access Admin
 */
router.post('/delete/:regionId', isAdmin, async (req, res) => {
  try {
    const regionId = req.params.regionId;

    // Check if there are areas associated with this region
    const areas = await Area.getByRegionId(regionId, false);
    if (areas.length > 0) {
      return res.redirect('/admin/regions?message=Cannot delete region with associated areas&messageType=error');
    }

    // Delete the region
    await Region.delete(regionId);

    res.redirect('/admin/regions?message=Region deleted successfully&messageType=success');
  } catch (error) {
    console.error('Error deleting region:', error);
    res.redirect(`/admin/regions?message=${error.message || 'Error deleting region'}&messageType=error`);
  }
});

module.exports = router;
