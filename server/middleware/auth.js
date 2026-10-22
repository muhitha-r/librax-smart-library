const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verifies JWT token and attaches authenticated user to request
 */
async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists. Please log in again.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.',
    });
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles ('Admin', 'Librarian', 'Student')
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: role '${req.user?.role || 'Guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
}

module.exports = { protect, authorizeRoles };
