import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Earth() {
  const earthRef = useRef();

  // Slow rotation for the Earth
  useFrame(({ clock }) => {
    earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  return (
    <group ref={earthRef}>
      {/* Base Earth Sphere */}
      <mesh>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial 
          color="#0A0F1F" 
          transparent
          opacity={0.9}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Wireframe Overlay for "Cyber/Holographic" Look */}
      <mesh>
        <sphereGeometry args={[10.05, 32, 32]} />
        <meshBasicMaterial 
          color="#00F0FF" 
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Inner Glow */}
      <mesh>
        <sphereGeometry args={[9.8, 32, 32]} />
        <meshBasicMaterial 
          color="#121C36" 
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
