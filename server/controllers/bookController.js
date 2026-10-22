const mongoose = require('mongoose');
const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');

/**
 * @route   POST /api/books
 * @desc    Create/Add a new book
 * @access  Private (Admin & Librarian only)
 */
async function createBook(req, res, next) {
  try {
    const {
      title,
      ISBN,
      author,
      category,
      publisher,
      publicationYear,
      description,
      coverImage,
      totalCopies,
      availableCopies,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: 'Book title is required.' });
    }

    if (!ISBN || !ISBN.trim()) {
      return res.status(400).json({ status: 'error', message: 'ISBN is required.' });
    }

    if (!author || !author.trim()) {
      return res.status(400).json({ status: 'error', message: 'Author name is required.' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ status: 'error', message: 'Category is required.' });
    }

    const numTotal = Number(totalCopies);
    if (isNaN(numTotal) || numTotal < 1) {
      return res.status(400).json({ status: 'error', message: 'Total copies must be at least 1.' });
    }

    let numAvailable = availableCopies !== undefined && availableCopies !== null
      ? Number(availableCopies)
      : numTotal;

    if (isNaN(numAvailable) || numAvailable < 0) {
      return res.status(400).json({ status: 'error', message: 'Available copies cannot be negative.' });
    }

    if (numAvailable > numTotal) {
      return res.status(400).json({ status: 'error', message: 'Available copies cannot exceed total copies.' });
    }

    const normalizedISBN = ISBN.trim().toUpperCase();

    // Check duplicate ISBN
    const existingBook = await Book.findOne({ ISBN: normalizedISBN });
    if (existingBook) {
      return res.status(400).json({
        status: 'error',
        message: `A book with ISBN "${normalizedISBN}" already exists in the catalog ("${existingBook.title}").`,
      });
    }

    const book = await Book.create({
      title: title.trim(),
      ISBN: normalizedISBN,
      author: author.trim(),
      category: category.trim(),
      publisher: publisher ? publisher.trim() : '',
      publicationYear: publicationYear ? Number(publicationYear) : null,
      description: description ? description.trim() : '',
      coverImage: coverImage ? coverImage.trim() : '',
      totalCopies: numTotal,
      availableCopies: numAvailable,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Book added to catalog successfully.',
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/books
 * @desc    Get paginated books with search and filter
 * @access  Private (All authenticated roles: Admin, Librarian, Student)
 */
async function getBooks(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { search, category, available, sort } = req.query;

    const query = {};

    // Search by title, author, or ISBN
    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [{ title: regex }, { author: regex }, { ISBN: regex }];
    }

    // Filter by category
    if (category && category.trim() && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Filter by availability
    if (available !== undefined && available !== '') {
      if (available === 'true' || available === true) {
        query.availableCopies = { $gt: 0 };
      } else if (available === 'false' || available === false) {
        query.availableCopies = 0;
      }
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (sort === 'title_asc') sortOption = { title: 1 };
    if (sort === 'title_desc') sortOption = { title: -1 };
    if (sort === 'author_asc') sortOption = { author: 1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const total = await Book.countDocuments(query);
    const books = await Book.find(query).sort(sortOption).skip(skip).limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      status: 'success',
      data: books,
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
 * @route   GET /api/books/categories
 * @desc    Get all distinct categories in catalog
 * @access  Private
 */
async function getCategories(req, res, next) {
  try {
    const categories = await Book.distinct('category');
    return res.status(200).json({
      status: 'success',
      data: categories.filter(Boolean).sort(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/books/:id
 * @desc    Get single book details by ID
 * @access  Private (All authenticated roles)
 */
async function getBookById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Book ID format.' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found in library catalog.' });
    }

    return res.status(200).json({
      status: 'success',
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/books/:id
 * @desc    Update book details
 * @access  Private (Admin & Librarian only)
 */
async function updateBook(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Book ID format.' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found.' });
    }

    const {
      title,
      ISBN,
      author,
      category,
      publisher,
      publicationYear,
      description,
      coverImage,
      totalCopies,
      availableCopies,
    } = req.body;

    // Check duplicate ISBN if changed
    if (ISBN && ISBN.trim().toUpperCase() !== book.ISBN) {
      const normalizedISBN = ISBN.trim().toUpperCase();
      const duplicate = await Book.findOne({ ISBN: normalizedISBN, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({
          status: 'error',
          message: `Another book already uses ISBN "${normalizedISBN}" ("${duplicate.title}").`,
        });
      }
      book.ISBN = normalizedISBN;
    }

    if (title && title.trim()) book.title = title.trim();
    if (author && author.trim()) book.author = author.trim();
    if (category && category.trim()) book.category = category.trim();
    if (publisher !== undefined) book.publisher = publisher ? publisher.trim() : '';
    if (publicationYear !== undefined) book.publicationYear = publicationYear ? Number(publicationYear) : null;
    if (description !== undefined) book.description = description ? description.trim() : '';
    if (coverImage !== undefined) book.coverImage = coverImage ? coverImage.trim() : '';

    // Calculate borrowed copies to protect inventory consistency
    const currentlyBorrowed = book.totalCopies - book.availableCopies;

    if (totalCopies !== undefined) {
      const newTotal = Number(totalCopies);
      if (isNaN(newTotal) || newTotal < 1) {
        return res.status(400).json({ status: 'error', message: 'Total copies must be at least 1.' });
      }

      if (newTotal < currentlyBorrowed) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot reduce total copies below currently borrowed count (${currentlyBorrowed} copies on loan).`,
        });
      }

      // If availableCopies was also provided
      if (availableCopies !== undefined) {
        const newAvailable = Number(availableCopies);
        if (isNaN(newAvailable) || newAvailable < 0) {
          return res.status(400).json({ status: 'error', message: 'Available copies cannot be negative.' });
        }
        if (newAvailable > newTotal) {
          return res.status(400).json({ status: 'error', message: 'Available copies cannot exceed total copies.' });
        }
        book.availableCopies = newAvailable;
      } else {
        // Adjust available copies based on new total and existing borrowed count
        book.availableCopies = newTotal - currentlyBorrowed;
      }

      book.totalCopies = newTotal;
    } else if (availableCopies !== undefined) {
      const newAvailable = Number(availableCopies);
      if (isNaN(newAvailable) || newAvailable < 0) {
        return res.status(400).json({ status: 'error', message: 'Available copies cannot be negative.' });
      }
      if (newAvailable > book.totalCopies) {
        return res.status(400).json({ status: 'error', message: 'Available copies cannot exceed total copies.' });
      }
      book.availableCopies = newAvailable;
    }

    await book.save();

    return res.status(200).json({
      status: 'success',
      message: 'Book updated successfully.',
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/books/:id
 * @desc    Delete book from catalog
 * @access  Private (Admin & Librarian only)
 */
async function deleteBook(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Book ID format.' });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found.' });
    }

    // Business requirement: Prevent deletion of books that are currently borrowed
    const currentlyBorrowed = book.totalCopies - book.availableCopies;
    const activeLoan = await BorrowRecord.findOne({
      book: id,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (currentlyBorrowed > 0 || activeLoan) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete book while copies are currently borrowed (${currentlyBorrowed > 0 ? currentlyBorrowed : 1} copy/copies active on loan).`,
      });
    }

    await Book.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: `Book "${book.title}" was successfully deleted from the catalog.`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBook,
  getBooks,
  getCategories,
  getBookById,
  updateBook,
  deleteBook,
};

