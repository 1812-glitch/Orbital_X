const express = require('express');
const { getSimulationState, startSim, stopSim, changeSimSpeed, clearAllData } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/simulation/status', getSimulationState);
router.post('/simulation/start', startSim);
router.post('/simulation/stop', stopSim);
router.post('/simulation/speed', changeSimSpeed);
router.post('/clear-data', clearAllData);

module.exports = router;
