import React from 'react';
import { Layers, Satellite as SatIcon } from 'lucide-react';
import { MAX_SELECTED_SATELLITES } from '../../utils/orbitalMath';

export default function OrbitalViewerHeader({ selectedCount = 0, totalCount = 0 }) {
  return (
    <div className="flex justify-between items-end shrink-0">
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
            Orbital Viewer
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
            3D EARTH SIMULATION
          </span>
        </div>
        <p className="text-gray-400 font-mono text-sm">
          Real-time 3D spatial mapping, orbital trajectory projections, and ground station communication links.
        </p>
      </div>

      <div className="flex space-x-4">
        {/* Active Selection Indicator Badge */}
        <div className="bg-[#12192b] border border-gray-800 rounded-lg px-4 py-2 flex items-center space-x-2.5">
          <SatIcon size={16} className="text-[#00F0FF]" />
          <span className="font-mono text-xs text-gray-400">Tracking Orbits:</span>
          <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/40">
            {selectedCount}/{MAX_SELECTED_SATELLITES} MAX
          </span>
        </div>

        <div className="bg-[#12192b] border border-gray-800 rounded-lg px-4 py-2 flex items-center space-x-2">
          <Layers size={16} className="text-gray-400" />
          <span className="font-mono text-sm text-white">Constellation: {totalCount}</span>
        </div>
      </div>
    </div>
  );
}
