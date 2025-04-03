const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login route
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    user: req.session.user
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
