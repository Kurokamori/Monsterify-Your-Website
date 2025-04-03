const express = require('express');
const router = express.Router();

// Fakemon route
router.get('/fakemon', (req, res) => {
  res.render('fakemon/index', { 
    title: 'Fakemon',
    user: req.session.user
  });
});

module.exports = router;
