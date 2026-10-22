const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    reservedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reservationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    queuePosition: {
      type: Number,
      default: 1,
      min: [1, 'Queue position must be at least 1'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Fulfilled', 'Cancelled', 'Expired', 'Available', 'Waiting'],
      default: 'Pending',
      index: true,
    },
    holdUntil: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    pickupLocation: {
      type: String,
      default: 'Main Circulation Desk',
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Partial unique index preventing duplicate active/pending reservations
reservationSchema.index(
  { user: 1, book: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } }
);

// Compound indexes for FIFO sorting and fast queue lookups
reservationSchema.index({ book: 1, status: 1, reservedAt: 1 });
reservationSchema.index({ book: 1, status: 1, reservationDate: 1 });
reservationSchema.index({ status: 1, holdUntil: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
