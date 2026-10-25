import api from '../lib/apiClient';

export const FALLBACK_GROUND_STATIONS = [
  { 
    _id: 'gs-001',
    name: 'Ground Station Alpha', 
    stationId: 'GS-001', 
    country: 'India', 
    latitude: 12.9716, 
    longitude: 77.5946, 
    status: 'ACTIVE',
    signalQuality: 98,
    connectedSatellites: [
      {
        satelliteId: 'SAT-ARTEMIS-1',
        name: 'Artemis Relay One',
        orbitType: 'GEO',
        status: 'ACTIVE',
        formFactor: '12U'
      },
      {
        satelliteId: 'SAT-AURORA-3U',
        name: 'Aurora Ion Observer',
        orbitType: 'LEO',
        status: 'ACTIVE',
        formFactor: '3U'
      }
    ],
    lastContact: new Date(Date.now() - 5 * 60000).toISOString(),
    nextContact: new Date(Date.now() + 83 * 60000).toISOString()
  },
  { 
    _id: 'gs-002',
    name: 'Houston Command', 
    stationId: 'GS-002', 
    country: 'USA', 
    latitude: 29.5502, 
    longitude: -95.097, 
    status: 'ACTIVE',
    signalQuality: 88,
    connectedSatellites: [
      {
        satelliteId: 'SAT-AURORA-3U',
        name: 'Aurora Ion Observer',
        orbitType: 'LEO',
        status: 'ACTIVE',
        formFactor: '3U'
      }
    ],
    lastContact: new Date(Date.now() - 25 * 60000).toISOString(),
    nextContact: new Date(Date.now() + 60 * 60000).toISOString()
  },
  { 
    _id: 'gs-003',
    name: 'Toulouse Center', 
    stationId: 'GS-003', 
    country: 'France', 
    latitude: 43.6047, 
    longitude: 1.4442, 
    status: 'ACTIVE',
    signalQuality: 94,
    connectedSatellites: [
      {
        satelliteId: 'SAT-ARTEMIS-1',
        name: 'Artemis Relay One',
        orbitType: 'GEO',
        status: 'ACTIVE',
        formFactor: '12U'
      },
      {
        satelliteId: 'SAT-AURORA-3U',
        name: 'Aurora Ion Observer',
        orbitType: 'LEO',
        status: 'ACTIVE',
        formFactor: '3U'
      }
    ],
    lastContact: new Date(Date.now() - 12 * 60000).toISOString(),
    nextContact: new Date(Date.now() + 45 * 60000).toISOString()
  },
  { 
    _id: 'gs-004',
    name: 'Canberra Complex', 
    stationId: 'GS-004', 
    country: 'Australia', 
    latitude: -35.4014, 
    longitude: 148.9817, 
    status: 'ACTIVE',
    signalQuality: 91,
    connectedSatellites: [
      {
        satelliteId: 'SAT-ARTEMIS-1',
        name: 'Artemis Relay One',
        orbitType: 'GEO',
        status: 'ACTIVE',
        formFactor: '12U'
      }
    ],
    lastContact: new Date(Date.now() - 18 * 60000).toISOString(),
    nextContact: new Date(Date.now() + 50 * 60000).toISOString()
  },
  {
    _id: 'gs-005',
    name: 'Svalbard Station',
    stationId: 'GS-005',
    country: 'Norway',
    latitude: 78.2298,
    longitude: 15.4078,
    status: 'ACTIVE',
    signalQuality: 96,
    connectedSatellites: [
      {
        satelliteId: 'SAT-AURORA-3U',
        name: 'Aurora Ion Observer',
        orbitType: 'LEO',
        status: 'ACTIVE',
        formFactor: '3U'
      }
    ],
    lastContact: new Date(Date.now() - 8 * 60000).toISOString(),
    nextContact: new Date(Date.now() + 35 * 60000).toISOString()
  }
];

export const groundStationService = {
  getAllGroundStations: async () => {
    try {
      const response = await api.get('/ground-stations');
      const data = response.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return response.data;
      }
      return { success: true, data: FALLBACK_GROUND_STATIONS };
    } catch (error) {
      console.warn('Using fallback ground stations due to fetch error:', error);
      return { success: true, data: FALLBACK_GROUND_STATIONS };
    }
  }
};

