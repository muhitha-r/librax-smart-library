const express = require('express');
const {
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
} = require('../controllers/borrowController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All borrow endpoints require authentication
router.use(protect);

// 1. Core Borrow APIs
router
  .route('/')
  .post(createBorrow)
  .get(authorizeRoles('Admin', 'Librarian'), getAllBorrowings);

// 2. Personal Borrowing History
router.get('/my', getMyBorrowings);

// 3. Overdue Loans (Admin & Librarian)
router.get('/overdue', authorizeRoles('Admin', 'Librarian'), getOverdueBorrowings);

// 4. Configurable Borrowing Settings
router
  .route('/settings')
  .get(getBorrowSettings)
  .put(authorizeRoles('Admin'), updateBorrowSettings);

// 5. Reservations
router
  .route('/reserve')
  .post(createReservation);

router.get('/reservations/my', getMyReservations);
router.get('/reservations', authorizeRoles('Admin', 'Librarian'), getAllReservations);

// 6. Single Record by ID
router.get('/:id', getBorrowRecordById);

// 7. Return Book
router.patch('/:id/return', returnBook);

// 8. Record / Waive Fine (Admin & Librarian)
router.patch('/:id/pay-fine', authorizeRoles('Admin', 'Librarian'), payOrWaiveFine);

module.exports = router;

