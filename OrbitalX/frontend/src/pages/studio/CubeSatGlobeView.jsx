import React, { useState, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { calculateVisualAltitude, getAngularDistanceDeg, getSatSeed } from '../../utils/orbitalMath';
import { buildOrbitalRingMesh, buildGlobeSatMesh } from './utils/buildGlobeMeshes';
import GlobeControlsHud from './components/GlobeControlsHud';
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
  const [dimensions, setDimensions] = useState({ width: 800, height: 460 });
  const [nightMode, setNightMode] = useState(true);
  const [followSat, setFollowSat] = useState(false);
  const [autoRotateGlobe] = useState(false);

  // Throttled UI state (updated at 4-5 Hz for smooth UI)
  const [uiTelemetry, setUiTelemetry] = useState({
    lat: 0,
    lng: 0,
    heading: 0,
    activeStations: [],
    commArcs: [],
    connectedStationName: 'Searching for Ground Station...'
  });

  // Fast refs for 60 FPS animation loop
  const simTimeRef = useRef(Date.now() / 1000);
  const warpSpeedRef = useRef(warpSpeed);
  warpSpeedRef.current = warpSpeed;

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

  const satId = satellite?.satelliteId || 'CUBESAT-ION';
  const satName = satellite?.name || 'CubeSat Ion-X';
  const formFactor = satellite?.formFactor || '3U';
  const altitudeKm = satellite?.altitude || 512.4;
  const inclination = satellite?.attitude?.mode === 'SUN_TRACKING' ? 45.0 : 97.4;
  const visualAlt = Math.max(0.14, calculateVisualAltitude(altitudeKm, 'LEO'));
  const visualAltRef = useRef(visualAlt);
  visualAltRef.current = visualAlt;

  // Responsive container observer
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

  // Keplerian orbit computation helper
  const computeOrbitAt = useCallback((time) => {
    const periodSec = 5700;
    const meanMotion = (2 * Math.PI) / periodSec;
    const seed = getSatSeed(satId);
    const nodeLng = ((seed * 73) % 360) * (Math.PI / 180);
    const phaseOffset = (seed * 1.5) % (2 * Math.PI);

    const u = (time * meanMotion + phaseOffset) % (2 * Math.PI);
    const incRad = (inclination * Math.PI) / 180;

    const sinLat = Math.sin(incRad) * Math.sin(u);
    const lat = (Math.asin(Math.max(-1, Math.min(1, sinLat))) * (180 / Math.PI));

    const earthRot = (time * (2 * Math.PI / 86400)) % (2 * Math.PI);
    const lngInPlane = Math.atan2(Math.cos(incRad) * Math.sin(u), Math.cos(u));
    let lng = (nodeLng + lngInPlane - earthRot) * (180 / Math.PI);
    lng = (((((lng + 180) % 360) + 360) % 360) - 180);

    const dt = 0.8;
    const uNext = ((time + dt) * meanMotion + phaseOffset) % (2 * Math.PI);
    const sinLatNext = Math.sin(incRad) * Math.sin(uNext);
    const nextLat = (Math.asin(Math.max(-1, Math.min(1, sinLatNext))) * (180 / Math.PI));

    const earthRotNext = ((time + dt) * (2 * Math.PI / 86400)) % (2 * Math.PI);
    const lngInPlaneNext = Math.atan2(Math.cos(incRad) * Math.sin(uNext), Math.cos(uNext));
    let nextLng = (nodeLng + lngInPlaneNext - earthRotNext) * (180 / Math.PI);
    nextLng = (((((nextLng + 180) % 360) + 360) % 360) - 180);

    const heading = Math.round((Math.atan2(Math.cos(incRad), Math.cos(u)) * 180) / Math.PI);
    return { lat, lng, nextLat, nextLng, heading };
  }, [satId, inclination]);

  // Synchronize 3D Mesh and Orbital Ring in Three.js scene
  useEffect(() => {
    let checkInterval = null;
    const attachObjects = () => {
      if (!globeRef.current?.scene) return false;
      const scene = globeRef.current.scene();
      if (!scene) return false;

      if (satMeshRef.current) scene.remove(satMeshRef.current);
      const newMesh = buildGlobeSatMesh({ formFactor, solarPanelsDeployed, status, ledRef, plumeRef });
      satMeshRef.current = newMesh;
      scene.add(newMesh);

      if (ringMeshRef.current) scene.remove(ringMeshRef.current);
      const newRing = buildOrbitalRingMesh(satId, inclination, visualAltRef.current);
      ringMeshRef.current = newRing;
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
  }, [formFactor, solarPanelsDeployed, status, satId, inclination]);

  // 60 FPS Native Three.js Orbiting & Animation Loop
  useEffect(() => {
    let animFrameId;
    let lastTime = performance.now();
    let lastUiUpdate = 0;

    const tick = (now) => {
      animFrameId = requestAnimationFrame(tick);
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      simTimeRef.current += deltaSec * (warpSpeedRef.current || 15);
      const currentTime = simTimeRef.current;
      const globe = globeRef.current;
      const satMesh = satMeshRef.current;

      if (globe && satMesh && typeof globe.getCoords === 'function') {
        const { lat, lng, nextLat, nextLng, heading } = computeOrbitAt(currentTime);
        lastPosRef.current = { lat, lng, heading };

        const p0 = globe.getCoords(lat, lng, visualAltRef.current);
        if (p0) {
          satMesh.position.set(p0.x, p0.y, p0.z);
          const p1 = globe.getCoords(nextLat, nextLng, visualAltRef.current);
          if (p1) {
            satMesh.up.set(p0.x, p0.y, p0.z).normalize();
            satMesh.lookAt(p1.x, p1.y, p1.z);
          }
        }

        if (ringMeshRef.current) {
          const earthRot = (currentTime * (2 * Math.PI / 86400)) % (2 * Math.PI);
          ringMeshRef.current.rotation.y = -earthRot;
        }

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

        if (ledRef.current) {
          const st = statusRef.current;
          const blinkSpeed = st === 'SAFE_MODE' ? 0.008 : st === 'SCIENCE_ACQUISITION' ? 0.02 : 0.01;
          ledRef.current.material.opacity = Math.sin(now * blinkSpeed) > 0 ? 1.0 : 0.25;
        }

        if (followSatRef.current && !isTransitioningRef.current) {
          globe.pointOfView({ lat, lng, altitude: 1.8 }, 0);
        }

        if (now - lastUiUpdate > 250) {
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
            onTelemetryUpdateRef.current({ lat, lng, alt: visualAltRef.current });
          }
        }
      }
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [computeOrbitAt]);

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

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = autoRotateGlobe && !followSat;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotateGlobe, followSat]);

  const earthImageUrl = nightMode ? '/textures/earth-night.jpg' : '/textures/earth-blue-marble.jpg';

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#050810] rounded-lg overflow-hidden border border-gray-800 shadow-2xl">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={earthImageUrl}
        bumpImageUrl="/textures/earth-topology.png"
        backgroundImageUrl="/textures/night-sky.png"
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.1}
        labelDotRadius={0.45}
        labelColor={(gs) => (uiTelemetry.activeStations.some((a) => a.name === gs.name) ? '#00FF66' : '#00F0FF')}
        labelResolution={2}
        labelIncludeDot={true}
        ringsData={uiTelemetry.activeStations}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t) => `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.6)})`}
        ringMaxRadius={4.5}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1200}
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

      <GlobeControlsHud
        nightMode={nightMode}
        setNightMode={setNightMode}
        warpSpeed={warpSpeed}
        setWarpSpeed={setWarpSpeed}
        followSat={followSat}
        onToggleFollow={handleToggleFollow}
      />

      <GlobeTelemetryBar
        satName={satName}
        formFactor={formFactor}
        uiTelemetry={uiTelemetry}
      />
    </div>
  );
}

export default React.memo(CubeSatGlobeView);
