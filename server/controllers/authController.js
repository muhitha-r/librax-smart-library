const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (defaults to Student; Admin registration is forbidden)
 * @access  Public
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Enforce role restrictions: Public registration only allows Student or Staff accounts.
    // Admin and Librarian accounts cannot be created via public registration.
    const requestedRole = (role || 'Student').trim();
    const normalizedRole = requestedRole.toLowerCase();

    if (normalizedRole === 'admin' || normalizedRole === 'librarian') {
      return res.status(400).json({
        status: 'error',
        message: 'Admin and Librarian accounts cannot be created via public registration.',
      });
    }

    if (normalizedRole !== 'student' && normalizedRole !== 'staff') {
      return res.status(400).json({
        status: 'error',
        message: 'Public registration is only permitted for Student or Staff accounts.',
      });
    }

    const assignedRole = normalizedRole === 'staff' ? 'Staff' : 'Student';

    // Check for duplicate email
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'An account with this email address already exists.',
      });
    }

    // Create user with hashed password (hashed in pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
    });

    const token = generateToken(user);

    return res.status(201).json({
      status: 'success',
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select password field which is excluded by default
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
async function getMe(req, res) {
  return res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
}

module.exports = {
  register,
  login,
  getMe,
};
