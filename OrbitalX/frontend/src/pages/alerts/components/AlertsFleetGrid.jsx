import React from 'react';
import { Satellite, Search, Zap } from 'lucide-react';

export default function AlertsFleetGrid({
  fleetSearch,
  setFleetSearch,
  fleetFilterType,
  setFleetFilterType,
  setIsInjectorOpen,
  filteredFleetList,
  satAlertStats,
  setSatelliteFilter,
  selectSatellite
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Instructions and Fleet Search / Filter Bar */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
            <Satellite size={16} className="text-[#00F0FF]" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              CUBESAT INCIDENT FLEET
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Select a CubeSat to inspect its live telemetry anomalies and incident logs
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          {/* Fleet search */}
          <div className="relative flex-1 md:w-56">
            <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search CubeSat name / ID..."
              value={fleetSearch}
              onChange={(e) => setFleetSearch(e.target.value)}
              className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
            />
          </div>

          {/* Status Filter buttons */}
          {[
            { key: 'ALL', label: 'ALL CUBESATS' },
            { key: 'CRITICAL', label: 'CRITICAL' },
            { key: 'WARNING', label: 'WARNINGS' },
            { key: 'NOMINAL', label: 'NOMINAL' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFleetFilterType(tab.key)}
              className={`px-3 py-1.5 rounded transition-all font-bold ${
                fleetFilterType === tab.key
                  ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-[#050810] border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => setIsInjectorOpen(true)}
            className="px-3 py-1.5 rounded bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-[#FF2A2A] hover:text-white border border-[#FF2A2A]/50 transition-all font-bold flex items-center space-x-1.5 ml-1"
            title="Open Fault & Anomaly Injector Drawer"
          >
            <Zap size={12} />
            <span>+ INJECT FAULT</span>
          </button>
        </div>
      </div>

      {/* Fleet Grid: List of CubeSats with Colored Alert Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFleetList.map(sat => {
          const satKey = sat._id || sat.satelliteId;
          const stat = satAlertStats[satKey] || { total: 0, critical: 0, warning: 0, resolved: 0, activeTotal: 0, latestAlert: null };
          const hasCritical = stat.critical > 0;
          const hasWarning = stat.warning > 0;

          const cardBorder = hasCritical 
            ? 'border-[#FF2A2A]/70 hover:border-[#FF2A2A] shadow-[0_0_20px_rgba(255,42,42,0.15)]' 
            : hasWarning 
            ? 'border-[#FFB000]/70 hover:border-[#FFB000] shadow-[0_0_15px_rgba(255,176,0,0.12)]' 
            : 'border-gray-800 hover:border-[#00FF66]/60 shadow-md';

          return (
            <div
              key={satKey}
              onClick={() => {
                setSatelliteFilter(sat._id || sat.satelliteId);
                selectSatellite(sat);
              }}
              className={`bg-[#0A0F1F] rounded-lg border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-[#121C36] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-[#00F0FF] transition-colors">
                      <Satellite size={20} className={hasCritical ? 'text-[#FF2A2A]' : hasWarning ? 'text-[#FFB000]' : 'text-[#00FF66]'} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-mono font-bold text-white text-base tracking-wider group-hover:text-[#00F0FF] transition-colors">
                          {sat.name || sat.satelliteId}
                        </h3>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                          {sat.type || 'CubeSat'}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-gray-500 mt-0.5">
                        {sat.satelliteId} • {sat.orbitType || 'LEO'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    {hasCritical ? (
                      <div className="flex items-center space-x-1.5 bg-[#FF2A2A]/15 border border-[#FF2A2A]/40 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#FF2A2A] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(255,42,42,0.8)] animate-pulse">
                          {stat.activeTotal}
                        </span>
                        <span className="font-mono text-[10px] text-[#FF2A2A] font-bold uppercase tracking-wider">
                          ALERTS
                        </span>
                      </div>
                    ) : hasWarning ? (
                      <div className="flex items-center space-x-1.5 bg-[#FFB000]/15 border border-[#FFB000]/40 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#FFB000] text-black font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(255,176,0,0.6)]">
                          {stat.activeTotal}
                        </span>
                        <span className="font-mono text-[10px] text-[#FFB000] font-bold uppercase tracking-wider">
                          WARNINGS
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 bg-[#00FF66]/10 border border-[#00FF66]/30 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold text-xs flex items-center justify-center">
                          0
                        </span>
                        <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider">
                          NOMINAL
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {stat.latestAlert ? (
                  <div className="bg-[#050810] border border-gray-800 rounded p-3 mb-4">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-gray-500">LATEST INCIDENT</span>
                      <span className={stat.latestAlert.severity === 'CRITICAL' ? 'text-[#FF2A2A]' : 'text-[#FFB000]'}>
                        {stat.latestAlert.severity}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-300 font-bold line-clamp-1">
                      {stat.latestAlert.type}
                    </p>
                    <p className="font-mono text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {stat.latestAlert.message}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#050810] border border-gray-800/60 rounded p-3 mb-4 text-center">
                    <p className="font-mono text-xs text-gray-500">All telemetry nominal. No active incidents.</p>
                  </div>
                )}
              </div>

              <button
                className={`w-full py-2 px-3 rounded font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-between ${
                  hasCritical
                    ? 'bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-[#FF2A2A] hover:text-white border border-[#FF2A2A]/50 hover:border-[#FF2A2A]'
                    : hasWarning
                    ? 'bg-[#FFB000]/20 hover:bg-[#FFB000] text-[#FFB000] hover:text-black border border-[#FFB000]/50 hover:border-[#FFB000]'
                    : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] border border-[#00F0FF]/40'
                }`}
              >
                <span>SELECT CUBESAT TO VIEW ALERTS ({stat.activeTotal})</span>
                <span>→</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredFleetList.length === 0 && (
        <div className="py-16 text-center bg-[#0B1221] border border-gray-800 rounded-lg font-mono">
          <p className="text-gray-400 text-sm">No CubeSats match your search query "{fleetSearch}"</p>
          <button
            onClick={() => { setFleetSearch(''); setFleetFilterType('ALL'); }}
            className="mt-3 text-xs text-[#00F0FF] underline font-bold"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
