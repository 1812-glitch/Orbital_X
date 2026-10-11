import React from 'react';
import { Satellite, ChevronDown, Radio, Sparkles, Search, Check, Eye, Wifi } from 'lucide-react';

export default function CommsTargetDropdown({
  currentSat,
  isSatDropdownOpen,
  setIsSatDropdownOpen,
  satDropdownRef,
  targetTypeFilter,
  setTargetTypeFilter,
  satSearchTerm,
  setSatSearchTerm,
  filteredFleet,
  setSelectedSat,
  selectSatellite,
  openDetailModal
}) {
  return (
    <div className="relative flex items-center space-x-2" ref={satDropdownRef}>
      <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest hidden sm:inline-block">
        TARGET ASSET:
      </span>

      <button
        id="cubesat-selector-dropdown-btn"
        onClick={() => setIsSatDropdownOpen(!isSatDropdownOpen)}
        className={`flex items-center space-x-3 px-3 py-1.5 rounded bg-[#121C36] hover:bg-[#182547] border transition-all text-left shadow-sm ${
          isSatDropdownOpen ? 'border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]' : 'border-[#00F0FF]/40 hover:border-[#00F0FF]'
        }`}
      >
        <div className="w-6 h-6 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center shrink-0">
          <Satellite size={14} className="text-[#00F0FF]" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
              {currentSat.satelliteId} {currentSat.name ? `/ ${currentSat.name}` : ''}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
              {currentSat.type || 'CubeSat'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-gray-400 block leading-tight">
            {currentSat.orbitType || 'LEO-POLAR'} • <span className={currentSat.status === 'WARNING' ? 'text-[#FFB020]' : currentSat.status === 'OFFLINE' ? 'text-gray-500' : 'text-[#00FF66]'}>
              {currentSat.status === 'OFFLINE' ? 'LOS (OFFLINE)' : currentSat.status === 'WARNING' ? 'WARNING' : 'UPLINK NOMINAL'}
            </span>
          </span>
        </div>

        <ChevronDown size={14} className={`text-gray-400 group-hover:text-[#00F0FF] transition-transform duration-200 ml-1 ${isSatDropdownOpen ? 'rotate-180 text-[#00F0FF]' : ''}`} />
      </button>

      {/* DROPDOWN MENU POPUP */}
      {isSatDropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-[#0A0F1F] border border-[#00F0FF]/60 rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-gray-800 bg-[#070B14]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold text-[#00F0FF] tracking-widest uppercase flex items-center space-x-1.5">
                <Radio size={12} />
                <span>SELECT TARGET ASSET</span>
              </span>
              <span className="font-mono text-[10px] text-gray-500">
                {filteredFleet.length} AVAILABLE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 mb-2 bg-[#12192b] p-1 rounded border border-gray-800 text-[10px] font-mono">
              <button
                onClick={() => setTargetTypeFilter('ALL')}
                className={`py-1 rounded text-center font-bold transition-all ${
                  targetTypeFilter === 'ALL' ? 'bg-[#00F0FF] text-[#0A0F1F]' : 'text-gray-400 hover:text-white'
                }`}
              >
                ALL ASSETS
              </button>
              <button
                onClick={() => setTargetTypeFilter('CUBESAT')}
                className={`py-1 rounded text-center font-bold transition-all flex items-center justify-center space-x-1 ${
                  targetTypeFilter === 'CUBESAT' ? 'bg-[#00F0FF] text-[#0A0F1F]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={10} />
                <span>CUBESATS ONLY</span>
              </button>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search CubeSat or Satellite name / ID..."
                value={satSearchTerm}
                onChange={(e) => setSatSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-[#12192b] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/60 font-mono"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1 divide-y divide-gray-900/60 font-mono">
            {filteredFleet.length > 0 ? (
              filteredFleet.map(sat => {
                const isCurrent = (currentSat._id || currentSat.satelliteId) === (sat._id || sat.satelliteId);
                const isWarning = sat.status === 'WARNING';
                const isOffline = sat.status === 'OFFLINE';

                return (
                  <div
                    key={sat._id || sat.satelliteId}
                    onClick={() => {
                      setSelectedSat(sat);
                      selectSatellite(sat);
                      setIsSatDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded cursor-pointer transition-all flex items-center justify-between group ${
                      isCurrent 
                        ? 'bg-[#00F0FF]/15 border border-[#00F0FF] text-white' 
                        : 'hover:bg-[#121C36] border border-transparent hover:border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isOffline ? 'bg-gray-500' : isWarning ? 'bg-[#FFB000] shadow-[0_0_6px_#FFB000]' : 'bg-[#00FF66] shadow-[0_0_6px_#00FF66]'
                      }`}></span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs truncate group-hover:text-[#00F0FF]">
                            {sat.satelliteId} {sat.name ? `- ${sat.name}` : ''}
                          </span>
                          {isCurrent && (
                            <Check size={12} className="text-[#00F0FF] shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] text-gray-500 mt-0.5">
                          <span>{sat.orbitType || 'LEO'}</span>
                          <span>•</span>
                          <span className="text-gray-400">{sat.type || 'CubeSat'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSatellite(sat);
                        openDetailModal(sat);
                      }}
                      className="p-1.5 text-gray-500 hover:text-[#00F0FF] hover:bg-gray-800/80 rounded transition-colors ml-2 shrink-0"
                      title={`Inspect ${sat.name || sat.satelliteId} Specs`}
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-gray-500">
                No satellites or CubeSats match "{satSearchTerm}"
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-800 bg-[#070B14] flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center space-x-1.5">
              <Wifi size={11} className="text-[#00FF66]" />
              <span>TELEMETRY SYNC READY</span>
            </span>
            <button
              onClick={() => {
                openDetailModal(currentSat);
                setIsSatDropdownOpen(false);
              }}
              className="text-[#00F0FF] hover:underline font-bold"
            >
              VIEW FULL SPECS →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
