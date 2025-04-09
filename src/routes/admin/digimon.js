const express = require('express');
const router = express.Router();
const Digimon = require('../../models/Digimon');
const { ensureAdmin } = require('../../middleware/auth');
const multer = require('multer');
const upload = multer();
const path = require('path');

/**
 * @route GET /admin/digimon
 * @desc List all Digimon (admin view)
 * @access Admin
 */
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const digimon = await Digimon.getAll();

    res.render('admin/digimon/index', {
      title: 'Manage Digimon',
      digimon,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error fetching Digimon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/digimon/new
 * @desc Show form to add a new Digimon
 * @access Admin
 */
router.get('/new', ensureAdmin, (req, res) => {
  res.render('admin/digimon/form', {
    title: 'Add New Digimon',
    digimon: {
      id: '',
      name: '',
      xAntibody: '',
      Stage: '',
      types: '',
      attributes: '',
      fields: '',
      priorEvolutions: '',
      nextEvolutions: ''
    },
    isNew: true
  });
});

/**
 * @route GET /admin/digimon/edit/:name
 * @desc Show form to edit a Digimon
 * @access Admin
 */
router.get('/edit/:name', ensureAdmin, async (req, res) => {
  try {
    const digimon = await Digimon.getByName(req.params.name);

    if (!digimon) {
      return res.redirect('/admin/digimon?message=Digimon not found&messageType=error');
    }

    res.render('admin/digimon/form', {
      title: `Edit Digimon: ${digimon.name}`,
      digimon,
      isNew: false
    });
  } catch (error) {
    console.error('Error fetching Digimon for edit:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/digimon/save
 * @desc Save a new or updated Digimon
 * @access Admin
 */
router.post('/save', ensureAdmin, async (req, res) => {
  try {
    const isNew = req.body.isNew === 'true';

    const digimon = {
      id: req.body.id ? parseInt(req.body.id) : null,
      name: req.body.name,
      xAntibody: req.body.xAntibody || null,
      Stage: req.body.Stage,
      types: req.body.types,
      attributes: req.body.attributes,
      fields: req.body.fields || null,
      priorEvolutions: req.body.priorEvolutions || null,
      nextEvolutions: req.body.nextEvolutions || null
    };

    if (isNew) {
      await Digimon.create(digimon);
      res.redirect('/admin/digimon?message=Digimon added successfully');
    } else {
      await Digimon.update(digimon);
      res.redirect('/admin/digimon?message=Digimon updated successfully');
    }
  } catch (error) {
    console.error('Error saving Digimon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/digimon/delete/:name
 * @desc Delete a Digimon
 * @access Admin
 */
router.post('/delete/:name', ensureAdmin, async (req, res) => {
  try {
    const result = await Digimon.delete(req.params.name);

    if (result) {
      res.redirect('/admin/digimon?message=Digimon deleted successfully');
    } else {
      res.redirect('/admin/digimon?message=Failed to delete Digimon&messageType=error');
    }
  } catch (error) {
    console.error('Error deleting Digimon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/digimon/mass-add
 * @desc Show form to add multiple Digimon at once
 * @access Admin
 */
router.get('/mass-add', ensureAdmin, (req, res) => {
  res.render('admin/digimon/mass-add', {
    title: 'Mass Add Digimon'
  });
});

/**
 * @route POST /admin/digimon/mass-add
 * @desc Process mass add of Digimon
 * @access Admin
 */
router.post('/mass-add', ensureAdmin, upload.none(), async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Request body keys:', Object.keys(req.body));

    // Get the common settings
    const startingNumber = parseInt(req.body.startingNumber) || 1;
    const commonType = req.body.commonType || 'Data';
    const commonAttribute = req.body.commonAttribute || 'Neutral';
    const commonLevel = req.body.commonLevel || 'Rookie';
    const commonField = req.body.commonField || 'Unknown';
    const commonRarity = req.body.commonRarity || 'Common';

    // Get the total count of Digimon to add
    const digimonCount = parseInt(req.body.digimonCount) || 0;

    console.log('Starting number:', startingNumber);
    console.log('Common type:', commonType);
    console.log('Common attribute:', commonAttribute);
    console.log('Common level:', commonLevel);
    console.log('Common field:', commonField);
    console.log('Common rarity:', commonRarity);
    console.log('Digimon count:', digimonCount);

    // Process each Digimon
    const results = [];
    const errors = [];
    const usedNames = new Set();

    for (let i = 0; i < digimonCount; i++) {
      try {
        // Get the Digimon data
        const name = req.body[`name_${i}`];
        if (!name) continue;

        // Check for duplicate names
        if (usedNames.has(name)) {
          const errorMsg = `Duplicate name ${name} found. Skipping this Digimon.`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        usedNames.add(name);

        // Get the Digimon number
        let number = req.body[`number_${i}`];
        if (!number) {
          number = startingNumber + i;
        }

        // Get the type, attribute, level, field, and rarity
        const type = req.body[`type_${i}`] === 'inherit' ? commonType : req.body[`type_${i}`];
        const attribute = req.body[`attribute_${i}`] === 'inherit' ? commonAttribute : req.body[`attribute_${i}`];
        const level = req.body[`level_${i}`] === 'inherit' ? commonLevel : req.body[`level_${i}`];
        const field = req.body[`field_${i}`] === 'inherit' ? commonField : req.body[`field_${i}`];
        const rarity = req.body[`rarity_${i}`] === 'inherit' ? commonRarity : req.body[`rarity_${i}`];

        // Create the Digimon object
        const digimon = {
          id: parseInt(number),
          name: name,
          xAntibody: null,
          Stage: level,
          types: type,
          attributes: attribute,
          fields: field,
          priorEvolutions: null,
          nextEvolutions: null,
          rarity: rarity
        };

        console.log(`Creating Digimon: ${name}`);

        // Save the Digimon
        await Digimon.create(digimon);
        results.push(name);
        console.log(`Successfully created Digimon: ${name}`);
      } catch (error) {
        console.error(`Error processing Digimon ${i}:`, error);
        errors.push(`Error processing Digimon ${i}: ${error.message}`);
      }
    }

    // Return the results
    if (errors.length > 0) {
      const responseMsg = `Added ${results.length} Digimon. Errors: ${errors.join(', ')}`;
      console.log(responseMsg);
      return res.json({
        success: results.length > 0,
        message: responseMsg,
        results,
        errors
      });
    } else {
      const responseMsg = `Successfully added ${results.length} Digimon`;
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
