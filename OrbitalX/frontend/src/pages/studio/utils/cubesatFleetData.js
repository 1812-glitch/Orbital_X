// CubeSat Fleet definitions and dynamic real-satellite synthesizer

export const CUBESAT_FLEET = [];

export const INITIAL_MISSIONS = [];

// Dynamically synthesize a full CubeSat simulation object for ANY existing satellite from DB or API
export function synthesizeCubeSatSim(sat, mission = null) {
  if (!sat) return null;

  const satId = sat.satelliteId || sat._id || 'UNKNOWN';

  const rawType = (sat.type || '').toUpperCase();
  let formFactor = sat.formFactor || '3U';
  if (!sat.formFactor) {
    if (rawType.includes('16U') || rawType === '16U') formFactor = '16U';
    else if (rawType.includes('12U') || rawType === '12U') formFactor = '12U';
    else if (rawType.includes('6U') || rawType === '6U') formFactor = '6U';
    else if (rawType.includes('1U') || rawType === '1U') formFactor = '1U';
    else if (rawType.includes('2U') || rawType === '2U') formFactor = '2U';
  }

  const mId = mission?.missionId || sat.missionId || '';
  const mName = mission?.name || sat.missionName || 'Orbital Fleet';

  const alt = sat.orbitRadius 
    ? Math.max(250, Math.round(sat.orbitRadius - 6371)) 
    : (sat.altitude || 510.0);

  return {
    satelliteId: satId,
    name: sat.name ? `${sat.name} (${formFactor})` : `${satId} (${formFactor})`,
    fullName: sat.name || satId,
    formFactor,
    orbitType: sat.orbitType || 'LEO',
    status: sat.status || 'NOMINAL',
    missionId: mId,
    missionName: mName,
    speed: sat.orbitSpeed || 7.58,
    altitude: alt,
    distanceFromEarth: sat.orbitRadius || (alt + 6371),
    temperature: { bus: 22.0, solar: 42.0, battery: 20.0, radio: 30.0 },
    load: { cpu: 20, memory: 30, busPower: 15.0 },
    battery: sat.power || 90.0,
    propellant: 95.0,
    solarPanelsDeployed: true,
    heaterActive: false,
    attitude: { roll: 0.1, pitch: -0.2, yaw: 1.5, spinRate: 0.04, mode: 'NADIR' },
    groundStation: 'Ground Station Alpha (GS-001)',
    signalStrength: sat.signal || -79,
    snr: 15.0,
    packetsDownlinked: 2400,
    commandHistory: []
  };
}
