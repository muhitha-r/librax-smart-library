const express = require('express');
const {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getSystemStats,
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All user management routes require Admin authorization
router.use(protect);
router.use(authorizeRoles('Admin'));

router.get('/stats', getSystemStats);

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router
  .route('/:id/role')
  .patch(updateUserRole);

router
  .route('/:id')
  .delete(deleteUser);

module.exports = router;

