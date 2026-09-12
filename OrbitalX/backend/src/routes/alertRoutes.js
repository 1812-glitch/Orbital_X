const express = require('express');
const { getAlerts, getAlertStats, updateAlertStatus } = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.put('/:id/status', updateAlertStatus);

module.exports = router;
