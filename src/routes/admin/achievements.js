const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../../middleware/auth');

// Admin achievements page
router.get('/', ensureAdmin, (req, res) => {
    res.render('admin/achievements', {
        title: 'Achievement Management',
        user: req.session.user
    });
});

module.exports = router;
