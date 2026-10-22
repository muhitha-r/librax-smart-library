const express = require('express');
const {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All wishlist endpoints require authentication and Student role
router.use(protect);
router.use(authorizeRoles('Student'));

router.get('/', getMyWishlist);
router.post('/', addToWishlist);
router.post('/:bookId', addToWishlist);
router.delete('/:bookId', removeFromWishlist);

module.exports = router;

