const express = require('express');
const { getReports, exportReportCSV } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Operational reports are accessible to Admin & Librarian
router.use(protect);
router.use(authorizeRoles('Admin', 'Librarian'));

router.get('/', getReports);
router.get('/export', exportReportCSV);

module.exports = router;

