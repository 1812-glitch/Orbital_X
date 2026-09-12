const Communication = require('../models/Communication');
const Satellite = require('../models/Satellite');
const Mission = require('../models/Mission');

// @desc    Get communications for a specific mission
// @route   GET /api/communications/mission/:missionId
// @access  Private
exports.getMissionCommunications = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.missionId);
    if (!mission) {
      return res.status(404).json({ success: false, message: 'Mission not found' });
    }

    // Get all satellites assigned to this mission
    const satelliteIds = mission.assignedSatellites;

    // Fetch communications for these satellites
    const communications = await Communication.find({
      satelliteId: { $in: satelliteIds }
    })
      .populate('satelliteId', 'name satelliteId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 messages

    res.status(200).json({ success: true, data: communications });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Post a new TX communication
// @route   POST /api/communications
// @access  Private
exports.postCommunication = async (req, res) => {
  try {
    const { satelliteId, message, type } = req.body;

    if (!satelliteId || !message) {
      return res.status(400).json({ success: false, message: 'Please provide satelliteId and message' });
    }

    const satellite = await Satellite.findById(satelliteId);
    if (!satellite) {
      return res.status(404).json({ success: false, message: 'Satellite not found' });
    }

    const communication = await Communication.create({
      satelliteId,
      userId: req.user._id,
      direction: 'TX',
      message,
      type: type || 'COMMAND',
      status: 'DELIVERED',
      timestamp: new Date()
    });

    // Populate for the response
    await communication.populate('satelliteId', 'name satelliteId');
    await communication.populate('userId', 'name email');

    res.status(201).json({ success: true, data: communication });
  } catch (error) {
    console.error('Error posting communication:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
