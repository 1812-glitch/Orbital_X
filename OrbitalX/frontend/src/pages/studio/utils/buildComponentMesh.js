import * as THREE from 'three';

/**
 * Creates the 3D meshes for a mounted CubeSat component by compId.
 */
export function buildComponentMesh(compId, i, context) {
  const {
    bayOffsets,
    bayY,
    getBayForComp,
    unitsZ,
    unitsY,
    w,
    h,
    d,
    isAssembling,
    pcbMat,
    chipMat,
    goldPinMat,
    solarCellMat,
    batteryCellMat,
    metallicMat,
    cameraLensMat,
    brassFlywheelMat,
    ionPlasmaMat
  } = context;

  const itemGroup = new THREE.Group();

  switch (compId) {
    case 'obc_core': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];
      const pcbW = curBay.w;
      const pcbD = curBay.d;

      // Stacked PC104 format PCB board
      const pcbGeo = new THREE.BoxGeometry(pcbW, 0.08, pcbD);
      const pcb = new THREE.Mesh(pcbGeo, pcbMat);
      itemGroup.add(pcb);

      // Microcontroller IC
      const mcuGeo = new THREE.BoxGeometry(0.4, 0.06, 0.4);
      const mcu = new THREE.Mesh(mcuGeo, chipMat);
      mcu.position.set(0, 0.06, 0);
      itemGroup.add(mcu);

      // Glowing status LED
      const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(pcbW * 0.35, 0.06, pcbD * 0.35);
      itemGroup.add(led);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.45;
      itemGroup.position.set(curBay.x, targetY + (isAssembling ? 1.5 : 0), curBay.z);
      break;
    }

    case 'battery_pack': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];
      const packW = curBay.w;
      const packD = curBay.d;

      const packGeo = new THREE.BoxGeometry(packW, 0.45, packD);
      const pack = new THREE.Mesh(packGeo, batteryCellMat);
      itemGroup.add(pack);

      const labelGeo = new THREE.PlaneGeometry(packW * 0.5, 0.18);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.rotation.x = Math.PI / 2;
      label.position.set(0, 0.23, 0);
      itemGroup.add(label);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.65;
      itemGroup.position.set(curBay.x, targetY + (isAssembling ? -1.8 : 0), curBay.z);
      break;
    }

    case 'battery_heavy_80wh': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];
      const packW = curBay.w;
      const packD = curBay.d;

      const packGeo = new THREE.BoxGeometry(packW, 0.75, packD);
      const heavyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
      const pack = new THREE.Mesh(packGeo, heavyMat);
      itemGroup.add(pack);

      const busbarGeo = new THREE.BoxGeometry(packW * 0.8, 0.04, 0.15);
      const busbar = new THREE.Mesh(busbarGeo, goldPinMat);
      busbar.position.set(0, 0.38, 0);
      itemGroup.add(busbar);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.95;
      itemGroup.position.set(curBay.x, targetY + (isAssembling ? -2.2 : 0), curBay.z);
      break;
    }

    case 'reaction_wheel': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.22, 24);
      const wheel = new THREE.Mesh(wheelGeo, brassFlywheelMat);
      wheel.rotation.z = Math.PI / 2;
      itemGroup.add(wheel);

      const bracketGeo = new THREE.BoxGeometry(0.1, 0.55, 0.55);
      const bracket = new THREE.Mesh(bracketGeo, metallicMat);
      itemGroup.add(bracket);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.55;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'reaction_wheel_cluster': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const baseGeo = new THREE.BoxGeometry(curBay.w * 0.9, 0.12, curBay.d * 0.9);
      const baseMesh = new THREE.Mesh(baseGeo, metallicMat);
      itemGroup.add(baseMesh);

      const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 20);
      const wheelAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      wheelAngles.forEach(ang => {
        const wMesh = new THREE.Mesh(wheelGeo, brassFlywheelMat);
        wMesh.position.set(Math.cos(ang) * 0.35, 0.25, Math.sin(ang) * 0.35);
        wMesh.rotation.x = 0.5;
        wMesh.rotation.y = ang;
        itemGroup.add(wMesh);
      });

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.85;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'sband_transmitter':
    case 'uhf_radio': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const rfBoxGeo = new THREE.BoxGeometry(curBay.w * 0.85, 0.3, curBay.d * 0.85);
      const rfBox = new THREE.Mesh(rfBoxGeo, metallicMat);
      itemGroup.add(rfBox);

      const smaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
      const sma = new THREE.Mesh(smaGeo, goldPinMat);
      sma.position.set(curBay.w * 0.3, 0.2, 0);
      itemGroup.add(sma);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.5;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'cold_gas_thruster': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const tankGeo = new THREE.SphereGeometry(curBay.w * 0.38, 20, 20);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      itemGroup.add(tank);

      const nozzleGeo = new THREE.ConeGeometry(0.08, 0.22, 12);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.3 });
      [-1, 1].forEach(nx => {
        [-1, 1].forEach(nz => {
          const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
          nozzle.position.set(nx * 0.35, -curBay.w * 0.32, nz * 0.35);
          nozzle.rotation.x = Math.PI;
          itemGroup.add(nozzle);
        });
      });

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.8;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'ion_propulsion_unit': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const engineGeo = new THREE.CylinderGeometry(curBay.w * 0.42, curBay.w * 0.42, 0.65, 24);
      const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
      const engine = new THREE.Mesh(engineGeo, engineMat);
      itemGroup.add(engine);

      const gridGeo = new THREE.CylinderGeometry(curBay.w * 0.36, curBay.w * 0.36, 0.06, 24);
      const gridMesh = new THREE.Mesh(gridGeo, ionPlasmaMat);
      gridMesh.position.set(0, -0.35, 0);
      itemGroup.add(gridMesh);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.95;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'hyperspectral_payload': {
      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];

      const tubeGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 24);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(0, 0, 0);
      itemGroup.add(tube);

      const optLensGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24);
      const optLens = new THREE.Mesh(optLensGeo, cameraLensMat);
      optLens.position.set(0, 0.6, 0);
      itemGroup.add(optLens);

      const specBoxGeo = new THREE.BoxGeometry(curBay.w * 0.8, 0.4, curBay.d * 0.8);
      const specBoxMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
      const specBox = new THREE.Mesh(specBoxGeo, specBoxMat);
      specBox.position.set(0, -0.7, 0);
      itemGroup.add(specBox);

      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 1.6;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'solar_panel_1u': {
      const panelW = 2.15;
      const panelH = 2.15;
      const panelGeo = new THREE.BoxGeometry(panelW, panelH, 0.04);
      const panelMesh = new THREE.Mesh(panelGeo, solarCellMat);
      itemGroup.add(panelMesh);

      const busbarGeo = new THREE.PlaneGeometry(panelW - 0.1, 0.02);
      const busbarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const bb1 = new THREE.Mesh(busbarGeo, busbarMat);
      bb1.position.set(0, 0.4, 0.025);
      itemGroup.add(bb1);
      const bb2 = new THREE.Mesh(busbarGeo, busbarMat);
      bb2.position.set(0, -0.4, 0.025);
      itemGroup.add(bb2);

      // Strictly 2 parallel opposite sides: Right (+X) and Left (-X)
      const side = i % 2;
      const slot = Math.floor(i / 2);
      const col = slot % unitsZ;
      const row = Math.floor(slot / unitsZ) % unitsY;

      const yOffset = -h / 2 + 1.2 + row * 2.4;
      const zOffset = unitsZ > 1 ? (-d / 2 + 1.2 + col * 2.4) : 0;

      if (side === 0) {
        itemGroup.position.set(w / 2 + 0.025 + (isAssembling ? 1.5 : 0), yOffset, zOffset);
        itemGroup.rotation.y = Math.PI / 2;
      } else {
        itemGroup.position.set(-w / 2 - 0.025 - (isAssembling ? 1.5 : 0), yOffset, zOffset);
        itemGroup.rotation.y = -Math.PI / 2;
      }
      break;
    }

    case 'antenna_deployable': {
      const baseGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
      const base = new THREE.Mesh(baseGeo, metallicMat);
      itemGroup.add(base);

      const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8);
      const rod = new THREE.Mesh(rodGeo, goldPinMat);
      rod.position.set(0, 1.1, 0);
      itemGroup.add(rod);

      const offsetSign = i === 0 ? 1 : -1;
      itemGroup.position.set(
        (w / 2 - 0.3) * offsetSign,
        h / 2 + 0.05 + (isAssembling ? 2.0 : 0),
        (d / 2 - 0.3) * offsetSign
      );
      break;
    }

    case 'xband_highgain_dish': {
      const dishGeo = new THREE.SphereGeometry(0.9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.rotation.x = Math.PI / 2;
      itemGroup.add(dish);

      const boomGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
      const boom = new THREE.Mesh(boomGeo, metallicMat);
      boom.position.set(0, 0, 0.4);
      boom.rotation.x = Math.PI / 2;
      itemGroup.add(boom);

      itemGroup.position.set(0, h / 2 + 0.45 + (isAssembling ? 2.0 : 0), 0);
      break;
    }

    case 'star_tracker': {
      const hoodGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.4, 20);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.rotation.x = -Math.PI / 4;
      itemGroup.add(hood);

      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), cameraLensMat);
      lens.position.set(0, 0.15, 0.15);
      lens.rotation.x = -Math.PI / 4;
      itemGroup.add(lens);

      const sign = i === 0 ? 1 : -1;
      itemGroup.position.set(sign * (w / 3), h / 2 + 0.2 + (isAssembling ? 1.5 : 0), 0);
      break;
    }

    case 'camera_visible': {
      const barrelGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.5, 24);
      const barrel = new THREE.Mesh(barrelGeo, metallicMat);
      barrel.rotation.x = Math.PI / 2;
      itemGroup.add(barrel);

      const lensGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24);
      const lens = new THREE.Mesh(lensGeo, cameraLensMat);
      lens.position.set(0, 0, 0.25);
      lens.rotation.x = Math.PI / 2;
      itemGroup.add(lens);

      itemGroup.position.set(0, 0, d / 2 + 0.2 + (isAssembling ? 2.0 : 0));
      break;
    }

    case 'gps_receiver':
    case 'temp_sensor': {
      const patchGeo = new THREE.BoxGeometry(0.25, 0.05, 0.25);
      const patchMat = new THREE.MeshStandardMaterial({
        color: compId === 'gps_receiver' ? 0x10b981 : 0x06b6d4,
        metalness: 0.6,
        roughness: 0.4
      });
      const patch = new THREE.Mesh(patchGeo, patchMat);
      itemGroup.add(patch);

      const bayIdx = getBayForComp(compId);
      const curBay = bayOffsets[bayIdx];
      const targetY = bayY[bayIdx];
      bayY[bayIdx] += 0.25;
      itemGroup.position.set(curBay.x, targetY, curBay.z);
      break;
    }

    case 'solar_wings_deployable':
    case 'solar_wings_heavy': {
      const isHeavy = compId === 'solar_wings_heavy';
      const numSegments = isHeavy ? 4 : 3;
      const segW = isHeavy ? 2.0 : 1.6;
      const wingH = h * 0.82;
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
        const sCell = new THREE.Mesh(new THREE.BoxGeometry(segW - 0.04, wingH - 0.04, 0.03), wingMat);
        sGroup.add(sCell);
        const sFrame = new THREE.Mesh(new THREE.BoxGeometry(segW, wingH, 0.025), frameMat);
        sGroup.add(sFrame);
        return sGroup;
      };

      const leftWing = new THREE.Group();
      for (let s = 0; s < numSegments; s++) {
        const seg = createWingSegment();
        seg.position.set(-w / 2 - segW / 2 - s * segW, 0, d / 2 - 0.1);
        leftWing.add(seg);
      }
      itemGroup.add(leftWing);

      const rightWing = new THREE.Group();
      for (let s = 0; s < numSegments; s++) {
        const seg = createWingSegment();
        seg.position.set(w / 2 + segW / 2 + s * segW, 0, d / 2 - 0.1);
        rightWing.add(seg);
      }
      itemGroup.add(rightWing);

      itemGroup.position.set(0, 0, isAssembling ? 1.5 : 0);
      break;
    }

    case 'shear_panels': {
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.3 });
      const side = i % 2 === 0 ? 1 : -1;
      const panelGeo = new THREE.BoxGeometry(0.04, h * 0.88, d * 0.88);
      const panel = new THREE.Mesh(panelGeo, carbonMat);
      itemGroup.add(panel);
      itemGroup.position.set(side * (w / 2 + 0.02 + (isAssembling ? 1.0 : 0)), 0, 0);
      break;
    }

    case 'structural_bulkhead_ribs': {
      const ribMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
      const ribGeo = new THREE.BoxGeometry(w - 0.2, 0.08, d - 0.2);
      const rib = new THREE.Mesh(ribGeo, ribMat);
      itemGroup.add(rib);
      itemGroup.position.set(0, -h / 4 + i * 0.8, 0);
      break;
    }

    case 'separation_springs': {
      const plungerMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });
      const pGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
      [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([px, pz]) => {
        const plunger = new THREE.Mesh(pGeo, plungerMat);
        plunger.position.set(px, -h / 2 - 0.18, pz);
        itemGroup.add(plunger);
      });
      break;
    }

    case 'chassis_rails': {
      const railMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
      const rGeo = new THREE.BoxGeometry(0.14, h + 0.12, 0.14);
      [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([rx, rz]) => {
        const rail = new THREE.Mesh(rGeo, railMat);
        rail.position.set(rx, 0, rz);
        itemGroup.add(rail);
      });
      break;
    }

    default:
      break;
  }

  return itemGroup;
}
