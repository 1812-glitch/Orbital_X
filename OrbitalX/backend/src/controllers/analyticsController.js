const Telemetry = require('../models/Telemetry');
const Satellite = require('../models/Satellite');
const Mission = require('../models/Mission');

// @desc    Get fleet wide analytics (averages)
// @route   GET /api/analytics/fleet
// @access  Private
exports.getFleetAnalytics = async (req, res) => {
  try {
    const { orbitType } = req.query; // 'LEO', 'MEO', 'GEO', or 'ALL'
    
    let satMatch = { status: { $ne: 'OFFLINE' } };
    if (orbitType && orbitType !== 'ALL') {
      satMatch.orbitType = orbitType;
    }

    // Get relevant satellite IDs
    const satellites = await Satellite.find(satMatch).select('_id');
    const satIds = satellites.map(s => s._id);

    if (satIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { avgHealth: 0, avgBattery: 0, avgTemp: 0, activeSats: 0, chartData: [] }
      });
    }

    // Look at last 5 minutes of telemetry to find latest readings
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const analytics = await Telemetry.aggregate([
      { 
        $match: { 
          satelliteId: { $in: satIds },
          timestamp: { $gte: fiveMinsAgo }
        } 
      },
      { $sort: { timestamp: -1 } },
      { 
        $group: {
          _id: '$satelliteId',
          temperature: { $first: '$temperature' },
          battery: { $first: '$battery' },
          health: { $first: '$health' },
          orbitType: { $first: '$orbitType' } // Might not be on telemetry, we will fetch it
        }
      },
      { 
        $group: {
          _id: null,
          avgHealth: { $avg: '$health' },
          avgBattery: { $avg: '$battery' },
          avgTemp: { $avg: '$temperature' },
          activeSats: { $sum: 1 }
        }
      }
    ]);

    const result = analytics[0] || { avgHealth: 0, avgBattery: 0, avgTemp: 0, activeSats: 0 };

    // Let's also generate some historical data points for the last 24h for the chart
    // We will aggregate hourly averages
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const historicalData = await Telemetry.aggregate([
      {
        $match: {
          satelliteId: { $in: satIds },
          timestamp: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          avgHealth: { $avg: '$health' },
          avgBattery: { $avg: '$battery' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    const chartData = historicalData.map(d => ({
      time: `${d._id.hour}:00`,
      health: Number(d.avgHealth.toFixed(1)),
      battery: Number(d.avgBattery.toFixed(1))
    }));

    res.status(200).json({
      success: true,
      data: {
        avgHealth: Number(result.avgHealth.toFixed(1)),
        avgBattery: Number(result.avgBattery.toFixed(1)),
        avgTemp: Number(result.avgTemp.toFixed(1)),
        activeSats: result.activeSats,
        chartData
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get summary report data
// @route   GET /api/analytics/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    const missions = await Mission.find().populate('assignedSatellites', 'name status orbitType');
    const satellites = await Satellite.find();
    
    const missionSummary = missions.map(m => ({
      id: m._id,
      name: m.name,
      status: m.status,
      satelliteCount: m.assignedSatellites.length,
      startDate: m.startDate,
      endDate: m.endDate
    }));

    const satelliteSummary = {
      total: satellites.length,
      active: satellites.filter(s => s.status === 'ACTIVE').length,
      maintenance: satellites.filter(s => s.status === 'MAINTENANCE').length,
      offline: satellites.filter(s => s.status === 'OFFLINE').length,
      byOrbit: {
        LEO: satellites.filter(s => s.orbitType === 'LEO').length,
        MEO: satellites.filter(s => s.orbitType === 'MEO').length,
        GEO: satellites.filter(s => s.orbitType === 'GEO').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        missions: missionSummary,
        satellites: satelliteSummary
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
