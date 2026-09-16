const express = require('express');
const { getLatestTelemetry, getFleetStats, getHistoricalTelemetry } = require('../controllers/telemetryController');
const { getCubeSatState, executeCubeSatCommand } = require('../controllers/cubesatCommandController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.route('/latest').get(requireAuth, getLatestTelemetry);
router.route('/stats').get(requireAuth, getFleetStats);
router.route('/history').get(requireAuth, getHistoricalTelemetry);

// CubeSat simulation & telecommand routes
router.route('/cubesat/state').get(requireAuth, getCubeSatState);
router.route('/cubesat/command').post(requireAuth, executeCubeSatCommand);

module.exports = router;

