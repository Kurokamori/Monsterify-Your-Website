const express = require('express');
const router = express.Router();
const AdoptionController = require('../../controllers/AdoptionController');

/**
 * @route GET /town/visit/adoption
 * @desc Render the adoption center page
 * @access Private
 */
router.get('/', AdoptionController.renderAdoptionCenter);

/**
 * @route GET /town/visit/adoption/check-daypass/:trainerId
 * @desc Check if a trainer has a daycare daypass
 * @access Private
 */
router.get('/check-daypass/:trainerId', AdoptionController.checkDaypass);

module.exports = router;

