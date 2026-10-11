import * as THREE from 'three';
import { FORM_FACTORS } from '../cubesatComponents';

export const getCameraMetrics = (ff) => {
  switch (ff) {
    case '16U': return { dist: 28.5, targetY: 0.90 };
    case '12U': return { dist: 23.5, targetY: 0.75 };
    case '6U':  return { dist: 19.5, targetY: 0.65 };
    case '3U':  return { dist: 16.5, targetY: 0.60 };
    case '2U':  return { dist: 13.0, targetY: 0.35 };
    case '1U':
    default:    return { dist: 10.0, targetY: 0.20 };
  }
};

export const getChassisDimensions = (formFactor) => {
  const config = FORM_FACTORS[formFactor] || FORM_FACTORS['1U'];
  const unitsX = config.unitsX || (formFactor === '6U' || formFactor === '12U' || formFactor === '16U' ? 2 : 1);
  const unitsY = config.unitsY || (formFactor === '16U' ? 4 : formFactor === '3U' || formFactor === '6U' || formFactor === '12U' ? 3 : formFactor === '2U' ? 2 : 1);
  const unitsZ = config.unitsZ || (formFactor === '12U' || formFactor === '16U' ? 2 : 1);

  return {
    unitsX,
    unitsY,
    unitsZ,
    chassisWidth: 2.4 * unitsX,
    chassisHeight: 2.4 * unitsY,
    chassisDepth: 2.4 * unitsZ
  };
};

/**
 * Calculates bay offsets and shared materials for CubeSat component mounting.
 */
export function getBayConfiguration({ unitsX, unitsZ, w, d, h }) {
  const bayOffsets = [];
  if (unitsX === 1 && unitsZ === 1) {
    bayOffsets.push({ x: 0, z: 0, w: w - 0.3, d: d - 0.3 });
  } else if (unitsX === 2 && unitsZ === 1) {
    bayOffsets.push({ x: -w / 4, z: 0, w: w / 2 - 0.3, d: d - 0.3 });
    bayOffsets.push({ x: w / 4, z: 0, w: w / 2 - 0.3, d: d - 0.3 });
  } else {
    const qW = w / 2 - 0.3;
    const qD = d / 2 - 0.3;
    bayOffsets.push({ x: -w / 4, z: -d / 4, w: qW, d: qD });
    bayOffsets.push({ x: w / 4, z: -d / 4, w: qW, d: qD });
    bayOffsets.push({ x: -w / 4, z: d / 4, w: qW, d: qD });
    bayOffsets.push({ x: w / 4, z: d / 4, w: qW, d: qD });
  }
  const bayY = bayOffsets.map(() => -h / 2 + 0.35);

  const getBayForComp = (compId) => {
    if (bayOffsets.length === 1) return 0;
    if (bayOffsets.length === 2) {
      if (['battery_pack', 'battery_heavy_80wh', 'ion_propulsion_unit', 'cold_gas_thruster'].includes(compId)) return 1;
      return 0;
    }
    if (['obc_core', 'sband_transmitter', 'uhf_radio'].includes(compId)) return 0;
    if (['battery_pack', 'battery_heavy_80wh'].includes(compId)) return 1;
    if (['reaction_wheel', 'reaction_wheel_cluster', 'star_tracker', 'gps_receiver'].includes(compId)) return 2;
    return 3;
  };

  const materials = {
    pcbMat: new THREE.MeshStandardMaterial({ color: 0x0c4a2c, metalness: 0.3, roughness: 0.5 }),
    chipMat: new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 }),
    goldPinMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 }),
    solarCellMat: new THREE.MeshStandardMaterial({ color: 0x102a5c, metalness: 0.7, roughness: 0.15 }),
    batteryCellMat: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 }),
    metallicMat: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 }),
    cameraLensMat: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.95, roughness: 0.05 }),
    brassFlywheelMat: new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 }),
    ionPlasmaMat: new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
  };

  return { bayOffsets, bayY, getBayForComp, materials };
}
