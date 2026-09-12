const express = require('express');
const { getGroundStations } = require('../controllers/groundStationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(requireAuth, getGroundStations);

module.exports = router;
