const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const Reservation = require('../models/Reservation');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Comprehensive real-time analytics for Admin Dashboard
 * @access  Private (Admin only)
 */
async function getAdminAnalytics(req, res, next) {
  try {
    const now = new Date();

    // 1. High-level KPI metrics
    const [
      totalBooks,
      booksAggregate,
      totalUsers,
      usersByRole,
      borrowedCount,
      overdueCount,
      returnedCount,
      activeReservations,
      finesAggregate,
    ] = await Promise.all([
      Book.countDocuments(),
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' },
          },
        },
      ]),
      User.countDocuments(),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
      BorrowRecord.countDocuments({ status: 'Borrowed' }),
      BorrowRecord.countDocuments({ status: 'Overdue' }),
      BorrowRecord.countDocuments({ status: 'Returned' }),
      Reservation.countDocuments({ status: { $in: ['Waiting', 'Available', 'Pending'] } }),
      BorrowRecord.aggregate([
        {
          $group: {
            _id: null,
            totalFines: { $sum: '$fineAmount' },
            pendingFines: {
              $sum: {
                $cond: [{ $eq: ['$finePaymentStatus', 'Unpaid'] }, '$fineAmount', 0],
              },
            },
            paidFines: {
              $sum: {
                $cond: [{ $eq: ['$finePaymentStatus', 'Paid'] }, '$fineAmount', 0],
              },
            },
            unpaidCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$finePaymentStatus', 'Unpaid'] },
                      { $gt: ['$fineAmount', 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const bookCopies = booksAggregate[0] || { totalCopies: 0, availableCopies: 0 };
    const fineSummary = finesAggregate[0] || {
      totalFines: 0,
      pendingFines: 0,
      paidFines: 0,
      unpaidCount: 0,
    };

    // Role breakdown mapping
    const rolesMap = { Admin: 0, Librarian: 0, Staff: 0, Student: 0 };
    usersByRole.forEach((item) => {
      if (item._id && rolesMap[item._id] !== undefined) {
        rolesMap[item._id] = item.count;
      }
    });

    // 2. Monthly Trends (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyDataMap = new Map();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`;
      monthlyDataMap.set(key, { key, month: label, borrows: 0, returns: 0 });
    }

    const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);

    const [monthlyBorrows, monthlyReturns] = await Promise.all([
      BorrowRecord.aggregate([
        { $match: { borrowDate: { $gte: sixMonthsStart } } },
        {
          $group: {
            _id: {
              year: { $year: '$borrowDate' },
              month: { $month: '$borrowDate' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      BorrowRecord.aggregate([
        { $match: { returnDate: { $ne: null, $gte: sixMonthsStart } } },
        {
          $group: {
            _id: {
              year: { $year: '$returnDate' },
              month: { $month: '$returnDate' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    monthlyBorrows.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyDataMap.has(key)) {
        monthlyDataMap.get(key).borrows = item.count;
      }
    });

    monthlyReturns.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (monthlyDataMap.has(key)) {
        monthlyDataMap.get(key).returns = item.count;
      }
    });

    const monthlyTrends = Array.from(monthlyDataMap.values());

    // 3. Most Borrowed Books
    const topBorrowedBooks = await BorrowRecord.aggregate([
      {
        $group: {
          _id: '$book',
          borrows: { $sum: 1 },
        },
      },
      { $sort: { borrows: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      { $unwind: '$bookDetails' },
      {
        $project: {
          _id: 1,
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          category: '$bookDetails.category',
          ISBN: '$bookDetails.ISBN',
          borrows: 1,
          totalCopies: '$bookDetails.totalCopies',
          availableCopies: '$bookDetails.availableCopies',
        },
      },
    ]);

    // 4. Popular Categories
    const popularCategories = await Book.aggregate([
      {
        $group: {
          _id: '$category',
          bookCount: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
        },
      },
      { $sort: { bookCount: -1 } },
      { $limit: 7 },
      {
        $project: {
          name: '$_id',
          count: '$bookCount',
          copies: '$totalCopies',
        },
      },
    ]);

    // 5. Loan Status Breakdown
    const loanStatusBreakdown = [
      { name: 'Returned', value: returnedCount, color: '#10B981' },
      { name: 'Active Loans', value: borrowedCount, color: '#3B82F6' },
      { name: 'Overdue', value: overdueCount, color: '#EF4444' },
    ];

    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalBooks,
          totalCopies: bookCopies.totalCopies,
          availableBooks: bookCopies.availableCopies,
          totalUsers,
          usersByRole: rolesMap,
          borrowedBooks: borrowedCount + overdueCount,
          activeLoans: borrowedCount,
          overdueBooks: overdueCount,
          returnedBooks: returnedCount,
          activeReservations,
          pendingFines: fineSummary.pendingFines,
          paidFines: fineSummary.paidFines,
          totalFines: fineSummary.totalFines,
          unpaidFinesCount: fineSummary.unpaidCount,
        },
        charts: {
          monthlyTrends,
          topBorrowedBooks,
          popularCategories,
          loanStatusBreakdown,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminAnalytics,
};

