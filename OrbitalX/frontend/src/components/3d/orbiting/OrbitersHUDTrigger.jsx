import React from 'react';
import { Satellite as SatIcon, ChevronRight } from 'lucide-react';
import { SAT_SLOT_COLORS, MAX_SELECTED_SATELLITES } from '../../../utils/orbitalMath';

export default function OrbitersHUDTrigger({
  onToggleOpen,
  selectedSatIds = [],
}) {
  return (
    <button
      onClick={onToggleOpen}
      id="btn-open-orbital-panel"
      className="absolute top-16 left-3 z-20 flex items-center space-x-3 bg-[#0A0F1F]/90 hover:bg-[#12192b] border border-[#00F0FF]/40 hover:border-[#00F0FF] text-white px-4 py-2.5 rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.2)] backdrop-blur-md transition-all duration-300 group cursor-pointer"
      title="Open Active Orbiters & Signal Matrix Panel"
    >
      <div className="relative flex items-center justify-center">
        <SatIcon size={18} className="text-[#00F0FF] animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
        </span>
      </div>
      <div className="flex flex-col items-start text-left">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-gray-200">
            Orbiters HUD
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              selectedSatIds.length > 0
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
          >
            {selectedSatIds.length}/{MAX_SELECTED_SATELLITES}
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300">
          {selectedSatIds.length === 0
            ? 'Click to track orbital paths'
            : 'Tracking active trajectories & comms'}
        </span>
      </div>
      <div className="flex -space-x-1 pl-1">
        {selectedSatIds.map((id, idx) => (
          <span
            key={id}
            className="w-2.5 h-2.5 rounded-full border border-gray-900 shadow-sm"
            style={{ backgroundColor: SAT_SLOT_COLORS[idx] }}
          />
        ))}
      </div>
      <ChevronRight
        size={14}
        className="text-gray-400 group-hover:translate-x-0.5 transition-transform"
      />
    </button>
  );
}
