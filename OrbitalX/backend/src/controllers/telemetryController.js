const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Telemetry = require('../models/Telemetry');
const Satellite = require('../models/Satellite');

// @desc    Get latest telemetry for all active satellites
// @route   GET /api/telemetry/latest
// @access  Private
const getLatestTelemetry = asyncHandler(async (req, res) => {
  const satellites = await Satellite.find({ status: { $ne: 'OFFLINE' } });
  
  const latestTelemetry = await Promise.all(
    satellites.map(async (sat) => {
      const tel = await Telemetry.findOne({ satelliteId: sat._id })
        .sort({ timestamp: -1 })
        .lean();
        
      return {
        satellite: {
          _id: sat._id,
          name: sat.name,
          satelliteId: sat.satelliteId,
          orbitType: sat.orbitType,
          status: sat.status
        },
        telemetry: tel || null
      };
    })
  );

  res.status(200).json(new ApiResponse(200, latestTelemetry, 'Latest telemetry retrieved successfully'));
});

// @desc    Get global fleet stats
// @route   GET /api/telemetry/stats
// @access  Private
const getFleetStats = asyncHandler(async (req, res) => {
  const totalSatellites = await Satellite.countDocuments();
  const activeSatellites = await Satellite.countDocuments({ status: { $in: ['ACTIVE', 'RUNNING'] } });
  const warningSatellites = await Satellite.countDocuments({ status: 'WARNING' });
  const offlineSatellites = await Satellite.countDocuments({ status: 'OFFLINE' });
  
  // Calculate average health from latest telemetry
  const activeSats = await Satellite.find({ status: { $ne: 'OFFLINE' } });
  let totalHealth = 0;
  let count = 0;
  
  for (const sat of activeSats) {
    const tel = await Telemetry.findOne({ satelliteId: sat._id }).sort({ timestamp: -1 });
    if (tel && tel.health) {
      totalHealth += tel.health;
      count++;
    }
  }
  
  const avgHealth = count > 0 ? Math.round(totalHealth / count) : 100;

  res.status(200).json(new ApiResponse(200, {
    total: totalSatellites,
    active: activeSatellites,
    warning: warningSatellites,
    offline: offlineSatellites,
    avgHealth
  }, 'Fleet stats retrieved successfully'));
});

// @desc    Get historical telemetry for all active satellites (last X records)
// @route   GET /api/telemetry/history
// @access  Private
const getHistoricalTelemetry = asyncHandler(async (req, res) => {
  const satellites = await Satellite.find({ status: { $ne: 'OFFLINE' } });
  
  // Create an array of historical data points spanning the last 15 ticks
  const history = await Promise.all(
    satellites.map(async (sat) => {
      const records = await Telemetry.find({ satelliteId: sat._id })
        .sort({ timestamp: -1 })
        .limit(15)
        .lean();
        
      return {
        satelliteId: sat.satelliteId,
        name: sat.name,
        // Reverse to make it chronological (oldest to newest)
        records: records.reverse()
      };
    })
  );

  res.status(200).json(new ApiResponse(200, history, 'Historical telemetry retrieved'));
});

module.exports = {
  getLatestTelemetry,
  getFleetStats,
  getHistoricalTelemetry
};
