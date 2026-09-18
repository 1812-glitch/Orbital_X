import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Gauge, Thermometer, Flame, Zap, ShieldCheck } from 'lucide-react';

export default function CubeSatSimulationCanvas({
  formFactor = '3U',
  solarPanelsDeployed = true,
  isThrusting = false,
  heaterActive = false,
  speed = 7.56,
  altitude = 512.4,
  status = 'NOMINAL',
  attitude = { roll: 0, pitch: 0, yaw: 0 },
  autoRotate = false,
  showEmbeddedHud = false
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const satGroupRef = useRef(null);
  const leftOrigamiRef = useRef({ joint0: null, joint1: null, joint2: null });
  const rightOrigamiRef = useRef({ joint0: null, joint1: null, joint2: null });
  const foldProgressRef = useRef(solarPanelsDeployed ? 0 : 1);
  const plumeGroupRef = useRef(null);
  const thrustLightRef = useRef(null);
  const gasCloudsRef = useRef([]);
  const statusLedRef = useRef(null);
  const heaterBulbRef = useRef(null);
  const heaterCoronaRef = useRef(null);
  const heaterLightRef = useRef(null);
  const heaterStripsRef = useRef([]);
  const animIdRef = useRef(null);
  const panelHudSpanRef = useRef(null);

  // Dynamic state refs for animation loop
  const solarPanelsDeployedRef = useRef(solarPanelsDeployed);
  solarPanelsDeployedRef.current = solarPanelsDeployed;

  const isThrustingRef = useRef(isThrusting);
  isThrustingRef.current = isThrusting;

  const statusRef = useRef(status);
  statusRef.current = status;

  const heaterActiveRef = useRef(heaterActive);
  heaterActiveRef.current = heaterActive;

  // Height multiplier based on form factor
  const is6U = formFactor === '6U';
  const heightMultiplier = is6U ? 3.0 : formFactor === '3U' ? 3.0 : 1.0;
  const chassisW = is6U ? 4.2 : 2.2;
  const chassisH = 2.2 * heightMultiplier; // 6.6 for 3U
  const chassisD = 2.2;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(7.2, 4.0, 9.2);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 3.5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.9);
    sunLight.position.set(12, 16, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Earth Albedo bounce light (blueish from below)
    const earthAlbedo = new THREE.DirectionalLight(0x00a8ff, 0.7);
    earthAlbedo.position.set(-6, -10, -4);
    scene.add(earthAlbedo);

    // 6. Distant Earth curvature below
    const earthGeo = new THREE.SphereGeometry(35, 64, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x082545,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x020d1c,
      emissiveIntensity: 0.4
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(0, -42, 0);
    scene.add(earth);

    // Atmospheric Glow rim
    const atmGeo = new THREE.SphereGeometry(35.4, 64, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x00d0ff,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    atmosphere.position.set(0, -42, 0);
    scene.add(atmosphere);

    // Starfield particles
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x88bbff, size: 0.15, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 7. Master CubeSat Group
    const satGroup = new THREE.Group();
    satGroupRef.current = satGroup;
    scene.add(satGroup);

    // CubeSat Main Bus Body
    const busGeo = new THREE.BoxGeometry(chassisW, chassisH, chassisD);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0x141b2d,
      roughness: 0.35,
      metalness: 0.85
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.castShadow = true;
    busMesh.receiveShadow = true;
    satGroup.add(busMesh);

    // Structural Anodized Rails (Gold/Yellow Aluminum edge highlights)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xcca033,
      metalness: 0.9,
      roughness: 0.3
    });
    const railThick = 0.08;
    const railOffsets = [
      [-chassisW / 2, -chassisD / 2],
      [chassisW / 2, -chassisD / 2],
      [-chassisW / 2, chassisD / 2],
      [chassisW / 2, chassisD / 2]
    ];
    railOffsets.forEach(([rx, rz]) => {
      const railGeo = new THREE.BoxGeometry(railThick, chassisH + 0.05, railThick);
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, 0, rz);
      satGroup.add(rail);
    });

    // Body Solar Cell Panels (front and back face)
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x051336,
      roughness: 0.18,
      metalness: 0.92,
      emissive: 0x001533,
      emissiveIntensity: 0.4
    });
    const frontPanelGeo = new THREE.BoxGeometry(chassisW * 0.88, chassisH * 0.92, 0.03);
    const frontPanel = new THREE.Mesh(frontPanelGeo, cellMat);
    frontPanel.position.set(0, 0, chassisD / 2 + 0.02);
    satGroup.add(frontPanel);

    const backPanel = new THREE.Mesh(frontPanelGeo, cellMat);
    backPanel.position.set(0, 0, -chassisD / 2 - 0.02);
    satGroup.add(backPanel);

    // Solar Cell Grid Divider Lines (subtle and confined strictly to the front face)
    const cellDivGroup = new THREE.Group();
    const cellRows = is6U ? 6 : 4;
    for (let i = 1; i < cellRows; i++) {
      const lineY = -chassisH * 0.44 + (i * (chassisH * 0.88) / cellRows);
      const divGeo = new THREE.BoxGeometry(chassisW * 0.82, 0.02, 0.005);
      const divMat = new THREE.MeshBasicMaterial({ color: 0x00d8ff, transparent: true, opacity: 0.6 });
      const divider = new THREE.Mesh(divGeo, divMat);
      divider.position.set(0, lineY, chassisD / 2 + 0.04);
      cellDivGroup.add(divider);
    }
    satGroup.add(cellDivGroup);

    // =========================================================================
    // 8. DEPLOYABLE SOLAR WINGS (SYMMETRICAL, WIDE, PARALLEL WINGS)
    // Left wing extends along -X, Right wing extends along +X.
    // Both wings are coplanar, flat, parallel to each other facing forward (+Z).
    // When STOWED: they fold flush against the sides of the chassis!
    // When DEPLOYED: they unfold outward symmetrically like majestic solar arrays!
    // =========================================================================
    // =========================================================================
    // 8. DEPLOYABLE SOLAR WINGS: 3-SEGMENT ORIGAMI ZIG-ZAG (ACCORDION / Z-FOLD)
    // - Each wing has 3 hinged segments.
    // - When DEPLOYED (f = 0): Unfolds into a wide, coplanar, flat solar array
    //   extending outward symmetrically on -X and +X, facing +Z.
    // - When STOWING (0 < f < 1): Joint angles alternate in an origami zig-zag
    //   accordion wave.
    // - When FULLY STOWED (f = 1): Folds into a flat, parallel sandwich stack
    //   resting flush against the side face of the chassis.
    // - CRITICAL CONSTRAINT: Each segment width (segW = 1.95) is strictly LESS
    //   than chassisD (2.2). It NEVER exceeds the front, back, top, or bottom
    //   borders of the CubeSat side face!
    // =========================================================================
    const segW = 1.95; // Strictly within chassisD (2.2) length with margin!
    const segH = chassisH * 0.86; // Strictly within chassisH (6.6) height
    const segD = 0.045; // Thickness of each panel segment
    const zRoot = chassisD / 2 - 0.125; // 0.975 -> stowed stack spans [+0.975, -0.975], well inside [-1.1, +1.1]!

    // Aerospace Materials for Solar Wings
    const wingFrameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.2
    });
    const backingMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.8,
      metalness: 0.3
    });
    const hingeMat = new THREE.MeshStandardMaterial({
      color: 0x9aa2b4,
      metalness: 0.92,
      roughness: 0.25
    });
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.98,
      roughness: 0.12
    });
    const flexJumperMat = new THREE.MeshStandardMaterial({
      color: 0xcca033,
      metalness: 0.9,
      roughness: 0.3
    });
    const snubberMat = new THREE.MeshStandardMaterial({
      color: 0x222633,
      roughness: 0.85
    });

    // Helper: Build a high-fidelity solar wing segment mesh
    const buildSegment = (isLeftWing, segIndex) => {
      const segGroup = new THREE.Group();

      // 1. Silicon Photovoltaic Cells (Front face)
      const cellGeo = new THREE.BoxGeometry(segW - 0.04, segH - 0.04, segD);
      const cellMesh = new THREE.Mesh(cellGeo, cellMat);
      segGroup.add(cellMesh);

      // 2. Beveled Gold Frame Perimeter
      const frameGeo = new THREE.BoxGeometry(segW, segH, segD - 0.005);
      const frameMesh = new THREE.Mesh(frameGeo, wingFrameMat);
      segGroup.add(frameMesh);

      // 3. Carbon-composite protective substrate on rear
      const backGeo = new THREE.PlaneGeometry(segW - 0.02, segH - 0.02);
      const backMesh = new THREE.Mesh(backGeo, backingMat);
      backMesh.rotation.y = Math.PI;
      backMesh.position.set(0, 0, -segD / 2 - 0.002);
      segGroup.add(backMesh);

      // 4. Photovoltaic Micro-mesh Cell Grid Lines
      const divRows = 6;
      for (let r = 1; r < divRows; r++) {
        const dy = -segH / 2 + (r * segH) / divRows;
        const divGeo = new THREE.BoxGeometry(segW - 0.06, 0.015, 0.004);
        const divMat = new THREE.MeshBasicMaterial({ color: 0x00d8ff, transparent: true, opacity: 0.5 });
        const divLine = new THREE.Mesh(divGeo, divMat);
        divLine.position.set(0, dy, segD / 2 + 0.003);
        segGroup.add(divLine);
      }
      // Vertical Center Silver Collector Busbar
      const vBusGeo = new THREE.BoxGeometry(0.018, segH - 0.08, 0.004);
      const vBusMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 });
      const vBus = new THREE.Mesh(vBusGeo, vBusMat);
      vBus.position.set(0, 0, segD / 2 + 0.003);
      segGroup.add(vBus);

      // 5. Corner Magnetic Standoff Snubbers (Parallel stack dampers)
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

    // Helper: Precision mechanical hinge barrels at top, center, and bottom
    const createHingeBarrels = (h) => {
      const hingeGroup = new THREE.Group();
      const hingeHeights = [-h * 0.36, 0, h * 0.36];
      hingeHeights.forEach((hy) => {
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

    // Helper: Flexible printed circuit jumper loops bridging hinge lines
    const createFlexJumpers = (h) => {
      const jumperGroup = new THREE.Group();
      [-h * 0.18, h * 0.18].forEach((jy) => {
        const torusGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI);
        const torus = new THREE.Mesh(torusGeo, flexJumperMat);
        torus.rotation.z = Math.PI / 2;
        torus.position.set(0, jy, 0.035);
        jumperGroup.add(torus);
      });
      return jumperGroup;
    };

    // --- BUILD LEFT WING ORIGAMI ASSEMBLY ---
    // Root Hinge (Joint 0): Mounted on left chassis edge (-chassisW / 2, 0, zRoot)
    const leftJoint0 = new THREE.Group();
    leftJoint0.position.set(-chassisW / 2, 0, zRoot);
    satGroup.add(leftJoint0);
    leftJoint0.add(createHingeBarrels(segH));

    // Left Segment 1 (Inner panel)
    const leftSeg1 = buildSegment(true, 1);
    leftSeg1.position.set(-segW / 2, 0, 0);
    leftJoint0.add(leftSeg1);

    // Left Joint 1 (between Segment 1 and Segment 2)
    const leftJoint1 = new THREE.Group();
    leftJoint1.position.set(-segW, 0, 0);
    leftJoint0.add(leftJoint1);
    leftJoint1.add(createHingeBarrels(segH));
    leftJoint1.add(createFlexJumpers(segH));

    // Left Segment 2 (Middle panel)
    const leftSeg2 = buildSegment(true, 2);
    leftSeg2.position.set(-segW / 2, 0, 0);
    leftJoint1.add(leftSeg2);

    // Left Joint 2 (between Segment 2 and Segment 3)
    const leftJoint2 = new THREE.Group();
    leftJoint2.position.set(-segW, 0, 0);
    leftJoint1.add(leftJoint2);
    leftJoint2.add(createHingeBarrels(segH));
    leftJoint2.add(createFlexJumpers(segH));

    // Left Segment 3 (Outer tip panel)
    const leftSeg3 = buildSegment(true, 3);
    leftSeg3.position.set(-segW / 2, 0, 0);
    leftJoint2.add(leftSeg3);

    leftOrigamiRef.current = {
      joint0: leftJoint0,
      joint1: leftJoint1,
      joint2: leftJoint2
    };

    // --- BUILD RIGHT WING ORIGAMI ASSEMBLY ---
    // Root Hinge (Joint 0): Mounted on right chassis edge (+chassisW / 2, 0, zRoot)
    const rightJoint0 = new THREE.Group();
    rightJoint0.position.set(chassisW / 2, 0, zRoot);
    satGroup.add(rightJoint0);
    rightJoint0.add(createHingeBarrels(segH));

    // Right Segment 1 (Inner panel)
    const rightSeg1 = buildSegment(false, 1);
    rightSeg1.position.set(segW / 2, 0, 0);
    rightJoint0.add(rightSeg1);

    // Right Joint 1 (between Segment 1 and Segment 2)
    const rightJoint1 = new THREE.Group();
    rightJoint1.position.set(segW, 0, 0);
    rightJoint0.add(rightJoint1);
    rightJoint1.add(createHingeBarrels(segH));
    rightJoint1.add(createFlexJumpers(segH));

    // Right Segment 2 (Middle panel)
    const rightSeg2 = buildSegment(false, 2);
    rightSeg2.position.set(segW / 2, 0, 0);
    rightJoint1.add(rightSeg2);

    // Right Joint 2 (between Segment 2 and Segment 3)
    const rightJoint2 = new THREE.Group();
    rightJoint2.position.set(segW, 0, 0);
    rightJoint1.add(rightJoint2);
    rightJoint2.add(createHingeBarrels(segH));
    rightJoint2.add(createFlexJumpers(segH));

    // Right Segment 3 (Outer tip panel)
    const rightSeg3 = buildSegment(false, 3);
    rightSeg3.position.set(segW / 2, 0, 0);
    rightJoint2.add(rightSeg3);

    rightOrigamiRef.current = {
      joint0: rightJoint0,
      joint1: rightJoint1,
      joint2: rightJoint2
    };

    // Apply immediate initial posture without animation delay
    const initF = solarPanelsDeployed ? 0.0 : 1.0;
    foldProgressRef.current = initF;

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

    // 9. Payload Aperture Lens (Top Face)
    const lensRingGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.2, 32);
    const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.9, roughness: 0.2 });
    const lensRing = new THREE.Mesh(lensRingGeo, lensRingMat);
    lensRing.position.set(0, chassisH / 2 + 0.1, 0);
    satGroup.add(lensRing);

    const lensGlassGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.22, 32);
    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x003366,
      emissiveIntensity: 0.6
    });
    const lensGlass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
    lensGlass.position.set(0, chassisH / 2 + 0.12, 0);
    satGroup.add(lensGlass);

    // =========================================================================
    // 10. COLD-GAS THRUSTER: ANIMATED ORANGE CLOUD BURST
    // Shoots an expanding, billowing orange cloud of gas puffs downwards
    // that expands in vacuum and dissipates after the burst ends!
    // =========================================================================
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.set(0, -chassisH / 2, 0);
    satGroup.add(nozzleGroup);

    const nozzleGeo = new THREE.ConeGeometry(0.32, 0.5, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222633, metalness: 0.9, roughness: 0.3 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(0, -0.25, 0);
    nozzleGroup.add(nozzle);

    // Warm Orange Flame Core
    const plumeGroup = new THREE.Group();
    nozzleGroup.add(plumeGroup);
    plumeGroupRef.current = plumeGroup;

    const innerCoreGeo = new THREE.ConeGeometry(0.24, 1.2, 16);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    innerCore.rotation.x = Math.PI;
    innerCore.position.set(0, -0.9, 0);
    plumeGroup.add(innerCore);

    const outerPlumeGeo = new THREE.ConeGeometry(0.48, 1.9, 16);
    const outerPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xff5500, // Warm deep orange
      transparent: true,
      opacity: 0
    });
    const outerPlume = new THREE.Mesh(outerPlumeGeo, outerPlumeMat);
    outerPlume.rotation.x = Math.PI;
    outerPlume.position.set(0, -1.2, 0);
    plumeGroup.add(outerPlume);

    // Billowing Orange Gas Cloud Puffs (10 expanding cloud billow spheres)
    const cloudCount = 10;
    const gasClouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const puffGeo = new THREE.SphereGeometry(0.26 + Math.random() * 0.2, 14, 14);
      const puffMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff4400,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0,
        roughness: 0.8
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
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
    gasCloudsRef.current = gasClouds;

    // Orange Thruster Radiance Point Light
    const thrustLight = new THREE.PointLight(0xff6600, 0, 10);
    thrustLight.position.set(0, -0.9, 0);
    nozzleGroup.add(thrustLight);
    thrustLightRef.current = thrustLight;

    // 11. UHF/S-Band Antenna Array
    const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const ant1 = new THREE.Mesh(antGeo, antMat);
    ant1.position.set(-chassisW / 2 + 0.1, chassisH / 2 + 1.2, -chassisD / 2 + 0.1);
    satGroup.add(ant1);

    // Patch antenna on top-side
    const patchGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const patchMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95 });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.position.set(0.6, chassisH / 2 + 0.03, 0.6);
    satGroup.add(patch);

    // 12. STATUS BEACON LED (Green/Cyan/Red at top-right)
    const ledGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const statusLed = new THREE.Mesh(ledGeo, ledMat);
    statusLed.position.set(chassisW / 2 - 0.15, chassisH / 2 + 0.05, chassisD / 2 - 0.15);
    satGroup.add(statusLed);
    statusLedRef.current = statusLed;

    // =========================================================================
    // 13. PROMINENT YELLOW LIGHT FOR HEATER INDICATION (Requested by User)
    // A large, glowing yellow beacon lamp with an animated glowing corona halo
    // and bright point light that bathes the CubeSat in warm yellow light!
    // =========================================================================
    const heaterGroup = new THREE.Group();
    heaterGroup.position.set(0, chassisH * 0.35, chassisD / 2 + 0.05);
    satGroup.add(heaterGroup);

    // Heavy thermal housing ring
    const heaterRingGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.14, 24);
    const heaterRingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const heaterRing = new THREE.Mesh(heaterRingGeo, heaterRingMat);
    heaterRing.rotation.x = Math.PI / 2;
    heaterGroup.add(heaterRing);

    // Large glowing yellow bulb lens
    const heaterBulbGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const heaterBulbMat = new THREE.MeshStandardMaterial({
      color: 0x332800,
      emissive: 0x221a00,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.8
    });
    const heaterBulb = new THREE.Mesh(heaterBulbGeo, heaterBulbMat);
    heaterBulb.position.set(0, 0, 0.08);
    heaterGroup.add(heaterBulb);
    heaterBulbRef.current = heaterBulb;

    // Glowing yellow aura corona halo
    const coronaGeo = new THREE.SphereGeometry(0.44, 20, 20);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0,
      wireframe: false
    });
    const heaterCorona = new THREE.Mesh(coronaGeo, coronaMat);
    heaterCorona.position.set(0, 0, 0.08);
    heaterGroup.add(heaterCorona);
    heaterCoronaRef.current = heaterCorona;

    // Bright yellow thermal PointLight
    const heaterLight = new THREE.PointLight(0xffea00, 0, 12);
    heaterLight.position.set(0, 0, 0.35);
    heaterGroup.add(heaterLight);
    heaterLightRef.current = heaterLight;

    // Thermal heating element strips along the side rails (glow yellow when active)
    const strips = [];
    [-chassisW / 2 + 0.02, chassisW / 2 - 0.02].forEach((sx) => {
      const stripGeo = new THREE.BoxGeometry(0.04, chassisH * 0.7, 0.03);
      const stripMat = new THREE.MeshStandardMaterial({
        color: 0x443300,
        emissive: 0x000000,
        metalness: 0.8
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(sx, 0, chassisD / 2 + 0.02);
      satGroup.add(strip);
      strips.push(strip);
    });
    heaterStripsRef.current = strips;

    // =========================================================================
    // 14. ANIMATION LOOP
    // =========================================================================
    let lastTime = performance.now();
    const animate = (timestamp) => {
      animIdRef.current = requestAnimationFrame(animate);
      const now = timestamp || performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = now * 0.001;

      controls.update();

      // 1. Smooth Origami Zig-Zag Accordion Solar Wings Fold / Unfold Animation (Delta-time based)
      const targetF = solarPanelsDeployedRef.current ? 0.0 : 1.0;
      // Duration requirement: 8-10 seconds.
      // Speed = 1.0 / 9.0s (~0.1111/s) ensures full fold/unfold travel takes exactly 9.0 seconds.
      const speed = 1.0 / 9.0;
      const diff = targetF - foldProgressRef.current;
      if (Math.abs(diff) < 0.002) {
        foldProgressRef.current = targetF;
      } else {
        foldProgressRef.current += Math.sign(diff) * Math.min(Math.abs(diff), delta * speed);
      }
      const f = foldProgressRef.current;

      // Update real-time 8-10s deployment/stow HUD indicator dynamically
      if (panelHudSpanRef.current) {
        const remainingDiff = Math.abs(targetF - f);
        if (remainingDiff >= 0.002) {
          if (targetF === 0.0) {
            const pct = Math.min(99, Math.max(1, Math.round((1.0 - f) * 100)));
            panelHudSpanRef.current.innerText = `DEPLOYING (${pct}%)`;
          } else {
            const pct = Math.min(99, Math.max(1, Math.round(f * 100)));
            panelHudSpanRef.current.innerText = `STOWING (${pct}%)`;
          }
        } else {
          panelHudSpanRef.current.innerText = targetF === 0.0 ? 'DEPLOYED (COPLANAR)' : 'STOWED (ORIGAMI Z-FOLD)';
        }
      }

      const left = leftOrigamiRef.current;
      if (left.joint0 && left.joint1 && left.joint2) {
        // Joint 0: Root hinge rotates 0° -> -90° backward along left side wall towards -Z
        left.joint0.rotation.y = -f * (Math.PI / 2);

        // Joint 1: Alternates in origami zig-zag by 0° -> +180°
        left.joint1.rotation.y = f * Math.PI;
        left.joint1.position.z = f * 0.065; // Layer 2 thickness standoff

        // Joint 2: Alternates in opposite direction by 0° -> -180°
        left.joint2.rotation.y = -f * Math.PI;
        left.joint2.position.z = -f * 0.065; // Layer 3 thickness standoff
      }

      const right = rightOrigamiRef.current;
      if (right.joint0 && right.joint1 && right.joint2) {
        // Joint 0: Root hinge rotates 0° -> +90° backward along right side wall towards -Z
        right.joint0.rotation.y = f * (Math.PI / 2);

        // Joint 1: Symmetrical origami zig-zag 0° -> -180°
        right.joint1.rotation.y = -f * Math.PI;
        right.joint1.position.z = f * 0.065; // Layer 2 thickness standoff

        // Joint 2: Symmetrical accordion 0° -> +180°
        right.joint2.rotation.y = f * Math.PI;
        right.joint2.position.z = -f * 0.065; // Layer 3 thickness standoff
      }

      // 2. Animated Orange Cloud Thruster Burst
      const isFiring = isThrustingRef.current || statusRef.current === 'THRUSTER_BURN';
      if (plumeGroupRef.current) {
        const core1 = plumeGroupRef.current.children[0];
        const core2 = plumeGroupRef.current.children[1];

        if (isFiring) {
          const plumePulse = 0.85 + Math.sin(elapsed * 35) * 0.15;
          if (core1) core1.material.opacity = plumePulse;
          if (core2) core2.material.opacity = plumePulse * 0.9;

          if (thrustLightRef.current) {
            thrustLightRef.current.intensity = 3.5 + Math.sin(elapsed * 40) * 1.0;
          }

          // Animate expanding billowing orange clouds
          gasCloudsRef.current.forEach((puff) => {
            puff.userData.life += puff.userData.speed;
            if (puff.userData.life > 1.0) {
              puff.userData.life = 0;
              puff.position.set(0, -0.6, 0);
              puff.scale.set(1, 1, 1);
            }
            const t = puff.userData.life;
            puff.position.y = -0.6 - t * 2.5;
            puff.position.x += puff.userData.driftX;
            puff.position.z += puff.userData.driftZ;

            const curScale = 1 + t * puff.userData.maxScale;
            puff.scale.set(curScale, curScale * 1.3, curScale);

            // Billowing curve: rapid rise, smooth fade out in vacuum
            puff.material.opacity = Math.sin(t * Math.PI) * 0.85;
          });
        } else {
          if (core1) core1.material.opacity = THREE.MathUtils.lerp(core1.material.opacity, 0, 0.15);
          if (core2) core2.material.opacity = THREE.MathUtils.lerp(core2.material.opacity, 0, 0.15);
          if (thrustLightRef.current) {
            thrustLightRef.current.intensity = THREE.MathUtils.lerp(thrustLightRef.current.intensity, 0, 0.15);
          }
          gasCloudsRef.current.forEach((puff) => {
            puff.material.opacity = THREE.MathUtils.lerp(puff.material.opacity, 0, 0.15);
          });
        }
      }

      // 3. Bright Yellow Light for Heater Indication
      if (heaterBulbRef.current && heaterLightRef.current && heaterCoronaRef.current) {
        if (heaterActiveRef.current) {
          // Vivid pulsing yellow light
          const pulse = 0.85 + Math.sin(elapsed * 6) * 0.15;
          heaterBulbRef.current.material.color.setHex(0xffea00);
          heaterBulbRef.current.material.emissive.setHex(0xffcc00);
          heaterBulbRef.current.material.emissiveIntensity = 1.6 * pulse;

          heaterCoronaRef.current.material.opacity = 0.45 * pulse;
          heaterCoronaRef.current.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.1);

          heaterLightRef.current.intensity = 4.2 * pulse;

          // Warm glow on thermal strips
          heaterStripsRef.current.forEach((s) => {
            s.material.emissive.setHex(0xffaa00);
            s.material.emissiveIntensity = 0.9 * pulse;
          });
        } else {
          // Off state: dark amber/unlit
          heaterBulbRef.current.material.color.setHex(0x332800);
          heaterBulbRef.current.material.emissive.setHex(0x110c00);
          heaterBulbRef.current.material.emissiveIntensity = 0;

          heaterCoronaRef.current.material.opacity = THREE.MathUtils.lerp(heaterCoronaRef.current.material.opacity, 0, 0.1);
          heaterLightRef.current.intensity = THREE.MathUtils.lerp(heaterLightRef.current.intensity, 0, 0.1);

          heaterStripsRef.current.forEach((s) => {
            s.material.emissive.setHex(0x000000);
            s.material.emissiveIntensity = 0;
          });
        }
      }

      // 4. Status Beacon LED
      if (statusLedRef.current) {
        const st = statusRef.current;
        const blinkRate = st === 'SAFE_MODE' ? 2 : st === 'SCIENCE_ACQUISITION' ? 8 : 4;
        const isOn = Math.sin(elapsed * blinkRate) > 0;
        const color =
          st === 'SAFE_MODE'
            ? 0xff2a2a
            : st === 'SCIENCE_ACQUISITION'
            ? 0x00f0ff
            : 0x00ff66;
        statusLedRef.current.material.color.setHex(isOn ? color : 0x112211);
      }

      // Earth slow background rotation
      earth.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
    };
  }, [formFactor]);

  // Update controls autorotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update attitude smoothly
  useEffect(() => {
    if (satGroupRef.current) {
      const rollRad = THREE.MathUtils.degToRad(attitude.roll || 0);
      const pitchRad = THREE.MathUtils.degToRad(attitude.pitch || 0);
      const yawRad = THREE.MathUtils.degToRad(attitude.yaw || 0);

      satGroupRef.current.rotation.x = pitchRad;
      satGroupRef.current.rotation.y = yawRad;
      satGroupRef.current.rotation.z = rollRad;
    }
  }, [attitude]);

  return (
    <div className="w-full h-full relative select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* OPTIONAL EMBEDDED HUD BADGES (Disabled when used inside CubeSatSimulator to avoid UI collision) */}
      {showEmbeddedHud && (
        <>
          {/* TOP-LEFT HUD BADGE */}
          <div className="absolute top-3 left-3 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg px-3 py-2 text-[11px] font-mono text-gray-300 flex items-center space-x-2.5 shadow-xl z-10">
            <div className={`w-2 h-2 rounded-full ${
              status === 'SAFE_MODE' ? 'bg-[#FF2A2A]' : 'bg-[#00F0FF]'
            } animate-ping`} />
            <span className="font-bold text-white tracking-wide">{formFactor} BUS CLOSE-UP</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">PANELS: </span>
            <span className={solarPanelsDeployed ? 'text-[#00FF66] font-semibold flex items-center' : 'text-[#FFB000] font-semibold flex items-center'}>
              <Zap size={11} className="mr-1" />
              <span ref={panelHudSpanRef}>
                {solarPanelsDeployed ? 'DEPLOYED (COPLANAR)' : 'STOWED (ORIGAMI Z-FOLD)'}
              </span>
            </span>
          </div>

          {/* TOP-RIGHT SPEED & HEATER STATUS HUD */}
          <div className="absolute top-3 right-3 flex items-center space-x-2.5 z-10">
            <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg border font-mono text-xs backdrop-blur-md shadow-xl transition-all ${
              heaterActive
                ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFEA00] shadow-[0_0_20px_rgba(255,234,0,0.4)]'
                : 'bg-[#0A0F1F]/90 border-gray-800 text-gray-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                heaterActive ? 'bg-[#FFEA00] animate-pulse shadow-[0_0_12px_#ffea00]' : 'bg-gray-700'
              }`} />
              <Thermometer size={14} className={heaterActive ? 'text-[#FFEA00]' : 'text-gray-500'} />
              <span className="font-bold tracking-wide">
                {heaterActive ? 'HEATER: ON (YELLOW BEACON ACTIVE)' : 'HEATER: OFF'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg px-3.5 py-2 font-mono shadow-xl">
              <Gauge size={16} className="text-[#00F0FF]" />
              <div>
                <div className="text-[9px] text-gray-400 tracking-wider">ORBITAL SPEED</div>
                <div className="text-white font-bold text-sm flex items-baseline space-x-1">
                  <span className="text-[#00F0FF] text-base">{speed}</span>
                  <span className="text-[10px] text-gray-400">km/s</span>
                  <span className="text-[10px] text-gray-500 ml-1">({(speed * 3600).toFixed(0)} km/h)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* THRUSTER CLOUD BURST ACTIVE POPUP BANNER */}
      {(isThrusting || status === 'THRUSTER_BURN') && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#FF6600]/25 border-2 border-[#FF6600] backdrop-blur-md text-[#FFAA00] px-5 py-2 rounded-full font-mono text-xs font-bold flex items-center space-x-2.5 shadow-[0_0_30px_rgba(255,102,0,0.5)] animate-bounce z-10">
          <Flame size={16} className="text-[#FF6600] animate-pulse" />
          <span>COLD-GAS CLOUD BURST FIRING (ORANGE GAS CLOUDS ACTIVE)</span>
        </div>
      )}
    </div>
  );
}
