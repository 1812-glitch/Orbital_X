import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildSimSolarWings } from './utils/buildSimSolarWings';
import { buildSimPropulsionAndThermal } from './utils/buildSimPropulsionAndThermal';
import SimCanvasOverlays from './components/SimCanvasOverlays';

function CubeSatSimulationCanvas({
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

  // Dynamic state refs for 60 FPS animation loop
  const solarPanelsDeployedRef = useRef(solarPanelsDeployed);
  solarPanelsDeployedRef.current = solarPanelsDeployed;

  const isThrustingRef = useRef(isThrusting);
  isThrustingRef.current = isThrusting;

  const statusRef = useRef(status);
  statusRef.current = status;

  const heaterActiveRef = useRef(heaterActive);
  heaterActiveRef.current = heaterActive;

  // Form factor bus dimensions (1U, 2U, 3U, 6U, 12U, 16U)
  const is16U = formFactor === '16U';
  const is12U = formFactor === '12U';
  const is6U = formFactor === '6U';
  const is2U = formFactor === '2U';
  const is1U = formFactor === '1U';

  const chassisW = (is16U || is12U || is6U) ? 4.2 : 2.2;
  const chassisH = is16U ? 8.8 : (is12U || is6U || formFactor === '3U') ? 6.6 : is2U ? 4.4 : 2.2;
  const chassisD = (is16U || is12U) ? 4.2 : 2.2;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera with dynamic scale for up to 16U
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 120);
    const [camX, camY, camZ] = is16U ? [12.5, 6.5, 16.0] : is12U ? [10.5, 5.5, 13.5] : is6U ? [8.5, 4.5, 11.0] : is2U ? [6.2, 3.5, 8.0] : is1U ? [5.5, 3.2, 7.0] : [7.2, 4.0, 9.2];
    camera.position.set(camX, camY, camZ);

    // 3. Renderer (High performance, anti-aliased)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.9);
    sunLight.position.set(12, 16, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const earthAlbedo = new THREE.DirectionalLight(0x00a8ff, 0.7);
    earthAlbedo.position.set(-6, -10, -4);
    scene.add(earthAlbedo);

    // 6. Distant Earth & Starfield
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(35, 64, 32),
      new THREE.MeshStandardMaterial({ color: 0x082545, roughness: 0.7, metalness: 0.1, emissive: 0x020d1c, emissiveIntensity: 0.4 })
    );
    earth.position.set(0, -42, 0);
    scene.add(earth);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(35.4, 64, 32),
      new THREE.MeshBasicMaterial({ color: 0x00d0ff, transparent: true, opacity: 0.15, wireframe: true })
    );
    atmosphere.position.set(0, -42, 0);
    scene.add(atmosphere);

    const starPositions = new Float32Array(600 * 3);
    for (let i = 0; i < 600 * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x88bbff, size: 0.15, transparent: true, opacity: 0.8 })));

    // 7. Master CubeSat Bus Body & Chassis Rails
    const satGroup = new THREE.Group();
    satGroupRef.current = satGroup;
    scene.add(satGroup);

    const busMesh = new THREE.Mesh(
      new THREE.BoxGeometry(chassisW, chassisH, chassisD),
      new THREE.MeshStandardMaterial({ color: 0x141b2d, roughness: 0.35, metalness: 0.85 })
    );
    busMesh.castShadow = true;
    busMesh.receiveShadow = true;
    satGroup.add(busMesh);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xcca033, metalness: 0.9, roughness: 0.3 });
    [[-chassisW / 2, -chassisD / 2], [chassisW / 2, -chassisD / 2], [-chassisW / 2, chassisD / 2], [chassisW / 2, chassisD / 2]].forEach(([rx, rz]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, chassisH + 0.05, 0.08), railMat);
      rail.position.set(rx, 0, rz);
      satGroup.add(rail);
    });

    // Body Solar Cell Panels (front/back)
    const cellMat = new THREE.MeshStandardMaterial({ color: 0x051336, roughness: 0.18, metalness: 0.92, emissive: 0x001533, emissiveIntensity: 0.4 });
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.88, chassisH * 0.92, 0.03), cellMat);
    frontPanel.position.set(0, 0, chassisD / 2 + 0.02);
    satGroup.add(frontPanel);

    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(chassisW * 0.88, chassisH * 0.92, 0.03), cellMat);
    backPanel.position.set(0, 0, -chassisD / 2 - 0.02);
    satGroup.add(backPanel);

    // Subtle front face divider lines
    const cellRows = is6U ? 6 : 4;
    for (let i = 1; i < cellRows; i++) {
      const lineY = -chassisH * 0.44 + (i * (chassisH * 0.88) / cellRows);
      const divLine = new THREE.Mesh(
        new THREE.BoxGeometry(chassisW * 0.82, 0.02, 0.005),
        new THREE.MeshBasicMaterial({ color: 0x00d8ff, transparent: true, opacity: 0.6 })
      );
      divLine.position.set(0, lineY, chassisD / 2 + 0.04);
      satGroup.add(divLine);
    }

    // Top Payload Aperture Lens
    const lensRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.6, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x334466, metalness: 0.9, roughness: 0.2 })
    );
    lensRing.position.set(0, chassisH / 2 + 0.1, 0);
    satGroup.add(lensRing);

    const lensGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.22, 32),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.1, emissive: 0x003366, emissiveIntensity: 0.6 })
    );
    lensGlass.position.set(0, chassisH / 2 + 0.12, 0);
    satGroup.add(lensGlass);

    // 8. Deployable Origami Solar Wings
    const { leftOrigami, rightOrigami } = buildSimSolarWings({
      satGroup,
      chassisW,
      chassisH,
      chassisD,
      cellMat,
      solarPanelsDeployed
    });
    leftOrigamiRef.current = leftOrigami;
    rightOrigamiRef.current = rightOrigami;

    // 9. Thruster, Particle Clouds, Beacon LED, and Yellow Heater Indicator
    const propThermal = buildSimPropulsionAndThermal({ satGroup, chassisW, chassisH, chassisD });
    plumeGroupRef.current = propThermal.plumeGroup;
    thrustLightRef.current = propThermal.thrustLight;
    gasCloudsRef.current = propThermal.gasClouds;
    statusLedRef.current = propThermal.statusLed;
    heaterBulbRef.current = propThermal.heaterBulb;
    heaterCoronaRef.current = propThermal.heaterCorona;
    heaterLightRef.current = propThermal.heaterLight;
    heaterStripsRef.current = propThermal.heaterStrips;

    // 10. Animation Loop (60 FPS Native WebGL)
    let lastTime = performance.now();
    const animate = (timestamp) => {
      animIdRef.current = requestAnimationFrame(animate);
      const now = timestamp || performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsed = now * 0.001;

      controls.update();

      // Fold / Unfold Animation (9-second smooth transition)
      const targetF = solarPanelsDeployedRef.current ? 0.0 : 1.0;
      const foldSpeed = 1.0 / 9.0;
      const diff = targetF - foldProgressRef.current;
      if (Math.abs(diff) < 0.002) {
        foldProgressRef.current = targetF;
      } else {
        foldProgressRef.current += Math.sign(diff) * Math.min(Math.abs(diff), delta * foldSpeed);
      }
      const f = foldProgressRef.current;

      if (panelHudSpanRef.current) {
        const remaining = Math.abs(targetF - f);
        if (remaining >= 0.002) {
          const pct = targetF === 0.0 ? Math.round((1.0 - f) * 100) : Math.round(f * 100);
          panelHudSpanRef.current.innerText = targetF === 0.0 ? `DEPLOYING (${pct}%)` : `STOWING (${pct}%)`;
        } else {
          panelHudSpanRef.current.innerText = targetF === 0.0 ? 'DEPLOYED (COPLANAR)' : 'STOWED (ORIGAMI Z-FOLD)';
        }
      }

      const left = leftOrigamiRef.current;
      if (left.joint0 && left.joint1 && left.joint2) {
        left.joint0.rotation.y = -f * (Math.PI / 2);
        left.joint1.rotation.y = f * Math.PI;
        left.joint1.position.z = f * 0.065;
        left.joint2.rotation.y = -f * Math.PI;
        left.joint2.position.z = -f * 0.065;
      }

      const right = rightOrigamiRef.current;
      if (right.joint0 && right.joint1 && right.joint2) {
        right.joint0.rotation.y = f * (Math.PI / 2);
        right.joint1.rotation.y = -f * Math.PI;
        right.joint1.position.z = f * 0.065;
        right.joint2.rotation.y = f * Math.PI;
        right.joint2.position.z = -f * 0.065;
      }

      // Cold-Gas Thruster Animated Cloud Burst
      const isFiring = isThrustingRef.current || statusRef.current === 'THRUSTER_BURN';
      if (plumeGroupRef.current) {
        const core1 = plumeGroupRef.current.children[0];
        const core2 = plumeGroupRef.current.children[1];
        if (isFiring) {
          const plumePulse = 0.85 + Math.sin(elapsed * 35) * 0.15;
          if (core1) core1.material.opacity = plumePulse;
          if (core2) core2.material.opacity = plumePulse * 0.9;
          if (thrustLightRef.current) thrustLightRef.current.intensity = 3.5 + Math.sin(elapsed * 40) * 1.0;

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
            puff.material.opacity = Math.sin(t * Math.PI) * 0.85;
          });
        } else {
          if (core1) core1.material.opacity = THREE.MathUtils.lerp(core1.material.opacity, 0, 0.15);
          if (core2) core2.material.opacity = THREE.MathUtils.lerp(core2.material.opacity, 0, 0.15);
          if (thrustLightRef.current) thrustLightRef.current.intensity = THREE.MathUtils.lerp(thrustLightRef.current.intensity, 0, 0.15);
          gasCloudsRef.current.forEach((puff) => {
            puff.material.opacity = THREE.MathUtils.lerp(puff.material.opacity, 0, 0.15);
          });
        }
      }

      // Yellow Heater Indication Light
      if (heaterBulbRef.current && heaterLightRef.current && heaterCoronaRef.current) {
        if (heaterActiveRef.current) {
          const pulse = 0.85 + Math.sin(elapsed * 6) * 0.15;
          heaterBulbRef.current.material.color.setHex(0xffea00);
          heaterBulbRef.current.material.emissive.setHex(0xffcc00);
          heaterBulbRef.current.material.emissiveIntensity = 1.6 * pulse;
          heaterCoronaRef.current.material.opacity = 0.45 * pulse;
          heaterCoronaRef.current.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.1);
          heaterLightRef.current.intensity = 4.2 * pulse;
          heaterStripsRef.current.forEach((s) => {
            s.material.emissive.setHex(0xffaa00);
            s.material.emissiveIntensity = 0.9 * pulse;
          });
        } else {
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

      // Status Beacon LED
      if (statusLedRef.current) {
        const st = statusRef.current;
        const blinkRate = st === 'SAFE_MODE' ? 2 : st === 'SCIENCE_ACQUISITION' ? 8 : 4;
        const isOn = Math.sin(elapsed * blinkRate) > 0;
        const col = st === 'SAFE_MODE' ? 0xff2a2a : st === 'SCIENCE_ACQUISITION' ? 0x00f0ff : 0x00ff66;
        statusLedRef.current.material.color.setHex(isOn ? col : 0x112211);
      }

      earth.rotation.y = elapsed * 0.02;
      renderer.render(scene, camera);
    };

    animate();

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

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (satGroupRef.current) {
      satGroupRef.current.rotation.x = THREE.MathUtils.degToRad(attitude.roll || 0);
      satGroupRef.current.rotation.y = THREE.MathUtils.degToRad(attitude.yaw || 0);
      satGroupRef.current.rotation.z = THREE.MathUtils.degToRad(attitude.pitch || 0);
    }
  }, [attitude]);

  return (
    <div className="w-full h-full relative select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <SimCanvasOverlays
        showEmbeddedHud={showEmbeddedHud}
        status={status}
        formFactor={formFactor}
        solarPanelsDeployed={solarPanelsDeployed}
        panelHudSpanRef={panelHudSpanRef}
        heaterActive={heaterActive}
        speed={speed}
        isThrusting={isThrusting}
      />
    </div>
  );
}

export default React.memo(CubeSatSimulationCanvas);
