import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import {
  calculateVisualAltitude,
  getAngularDistanceDeg,
  getSatSeed,
  getKeplerianOrbitalCoords,
  getSatelliteOrbitalState
} from '../../utils/orbitalMath';
import {
  EarthSurfaceShader,
  AtmosphereHaloShader
} from '../../components/3d/shaders/earthShaders';
import { buildOrbitalRingMesh, buildGlobeSatMesh } from './utils/buildGlobeMeshes';
import OrbitalBottomDock from '../../components/3d/OrbitalBottomDock';
import GlobeTelemetryBar from './components/GlobeTelemetryBar';

function CubeSatGlobeView({
  satellite,
  status = 'NOMINAL',
  solarPanelsDeployed = true,
  isThrusting = false,
  groundStations = [],
  warpSpeed = 15,
  setWarpSpeed,
  onTelemetryUpdate
}) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentGlobeMat, setCurrentGlobeMat] = useState(null);

  // Middle Bottom Dock Control States
  const [lightingMode, setLightingMode] = useState('TERMINATOR'); // 'TERMINATOR' | 'DAY' | 'NIGHT'
  const [isPaused, setIsPaused] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [followSat, setFollowSat] = useState(false);

  // Concentric Layers & Shader Mesh References
  const concentricGroupRef = useRef(new THREE.Group());
  const starfieldRef = useRef(null);
  const atmosphereMeshRef = useRef(null);
  const atmosphereRimRingRef = useRef(null);
  const deepSpaceRimRef = useRef(null);
  const cloudMeshRef = useRef(null);
  const surfaceShaderMatRef = useRef(null);

  const texturesLoadedRef = useRef(false);
  const texturesRef = useRef({});
  const sunAngleRef = useRef(0.85);

  // Fast 60 FPS animation loop refs
  const simTimeRef = useRef(Date.now() / 1000);
  const warpSpeedRef = useRef(warpSpeed);
  warpSpeedRef.current = warpSpeed;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const followSatRef = useRef(followSat);
  followSatRef.current = followSat;

  const groundStationsRef = useRef(groundStations);
  groundStationsRef.current = groundStations;

  const isThrustingRef = useRef(isThrusting);
  isThrustingRef.current = isThrusting;

  const statusRef = useRef(status);
  statusRef.current = status;

  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);
  onTelemetryUpdateRef.current = onTelemetryUpdate;

  const satMeshRef = useRef(null);
  const ringMeshRef = useRef(null);
  const plumeRef = useRef(null);
  const ledRef = useRef(null);
  const lastPosRef = useRef({ lat: 0, lng: 0, heading: 0 });
  const isTransitioningRef = useRef(false);

  // UI state for telemetry HUD and communication laser arcs (throttled ~5 Hz)
  const [uiTelemetry, setUiTelemetry] = useState({
    lat: 0,
    lng: 0,
    heading: 0,
    activeStations: [],
    commArcs: [],
    connectedStationName: 'Searching for Ground Station...'
  });

  const satId = satellite?.satelliteId || 'CUBESAT-ION';
  const satName = satellite?.name || 'CubeSat Ion-X';
  const formFactor = satellite?.formFactor || '3U';
  const altitudeKm = satellite?.altitude || 512.4;
  const inclination = satellite?.attitude?.mode === 'SUN_TRACKING' ? 45.0 : 97.4;
  const visualAlt = Math.max(0.12, calculateVisualAltitude(altitudeKm, 'LEO'));
  const visualAltRef = useRef(visualAlt);
  visualAltRef.current = visualAlt;

  // 1. Responsive Container Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Helper: Create soft circular twinkling star particle sprite
  const createCircularStarTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(235, 248, 255, 0.9)');
    gradient.addColorStop(0.55, 'rgba(100, 200, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  };

  // 3. Initialize Concentric 4-Layer Featured Shader Globe
  const initConcentricLayers = () => {
    if (!globeRef.current?.scene) return;
    const scene = globeRef.current.scene();
    const { day, night, bump, spec, clouds } = texturesRef.current;

    if (!scene.children.includes(concentricGroupRef.current)) {
      scene.add(concentricGroupRef.current);
    }

    // 1. Starfield System (3,000 particle stars, radius 750, depth 250)
    if (!starfieldRef.current) {
      const starCount = 3000;
      const starRadius = 750;
      const starDepth = 250;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount; i++) {
        const r = starRadius + (Math.random() - 0.5) * starDepth;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const tint = Math.random();
        if (tint > 0.85) {
          colors[i * 3] = 0.55; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1.0;
        } else if (tint > 0.60) {
          colors[i * 3] = 0.80; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 1.0;
        } else {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
        }
      }

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const starMat = new THREE.PointsMaterial({
        size: 2.2,
        map: createCircularStarTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      starfieldRef.current = new THREE.Points(starGeo, starMat);
      concentricGroupRef.current.add(starfieldRef.current);
    }

    if (day && night) {
      // Core Earth Surface Shader Material (Unified GLSL: Terminator, Day, Night)
      if (!surfaceShaderMatRef.current) {
        const initialMode = lightingMode === 'DAY' ? 1 : lightingMode === 'NIGHT' ? 2 : 0;
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            dayMap: { value: day },
            nightMap: { value: night },
            bumpMap: { value: bump },
            specularMap: { value: spec },
            sunDirection: { value: new THREE.Vector3(1.0, 0.3, 0.5).normalize() },
            dayNightMode: { value: initialMode }
          },
          vertexShader: EarthSurfaceShader.vertexShader,
          fragmentShader: EarthSurfaceShader.fragmentShader
        });
        surfaceShaderMatRef.current = mat;
        setCurrentGlobeMat(mat);
      }

      // Layer 2: Cloud Canopy
      if (!cloudMeshRef.current && clouds) {
        const cloudGeo = new THREE.SphereGeometry(100.5, 64, 64);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: clouds,
          transparent: true,
          opacity: lightingMode === 'NIGHT' ? 0.0 : 0.14,
          blending: THREE.NormalBlending,
          depthWrite: false
        });
        cloudMeshRef.current = new THREE.Mesh(cloudGeo, cloudMat);
        cloudMeshRef.current.visible = lightingMode !== 'NIGHT';
        concentricGroupRef.current.add(cloudMeshRef.current);
      }

      // Layer 3: Atmospheric Fresnel Halo Sphere
      if (!atmosphereMeshRef.current) {
        const atmoGeo = new THREE.SphereGeometry(102.5, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
          uniforms: {
            glowColor: {
              value: new THREE.Color(
                lightingMode === 'NIGHT' ? 0x2563eb : lightingMode === 'DAY' ? 0x67e8f9 : 0x00d8ff
              )
            },
            intensity: { value: lightingMode === 'NIGHT' ? 0.45 : 0.70 }
          },
          vertexShader: AtmosphereHaloShader.vertexShader,
          fragmentShader: AtmosphereHaloShader.fragmentShader,
          side: THREE.BackSide,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        atmosphereMeshRef.current = new THREE.Mesh(atmoGeo, atmoMat);
        concentricGroupRef.current.add(atmosphereMeshRef.current);
      }

      // Layer 4: Glowing Atmospheric Rim Ring Billboard
      if (!atmosphereRimRingRef.current) {
        const rimGeo = new THREE.RingGeometry(100.2, 103.4, 128);
        const rimColor = lightingMode === 'NIGHT' ? 0x2563eb : 0x00f0ff;
        const rimMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(rimColor),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.90,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        atmosphereRimRingRef.current = new THREE.Mesh(rimGeo, rimMat);
        concentricGroupRef.current.add(atmosphereRimRingRef.current);
      }

      // Layer 5: Deep Space Outer Rim
      if (!deepSpaceRimRef.current) {
        const rimGeo = new THREE.SphereGeometry(105.0, 48, 48);
        const rimColor = lightingMode === 'NIGHT' ? 0x1e1b4b : 0x1a8fcc;
        const rimMat = new THREE.MeshBasicMaterial({
          color: rimColor,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.02,
          depthWrite: false
        });
        deepSpaceRimRef.current = new THREE.Mesh(rimGeo, rimMat);
        concentricGroupRef.current.add(deepSpaceRimRef.current);
      }

      applyLightingMode(lightingMode);
      concentricGroupRef.current.visible = true;
    }
  };

  // 4. Apply Lighting Mode ('TERMINATOR', 'DAY', 'NIGHT')
  const applyLightingMode = (mode) => {
    if (!surfaceShaderMatRef.current) return;

    const modeInt = mode === 'DAY' ? 1 : mode === 'NIGHT' ? 2 : 0;
    if (surfaceShaderMatRef.current.uniforms.dayNightMode) {
      surfaceShaderMatRef.current.uniforms.dayNightMode.value = modeInt;
    }
    surfaceShaderMatRef.current.needsUpdate = true;

    if (globeRef.current?.globeMaterial) {
      globeRef.current.globeMaterial(surfaceShaderMatRef.current);
    }

    if (mode === 'DAY') {
      if (surfaceShaderMatRef.current?.uniforms?.sunDirection) {
        surfaceShaderMatRef.current.uniforms.sunDirection.value.set(0.0, 0.2, 1.0).normalize();
      }
      if (atmosphereMeshRef.current?.material) {
        atmosphereMeshRef.current.material.uniforms.glowColor.value.setHex(0x67e8f9);
        atmosphereMeshRef.current.material.uniforms.intensity.value = 0.75;
      }
      if (atmosphereRimRingRef.current?.material) {
        atmosphereRimRingRef.current.material.color.setHex(0x00f0ff);
        atmosphereRimRingRef.current.material.opacity = 0.92;
      }
      if (cloudMeshRef.current) {
        cloudMeshRef.current.visible = true;
        cloudMeshRef.current.material.opacity = 0.15;
      }
      if (deepSpaceRimRef.current?.material) {
        deepSpaceRimRef.current.material.color.setHex(0x1a8fcc);
      }
    } else if (mode === 'NIGHT') {
      if (atmosphereMeshRef.current?.material) {
        atmosphereMeshRef.current.material.uniforms.glowColor.value.setHex(0x2563eb);
        atmosphereMeshRef.current.material.uniforms.intensity.value = 0.45;
      }
      if (atmosphereRimRingRef.current?.material) {
        atmosphereRimRingRef.current.material.color.setHex(0x2563eb);
        atmosphereRimRingRef.current.material.opacity = 0.92;
      }
      if (cloudMeshRef.current) {
        cloudMeshRef.current.visible = false;
        cloudMeshRef.current.material.opacity = 0.0;
      }
      if (deepSpaceRimRef.current?.material) {
        deepSpaceRimRef.current.material.color.setHex(0x1e1b4b);
      }
    } else {
      sunAngleRef.current = 0.85;
      if (surfaceShaderMatRef.current?.uniforms?.sunDirection) {
        surfaceShaderMatRef.current.uniforms.sunDirection.value.set(1.0, 0.3, 0.5).normalize();
      }
      if (atmosphereMeshRef.current?.material) {
        atmosphereMeshRef.current.material.uniforms.glowColor.value.setHex(0x00d8ff);
        atmosphereMeshRef.current.material.uniforms.intensity.value = 0.70;
      }
      if (atmosphereRimRingRef.current?.material) {
        atmosphereRimRingRef.current.material.color.setHex(0x00f0ff);
        atmosphereRimRingRef.current.material.opacity = 0.90;
      }
      if (cloudMeshRef.current) {
        cloudMeshRef.current.visible = true;
        cloudMeshRef.current.material.opacity = 0.12;
      }
      if (deepSpaceRimRef.current?.material) {
        deepSpaceRimRef.current.material.color.setHex(0x0a1236);
      }
    }
  };

  useEffect(() => {
    applyLightingMode(lightingMode);
  }, [lightingMode]);

  // 5. Preload Photorealistic Earth Textures
  useEffect(() => {
    if (texturesLoadedRef.current) return;
    const loader = new THREE.TextureLoader();

    const loadTex = (url) => {
      return new Promise((resolve) => {
        loader.load(url, (tex) => {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          resolve(tex);
        }, undefined, () => resolve(null));
      });
    };

    Promise.all([
      loadTex('/textures/earth_day.jpg'),
      loadTex('/textures/earth_night.jpg'),
      loadTex('/textures/earth_bump.jpg'),
      loadTex('/textures/earth_specular.jpg'),
      loadTex('/textures/earth_clouds.png')
    ]).then(([day, night, bump, spec, clouds]) => {
      texturesRef.current = { day, night, bump, spec, clouds };
      texturesLoadedRef.current = true;
      initConcentricLayers();
    });
  }, []);

  // 6. Build and Attach CubeSat Bus Model and Exact Keplerian Orbital Tube
  useEffect(() => {
    let checkInterval = null;
    const attachObjects = () => {
      if (!globeRef.current?.scene) return false;
      const scene = globeRef.current.scene();
      if (!scene) return false;

      // Attach CubeSat 3D Bus Mesh
      if (satMeshRef.current) scene.remove(satMeshRef.current);
      const newMesh = buildGlobeSatMesh({ formFactor, solarPanelsDeployed, status, ledRef, plumeRef });
      satMeshRef.current = newMesh;
      scene.add(newMesh);

      // Attach High-Visibility Volumetric Orbital Ring
      if (ringMeshRef.current) scene.remove(ringMeshRef.current);
      const newRing = buildOrbitalRingMesh(satId, inclination, visualAltRef.current, globeRef.current);
      ringMeshRef.current = newRing;
      newRing.visible = showOrbits;
      scene.add(newRing);

      return true;
    };

    if (!attachObjects()) {
      checkInterval = setInterval(() => {
        if (attachObjects()) clearInterval(checkInterval);
      }, 50);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (globeRef.current?.scene) {
        if (satMeshRef.current) { globeRef.current.scene().remove(satMeshRef.current); satMeshRef.current = null; }
        if (ringMeshRef.current) { globeRef.current.scene().remove(ringMeshRef.current); ringMeshRef.current = null; }
      }
    };
  }, [formFactor, solarPanelsDeployed, status, satId, inclination, showOrbits]);

  // 7. 60 FPS Native Animation Loop: Exact Orbit Propagation, Rotating Sun & Camera Tracking
  useEffect(() => {
    let animFrameId;
    let lastTime = performance.now();
    let lastUiUpdate = 0;

    const tick = (now) => {
      animFrameId = requestAnimationFrame(tick);
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Keep glowing atmospheric rim ring facing camera
      if (atmosphereRimRingRef.current && globeRef.current?.camera) {
        atmosphereRimRingRef.current.quaternion.copy(globeRef.current.camera().quaternion);
        atmosphereRimRingRef.current.position.set(0, 0, 0);
      }

      // Subtle celestial starfield rotation
      if (starfieldRef.current) {
        starfieldRef.current.rotation.y += deltaSec * 0.003;
      }

      if (!isPausedRef.current && (warpSpeedRef.current || 15) > 0) {
        const speed = warpSpeedRef.current || 15;
        simTimeRef.current += deltaSec * speed;

        // Differential cloud rotation
        if (cloudMeshRef.current) {
          cloudMeshRef.current.rotation.y += deltaSec * 0.025 * speed;
        }

        // Rotate Sun angle for dynamic day/night terminator traversal
        if (lightingMode === 'TERMINATOR') {
          sunAngleRef.current += deltaSec * 0.025 * speed;
          const sunX = Math.cos(sunAngleRef.current);
          const sunZ = Math.sin(sunAngleRef.current);
          const sunVec = new THREE.Vector3(sunX, 0.35, sunZ).normalize();

          if (surfaceShaderMatRef.current) {
            surfaceShaderMatRef.current.uniforms.sunDirection.value.copy(sunVec);
          }
          if (atmosphereMeshRef.current?.material) {
            atmosphereMeshRef.current.material.uniforms.sunDirection.value.copy(sunVec);
          }
        }
      }

      const currentTime = simTimeRef.current;
      const globe = globeRef.current;
      const satMesh = satMeshRef.current;

      if (globe && satMesh) {
        // Compute exact position along the Keplerian orbital tube
        const satObj = {
          id: satId,
          satelliteId: satId,
          inclination,
          alt: visualAltRef.current,
          type: 'LEO'
        };
        const state = getSatelliteOrbitalState(satObj, currentTime, globe);
        const { lat, lng, x, y, z, nextX, nextY, nextZ } = state;
        const heading = Math.round((Math.atan2(Math.cos((inclination * Math.PI) / 180), Math.cos(state.u)) * 180) / Math.PI);
        lastPosRef.current = { lat, lng, heading };

        // Position CubeSat model EXACTLY on the orbital ring
        satMesh.position.set(x, y, z);
        satMesh.up.set(x, y, z).normalize();
        satMesh.lookAt(nextX, nextY, nextZ);

        // Firing cold-gas thruster plume cone
        if (plumeRef.current) {
          const isFiring = isThrustingRef.current || statusRef.current === 'THRUSTER_BURN';
          if (isFiring) {
            plumeRef.current.visible = true;
            plumeRef.current.material.opacity = 0.75 + Math.sin(now * 0.035) * 0.25;
            const s = 1.0 + Math.sin(now * 0.04) * 0.2;
            plumeRef.current.scale.set(1.0, s, 1.0);
          } else {
            plumeRef.current.visible = false;
          }
        }

        // Blinking status beacon LED
        if (ledRef.current) {
          const st = statusRef.current;
          const blinkSpeed = st === 'SAFE_MODE' ? 0.008 : st === 'SCIENCE_ACQUISITION' ? 0.02 : 0.01;
          ledRef.current.material.opacity = Math.sin(now * blinkSpeed) > 0 ? 1.0 : 0.25;
        }

        // Smooth continuous 60 FPS camera tracking
        if (followSatRef.current && !isTransitioningRef.current) {
          globe.pointOfView({ lat, lng, altitude: 1.8 }, 0);
        }

        // Throttled UI Telemetry & Communication Arcs update (~4-5 Hz)
        if (now - lastUiUpdate > 220) {
          lastUiUpdate = now;
          const inRange = (groundStationsRef.current || []).filter((gs) => {
            return getAngularDistanceDeg(lat, lng, gs.latitude, gs.longitude) <= 52;
          });

          let connName = 'Searching for Ground Station...';
          const arcs = [];
          if (inRange.length > 0) {
            connName = `${inRange[0].name} (${inRange[0].stationId})`;
            inRange.forEach((gs) => {
              arcs.push({
                startLat: lat,
                startLng: lng,
                endLat: gs.latitude,
                endLng: gs.longitude,
                color: ['#00F0FF', '#00FF66'],
                name: gs.name
              });
            });
          }

          setUiTelemetry({
            lat: parseFloat(lat.toFixed(4)),
            lng: parseFloat(lng.toFixed(4)),
            heading,
            activeStations: inRange,
            commArcs: arcs,
            connectedStationName: connName
          });

          if (typeof onTelemetryUpdateRef.current === 'function') {
            onTelemetryUpdateRef.current({ lat, lng, alt: visualAltRef.current, heading });
          }
        }
      }
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [satId, inclination, lightingMode]);

  // Handle follow tracking toggle
  const handleToggleFollow = () => {
    const nextFollow = !followSat;
    setFollowSat(nextFollow);
    followSatRef.current = nextFollow;

    if (nextFollow && globeRef.current && lastPosRef.current) {
      isTransitioningRef.current = true;
      globeRef.current.pointOfView(
        { lat: lastPosRef.current.lat, lng: lastPosRef.current.lng, altitude: 1.8 },
        700
      );
      setTimeout(() => { isTransitioningRef.current = false; }, 720);
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 800);
    }
    setFollowSat(false);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-[#050810] rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_40px_rgba(0,240,255,0.05)] cursor-move select-none"
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#050810"
        globeMaterial={currentGlobeMat}

        // Ground Stations
        labelsData={showLabels ? groundStations : []}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.1}
        labelDotRadius={0.45}
        labelColor={(gs) => (uiTelemetry.activeStations.some((a) => a.name === gs.name) ? '#00FF66' : '#00F0FF')}
        labelResolution={2}
        labelIncludeDot={true}

        // Radar Broadcast Footprint Rings on Active Stations
        ringsData={uiTelemetry.activeStations}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t) => `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.6)})`}
        ringMaxRadius={4.5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1200}

        // Real-Time Communication Laser Arcs
        arcsData={uiTelemetry.commArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.03}
        arcStroke={1.4}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
      />

      {/* Middle-Bottom Cyber Dock / Controls (Matches 3D Orbital Simulator) */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <OrbitalBottomDock
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          timeScale={warpSpeed}
          onChangeTimeScale={(speed) => {
            if (setWarpSpeed) setWarpSpeed(speed);
          }}
          lightingMode={lightingMode}
          onChangeLightingMode={setLightingMode}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          showOrbits={showOrbits}
          onToggleOrbits={() => setShowOrbits(!showOrbits)}
          onResetView={handleResetCamera}
          followTracking={followSat}
          onToggleTracking={handleToggleFollow}
          hasSelectedSat={true}
        />
      </div>

      {/* Live CubeSat Telemetry Bar at viewport bottom */}
      <GlobeTelemetryBar
        satName={satName}
        formFactor={formFactor}
        uiTelemetry={uiTelemetry}
      />
    </div>
  );
}

export default React.memo(CubeSatGlobeView);
