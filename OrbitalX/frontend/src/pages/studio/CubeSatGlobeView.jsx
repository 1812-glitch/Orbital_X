import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import {
  calculateVisualAltitude,
  generateFixedOrbitalPath,
  getAngularDistanceDeg,
  getSatSeed
} from '../../utils/orbitalMath';
import { 
  Sun, 
  Moon, 
  Compass, 
  Crosshair, 
  RotateCw, 
  Radio, 
  Zap,
  Eye,
  Maximize2
} from 'lucide-react';

export default function CubeSatGlobeView({
  satellite,
  status = 'NOMINAL',
  solarPanelsDeployed = true,
  isThrusting = false,
  groundStations = [],
  warpSpeed = 15,
  setWarpSpeed,
  onTelemetryUpdate
}) {
  const containerRef = useRef();
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 460 });
  const [nightMode, setNightMode] = useState(true);
  const [followSat, setFollowSat] = useState(false);
  const [simTime, setSimTime] = useState(Date.now() / 1000);
  const [autoRotateGlobe, setAutoRotateGlobe] = useState(false);

  // Responsive dimensions
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

  const satId = satellite?.satelliteId || 'CUBESAT-ION';
  const satName = satellite?.name || 'CubeSat Ion-X';
  const formFactor = satellite?.formFactor || '3U';
  const altitudeKm = satellite?.altitude || 512.4;
  const inclination = satellite?.attitude?.mode === 'SUN_TRACKING' ? 45.0 : 97.4;
  const visualAlt = calculateVisualAltitude(altitudeKm, 'LEO');

  // Real-time orbital propagation loop: makes CubeSat orbit around the WHOLE Earth
  useEffect(() => {
    let lastTime = performance.now();
    let animFrameId;

    const tick = (now) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      // Advance sim time according to warp multiplier
      setSimTime((prev) => prev + deltaSec * (warpSpeed || 15));
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [warpSpeed]);

  // Compute live latitude and longitude around the entire planet
  const { currentLat, currentLng, orbitHeading } = useMemo(() => {
    const periodSec = 5700; // ~95 min LEO period
    const meanMotion = (2 * Math.PI) / periodSec;
    const seed = getSatSeed(satId);
    const nodeLng = ((seed * 73) % 360) * (Math.PI / 180);
    const phaseOffset = (seed * 1.5) % (2 * Math.PI);

    const u = (simTime * meanMotion + phaseOffset) % (2 * Math.PI);
    const incRad = (inclination * Math.PI) / 180;

    const sinLat = Math.sin(incRad) * Math.sin(u);
    const lat = parseFloat((Math.asin(Math.max(-1, Math.min(1, sinLat))) * (180 / Math.PI)).toFixed(4));

    const earthRot = (simTime * (2 * Math.PI / 86400)) % (2 * Math.PI);
    const lngInPlane = Math.atan2(Math.cos(incRad) * Math.sin(u), Math.cos(u));
    let lng = (nodeLng + lngInPlane - earthRot) * (180 / Math.PI);
    lng = parseFloat((((((lng + 180) % 360) + 360) % 360) - 180).toFixed(4));

    // Instantaneous orbital velocity heading vector
    const heading = Math.round((Math.atan2(Math.cos(incRad), Math.cos(u)) * 180) / Math.PI);

    return { currentLat: lat, currentLng: lng, orbitHeading: heading };
  }, [simTime, satId, inclination]);

  // Push live position back to parent if callback provided
  useEffect(() => {
    if (onTelemetryUpdate) {
      onTelemetryUpdate({
        lat: currentLat,
        lng: currentLng,
        alt: visualAlt
      });
    }
  }, [currentLat, currentLng, visualAlt, onTelemetryUpdate]);

  // Camera tracking: follow CubeSat as it orbits
  useEffect(() => {
    if (followSat && globeRef.current) {
      globeRef.current.pointOfView(
        {
          lat: currentLat,
          lng: currentLng,
          altitude: 1.8
        },
        300
      );
    }
  }, [followSat, currentLat, currentLng]);

  // Auto-rotate globe
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = autoRotateGlobe;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotateGlobe]);

  // 1. Stable 3D Orbital Path around the WHOLE Earth
  const orbitalPathData = useMemo(() => {
    const coords = generateFixedOrbitalPath(
      {
        id: satId,
        inclination,
        alt: visualAlt
      },
      160
    );
    return [
      {
        id: `${satId}-path`,
        coords,
        color: '#00F0FF',
        stroke: 1.6
      }
    ];
  }, [satId, inclination, visualAlt]);

  // 2. Active Ground Stations in Line-of-Sight & Communication Laser Beams
  const { commArcs, activeStations, connectedStationName } = useMemo(() => {
    const arcs = [];
    let connectedName = 'Searching for Ground Station...';

    const inRange = (groundStations || []).filter((gs) => {
      const distDeg = getAngularDistanceDeg(currentLat, currentLng, gs.latitude, gs.longitude);
      return distDeg <= 52; // LOS footprint
    });

    if (inRange.length > 0) {
      const primaryGs = inRange[0];
      connectedName = `${primaryGs.name} (${primaryGs.stationId})`;

      inRange.forEach((gs) => {
        arcs.push({
          startLat: currentLat,
          startLng: currentLng,
          endLat: gs.latitude,
          endLng: gs.longitude,
          color: ['#00F0FF', '#00FF66'],
          name: gs.name
        });
      });
    }

    return {
      commArcs: arcs,
      activeStations: inRange,
      connectedStationName: connectedName
    };
  }, [currentLat, currentLng, groundStations]);

  // 3. Custom 3D CubeSat Object Model for the Globe
  const cubeSatObjects = useMemo(() => {
    return [
      {
        lat: currentLat,
        lng: currentLng,
        alt: visualAlt,
        id: satId,
        name: satName,
        status,
        formFactor,
        solarPanelsDeployed,
        isThrusting
      }
    ];
  }, [currentLat, currentLng, visualAlt, satId, satName, status, formFactor, solarPanelsDeployed, isThrusting]);

  const createCubeSatMesh = (d) => {
    const group = new THREE.Group();
    const is6U = d.formFactor === '6U';
    const w = is6U ? 1.6 : 0.8;
    const h = 2.4;
    const depth = 0.8;

    // CubeSat Body Chassis
    const busGeo = new THREE.BoxGeometry(w, h, depth);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0x141b2d,
      metalness: 0.85,
      roughness: 0.3
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    group.add(bus);

    // Silicon solar cells on body
    const cellGeo = new THREE.BoxGeometry(w * 0.9, h * 0.9, depth + 0.04);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x051336,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x001533,
      emissiveIntensity: 0.5
    });
    const cells = new THREE.Mesh(cellGeo, cellMat);
    group.add(cells);

    // Deployable Solar Wings
    const wingW = 1.4;
    const wingH = h * 0.85;
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x003366,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x002244,
      emissiveIntensity: 0.6
    });

    // Left Wing (Hinged at front-left, extends outward along -X when deployed, folds along side when stowed)
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, 0.05), wingMat);
    if (d.solarPanelsDeployed) {
      leftWing.position.set(-w / 2 - wingW / 2, 0, 0);
    } else {
      leftWing.position.set(-w / 2 - 0.03, 0, -wingW / 2 + depth / 2);
      leftWing.rotation.y = Math.PI / 2; // folded flush along side wall
    }
    group.add(leftWing);

    // Right Wing (Hinged at front-right, extends outward along +X when deployed, folds along side when stowed)
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, 0.05), wingMat);
    if (d.solarPanelsDeployed) {
      rightWing.position.set(w / 2 + wingW / 2, 0, 0);
    } else {
      rightWing.position.set(w / 2 + 0.03, 0, -wingW / 2 + depth / 2);
      rightWing.rotation.y = -Math.PI / 2; // folded flush along side wall
    }
    group.add(rightWing);

    // Gold Rail Edges
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    const railGeo = new THREE.BoxGeometry(0.06, h + 0.05, 0.06);
    [[-w / 2, -depth / 2], [w / 2, -depth / 2], [-w / 2, depth / 2], [w / 2, depth / 2]].forEach(([rx, rz]) => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(rx, 0, rz);
      group.add(rail);
    });

    // Status Beacon LED
    const ledGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const ledColor = d.status === 'SAFE_MODE' ? 0xff2a2a : d.status === 'SCIENCE_ACQUISITION' ? 0x00f0ff : 0x00ff66;
    const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, h / 2 + 0.12, 0);
    group.add(led);

    // Glowing Cold-Gas Thruster Plume (Warm Orange Plume)
    if (d.isThrusting || d.status === 'THRUSTER_BURN') {
      const plumeGeo = new THREE.ConeGeometry(0.45, 1.8, 16);
      const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
      const plume = new THREE.Mesh(plumeGeo, plumeMat);
      plume.rotation.x = Math.PI;
      plume.position.set(0, -h / 2 - 0.9, 0);
      group.add(plume);
    }

    // Scale proportional to Earth visualization
    group.scale.set(1.4, 1.4, 1.4);
    return group;
  };

  const earthImageUrl = nightMode
    ? '//unpkg.com/three-globe/example/img/earth-night.jpg'
    : '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#050810] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
      
      {/* --- 3D EARTH GLOBE PLUGIN --- */}
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={earthImageUrl}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // 1. Custom 3D CubeSat Model moving along its orbit
        objectsData={cubeSatObjects}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectThreeObject={createCubeSatMesh}

        // 2. Full 3D Orbital Trajectory wrapping the whole Earth
        pathsData={orbitalPathData}
        pathPoints="coords"
        pathPointLat={(p) => p[0]}
        pathPointLng={(p) => p[1]}
        pathPointAlt={(p) => p[2]}
        pathColor={() => '#00F0FF'}
        pathStroke={1.8}
        pathDashLength={0.12}
        pathDashGap={0.03}
        pathDashAnimateTime={2400}
        pathResolution={3}

        // 3. Ground Stations Labels & Dots
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.1}
        labelDotRadius={0.45}
        labelColor={(gs) => (activeStations.some((a) => a.name === gs.name) ? '#00FF66' : '#00F0FF')}
        labelResolution={2}
        labelIncludeDot={true}

        // 4. Active Ground Station Radar Broadcast Rings
        ringsData={activeStations}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t) => `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.6)})`}
        ringMaxRadius={4.5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1200}

        // 5. Line-of-Sight Laser Communication Downlink Beams
        arcsData={commArcs}
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

      {/* --- HUD CONTROLS: DAY/NIGHT TOGGLE, ORBIT SPEED WARP & CAMERA FOLLOW --- */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
        
        {/* Day / Night Toggle (Requested by User) */}
        <div className="flex items-center bg-[#0A0F1F]/90 border border-gray-800 rounded-lg p-0.5 backdrop-blur-md shadow-lg">
          <button
            id="earth-toggle-day-btn"
            onClick={() => setNightMode(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all ${
              !nightMode
                ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Switch to Daytime Blue Marble Earth"
          >
            <Sun size={13} className={!nightMode ? 'text-black' : 'text-[#FFB000]'} />
            <span>DAY</span>
          </button>
          <button
            id="earth-toggle-night-btn"
            onClick={() => setNightMode(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all ${
              nightMode
                ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Switch to Night Lights Earth"
          >
            <Moon size={13} className={nightMode ? 'text-black' : 'text-[#00F0FF]'} />
            <span>NIGHT</span>
          </button>
        </div>

        {/* Orbit Speed Warp Toggle */}
        <div className="flex items-center bg-[#0A0F1F]/90 border border-gray-800 rounded-lg p-0.5 backdrop-blur-md text-xs font-mono">
          <span className="text-gray-500 px-2 flex items-center">
            <RotateCw size={11} className="mr-1" /> WARP:
          </span>
          {[1, 5, 15, 30, 60].map((w) => (
            <button
              key={w}
              onClick={() => setWarpSpeed(w)}
              className={`px-2 py-1 rounded transition-colors ${
                warpSpeed === w
                  ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {w}x
            </button>
          ))}
        </div>

        {/* Camera Tracking Toggle */}
        <button
          onClick={() => setFollowSat(!followSat)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-xs backdrop-blur-md border transition-all ${
            followSat
              ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] font-bold shadow-[0_0_12px_rgba(0,255,102,0.3)]'
              : 'bg-[#0A0F1F]/90 border-gray-800 text-gray-400 hover:text-white'
          }`}
          title="Toggle camera following CubeSat in orbit"
        >
          <Crosshair size={13} className={followSat ? 'animate-spin' : ''} />
          <span>{followSat ? 'TRACKING CUBESAT' : 'FREE CAMERA'}</span>
        </button>
      </div>

      {/* --- BOTTOM HUD BAR: LIVE SUB-SATELLITE GROUND TRACK TELEMETRY --- */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xl z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
            <span className="text-white font-bold">{satName} ({formFactor})</span>
          </div>
          <div className="text-gray-400">
            POSITION: <strong className="text-white">{currentLat >= 0 ? `${currentLat}° N` : `${Math.abs(currentLat)}° S`}, {currentLng >= 0 ? `${currentLng}° E` : `${Math.abs(currentLng)}° W`}</strong>
          </div>
          <div className="text-gray-400 hidden sm:inline">
            HEADING: <strong className="text-[#00F0FF]">{orbitHeading}°</strong>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Radio size={12} className={activeStations.length > 0 ? 'text-[#00FF66] animate-pulse' : 'text-gray-500'} />
            <span className="text-gray-400">LINK: </span>
            <span className={activeStations.length > 0 ? 'text-[#00FF66] font-semibold' : 'text-gray-500'}>
              {connectedStationName}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
