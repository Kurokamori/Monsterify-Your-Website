const Trainer = require('../models/Trainer');
const MonthlyAdopt = require('../models/MonthlyAdopt');
const TrainerInventoryChecker = require('../utils/TrainerInventoryChecker');

/**
 * Render the adoption center page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.renderAdoptionCenter = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.redirect('/login');
    }

    // Get user's trainers
    const trainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Ensure current month adopts exist
    await MonthlyAdopt.ensureCurrentMonthAdopts();

    // Get daypass information for each trainer
    const trainersWithDaypass = await Promise.all(
      trainers.map(async (trainer) => {
        const daypassInfo = await TrainerInventoryChecker.checkDaycareDaypass(trainer.id);
        return {
          ...trainer,
          hasDaypass: daypassInfo.hasDaypass,
          daypassCount: daypassInfo.daypassCount
        };
      })
    );

    // Render the adoption center page
    res.render('town/adoption_center', {
      title: 'Adoption Center',
      trainers: trainersWithDaypass,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error rendering adoption center:', error);
    res.status(500).render('error', {
      message: 'Error rendering adoption center',
      error: { status: 500, stack: error.stack },
      title: 'Error'
    });
  }
};

/**
 * Check if a trainer has a daycare daypass
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkDaypass = async (req, res) => {
  try {
    console.log('checkDaypass called with params:', req.params);
    const trainerId = parseInt(req.params.trainerId);
    console.log('Parsed trainerId:', trainerId);

    // Verify trainer exists
    const trainer = await Trainer.getById(trainerId);
    console.log('Trainer found:', trainer ? 'Yes' : 'No');

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if trainer has a daycare daypass
    const daypassInfo = await TrainerInventoryChecker.checkDaycareDaypass(trainerId);
    console.log('Daypass info:', daypassInfo);

    return res.json({
      success: true,
      hasDaypass: daypassInfo.hasDaypass,
      daypassCount: daypassInfo.daypassCount
    });
  } catch (error) {
    console.error('Error checking daypass:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking daypass'
    });
  }
};
