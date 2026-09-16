import React from 'react';
import { Satellite as SatIcon, X, Lock } from 'lucide-react';
import { MAX_SELECTED_SATELLITES } from '../../../utils/orbitalMath';

export default function OrbitingSatellitesHeader({
  selectedCount = 0,
  onToggleOpen,
  limitWarning = false,
}) {
  return (
    <>
      {/* Header with Close Button and Active Selection Counter */}
      <div className="p-4 border-b border-gray-800/80 bg-gradient-to-r from-[#00F0FF]/10 via-[#0A0F1F] to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
            <SatIcon size={16} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase">
                Active Orbiters & Comms
              </h2>
            </div>
            <p className="text-[11px] font-mono text-gray-400">
              3D Trajectories & Ground Signal Link Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tracking Counter Pill */}
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors flex items-center space-x-1 ${
              selectedCount === MAX_SELECTED_SATELLITES
                ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40 shadow-[0_0_10px_rgba(255,176,32,0.2)]'
                : selectedCount > 0
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40'
                : 'bg-gray-800/60 text-gray-400 border-gray-700'
            }`}
          >
            <span>{selectedCount}/{MAX_SELECTED_SATELLITES}</span>
            <span className="text-[9px] uppercase tracking-wider">TRACKING</span>
          </div>

          {/* Close Panel Button */}
          <button
            onClick={onToggleOpen}
            id="btn-close-orbital-panel"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 border border-transparent hover:border-gray-700 transition-colors cursor-pointer"
            title="Close / Minimize Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Limit Warning Banner */}
      {limitWarning && (
        <div className="bg-[#FFB020]/15 border-b border-[#FFB020]/40 px-4 py-2 flex items-center space-x-2 text-xs font-mono text-[#FFB020] animate-in fade-in duration-200">
          <Lock size={14} className="shrink-0" />
          <span>
            Maximum {MAX_SELECTED_SATELLITES} satellites can be tracked simultaneously. Deselect one to add another.
          </span>
        </div>
      )}
    </>
  );
}
