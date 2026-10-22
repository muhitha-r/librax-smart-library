const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const { sendNotification, recalculateQueuePositions } = require('../utils/scheduler');

/**
 * @route   POST /api/reservations
 * @desc    Reserve an unavailable book (FIFO queueing)
 * @access  Private (Student & Staff only)
 */
async function createReservation(req, res, next) {
  try {
    const { bookId, notes } = req.body;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ status: 'error', message: 'Valid Book ID is required.' });
    }

    // Role check: Only Students and Staff can place reservations
    if (!['Student', 'Staff'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Book reservations are only available for Students and Staff.',
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found in library catalog.' });
    }

    // Only allow reserving when all copies are checked out / unavailable (availableCopies === 0)
    if (book.availableCopies > 0) {
      return res.status(400).json({
        status: 'error',
        message: `This book currently has ${book.availableCopies} available copy/copies. You can borrow it directly without waiting in a queue.`,
      });
    }

    const userId = req.user._id;

    // Check if user currently has an active loan for this book
    const activeLoan = await BorrowRecord.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (activeLoan) {
      return res.status(400).json({
        status: 'error',
        message: 'You currently have an active borrowing loan for this title.',
      });
    }

    // Check duplicate active reservation
    const existingActiveReservation = await Reservation.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['Pending', 'Waiting', 'Available'] },
    });

    if (existingActiveReservation) {
      return res.status(400).json({
        status: 'error',
        message: `You already have an active reservation for this book (Queue Position #${existingActiveReservation.queuePosition || 1}).`,
      });
    }

    // Determine current FIFO queue position for this book
    const waitingCount = await Reservation.countDocuments({
      book: bookId,
      status: { $in: ['Pending', 'Waiting'] },
    });

    const queuePosition = waitingCount + 1;
    const now = new Date();

    const newReservation = await Reservation.create({
      user: userId,
      book: bookId,
      reservedAt: now,
      reservationDate: now,
      queuePosition,
      status: 'Pending',
      notes: notes ? notes.trim() : '',
    });

    const populated = await Reservation.findById(newReservation._id)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role');

    // Send confirmation in-app notification
    await sendNotification({
      userId,
      title: 'Book Reservation Confirmed',
      message: `You are #${queuePosition} in line for '${book.title}'. We will notify you as soon as a copy is returned.`,
      type: 'Reservation',
      relatedId: newReservation._id,
      relatedModel: 'Reservation',
    });

    return res.status(201).json({
      status: 'success',
      message: `Reservation placed successfully for '${book.title}'. You are #${queuePosition} in the queue.`,
      data: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active reservation for this book.',
      });
    }
    next(error);
  }
}

/**
 * @route   GET /api/reservations/my
 * @desc    View the logged-in user's reservations with dynamic FIFO queue position
 * @access  Private (All authenticated roles)
 */
async function getMyReservations(req, res, next) {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .sort({ createdAt: -1 });

    // Dynamically calculate FIFO queue positions based on reservedAt / reservationDate timestamps
    const reservationsWithPositions = await Promise.all(
      reservations.map(async (doc) => {
        const r = doc.toObject();
        if (['Pending', 'Waiting'].includes(r.status)) {
          const timestamp = r.reservedAt || r.reservationDate || r.createdAt;
          const earlierCount = await Reservation.countDocuments({
            book: r.book?._id || r.book,
            status: { $in: ['Pending', 'Waiting'] },
            $or: [
              { reservedAt: { $lt: timestamp } },
              { reservedAt: { $exists: false }, reservationDate: { $lt: timestamp } },
              { reservedAt: timestamp, _id: { $lt: r._id } },
            ],
          });
          r.queuePosition = earlierCount + 1;
        }
        return r;
      })
    );

    const waiting = reservationsWithPositions.filter((r) => ['Pending', 'Waiting'].includes(r.status));
    const available = reservationsWithPositions.filter((r) => r.status === 'Available');
    const history = reservationsWithPositions.filter((r) => ['Fulfilled', 'Cancelled', 'Expired'].includes(r.status));

    return res.status(200).json({
      status: 'success',
      data: reservationsWithPositions,
      summary: {
        total: reservationsWithPositions.length,
        waitingCount: waiting.length,
        readyForPickupCount: available.length,
        historyCount: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/reservations
 * @desc    Admin & Librarian reservation management
 * @access  Private (Admin & Librarian only)
 */
async function getAllReservations(req, res, next) {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status) {
      if (status === 'Waiting') {
        query.status = { $in: ['Waiting', 'Pending'] };
      } else {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const [matchingUsers, matchingBooks] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
        Book.find({ $or: [{ title: regex }, { ISBN: regex }, { author: regex }] }).select('_id'),
      ]);

      query.$or = [
        { user: { $in: matchingUsers.map((u) => u._id) } },
        { book: { $in: matchingBooks.map((b) => b._id) } },
      ];
    }

    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('user', 'name email role')
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('cancelledBy', 'name role')
      .sort({ reservationDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary counts for metrics
    const [totalWaiting, totalAvailable, totalFulfilled, totalCancelled, totalExpired] = await Promise.all([
      Reservation.countDocuments({ status: { $in: ['Waiting', 'Pending'] } }),
      Reservation.countDocuments({ status: 'Available' }),
      Reservation.countDocuments({ status: 'Fulfilled' }),
      Reservation.countDocuments({ status: 'Cancelled' }),
      Reservation.countDocuments({ status: 'Expired' }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: reservations,
      metrics: {
        totalWaiting,
        totalAvailable,
        totalFulfilled,
        totalCancelled,
        totalExpired,
      },
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
 * @route   PATCH /api/reservations/:id/cancel
 * @desc    Cancel an eligible reservation
 * @access  Private (Owner, Admin, or Librarian)
 */
async function cancelReservation(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Reservation ID format.' });
    }

    const reservation = await Reservation.findById(id).populate('book user');
    if (!reservation) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' });
    }

    const isOwner = reservation.user._id.toString() === req.user._id.toString();
    const isPrivileged = ['Admin', 'Librarian'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You cannot cancel another user’s reservation.',
      });
    }

    if (['Cancelled', 'Fulfilled', 'Expired'].includes(reservation.status)) {
      return res.status(400).json({
        status: 'error',
        message: `Reservation is already in '${reservation.status}' status and cannot be cancelled.`,
      });
    }

    const previousStatus = reservation.status;
    reservation.status = 'Cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = req.user._id;
    await reservation.save();

    const bookId = reservation.book._id || reservation.book;

    // If reservation was holding a copy ('Available'), atomically reassign hold or restore catalog stock
    if (previousStatus === 'Available') {
      const holdDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const nextInLine = await Reservation.findOneAndUpdate(
        {
          book: bookId,
          status: { $in: ['Pending', 'Waiting'] },
        },
        {
          $set: {
            status: 'Available',
            holdUntil: holdDeadline,
            expiryDate: holdDeadline,
            notifiedAt: new Date(),
          },
        },
        {
          sort: { reservedAt: 1, reservationDate: 1 },
          new: true,
        }
      ).populate('user');

      if (nextInLine) {
        await sendNotification({
          userId: nextInLine.user._id,
          title: 'Reserved Book Ready for Pickup',
          message: `Good news! '${reservation.book?.title}' is now available for you to pick up. Please claim it before ${holdDeadline.toLocaleDateString()}.`,
          type: 'Reservation',
          relatedId: nextInLine._id,
          relatedModel: 'Reservation',
        });
      } else {
        await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      }
    }

    // Re-adjust queue positions for remaining waiting entries
    await recalculateQueuePositions(bookId);

    // Notify the user if cancelled by staff/admin
    if (!isOwner) {
      await sendNotification({
        userId: reservation.user._id,
        title: 'Reservation Cancelled by Library Staff',
        message: `Your reservation for '${reservation.book?.title}' has been cancelled by ${req.user.name} (${req.user.role}).`,
        type: 'Reservation',
        relatedId: reservation._id,
        relatedModel: 'Reservation',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Reservation for '${reservation.book?.title || 'Book'}' was successfully cancelled.`,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/reservations/:id/fulfill
 * @desc    Fulfill a reservation when the book is checked out to the reserved user
 * @access  Private (Admin & Librarian only)
 */
async function fulfillReservation(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Reservation ID format.' });
    }

    const reservation = await Reservation.findById(id).populate('book user');
    if (!reservation) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' });
    }

    if (reservation.status === 'Fulfilled') {
      return res.status(400).json({
        status: 'error',
        message: 'This reservation has already been marked as Fulfilled.',
      });
    }

    reservation.status = 'Fulfilled';
    reservation.fulfilledAt = new Date();
    await reservation.save();

    const bookId = reservation.book._id || reservation.book;
    await recalculateQueuePositions(bookId);

    await sendNotification({
      userId: reservation.user._id,
      title: 'Reservation Fulfilled',
      message: `Your reservation hold on '${reservation.book?.title}' has been fulfilled at the circulation desk.`,
      type: 'Reservation',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
    });

    return res.status(200).json({
      status: 'success',
      message: `Reservation for '${reservation.user?.name}' has been marked as Fulfilled.`,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/reservations/:id/notify
 * @desc    Authorized workflow for marking a reservation as available and notifying the user
 * @access  Private (Admin & Librarian only)
 */
async function notifyReservation(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Reservation ID format.' });
    }

    const reservation = await Reservation.findById(id).populate('book user');
    if (!reservation) {
      return res.status(404).json({ status: 'error', message: 'Reservation not found.' });
    }

    const holdDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days hold

    reservation.status = 'Available';
    reservation.holdUntil = holdDeadline;
    reservation.expiryDate = holdDeadline;
    reservation.notifiedAt = new Date();
    await reservation.save();

    await sendNotification({
      userId: reservation.user._id,
      title: 'Reserved Book Ready for Pickup',
      message: `'${reservation.book?.title}' is now ready for pickup at the circulation desk. Please collect it before ${holdDeadline.toLocaleDateString()}.`,
      type: 'Reservation',
      relatedId: reservation._id,
      relatedModel: 'Reservation',
    });

    return res.status(200).json({
      status: 'success',
      message: `User '${reservation.user?.name}' notified. Copy is held until ${holdDeadline.toLocaleDateString()}.`,
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
  notifyReservation,
};

