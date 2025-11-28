const User = require('../models/User');

/**
 * Middleware to protect routes
 * Verifies JWT token and adds user to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('No token provided in request headers');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
        debug: 'No Authorization header found'
      });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    if (!decoded) {
      console.log('Token verification failed for token:', token.substring(0, 20) + '...');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        debug: 'Token verification failed'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found for decoded id:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
        debug: 'User not found in database'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Verifies JWT token if present and adds user to request object
 * Continues execution even if no token or invalid token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = User.verifyToken(token);
    if (!decoded) {
      return next(); // Continue without authentication if token is invalid
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(); // Continue without authentication if user not found
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication on error
  }
};

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const admin = (req, res, next) => {
  console.log('Admin check - User:', req.user ? { id: req.user.id, is_admin: req.user.is_admin } : 'No user');
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin',
      debug: req.user ? 'User exists but is not admin' : 'No user in request'
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  admin
};
