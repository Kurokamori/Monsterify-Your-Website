const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const Monster = require('../../models/Monster');
const ReferenceSubmissionService = require('../../utils/ReferenceSubmissionService');
const { ensureAuthenticatedApi } = require('../../middleware/auth');

/**
 * @route POST /api/reference/submit
 * @desc Submit a reference submission and apply rewards
 * @access Private
 */
router.post('/submit', ensureAuthenticatedApi, async (req, res) => {
  try {

    const {
      referenceType,
      references
    } = req.body;

    // Validate input
    if (!referenceType || !references || !references.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Submit reference
    const result = await ReferenceSubmissionService.submitReference(
      {
        referenceType,
        references
      },
      req.session.user.discord_id
    );

    res.json({
      success: true,
      message: 'Reference submission successful',
      submission: result.submission,
      calculation: result.calculation
    });
  } catch (error) {
    console.error('Error submitting reference:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting reference'
    });
  }
});

module.exports = router;
