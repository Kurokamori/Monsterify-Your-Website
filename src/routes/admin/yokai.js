const express = require('express');
const router = express.Router();
const Yokai = require('../../models/Yokai');
const { ensureAdmin } = require('../../middleware/auth');
const multer = require('multer');
const upload = multer();
const path = require('path');

/**
 * @route GET /admin/yokai
 * @desc List all Yokai (admin view)
 * @access Admin
 */
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const yokai = await Yokai.getAll();

    res.render('admin/yokai/index', {
      title: 'Manage Yokai',
      yokai,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error fetching Yokai:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/yokai/new
 * @desc Show form to add a new Yokai
 * @access Admin
 */
router.get('/new', ensureAdmin, (req, res) => {
  res.render('admin/yokai/form', {
    title: 'Add New Yokai',
    yokai: {
      id: '',
      Name: '',
      Rank: '',
      Tribe: '',
      Attribute: ''
    },
    isNew: true
  });
});

/**
 * @route GET /admin/yokai/edit/:name
 * @desc Show form to edit a Yokai
 * @access Admin
 */
router.get('/edit/:name', ensureAdmin, async (req, res) => {
  try {
    const yokai = await Yokai.getByName(req.params.name);

    if (!yokai) {
      return res.redirect('/admin/yokai?message=Yokai not found&messageType=error');
    }

    res.render('admin/yokai/form', {
      title: `Edit Yokai: ${yokai.Name}`,
      yokai,
      isNew: false
    });
  } catch (error) {
    console.error('Error fetching Yokai for edit:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/yokai/save
 * @desc Save a new or updated Yokai
 * @access Admin
 */
router.post('/save', ensureAdmin, async (req, res) => {
  try {
    const isNew = req.body.isNew === 'true';

    const yokai = {
      id: req.body.id || null,
      Name: req.body.Name,
      Rank: req.body.Rank,
      Tribe: req.body.Tribe,
      Attribute: req.body.Attribute || null
    };

    if (isNew) {
      await Yokai.create(yokai);
      res.redirect('/admin/yokai?message=Yokai added successfully');
    } else {
      await Yokai.update(yokai);
      res.redirect('/admin/yokai?message=Yokai updated successfully');
    }
  } catch (error) {
    console.error('Error saving Yokai:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/yokai/delete/:name
 * @desc Delete a Yokai
 * @access Admin
 */
router.post('/delete/:name', ensureAdmin, async (req, res) => {
  try {
    const result = await Yokai.delete(req.params.name);

    if (result) {
      res.redirect('/admin/yokai?message=Yokai deleted successfully');
    } else {
      res.redirect('/admin/yokai?message=Failed to delete Yokai&messageType=error');
    }
  } catch (error) {
    console.error('Error deleting Yokai:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/yokai/mass-add
 * @desc Show form to add multiple Yokai at once
 * @access Admin
 */
router.get('/mass-add', ensureAdmin, (req, res) => {
  res.render('admin/yokai/mass-add', {
    title: 'Mass Add Yokai'
  });
});

/**
 * @route POST /admin/yokai/mass-add
 * @desc Process mass add of Yokai
 * @access Admin
 */
router.post('/mass-add', ensureAdmin, upload.none(), async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Request body keys:', Object.keys(req.body));

    // Get the common settings
    const startingNumber = parseInt(req.body.startingNumber) || 1;
    const commonRank = req.body.commonRank || 'E';
    const commonTribe = req.body.commonTribe || 'Charming';
    const commonElement = req.body.commonElement || 'None';
    const commonRarity = req.body.commonRarity || 'Common';
    const commonRole = req.body.commonRole || 'Balanced';

    // Get the total count of Yokai to add
    const yokaiCount = parseInt(req.body.yokaiCount) || 0;

    console.log('Starting number:', startingNumber);
    console.log('Common rank:', commonRank);
    console.log('Common tribe:', commonTribe);
    console.log('Common element:', commonElement);
    console.log('Common rarity:', commonRarity);
    console.log('Common role:', commonRole);
    console.log('Yokai count:', yokaiCount);

    // Process each Yokai
    const results = [];
    const errors = [];
    const usedNames = new Set();

    for (let i = 0; i < yokaiCount; i++) {
      try {
        // Get the Yokai data
        const name = req.body[`name_${i}`];
        if (!name) continue;

        // Check for duplicate names
        if (usedNames.has(name)) {
          const errorMsg = `Duplicate name ${name} found. Skipping this Yokai.`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        usedNames.add(name);

        // Get the Yokai number
        let number = req.body[`number_${i}`];
        if (!number) {
          number = startingNumber + i;
        }

        // Get the rank, tribe, element, rarity, and role
        const rank = req.body[`rank_${i}`] === 'inherit' ? commonRank : req.body[`rank_${i}`];
        const tribe = req.body[`tribe_${i}`] === 'inherit' ? commonTribe : req.body[`tribe_${i}`];
        const element = req.body[`element_${i}`] === 'inherit' ? commonElement : req.body[`element_${i}`];
        const rarity = req.body[`rarity_${i}`] === 'inherit' ? commonRarity : req.body[`rarity_${i}`];
        const role = req.body[`role_${i}`] === 'inherit' ? commonRole : req.body[`role_${i}`];

        // Create the Yokai object
        const yokai = {
          id: parseInt(number),
          Name: name,
          Rank: rank,
          Tribe: tribe,
          Attribute: element,
          Rarity: rarity,
          Role: role
        };

        console.log(`Creating Yokai: ${name}`);

        // Save the Yokai
        await Yokai.create(yokai);
        results.push(name);
        console.log(`Successfully created Yokai: ${name}`);
      } catch (error) {
        console.error(`Error processing Yokai ${i}:`, error);
        errors.push(`Error processing Yokai ${i}: ${error.message}`);
      }
    }

    // Return the results
    if (errors.length > 0) {
      const responseMsg = `Added ${results.length} Yokai. Errors: ${errors.join(', ')}`;
      console.log(responseMsg);
      return res.json({
        success: results.length > 0,
        message: responseMsg,
        results,
        errors
      });
    } else {
      const responseMsg = `Successfully added ${results.length} Yokai`;
      console.log(responseMsg);
      return res.json({
        success: true,
        message: responseMsg,
        results
      });
    }
  } catch (error) {
    console.error('Error processing mass add:', error);
    return res.status(500).json({ success: false, message: 'Error processing mass add: ' + error.message });
  }
});

module.exports = router;
