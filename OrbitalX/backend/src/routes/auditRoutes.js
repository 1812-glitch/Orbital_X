const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.route('/').get(getAuditLogs);

module.exports = router;
