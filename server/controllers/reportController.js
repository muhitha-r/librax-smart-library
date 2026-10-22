const mongoose = require('mongoose');
const BorrowRecord = require('../models/BorrowRecord');
const User = require('../models/User');
const Book = require('../models/Book');

/**
 * Builds the MongoDB query based on report type, date range, search, and status.
 */
async function buildReportQuery(queryObject) {
  const { type = 'borrowing', startDate, endDate, status, search } = queryObject;
  const match = {};

  // 1. Date Range Validation & Filtering
  let start = null;
  let end = null;

  if (startDate) {
    start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start date format. Please use YYYY-MM-DD.');
    }
    start.setHours(0, 0, 0, 0);
  }

  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error('Invalid end date format. Please use YYYY-MM-DD.');
    }
    end.setHours(23, 59, 59, 999);
  }

  if (start && end && start > end) {
    throw new Error('Invalid date range. Start date must be before or equal to End date.');
  }

  const dateFilter = {};
  if (start) dateFilter.$gte = start;
  if (end) dateFilter.$lte = end;

  // 2. Filter by Report Type
  switch (type.toLowerCase()) {
    case 'returns':
      match.status = 'Returned';
      if (Object.keys(dateFilter).length > 0) {
        match.returnDate = dateFilter;
      } else {
        match.returnDate = { $ne: null };
      }
      break;

    case 'overdue':
      match.status = 'Overdue';
      if (Object.keys(dateFilter).length > 0) {
        match.dueDate = dateFilter;
      }
      break;

    case 'fines':
      match.fineAmount = { $gt: 0 };
      if (Object.keys(dateFilter).length > 0) {
        match.$or = [{ returnDate: dateFilter }, { dueDate: dateFilter }, { createdAt: dateFilter }];
      }
      break;

    case 'borrowing':
    default:
      if (Object.keys(dateFilter).length > 0) {
        match.borrowDate = dateFilter;
      }
      break;
  }

  // 3. Status filter override (if explicitly provided)
  if (status && status !== 'All') {
    if (['Borrowed', 'Returned', 'Overdue'].includes(status)) {
      match.status = status;
    } else if (['Unpaid', 'Paid', 'Waived'].includes(status)) {
      match.finePaymentStatus = status;
    }
  }

  // 4. Search Filter
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const [matchingUsers, matchingBooks] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
      Book.find({ $or: [{ title: regex }, { ISBN: regex }, { author: regex }] }).select('_id'),
    ]);

    match.$and = match.$and || [];
    match.$and.push({
      $or: [
        { user: { $in: matchingUsers.map((u) => u._id) } },
        { book: { $in: matchingBooks.map((b) => b._id) } },
      ],
    });
  }

  return { match, type: type.toLowerCase() };
}

/**
 * @route   GET /api/reports
 * @desc    Generate filtered borrowing, returns, overdue, or fines report
 * @access  Private (Admin & Librarian)
 */
async function getReports(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    let matchQuery;
    let reportType;
    try {
      const built = await buildReportQuery(req.query);
      matchQuery = built.match;
      reportType = built.type;
    } catch (validationErr) {
      return res.status(400).json({ status: 'error', message: validationErr.message });
    }

    const sortOption = { createdAt: -1 };
    if (reportType === 'returns') sortOption.returnDate = -1;
    if (reportType === 'overdue') sortOption.dueDate = 1;
    if (reportType === 'fines') sortOption.fineAmount = -1;

    const [total, records, summaryAgg] = await Promise.all([
      BorrowRecord.countDocuments(matchQuery),
      BorrowRecord.find(matchQuery)
        .populate('book', 'title author ISBN category coverImage totalCopies availableCopies')
        .populate('user', 'name email role')
        .populate('issuedBy', 'name email role')
        .populate('returnedBy', 'name email role')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      BorrowRecord.aggregate([
        { $match: matchQuery },
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
            overdueLoans: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0],
              },
            },
            returnedLoans: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Returned'] }, 1, 0],
              },
            },
            activeLoans: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Borrowed'] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalFines: 0,
      unpaidFines: 0,
      paidFines: 0,
      overdueLoans: 0,
      returnedLoans: 0,
      activeLoans: 0,
    };

    return res.status(200).json({
      status: 'success',
      reportType,
      data: records,
      summary: {
        totalRecords: total,
        totalFines: summary.totalFines,
        unpaidFines: summary.unpaidFines,
        paidFines: summary.paidFines,
        activeLoans: summary.activeLoans,
        returnedLoans: summary.returnedLoans,
        overdueLoans: summary.overdueLoans,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Escapes a single CSV value according to RFC 4180
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * @route   GET /api/reports/export
 * @desc    Export filtered report to CSV format with stream/attachment download
 * @access  Private (Admin & Librarian)
 */
async function exportReportCSV(req, res, next) {
  try {
    let matchQuery;
    let reportType;
    try {
      const built = await buildReportQuery(req.query);
      matchQuery = built.match;
      reportType = built.type;
    } catch (validationErr) {
      return res.status(400).json({ status: 'error', message: validationErr.message });
    }

    // Cap export at 5,000 records for server memory safety
    const records = await BorrowRecord.find(matchQuery)
      .populate('book', 'title author ISBN category')
      .populate('user', 'name email role')
      .populate('issuedBy', 'name role')
      .populate('returnedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(5000);

    const headers = [
      'Transaction ID',
      'Report Type',
      'Book Title',
      'ISBN',
      'Author',
      'Category',
      'Borrower Name',
      'Borrower Email',
      'Borrower Role',
      'Borrow Date',
      'Due Date',
      'Return Date',
      'Status',
      'Fine Amount (INR)',
      'Fine Status',
      'Issued By',
      'Returned By',
      'Remarks',
    ];

    const rows = records.map((r) => [
      r._id.toString(),
      reportType.toUpperCase(),
      r.book?.title || 'Unknown Title',
      r.book?.ISBN || 'N/A',
      r.book?.author || 'N/A',
      r.book?.category || 'N/A',
      r.user?.name || 'Unknown User',
      r.user?.email || 'N/A',
      r.user?.role || 'N/A',
      r.borrowDate ? new Date(r.borrowDate).toISOString().split('T')[0] : '',
      r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '',
      r.returnDate ? new Date(r.returnDate).toISOString().split('T')[0] : 'Not Returned',
      r.status,
      r.fineAmount || 0,
      r.finePaymentStatus || 'N/A',
      r.issuedBy ? `${r.issuedBy.name} (${r.issuedBy.role})` : 'System',
      r.returnedBy ? `${r.returnedBy.name} (${r.returnedBy.role})` : 'N/A',
      r.remarks || '',
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\r\n');

    const filename = `librax-${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReports,
  exportReportCSV,
};

