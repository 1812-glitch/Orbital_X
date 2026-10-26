const express = require('express');
const { getSimulationState, startSim, stopSim, changeSimSpeed, clearAllData } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Simulation status read accessible to all authenticated operators/admins/viewers
router.get('/simulation/status', getSimulationState);

// Simulation controls accessible to ADMIN and OPERATOR
router.post('/simulation/start', requireRole('ADMIN', 'OPERATOR'), startSim);
router.post('/simulation/stop', requireRole('ADMIN', 'OPERATOR'), stopSim);
router.post('/simulation/speed', requireRole('ADMIN', 'OPERATOR'), changeSimSpeed);

// Clear data strictly ADMIN
router.post('/clear-data', requireRole('ADMIN'), clearAllData);

module.exports = router;
