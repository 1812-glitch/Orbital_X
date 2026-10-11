import React from 'react';
import { Satellite, Search } from 'lucide-react';

export default function NotificationFleetDeck({
  fleetSearch,
  setFleetSearch,
  fleetFilterType,
  setFleetFilterType,
  filteredFleetList,
  satNotifStats,
  setSatFilter,
  selectSatellite
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Deck Instruction & Fleet Filter Bar */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-8 h-8 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
            <Satellite size={16} className="text-[#00F0FF]" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              CUBESAT NOTIFICATION FLEET
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              Select a CubeSat to view its realtime telemetry log and communications
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
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

          {[
            { key: 'ALL', label: 'ALL CUBESATS' },
            { key: 'ALERT', label: 'HAS ALERTS' },
            { key: 'UNREAD', label: 'UNREAD' },
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
        </div>
      </div>

      {/* Grid of CubeSats with Colored Circles with Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFleetList.map(sat => {
          const satKey = sat._id || sat.satelliteId;
          const stat = satNotifStats[satKey] || { count: 0, hasAlert: false, unreadSatCount: 0, latestNotif: null };
          const hasAlert = stat.hasAlert;
          const hasUnread = stat.unreadSatCount > 0;

          const cardBorder = hasAlert
            ? 'border-[#FF2A2A]/70 hover:border-[#FF2A2A] shadow-[0_0_20px_rgba(255,42,42,0.15)]'
            : hasUnread
            ? 'border-[#00F0FF]/70 hover:border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
            : 'border-gray-800 hover:border-[#00FF66]/60 shadow-md';

          return (
            <div
              key={satKey}
              onClick={() => {
                setSatFilter(sat._id || sat.satelliteId);
                selectSatellite(sat);
              }}
              className={`bg-[#0A0F1F] rounded-lg border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-[#121C36] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-[#00F0FF] transition-colors">
                      <Satellite size={20} className={hasAlert ? 'text-[#FF2A2A]' : hasUnread ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
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
                    {hasAlert ? (
                      <div className="flex items-center space-x-1.5 bg-[#FF2A2A]/15 border border-[#FF2A2A]/40 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#FF2A2A] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(255,42,42,0.8)] animate-pulse">
                          {stat.count}
                        </span>
                        <span className="font-mono text-[10px] text-[#FF2A2A] font-bold uppercase tracking-wider">
                          ALERTS
                        </span>
                      </div>
                    ) : hasUnread ? (
                      <div className="flex items-center space-x-1.5 bg-[#00F0FF]/15 border border-[#00F0FF]/40 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#00F0FF] text-[#0A0F1F] font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                          {stat.count}
                        </span>
                        <span className="font-mono text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
                          UNREAD
                        </span>
                      </div>
                    ) : stat.count > 0 ? (
                      <div className="flex items-center space-x-1.5 bg-[#00FF66]/10 border border-[#00FF66]/30 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold text-xs flex items-center justify-center">
                          {stat.count}
                        </span>
                        <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider">
                          LOGGED
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 bg-gray-800/60 border border-gray-700 px-2.5 py-1 rounded-full">
                        <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 font-mono font-bold text-xs flex items-center justify-center">
                          0
                        </span>
                        <span className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          CLEAR
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 font-mono text-[11px]">
                  <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                    <span className="text-gray-500">Unread:</span>
                    <span className={`font-bold ${stat.unreadSatCount > 0 ? 'text-[#00F0FF]' : 'text-gray-400'}`}>
                      {stat.unreadSatCount}
                    </span>
                  </div>
                  <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                    <span className="text-gray-500">Alerts:</span>
                    <span className={`font-bold ${stat.hasAlert ? 'text-[#FF2A2A]' : 'text-gray-400'}`}>
                      {stat.hasAlert ? 'YES' : 'NONE'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#070B14] border border-gray-800/80 rounded p-2.5 mb-4 font-mono text-xs">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                    RECENT TRANSMISSION:
                  </span>
                  {stat.latestNotif ? (
                    <p className="text-gray-300 truncate text-[11px]">
                      <strong className={stat.latestNotif.type === 'ALERT' ? 'text-[#FF2A2A]' : 'text-[#00F0FF]'}>
                        [{stat.latestNotif.type}]
                      </strong>{' '}
                      {stat.latestNotif.title}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-[11px]">No recent telemetry signals logged.</p>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSatFilter(sat._id || sat.satelliteId);
                  selectSatellite(sat);
                }}
                className={`w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                  hasAlert
                    ? 'bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-white border border-[#FF2A2A]/50 hover:border-[#FF2A2A]'
                    : hasUnread
                    ? 'bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] border border-[#00F0FF]/50'
                    : 'bg-[#12192b] hover:bg-[#182547] text-gray-300 hover:text-white border border-gray-800'
                }`}
              >
                <span>SELECT CUBESAT TO VIEW NOTIFICATIONS ({stat.count})</span>
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
