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
  getSatelliteOrbitalState,
  generateOrbitalPath3DPoints,
  orientSatelliteMesh
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
 * 2. Photorealistic 4-Layer Earth:
 *    - High-resolution Blue Marble surface texture with ocean specular reflection and relief bump mapping
 *    - Subtle dynamic cloud canopy and radiant atmospheric Fresnel limb halo
 * 3. Satellite Selector & Tracker:
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
  timeScale = 1,
  isPaused = false,
  lightingMode = 'DAY',
  isNightMode = false
}, ref) {
  const containerRef = useRef();
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentGlobeMat, setCurrentGlobeMat] = useState(null);

  // Scene object references
  const concentricGroupRef = useRef(new THREE.Group());
  const starfieldRef = useRef(null);
  const atmosphereMeshRef = useRef(null);
  const deepSpaceRimRef = useRef(null);
  const cloudMeshRef = useRef(null);
  const surfaceShaderMatRef = useRef(null);

  const texturesLoadedRef = useRef(false);
  const texturesRef = useRef({});
  const simTimeRef = useRef(Date.now() / 1000);
  const satMeshesMapRef = useRef(new Map());
  const [arcTick, setArcTick] = useState(0);
  const lastArcTickTimeRef = useRef(0);
  const trackingTransitionUntilRef = useRef(0);

  // Expose reset camera and focus coordinates methods
  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1000);
      }
    },
    focusCoordinates: (lat, lng, altitude = 1.85, ms = 1000) => {
      if (globeRef.current && lat !== undefined && lng !== undefined) {
        globeRef.current.pointOfView({ lat, lng, altitude }, ms);
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

    if (day) {
      // Core Earth Surface Shader Material (Day/Night Mode Toggle with Instant Crisp Switch, Zero Terminator Line)
      if (!surfaceShaderMatRef.current) {
        const isNightVal = (lightingMode === 'NIGHT' || isNightMode) ? 1.0 : 0.0;
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            dayMap: { value: day },
            nightMap: { value: night || day },
            bumpMap: { value: bump },
            specularMap: { value: spec },
            isNight: { value: isNightVal },
            lightDirection: { value: new THREE.Vector3(0.5, 0.3, 1.0).normalize() }
          },
          vertexShader: EarthSurfaceShader.vertexShader,
          fragmentShader: EarthSurfaceShader.fragmentShader
        });
        surfaceShaderMatRef.current = mat;
        setCurrentGlobeMat(mat);
        if (globeRef.current?.globeMaterial) {
          globeRef.current.globeMaterial(mat);
        }
      }

      // Layer 2: Subtle Cloud Canopy (Radius 100.5)
      if (!cloudMeshRef.current && clouds) {
        const cloudGeo = new THREE.SphereGeometry(100.5, 64, 64);
        const cloudMat = new THREE.MeshStandardMaterial({
          map: clouds,
          transparent: true,
          opacity: 0.15,
          blending: THREE.NormalBlending,
          depthWrite: false
        });
        cloudMeshRef.current = new THREE.Mesh(cloudGeo, cloudMat);
        concentricGroupRef.current.add(cloudMeshRef.current);
      }

      // Layer 3: Atmospheric Fresnel Halo Sphere (Radius 102.5)
      if (!atmosphereMeshRef.current) {
        const atmoGeo = new THREE.SphereGeometry(102.5, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
          uniforms: {
            glowColor: { value: new THREE.Color(0x00d8ff) },
            intensity: { value: 0.70 }
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

      // Layer 4: Deep Space Outer Rim (R = 105.0)
      if (!deepSpaceRimRef.current) {
        const rimGeo = new THREE.SphereGeometry(105.0, 48, 48);
        const rimMat = new THREE.MeshBasicMaterial({
          color: 0x1a8fcc,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.02,
          depthWrite: false
        });
        deepSpaceRimRef.current = new THREE.Mesh(rimGeo, rimMat);
        concentricGroupRef.current.add(deepSpaceRimRef.current);
      }

      concentricGroupRef.current.visible = true;
    }
  };

  // Live Day / Night Lighting Mode Toggle (Updates shader uniform with zero terminator line)
  useEffect(() => {
    const isNightVal = (lightingMode === 'NIGHT' || isNightMode) ? 1.0 : 0.0;
    if (surfaceShaderMatRef.current) {
      surfaceShaderMatRef.current.uniforms.isNight.value = isNightVal;
    }
    if (atmosphereMeshRef.current?.material?.uniforms?.glowColor) {
      const isNight = isNightVal === 1.0;
      atmosphereMeshRef.current.material.uniforms.glowColor.value = new THREE.Color(
        isNight ? 0x0088ff : 0x00d8ff
      );
      atmosphereMeshRef.current.material.uniforms.intensity.value = isNight ? 0.85 : 0.70;
    }
  }, [lightingMode, isNightMode]);

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
      }

      // Propagate ALL satellites along their exact 3D Keplerian orbits at 60 FPS
      const globe = globeRef.current;
      if (globe && satMeshesMapRef.current && satellites.length > 0) {
        satellites.forEach(sat => {
          const mesh = satMeshesMapRef.current.get(sat.id);
          const state = getSatelliteOrbitalState(sat, simTimeRef.current, globe);
          if (mesh) {
            orientSatelliteMesh(mesh, state);
          }
          sat._liveLat = state.lat;
          sat._liveLng = state.lng;
          sat._liveCoords = state;
        });

        // Dynamic camera tracking: View perspective is Me (screen/camera) -> CubeSat (in front) -> 3D Earth (behind)
        if (followTracking && selectedSatIds.length > 0) {
          const targetId = trackedSatId || selectedSatIds[0];
          const trackedSat = satellites.find(s => s.id === targetId);
          if (trackedSat && trackedSat._liveCoords) {
            const coords = trackedSat._liveCoords;
            // Lock camera directly on radial ray through Earth Center -> CubeSat -> Camera
            if (time > trackingTransitionUntilRef.current) {
              const currentPov = globe.pointOfView();
              globe.pointOfView({
                lat: coords.lat,
                lng: coords.lng,
                altitude: currentPov?.altitude || 1.65
              }, 0);
            }
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
  }, [isPaused, timeScale, followTracking, selectedSatIds, trackedSatId, satellites]);

  // Initial smooth flight to satellite when tracking is activated or target changes
  const lastTrackedTargetRef = useRef(null);
  useEffect(() => {
    if (!followTracking || selectedSatIds.length === 0 || !globeRef.current) {
      lastTrackedTargetRef.current = null;
      return;
    }
    const targetId = trackedSatId || selectedSatIds[0];
    const trackedSat = satellites.find(s => s.id === targetId);
    if (trackedSat && lastTrackedTargetRef.current !== targetId) {
      lastTrackedTargetRef.current = targetId;
      trackingTransitionUntilRef.current = performance.now() + 650;
      const initialLat = trackedSat._liveLat !== undefined ? trackedSat._liveLat : trackedSat.lat;
      const initialLng = trackedSat._liveLng !== undefined ? trackedSat._liveLng : trackedSat.lng;
      if (initialLat !== undefined && initialLng !== undefined) {
        globeRef.current.pointOfView({
          lat: initialLat,
          lng: initialLng,
          altitude: 1.65
        }, 600);
      }
    }
  }, [followTracking, selectedSatIds, trackedSatId, satellites]);

  // Light Orbital Paths for ALL Satellites + Highlighted Glowing Path for the Selected Satellite
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

  // 3D Orbital Trajectory Paths Generation
  // Generates closed 3D loops in Three.js coordinates (no cuts through Earth, exact match with satellite motion)
  useEffect(() => {
    const group = orbitalRingsGroupRef.current;
    if (!group) return;

    // Clean up existing meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      group.remove(child);
    }

    if (!satellites || satellites.length === 0) return;

    const activeSatId = selectedSatIds.length > 0 ? selectedSatIds[0] : trackedSatId;

    satellites.forEach((sat) => {
      const isSelected = sat.id === activeSatId;

      // When showRings is toggled off, only render the highlighted selected satellite path
      if (!showRings && !isSelected) return;

      const path3D = generateOrbitalPath3DPoints(sat, isSelected ? 240 : 120);
      const points = path3D.map(p => new THREE.Vector3(p.x, p.y, p.z));
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      if (isSelected) {
        // 1. HIGHLIGHTED SELECTED PATH: Ultra-vibrant core line
        const lineColor = sat.slotColor || '#00F0FF';
        const coreMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(lineColor),
          linewidth: 3,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const coreLoop = new THREE.LineLoop(geom, coreMat);
        coreLoop.userData = { satId: sat.id };
        group.add(coreLoop);

        // 2. Volumetric Glowing Neon Aura Tube around highlighted path
        try {
          const curve = new THREE.CatmullRomCurve3(points, true);
          const tubeGeom = new THREE.TubeGeometry(curve, 180, 0.45, 8, true);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(lineColor),
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
          tubeMesh.userData = { satId: sat.id };
          group.add(tubeMesh);
        } catch (e) {
          console.warn('Tube geom generation fallback', e);
        }
      } else {
        // 3. NON-SELECTED PATHS: Sleek, subtle orbital trace with orbit type color
        const orbitColor = sat.orbitColor || '#00F0FF';
        const traceMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(orbitColor),
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const traceLoop = new THREE.LineLoop(geom, traceMat);
        traceLoop.userData = { satId: sat.id };
        group.add(traceLoop);
      }
    });
  }, [satellites, selectedSatIds, trackedSatId, showRings]);

  // Ground Station Radar Broadcast Rings (Station pulses only - no moving lines on Earth)
  const allRings = useMemo(() => {
    if (!showRings) return [];
    const rings = [];

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
  }, [groundStations, selectedStationId, showRings]);

  // Handle click on canvas to select orbital path or satellite
  const handleCanvasClick = (event) => {
    if (!containerRef.current || !globeRef.current || !onSelectSatellite) return;
    const scene = globeRef.current.scene();
    const camera = globeRef.current.camera();
    if (!scene || !camera) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 2.5 };
    raycaster.setFromCamera(mouse, camera);

    if (orbitalRingsGroupRef.current) {
      const intersects = raycaster.intersectObjects(orbitalRingsGroupRef.current.children, true);
      if (intersects.length > 0) {
        for (let hit of intersects) {
          const satId = hit.object?.userData?.satId;
          if (satId) {
            onSelectSatellite(satId);
            return;
          }
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCanvasClick}
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
            orientSatelliteMesh(mesh, state);
          }
          return mesh;
        }}
        customThreeObjectUpdate={(obj, d) => {
          satMeshesMapRef.current.set(d.id, obj);
          if (globeRef.current) {
            const state = getSatelliteOrbitalState(d, simTimeRef.current, globeRef.current);
            orientSatelliteMesh(obj, state);
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

        // Ground Station Broadcast Rings
        ringsData={allRings}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={d => (t) => {
          return d.isSelected 
            ? `rgba(0, 240, 255, ${Math.max(0, (1 - t) * 0.95)})`
            : `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.45)})`;
        }}
        ringMaxRadius={d => d.maxRadius || 5.0}
        ringPropagationSpeed={d => d.propagationSpeed || 2.2}
        ringRepeatPeriod={d => d.repeatPeriod || 1200}
      />
    </div>
  );
});

export default Scene;
