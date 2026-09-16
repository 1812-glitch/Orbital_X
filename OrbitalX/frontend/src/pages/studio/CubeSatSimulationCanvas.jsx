import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function CubeSatSimulationCanvas({
  formFactor = '3U',
  solarPanelsDeployed = true,
  isThrusting = false,
  status = 'NOMINAL',
  attitude = { roll: 0, pitch: 0, yaw: 0 },
  autoRotate = false
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const satGroupRef = useRef(null);
  const leftWingRef = useRef(null);
  const rightWingRef = useRef(null);
  const plumeRef = useRef(null);
  const statusLedRef = useRef(null);
  const animIdRef = useRef(null);

  // Height multiplier based on form factor
  const is6U = formFactor === '6U';
  const heightMultiplier = is6U ? 3.0 : formFactor === '3U' ? 3.0 : 1.0;
  const chassisW = is6U ? 4.2 : 2.2;
  const chassisH = 2.2 * heightMultiplier;
  const chassisD = 2.2;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(7.5, 4.5, 8.5);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(12, 16, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Earth Albedo bounce light (blueish from below)
    const earthAlbedo = new THREE.DirectionalLight(0x00a8ff, 0.65);
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
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x001533,
      emissiveIntensity: 0.3
    });
    const frontPanelGeo = new THREE.BoxGeometry(chassisW * 0.88, chassisH * 0.92, 0.03);
    const frontPanel = new THREE.Mesh(frontPanelGeo, cellMat);
    frontPanel.position.set(0, 0, chassisD / 2 + 0.02);
    satGroup.add(frontPanel);

    const backPanel = new THREE.Mesh(frontPanelGeo, cellMat);
    backPanel.position.set(0, 0, -chassisD / 2 - 0.02);
    satGroup.add(backPanel);

    // Solar Cell Grid Lines
    const gridHelper = new THREE.GridHelper(chassisH * 0.88, 12, 0x00f0ff, 0x003366);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(0, 0, chassisD / 2 + 0.04);
    satGroup.add(gridHelper);

    // 8. Deployable Solar Wings (Left and Right)
    const wingW = chassisH * 0.75;
    const wingH = chassisH * 0.85;
    const wingD = 0.06;

    // Left Wing Assembly Pivot
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-chassisW / 2, 0, 0);
    satGroup.add(leftPivot);

    const leftWingGeo = new THREE.BoxGeometry(wingW, wingH, wingD);
    const leftWing = new THREE.Mesh(leftWingGeo, cellMat);
    leftWing.position.set(-wingW / 2, 0, 0);
    leftPivot.add(leftWing);

    // Left wing gold frame
    const leftFrameGeo = new THREE.BoxGeometry(wingW + 0.04, wingH + 0.04, 0.04);
    const leftFrame = new THREE.Mesh(leftFrameGeo, railMat);
    leftFrame.position.set(-wingW / 2, 0, -0.01);
    leftPivot.add(leftFrame);
    leftWingRef.current = leftPivot;

    // Right Wing Assembly Pivot
    const rightPivot = new THREE.Group();
    rightPivot.position.set(chassisW / 2, 0, 0);
    satGroup.add(rightPivot);

    const rightWingGeo = new THREE.BoxGeometry(wingW, wingH, wingD);
    const rightWing = new THREE.Mesh(rightWingGeo, cellMat);
    rightWing.position.set(wingW / 2, 0, 0);
    rightPivot.add(rightWing);

    const rightFrame = new THREE.Mesh(leftFrameGeo, railMat);
    rightFrame.position.set(wingW / 2, 0, -0.01);
    rightPivot.add(rightFrame);
    rightWingRef.current = rightPivot;

    // Set initial wing rotation (0 = deployed, PI/2 = folded)
    leftPivot.rotation.y = solarPanelsDeployed ? 0 : Math.PI / 2;
    rightPivot.rotation.y = solarPanelsDeployed ? 0 : -Math.PI / 2;

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

    // 10. Cold-Gas Thruster Nozzle & Plume (Bottom Face)
    const nozzleGeo = new THREE.ConeGeometry(0.32, 0.5, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222633, metalness: 0.9, roughness: 0.3 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(0, -chassisH / 2 - 0.25, 0);
    satGroup.add(nozzle);

    // Thruster exhaust plume (cone with glowing gradient material)
    const plumeGeo = new THREE.ConeGeometry(0.45, 1.8, 16);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      wireframe: false
    });
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.rotation.x = Math.PI;
    plume.position.set(0, -chassisH / 2 - 1.2, 0);
    satGroup.add(plume);
    plumeRef.current = plume;

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

    // 12. Status Beacon LED
    const ledGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const statusLed = new THREE.Mesh(ledGeo, ledMat);
    statusLed.position.set(chassisW / 2 - 0.15, chassisH / 2 + 0.05, chassisD / 2 - 0.15);
    satGroup.add(statusLed);
    statusLedRef.current = statusLed;

    // 13. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Controls update
      controls.update();

      // Smooth Solar Wings deployment animation
      if (leftWingRef.current && rightWingRef.current) {
        const targetAngle = solarPanelsDeployed ? 0 : Math.PI / 2;
        leftWingRef.current.rotation.y = THREE.MathUtils.lerp(
          leftWingRef.current.rotation.y,
          targetAngle,
          0.05
        );
        rightWingRef.current.rotation.y = THREE.MathUtils.lerp(
          rightWingRef.current.rotation.y,
          -targetAngle,
          0.05
        );
      }

      // Thruster Plume Animation
      if (plumeRef.current) {
        if (isThrusting || status === 'THRUSTER_BURN') {
          plumeRef.current.material.opacity = 0.75 + Math.sin(elapsed * 25) * 0.25;
          plumeRef.current.scale.set(
            1 + Math.sin(elapsed * 30) * 0.15,
            1 + Math.cos(elapsed * 20) * 0.25,
            1 + Math.sin(elapsed * 30) * 0.15
          );
        } else {
          plumeRef.current.material.opacity = THREE.MathUtils.lerp(
            plumeRef.current.material.opacity,
            0,
            0.1
          );
        }
      }

      // Status LED Blinking
      if (statusLedRef.current) {
        const blinkRate = status === 'SAFE_MODE' ? 2 : status === 'SCIENCE_ACQUISITION' ? 8 : 4;
        const isOn = Math.sin(elapsed * blinkRate) > 0;
        const color =
          status === 'SAFE_MODE'
            ? 0xff2a2a
            : status === 'SCIENCE_ACQUISITION'
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
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* HUD 3D Overlay Badge */}
      <div className="absolute top-3 left-3 bg-[#0A0F1F]/80 backdrop-blur-md border border-gray-800 rounded px-2.5 py-1 text-[10px] font-mono text-gray-400 flex items-center space-x-2">
        <div className={`w-1.5 h-1.5 rounded-full ${
          status === 'SAFE_MODE' ? 'bg-[#FF2A2A]' : 'bg-[#00F0FF]'
        } animate-ping`} />
        <span>3D SIMULATION VIEWPORT ({formFactor})</span>
        <span>•</span>
        <span className="text-white">DRAG TO ORBIT / SCROLL TO ZOOM</span>
      </div>
    </div>
  );
}
