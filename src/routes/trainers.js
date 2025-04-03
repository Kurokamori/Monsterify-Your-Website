const express = require('express');
const router = express.Router();

// Trainers route
router.get('/trainers', (req, res) => {
  res.render('trainers/index', { 
    title: 'Trainers',
    user: req.session.user
  });
});

module.exports = router;
