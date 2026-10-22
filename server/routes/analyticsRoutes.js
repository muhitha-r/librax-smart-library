const express = require('express');
const { getAdminAnalytics } = require('../controllers/analyticsController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Analytics is strictly restricted to Admin role
router.use(protect);
router.use(authorizeRoles('Admin'));

router.get('/dashboard', getAdminAnalytics);

module.exports = router;

