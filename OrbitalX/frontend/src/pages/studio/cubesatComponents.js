export const COMPONENT_CATEGORIES = [
  { id: 'ALL', name: 'ALL' },
  { id: 'Structure', name: 'Structure' },
  { id: 'Power', name: 'Power' },
  { id: 'Avionics', name: 'Avionics' },
  { id: 'Communications', name: 'Comms' },
  { id: 'Payload', name: 'Payload' },
  { id: 'Sensor', name: 'Sensors' }
];

export const FORM_FACTORS = {
  '1U': {
    name: '1U',
    dimensions: '10x10x10 cm',
    maxMass: 1338, // grams
    maxVolume: 1.0, // U
    maxThermal: 15, // Watts
    heightScale: 1.0
  },
  '2U': {
    name: '2U',
    dimensions: '10x10x20 cm',
    maxMass: 2660,
    maxVolume: 2.0,
    maxThermal: 25,
    heightScale: 2.0
  },
  '3U': {
    name: '3U',
    dimensions: '10x10x30 cm',
    maxMass: 4000,
    maxVolume: 3.0,
    maxThermal: 35,
    heightScale: 3.0
  }
};

export const CUBESAT_COMPONENTS = [
  {
    id: 'obc_core',
    name: 'OBC (On-Board Computer)',
    category: 'Avionics',
    mass: 110, // g
    volume: 0.10, // U
    powerCons: 1.0, // W
    powerGen: 0,
    cost: 150,
    maxCount: 1,
    desc: 'Radiation-tolerant ARM Cortex-M7 core with redundant flash telemetry storage.',
    color: '#00F0FF',
    renderType: 'internal_pcb'
  },
  {
    id: 'antenna_deployable',
    name: 'Antenna (Deployable)',
    category: 'Communications',
    mass: 60,
    volume: 0.05,
    powerCons: 0,
    powerGen: 0,
    cost: 95,
    maxCount: 2,
    desc: 'Spring-loaded whip dipole antenna for VHF/UHF beacon and telemetry uplinks.',
    color: '#38BDF8',
    renderType: 'antenna'
  },
  {
    id: 'sband_transmitter',
    name: 'S-Band Transmitter',
    category: 'Communications',
    mass: 100,
    volume: 0.10,
    powerCons: 3.0,
    powerGen: 0,
    cost: 350,
    maxCount: 1,
    desc: 'High-speed 2 Mbps science data transmitter with RF power amplifier.',
    color: '#0EA5E9',
    renderType: 'rf_box'
  },
  {
    id: 'uhf_radio',
    name: 'UHF Radio',
    category: 'Communications',
    mass: 90,
    volume: 0.10,
    powerCons: 1.5,
    powerGen: 0,
    cost: 180,
    maxCount: 1,
    desc: 'Ruggedized transceiver for ground command reception and heartbeat beacons.',
    color: '#2563EB',
    renderType: 'rf_box'
  },
  {
    id: 'camera_visible',
    name: 'Camera (Visible)',
    category: 'Payload',
    mass: 120,
    volume: 0.15,
    powerCons: 2.0,
    powerGen: 0,
    cost: 250,
    maxCount: 2,
    desc: '12MP high-resolution Earth observation sensor with optical lens system.',
    color: '#A855F7',
    renderType: 'camera'
  },
  {
    id: 'battery_pack',
    name: 'Battery Pack',
    category: 'Power',
    mass: 250,
    volume: 0.20,
    powerCons: 0,
    powerGen: 0,
    capacityWh: 20,
    cost: 120,
    maxCount: 3,
    desc: 'Space-qualified Li-Ion battery pack with integrated cell thermal heaters.',
    color: '#F59E0B',
    renderType: 'battery'
  },
  {
    id: 'solar_panel_1u',
    name: 'Solar Panel (1U Face)',
    category: 'Power',
    mass: 80,
    volume: 0.08,
    powerCons: 0,
    powerGen: 4.0, // +4W in sunlight
    cost: 200,
    maxCount: 6,
    desc: 'Triple-junction GaAs solar cell array with 29.5% efficiency.',
    color: '#FBBF24',
    renderType: 'solar_panel'
  },
  {
    id: 'gps_receiver',
    name: 'GPS Receiver',
    category: 'Sensor',
    mass: 45,
    volume: 0.05,
    powerCons: 0.5,
    powerGen: 0,
    cost: 80,
    maxCount: 1,
    desc: 'OEM GNSS receiver module for precision orbital positioning and time-sync.',
    color: '#10B981',
    renderType: 'sensor'
  },
  {
    id: 'temp_sensor',
    name: 'Temperature Sensor',
    category: 'Sensor',
    mass: 15,
    volume: 0.02,
    powerCons: 0.1,
    powerGen: 0,
    cost: 30,
    maxCount: 4,
    desc: 'Multi-point platinum RTD sensor array for payload and battery thermal monitoring.',
    color: '#34D399',
    renderType: 'sensor_small'
  },
  {
    id: 'reaction_wheel',
    name: 'Reaction Wheel',
    category: 'Structure',
    mass: 130,
    volume: 0.12,
    powerCons: 0.8,
    powerGen: 0,
    cost: 300,
    maxCount: 3,
    desc: 'Miniature momentum wheel for 3-axis attitude control and nadir pointing.',
    color: '#9CA3AF',
    renderType: 'flywheel'
  }
];
