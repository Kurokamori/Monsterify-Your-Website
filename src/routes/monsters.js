const express = require('express');
const router = express.Router();

// Monsters route
router.get('/monsters', (req, res) => {
  res.render('monsters/index', { 
    title: 'Monsters',
    user: req.session.user
  });
});

module.exports = router;
