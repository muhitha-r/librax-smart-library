const express = require('express');
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
  notifyReservation,
} = require('../controllers/reservationController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All reservation endpoints require authentication
router.use(protect);

router
  .route('/')
  .post(authorizeRoles('Student', 'Staff'), createReservation)
  .get(authorizeRoles('Admin', 'Librarian'), getAllReservations);

router.get('/my', getMyReservations);

router.patch('/:id/cancel', cancelReservation);
router.patch('/:id/fulfill', authorizeRoles('Admin', 'Librarian'), fulfillReservation);
router.patch('/:id/notify', authorizeRoles('Admin', 'Librarian'), notifyReservation);

module.exports = router;

