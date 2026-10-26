const { getSimulationStatus, startSimulation, stopSimulation, updateSimulationSpeed } = require('../services/telemetrySimulator');
const auditService = require('../services/auditService');

// @desc    Get simulation status
// @route   GET /api/admin/simulation/status
// @access  Private/Admin
exports.getSimulationState = async (req, res) => {
  try {
    res.json({ success: true, data: getSimulationStatus() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Start simulation
// @route   POST /api/admin/simulation/start
// @access  Private/Admin
exports.startSim = async (req, res) => {
  try {
    const status = getSimulationStatus();
    startSimulation(status.intervalMs);

    // Non-blocking audit logging
    auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'SIMULATION_START',
      resource: 'SimulationEngine',
      details: 'Administrator manually initiated the global simulation engine.',
      severity: 'WARNING',
      ipAddress: req.ip
    }).catch(err => console.error('Audit log error in startSim:', err));

    res.json({ success: true, data: getSimulationStatus() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Stop simulation
// @route   POST /api/admin/simulation/stop
// @access  Private/Admin
exports.stopSim = async (req, res) => {
  try {
    stopSimulation();

    // Non-blocking audit logging
    auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'SIMULATION_STOP',
      resource: 'SimulationEngine',
      details: 'Administrator halted the global simulation engine. Telemetry streams paused.',
      severity: 'CRITICAL',
      ipAddress: req.ip
    }).catch(err => console.error('Audit log error in stopSim:', err));

    res.json({ success: true, data: getSimulationStatus() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Change simulation speed
// @route   POST /api/admin/simulation/speed
// @access  Private/Admin
exports.changeSimSpeed = async (req, res) => {
  try {
    const { speedMultiplier } = req.body; // e.g. 0.5, 1, 2, 5
    if (!speedMultiplier) {
      return res.status(400).json({ success: false, message: 'speedMultiplier is required' });
    }
    updateSimulationSpeed(speedMultiplier);

    await auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'SIMULATION_CONFIG_UPDATE',
      resource: 'SimulationEngine',
      details: `Simulation parameters updated: speed=${speedMultiplier || 'unchanged'}x.`,
      severity: 'WARNING',
      ipAddress: req.ip
    });

    res.json({ success: true, data: getSimulationStatus() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const Mission = require('../models/Mission');
const Satellite = require('../models/Satellite');
const Telemetry = require('../models/Telemetry');
const Communication = require('../models/Communication');
const Alert = require('../models/Alert');

// @desc    Clear all missions, satellites/cubesats, telemetry, communications from MongoDB
// @route   POST /api/admin/clear-data
// @access  Private/Admin
exports.clearAllData = async (req, res) => {
  try {
    const missionRes = await Mission.deleteMany({});
    const satRes = await Satellite.deleteMany({});
    const telemRes = await Telemetry.deleteMany({});
    const commRes = await Communication.deleteMany({});
    const alertRes = await Alert.deleteMany({});

    await auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'DATA_PURGE',
      resource: 'Database',
      details: `Purged ${missionRes.deletedCount} missions and ${satRes.deletedCount} satellites/cubesats from MongoDB.`,
      severity: 'CRITICAL',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'All missions, CubeSats, and associated telemetry completely cleared from MongoDB.',
      data: {
        missionsDeleted: missionRes.deletedCount,
        satellitesDeleted: satRes.deletedCount,
        telemetryDeleted: telemRes.deletedCount,
        communicationsDeleted: commRes.deletedCount,
        alertsDeleted: alertRes.deletedCount
      }
    });
  } catch (error) {
    console.error('[Admin clearAllData Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error clearing database' });
  }
};

