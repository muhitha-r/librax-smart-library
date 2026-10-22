const mongoose = require('mongoose');

const borrowSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default_config',
      unique: true,
    },
    finePerDay: {
      type: Number,
      default: 5, // Default ₹5 per overdue day
      min: [0, 'Fine per day cannot be negative'],
    },
    studentBorrowDurationDays: {
      type: Number,
      default: 14, // Default 14 days for students
      min: [1, 'Borrowing duration must be at least 1 day'],
    },
    staffBorrowDurationDays: {
      type: Number,
      default: 30, // Default 30 days for academic staff
      min: [1, 'Borrowing duration must be at least 1 day'],
    },
    maxBooksPerStudent: {
      type: Number,
      default: 4,
      min: [1, 'Must allow at least 1 book'],
    },
    maxBooksPerStaff: {
      type: Number,
      default: 10,
      min: [1, 'Must allow at least 1 book'],
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to retrieve or initialize singleton settings
borrowSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'default_config' });
  if (!settings) {
    settings = await this.create({ key: 'default_config' });
  }
  return settings;
};

module.exports = mongoose.model('BorrowSetting', borrowSettingSchema);

