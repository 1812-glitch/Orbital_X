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
  fleetData = [], 
  groundStations = [], 
  selectedSatIds = [],
  selectedStationId = null,
  onSelectStation = null,
  onSelectSatellite,
  showRings = true, 
  showLabels = true, 
  showUplinks = true, 
  showStationPins = true,
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

  // Handle auto rotation dynamically
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = autoRotate;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [autoRotate]);

  // Smoothly focus camera when a ground station is selected
  useEffect(() => {
    if (globeRef.current && selectedStationId && groundStations.length > 0) {
      const gs = groundStations.find(s => s._id === selectedStationId || s.stationId === selectedStationId);
      if (gs && gs.latitude !== undefined && gs.longitude !== undefined) {
        globeRef.current.pointOfView({ lat: gs.latitude, lng: gs.longitude, altitude: 1.85 }, 1200);
      }
    }
  }, [selectedStationId, groundStations]);

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
      stroke: 1.4,
      dashLength: 0.12,
      dashGap: 0.03,
      dashAnimateTime: 3000,
      coords: generateFixedOrbitalPath(sat, 120)
    }));
  }, [satellites, showRings]);

  // Combined Paths: Orbital Paths + Vertical Telemetry Beacon Lines Pointing to Ground Stations
  const allPaths = useMemo(() => {
    const paths = [...selectedOrbitalPaths];
    
    if (showStationPins && groundStations && groundStations.length > 0) {
      groundStations.forEach(gs => {
        const isSelected = selectedStationId && (gs._id === selectedStationId || gs.stationId === selectedStationId);
        const isOffline = gs.status === 'OFFLINE';
        const isDegraded = gs.status === 'DEGRADED';
        const color = isOffline ? '#FF2A2A' : isDegraded ? '#FFB020' : isSelected ? '#00F0FF' : '#00FF66';
        const beaconAlt = isSelected ? 0.35 : 0.24;

        // Vertical line pointing straight down into the ground station from high altitude
        paths.push({
          id: `station-beacon-${gs.stationId || gs._id}`,
          name: `${gs.name} Telemetry Beacon`,
          color,
          stroke: isSelected ? 2.8 : 1.8,
          dashLength: isSelected ? 0.15 : 0.25,
          dashGap: 0.04,
          dashAnimateTime: isSelected ? 1100 : 2200,
          coords: [
            [gs.latitude, gs.longitude, beaconAlt],
            [gs.latitude, gs.longitude, 0.003]
          ]
        });
      });
    }

    return paths;
  }, [selectedOrbitalPaths, showStationPins, groundStations, selectedStationId]);

  // Combined Points: Satellites + Top Beacon Points and Base Points on the Vertical Lines
  const allPoints = useMemo(() => {
    const pts = [...satellites];

    if (showStationPins && groundStations && groundStations.length > 0) {
      groundStations.forEach(gs => {
        const isSelected = selectedStationId && (gs._id === selectedStationId || gs.stationId === selectedStationId);
        const isOffline = gs.status === 'OFFLINE';
        const isDegraded = gs.status === 'DEGRADED';
        const color = isOffline ? '#FF2A2A' : isDegraded ? '#FFB020' : isSelected ? '#00F0FF' : '#00FF66';
        const beaconAlt = isSelected ? 0.35 : 0.24;

        // 1. Apex beacon dot at the top of the vertical line
        pts.push({
          lat: gs.latitude,
          lng: gs.longitude,
          alt: beaconAlt,
          color,
          radius: isSelected ? 0.38 : 0.22,
          isStationBeacon: true,
          station: gs,
          id: `beacon-apex-${gs.stationId || gs._id}`,
          name: `${gs.name} Beacon`
        });

        // 2. Base dot on the Earth surface
        pts.push({
          lat: gs.latitude,
          lng: gs.longitude,
          alt: 0.008,
          color,
          radius: isSelected ? 0.32 : 0.18,
          isStationBase: true,
          station: gs,
          id: `beacon-base-${gs.stationId || gs._id}`,
          name: gs.name
        });
      });
    }

    return pts;
  }, [satellites, showStationPins, groundStations, selectedStationId]);

  // Communication & signal transmission beams
  const arcs = useMemo(() => {
    if (!showUplinks || satellites.length === 0 || groundStations.length === 0) return [];
    
    const calculatedArcs = [];
    const activeTargets = satellites.filter(s => s.isSelected);

    activeTargets.forEach(sat => {
      const inRangeStations = groundStations.filter(gs => {
        const isDesignated = gs.connectedSatellites && gs.connectedSatellites.some(s => {
          const id = typeof s === 'object' ? (s.satelliteId || s._id) : s;
          return id === sat.id;
        });

        const distDeg = getAngularDistanceDeg(sat.lat, sat.lng, gs.latitude, gs.longitude);
        return isDesignated && distDeg <= 55;
      });

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

  // Stations receiving active signals or all ground stations for radar rings
  const allRings = useMemo(() => {
    if (!showRings) return [];
    if (groundStations && groundStations.length > 0) {
      return groundStations.map(gs => ({
        ...gs,
        isSelected: selectedStationId && (gs._id === selectedStationId || gs.stationId === selectedStationId)
      }));
    }
    const activeStationNames = new Set(arcs.map(a => a.stationName));
    return groundStations.filter(gs => activeStationNames.has(gs.name));
  }, [groundStations, selectedStationId, showRings, arcs]);

  const earthImageUrl = nightMode 
    ? "/textures/earth-night.jpg" 
    : "/textures/earth-blue-marble.jpg";

  return (
    <div ref={containerRef} className="w-full h-full bg-[#050810] relative rounded-lg overflow-hidden border border-gray-800 shadow-[0_0_40px_rgba(0,240,255,0.05)] cursor-move">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={earthImageUrl}
        bumpImageUrl="/textures/earth-topology.png"
        backgroundImageUrl="/textures/night-sky.png"
        
        // 1. Points: Satellites + Vertical Beacon Apex/Base markers
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointColor={d => d.color || d.slotColor || getHealthColor(d)}
        pointRadius={d => d.radius || (d.isSelected ? 0.32 : 0.18)}
        pointResolution={16}
        onPointClick={(d) => {
          if (d.isStationBeacon || d.isStationBase) {
            if (onSelectStation && d.station) onSelectStation(d.station);
          } else if (onSelectSatellite) {
            onSelectSatellite(d.id);
          }
        }}
        pointLabel={showLabels ? (d) => {
          if (d.isStationBeacon || d.isStationBase) {
            const gs = d.station;
            return `
              <div style="background: rgba(10, 15, 31, 0.95); padding: 8px 12px; border: 1px solid #00F0FF; border-radius: 6px; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(0,240,255,0.3);">
                <b style="color: #00F0FF; font-size: 12px;">📡 ${gs.name} (${gs.stationId})</b><br/>
                <span style="color: #d1d5db;">Location: ${gs.country} (${gs.latitude?.toFixed(2)}°, ${gs.longitude?.toFixed(2)}°)</span><br/>
                <span style="color: #00FF66; font-weight: bold;">STATUS: ${gs.status || 'ACTIVE'}</span><br/>
                <span style="color: #00F0FF; font-size: 10px;">Click to inspect ground station & diagnostics</span>
              </div>
            `;
          }
          return `
            <div style="background: rgba(10, 15, 31, 0.95); padding: 8px 12px; border: 1px solid ${d.slotColor || '#1f2937'}; border-radius: 6px; font-family: monospace; font-size: 11px; box-shadow: 0 0 15px rgba(0,0,0,0.8);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <b style="color: ${d.slotColor || '#00F0FF'}; font-size: 12px;">${d.id}</b>
                ${d.isSelected ? `<span style="background: ${d.slotColor}30; color: ${d.slotColor}; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">SLOT ${d.slotIdx + 1}</span>` : ''}
              </div>
              <div style="color: #d1d5db; font-size: 10px; margin-bottom: 2px;">${d.name} (${d.type})</div>
              <div style="color: #9ca3af; font-size: 10px;">
                STATUS: <span style="color: ${getHealthColor(d)}; font-weight: bold;">${d.status}</span> | ALT: ${d.altitudeKm ? d.altitudeKm.toLocaleString() : '550'} km (${d.type})
              </div>
            </div>
          `;
        } : () => ''}

        // 2. Trajectories & Vertical Telemetry Beacon Lines
        pathsData={allPaths}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathPointAlt={p => p[2]}
        pathColor={d => d.color}
        pathStroke={d => d.stroke || 1.4}
        pathDashLength={d => d.dashLength || 0.15}
        pathDashGap={d => d.dashGap || 0.04}
        pathDashAnimateTime={d => d.dashAnimateTime || 2500}
        pathResolution={3}

        // 3. Ground Station Labels & Text
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

        // 4. Ground Station Radar Broadcast Rings
        ringsData={allRings}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={d => (t) => d.isSelected 
          ? `rgba(0, 240, 255, ${Math.max(0, (1 - t) * 0.95)})`
          : `rgba(0, 255, 102, ${Math.max(0, (1 - t) * 0.45)})`
        }
        ringMaxRadius={d => d.isSelected ? 5.5 : 3.5}
        ringPropagationSpeed={d => d.isSelected ? 2.8 : 1.6}
        ringRepeatPeriod={d => d.isSelected ? 1000 : 1800}

        // 5. Laser Communication Links
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
      
      {/* Bottom Controls Legend */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <p className="text-gray-400 font-mono text-[11px] uppercase tracking-wider text-right bg-[#0A0F1F]/90 px-3 py-1.5 rounded border border-gray-800/80 backdrop-blur-sm shadow-md">
          Left Drag: Rotate • Scroll: Zoom • Click Station / Beacon to Focus
        </p>
      </div>
    </div>
  );
}
