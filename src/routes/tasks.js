const express = require('express');
const router = express.Router();

// Tasks route
router.get('/tasks', (req, res) => {
  res.render('tasks/index', { 
    title: 'Tasks',
    user: req.session.user
  });
});

module.exports = router;
