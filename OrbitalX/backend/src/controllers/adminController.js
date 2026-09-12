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

    await auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'SIMULATION_START',
      resource: 'SimulationEngine',
      details: 'Administrator manually initiated the global simulation engine.',
      severity: 'WARNING',
      ipAddress: req.ip
    });

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

    await auditService.logAction({
      userId: req.user._id,
      source: 'SYS_ADMIN',
      action: 'SIMULATION_STOP',
      resource: 'SimulationEngine',
      details: 'Administrator halted the global simulation engine. Telemetry streams paused.',
      severity: 'CRITICAL',
      ipAddress: req.ip
    });

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
