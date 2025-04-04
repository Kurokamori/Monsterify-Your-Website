const express = require('express');
const router = express.Router();

// Import admin sub-routes
const regionsRoutes = require('./admin/regions');
const areasRoutes = require('./admin/areas');
const bossRoutes = require('./admin/bosses');
const battlesRoutes = require('./admin/battles');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }
  next();
};

// Admin Dashboard
router.get('/dashboard', isAdmin, (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    message: req.query.message
  });
});

// Use admin sub-routes
router.use('/regions', regionsRoutes);
router.use('/areas', areasRoutes);
router.use('/bosses', bossRoutes);
router.use('/battles', battlesRoutes);

module.exports = router;
