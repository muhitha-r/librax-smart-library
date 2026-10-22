const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required'],
      index: true,
    },
    // Backward-compatible alias for existing queries
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'RESERVATION_CONFIRMATION',
        'BOOK_AVAILABLE',
        'DUE_DATE_REMINDER',
        'FINE_ALERT',
        'GENERAL',
        // Legacy types for backwards compatibility
        'Reservation',
        'Reminder',
        'Overdue',
        'Fine',
        'System',
        'General',
      ],
      default: 'GENERAL',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Backward-compatible alias
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      default: null,
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Synchronize recipient <-> user and read <-> isRead automatically
notificationSchema.pre('validate', function () {
  if (this.recipient && !this.user) this.user = this.recipient;
  if (this.user && !this.recipient) this.recipient = this.user;

  if (this.isModified('read') && !this.isModified('isRead')) {
    this.isRead = this.read;
  } else if (this.isModified('isRead') && !this.isModified('read')) {
    this.read = this.isRead;
  } else if (this.read !== this.isRead) {
    if (this.read) this.isRead = true;
    else if (this.isRead) this.read = true;
  }
});

notificationSchema.pre('save', function () {
  if (this.recipient && !this.user) this.user = this.recipient;
  if (this.user && !this.recipient) this.recipient = this.user;
  if (this.isModified('read')) this.isRead = this.read;
  if (this.isModified('isRead')) this.read = this.isRead;
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

