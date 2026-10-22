const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, 'ISBN cannot exceed 30 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [120, 'Author name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [80, 'Category cannot exceed 80 characters'],
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publicationYear: {
      type: Number,
      min: [1000, 'Publication year must be valid'],
      max: [new Date().getFullYear() + 1, 'Publication year cannot be in the far future'],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Total copies must be at least 1'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
      default: 1,
      validate: {
        validator: function (val) {
          return val <= this.totalCopies;
        },
        message: 'Available copies cannot exceed total copies',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for coverImageUrl
bookSchema.virtual('coverImageUrl').get(function () {
  return this.coverImage || '';
});
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

// Indexes for high performance searching & filtering
bookSchema.index({ title: 'text', author: 'text', ISBN: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ availableCopies: 1 });

module.exports = mongoose.model('Book', bookSchema);

