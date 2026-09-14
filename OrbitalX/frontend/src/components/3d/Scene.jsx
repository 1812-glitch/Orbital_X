import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { SAT_SLOT_COLORS } from './OrbitingSatellitesPanel';

export default function Scene({ 
  fleetData, 
  groundStations = [], 
  selectedSatIds = [],
  onSelectSatellite,
  showRings = true, 
  showLabels = true, 
  showUplinks = true, 
  nightMode = true, 
  autoRotate = true 
}) {
  const containerRef = useRef();
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Handle responsive sizing
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

  // Handle auto rotation
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = autoRotate;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate]);

  // Define colors helper
  const getHealthColor = (d) => {
    if (d.status === 'OFFLINE') return '#FF2A2A'; // Red
    if (d.health < 80 || d.status === 'WARNING') return '#FFB020'; // Yellow
    return '#00F0FF'; // Cyan
  };

  // Format fleet data for Globe
  const satellites = useMemo(() => {
    return fleetData
      .filter(d => d.telemetry)
      .map(d => {
        const satId = d.satellite.satelliteId;
        const slotIdx = selectedSatIds.indexOf(satId);
        const isSelected = slotIdx !== -1;
        const slotColor = isSelected ? SAT_SLOT_COLORS[slotIdx] : null;

        return {
          lat: d.telemetry.latitude,
          lng: d.telemetry.longitude,
          alt: Math.max(0.06, (d.telemetry.altitude || 600) / 10000),
          id: satId,
          name: d.satellite.name,
          type: d.satellite.type || (satId.includes('CUBE') ? 'CUBESAT' : 'SATELLITE'),
          status: d.satellite.status,
          health: d.telemetry.health || 95,
          speed: d.telemetry.speed || 7.6,
          inclination: d.satellite.inclination || (satId.includes('CUBE') ? 97.4 : 51.6),
          isSelected,
          slotIdx,
          slotColor
        };
      });
  }, [fleetData, selectedSatIds]);

  // Generate a mathematically accurate 3D closed orbit loop passing through the satellite's exact position
  const generateOrbitalPath = (sat, numPoints = 120) => {
    const points = [];
    const lat0 = sat.lat * (Math.PI / 180);
    const lng0 = sat.lng * (Math.PI / 180);
    const alt = sat.alt;
    const inclinationDeg = sat.inclination || 51.6;
    const incRad = inclinationDeg * (Math.PI / 180);

    // Current position vector P on unit sphere
    const px = Math.cos(lat0) * Math.cos(lng0);
    const py = Math.sin(lat0);
    const pz = Math.cos(lat0) * Math.sin(lng0);

    // Tangent velocity direction in orbital plane at inclination incRad
    let cosLat = Math.cos(lat0);
    if (Math.abs(cosLat) < 0.001) cosLat = 0.001;
    let sinPsi = Math.cos(incRad) / cosLat;
    if (sinPsi > 1) sinPsi = 1;
    if (sinPsi < -1) sinPsi = -1;
    const cosPsi = Math.sqrt(Math.max(0, 1 - sinPsi * sinPsi));

    // Local East and North basis vectors
    const vx = sinPsi * (-Math.sin(lng0)) + cosPsi * (-Math.sin(lat0) * Math.cos(lng0));
    const vy = cosPsi * Math.cos(lat0);
    const vz = sinPsi * (Math.cos(lng0)) + cosPsi * (-Math.sin(lat0) * Math.sin(lng0));

    const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
    const tx = vx / vLen;
    const ty = vy / vLen;
    const tz = vz / vLen;

    // Generate circle coordinates
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const rx = px * Math.cos(theta) + tx * Math.sin(theta);
      const ry = py * Math.cos(theta) + ty * Math.sin(theta);
      const rz = pz * Math.cos(theta) + tz * Math.sin(theta);

      const latDeg = Math.asin(Math.max(-1, Math.min(1, ry))) * (180 / Math.PI);
      const lngDeg = Math.atan2(rz, rx) * (180 / Math.PI);
      points.push([latDeg, lngDeg, alt]);
    }
    return points;
  };

  // Memoize 3D Orbital Trajectory Paths for selected satellites (max 3)
  const selectedOrbitalPaths = useMemo(() => {
    const selected = satellites.filter(s => s.isSelected);
    return selected.map((sat) => ({
      id: sat.id,
      name: `${sat.id} Orbital Path`,
      color: sat.slotColor,
      stroke: 2.8,
      coords: generateOrbitalPath(sat, 120)
    }));
  }, [satellites]);

  // Memoize targeted communication & signal transmission arcs
  const arcs = useMemo(() => {
    if (!showUplinks || satellites.length === 0 || groundStations.length === 0) return [];
    
    const calculatedArcs = [];
    const selectedSats = satellites.filter(s => s.isSelected);
    // If satellites are explicitly selected, only render transmission arcs for those (up to 3)
    // Otherwise fallback to nearest links for general visual context
    const activeTargets = selectedSats.length > 0 ? selectedSats : satellites.slice(0, 3);

    activeTargets.forEach(sat => {
      // Find connected stations
      const connected = groundStations.filter(gs => {
        if (gs.connectedSatellites && gs.connectedSatellites.some(s => {
          const id = typeof s === 'object' ? (s.satelliteId || s._id) : s;
          return id === sat.id;
        })) {
          return true;
        }
        const dx = sat.lat - gs.latitude;
        const dy = sat.lng - gs.longitude;
        return Math.sqrt(dx * dx + dy * dy) < 65;
      });

      const stationsToLink = connected.length > 0 ? connected : [groundStations[0]];

      stationsToLink.forEach(gs => {
        const color = sat.slotColor || getHealthColor(sat);
        calculatedArcs.push({
          satId: sat.id,
          startLat: sat.lat,
          startLng: sat.lng,
          endLat: gs.latitude,
          endLng: gs.longitude,
          color: [color, `${color}40`],
          satColor: color,
          stationName: gs.name,
          stationId: gs.stationId,
          stroke: sat.isSelected ? 1.8 : 0.6,
          isHighPriority: sat.isSelected
        });
      });
    });

    return calculatedArcs;
  }, [showUplinks, satellites, groundStations]);

  // Stations receiving active signals for radar ping animation
  const activeReceivingStations = useMemo(() => {
    const activeStationNames = new Set(arcs.map(a => a.stationName));
    return groundStations.filter(gs => activeStationNames.has(gs.name));
  }, [arcs, groundStations]);

  const earthImageUrl = nightMode 
    ? "//unpkg.com/three-globe/example/img/earth-night.jpg" 
    : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  return (
    <div ref={containerRef} className="w-full h-full bg-[#050810] relative rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_40px_rgba(0,240,255,0.05)] cursor-move">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={earthImageUrl}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // 1. Satellite Points & Interactive Selection
        pointsData={satellites}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointColor={d => d.slotColor || getHealthColor(d)}
        pointRadius={d => d.isSelected ? 0.45 : 0.22}
        pointResolution={20}
        onPointClick={(d) => {
          if (onSelectSatellite) {
            onSelectSatellite(d.id);
          }
        }}
        pointLabel={showLabels ? (d) => `
          <div style="background: rgba(10, 15, 31, 0.95); padding: 8px 12px; border: 1px solid ${d.slotColor || '#1f2937'}; border-radius: 6px; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(0,0,0,0.8);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <b style="color: ${d.slotColor || '#00F0FF'}; font-size: 12px;">${d.id}</b>
              ${d.isSelected ? `<span style="background: ${d.slotColor}30; color: ${d.slotColor}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">SLOT ${d.slotIdx + 1}</span>` : ''}
            </div>
            <div style="color: #d1d5db; font-size: 10px; margin-bottom: 2px;">${d.name} (${d.type})</div>
            <div style="color: #9ca3af; font-size: 10px;">
              STATUS: <span style="color: ${getHealthColor(d)}; font-weight: bold;">${d.status}</span> | ALT: ${Math.round(d.alt * 10000)} km
            </div>
            ${d.isSelected ? `
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #374151; color: #00FF66; font-size: 9px;">
                ● TRANSMITTING SIGNALS TO GROUND NETWORK
              </div>
            ` : `
              <div style="margin-top: 4px; color: #6b7280; font-size: 9px;">Click to toggle 3D orbital trajectory</div>
            `}
          </div>
        ` : () => ''}

        // 2. 3D Orbital Trajectory Paths for Selected Satellites (Max 3)
        pathsData={selectedOrbitalPaths}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathPointAlt={p => p[2]}
        pathColor={d => d.color}
        pathStroke={d => d.stroke || 2.8}
        pathDashLength={0.15}
        pathDashGap={0.03}
        pathDashAnimateTime={2500}
        pathResolution={3}

        // 3. Ground Stations (Labels & Positioning)
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.4}
        labelDotRadius={0.6}
        labelColor={(gs) => {
          const isReceiving = arcs.some(a => a.stationName === gs.name);
          return isReceiving ? '#00FF66' : '#00F0FF';
        }}
        labelResolution={2}
        labelIncludeDot={true}
        labelLabel={(gs) => `
          <div style="background: rgba(10, 15, 31, 0.95); padding: 6px 10px; border: 1px solid #00F0FF; border-radius: 4px; font-family: monospace; font-size: 10px;">
            <b style="color: #00F0FF;">${gs.name} (${gs.stationId})</b><br/>
            <span style="color: #9ca3af;">Location: ${gs.country}</span><br/>
            <span style="color: #00FF66;">STATUS: ${gs.status}</span>
          </div>
        `}

        // 4. Active Ground Station Radar Broadcast Rings
        ringsData={activeReceivingStations}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t) => `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.7)})`}
        ringMaxRadius={7}
        ringPropagationSpeed={2.5}
        ringRepeatPeriod={1200}

        // 5. Communication Beams (Signal Transmission Arcs)
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={1.2}
        arcDashAnimateTime={1600}
        arcAltitudeAutoScale={0.25}
        arcStroke={d => d.stroke}
        
        // 6. Generic Orbital Rings for all assets when showRings is toggled
        customLayerData={showRings && selectedSatIds.length === 0 ? satellites : []}
        customThreeObject={(d) => {
          const r = 1 + d.alt; 
          const geometry = new THREE.RingGeometry(r - 0.004, r + 0.004, 64);
          const material = new THREE.MeshBasicMaterial({ 
            color: getHealthColor(d), 
            transparent: true, 
            opacity: 0.12,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          const phi = (90 - d.lat) * (Math.PI / 180);
          const theta = (d.lng + 180) * (Math.PI / 180);
          
          mesh.lookAt(
            new THREE.Vector3(
               r * Math.sin(phi) * Math.cos(theta),
               r * Math.cos(phi),
               r * Math.sin(phi) * Math.sin(theta)
            )
          );
          return mesh;
        }}
      />
      
      {/* Viewport Overlay UI: Status Badge */}
      <div className="absolute top-4 right-4 pointer-events-none flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-2 text-[10px] font-mono text-[#00F0FF] tracking-widest bg-[#00F0FF]/10 px-3 py-1.5 rounded border border-[#00F0FF]/30 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
          </span>
          <span>LIVE 3D ORBITAL SIMULATION</span>
        </div>

        {selectedSatIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-[#0A0F1F]/90 border border-gray-800 px-3 py-1.5 rounded-md backdrop-blur-md">
            <span className="text-[10px] font-mono text-gray-400">PROJECTING:</span>
            <div className="flex items-center space-x-1.5">
              {selectedSatIds.map((id, idx) => (
                <span 
                  key={id}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                  style={{ 
                    backgroundColor: `${SAT_SLOT_COLORS[idx]}25`, 
                    color: SAT_SLOT_COLORS[idx],
                    border: `1px solid ${SAT_SLOT_COLORS[idx]}60`
                  }}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Controls Legend */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <p className="text-gray-500 font-mono text-[11px] uppercase tracking-wider text-right bg-[#0A0F1F]/80 px-3 py-1.5 rounded border border-gray-800/80 backdrop-blur-sm">
          Left Drag: Rotate Globe • Scroll: Zoom • Click Sat: Select (Max 3)
        </p>
      </div>
    </div>
  );
}
