const mongoose = require('mongoose');
const BorrowRecord = require('../models/BorrowRecord');
const BorrowSetting = require('../models/BorrowSetting');
const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { sendNotification, recalculateQueuePositions } = require('../utils/scheduler');

/**
 * Helper to dynamically synchronize overdue status & calculate fine amount
 * Staff role is exempted from fines (fineAmount = 0).
 * Student role applies standard late fine (₹5 per day default or BorrowSetting).
 */
function calculateOverdueMetrics(record, finePerDay = 5, borrowerRole = null) {
  const now = new Date();
  const dueDate = new Date(record.dueDate);
  let overdueDays = 0;
  let computedFine = 0;

  const effectiveDate = record.status === 'Returned' && record.returnDate ? new Date(record.returnDate) : now;

  if (effectiveDate > dueDate) {
    const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const effMidnight = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), effectiveDate.getDate());
    const diffDays = Math.round((effMidnight.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24));
    overdueDays = Math.max(1, diffDays);

    // Determine borrower's role
    const role =
      borrowerRole ||
      (record.user && typeof record.user === 'object' && record.user.role) ||
      'Student';

    if (role === 'Staff') {
      computedFine = 0;
    } else {
      computedFine = overdueDays * finePerDay;
    }

    if (record.status !== 'Returned') {
      record.status = 'Overdue';
    }
  } else {
    if (record.status !== 'Returned') {
      record.status = 'Borrowed';
    }
  }

  // Only update fineAmount if it hasn't been explicitly cleared/paid
  if (record.finePaymentStatus !== 'Paid' && record.finePaymentStatus !== 'Waived') {
    record.fineAmount = computedFine;
    if (computedFine > 0) {
      record.finePaymentStatus = 'Unpaid';
    } else if (record.status === 'Returned') {
      record.finePaymentStatus = 'Paid';
    }
  }

  return { overdueDays, computedFine };
}

/**
 * @route   POST /api/borrow
 * @desc    Issue a book or create a borrowing loan
 * @access  Private (All authenticated roles; Students/Staff for self, Admin/Librarian for any user)
 */
async function createBorrow(req, res, next) {
  let decrementedBookId = null;
  try {
    const { bookId, userId, dueDate: customDueDate, remarks } = req.body;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ status: 'error', message: 'Valid Book ID is required.' });
    }

    // Determine target user
    let targetUserId = req.user._id;
    if (req.user.role === 'Admin' || req.user.role === 'Librarian') {
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        targetUserId = userId;
      }
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Borrower account not found.' });
    }

    const settings = await BorrowSetting.getSettings();

    // Check maximum active borrowing limits
    const maxAllowed =
      targetUser.role === 'Staff'
        ? settings.staffBorrowDurationDays ? settings.maxBooksPerStaff : 10
        : targetUser.role === 'Student'
        ? settings.maxBooksPerStudent || 4
        : 15;

    const activeCount = await BorrowRecord.countDocuments({
      user: targetUserId,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (activeCount >= maxAllowed) {
      return res.status(400).json({
        status: 'error',
        message: `Borrowing limit reached: ${targetUser.name} currently has ${activeCount} active loan(s) (maximum allowed: ${maxAllowed}).`,
      });
    }

    // Prevent duplicate active borrow for the same user and book
    const existingActiveRecord = await BorrowRecord.findOne({
      user: targetUserId,
      book: bookId,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    if (existingActiveRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'This user already has an active loan for this book.',
      });
    }

    // Calculate due date
    let calculatedDueDate;
    if (customDueDate && (req.user.role === 'Admin' || req.user.role === 'Librarian')) {
      const parsed = new Date(customDueDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ status: 'error', message: 'Custom due date must be a valid date.' });
      }
      calculatedDueDate = parsed;
    } else {
      const durationDays =
        targetUser.role === 'Staff'
          ? settings.staffBorrowDurationDays || 30
          : settings.studentBorrowDurationDays || 14;
      calculatedDueDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    // Check if target user has an active Available reservation hold for this book
    const activeHold = await Reservation.findOne({
      user: targetUserId,
      book: bookId,
      status: 'Available',
    });

    let book;
    if (activeHold) {
      // The copy was already set aside for this user upon return
      book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ status: 'error', message: 'Book not found.' });
      }
      activeHold.status = 'Fulfilled';
      activeHold.fulfilledAt = new Date();
      await activeHold.save();
      await recalculateQueuePositions(bookId);
    } else {
      // Atomic availability check & decrement (prevents race conditions and negative counts)
      book = await Book.findOneAndUpdate(
        { _id: bookId, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );

      if (!book) {
        return res.status(400).json({
          status: 'error',
          message: 'No copies available for borrowing. All copies are currently on loan. You may place a reservation.',
        });
      }

      decrementedBookId = book._id;
    }

    // Create the BorrowRecord
    const newRecord = await BorrowRecord.create({
      user: targetUserId,
      book: bookId,
      borrowDate: new Date(),
      dueDate: calculatedDueDate,
      status: 'Borrowed',
      fineAmount: 0,
      finePaymentStatus: 'Unpaid',
      issuedBy: req.user._id,
      remarks: remarks || '',
      auditLog: [
        {
          action: 'BORROWED',
          performedBy: req.user._id,
          timestamp: new Date(),
          notes: `Book issued by ${req.user.name} (${req.user.role}) to ${targetUser.name} (${targetUser.role}).`,
        },
      ],
    });

    // Populate for clean response
    const populated = await BorrowRecord.findById(newRecord._id)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .populate('issuedBy', 'name email role');

    return res.status(201).json({
      status: 'success',
      message: `Book '${book.title}' successfully borrowed. Due date: ${calculatedDueDate.toISOString().split('T')[0]}.`,
      data: populated,
    });
  } catch (error) {
    // If book was decremented but record creation failed, rollback the stock count atomically
    if (decrementedBookId) {
      await Book.findByIdAndUpdate(decrementedBookId, { $inc: { availableCopies: 1 } });
    }
    next(error);
  }
}

/**
 * @route   GET /api/borrow/my
 * @desc    View the logged-in user's borrowing history
 * @access  Private (All authenticated roles)
 */
async function getMyBorrowings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const { status, sort } = req.query;
    const query = { user: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    const settings = await BorrowSetting.getSettings();

    // Fetch and sync active records
    const activeRecords = await BorrowRecord.find({
      user: req.user._id,
      status: { $in: ['Borrowed', 'Overdue'] },
    });

    for (const rec of activeRecords) {
      const prevStatus = rec.status;
      const prevFine = rec.fineAmount;
      calculateOverdueMetrics(rec, settings.finePerDay, req.user.role);
      if (rec.status !== prevStatus || rec.fineAmount !== prevFine) {
        await rec.save();
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'due_asc') sortOption = { dueDate: 1 };
    if (sort === 'due_desc') sortOption = { dueDate: -1 };

    const total = await BorrowRecord.countDocuments(query);
    const records = await BorrowRecord.find(query)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    // Calculate user summary
    const summary = {
      activeLoans: await BorrowRecord.countDocuments({ user: req.user._id, status: { $in: ['Borrowed', 'Overdue'] } }),
      overdueLoans: await BorrowRecord.countDocuments({ user: req.user._id, status: 'Overdue' }),
      returnedLoans: await BorrowRecord.countDocuments({ user: req.user._id, status: 'Returned' }),
      totalFines: (
        await BorrowRecord.aggregate([
          { $match: { user: req.user._id, finePaymentStatus: 'Unpaid' } },
          { $group: { _id: null, total: { $sum: '$fineAmount' } } },
        ])
      )[0]?.total || 0,
    };

    return res.status(200).json({
      status: 'success',
      data: records,
      summary,
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
 * @route   GET /api/borrow
 * @desc    View all borrowing records across all users
 * @access  Private (Admin & Librarian only)
 */
async function getAllBorrowings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status, role, search, sort } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    const settings = await BorrowSetting.getSettings();

    // Check & sync all active loans overdue metrics
    const activeRecords = await BorrowRecord.find({ status: { $in: ['Borrowed', 'Overdue'] } }).populate('user', 'role name email');
    for (const rec of activeRecords) {
      const prevStatus = rec.status;
      const prevFine = rec.fineAmount;
      calculateOverdueMetrics(rec, settings.finePerDay, rec.user?.role);
      if (rec.status !== prevStatus || rec.fineAmount !== prevFine) {
        await rec.save();
      }
    }

    // Search filter across book title / ISBN or user name / email
    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');

      const [matchingUsers, matchingBooks] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
        Book.find({ $or: [{ title: regex }, { ISBN: regex }, { author: regex }] }).select('_id'),
      ]);

      query.$or = [
        { user: { $in: matchingUsers.map((u) => u._id) } },
        { book: { $in: matchingBooks.map((b) => b._id) } },
      ];
    }

    // Role filter
    if (role && ['Admin', 'Librarian', 'Staff', 'Student'].includes(role)) {
      const roleUsers = await User.find({ role }).select('_id');
      query.user = { $in: roleUsers.map((u) => u._id) };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'due_asc') sortOption = { dueDate: 1 };
    if (sort === 'due_desc') sortOption = { dueDate: -1 };
    if (sort === 'fine_desc') sortOption = { fineAmount: -1 };

    const total = await BorrowRecord.countDocuments(query);
    const records = await BorrowRecord.find(query)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .populate('issuedBy', 'name email role')
      .populate('returnedBy', 'name email role')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit) || 1;

    // Aggregated metrics
    const [totalActive, totalOverdue, totalReturned, fineStats] = await Promise.all([
      BorrowRecord.countDocuments({ status: { $in: ['Borrowed', 'Overdue'] } }),
      BorrowRecord.countDocuments({ status: 'Overdue' }),
      BorrowRecord.countDocuments({ status: 'Returned' }),
      BorrowRecord.aggregate([
        {
          $group: {
            _id: null,
            totalFines: { $sum: '$fineAmount' },
            unpaidFines: {
              $sum: {
                $cond: [{ $eq: ['$finePaymentStatus', 'Unpaid'] }, '$fineAmount', 0],
              },
            },
            paidFines: {
              $sum: {
                $cond: [{ $eq: ['$finePaymentStatus', 'Paid'] }, '$fineAmount', 0],
              },
            },
          },
        },
      ]),
    ]);

    const fineSummary = fineStats[0] || { totalFines: 0, unpaidFines: 0, paidFines: 0 };

    return res.status(200).json({
      status: 'success',
      data: records,
      metrics: {
        totalActive,
        totalOverdue,
        totalReturned,
        fineSummary,
      },
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
 * @route   GET /api/borrow/overdue
 * @desc    View all overdue records with automatic fine calculations
 * @access  Private (Admin & Librarian only)
 */
async function getOverdueBorrowings(req, res, next) {
  try {
    const settings = await BorrowSetting.getSettings();

    // Query unreturned records whose due date is in the past
    const now = new Date();
    const query = {
      dueDate: { $lt: now },
      status: { $ne: 'Returned' },
    };

    const overdueList = await BorrowRecord.find(query)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .sort({ dueDate: 1 });

    // Sync live fine amounts
    for (const rec of overdueList) {
      calculateOverdueMetrics(rec, settings.finePerDay, rec.user?.role);
      await rec.save();
    }

    return res.status(200).json({
      status: 'success',
      count: overdueList.length,
      data: overdueList,
      ratePerDay: settings.finePerDay,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/borrow/:id
 * @desc    View an authorized record (Admin/Librarian can view all; Staff/Student can only view their own)
 * @access  Private
 */
async function getBorrowRecordById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid record ID format.' });
    }

    const record = await BorrowRecord.findById(id)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .populate('issuedBy', 'name email role')
      .populate('returnedBy', 'name email role')
      .populate('finePaidBy', 'name email role');

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Borrowing record not found.' });
    }

    // Role-based authorization
    const isOwner = record.user._id.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'Admin' || req.user.role === 'Librarian';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not authorized to view this borrowing record.',
      });
    }

    // Sync metrics
    const settings = await BorrowSetting.getSettings();
    calculateOverdueMetrics(record, settings.finePerDay, record.user?.role);
    await record.save();

    return res.status(200).json({
      status: 'success',
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/borrow/:id/return
 * @desc    Process return of a borrowed book
 * @access  Private (Admin & Librarian, or borrower user)
 */
async function returnBook(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid record ID format.' });
    }

    const record = await BorrowRecord.findById(id);
    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Borrowing record not found.' });
    }

    // Determine borrower and role
    const borrower = await User.findById(record.user).select('role name email');
    const borrowerRole = borrower?.role || 'Student';

    // Check authorization: Admin, Librarian, or the borrower themselves
    const isOwner = record.user.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'Admin' || req.user.role === 'Librarian';

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You are not authorized to process this return.',
      });
    }

    // Prevent duplicate return
    if (record.status === 'Returned') {
      const returnDateStr = record.returnDate
        ? new Date(record.returnDate).toLocaleDateString()
        : 'previously';
      return res.status(400).json({
        status: 'error',
        message: `This book has already been returned (${returnDateStr}). Duplicate returns are not permitted.`,
      });
    }

    const settings = await BorrowSetting.getSettings();
    const returnDate = new Date();
    const dueDate = new Date(record.dueDate);

    // Calculate overdue days and fine amount based on role:
    // If borrower is Staff, fineAmount = 0 (exempted).
    // If borrower is Student, apply standard late fine (₹5 per day).
    let overdueDays = 0;
    let fineAmount = 0;

    if (returnDate > dueDate) {
      const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const retMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
      const diffDays = Math.round((retMidnight.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24));
      overdueDays = Math.max(1, diffDays);

      if (borrowerRole === 'Staff') {
        fineAmount = 0;
      } else {
        fineAmount = overdueDays * (settings.finePerDay || 5);
      }
    }

    record.returnDate = returnDate;
    record.status = 'Returned';
    record.fineAmount = fineAmount;
    record.returnedBy = req.user._id;

    if (fineAmount > 0) {
      record.finePaymentStatus = 'Unpaid';
    } else {
      record.finePaymentStatus = 'Paid';
    }

    record.auditLog.push({
      action: 'RETURNED',
      performedBy: req.user._id,
      timestamp: returnDate,
      notes: `Returned by ${req.user.name} (${req.user.role}). ${
        borrowerRole === 'Staff' && overdueDays > 0
          ? `Overdue by ${overdueDays} day(s) - Fine: ₹0 (Staff Exempted)`
          : overdueDays > 0
          ? `Overdue by ${overdueDays} day(s) - Fine: ₹${fineAmount}`
          : 'Returned on time - No fine.'
      }`,
    });

    await record.save();

    // Atomically find earliest pending reservation in FIFO queue to prevent race conditions
    const holdDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const returnNow = new Date();

    const nextReservation = await Reservation.findOneAndUpdate(
      {
        book: record.book,
        status: { $in: ['Pending', 'Waiting'] },
      },
      {
        $set: {
          status: 'Available',
          holdUntil: holdDeadline,
          expiryDate: holdDeadline,
          notifiedAt: returnNow,
        },
      },
      {
        sort: { reservedAt: 1, reservationDate: 1 },
        new: true,
      }
    ).populate('user', 'name email');

    let updatedBook;
    let reservationHold = null;

    if (nextReservation) {
      // Hold copy specifically for the reserved user (do not increment availableCopies in catalog)
      await recalculateQueuePositions(record.book);

      updatedBook = await Book.findById(record.book);

      await sendNotification({
        userId: nextReservation.user._id,
        title: 'Reserved Book Ready for Pickup!',
        message: `Good news! '${updatedBook ? updatedBook.title : 'Book'}' has arrived and is ready for pickup at the circulation desk. Please collect it before ${holdDeadline.toLocaleDateString()}.`,
        type: 'Reservation',
        relatedId: nextReservation._id,
        relatedModel: 'Reservation',
      });

      reservationHold = {
        reservedUser: nextReservation.user?.name,
        holdUntil: holdDeadline,
      };
    } else {
      // No waiting reservations; release copy back to general catalog stock
      updatedBook = await Book.findByIdAndUpdate(
        record.book,
        { $inc: { availableCopies: 1 } },
        { new: true }
      );
    }

    const populated = await BorrowRecord.findById(record._id)
      .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
      .populate('user', 'name email role')
      .populate('returnedBy', 'name email role');

    return res.status(200).json({
      status: 'success',
      message: `Book '${updatedBook ? updatedBook.title : 'Book'}' returned successfully.${
        borrowerRole === 'Staff' && overdueDays > 0
          ? ` Overdue by ${overdueDays} day(s) - Fine exempted for Staff member.`
          : fineAmount > 0
          ? ` Overdue fine assessed: ₹${fineAmount} (${overdueDays} days @ ₹${settings.finePerDay || 5}/day).`
          : ' No fines accrued.'
      }${reservationHold ? ` Reserved for ${reservationHold.reservedUser} (pickup hold until ${reservationHold.holdUntil.toLocaleDateString()}).` : ''}`,
      data: populated,
      overdueNotice: overdueDays > 0 ? { overdueDays, fineAmount, finePaymentStatus: fineAmount > 0 ? 'Unpaid' : 'Paid' } : null,
      reservationHold,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/borrow/:id/pay-fine
 * @desc    Record or waive fine payment for a returned or overdue record
 * @access  Private (Admin & Librarian only)
 */
async function payOrWaiveFine(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // 'Pay' or 'Waive'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Invalid record ID format.' });
    }

    if (!['Pay', 'Waive'].includes(action)) {
      return res.status(400).json({ status: 'error', message: "Action must be either 'Pay' or 'Waive'." });
    }

    const record = await BorrowRecord.findById(id)
      .populate('user', 'name email role')
      .populate('book', 'title ISBN');

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Borrowing record not found.' });
    }

    if (record.fineAmount <= 0) {
      return res.status(400).json({ status: 'error', message: 'This record has no fines accrued.' });
    }

    if (record.finePaymentStatus === 'Paid') {
      return res.status(400).json({ status: 'error', message: 'Fine for this record has already been marked as Paid.' });
    }

    if (record.finePaymentStatus === 'Waived') {
      return res.status(400).json({ status: 'error', message: 'Fine for this record has already been Waived.' });
    }

    if (action === 'Pay') {
      record.finePaymentStatus = 'Paid';
      record.paidAmount = record.fineAmount;
    } else if (action === 'Waive') {
      record.finePaymentStatus = 'Waived';
      record.paidAmount = 0;
    }

    record.paidAt = new Date();
    record.finePaidBy = req.user._id;

    record.auditLog.push({
      action: action === 'Pay' ? 'FINE_PAID' : 'FINE_WAIVED',
      performedBy: req.user._id,
      timestamp: new Date(),
      notes: `${action === 'Pay' ? 'Fine recorded as Paid' : 'Fine Waived'} by ${req.user.name} (${req.user.role}). Amount: ₹${record.fineAmount}. ${remarks || ''}`,
    });

    await record.save();

    return res.status(200).json({
      status: 'success',
      message: `Fine of ₹${record.fineAmount} successfully marked as ${record.finePaymentStatus}.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/borrow/settings
 * @desc    Get borrowing system configuration (fine per day, durations)
 * @access  Private (All authenticated roles)
 */
async function getBorrowSettings(_req, res, next) {
  try {
    const settings = await BorrowSetting.getSettings();
    return res.status(200).json({
      status: 'success',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PUT /api/borrow/settings
 * @desc    Update borrowing configuration
 * @access  Private (Admin only)
 */
async function updateBorrowSettings(req, res, next) {
  try {
    const {
      finePerDay,
      studentBorrowDurationDays,
      staffBorrowDurationDays,
      maxBooksPerStudent,
      maxBooksPerStaff,
    } = req.body;

    const settings = await BorrowSetting.getSettings();

    if (finePerDay !== undefined) {
      const rate = Number(finePerDay);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ status: 'error', message: 'Fine per day must be a non-negative number.' });
      }
      settings.finePerDay = rate;
    }

    if (studentBorrowDurationDays !== undefined) {
      const days = Number(studentBorrowDurationDays);
      if (isNaN(days) || days < 1) {
        return res.status(400).json({ status: 'error', message: 'Student duration must be at least 1 day.' });
      }
      settings.studentBorrowDurationDays = days;
    }

    if (staffBorrowDurationDays !== undefined) {
      const days = Number(staffBorrowDurationDays);
      if (isNaN(days) || days < 1) {
        return res.status(400).json({ status: 'error', message: 'Staff duration must be at least 1 day.' });
      }
      settings.staffBorrowDurationDays = days;
    }

    if (maxBooksPerStudent !== undefined) settings.maxBooksPerStudent = Number(maxBooksPerStudent);
    if (maxBooksPerStaff !== undefined) settings.maxBooksPerStaff = Number(maxBooksPerStaff);

    await settings.save();

    return res.status(200).json({
      status: 'success',
      message: 'Borrowing configuration updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/borrow/reserve
 * @desc    Reserve an unavailable book
 * @access  Private (Students and Staff)
 */
async function createReservation(req, res, next) {
  try {
    const { bookId } = req.body;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ status: 'error', message: 'Valid Book ID is required.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ status: 'error', message: 'Book not found.' });
    }

    // Check if user already has an active hold
    const existing = await Reservation.findOne({
      user: req.user._id,
      book: bookId,
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending reservation for this book.',
      });
    }

    const currentHoldCount = await Reservation.countDocuments({ book: bookId, status: 'Pending' });

    const reservation = await Reservation.create({
      user: req.user._id,
      book: bookId,
      status: 'Pending',
      queuePosition: currentHoldCount + 1,
      pickupLocation: 'Main Circulation Desk',
    });

    const populated = await Reservation.findById(reservation._id)
      .populate('book', 'title author ISBN category coverImage')
      .populate('user', 'name email role');

    return res.status(201).json({
      status: 'success',
      message: `Reservation placed for '${book.title}'. Queue position #${reservation.queuePosition}.`,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/borrow/reservations/my
 * @desc    Get user's reservations
 * @access  Private
 */
async function getMyReservations(req, res, next) {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('book', 'title author ISBN category coverImage availableCopies')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/borrow/reservations
 * @desc    Get all reservations (Admin & Librarian only)
 * @access  Private (Admin & Librarian)
 */
async function getAllReservations(req, res, next) {
  try {
    const reservations = await Reservation.find()
      .populate('book', 'title author ISBN category coverImage availableCopies')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBorrow,
  getMyBorrowings,
  getAllBorrowings,
  getOverdueBorrowings,
  getBorrowRecordById,
  returnBook,
  payOrWaiveFine,
  getBorrowSettings,
  updateBorrowSettings,
  createReservation,
  getMyReservations,
  getAllReservations,
};
