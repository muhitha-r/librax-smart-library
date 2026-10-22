const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/notifications
 * @desc    Fetch current user's notifications (sorted by newest first, limited to recent 30, with unread count)
 * @access  Private (All authenticated roles)
 */
async function getMyNotifications(req, res, next) {
  try {
    const { page = 1, limit = 30, unreadOnly } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Strict user isolation: only find notifications belonging to this user
    const userFilter = { $or: [{ recipient: req.user._id }, { user: req.user._id }] };
    const unreadCondition = { $or: [{ read: false }, { isRead: false }] };

    const query = unreadOnly === 'true'
      ? { $and: [userFilter, unreadCondition] }
      : userFilter;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ $and: [userFilter, unreadCondition] }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({
      status: 'success',
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a specific notification as read (strictly owned by authenticated user)
 * @access  Private (Owner only)
 */
async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Notification ID format.' });
    }

    // Strict user ownership verification on backend
    const notification = await Notification.findOne({
      _id: id,
      $or: [{ recipient: req.user._id }, { user: req.user._id }],
    });

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found.' });
    }

    notification.read = true;
    notification.isRead = true;
    await notification.save();

    const userFilter = { $or: [{ recipient: req.user._id }, { user: req.user._id }] };
    const unreadCondition = { $or: [{ read: false }, { isRead: false }] };

    const unreadCount = await Notification.countDocuments({
      $and: [userFilter, unreadCondition],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notification marked as read.',
      data: notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread notifications as read for current authenticated user
 * @access  Private (Owner only)
 */
async function markAllNotificationsAsRead(req, res, next) {
  try {
    const userFilter = { $or: [{ recipient: req.user._id }, { user: req.user._id }] };
    const unreadCondition = { $or: [{ read: false }, { isRead: false }] };

    const result = await Notification.updateMany(
      { $and: [userFilter, unreadCondition] },
      { $set: { read: true, isRead: true } }
    );

    return res.status(200).json({
      status: 'success',
      message: `Marked ${result.modifiedCount} notification(s) as read.`,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification (strictly owned by authenticated user)
 * @access  Private (Owner only)
 */
async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Notification ID format.' });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      $or: [{ recipient: req.user._id }, { user: req.user._id }],
    });

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Notification not found.' });
    }

    const userFilter = { $or: [{ recipient: req.user._id }, { user: req.user._id }] };
    const unreadCondition = { $or: [{ read: false }, { isRead: false }] };

    const unreadCount = await Notification.countDocuments({
      $and: [userFilter, unreadCondition],
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notification deleted.',
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};

