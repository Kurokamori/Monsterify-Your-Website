const express = require('express');
const router = express.Router();

// Content pages route
router.get('/content-pages', (req, res) => {
  res.render('content-pages/index', { 
    title: 'Content Pages',
    user: req.session.user
  });
});

module.exports = router;
