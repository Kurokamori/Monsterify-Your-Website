const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * @route GET /submissions
 * @desc Submissions page
 * @access Private
 */
router.get('/', ensureAuthenticated, (req, res) => {
  res.render('submissions/index', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/writing/external
 * @desc External writing submission page
 * @access Private
 */
router.get('/writing/external', ensureAuthenticated, (req, res) => {
  res.render('submissions/writing/external', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/writing/game
 * @desc Game writing submission page
 * @access Private
 */
router.get('/writing/game', ensureAuthenticated, (req, res) => {
  res.render('submissions/writing/game', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/reference/trainer
 * @desc Trainer reference submission page
 * @access Private
 */
router.get('/reference/trainer', ensureAuthenticated, (req, res) => {
  res.render('submissions/reference/trainer', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/reference/monster
 * @desc Monster reference submission page
 * @access Private
 */
router.get('/reference/monster', ensureAuthenticated, (req, res) => {
  res.render('submissions/reference/monster', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/art/external
 * @desc External art submission page
 * @access Private
 */
router.get('/art/external', ensureAuthenticated, (req, res) => {
  res.render('submissions/art/external', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/art/manual
 * @desc Manual art submission page
 * @access Private
 */
router.get('/art/manual', ensureAuthenticated, (req, res) => {
  res.render('submissions/art/manual', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/art/simple
 * @desc Simple art calculator page
 * @access Private
 */
router.get('/art/simple', ensureAuthenticated, (req, res) => {
  res.render('submissions/art/simple', {
    user: req.session.user
  });
});

/**
 * @route GET /submissions/art/complex
 * @desc Complex art calculator page
 * @access Private
 */
router.get('/art/complex', ensureAuthenticated, (req, res) => {
  res.render('submissions/art/complex', {
    user: req.session.user
  });
});

module.exports = router;
