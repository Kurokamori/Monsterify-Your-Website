/**
 * Authentication middleware functions
 */

/**
 * Middleware to ensure user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

/**
 * Middleware to ensure user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/');
  }
  next();
};

/**
 * Middleware to ensure user is authenticated for API routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureAuthenticatedApi = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  next();
};

/**
 * Middleware to ensure user is an admin for API routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureAdminApi = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureAuthenticatedApi,
  ensureAdminApi
};
