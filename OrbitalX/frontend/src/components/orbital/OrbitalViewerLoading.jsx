import React from 'react';
import { Activity } from 'lucide-react';

export default function OrbitalViewerLoading({
  message = 'CALCULATING 3D ORBITAL TRAJECTORIES...',
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050810] space-y-3">
      <Activity className="animate-pulse text-[#00F0FF]" size={48} />
      <span className="font-mono text-xs text-[#00F0FF] tracking-widest uppercase">
        {message}
      </span>
    </div>
  );
}
