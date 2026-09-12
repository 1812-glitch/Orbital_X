const express = require('express');
const { getFleetAnalytics, getReports } = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/fleet', getFleetAnalytics);
router.get('/reports', getReports);

module.exports = router;
