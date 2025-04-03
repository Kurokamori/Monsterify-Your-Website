const express = require('express');
const router = express.Router();

// Statistics route
router.get('/statistics', (req, res) => {
  res.render('statistics/index', { 
    title: 'Statistics',
    user: req.session.user
  });
});

module.exports = router;
