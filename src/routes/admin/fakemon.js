const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ensureAdmin } = require('../../middleware/auth');
const {
  loadAllFakemon,
  getFakemonByNumber,
  saveFakemon,
  deleteFakemon,
  getNextFakemonNumber
} = require('../../utils/fakemon-loader');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

/**
 * @route GET /admin/fakemon
 * @desc List all Fakemon (admin view)
 * @access Admin
 */
router.get('/', ensureAdmin, (req, res) => {
  const fakemonList = loadAllFakemon();
  const message = req.query.message || '';
  const messageType = req.query.messageType || 'success';

  res.render('admin/fakemon/index', {
    title: 'Fakemon Management',
    fakemon_list: fakemonList,
    message,
    messageType
  });
});

/**
 * @route GET /admin/fakemon/add
 * @desc Show form to add a new Fakemon
 * @access Admin
 */
router.get('/add', ensureAdmin, (req, res) => {
  const nextNumber = getNextFakemonNumber();

  res.render('admin/fakemon/form', {
    title: 'Add New Fakemon',
    fakemon: {
      number: nextNumber,
      name: '',
      species_class: 'The Something Pokemon',
      types: ['Normal'],
      attribute: 'Data',
      abilities: ['Ability1'],
      height: '1.0 m',
      weight: '20.0 kg',
      stats: {
        hp: '45',
        atk: '49',
        def: '49',
        spatk: '65',
        spdef: '65',
        spe: '45'
      },
      pokedex_entry: '',
      evolution_line: [],
      artist_caption: ''
    },
    isNew: true
  });
});

/**
 * @route GET /admin/fakemon/mass-add
 * @desc Show form to mass add Fakemon
 * @access Admin
 */
router.get('/mass-add', ensureAdmin, (req, res) => {
  const nextNumber = getNextFakemonNumber();

  res.render('admin/fakemon/mass-add', {
    title: 'Mass Add Fakemon',
    nextNumber,
    message: req.query.message,
    messageType: req.query.messageType || 'success'
  });
});

/**
 * @route GET /admin/fakemon/edit/:number
 * @desc Show form to edit a Fakemon
 * @access Admin
 */
router.get('/edit/:number', ensureAdmin, (req, res) => {
  const number = req.params.number;
  const fakemon = getFakemonByNumber(number);

  if (!fakemon) {
    return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Fakemon not found'));
  }

  res.render('admin/fakemon/form', {
    title: `Edit Fakemon #${fakemon.number}`,
    fakemon,
    isNew: false
  });
});

/**
 * @route POST /admin/fakemon/save
 * @desc Save a new or updated Fakemon
 * @access Admin
 */
router.post('/save', ensureAdmin, upload.single('image'), (req, res) => {
  try {
    const isNew = req.body.isNew === 'true';
    
    // Parse form data
    const fakemon = {
      number: req.body.number.padStart(3, '0'),
      name: req.body.name,
      species_class: req.body.species_class,
      types: Array.isArray(req.body.types) ? req.body.types : [req.body.types],
      attribute: req.body.attribute,
      abilities: req.body.abilities.split(',').map(a => a.trim()),
      height: req.body.height,
      weight: req.body.weight,
      stats: {
        hp: req.body.hp,
        atk: req.body.atk,
        def: req.body.def,
        spatk: req.body.spatk,
        spdef: req.body.spdef,
        spe: req.body.spe
      },
      pokedex_entry: req.body.pokedex_entry,
      evolution_line: req.body.evolution_line ? req.body.evolution_line.split(',').map(e => e.trim()) : [],
      artist_caption: req.body.artist_caption || ''
    };
    
    // Save fakemon to markdown file
    const saveResult = saveFakemon(fakemon);
    
    if (!saveResult) {
      return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error saving Fakemon'));
    }
    
    // Handle image upload if provided
    if (req.file) {
      const imagePath = path.join(__dirname, '../../public/images/fakemon', `${fakemon.number}.png`);
      fs.renameSync(req.file.path, imagePath);
    }
    
    res.redirect('/admin/fakemon?message=' + encodeURIComponent(`Fakemon #${fakemon.number} ${isNew ? 'created' : 'updated'} successfully`));
  } catch (error) {
    console.error('Error saving Fakemon:', error);
    res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

/**
 * @route POST /admin/fakemon/delete/:number
 * @desc Delete a Fakemon
 * @access Admin
 */
router.post('/delete/:number', ensureAdmin, (req, res) => {
  const number = req.params.number;

  try {
    // Delete fakemon markdown file
    const deleteResult = deleteFakemon(number);

    if (!deleteResult) {
      return res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error deleting Fakemon'));
    }

    // Try to delete image file if it exists
    const imagePath = path.join(__dirname, '../../public/images/fakemon', `${number.padStart(3, '0')}.png`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.redirect('/admin/fakemon?message=' + encodeURIComponent(`Fakemon #${number} deleted successfully`));
  } catch (error) {
    console.error('Error deleting Fakemon:', error);
    res.redirect('/admin/fakemon?messageType=error&message=' + encodeURIComponent('Error: ' + error.message));
  }
});

// Configure multer for mass uploads
const massUploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/fakemon-mass');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const massUpload = multer({ storage: massUploadStorage });

/**
 * @route POST /admin/fakemon/mass-add
 * @desc Mass add multiple Fakemon
 * @access Admin
 */
router.post('/mass-add', ensureAdmin, (req, res) => {
  try {
    // Create a temporary directory for file uploads
    const tempDir = path.join(__dirname, '../../public/uploads/fakemon-mass');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Use multer to handle the file uploads
    const upload = massUpload.array('file_', 50); // Allow up to 50 files

    upload(req, res, async function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error uploading files: ' + err.message });
      }

      try {
        // Get the starting number and common attributes
        const startingNumber = parseInt(req.body.startingNumber) || 1;
        const commonAttribute = req.body.commonAttribute || 'Data';
        const commonTypes = req.body.commonTypes ? JSON.parse(req.body.commonTypes) : ['Normal'];
        const fileCount = parseInt(req.body.fileCount) || 0;

        // Process each file
        const results = [];
        const errors = [];

        for (let i = 0; i < fileCount; i++) {
          try {
            const file = req.files.find(f => f.fieldname === `file_${i}`);
            if (!file) continue;

            // Get metadata for this file
            const number = req.body[`number_${i}`] || (startingNumber + i).toString().padStart(3, '0');
            const name = req.body[`name_${i}`] || `Fakemon ${number}`;
            const types = req.body[`types_${i}`] === 'inherit' ? commonTypes : [req.body[`types_${i}`]];
            const attribute = req.body[`attribute_${i}`] === 'inherit' ? commonAttribute : req.body[`attribute_${i}`];

            // Create a basic fakemon object
            const fakemon = {
              number: number.padStart(3, '0'),
              name,
              species_class: 'The Something Pokemon',
              types,
              attribute,
              abilities: ['Ability1'],
              height: '1.0 m',
              weight: '20.0 kg',
              stats: {
                hp: '45',
                atk: '49',
                def: '49',
                spatk: '65',
                spdef: '65',
                spe: '45'
              },
              pokedex_entry: '',
              evolution_line: [],
              artist_caption: ''
            };

            // Save fakemon to markdown file
            const saveResult = saveFakemon(fakemon);

            if (!saveResult) {
              errors.push(`Error saving Fakemon #${number}`);
              continue;
            }

            // Move the uploaded file to the fakemon images directory
            const imagePath = path.join(__dirname, '../../public/images/fakemon', `${fakemon.number}.png`);
            fs.renameSync(file.path, imagePath);

            results.push(fakemon.number);
          } catch (error) {
            console.error(`Error processing file ${i}:`, error);
            errors.push(`Error processing file ${i}: ${error.message}`);
          }
        }

        // Clean up the temporary directory
        try {
          const remainingFiles = fs.readdirSync(tempDir);
          for (const file of remainingFiles) {
            fs.unlinkSync(path.join(tempDir, file));
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temporary files:', cleanupError);
        }

        // Return the results
        if (errors.length > 0) {
          return res.json({
            success: results.length > 0,
            message: `Added ${results.length} Fakemon. Errors: ${errors.join(', ')}`,
            results,
            errors
          });
        } else {
          return res.json({
            success: true,
            message: `Successfully added ${results.length} Fakemon`,
            results
          });
        }
      } catch (error) {
        console.error('Error processing mass add:', error);
        return res.status(500).json({ success: false, message: 'Error processing mass add: ' + error.message });
      }
    });
  } catch (error) {
    console.error('Error setting up mass add:', error);
    return res.status(500).json({ success: false, message: 'Error setting up mass add: ' + error.message });
  }
});

module.exports = router;
