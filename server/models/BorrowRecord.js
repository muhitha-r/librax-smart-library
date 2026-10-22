const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema(
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
    borrowDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Borrowed', 'Returned', 'Overdue'],
        message: '{VALUE} is not a valid borrow status',
      },
      default: 'Borrowed',
      required: true,
      index: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine amount cannot be negative'],
    },
    finePaymentStatus: {
      type: String,
      enum: {
        values: ['Unpaid', 'Paid', 'Waived'],
        message: '{VALUE} is not a valid fine payment status',
      },
      default: 'Unpaid',
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    finePaidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    auditLog: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find active loans for user & book
borrowRecordSchema.index({ user: 1, book: 1, status: 1 });
borrowRecordSchema.index({ status: 1, dueDate: 1 });
borrowRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);

