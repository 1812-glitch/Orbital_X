import * as THREE from 'three';

/**
 * Builds high-fidelity 3-segment origami accordion solar wings for CubeSat simulation.
 */
export function buildSimSolarWings({
  satGroup,
  chassisW,
  chassisH,
  chassisD,
  cellMat,
  solarPanelsDeployed
}) {
  const segW = Math.min(chassisD * 0.88, 3.6);
  const segH = chassisH * 0.86;
  const segD = 0.045;
  const zRoot = chassisD / 2 - (segW * 0.065);

  const wingFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
  const backingMat = new THREE.MeshStandardMaterial({ color: 0x141824, roughness: 0.8, metalness: 0.3 });
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x9aa2b4, metalness: 0.92, roughness: 0.25 });
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.98, roughness: 0.12 });
  const flexJumperMat = new THREE.MeshStandardMaterial({ color: 0xcca033, metalness: 0.9, roughness: 0.3 });
  const snubberMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.85 });

  const buildSegment = () => {
    const segGroup = new THREE.Group();
    segGroup.add(new THREE.Mesh(new THREE.BoxGeometry(segW - 0.04, segH - 0.04, segD), cellMat));
    segGroup.add(new THREE.Mesh(new THREE.BoxGeometry(segW, segH, segD - 0.005), wingFrameMat));

    const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(segW - 0.02, segH - 0.02), backingMat);
    backMesh.rotation.y = Math.PI;
    backMesh.position.set(0, 0, -segD / 2 - 0.002);
    segGroup.add(backMesh);

    const divRows = 6;
    for (let r = 1; r < divRows; r++) {
      const dy = -segH / 2 + (r * segH) / divRows;
      const divLine = new THREE.Mesh(
        new THREE.BoxGeometry(segW - 0.06, 0.015, 0.004),
        new THREE.MeshBasicMaterial({ color: 0x00d8ff, transparent: true, opacity: 0.5 })
      );
      divLine.position.set(0, dy, segD / 2 + 0.003);
      segGroup.add(divLine);
    }

    const vBus = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, segH - 0.08, 0.004),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 })
    );
    vBus.position.set(0, 0, segD / 2 + 0.003);
    segGroup.add(vBus);

    const snubberOffsets = [
      [-segW * 0.44, segH * 0.44],
      [-segW * 0.44, -segH * 0.44],
      [segW * 0.44, segH * 0.44],
      [segW * 0.44, -segH * 0.44]
    ];
    snubberOffsets.forEach(([sx, sy]) => {
      const snubber = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, segD + 0.008, 8), snubberMat);
      snubber.rotation.x = Math.PI / 2;
      snubber.position.set(sx, sy, 0);
      segGroup.add(snubber);
    });

    return segGroup;
  };

  const createHingeBarrels = (h) => {
    const hingeGroup = new THREE.Group();
    [-h * 0.36, 0, h * 0.36].forEach((hy) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.24, 16), hingeMat);
      barrel.position.set(0, hy, 0);
      hingeGroup.add(barrel);

      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.30, 16), pinMat);
      pin.position.set(0, hy, 0);
      hingeGroup.add(pin);

      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), wingFrameMat);
      bracket.position.set(0, hy, 0);
      hingeGroup.add(bracket);
    });
    return hingeGroup;
  };

  const createFlexJumpers = (h) => {
    const jumperGroup = new THREE.Group();
    [-h * 0.18, h * 0.18].forEach((jy) => {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI), flexJumperMat);
      torus.rotation.z = Math.PI / 2;
      torus.position.set(0, jy, 0.035);
      jumperGroup.add(torus);
    });
    return jumperGroup;
  };

  // --- LEFT WING ---
  const leftJoint0 = new THREE.Group();
  leftJoint0.position.set(-chassisW / 2, 0, zRoot);
  satGroup.add(leftJoint0);
  leftJoint0.add(createHingeBarrels(segH));

  const leftSeg1 = buildSegment();
  leftSeg1.position.set(-segW / 2, 0, 0);
  leftJoint0.add(leftSeg1);

  const leftJoint1 = new THREE.Group();
  leftJoint1.position.set(-segW, 0, 0);
  leftJoint0.add(leftJoint1);
  leftJoint1.add(createHingeBarrels(segH));
  leftJoint1.add(createFlexJumpers(segH));

  const leftSeg2 = buildSegment();
  leftSeg2.position.set(-segW / 2, 0, 0);
  leftJoint1.add(leftSeg2);

  const leftJoint2 = new THREE.Group();
  leftJoint2.position.set(-segW, 0, 0);
  leftJoint1.add(leftJoint2);
  leftJoint2.add(createHingeBarrels(segH));
  leftJoint2.add(createFlexJumpers(segH));

  const leftSeg3 = buildSegment();
  leftSeg3.position.set(-segW / 2, 0, 0);
  leftJoint2.add(leftSeg3);

  // --- RIGHT WING ---
  const rightJoint0 = new THREE.Group();
  rightJoint0.position.set(chassisW / 2, 0, zRoot);
  satGroup.add(rightJoint0);
  rightJoint0.add(createHingeBarrels(segH));

  const rightSeg1 = buildSegment();
  rightSeg1.position.set(segW / 2, 0, 0);
  rightJoint0.add(rightSeg1);

  const rightJoint1 = new THREE.Group();
  rightJoint1.position.set(segW, 0, 0);
  rightJoint0.add(rightJoint1);
  rightJoint1.add(createHingeBarrels(segH));
  rightJoint1.add(createFlexJumpers(segH));

  const rightSeg2 = buildSegment();
  rightSeg2.position.set(segW / 2, 0, 0);
  rightJoint1.add(rightSeg2);

  const rightJoint2 = new THREE.Group();
  rightJoint2.position.set(segW, 0, 0);
  rightJoint1.add(rightJoint2);
  rightJoint2.add(createHingeBarrels(segH));
  rightJoint2.add(createFlexJumpers(segH));

  const rightSeg3 = buildSegment();
  rightSeg3.position.set(segW / 2, 0, 0);
  rightJoint2.add(rightSeg3);

  // Posture setup
  const initF = solarPanelsDeployed ? 0.0 : 1.0;
  leftJoint0.rotation.y = -initF * (Math.PI / 2);
  leftJoint1.rotation.y = initF * Math.PI;
  leftJoint1.position.z = initF * 0.065;
  leftJoint2.rotation.y = -initF * Math.PI;
  leftJoint2.position.z = -initF * 0.065;

  rightJoint0.rotation.y = initF * (Math.PI / 2);
  rightJoint1.rotation.y = -initF * Math.PI;
  rightJoint1.position.z = initF * 0.065;
  rightJoint2.rotation.y = initF * Math.PI;
  rightJoint2.position.z = -initF * 0.065;

  return {
    leftOrigami: { joint0: leftJoint0, joint1: leftJoint1, joint2: leftJoint2 },
    rightOrigami: { joint0: rightJoint0, joint1: rightJoint1, joint2: rightJoint2 }
  };
}
