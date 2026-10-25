const GroundStation = require('../models/GroundStation');

const DEFAULT_GROUND_STATIONS = [
  { 
    name: 'Ground Station Alpha', 
    stationId: 'GS-001', 
    country: 'India', 
    latitude: 12.9716, 
    longitude: 77.5946, 
    status: 'ACTIVE',
    signalQuality: 98,
    connectedSatellites: [],
    lastContact: new Date(Date.now() - 5 * 60000),
    nextContact: new Date(Date.now() + 83 * 60000)
  },
  { 
    name: 'Houston Command', 
    stationId: 'GS-002', 
    country: 'USA', 
    latitude: 29.5502, 
    longitude: -95.097, 
    status: 'ACTIVE',
    signalQuality: 88,
    connectedSatellites: [],
    lastContact: new Date(Date.now() - 25 * 60000),
    nextContact: new Date(Date.now() + 60 * 60000)
  },
  { 
    name: 'Toulouse Center', 
    stationId: 'GS-003', 
    country: 'France', 
    latitude: 43.6047, 
    longitude: 1.4442, 
    status: 'ACTIVE',
    signalQuality: 94,
    connectedSatellites: [],
    lastContact: new Date(Date.now() - 12 * 60000),
    nextContact: new Date(Date.now() + 45 * 60000)
  },
  { 
    name: 'Canberra Complex', 
    stationId: 'GS-004', 
    country: 'Australia', 
    latitude: -35.4014, 
    longitude: 148.9817, 
    status: 'ACTIVE',
    signalQuality: 91,
    connectedSatellites: [],
    lastContact: new Date(Date.now() - 18 * 60000),
    nextContact: new Date(Date.now() + 50 * 60000)
  },
  {
    name: 'Svalbard Station',
    stationId: 'GS-005',
    country: 'Norway',
    latitude: 78.2298,
    longitude: 15.4078,
    status: 'ACTIVE',
    signalQuality: 96,
    connectedSatellites: [],
    lastContact: new Date(Date.now() - 8 * 60000),
    nextContact: new Date(Date.now() + 35 * 60000)
  }
];

const Satellite = require('../models/Satellite');

// @desc    Get all ground stations
// @route   GET /api/ground-stations
// @access  Private
exports.getGroundStations = async (req, res) => {
  try {
    let stations = await GroundStation.find().populate(
      'connectedSatellites',
      'satelliteId name orbitType status type formFactor inclination altitude'
    );
    
    if (!stations || stations.length === 0) {
      const allSats = await Satellite.find();
      const satIds = allSats.map((s) => s._id);
      if (satIds.length > 0) {
        DEFAULT_GROUND_STATIONS[0].connectedSatellites = [satIds[0], satIds[satIds.length - 1]].filter(Boolean);
        if (satIds.length > 1) DEFAULT_GROUND_STATIONS[1].connectedSatellites = [satIds[1]];
        if (satIds.length > 2) DEFAULT_GROUND_STATIONS[2].connectedSatellites = [satIds[0], satIds[2]];
        if (satIds.length > 3) DEFAULT_GROUND_STATIONS[3].connectedSatellites = [satIds[1], satIds[3]];
        if (satIds.length > 4) DEFAULT_GROUND_STATIONS[4].connectedSatellites = [satIds[2], satIds[4]];
      }
      await GroundStation.insertMany(DEFAULT_GROUND_STATIONS);
      stations = await GroundStation.find().populate(
        'connectedSatellites',
        'satelliteId name orbitType status type formFactor inclination altitude'
      );
    } else {
      // If existing stations have zero connected satellites, link active satellites to them
      const allEmpty = stations.every((s) => !s.connectedSatellites || s.connectedSatellites.length === 0);
      if (allEmpty) {
        const allSats = await Satellite.find();
        if (allSats.length > 0) {
          const satIds = allSats.map((s) => s._id);
          for (let i = 0; i < stations.length; i++) {
            const assigned = [satIds[i % satIds.length], satIds[(i + 2) % satIds.length]].filter(Boolean);
            await GroundStation.findByIdAndUpdate(stations[i]._id, { connectedSatellites: assigned });
          }
          stations = await GroundStation.find().populate(
            'connectedSatellites',
            'satelliteId name orbitType status type formFactor inclination altitude'
          );
        }
      }
    }
    
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    console.error('Error fetching ground stations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

