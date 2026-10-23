import * as THREE from 'three';
import { getSatSeed, getKeplerianOrbitalCoords } from '../../../utils/orbitalMath';

/**
 * Builds the volumetric 3D orbital ring tube for Earth globe visualization.
 */
export function buildOrbitalRingMesh(satId, inclination, visualAlt, globe = null) {
  const numSegments = 240;
  const points = [];
  const seed = getSatSeed(satId);
  const nodeLngRad = ((seed * 73) % 360) * (Math.PI / 180);
  const incRad = (inclination * Math.PI) / 180;

  for (let i = 0; i <= numSegments; i++) {
    const u = (i / numSegments) * 2 * Math.PI;
    const pt = getKeplerianOrbitalCoords(u, incRad, nodeLngRad, visualAlt, globe);
    points.push(new THREE.Vector3(pt.x, pt.y, pt.z));
  }

  const curve = new THREE.CatmullRomCurve3(points, true);
  const group = new THREE.Group();

  // Core high-intensity neon tube
  const tubeGeo = new THREE.TubeGeometry(curve, 240, 0.35, 8, true);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: 0x00F0FF,
    transparent: true,
    opacity: 0.95,
    depthTest: true
  });
  group.add(new THREE.Mesh(tubeGeo, tubeMat));

  // Outer ambient glow tube
  const glowGeo = new THREE.TubeGeometry(curve, 180, 0.70, 6, true);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00F0FF,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthTest: true
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return group;
}


/**
 * Builds the high-detail 3D CubeSat bus model for Earth globe visualization.
 */
export function buildGlobeSatMesh({
  formFactor = '3U',
  solarPanelsDeployed = true,
  status = 'NOMINAL',
  ledRef,
  plumeRef
}) {
  const group = new THREE.Group();
  const is16U = formFactor === '16U';
  const is12U = formFactor === '12U';
  const is6U = formFactor === '6U';
  const is2U = formFactor === '2U';

  const w = (is16U || is12U || is6U) ? 1.6 : 0.8;
  const h = is16U ? 3.2 : (is12U || is6U || formFactor === '3U') ? 2.4 : is2U ? 1.6 : 0.8;
  const depth = (is16U || is12U) ? 1.6 : 0.8;

  // CubeSat Main Bus Body
  const busGeo = new THREE.BoxGeometry(w, h, depth);
  const busMat = new THREE.MeshStandardMaterial({
    color: 0x141b2d,
    metalness: 0.85,
    roughness: 0.3
  });
  group.add(new THREE.Mesh(busGeo, busMat));

  // Silicon solar cells on body
  const cellGeo = new THREE.BoxGeometry(w * 0.9, h * 0.9, depth + 0.04);
  const cellMat = new THREE.MeshStandardMaterial({
    color: 0x051336,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x001533,
    emissiveIntensity: 0.5
  });
  group.add(new THREE.Mesh(cellGeo, cellMat));

  // Deployable 3-Segment Origami Solar Wings
  const segW = depth * 0.88;
  const wingH = h * 0.85;
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x071b38,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x001533,
    emissiveIntensity: 0.5
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

  const createWingSegment = () => {
    const sGroup = new THREE.Group();
    sGroup.add(new THREE.Mesh(new THREE.BoxGeometry(segW - 0.02, wingH - 0.02, 0.035), wingMat));
    sGroup.add(new THREE.Mesh(new THREE.BoxGeometry(segW, wingH, 0.03), frameMat));
    return sGroup;
  };

  const zRoot = depth / 2 - 0.06;

  // Left Wing (3 segments)
  const leftWingGroup = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const seg = createWingSegment();
    if (solarPanelsDeployed) {
      seg.position.set(-w / 2 - segW / 2 - s * segW, 0, zRoot);
    } else {
      seg.rotation.y = Math.PI / 2;
      seg.position.set(-w / 2 - 0.025 - s * 0.045, 0, zRoot - segW / 2);
    }
    leftWingGroup.add(seg);
  }
  group.add(leftWingGroup);

  // Right Wing (3 segments)
  const rightWingGroup = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const seg = createWingSegment();
    if (solarPanelsDeployed) {
      seg.position.set(w / 2 + segW / 2 + s * segW, 0, zRoot);
    } else {
      seg.rotation.y = -Math.PI / 2;
      seg.position.set(w / 2 + 0.025 + s * 0.045, 0, zRoot - segW / 2);
    }
    rightWingGroup.add(seg);
  }
  group.add(rightWingGroup);

  // Gold Rail Edges
  const railMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
  const railGeo = new THREE.BoxGeometry(0.06, h + 0.05, 0.06);
  [[-w / 2, -depth / 2], [w / 2, -depth / 2], [-w / 2, depth / 2], [w / 2, depth / 2]].forEach(([rx, rz]) => {
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(rx, 0, rz);
    group.add(rail);
  });

  // Status Beacon LED
  const ledGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const ledColor = status === 'SAFE_MODE' ? 0xff2a2a : status === 'SCIENCE_ACQUISITION' ? 0x00f0ff : 0x00ff66;
  const ledMat = new THREE.MeshBasicMaterial({ color: ledColor, transparent: true, opacity: 0.9 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0, h / 2 + 0.12, 0);
  group.add(led);
  if (ledRef) ledRef.current = led;

  // Glowing Cold-Gas Thruster Plume
  const plumeGeo = new THREE.ConeGeometry(0.45, 1.8, 14);
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0 });
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.rotation.x = Math.PI;
  plume.position.set(0, -h / 2 - 0.9, 0);
  plume.visible = false;
  group.add(plume);
  if (plumeRef) plumeRef.current = plume;

  group.scale.set(1.4, 1.4, 1.4);
  return group;
}
