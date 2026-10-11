import React from 'react';
import { Zap, CheckCheck, CheckCircle } from 'lucide-react';

export default function AlertsHeader({
  satelliteFilter,
  activeSatName,
  stats,
  setIsInjectorOpen,
  handleAcknowledgeAll,
  handleResolveAll,
  unacknowledgedCount,
  allResolved
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-800">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-sans flex items-center space-x-3">
            <span>Alerts & Incidents</span>
            {satelliteFilter && (
              <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                CUBESAT ISOLATED
              </span>
            )}
          </h1>
          {stats.critical > 0 && (
            <span className="bg-[#FF2A2A]/20 border border-[#FF2A2A]/40 text-[#FF2A2A] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full animate-pulse">
              {stats.critical} CRITICAL
            </span>
          )}
        </div>
        <p className="text-gray-400 font-mono text-xs tracking-wider mt-1">
          {satelliteFilter 
            ? `Realtime telemetry anomalies, incident logs & telemetry curves for ${activeSatName}`
            : `Select a CubeSat below to inspect its dedicated telemetry anomalies & incident logs`
          }
        </p>
      </div>

      {/* Global Actions + Live KPI Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Anomaly & Fault Generator Side Panel Trigger */}
        <button 
          id="open-fault-drawer-btn"
          onClick={() => setIsInjectorOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#FF2A2A]/25 via-[#FFB000]/25 to-[#FF2A2A]/25 hover:from-[#FF2A2A]/40 hover:to-[#FFB000]/40 border border-[#FF2A2A] text-white px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(255,42,42,0.25)] font-bold animate-pulse hover:animate-none"
        >
          <Zap size={14} className="text-[#FF2A2A]" />
          <span>⚡ FAULT GENERATOR & INJECTOR</span>
        </button>
        
        <button 
          id="acknowledge-all-btn"
          onClick={handleAcknowledgeAll}
          disabled={unacknowledgedCount === 0}
          className="flex items-center space-x-2 border border-gray-700 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none font-bold"
        >
          <CheckCheck size={14} />
          <span>Acknowledge All</span>
        </button>

        <button 
          id="resolve-all-btn"
          onClick={handleResolveAll}
          disabled={allResolved}
          className="flex items-center space-x-2 border border-gray-700 hover:border-[#00FF66] text-gray-300 hover:text-[#00FF66] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none font-bold"
        >
          <CheckCircle size={14} />
          <span>Resolve All</span>
        </button>

        {/* Sleek KPI Metric Badges */}
        <div className="hidden xl:flex items-center space-x-2 pl-2 border-l border-gray-800">
          <div className="bg-[#0B1221] border border-[#FF2A2A]/60 px-3 py-1.5 rounded flex items-center space-x-2">
            <span className="text-[#FF2A2A] font-mono text-[9px] font-bold tracking-widest uppercase">CRIT</span>
            <span className="text-white font-mono text-xs font-bold">{stats.critical.toString().padStart(2, '0')}</span>
          </div>
          <div className="bg-[#0B1221] border border-[#FFB000]/60 px-3 py-1.5 rounded flex items-center space-x-2">
            <span className="text-[#FFB000] font-mono text-[9px] font-bold tracking-widest uppercase">WARN</span>
            <span className="text-white font-mono text-xs font-bold">{stats.warning.toString().padStart(2, '0')}</span>
          </div>
          <div className="bg-[#0B1221] border border-[#00FF66]/60 px-3 py-1.5 rounded flex items-center space-x-2">
            <span className="text-[#00FF66] font-mono text-[9px] font-bold tracking-widest uppercase">OK</span>
            <span className="text-white font-mono text-xs font-bold">{stats.resolved.toString().padStart(2, '0')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
