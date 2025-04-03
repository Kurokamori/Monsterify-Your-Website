const express = require('express');
const router = express.Router();

// Content route
router.get('/content', (req, res) => {
  res.render('content/index', { 
    title: 'Content',
    user: req.session.user
  });
});

module.exports = router;
