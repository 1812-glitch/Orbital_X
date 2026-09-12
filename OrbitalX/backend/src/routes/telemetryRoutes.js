const express = require('express');
const { getLatestTelemetry, getFleetStats, getHistoricalTelemetry } = require('../controllers/telemetryController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.route('/latest').get(requireAuth, getLatestTelemetry);
router.route('/stats').get(requireAuth, getFleetStats);
router.route('/history').get(requireAuth, getHistoricalTelemetry);

module.exports = router;
