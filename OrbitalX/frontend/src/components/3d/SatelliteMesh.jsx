import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';

export default function SatelliteMesh({ satellite, telemetry }) {
  const meshRef = useRef();
  
  // Calculate Position from Lat/Lon/Alt
  const position = useMemo(() => {
    if (!telemetry) return [15, 0, 0]; // Default orbit if no data

    const earthRadius = 10;
    // Scale altitude down for visual representation
    const scaledAlt = telemetry.altitude / 800; 
    const r = earthRadius + scaledAlt;
    
    // Convert Lat/Lon to Radians
    const phi = (90 - telemetry.latitude) * (Math.PI / 180);
    const theta = (telemetry.longitude + 180) * (Math.PI / 180);
    
    // Spherical to Cartesian
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));
    
    return [x, y, z];
  }, [telemetry]);

  // Determine color based on health/status
  const color = useMemo(() => {
    if (!telemetry) return '#6b7280'; // gray
    if (telemetry.health < 50 || satellite.status === 'WARNING') return '#FFB020'; // yellow
    if (satellite.status === 'OFFLINE') return '#FF2A2A'; // red
    return '#00F0FF'; // cyan
  }, [satellite.status, telemetry]);

  // Create an orbital ring based on altitude
  const orbitRadius = telemetry ? 10 + (telemetry.altitude / 800) : 15;
  
  // Simple rotation for the satellite along its orbit to simulate live movement
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Very simple rotation on Y axis just for visual life, 
      // actual positioning should come from real telemetry updates in Phase 8
      meshRef.current.rotation.y = clock.getElapsedTime() * (telemetry ? telemetry.speed * 0.05 : 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Orbital Path (Ring) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={2} />
      </mesh>

      {/* Satellite Node */}
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
        
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>

        {/* HTML Label overlay */}
        <Html distanceFactor={15} center>
          <div className="bg-[#0A0F1F]/80 backdrop-blur-sm border border-gray-800 px-2 py-1 rounded text-[8px] font-mono whitespace-nowrap pointer-events-none transition-all duration-300">
            <span className="text-white font-bold">{satellite.satelliteId}</span>
            {telemetry && (
              <div className="text-gray-400 mt-0.5">
                ALT: {telemetry.altitude.toFixed(0)}km<br/>
                VEL: {telemetry.speed.toFixed(1)}km/s
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
}
