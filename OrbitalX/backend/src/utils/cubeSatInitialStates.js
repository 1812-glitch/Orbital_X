// In-memory persistent simulation store for CubeSats (1U up to 16U)
const cubeSatStates = {
  'CUBESAT-NANO': {
    satelliteId: 'CUBESAT-NANO',
    name: 'CubeSat Nano-1',
    formFactor: '1U',
    orbitType: 'LEO',
    status: 'NOMINAL',
    speed: 7.64,
    altitude: 430.0,
    distanceFromEarth: 6801.0,
    temperature: {
      bus: 18.2,
      solar: 39.0,
      battery: 16.5,
      radio: 28.0
    },
    load: {
      cpu: 14,
      memory: 22,
      busPower: 4.8
    },
    battery: 96.5,
    propellant: 100.0,
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: {
      roll: 0.2,
      pitch: 0.1,
      yaw: 3.4,
      spinRate: 0.05,
      mode: 'SUN_POINT'
    },
    groundStation: 'Toulouse Center (GS-003)',
    signalStrength: -82,
    snr: 14.1,
    packetsDownlinked: 3120,
    commandHistory: [
      {
        seq: 101,
        command: 'SYS_BOOT_NOMINAL',
        timestamp: new Date(Date.now() - 60 * 60000),
        status: 'EXECUTED',
        response: '1U Nano bus initialized with beacon pulse telemetry active.'
      }
    ]
  },
  'CUBESAT-ION': {
    satelliteId: 'CUBESAT-ION',
    name: 'CubeSat Ion-X',
    formFactor: '3U',
    orbitType: 'LEO',
    status: 'NOMINAL',
    speed: 7.56, // km/s
    altitude: 512.4, // km
    distanceFromEarth: 6883.4,
    temperature: {
      bus: 21.8,
      solar: 44.5,
      battery: 19.4,
      radio: 32.1
    },
    load: {
      cpu: 24, // %
      memory: 36, // %
      busPower: 16.8 // W
    },
    battery: 89.2, // %
    propellant: 94.5, // %
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: {
      roll: 0.5,
      pitch: -1.1,
      yaw: 14.2,
      spinRate: 0.03, // deg/s
      mode: 'NADIR'
    },
    groundStation: 'Toulouse Center (GS-003)',
    signalStrength: -78, // dBm
    snr: 15.4, // dB
    packetsDownlinked: 5410,
    commandHistory: [
      {
        seq: 101,
        command: 'SYS_BOOT_NOMINAL',
        timestamp: new Date(Date.now() - 30 * 60000),
        status: 'EXECUTED',
        response: 'Core subsystems initialized in nominal 3U LEO configuration.'
      }
    ]
  },
  'CUBESAT-AERO': {
    satelliteId: 'CUBESAT-AERO',
    name: 'CubeSat Aero-6',
    formFactor: '6U',
    orbitType: 'LEO',
    status: 'NOMINAL',
    speed: 7.62,
    altitude: 498.0,
    distanceFromEarth: 6869.0,
    temperature: {
      bus: 23.1,
      solar: 48.0,
      battery: 21.0,
      radio: 34.5
    },
    load: {
      cpu: 28,
      memory: 42,
      busPower: 24.5
    },
    battery: 92.0,
    propellant: 98.0,
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: {
      roll: 1.2,
      pitch: 0.8,
      yaw: -8.4,
      spinRate: 0.02,
      mode: 'SUN_TRACKING'
    },
    groundStation: 'Canberra Complex (GS-004)',
    signalStrength: -74,
    snr: 16.8,
    packetsDownlinked: 8920,
    commandHistory: [
      {
        seq: 101,
        command: 'ORBIT_INSERTION_CONFIRM',
        timestamp: new Date(Date.now() - 45 * 60000),
        status: 'EXECUTED',
        response: '6U bus orbit insertion confirmed at 498km 45.0 deg inclination.'
      }
    ]
  },
  'CUBESAT-TERRA': {
    satelliteId: 'CUBESAT-TERRA',
    name: 'CubeSat Terra-12',
    formFactor: '12U',
    orbitType: 'SSO',
    status: 'NOMINAL',
    speed: 7.51,
    altitude: 560.0,
    distanceFromEarth: 6931.0,
    temperature: {
      bus: 24.8,
      solar: 52.0,
      battery: 22.4,
      radio: 36.2
    },
    load: {
      cpu: 38,
      memory: 54,
      busPower: 58.2
    },
    battery: 94.8,
    propellant: 96.0,
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: {
      roll: 0.05,
      pitch: -0.12,
      yaw: 1.8,
      spinRate: 0.01,
      mode: 'NADIR'
    },
    groundStation: 'Svalbard Arctic Base (GS-002)',
    signalStrength: -71,
    snr: 18.5,
    packetsDownlinked: 14200,
    commandHistory: [
      {
        seq: 101,
        command: 'PAYLOAD_CALIBRATE',
        timestamp: new Date(Date.now() - 20 * 60000),
        status: 'EXECUTED',
        response: '12U Hyperspectral imager focal plane array zero-point calibration complete.'
      }
    ]
  },
  'CUBESAT-TITAN': {
    satelliteId: 'CUBESAT-TITAN',
    name: 'CubeSat Titan-16',
    formFactor: '16U',
    orbitType: 'HEO',
    status: 'NOMINAL',
    speed: 6.84,
    altitude: 1240.0,
    distanceFromEarth: 7611.0,
    temperature: {
      bus: 26.5,
      solar: 58.0,
      battery: 23.8,
      radio: 38.9
    },
    load: {
      cpu: 46,
      memory: 62,
      busPower: 86.4
    },
    battery: 98.2,
    propellant: 92.4,
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: {
      roll: -0.4,
      pitch: 0.6,
      yaw: -2.2,
      spinRate: 0.008,
      mode: 'DEEP_SPACE_COMM'
    },
    groundStation: 'Goldstone Deep Space (GS-005)',
    signalStrength: -68,
    snr: 21.2,
    packetsDownlinked: 28940,
    commandHistory: [
      {
        seq: 101,
        command: 'ION_ENGINE_STATUS_CHECK',
        timestamp: new Date(Date.now() - 15 * 60000),
        status: 'EXECUTED',
        response: '16U Xenon feed pressure nominal. Discharge chamber cathode impedance 14.2 ohms.'
      }
    ]
  }
};

module.exports = cubeSatStates;
