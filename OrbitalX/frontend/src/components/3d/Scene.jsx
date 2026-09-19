import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import {
  SAT_SLOT_COLORS,
  getAngularDistanceDeg,
  calculateVisualAltitude,
  generateFixedOrbitalPath,
  isCubeSatType,
} from '../../utils/orbitalMath';

export default function Scene({ 
  fleetData, 
  groundStations = [], 
  selectedSatIds = [],
  onSelectSatellite,
  showRings = true, 
  showLabels = true, 
  showUplinks = true, 
  nightMode = true, 
  autoRotate = true,
  showOverlay = false
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
      globeRef.current.controls().autoRotateSpeed = 0.4;
    }
  }, [autoRotate]);

  // Define status colors
  const getHealthColor = (d) => {
    if (d.status === 'OFFLINE') return '#FF2A2A'; // Red
    if (d.health < 80 || d.status === 'WARNING') return '#FFB020'; // Yellow
    return '#00F0FF'; // Cyan
  };

  // Format fleet data for Globe with altitude strictly mapped to real physical altitude
  const satellites = useMemo(() => {
    return fleetData
      .filter(d => d.telemetry)
      .map(d => {
        const satId = d.satellite.satelliteId;
        const slotIdx = selectedSatIds.indexOf(satId);
        const isSelected = slotIdx !== -1;
        const slotColor = isSelected ? SAT_SLOT_COLORS[slotIdx] : null;
        const isCubeSat = isCubeSatType(d.satellite);
        
        // Accurate altitude scaling according to real physical telemetry
        const realAltitudeKm = d.telemetry.altitude || (d.satellite.orbitRadius ? d.satellite.orbitRadius - 6371 : null);
        const alt = calculateVisualAltitude(realAltitudeKm, d.satellite.orbitType);

        return {
          lat: d.telemetry.latitude,
          lng: d.telemetry.longitude,
          alt,
          altitudeKm: Math.round(realAltitudeKm || (d.satellite.orbitType === 'GEO' ? 35786 : d.satellite.orbitType === 'MEO' ? 20200 : 550)),
          id: satId,
          name: d.satellite.name,
          type: d.satellite.type || (isCubeSat ? 'CUBESAT' : 'SATELLITE'),
          status: d.satellite.status,
          health: d.telemetry.health || 95,
          speed: d.telemetry.speed || 7.6,
          inclination: d.satellite.inclination || (isCubeSat ? 97.4 : 51.6),
          isSelected,
          slotIdx,
          slotColor
        };
      });
  }, [fleetData, selectedSatIds]);

  // Memoize stable 3D Orbital Trajectory Paths for selected satellites (max 3)
  const selectedOrbitalPaths = useMemo(() => {
    if (!showRings) return [];
    const selected = satellites.filter(s => s.isSelected);
    return selected.map((sat) => ({
      id: sat.id,
      name: `${sat.id} Orbital Path`,
      color: sat.slotColor,
      stroke: 1.4, // Sleek, thin laser line
      coords: generateFixedOrbitalPath(sat, 120)
    }));
  }, [satellites, showRings]);

  // Communication & signal transmission beams (ONLY rendered when in line of sight)
  const arcs = useMemo(() => {
    if (!showUplinks || satellites.length === 0 || groundStations.length === 0) return [];
    
    const calculatedArcs = [];
    // Only generate communication beams for SELECTED satellites
    const activeTargets = satellites.filter(s => s.isSelected);

    activeTargets.forEach(sat => {
      // Find connected stations that are physically in Line of Sight (LOS <= 55 degrees)
      const inRangeStations = groundStations.filter(gs => {
        // Must be a designated connected station or nearby station
        const isDesignated = gs.connectedSatellites && gs.connectedSatellites.some(s => {
          const id = typeof s === 'object' ? (s.satelliteId || s._id) : s;
          return id === sat.id;
        });

        const distDeg = getAngularDistanceDeg(sat.lat, sat.lng, gs.latitude, gs.longitude);
        // Only establish active radio link if station is in line of sight (<= 55 deg above horizon)
        return isDesignated && distDeg <= 55;
      });

      // If designated station is currently in LOS, render clean, low-altitude laser beam
      inRangeStations.forEach(gs => {
        const color = sat.slotColor || '#00F0FF';
        calculatedArcs.push({
          satId: sat.id,
          startLat: sat.lat,
          startLng: sat.lng,
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
  }, [showUplinks, satellites, groundStations]);

  // Stations receiving active signals for radar broadcast rings
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
        pointRadius={d => d.isSelected ? 0.32 : 0.18}
        pointResolution={16}
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
              STATUS: <span style="color: ${getHealthColor(d)}; font-weight: bold;">${d.status}</span> | ALT: ${d.altitudeKm ? d.altitudeKm.toLocaleString() : '550'} km (${d.type})
            </div>
            ${d.isSelected ? `
              <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #374151; color: #00FF66; font-size: 9px;">
                ● ACTIVE ORBITAL PATH PROJECTED
              </div>
            ` : `
              <div style="margin-top: 4px; color: #6b7280; font-size: 9px;">Click to toggle 3D orbital trajectory</div>
            `}
          </div>
        ` : () => ''}

        // 2. Stable 3D Orbital Trajectory Paths (Max 3, sleek & close to Earth)
        pathsData={selectedOrbitalPaths}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathPointAlt={p => p[2]}
        pathColor={d => d.color}
        pathStroke={1.4}
        pathDashLength={0.12}
        pathDashGap={0.03}
        pathDashAnimateTime={3000}
        pathResolution={3}

        // 3. Ground Stations (Clean Labels & Dots)
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.2}
        labelDotRadius={0.4}
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

        // 4. Subtle Ground Station Radar Broadcast Rings for stations in active contact
        ringsData={activeReceivingStations}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t) => `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.5)})`}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1400}

        // 5. Line-of-Sight Laser Communication Beams (Low altitude, directly to station)
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.025} // Low altitude direct laser link (NEVER shoots out into space)
        arcStroke={1.0}
        arcDashLength={0.3}
        arcDashGap={1.0}
        arcDashAnimateTime={1500}
      />
      
      {/* Viewport Overlay UI: Status Badge (Optional, disabled in OrbitalViewer to avoid overlapping with top toolbar) */}
      {showOverlay && (
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
      )}
      
      {/* Bottom Controls Legend */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <p className="text-gray-500 font-mono text-[11px] uppercase tracking-wider text-right bg-[#0A0F1F]/80 px-3 py-1.5 rounded border border-gray-800/80 backdrop-blur-sm">
          Left Drag: Rotate Globe • Scroll: Zoom • Click Sat: Select (Max 3)
        </p>
      </div>
    </div>
  );
}
