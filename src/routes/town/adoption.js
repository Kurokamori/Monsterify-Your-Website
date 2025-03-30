const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const MonthlyAdopt = require('../../models/MonthlyAdopt');

/**
 * @route GET /town/visit/adoption
 * @desc Render the adoption center page
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login');
    }

    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Ensure current month adopts exist
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    // Render the adoption center page
    res.render('town/adoption_center', {
      title: 'Adoption Center',
      trainers,
      user: req.session.user // Pass the user object if needed
    });
  } catch (error) {
    console.error('Error rendering adoption center:', error);
    res.status(500).render('error', {
      message: 'Error rendering adoption center',
      error: { status: 500, stack: error.stack }
    });
  }
});

module.exports = router;

