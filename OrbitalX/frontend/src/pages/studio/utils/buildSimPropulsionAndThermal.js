import * as THREE from 'three';

/**
 * Builds the cold-gas thruster propulsion nozzle, particle clouds, status LED,
 * and high-visibility yellow thermal heater indicator for simulation canvas.
 */
export function buildSimPropulsionAndThermal({
  satGroup,
  chassisW,
  chassisH,
  chassisD
}) {
  // --- COLD-GAS THRUSTER NOZZLE & PLUME ---
  const nozzleGroup = new THREE.Group();
  nozzleGroup.position.set(0, -chassisH / 2, 0);
  satGroup.add(nozzleGroup);

  const nozzle = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x222633, metalness: 0.9, roughness: 0.3 })
  );
  nozzle.position.set(0, -0.25, 0);
  nozzleGroup.add(nozzle);

  const plumeGroup = new THREE.Group();
  nozzleGroup.add(plumeGroup);

  const innerCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 })
  );
  innerCore.rotation.x = Math.PI;
  innerCore.position.set(0, -0.9, 0);
  plumeGroup.add(innerCore);

  const outerPlume = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 1.9, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0 })
  );
  outerPlume.rotation.x = Math.PI;
  outerPlume.position.set(0, -1.2, 0);
  plumeGroup.add(outerPlume);

  // Billowing Orange Gas Cloud Puffs
  const cloudCount = 10;
  const gasClouds = [];
  for (let i = 0; i < cloudCount; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.26 + Math.random() * 0.2, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0 })
    );
    puff.userData = {
      baseY: -0.6 - i * 0.25,
      speed: 0.045 + Math.random() * 0.035,
      driftX: (Math.random() - 0.5) * 0.04,
      driftZ: (Math.random() - 0.5) * 0.04,
      maxScale: 2.6 + Math.random() * 1.0,
      life: i / cloudCount
    };
    nozzleGroup.add(puff);
    gasClouds.push(puff);
  }

  const thrustLight = new THREE.PointLight(0xff6600, 0, 10);
  thrustLight.position.set(0, -0.9, 0);
  nozzleGroup.add(thrustLight);

  // --- ANTENNAS ---
  const ant1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
  );
  ant1.position.set(-chassisW / 2 + 0.1, chassisH / 2 + 1.2, -chassisD / 2 + 0.1);
  satGroup.add(ant1);

  const patch = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95 })
  );
  patch.position.set(0.6, chassisH / 2 + 0.03, 0.6);
  satGroup.add(patch);

  // --- STATUS BEACON LED ---
  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff66 })
  );
  statusLed.position.set(chassisW / 2 - 0.15, chassisH / 2 + 0.05, chassisD / 2 - 0.15);
  satGroup.add(statusLed);

  // --- PROMINENT YELLOW HEATER INDICATION ---
  const heaterGroup = new THREE.Group();
  heaterGroup.position.set(0, chassisH * 0.35, chassisD / 2 + 0.05);
  satGroup.add(heaterGroup);

  const heaterRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.14, 24),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 })
  );
  heaterRing.rotation.x = Math.PI / 2;
  heaterGroup.add(heaterRing);

  const heaterBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0x332800,
      emissive: 0x221a00,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.8
    })
  );
  heaterBulb.position.set(0, 0, 0.08);
  heaterGroup.add(heaterBulb);

  const heaterCorona = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0 })
  );
  heaterCorona.position.set(0, 0, 0.08);
  heaterGroup.add(heaterCorona);

  const heaterLight = new THREE.PointLight(0xffea00, 0, 12);
  heaterLight.position.set(0, 0, 0.35);
  heaterGroup.add(heaterLight);

  const heaterStrips = [];
  [-chassisW / 2 + 0.02, chassisW / 2 - 0.02].forEach((sx) => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, chassisH * 0.7, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x443300, emissive: 0x000000, metalness: 0.8 })
    );
    strip.position.set(sx, 0, chassisD / 2 + 0.02);
    satGroup.add(strip);
    heaterStrips.push(strip);
  });

  return {
    plumeGroup,
    thrustLight,
    gasClouds,
    statusLed,
    heaterBulb,
    heaterCorona,
    heaterLight,
    heaterStrips
  };
}
