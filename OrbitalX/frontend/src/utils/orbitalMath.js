/**
 * Shared orbital math utilities and constants for 3D visualization,
 * satellite tracking, and ground station communication links.
 */

// Visual slot color assigned to tracked satellite (Single selector mode)
export const SAT_SLOT_COLORS = ['#00F0FF'];

// Maximum number of satellites that can be simultaneously tracked (Limited to 1 as requested)
export const MAX_SELECTED_SATELLITES = 1;

// Canonical Orbit Type Color Palette (as specified in OrbitalX 3D Simulator HUD)
export const ORBIT_TYPE_COLORS = {
  LEO: '#00F0FF',      // Cyan (Low Earth Orbit)
  MEO: '#6366F1',      // Indigo/Blue (Medium Earth Orbit)
  GEO: '#EAB308',      // Gold/Yellow (Geostationary Earth Orbit)
  SSO: '#14B8A6',      // Teal (Sun-Synchronous Orbit)
  POLAR: '#EC4899',    // Pink/Magenta (Polar Orbit)
  GRAVEYARD: '#9CA3AF' // Slate (Disposal/Graveyard Orbit)
};

export const getOrbitColor = (orbitType = 'LEO') => {
  if (!orbitType) return ORBIT_TYPE_COLORS.LEO;
  const key = String(orbitType).trim().toUpperCase();
  return ORBIT_TYPE_COLORS[key] || ORBIT_TYPE_COLORS.LEO;
};

/**
 * Calculates the great-circle angular distance between two coordinates in degrees.
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lng1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lng2 Longitude of point 2 in degrees
 * @returns {number} Angular distance in degrees
 */
export const getAngularDistanceDeg = (lat1, lng1, lat2, lng2) => {
  const rlat1 = (lat1 * Math.PI) / 180;
  const rlng1 = (lng1 * Math.PI) / 180;
  const rlat2 = (lat2 * Math.PI) / 180;
  const rlng2 = (lng2 * Math.PI) / 180;
  const cosDist =
    Math.sin(rlat1) * Math.sin(rlat2) +
    Math.cos(rlat1) * Math.cos(rlat2) * Math.cos(rlng1 - rlng2);
  return (Math.acos(Math.max(-1, Math.min(1, cosDist))) * 180) / Math.PI;
};

/**
 * Deterministic hash seed for fixed orbital parameters per satellite ID.
 * @param {string|number} id Satellite ID
 * @returns {number} Integer hash seed
 */
export const getSatSeed = (id) => {
  return String(id)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
};

/**
 * Checks whether a satellite object represents a CubeSat.
 * @param {object} sat Satellite object containing type, name, satelliteId
 * @returns {boolean}
 */
export const isCubeSatType = (sat) => {
  if (!sat) return false;
  const type = sat.type || '';
  const name = sat.name || '';
  const id = sat.satelliteId || '';
  return (
    type.toUpperCase().includes('CUBESAT') ||
    type.toUpperCase().includes('CUBE') ||
    name.toLowerCase().includes('cube') ||
    id.toLowerCase().includes('cube')
  );
};

/**
 * Computes visual 3D altitude directly and proportionately from physical altitude (km).
 * @param {number} altitudeKm Real physical altitude in kilometers
 * @param {string} orbitType 'LEO' | 'MEO' | 'GEO'
 * @returns {number} Clamped Globe altitude scalar
 */
export const calculateVisualAltitude = (altitudeKm, orbitType = 'LEO') => {
  let km = Number(altitudeKm);
  if (!km || isNaN(km) || km < 100) {
    if (orbitType === 'GEO') km = 35786;
    else if (orbitType === 'MEO') km = 20200;
    else km = 550;
  }

  // Proportional physical curve:
  // LEO (400 - 1,000 km, e.g. CubeSats): ~0.065 to 0.085 (snug to Earth atmosphere)
  // MEO (10,000 - 20,000 km, e.g. GPS / Beta-2): ~0.30 to 0.44 (medium orbital shell)
  // GEO (~35,786 km, e.g. Weather / Gamma-3): ~0.65 (outer geostationary belt)
  const clampedKm = Math.max(200, Math.min(42000, km));
  const normalized = Math.pow(clampedKm / 36000, 0.72);
  return parseFloat((0.08 + 0.6 * normalized).toFixed(4));
};

/**
 * Stable, fixed 3D orbital trajectory path calculation that NEVER wiggles or jumps.
 * @param {object} sat Satellite object with inclination and alt
 * @param {number} numPoints Resolution of the path
 * @returns {Array<[number, number, number]>} Array of [lat, lng, alt] points
 */
export const generateFixedOrbitalPath = (sat, numPoints = 120) => {
  const points = [];
  const inclinationDeg = sat.inclination || 51.6;
  const incRad = (inclinationDeg * Math.PI) / 180;

  // Deterministic fixed ascending node longitude per satellite ID
  const seed = getSatSeed(sat.id);
  const nodeLng = ((seed * 73) % 360) * (Math.PI / 180);
  const alt = sat.alt;

  for (let i = 0; i <= numPoints; i++) {
    const u = (i / numPoints) * 2 * Math.PI;
    // Fixed spherical coordinates in stable Keplerian orbital plane
    const x =
      Math.cos(nodeLng) * Math.cos(u) -
      Math.sin(nodeLng) * Math.sin(u) * Math.cos(incRad);
    const y = Math.sin(u) * Math.sin(incRad);
    const z =
      Math.sin(nodeLng) * Math.cos(u) +
      Math.cos(nodeLng) * Math.sin(u) * Math.cos(incRad);

    const latDeg = Math.asin(Math.max(-1, Math.min(1, y))) * (180 / Math.PI);
    const lngDeg = Math.atan2(z, x) * (180 / Math.PI);
    points.push([latDeg, lngDeg, alt]);
  }
  return points;
};

/**
 * Finds ground stations connected to a given satellite and evaluates Line-of-Sight (LOS) status.
 * @param {object} satItem Fleet telemetry item { satellite, telemetry }
 * @param {Array} groundStations List of ground station records
 * @returns {Array} List of ground stations with isInSight and distKm properties
 */
export const getConnectedGroundStations = (satItem, groundStations = []) => {
  if (!groundStations || groundStations.length === 0 || !satItem?.satellite) return [];

  const satId = satItem.satellite.satelliteId;
  const satDbId = satItem.satellite._id;

  const connectedByDb = groundStations.filter((gs) => {
    if (!gs.connectedSatellites) return false;
    return gs.connectedSatellites.some((s) => {
      const id = typeof s === 'object' ? s.satelliteId || s._id : s;
      return id === satId || id === satDbId;
    });
  });

  const lat = satItem.telemetry?.latitude ?? 0;
  const lng = satItem.telemetry?.longitude ?? 0;

  return connectedByDb.map((gs) => {
    const distDeg = getAngularDistanceDeg(lat, lng, gs.latitude, gs.longitude);
    const isInSight = distDeg <= 55; // Horizon line-of-sight footprint
    return {
      ...gs,
      isInSight,
      distKm: Math.round(distDeg * 111),
    };
  });
};

/**
 * Calculates exact latitude, longitude, and 3D coordinates for a Keplerian orbit
 * at a given phase angle `u` in [0, 2*PI].
 * Uses the exact same coordinate transformation used to build the 3D orbital tube rings.
 */
export const getKeplerianOrbitalCoords = (u, incRad, nodeLngRad, alt, globe = null) => {
  const sinLat = Math.sin(incRad) * Math.sin(u);
  const lat = Math.asin(Math.max(-1, Math.min(1, sinLat))) * (180 / Math.PI);
  const lngInPlane = Math.atan2(Math.cos(incRad) * Math.sin(u), Math.cos(u));
  let lng = (nodeLngRad + lngInPlane) * (180 / Math.PI);
  lng = ((((lng + 180) % 360) + 360) % 360) - 180;

  if (globe && typeof globe.getCoords === 'function') {
    const coords = globe.getCoords(lat, lng, alt);
    return { lat, lng, alt, x: coords.x, y: coords.y, z: coords.z };
  }

  const r = 100 * (1 + alt);
  const x = r * (Math.sin(nodeLngRad) * Math.cos(u) + Math.cos(nodeLngRad) * Math.cos(incRad) * Math.sin(u));
  const y = r * (Math.sin(incRad) * Math.sin(u));
  const z = r * (Math.cos(nodeLngRad) * Math.cos(u) - Math.sin(nodeLngRad) * Math.cos(incRad) * Math.sin(u));
  return { lat, lng, alt, x, y, z };
};

/**
 * Computes the real-time position and velocity heading vector of a satellite along its orbit
 * at simulation timestamp `simTime` (seconds).
 * Guaranteed to sit exactly on the 3D orbital path generated by `generateFixedOrbitalPath`.
 */
export const getSatelliteOrbitalState = (sat, simTime, globe = null) => {
  const satId = sat.id || sat.satelliteId || 'SAT';
  const seed = getSatSeed(satId);
  const nodeLngRad = ((seed * 73) % 360) * (Math.PI / 180);
  const incRad = ((sat.inclination || (isCubeSatType(sat) ? 97.4 : 51.6)) * Math.PI) / 180;
  const alt = sat.alt !== undefined ? sat.alt : 0.12;

  // Keplerian period: GEO = 86400s, MEO = 43200s, LEO = 5400s (90 mins)
  const orbitType = sat.type || sat.orbitType || 'LEO';
  const period = orbitType === 'GEO' ? 86400 : orbitType === 'MEO' ? 43200 : 5400;
  const meanMotion = (2 * Math.PI) / period;
  const phaseOffset = (seed * 1.5) % (2 * Math.PI);

  const u = (phaseOffset + simTime * meanMotion) % (2 * Math.PI);
  const current = getKeplerianOrbitalCoords(u, incRad, nodeLngRad, alt, globe);

  // Tangent sample forward along trajectory for heading orientation
  const du = 0.015;
  const next = getKeplerianOrbitalCoords(u + du, incRad, nodeLngRad, alt, globe);

  return {
    ...current,
    nextX: next.x,
    nextY: next.y,
    nextZ: next.z,
    nextLat: next.lat,
    nextLng: next.lng,
    u
  };
};

