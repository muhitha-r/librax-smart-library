const User = require('../models/User');
const Book = require('../models/Book');

/**
 * @route   GET /api/users
 * @desc    Get paginated list of users with role and search filters
 * @access  Private (Admin only)
 */
async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { role, search } = req.query;
    const query = {};

    if (role && ['Admin', 'Librarian', 'Staff', 'Student'].includes(role)) {
      query.role = role;
    }

    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      status: 'success',
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/users
 * @desc    Create a new user with an authorized role (Staff, Librarian, Admin, Student)
 * @access  Private (Admin only)
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Name is required.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ status: 'error', message: 'Email address is required.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long.' });
    }

    const validRoles = ['Admin', 'Librarian', 'Staff', 'Student'];
    const assignedRole = role && validRoles.includes(role) ? role : 'Staff';

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'A user with this email address already exists.' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
    });

    return res.status(201).json({
      status: 'success',
      message: `User '${newUser.name}' created successfully with role ${newUser.role}.`,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update a user's role (Admin, Librarian, Staff, Student)
 * @access  Private (Admin only)
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['Admin', 'Librarian', 'Staff', 'Student'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Role must be one of: ${validRoles.join(', ')}.`,
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    // Safety: prevent admin from demoting themselves if they are the only admin
    if (targetUser._id.toString() === req.user._id.toString() && role !== 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot demote the only remaining Administrator on the system.',
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    return res.status(200).json({
      status: 'success',
      message: `User '${targetUser.name}' role updated to ${targetUser.role}.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin only)
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Administrators cannot delete their own active account.',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: `User '${targetUser.name}' removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/users/stats
 * @desc    Get aggregated system statistics (users per role, catalog totals)
 * @access  Private (Admin only)
 */
async function getSystemStats(_req, res, next) {
  try {
    const [totalUsers, admins, librarians, staff, students, totalBooks, booksAggregate] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Admin' }),
      User.countDocuments({ role: 'Librarian' }),
      User.countDocuments({ role: 'Staff' }),
      User.countDocuments({ role: 'Student' }),
      Book.countDocuments(),
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' },
          },
        },
      ]),
    ]);

    const copyStats = booksAggregate[0] || { totalCopies: 0, availableCopies: 0 };
    const borrowedCopies = Math.max(0, copyStats.totalCopies - copyStats.availableCopies);

    return res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          admin: admins,
          librarian: librarians,
          staff,
          student: students,
        },
        catalog: {
          totalTitles: totalBooks,
          totalCopies: copyStats.totalCopies,
          availableCopies: copyStats.availableCopies,
          borrowedCopies,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getSystemStats,
};

