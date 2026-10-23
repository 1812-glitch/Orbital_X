import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import {
  SAT_SLOT_COLORS,
  getAngularDistanceDeg,
  getOrbitColor,
  isCubeSatType,
  getSatSeed,
  getKeplerianOrbitalCoords,
  getSatelliteOrbitalState
} from '../../utils/orbitalMath';
import {
  EarthSurfaceShader,
  AtmosphereHaloShader,
  createProceduralSatelliteMesh
} from './shaders/earthShaders';

/**
 * 3D Keplerian Orbital Simulator
 * 
 * Features:
 * 1. Background & Starfield System (Matching user spec):
 *    - Background Color: #050810 (Deep obsidian space black / dark navy)
 *    - Starfield System: 3,000 particle stars, radius 200 units, depth 100 units
 *    - Deep Space Outer Rim: Concentric sphere (R = 105.0) faint indigo falloff (opacity 0.02)
 * 2. Authentic Day / Night / Terminator Transitions (Matching screenshots 1, 2, 3):
 *    - 'TERMINATOR': Physical twilight band blending day & night with specular ocean glints + cyan atmospheric halo
 *    - 'DAY': Full daylight Blue Marble texture across globe + vibrant cyan atmospheric halo
 *    - 'NIGHT': Full nocturnal Black Marble city lights texture + deep electric blue atmosphere
 * 3. Single Satellite Selector & Tracker:
 *    - Strictly limited to 1 active satellite
 *    - Highlighted glowing orbital path for the selected satellite
 *    - Light, subtle orbital traces for all other satellites in the background
 *    - Real-time smooth Nadir-pointing and camera tracking
 */
const Scene = forwardRef(function Scene({ 
  fleetData = [], 
  groundStations = [], 
  selectedSatIds = [],
  trackedSatId = null,
  selectedStationId = null,
  onSelectStation = null,
  onSelectSatellite,
  showRings = true, 
  showLabels = true, 
  showUplinks = true, 
  showStationPins = true,
  autoRotate = false,
  followTracking = false,
  lightingMode = 'TERMINATOR', // 'TERMINATOR' | 'DAY' | 'NIGHT'
  timeScale = 1,
  isPaused = false
}, ref) {
  const containerRef = useRef();
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentGlobeMat, setCurrentGlobeMat] = useState(null);

  // Scene object references
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
  const simTimeRef = useRef(Date.now() / 1000);
  const satMeshesMapRef = useRef(new Map());
  const [arcTick, setArcTick] = useState(0);
  const lastArcTickTimeRef = useRef(0);

  // Expose reset camera method
  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1000);
      }
    }
  }));

  // Health color mapping
  const getHealthColor = (d) => {
    if (d.status === 'OFFLINE') return '#FF2A2A';
    if (d.health < 80 || d.status === 'WARNING') return '#FFB020';
    return '#00F0FF';
  };

  // Keplerian Real-to-WebGL Altitude Translation (Section 4.1)
  const calculateKeplerianVisualAlt = (altitudeKm, orbitType) => {
    const km = Number(altitudeKm) || (orbitType === 'GEO' ? 35786 : orbitType === 'MEO' ? 20200 : 550);
    if (km <= 2000) {
      return parseFloat(Math.max(0.065, km / 6371).toFixed(4));
    }
    const scaledHighAlt = 0.31 + (Math.log10(km / 2000) * 0.28);
    return parseFloat(Math.min(0.78, scaledHighAlt).toFixed(4));
  };

  // Format fleet data (strictly 1 active selected satellite) - Declared before animation loops
  const satellites = useMemo(() => {
    const activeSelectedId = selectedSatIds.length > 0 ? selectedSatIds[0] : null;

    return fleetData
      .filter(d => d.telemetry)
      .map(d => {
        const satId = d.satellite.satelliteId;
        const isSelected = satId === activeSelectedId;
        const slotColor = isSelected ? SAT_SLOT_COLORS[0] : null;
        const isCubeSat = isCubeSatType(d.satellite);
        const orbitType = d.satellite.orbitType || 'LEO';
        const orbitColor = getOrbitColor(orbitType);
        
        const realAltitudeKm = d.telemetry.altitude || (d.satellite.orbitRadius ? d.satellite.orbitRadius - 6371 : null);
        const alt = calculateKeplerianVisualAlt(realAltitudeKm, orbitType);

        return {
          lat: d.telemetry.latitude,
          lng: d.telemetry.longitude,
          alt,
          altitudeKm: Math.round(realAltitudeKm || (orbitType === 'GEO' ? 35786 : orbitType === 'MEO' ? 20200 : 550)),
          id: satId,
          name: d.satellite.name,
          type: orbitType,
          orbitColor,
          formFactor: d.satellite.formFactor || (isCubeSat ? 'CubeSat 3U' : 'Standard Sat'),
          status: d.satellite.status,
          health: d.telemetry.health || 95,
          speed: d.telemetry.speed || 7.6,
          inclination: d.satellite.inclination || (isCubeSat ? 97.4 : 51.6),
          isSelected,
          slotIdx: isSelected ? 0 : -1,
          slotColor
        };
      });
  }, [fleetData, selectedSatIds]);

  // 1. Responsive Sizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Auto Rotation Management
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = autoRotate && !followTracking;
        controls.autoRotateSpeed = 0.5;
      }
    }
  }, [autoRotate, followTracking]);

  // 3. Smooth Camera Focus on Ground Station Selection
  useEffect(() => {
    if (globeRef.current && selectedStationId && groundStations.length > 0) {
      const gs = groundStations.find(s => s._id === selectedStationId || s.stationId === selectedStationId);
      if (gs && gs.latitude !== undefined && gs.longitude !== undefined) {
        globeRef.current.pointOfView({ lat: gs.latitude, lng: gs.longitude, altitude: 1.85 }, 1200);
      }
    }
  }, [selectedStationId, groundStations]);

  // 4. Preload NASA Textures
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

  // Helper: Create soft circular twinkling star particle sprite
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
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Initialize the Concentric Layers, Starfield, and Atmospheric Halo Ring
  const initConcentricLayers = () => {
    if (!globeRef.current?.scene) return;
    const scene = globeRef.current.scene();
    const { day, night, bump, spec, clouds } = texturesRef.current;

    // Attach root concentric group
    if (!scene.children.includes(concentricGroupRef.current)) {
      scene.add(concentricGroupRef.current);
    }

    // 1. Starfield System (Matching Screenshot 5: 3,000 particle stars, radius 750, depth 250)
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

        // Star colors: bright white, soft cyan, faint ice blue
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
      // Core Earth Surface Shader Material (Unified GLSL handling DAY, NIGHT, and TERMINATOR seamlessly)
      // Matches DAY_NIGHT_TRANSITION_GUIDE.md Section 5 & 6
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

      // Layer 2: Subtle Cloud Canopy (Radius 100.5, Section 3 & 6)
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

      // Layer 3: Atmospheric Fresnel Halo Sphere (Radius 102.5, Section 4.5 & 5.3)
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

      // Layer 4: Glowing Atmospheric Rim Ring (Matches Screenshots 1, 2, 3)
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

      // Layer 5: Deep Space Outer Rim (Section 9.4: R = 105.0, faint indigo back-side falloff opacity 0.02)
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

  // Apply Lighting Mode ('TERMINATOR', 'DAY', 'NIGHT') to Globe Materials & Atmosphere
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
      // 1. Full Day Mode (Screenshot 2: Full daylight Blue Marble + glowing cyan halo)
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
      // 2. Full Night Mode (Screenshot 3: Full nocturnal city lights + deep royal blue atmosphere)
      if (atmosphereMeshRef.current?.material) {
        atmosphereMeshRef.current.material.uniforms.glowColor.value.setHex(0x2563eb);
        atmosphereMeshRef.current.material.uniforms.intensity.value = 0.45;
      }
      if (atmosphereRimRingRef.current?.material) {
        atmosphereRimRingRef.current.material.color.setHex(0x2563eb);
        atmosphereRimRingRef.current.material.opacity = 0.92;
      }
      if (cloudMeshRef.current) {
        // Hide clouds so nocturnal city lights glow with 100% clarity
        cloudMeshRef.current.visible = false;
        cloudMeshRef.current.material.opacity = 0.0;
      }
      if (deepSpaceRimRef.current?.material) {
        deepSpaceRimRef.current.material.color.setHex(0x1e1b4b);
      }
    } else {
      // 3. Dynamic Terminator Mode (Screenshot 1: Twilight blend + glowing cyan halo from viewpoint)
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

  // Re-apply whenever lightingMode prop changes
  useEffect(() => {
    applyLightingMode(lightingMode);
  }, [lightingMode]);

  // Initial mount attach
  useEffect(() => {
    let timer = null;
    const attachAndInit = () => {
      if (!globeRef.current?.scene) return false;
      initConcentricLayers();
      return true;
    };

    if (!attachAndInit()) {
      timer = setInterval(() => {
        if (attachAndInit()) clearInterval(timer);
      }, 50);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  // Animation frame loop: Differential cloud rotation, Sun angle rotation, Starfield, and Real-time Satellite Orbit Propagation
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Keep glowing atmospheric rim ring facing camera for authentic 360 halo
      if (atmosphereRimRingRef.current && globeRef.current?.camera) {
        atmosphereRimRingRef.current.quaternion.copy(globeRef.current.camera().quaternion);
        atmosphereRimRingRef.current.position.set(0, 0, 0);
      }

      // Subtle celestial starfield rotation (speed 0.5 matching Screenshot 5)
      if (starfieldRef.current) {
        starfieldRef.current.rotation.y += delta * 0.003;
      }

      if (!isPaused && timeScale > 0) {
        simTimeRef.current += delta * timeScale;

        // Differential cloud rotation (delta * 0.025)
        if (cloudMeshRef.current) {
          cloudMeshRef.current.rotation.y += delta * 0.025 * timeScale;
        }

        // Rotate Sun angle for dynamic day/night terminator traversal
        if (lightingMode === 'TERMINATOR') {
          sunAngleRef.current += delta * 0.025 * timeScale;
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

      // Propagate ALL satellites along their exact 3D Keplerian orbits at 60 FPS
      const globe = globeRef.current;
      if (globe && satMeshesMapRef.current && satellites.length > 0) {
        satellites.forEach(sat => {
          const mesh = satMeshesMapRef.current.get(sat.id);
          const state = getSatelliteOrbitalState(sat, simTimeRef.current, globe);
          if (mesh) {
            mesh.position.set(state.x, state.y, state.z);
            mesh.up.set(state.x, state.y, state.z).normalize();
            mesh.lookAt(state.nextX, state.nextY, state.nextZ);
          }
          sat._liveLat = state.lat;
          sat._liveLng = state.lng;
          sat._liveCoords = state;
        });

        // Dynamic 60 FPS smooth camera tracking of active tracked satellite
        if (followTracking && selectedSatIds.length > 0) {
          const targetId = trackedSatId || selectedSatIds[0];
          const trackedSat = satellites.find(s => s.id === targetId);
          if (trackedSat && trackedSat._liveLat !== undefined) {
            globe.pointOfView({
              lat: trackedSat._liveLat,
              lng: trackedSat._liveLng,
              altitude: 1.65
            }, 0);
          }
        }

        // Periodically refresh arc & radar footprint positions (~5 Hz)
        if (time - lastArcTickTimeRef.current > 200) {
          lastArcTickTimeRef.current = time;
          setArcTick(t => t + 1);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, timeScale, lightingMode, followTracking, selectedSatIds, trackedSatId, satellites]);

  // Smooth Satellite Camera Tracking (single satellite tracker)
  useEffect(() => {
    if (!followTracking || selectedSatIds.length === 0 || !globeRef.current) return;
    const targetId = trackedSatId || selectedSatIds[0];
    const trackedSat = satellites.find(s => s.id === targetId);
    if (trackedSat && trackedSat.lat !== undefined && trackedSat.lng !== undefined) {
      globeRef.current.pointOfView({
        lat: trackedSat.lat,
        lng: trackedSat.lng,
        altitude: 1.65
      }, 700);
    }
  }, [followTracking, selectedSatIds, trackedSatId, satellites]);

  // Light Orbital Paths for ALL Satellites + Highlighted Path for the 1 Selected Satellite
  const orbitalRingsGroupRef = useRef(new THREE.Group());

  useEffect(() => {
    let timer = null;
    const attachGroup = () => {
      if (!globeRef.current?.scene) return false;
      const scene = globeRef.current.scene();
      if (!scene) return false;
      if (!scene.children.includes(orbitalRingsGroupRef.current)) {
        scene.add(orbitalRingsGroupRef.current);
      }
      return true;
    };

    if (!attachGroup()) {
      timer = setInterval(() => {
        if (attachGroup()) clearInterval(timer);
      }, 50);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (globeRef.current?.scene && orbitalRingsGroupRef.current) {
        globeRef.current.scene().remove(orbitalRingsGroupRef.current);
      }
    };
  }, []);

  // Update Orbital Trajectory Loops
  useEffect(() => {
    const group = orbitalRingsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      group.remove(child);
    }

    if (!showRings || satellites.length === 0) return;

    const globe = globeRef.current;

    satellites.forEach(sat => {
      const isSelected = sat.isSelected;
      const numSegments = isSelected ? 240 : 160;
      const points = [];
      const seed = getSatSeed(sat.id);
      const nodeLngRad = ((seed * 73) % 360) * (Math.PI / 180);
      const incRad = ((sat.inclination || (isCubeSatType(sat) ? 97.4 : 51.6)) * Math.PI) / 180;
      const alt = sat.alt || 0.12;

      for (let i = 0; i <= numSegments; i++) {
        const u = (i / numSegments) * 2 * Math.PI;
        const pt = getKeplerianOrbitalCoords(u, incRad, nodeLngRad, alt, globe);
        points.push(new THREE.Vector3(pt.x, pt.y, pt.z));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);

      if (isSelected) {
        // HIGHLIGHTED, GLOWING ORBITAL PATH for the 1 selected satellite
        const tubeGeo = new THREE.TubeGeometry(curve, 240, 0.38, 8, true);
        const colorHex = sat.slotColor || sat.orbitColor || '#00F0FF';
        const tubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0.95,
          depthTest: true
        });
        const ringMesh = new THREE.Mesh(tubeGeo, tubeMat);
        group.add(ringMesh);

        // Outer glow bloom tube for selected orbit
        const glowGeo = new THREE.TubeGeometry(curve, 180, 0.75, 6, true);
        const glowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0.30,
          blending: THREE.AdditiveBlending,
          depthTest: true
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));
      } else {
        // LIGHT, SUBTLE ORBITAL PATH for all other satellites in the background
        const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.10, 6, true);
        const colorHex = sat.orbitColor || '#00F0FF';
        const tubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: 0.20,
          depthTest: true
        });
        const ringMesh = new THREE.Mesh(tubeGeo, tubeMat);
        group.add(ringMesh);
      }
    });
  }, [satellites, showRings]);

  // Communication Laser Arcs (Follow moving satellites in real time)
  const arcs = useMemo(() => {
    if (!showUplinks || satellites.length === 0 || groundStations.length === 0) return [];
    
    const calculatedArcs = [];
    const activeTargets = satellites.filter(s => s.isSelected);

    activeTargets.forEach(sat => {
      const curLat = sat._liveLat !== undefined ? sat._liveLat : sat.lat;
      const curLng = sat._liveLng !== undefined ? sat._liveLng : sat.lng;

      const inRangeStations = groundStations.filter(gs => {
        const isDesignated = gs.connectedSatellites && gs.connectedSatellites.some(s => {
          const id = typeof s === 'object' ? (s.satelliteId || s._id) : s;
          return id === sat.id;
        });

        const distDeg = getAngularDistanceDeg(curLat, curLng, gs.latitude, gs.longitude);
        return isDesignated && distDeg <= 55;
      });

      inRangeStations.forEach(gs => {
        const color = sat.slotColor || '#00F0FF';
        calculatedArcs.push({
          satId: sat.id,
          startLat: curLat,
          startLng: curLng,
          endLat: gs.latitude,
          endLng: gs.longitude,
          color: [color, `${color}60`],
          satColor: color,
          stationName: gs.name,
          stationId: gs.stationId
        });
      });
    });

    return calculatedArcs;
  }, [showUplinks, satellites, groundStations, arcTick]);

  // Radar Broadcast & Footprint Rings (Follow moving satellites in real time)
  const allRings = useMemo(() => {
    if (!showRings) return [];
    const rings = [];

    const selectedSats = satellites.filter(s => s.isSelected);
    selectedSats.forEach(sat => {
      const curLat = sat._liveLat !== undefined ? sat._liveLat : sat.lat;
      const curLng = sat._liveLng !== undefined ? sat._liveLng : sat.lng;

      rings.push({
        latitude: curLat,
        longitude: curLng,
        isSatFootprint: true,
        ringColorHex: sat.slotColor || '#00F0FF',
        maxRadius: 4.5,
        propagationSpeed: 2.0,
        repeatPeriod: 1400
      });
    });

    if (selectedStationId && groundStations && groundStations.length > 0) {
      const gs = groundStations.find(s => s._id === selectedStationId || s.stationId === selectedStationId);
      if (gs) {
        rings.push({
          ...gs,
          isSelected: true,
          maxRadius: 5.5,
          propagationSpeed: 2.8,
          repeatPeriod: 1000
        });
      }
    }

    return rings;
  }, [satellites, groundStations, selectedStationId, showRings, arcTick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#050810] relative rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_40px_rgba(0,240,255,0.05)] cursor-move"
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#050810"
        globeMaterial={currentGlobeMat}
        
        // Satellites in 3D Space (Procedural Nadir-Pointed Spacecraft positioned directly on orbit)
        customLayerData={satellites}
        customThreeObject={(d) => {
          const mesh = createProceduralSatelliteMesh(d);
          satMeshesMapRef.current.set(d.id, mesh);
          if (globeRef.current) {
            const state = getSatelliteOrbitalState(d, simTimeRef.current, globeRef.current);
            mesh.position.set(state.x, state.y, state.z);
            mesh.up.set(state.x, state.y, state.z).normalize();
            mesh.lookAt(state.nextX, state.nextY, state.nextZ);
          }
          return mesh;
        }}
        customThreeObjectUpdate={(obj, d) => {
          satMeshesMapRef.current.set(d.id, obj);
          if (globeRef.current) {
            const state = getSatelliteOrbitalState(d, simTimeRef.current, globeRef.current);
            obj.position.set(state.x, state.y, state.z);
            obj.up.set(state.x, state.y, state.z).normalize();
            obj.lookAt(state.nextX, state.nextY, state.nextZ);
          }
        }}
        onCustomLayerClick={(d) => {
          if (onSelectSatellite && d?.id) {
            onSelectSatellite(d.id);
          }
        }}
        customLayerLabel={showLabels ? (d) => `
          <div style="background: rgba(10, 15, 31, 0.95); padding: 8px 12px; border: 1px solid ${d.slotColor || d.orbitColor || '#1f2937'}; border-radius: 6px; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(0,0,0,0.8);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <b style="color: ${d.slotColor || d.orbitColor || '#00F0FF'}; font-size: 12px;">${d.id}</b>
              ${d.isSelected ? `<span style="background: ${d.slotColor}30; color: ${d.slotColor}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">SELECTED TARGET</span>` : ''}
            </div>
            <div style="color: #d1d5db; font-size: 10px; margin-bottom: 2px;">${d.name} (${d.type})</div>
            <div style="color: #9ca3af; font-size: 10px;">
              STATUS: <span style="color: ${getHealthColor(d)}; font-weight: bold;">${d.status}</span> | ALT: ${d.altitudeKm ? d.altitudeKm.toLocaleString() : '550'} km (${d.type})
            </div>
          </div>
        ` : () => ''}

        // Ground Station Labels
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.2}
        labelDotRadius={0.4}
        labelColor={(gs) => {
          const isSelected = selectedStationId && (gs._id === selectedStationId || gs.stationId === selectedStationId);
          return isSelected ? '#00F0FF' : '#00FF66';
        }}
        labelResolution={2}
        labelIncludeDot={true}
        onLabelClick={(gs) => {
          if (onSelectStation) onSelectStation(gs);
        }}
        labelLabel={(gs) => `
          <div style="background: rgba(10, 15, 31, 0.95); padding: 6px 10px; border: 1px solid #00F0FF; border-radius: 4px; font-family: monospace; font-size: 10px;">
            <b style="color: #00F0FF;">${gs.name} (${gs.stationId})</b><br/>
            <span style="color: #9ca3af;">Location: ${gs.country}</span><br/>
            <span style="color: #00FF66;">STATUS: ${gs.status}</span>
          </div>
        `}

        // Radar Broadcast & Satellite Footprint Rings
        ringsData={allRings}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={d => (t) => {
          if (d.isSatFootprint) {
            const hex = d.ringColorHex || '#00F0FF';
            return `rgba(0, 240, 255, ${Math.max(0, (1 - t) * 0.75)})`;
          }
          return d.isSelected 
            ? `rgba(0, 240, 255, ${Math.max(0, (1 - t) * 0.95)})`
            : `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.45)})`;
        }}
        ringMaxRadius={d => d.maxRadius || 3.5}
        ringPropagationSpeed={d => d.propagationSpeed || 1.8}
        ringRepeatPeriod={d => d.repeatPeriod || 1600}

        // Communication Laser Arcs
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.025}
        arcStroke={1.0}
        arcDashLength={0.3}
        arcDashGap={1.0}
        arcDashAnimateTime={1500}
      />
    </div>
  );
});

export default Scene;
