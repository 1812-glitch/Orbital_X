import * as THREE from 'three';

/**
 * Builds the structural chassis frame for CubeSats (1U up to 16U)
 * Handles rails, standoffs, endcaps, and stacking ribs.
 */
export function buildChassisFrame(frameGroup, { chassisWidth: w, chassisHeight: h, chassisDepth: d, unitsY, unitsX, unitsZ }) {
  if (!frameGroup) return;

  // Clear old frame
  while (frameGroup.children.length > 0) {
    const obj = frameGroup.children[0];
    frameGroup.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }

  const railThick = 0.12;

  // Materials
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8963e, // Golden anodized aluminum deployer rails
    metalness: 0.9,
    roughness: 0.25
  });

  const structMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // Matte space-grade hard anodized 6061-T6 aluminum
    metalness: 0.8,
    roughness: 0.4
  });

  const glowWireMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });

  // 4 Vertical Golden Corner Rails
  const cornerPositions = [
    [-w / 2, 0, -d / 2],
    [w / 2, 0, -d / 2],
    [-w / 2, 0, d / 2],
    [w / 2, 0, d / 2]
  ];

  cornerPositions.forEach(([x, y, z]) => {
    const railGeo = new THREE.BoxGeometry(railThick, h + 0.1, railThick);
    const rail = new THREE.Mesh(railGeo, railMaterial);
    rail.position.set(x, y, z);
    rail.castShadow = true;
    rail.receiveShadow = true;
    frameGroup.add(rail);

    // Top and bottom deployment tabs / pusher standoffs
    const standoffGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
    const standoffTop = new THREE.Mesh(standoffGeo, railMaterial);
    standoffTop.position.set(x, h / 2 + 0.1, z);
    frameGroup.add(standoffTop);

    const standoffBottom = new THREE.Mesh(standoffGeo, railMaterial);
    standoffBottom.position.set(x, -h / 2 - 0.1, z);
    frameGroup.add(standoffBottom);
  });

  // Top & Bottom End Ribs
  const endCapHeights = [-h / 2, h / 2];
  endCapHeights.forEach((yPos) => {
    // X-bars
    const xBarGeo = new THREE.BoxGeometry(w, railThick, railThick);
    const xBar1 = new THREE.Mesh(xBarGeo, structMaterial);
    xBar1.position.set(0, yPos, -d / 2);
    frameGroup.add(xBar1);

    const xBar2 = new THREE.Mesh(xBarGeo, structMaterial);
    xBar2.position.set(0, yPos, d / 2);
    frameGroup.add(xBar2);

    // Z-bars
    const zBarGeo = new THREE.BoxGeometry(railThick, railThick, d);
    const zBar1 = new THREE.Mesh(zBarGeo, structMaterial);
    zBar1.position.set(-w / 2, yPos, 0);
    frameGroup.add(zBar1);

    const zBar2 = new THREE.Mesh(zBarGeo, structMaterial);
    zBar2.position.set(w / 2, yPos, 0);
    frameGroup.add(zBar2);
  });

  // Internal Skeletonized Stacking Ribs for multi-U heights
  const verticalUnits = unitsY || 1;
  if (verticalUnits > 1) {
    const ribCount = verticalUnits - 1;
    for (let i = 1; i <= ribCount; i++) {
      const yPos = -h / 2 + (h / verticalUnits) * i;
      const midRibX1 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.06), structMaterial);
      midRibX1.position.set(0, yPos, -d / 2);
      frameGroup.add(midRibX1);

      const midRibX2 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.06), structMaterial);
      midRibX2.position.set(0, yPos, d / 2);
      frameGroup.add(midRibX2);

      const midRibZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, d - 0.1), structMaterial);
      midRibZ1.position.set(-w / 2, yPos, 0);
      frameGroup.add(midRibZ1);

      const midRibZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, d - 0.1), structMaterial);
      midRibZ2.position.set(w / 2, yPos, 0);
      frameGroup.add(midRibZ2);

      // Internal cross-ties if multi-bay
      if (unitsX > 1) {
        const crossBarZ = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, d - 0.1), structMaterial);
        crossBarZ.position.set(0, yPos, 0);
        frameGroup.add(crossBarZ);
      }
      if (unitsZ > 1) {
        const crossBarX = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.06), structMaterial);
        crossBarX.position.set(0, yPos, 0);
        frameGroup.add(crossBarX);
      }
    }
  }

  // Vertical Divider Mid-Rails for Multi-Bay (6U, 12U, 16U)
  if (unitsX > 1) {
    const midRailGeo = new THREE.BoxGeometry(railThick, h + 0.08, railThick);
    const midRailFront = new THREE.Mesh(midRailGeo, structMaterial);
    midRailFront.position.set(0, 0, d / 2);
    frameGroup.add(midRailFront);

    const midRailBack = new THREE.Mesh(midRailGeo, structMaterial);
    midRailBack.position.set(0, 0, -d / 2);
    frameGroup.add(midRailBack);
  }
  if (unitsZ > 1) {
    const midRailGeoZ = new THREE.BoxGeometry(railThick, h + 0.08, railThick);
    const midRailLeft = new THREE.Mesh(midRailGeoZ, structMaterial);
    midRailLeft.position.set(-w / 2, 0, 0);
    frameGroup.add(midRailLeft);

    const midRailRight = new THREE.Mesh(midRailGeoZ, structMaterial);
    midRailRight.position.set(w / 2, 0, 0);
    frameGroup.add(midRailRight);

    // Central backbone pillar at (0, 0)
    const centerPillar = new THREE.Mesh(new THREE.BoxGeometry(railThick * 1.2, h + 0.05, railThick * 1.2), structMaterial);
    centerPillar.position.set(0, 0, 0);
    frameGroup.add(centerPillar);
  }

  // Ghost bounding wireframe
  const ghostBoxGeo = new THREE.BoxGeometry(w, h, d);
  const ghostBox = new THREE.Mesh(ghostBoxGeo, glowWireMaterial);
  frameGroup.add(ghostBox);
}
