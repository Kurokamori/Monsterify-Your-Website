const User = require('../models/User');

/**
 * Middleware to authenticate user
 * Supports both JWT token and session-based authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // First check if user is authenticated via session
    if (req.session && req.session.user) {
      console.log('User authenticated via session:', req.session.user.id);
      req.user = req.session.user;
      return next();
    }

    // If not authenticated via session, check for JWT token
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token or session'
      });
    }

    // Verify token
    const decoded = User.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
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
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.is_admin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// For backward compatibility
const authenticateJWT = authenticateToken;

module.exports = {
  authenticateToken,
  authenticateJWT, // For backward compatibility
  isAdmin
};
