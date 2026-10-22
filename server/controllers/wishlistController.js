const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');

/**
 * @route   POST /api/wishlist OR POST /api/wishlist/:bookId
 * @desc    Add a book to the student's personal wishlist
 * @access  Private (Student only)
 */
async function addToWishlist(req, res, next) {
  try {
    // Role check: Student role only
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: The reading wishlist is available exclusively for Students.',
      });
    }

    const bookId = req.body?.bookId || req.params?.bookId;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ status: 'error', message: 'Valid Book ID is required.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found in library catalog.' });
    }

    const userId = req.user._id;

    const existing = await Wishlist.findOne({ user: userId, book: bookId });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `'${book.title}' is already in your reading wishlist.`,
      });
    }

    const item = await Wishlist.create({
      user: userId,
      book: bookId,
      addedAt: new Date(),
    });

    const populated = await Wishlist.findById(item._id).populate(
      'book',
      'title author ISBN category coverImage totalCopies availableCopies description publisher publicationYear'
    );

    const data = populated.toObject();
    if (data.book && !data.book.coverImageUrl && data.book.coverImage) {
      data.book.coverImageUrl = data.book.coverImage;
    }

    return res.status(201).json({
      status: 'success',
      message: `'${book.title}' added to your wishlist.`,
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'This book is already in your wishlist.',
      });
    }
    next(error);
  }
}

/**
 * @route   GET /api/wishlist
 * @desc    Get current student's reading wishlist populated with book details
 * @access  Private (Student only)
 */
async function getMyWishlist(req, res, next) {
  try {
    // Role check: Student role only
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: The reading wishlist is available exclusively for Students.',
      });
    }

    const items = await Wishlist.find({ user: req.user._id })
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies description publisher publicationYear')
      .sort({ addedAt: -1 });

    // Filter out deleted books safely and attach coverImageUrl
    const validItems = items
      .filter((item) => item.book !== null)
      .map((item) => {
        const obj = item.toObject();
        if (obj.book && !obj.book.coverImageUrl && obj.book.coverImage) {
          obj.book.coverImageUrl = obj.book.coverImage;
        }
        return obj;
      });

    return res.status(200).json({
      status: 'success',
      count: validItems.length,
      data: validItems,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/wishlist/:bookId
 * @desc    Remove a book from current student's wishlist
 * @access  Private (Student only)
 */
async function removeFromWishlist(req, res, next) {
  try {
    // Role check: Student role only
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: The reading wishlist is available exclusively for Students.',
      });
    }

    const { bookId } = req.params;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ status: 'error', message: 'Valid Book ID format is required.' });
    }

    const deleted = await Wishlist.findOneAndDelete({
      user: req.user._id,
      book: bookId,
    });

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Book was not found in your wishlist.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Book successfully removed from your wishlist.',
      data: { bookId },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
};

