import React from 'react';
import { Search } from 'lucide-react';

const ORBIT_FILTER_OPTIONS = ['ALL', 'CUBESAT', 'LEO', 'MEO', 'GEO', 'SSO', 'POLAR'];

export default function OrbitingSatellitesFilterBar({
  searchQuery,
  onSearchChange,
  orbitFilter,
  onOrbitFilterChange,
  selectedCount = 0,
  onSelectTop3,
  onClearSelection,
}) {
  return (
    <div className="p-3 border-b border-gray-800/80 bg-[#12192b]/40 space-y-2.5 shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-500" size={13} />
        <input
          type="text"
          placeholder="Search Satellite or CubeSat ID / Name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#0d1322] border border-gray-800 text-white rounded-lg py-1.5 pl-8 pr-3 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/60 placeholder-gray-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-gray-400 hover:text-white text-xs font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Categories & Quick Selection Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {ORBIT_FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => onOrbitFilterChange(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
                orbitFilter === f
                  ? 'bg-[#00F0FF] text-[#0A0F1F] font-bold shadow-[0_0_8px_#00F0FF]/40'
                  : 'bg-[#12192b] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            id="btn-track-top-sat"
            onClick={onSelectTop3}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 border border-[#00F0FF]/30 transition-colors cursor-pointer"
            title="Quickly track top active orbiter"
          >
            Track Top
          </button>
          {selectedCount > 0 && (
            <button
              onClick={onClearSelection}
              className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-800 transition-colors cursor-pointer"
              title="Deselect all satellites"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
