const express = require('express');
const {
  createBook,
  getBooks,
  getCategories,
  getBookById,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All book endpoints require authentication
router.use(protect);

router
  .route('/')
  .get(getBooks)
  .post(authorizeRoles('Admin', 'Librarian'), createBook);

router.get('/categories', getCategories);

router
  .route('/:id')
  .get(getBookById)
  .put(authorizeRoles('Admin', 'Librarian'), updateBook)
  .delete(authorizeRoles('Admin', 'Librarian'), deleteBook);

module.exports = router;

