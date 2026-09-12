const GroundStation = require('../models/GroundStation');

// @desc    Get all ground stations
// @route   GET /api/ground-stations
// @access  Private
exports.getGroundStations = async (req, res) => {
  try {
    const stations = await GroundStation.find().populate('connectedSatellites', 'satelliteId name');
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    console.error('Error fetching ground stations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
