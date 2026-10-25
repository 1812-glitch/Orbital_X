import * as THREE from 'three';

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
 * Converts 3D Cartesian coordinates to spherical latitude, longitude, and altitude
 * using exact inverse of ThreeGlobe's polar2Cartesian method.
 * Guarantees 100% radial alignment between ThreeGlobe camera ray and 3D satellite mesh.
 */
export const cartesianToGeo = (x, y, z, GLOBE_RADIUS = 100) => {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = Math.acos(Math.max(-1, Math.min(1, y / r)));
  const theta = Math.atan2(z, x);
  let lat = 90 - (phi * 180) / Math.PI;
  let lng = 90 - (theta * 180) / Math.PI - (theta < -Math.PI / 2 ? 360 : 0);
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  const altitude = r / GLOBE_RADIUS - 1;
  return { lat, lng, altitude, r };
};

/**
 * Exact Keplerian 3D Position & Coordinates for a circular orbit around Globe (R = 100 * (1 + alt)).
 * Matches 100% with the 3D orbital trajectory path geometry and ThreeGlobe spherical coordinates.
 */
export const getOrbitalVector = (u, incRad, nodeLngRad, R) => {
  const cosNode = Math.cos(nodeLngRad);
  const sinNode = Math.sin(nodeLngRad);
  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);

  const cosU = Math.cos(u);
  const sinU = Math.sin(u);

  // Exact 3D coordinates in Three.js space
  const x = R * (cosNode * cosU - cosInc * sinNode * sinU);
  const y = R * (sinInc * sinU);
  const z = R * (sinNode * cosU + cosInc * cosNode * sinU);

  // Exact matching Geo coords (lat, lng) matching ThreeGlobe polar2Cartesian
  const { lat, lng } = cartesianToGeo(x, y, z, 100);

  return { x, y, z, lat, lng };
};

/**
 * Orients a satellite mesh using a stable orthonormal orbital reference frame:
 * - X: Orbit plane normal vector (lateral solar wings)
 * - Y: True zenith vector (radial outward from Earth center toward viewer/space)
 * - Z: Tangent velocity vector (prograde flight direction)
 * Eliminates gimbal lock, polar flips, and wild spinning completely.
 */
export const orientSatelliteMesh = (mesh, state) => {
  if (!mesh || !state) return;
  mesh.position.set(state.x, state.y, state.z);

  const pos = new THREE.Vector3(state.x, state.y, state.z);
  const nextPos = new THREE.Vector3(state.nextX, state.nextY, state.nextZ);
  let tangent = new THREE.Vector3().subVectors(nextPos, pos);
  if (tangent.lengthSq() < 1e-8) {
    tangent = new THREE.Vector3(0, 0, 1);
  } else {
    tangent.normalize();
  }

  const radialUp = pos.clone().normalize();
  let orbitNormal = new THREE.Vector3().crossVectors(radialUp, tangent);
  if (orbitNormal.lengthSq() < 1e-8) {
    orbitNormal = new THREE.Vector3(1, 0, 0);
  } else {
    orbitNormal.normalize();
  }

  const trueUp = new THREE.Vector3().crossVectors(tangent, orbitNormal).normalize();
  const rotMatrix = new THREE.Matrix4().makeBasis(orbitNormal, trueUp, tangent);
  mesh.quaternion.setFromRotationMatrix(rotMatrix);
};

export const getSatOrbitalParams = (sat) => {
  const satId = sat.id || sat.satelliteId || 'SAT';
  const seed = getSatSeed(satId);
  const nodeLngRad = ((seed * 73) % 360) * (Math.PI / 180);
  const inclinationDeg = sat.inclination || (isCubeSatType(sat) ? 97.4 : 51.6);
  const incRad = (inclinationDeg * Math.PI) / 180;
  const alt = sat.alt !== undefined ? sat.alt : 0.08;
  const R = 100 * (1 + alt);
  return { satId, seed, nodeLngRad, inclinationDeg, incRad, alt, R };
};

export const generateFixedOrbitalPath = (sat, numPoints = 180) => {
  const { nodeLngRad, incRad, alt, R } = getSatOrbitalParams(sat);
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const u = (i / numPoints) * 2 * Math.PI;
    const v = getOrbitalVector(u, incRad, nodeLngRad, R);
    points.push([v.lat, v.lng, alt]);
  }
  return points;
};

export const generateOrbitalPath3DPoints = (sat, numPoints = 180) => {
  const { nodeLngRad, incRad, alt, R } = getSatOrbitalParams(sat);
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const u = (i / numPoints) * 2 * Math.PI;
    const v = getOrbitalVector(u, incRad, nodeLngRad, R);
    points.push({ ...v, alt });
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
 */
export const getKeplerianOrbitalCoords = (u, incRad, nodeLngRad, alt, globe = null) => {
  const R = 100 * (1 + alt);
  return {
    ...getOrbitalVector(u, incRad, nodeLngRad, R),
    alt
  };
};

/**
 * Computes the real-time position and velocity heading vector of a satellite along its orbit
 * at simulation timestamp `simTime` (seconds).
 * Guaranteed to sit exactly on the 3D orbital path generated by `generateFixedOrbitalPath`.
 */
export const getSatelliteOrbitalState = (sat, simTime, globe = null) => {
  const { satId, seed, nodeLngRad, incRad, alt, R } = getSatOrbitalParams(sat);

  // Keplerian period: GEO = 86400s, MEO = 43200s, LEO = 5400s (90 mins)
  const orbitType = sat.type || sat.orbitType || 'LEO';
  const period = orbitType === 'GEO' ? 86400 : orbitType === 'MEO' ? 43200 : 5400;
  const meanMotion = (2 * Math.PI) / period;
  const phaseOffset = (seed * 1.5) % (2 * Math.PI);

  const u = (phaseOffset + simTime * meanMotion) % (2 * Math.PI);
  const current = getOrbitalVector(u, incRad, nodeLngRad, R);

  // Tangent sample forward along trajectory for heading orientation
  const du = 0.01;
  const next = getOrbitalVector(u + du, incRad, nodeLngRad, R);

  return {
    ...current,
    alt,
    nextX: next.x,
    nextY: next.y,
    nextZ: next.z,
    nextLat: next.lat,
    nextLng: next.lng,
    u
  };
};

