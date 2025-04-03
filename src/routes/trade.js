const express = require('express');
const router = express.Router();

// Trade route
router.get('/trade', (req, res) => {
  res.render('trade/index', { 
    title: 'Trade',
    user: req.session.user
  });
});

module.exports = router;
