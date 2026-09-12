import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function CubeSatCanvas({ 
  formFactor = '1U', 
  mountedComponents = {}, 
  isAssembling = false,
  isValidating = false,
  autoRotate = false
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const frameGroupRef = useRef(null);
  const componentsGroupRef = useRef(null);
  const scanLineRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Height multiplier for 1U, 2U, 3U
  const heightMultiplier = formFactor === '3U' ? 3.0 : formFactor === '2U' ? 2.0 : 1.0;
  const chassisHeight = 2.4 * heightMultiplier;
  const chassisWidth = 2.4;
  const chassisDepth = 2.4;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(6, 4, 7);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = 2;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x101b33, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(8, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 2.0);
    cyanRimLight.position.set(-8, -4, -6);
    scene.add(cyanRimLight);

    const goldAccentLight = new THREE.PointLight(0xffb000, 1.2, 10);
    goldAccentLight.position.set(0, 4, 0);
    scene.add(goldAccentLight);

    // 6. Holographic floor grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x00f0ff, 0x15233e);
    gridHelper.position.y = -chassisHeight / 2 - 1.2;
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 7. Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const frameGroup = new THREE.Group();
    mainGroup.add(frameGroup);
    frameGroupRef.current = frameGroup;

    const componentsGroup = new THREE.Group();
    mainGroup.add(componentsGroup);
    componentsGroupRef.current = componentsGroup;

    // 8. Validation scan laser
    const scanGeo = new THREE.RingGeometry(0.1, 2.8, 32);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.rotation.x = Math.PI / 2;
    scene.add(scanLine);
    scanLineRef.current = scanLine;

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    // Tab visibility handling to throttle GPU when inactive
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Animation Loop
    const startTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (!isVisible) return; // Skip render when tab is in background

      const elapsedTime = (performance.now() - startTime) / 1000;

      controls.update();

      // Scan line animation during validation
      if (scanLineRef.current) {
        if (isValidating) {
          scanLineRef.current.material.opacity = 0.6 + Math.sin(elapsedTime * 8) * 0.3;
          scanLineRef.current.position.y = Math.sin(elapsedTime * 3) * (chassisHeight / 2);
        } else {
          scanLineRef.current.material.opacity = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animFrameIdRef.current);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  // Update OrbitControls autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Re-build Chassis Frame when formFactor changes
  useEffect(() => {
    const frameGroup = frameGroupRef.current;
    if (!frameGroup) return;

    // Clear old frame
    while (frameGroup.children.length > 0) {
      const obj = frameGroup.children[0];
      frameGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    const h = chassisHeight;
    const w = chassisWidth;
    const d = chassisDepth;
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

    // Internal Skeletonized Stacking Ribs for 2U / 3U
    if (formFactor === '2U' || formFactor === '3U') {
      const ribCount = formFactor === '3U' ? 2 : 1;
      for (let i = 1; i <= ribCount; i++) {
        const yPos = -h / 2 + (h / (ribCount + 1)) * i;
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
      }
    }

    // Ghost bounding wireframe
    const ghostBoxGeo = new THREE.BoxGeometry(w, h, d);
    const ghostBox = new THREE.Mesh(ghostBoxGeo, glowWireMaterial);
    frameGroup.add(ghostBox);

  }, [formFactor, chassisHeight]);

  // Re-build Mounted Component Meshes
  useEffect(() => {
    const compGroup = componentsGroupRef.current;
    if (!compGroup) return;

    // Clear old components
    while (compGroup.children.length > 0) {
      const obj = compGroup.children[0];
      compGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    const w = chassisWidth;
    const h = chassisHeight;
    const d = chassisDepth;

    let internalYCursor = -h / 2 + 0.35;
    let solarPanelFaceIndex = 0;

    // Materials
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0c4a2c, metalness: 0.3, roughness: 0.5 }); // Dark green solder mask
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 }); // IC package
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const solarCellMat = new THREE.MeshStandardMaterial({ color: 0x102a5c, metalness: 0.7, roughness: 0.15 }); // Triple junction blue
    const batteryCellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const metallicMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const cameraLensMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.95, roughness: 0.05 });
    const brassFlywheelMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.3 });

    Object.entries(mountedComponents).forEach(([compId, count]) => {
      if (!count || count <= 0) return;

      for (let i = 0; i < count; i++) {
        const itemGroup = new THREE.Group();

        switch (compId) {
          case 'obc_core': {
            // Stacked PC104 format PCB board
            const pcbGeo = new THREE.BoxGeometry(w - 0.3, 0.08, d - 0.3);
            const pcb = new THREE.Mesh(pcbGeo, pcbMat);
            itemGroup.add(pcb);

            // Microcontroller IC
            const mcuGeo = new THREE.BoxGeometry(0.5, 0.06, 0.5);
            const mcu = new THREE.Mesh(mcuGeo, chipMat);
            mcu.position.set(0, 0.06, 0);
            itemGroup.add(mcu);

            // Glowing status LED
            const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(0.7, 0.06, 0.7);
            itemGroup.add(led);

            // Placement inside chassis
            const targetY = internalYCursor;
            internalYCursor += 0.4;
            itemGroup.position.set(0, targetY + (isAssembling ? 1.5 : 0), 0);
            break;
          }

          case 'battery_pack': {
            // Li-Ion Cell Block
            const packGeo = new THREE.BoxGeometry(w - 0.4, 0.45, d - 0.5);
            const pack = new THREE.Mesh(packGeo, batteryCellMat);
            itemGroup.add(pack);

            // Warning label
            const labelGeo = new THREE.PlaneGeometry(0.6, 0.2);
            const labelMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
            const label = new THREE.Mesh(labelGeo, labelMat);
            label.rotation.x = Math.PI / 2;
            label.position.set(0, 0.23, 0);
            itemGroup.add(label);

            const targetY = internalYCursor;
            internalYCursor += 0.65;
            itemGroup.position.set(0, targetY + (isAssembling ? -1.8 : 0), 0);
            break;
          }

          case 'reaction_wheel': {
            // ADCS Flywheel cylinder mounted in gimbal
            const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 24);
            const wheel = new THREE.Mesh(wheelGeo, brassFlywheelMat);
            wheel.rotation.z = Math.PI / 2;
            itemGroup.add(wheel);

            const bracketGeo = new THREE.BoxGeometry(0.1, 0.6, 0.6);
            const bracket = new THREE.Mesh(bracketGeo, metallicMat);
            itemGroup.add(bracket);

            const targetY = internalYCursor;
            internalYCursor += 0.5;
            itemGroup.position.set(0.3, targetY, 0);
            break;
          }

          case 'sband_transmitter':
          case 'uhf_radio': {
            // RF Shielded Box
            const rfBoxGeo = new THREE.BoxGeometry(0.8, 0.3, 0.7);
            const rfBox = new THREE.Mesh(rfBoxGeo, metallicMat);
            itemGroup.add(rfBox);

            // Gold SMA Connector
            const smaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
            const sma = new THREE.Mesh(smaGeo, goldPinMat);
            sma.position.set(0.3, 0.2, 0);
            itemGroup.add(sma);

            const targetY = internalYCursor;
            internalYCursor += 0.45;
            itemGroup.position.set(-0.2, targetY, 0.1);
            break;
          }

          case 'solar_panel_1u': {
            // 1U Solar Panel mounted to exterior faces
            const panelW = w - 0.25;
            const panelH = 2.0; // 1U height
            const panelGeo = new THREE.BoxGeometry(panelW, panelH, 0.04);
            const panelMesh = new THREE.Mesh(panelGeo, solarCellMat);
            itemGroup.add(panelMesh);

            // Busbars
            const busbarGeo = new THREE.PlaneGeometry(panelW - 0.1, 0.02);
            const busbarMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
            const bb1 = new THREE.Mesh(busbarGeo, busbarMat);
            bb1.position.set(0, 0.4, 0.025);
            itemGroup.add(bb1);
            const bb2 = new THREE.Mesh(busbarGeo, busbarMat);
            bb2.position.set(0, -0.4, 0.025);
            itemGroup.add(bb2);

            // Cycle faces: +Z, -Z, +X, -X, +Z (2nd unit for 2U/3U), -Z
            const face = solarPanelFaceIndex % 4;
            const yOffset = solarPanelFaceIndex >= 4 ? 1.0 : -0.2;
            solarPanelFaceIndex++;

            if (face === 0) { // Front (+Z)
              itemGroup.position.set(0, yOffset, d / 2 + 0.03 + (isAssembling ? 1.5 : 0));
            } else if (face === 1) { // Back (-Z)
              itemGroup.position.set(0, yOffset, -d / 2 - 0.03 - (isAssembling ? 1.5 : 0));
              itemGroup.rotation.y = Math.PI;
            } else if (face === 2) { // Right (+X)
              itemGroup.position.set(w / 2 + 0.03 + (isAssembling ? 1.5 : 0), yOffset, 0);
              itemGroup.rotation.y = Math.PI / 2;
            } else { // Left (-X)
              itemGroup.position.set(-w / 2 - 0.03 - (isAssembling ? 1.5 : 0), yOffset, 0);
              itemGroup.rotation.y = -Math.PI / 2;
            }
            break;
          }

          case 'antenna_deployable': {
            // Deployable whip antenna from top corner
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

          case 'camera_visible': {
            // Optical Telescope Tube facing Nadir / front
            const barrelGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.5, 24);
            const barrel = new THREE.Mesh(barrelGeo, metallicMat);
            barrel.rotation.x = Math.PI / 2;
            itemGroup.add(barrel);

            const lensGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24);
            const lens = new THREE.Mesh(lensGeo, cameraLensMat);
            lens.rotation.x = Math.PI / 2;
            lens.position.set(0, 0, 0.25);
            itemGroup.add(lens);

            itemGroup.position.set(0, 0, d / 2 + 0.2 + (isAssembling ? 2.0 : 0));
            break;
          }

          case 'gps_receiver':
          case 'temp_sensor': {
            // Sensor patch
            const patchGeo = new THREE.BoxGeometry(0.25, 0.05, 0.25);
            const patch = new THREE.Mesh(patchGeo, metallicMat);
            itemGroup.add(patch);

            const pinGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const pin = new THREE.Mesh(pinGeo, goldPinMat);
            pin.position.set(0, 0.04, 0);
            itemGroup.add(pin);

            itemGroup.position.set(
              (Math.random() * 0.8 - 0.4),
              h / 2 + 0.03 + (isAssembling ? 1.0 : 0),
              (Math.random() * 0.8 - 0.4)
            );
            break;
          }

          default:
            break;
        }

        compGroup.add(itemGroup);
      }
    });

  }, [mountedComponents, formFactor, isAssembling, chassisHeight]);

  const totalMounted = Object.values(mountedComponents).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-full relative select-none">
      {/* 3D Canvas Mounting DOM */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Empty State Overlay */}
      {totalMounted === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-[#050810]/70 border border-[#00F0FF]/20 backdrop-blur-sm px-6 py-4 rounded-lg text-center shadow-2xl">
            <h3 className="font-mono text-sm tracking-widest text-[#00F0FF] uppercase mb-1">
              EMPTY DESIGN SPACE
            </h3>
            <p className="font-mono text-xs text-gray-400">
              Add components from the library to begin building your CubeSat.
            </p>
          </div>
        </div>
      )}

      {/* Viewport Overlay Controls Header */}
      <div className="absolute top-4 left-4 flex items-center space-x-3 pointer-events-auto">
        <div className="bg-[#0A0F1F]/90 border border-gray-800 backdrop-blur-md px-3 py-1.5 rounded flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></div>
          <span className="font-mono text-[11px] tracking-widest text-white uppercase font-bold">3D VIEWPORT</span>
        </div>
        <div className="bg-[#0A0F1F]/90 border border-gray-800 px-2.5 py-1.5 rounded font-mono text-[11px] text-[#00F0FF] font-bold">
          {formFactor}
        </div>
      </div>

      {/* Assembly / Validation Toast */}
      {isAssembling && (
        <div className="absolute top-4 right-4 bg-[#00F0FF]/10 border border-[#00F0FF] px-4 py-2 rounded font-mono text-xs text-[#00F0FF] tracking-wider animate-pulse flex items-center space-x-2">
          <span>⚙ ASSEMBLE EXPLODED VIEW</span>
        </div>
      )}
      {isValidating && (
        <div className="absolute top-4 right-4 bg-[#10B981]/10 border border-[#10B981] px-4 py-2 rounded font-mono text-xs text-[#10B981] tracking-wider animate-pulse flex items-center space-x-2">
          <span>⚡ FEASIBILITY TELEMETRY SCANNING...</span>
        </div>
      )}

      {/* Bottom Controls Guidance Footer */}
      <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] font-mono text-gray-500 pointer-events-none">
        <div>
          <span>✛ Drag to rotate</span>
          <span className="mx-2">•</span>
          <span>Scroll to zoom</span>
          <span className="mx-2">•</span>
          <span>Right-click to pan</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${totalMounted > 0 ? 'bg-[#00FF66]' : 'bg-gray-600'}`}></div>
          <span className="text-gray-400">{totalMounted} parts mounted</span>
        </div>
      </div>
    </div>
  );
}
