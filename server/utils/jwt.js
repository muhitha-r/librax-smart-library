const jwt = require('jsonwebtoken');

/**
 * Generate a JSON Web Token for authenticated user
 * @param {Object} user - User document or object with _id and role
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }

  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
    },
    secret,
    {
      expiresIn: '7d',
    }
  );
}

module.exports = { generateToken };
