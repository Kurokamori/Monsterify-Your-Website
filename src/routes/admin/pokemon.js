const express = require('express');
const router = express.Router();
const Pokemon = require('../../models/Pokemon');
const { ensureAdmin } = require('../../middleware/auth');
const multer = require('multer');
const upload = multer();
const path = require('path');

/**
 * @route GET /admin/pokemon
 * @desc List all Pokemon (admin view)
 * @access Admin
 */
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const pokemon = await Pokemon.getAll();

    res.render('admin/pokemon/index', {
      title: 'Manage Pokémon',
      pokemon,
      message: req.query.message,
      messageType: req.query.messageType || 'success'
    });
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/pokemon/new
 * @desc Show form to add a new Pokemon
 * @access Admin
 */
router.get('/new', ensureAdmin, (req, res) => {
  res.render('admin/pokemon/form', {
    title: 'Add New Pokémon',
    pokemon: {
      SpeciesName: '',
      Stage: '',
      Type1: '',
      Type2: '',
      region: '',
      pokedexnumber: '',
      Rarity: '',
      is_starter: false,
      is_fossil: false,
      is_psuedolegendary: false,
      is_sublegendary: false,
      is_baby: false,
      EvolvesFrom: '',
      EvolvesInto: '',
      BreedingResultsIn: ''
    },
    isNew: true
  });
});

/**
 * @route GET /admin/pokemon/edit/:name
 * @desc Show form to edit a Pokemon
 * @access Admin
 */
router.get('/edit/:name', ensureAdmin, async (req, res) => {
  try {
    const pokemon = await Pokemon.getByName(req.params.name);

    if (!pokemon) {
      return res.redirect('/admin/pokemon?message=Pokemon not found&messageType=error');
    }

    res.render('admin/pokemon/form', {
      title: `Edit Pokémon: ${pokemon.SpeciesName}`,
      pokemon,
      isNew: false
    });
  } catch (error) {
    console.error('Error fetching Pokemon for edit:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/pokemon/save
 * @desc Save a new or updated Pokemon
 * @access Admin
 */
router.post('/save', ensureAdmin, async (req, res) => {
  try {
    const isNew = req.body.isNew === 'true';

    // Convert checkbox values to boolean
    const pokemon = {
      SpeciesName: req.body.SpeciesName,
      Stage: req.body.Stage,
      Type1: req.body.Type1,
      Type2: req.body.Type2 || null,
      region: req.body.region,
      pokedexnumber: parseInt(req.body.pokedexnumber) || null,
      Rarity: req.body.Rarity,
      is_starter: req.body.is_starter === 'on',
      is_fossil: req.body.is_fossil === 'on',
      is_psuedolegendary: req.body.is_psuedolegendary === 'on',
      is_sublegendary: req.body.is_sublegendary === 'on',
      is_baby: req.body.is_baby === 'on',
      EvolvesFrom: req.body.EvolvesFrom || null,
      EvolvesInto: req.body.EvolvesInto || null,
      BreedingResultsIn: req.body.BreedingResultsIn || null
    };

    if (isNew) {
      await Pokemon.create(pokemon);
      res.redirect('/admin/pokemon?message=Pokémon added successfully');
    } else {
      await Pokemon.update(pokemon);
      res.redirect('/admin/pokemon?message=Pokémon updated successfully');
    }
  } catch (error) {
    console.error('Error saving Pokemon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route POST /admin/pokemon/delete/:name
 * @desc Delete a Pokemon
 * @access Admin
 */
router.post('/delete/:name', ensureAdmin, async (req, res) => {
  try {
    const result = await Pokemon.delete(req.params.name);

    if (result) {
      res.redirect('/admin/pokemon?message=Pokémon deleted successfully');
    } else {
      res.redirect('/admin/pokemon?message=Failed to delete Pokémon&messageType=error');
    }
  } catch (error) {
    console.error('Error deleting Pokemon:', error);
    res.status(500).send('Server error');
  }
});

/**
 * @route GET /admin/pokemon/mass-add
 * @desc Show form to add multiple Pokemon at once
 * @access Admin
 */
router.get('/mass-add', ensureAdmin, (req, res) => {
  res.render('admin/pokemon/mass-add', {
    title: 'Mass Add Pokémon'
  });
});

/**
 * @route POST /admin/pokemon/mass-add
 * @desc Process mass add of Pokemon
 * @access Admin
 */
router.post('/mass-add', ensureAdmin, upload.none(), async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Request body keys:', Object.keys(req.body));

    // Get the common settings
    const startingNumber = parseInt(req.body.startingNumber) || 1;
    const commonRegion = req.body.commonRegion || 'Other';
    const commonStage = req.body.commonStage || 'Basic';
    const commonRarity = req.body.commonRarity || 'Common';
    const commonTypes = req.body.commonTypes ? JSON.parse(req.body.commonTypes) : [];

    // Get the total count of Pokemon to add
    const pokemonCount = parseInt(req.body.pokemonCount) || 0;

    console.log('Starting number:', startingNumber);
    console.log('Common region:', commonRegion);
    console.log('Common stage:', commonStage);
    console.log('Common rarity:', commonRarity);
    console.log('Common types:', commonTypes);
    console.log('Pokemon count:', pokemonCount);

    // Process each Pokemon
    const results = [];
    const errors = [];
    const usedNames = new Set();

    for (let i = 0; i < pokemonCount; i++) {
      try {
        // Get the Pokemon data
        const name = req.body[`name_${i}`];
        if (!name) continue;

        // Check for duplicate names
        if (usedNames.has(name)) {
          const errorMsg = `Duplicate name ${name} found. Skipping this Pokémon.`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        usedNames.add(name);

        // Get the Pokemon number
        let pokedexNumber = req.body[`number_${i}`];
        if (!pokedexNumber) {
          pokedexNumber = startingNumber + i;
        }

        // Get the types
        let type1 = req.body[`type1_${i}`];
        let type2 = req.body[`type2_${i}`];

        // Handle inherited types
        if (type1 === 'inherit') {
          type1 = commonTypes.length > 0 ? commonTypes[0] : 'Normal';
        }

        if (type2 === 'inherit') {
          type2 = commonTypes.length > 1 ? commonTypes[1] : null;
        } else if (type2 === '') {
          type2 = null;
        }

        // Get the region, stage, and rarity
        const region = req.body[`region_${i}`] === 'inherit' ? commonRegion : req.body[`region_${i}`];
        const stage = req.body[`stage_${i}`] === 'inherit' ? commonStage : req.body[`stage_${i}`];
        const rarity = req.body[`rarity_${i}`] === 'inherit' ? commonRarity : req.body[`rarity_${i}`];

        // Create the Pokemon object
        const pokemon = {
          SpeciesName: name,
          Stage: stage,
          Type1: type1,
          Type2: type2,
          region: region,
          pokedexnumber: parseInt(pokedexNumber),
          Rarity: rarity,
          is_starter: false,
          is_fossil: false,
          is_psuedolegendary: false,
          is_sublegendary: false,
          is_baby: false,
          EvolvesFrom: null,
          EvolvesInto: null,
          BreedingResultsIn: null
        };

        console.log(`Creating Pokemon: ${name}`);

        // Save the Pokemon
        await Pokemon.create(pokemon);
        results.push(name);
        console.log(`Successfully created Pokemon: ${name}`);
      } catch (error) {
        console.error(`Error processing Pokemon ${i}:`, error);
        errors.push(`Error processing Pokemon ${i}: ${error.message}`);
      }
    }

    // Return the results
    if (errors.length > 0) {
      const responseMsg = `Added ${results.length} Pokémon. Errors: ${errors.join(', ')}`;
      console.log(responseMsg);
      return res.json({
        success: results.length > 0,
        message: responseMsg,
        results,
        errors
      });
    } else {
      const responseMsg = `Successfully added ${results.length} Pokémon`;
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
