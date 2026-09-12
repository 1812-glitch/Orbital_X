import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

export default function Scene({ fleetData, groundStations = [], showRings, showLabels, showUplinks, nightMode, autoRotate = true }) {
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
  const getColor = (d) => {
    if (d.status === 'OFFLINE') return '#FF2A2A'; // Red
    if (d.health < 80 || d.status === 'WARNING') return '#FFB020'; // Yellow
    return '#00F0FF'; // Cyan
  };

  // Memoize formatted fleet data for Globe
  const satellites = useMemo(() => {
    return fleetData
      .filter(d => d.telemetry)
      .map(d => ({
        lat: d.telemetry.latitude,
        lng: d.telemetry.longitude,
        alt: Math.max(0.05, d.telemetry.altitude / 10000),
        id: d.satellite.satelliteId,
        status: d.satellite.status,
        health: d.telemetry.health
      }));
  }, [fleetData]);

  // Memoize dynamic communication uplinks
  const arcs = useMemo(() => {
    if (!showUplinks || satellites.length === 0 || groundStations.length === 0) return [];
    
    const calculatedArcs = [];
    satellites.forEach(sat => {
      let closestGS = null;
      let minDist = Infinity;
      groundStations.forEach(gs => {
        const dx = sat.lat - gs.latitude;
        const dy = sat.lng - gs.longitude;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closestGS = gs;
        }
      });

      if (closestGS && minDist < 70) {
        calculatedArcs.push({
          startLat: sat.lat,
          startLng: sat.lng,
          endLat: closestGS.latitude,
          endLng: closestGS.longitude,
          color: ['rgba(0, 240, 255, 0.1)', getColor(sat)]
        });
      }
    });
    return calculatedArcs;
  }, [showUplinks, satellites, groundStations]);

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
        
        // Satellite Points
        pointsData={satellites}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointColor={getColor}
        pointRadius={0.2}
        pointResolution={16}
        pointLabel={showLabels ? (d) => `
          <div style="background: rgba(10, 15, 31, 0.9); padding: 4px 8px; border: 1px solid #1f2937; border-radius: 4px; font-family: monospace; font-size: 10px;">
            <b style="color: #fff">${d.id}</b><br/>
            <span style="color: #9ca3af">STATUS: </span><span style="color: ${getColor(d)}">${d.status}</span>
          </div>
        ` : () => ''}

        // Ground Stations (Labels)
        labelsData={groundStations}
        labelLat="latitude"
        labelLng="longitude"
        labelText="name"
        labelSize={1.5}
        labelDotRadius={0.5}
        labelColor={() => '#00F0FF'}
        labelResolution={2}
        labelIncludeDot={true}

        // Communication Beams (Arcs)
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.5}
        arcDashGap={2}
        arcDashAnimateTime={2000}
        arcAltitudeAutoScale={0.2}
        arcStroke={0.5}
        
        // Orbital Rings Custom Objects
        customLayerData={showRings ? satellites : []}
        customThreeObject={(d) => {
          // Create an orbital ring for each satellite
          // r is relative to globe radius which is essentially 1 internally in globe.gl
          const r = 1 + d.alt; 
          const geometry = new THREE.RingGeometry(r - 0.005, r + 0.005, 64);
          const material = new THREE.MeshBasicMaterial({ 
            color: getColor(d), 
            transparent: true, 
            opacity: 0.15,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geometry, material);
          // Calculate rotation to match satellite lat/lng plane
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
        customThreeObjectUpdate={(obj, d) => {
          // Object doesn't need to move unless data updates
        }}
      />
      
      {/* Viewport Overlay UI */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center space-x-2 text-[10px] font-mono text-[#00F0FF] tracking-widest bg-[#00F0FF]/10 px-3 py-1.5 rounded border border-[#00F0FF]/30 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
          </span>
          <span>LIVE SATELLITE TRACKING</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest text-right">
          Controls: Left Click to Rotate <br/> Scroll to Zoom
        </p>
      </div>
    </div>
  );
}
