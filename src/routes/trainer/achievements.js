const express = require('express');
const router = express.Router();
const Trainer = require('../../models/Trainer');
const { ensureAuthenticated } = require('../../middleware/auth');

// Trainer achievements page
router.get('/:id/achievements', ensureAuthenticated, async (req, res) => {
    try {
        const trainerId = req.params.id;
        const trainer = await Trainer.getById(trainerId);

        if (!trainer) {
            return res.status(404).render('error', {
                message: 'Trainer not found',
                error: { status: 404 }
            });
        }

        // Check if the user owns this trainer or is an admin
        const isOwner = trainer.player_user_id === req.session.user.discord_id;
        const isAdmin = req.session.user.is_admin;

        if (!isOwner && !isAdmin) {
            return res.status(403).render('error', {
                message: 'You do not have permission to view this trainer\'s achievements',
                error: { status: 403 }
            });
        }

        res.render('trainer/achievements', {
            title: `${trainer.name}'s Achievements`,
            trainer
        });
    } catch (error) {
        console.error('Error getting trainer achievements page:', error);
        res.status(500).render('error', {
            message: 'Error loading trainer achievements page',
            error: { status: 500, stack: error.stack },
            title: 'Error'
        });
    }
});

module.exports = router;
