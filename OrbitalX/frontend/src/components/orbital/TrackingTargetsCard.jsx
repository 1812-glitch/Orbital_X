import React from 'react';
import { Search } from 'lucide-react';
import { SAT_SLOT_COLORS, MAX_SELECTED_SATELLITES } from '../../utils/orbitalMath';

export default function TrackingTargetsCard({
  targets = [],
  selectedSatIds = [],
  onToggleSatellite,
  searchQuery = '',
  onSearchChange,
}) {
  return (
    <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
        <h3 className="text-white font-mono text-xs tracking-widest uppercase font-bold">
          Tracking Targets
        </h3>
        <span className="text-[10px] font-mono text-[#00F0FF]">
          {selectedSatIds.length}/{MAX_SELECTED_SATELLITES} Selected
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-2 text-gray-500" size={13} />
        <input
          type="text"
          placeholder="Filter target ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#12192b] border border-gray-800 text-white rounded py-1.5 pl-8 pr-3 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
        />
      </div>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {targets.map((data) => {
          const sat = data.satellite;
          const slotIdx = selectedSatIds.indexOf(sat.satelliteId);
          const isSelected = slotIdx !== -1;
          const slotColor = isSelected ? SAT_SLOT_COLORS[slotIdx] : null;

          return (
            <div
              key={sat._id || sat.satelliteId}
              onClick={() => onToggleSatellite(sat.satelliteId)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-all ${
                isSelected
                  ? 'bg-[#121c36] border-l-4 shadow-sm'
                  : 'bg-[#12192b]/50 hover:bg-[#12192b] border-gray-800/60 hover:border-gray-700'
              }`}
              style={
                isSelected
                  ? { borderLeftColor: slotColor, borderColor: `${slotColor}40` }
                  : {}
              }
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    sat.status === 'OFFLINE' ? 'bg-[#FF2A2A]' : 'bg-[#00FF66]'
                  }`}
                  style={isSelected ? { backgroundColor: slotColor } : {}}
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-white font-mono truncate">
                    {sat.satelliteId}
                  </div>
                  <div className="text-[10px] text-gray-400 font-sans truncate">
                    {sat.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                {isSelected ? (
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                    style={{
                      backgroundColor: `${slotColor}20`,
                      color: slotColor,
                      borderColor: `${slotColor}60`,
                    }}
                  >
                    SLOT {slotIdx + 1}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-gray-400">
                    {sat.orbitType}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
