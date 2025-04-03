const express = require('express');
const router = express.Router();

// Import sub-routers
const adoptionRouter = require('./adoption');

// Use sub-routers
router.use('/visit/adoption', adoptionRouter);

// Town home route
router.get('/', (req, res) => {
  res.render('town/index', { 
    title: 'Town',
    user: req.session.user
  });
});

module.exports = router;
