const express = require('express');
const router = express.Router();
const AchievementService = require('../../services/AchievementServicePG');
const Trainer = require('../../models/Trainer');
const { ensureAuthenticated, ensureAdmin, ensureAuthenticatedApi, ensureAdminApi } = require('../../middleware/auth');

// Get achievements for a trainer
router.get('/trainers/:trainerId/achievements', async (req, res) => {
    try {
        const { trainerId } = req.params;

        // Check achievements and update progress
        await AchievementService.checkAllAchievements(trainerId);

        // Get achievements with progress
        const achievements = await AchievementService.getTrainerAchievements(trainerId);

        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Error getting achievements:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Claim achievement reward
router.post('/trainers/:trainerId/achievements/:achievementId/claim', ensureAuthenticatedApi, async (req, res) => {
    try {
        const { trainerId, achievementId } = req.params;

        // Verify user owns this trainer
        if (!req.session.user.is_admin) {
            const trainer = await Trainer.getById(trainerId);
            if (!trainer || trainer.player_user_id !== req.session.user.discord_id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to claim rewards for this trainer'
                });
            }
        }

        // Claim reward
        const result = await AchievementService.claimReward(trainerId, achievementId);

        res.json(result);
    } catch (error) {
        console.error('Error claiming achievement reward:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin routes for managing achievements
router.get('/admin/achievements/:id', ensureAdminApi, async (req, res) => {
    try {
        const { id } = req.params;
        const achievement = await AchievementService.getAchievementById(id);

        if (!achievement) {
            return res.status(404).json({ success: false, message: 'Achievement not found' });
        }

        res.json({ success: true, achievement });
    } catch (error) {
        console.error(`Error getting achievement ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/admin/achievements', ensureAdminApi, async (req, res) => {
    try {
        const achievements = await AchievementService.getAllAchievements();
        res.json({ success: true, achievements });
    } catch (error) {
        console.error('Error getting all achievements:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/admin/achievements', ensureAdminApi, async (req, res) => {
    try {
        const achievement = await AchievementService.createAchievement(req.body);
        res.json({ success: true, achievement });
    } catch (error) {
        console.error('Error creating achievement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/admin/achievements/:id', ensureAdminApi, async (req, res) => {
    try {
        const { id } = req.params;
        const achievement = await AchievementService.updateAchievement(id, req.body);
        res.json({ success: true, achievement });
    } catch (error) {
        console.error('Error updating achievement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/admin/achievements/:id', ensureAdminApi, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AchievementService.deleteAchievement(id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
