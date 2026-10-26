import React from 'react';
import { RadioTower, RefreshCw, Download, ChevronUp, ChevronDown, X, Radio } from 'lucide-react';
import { resolveStationConnectedSatellites } from './GroundStationDetailDrawer';

export default function GroundStationsNetworkTable({
  showNetworkTable,
  setShowNetworkTable,
  isTableMinimized,
  setIsTableMinimized,
  stations,
  activeStation,
  allSatellites = [],
  setSelectedStation,
  fetchData,
  handleExport,
  setShowDiagnostics,
  handleRunDiagnostics
}) {
  if (!showNetworkTable) return null;

  return (
    <div className="w-full bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden shadow-xl animate-in fade-in duration-200 font-mono">
      {/* Table Header with Close and Minimize Controls */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-[#070C18]">
        <div className="flex items-center space-x-3">
          <RadioTower size={16} className="text-[#00F0FF]" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase flex items-center space-x-2">
            <span>GLOBAL STATION NETWORK</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-[#00F0FF]">
              {stations.length} ACTIVE STATIONS
            </span>
          </h3>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button 
            onClick={fetchData}
            title="Refresh telemetry"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={13} />
          </button>

          <button 
            onClick={() => setIsTableMinimized(!isTableMinimized)}
            title={isTableMinimized ? "Expand Station Table" : "Minimize Station Table"}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors"
          >
            {isTableMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button 
            onClick={() => setShowNetworkTable(false)}
            title="Close Global Station Network (Maximize 3D Earth Simulator)"
            className="text-gray-400 hover:text-[#FF2A2A] p-1 rounded hover:bg-[#FF2A2A]/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {!isTableMinimized && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e162c] text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-800">
              <tr>
                <th className="py-3 px-5">STATION ID</th>
                <th className="py-3 px-5">LOCATION</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5 text-center">SAT LINKS</th>
                <th className="py-3 px-5 text-center">SIGNAL</th>
                <th className="py-3 px-5">LAST CONTACT</th>
                <th className="py-3 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {stations.map((st) => {
                const isSelected = activeStation.stationId === st.stationId || activeStation._id === st._id;
                const degraded = st.status === 'DEGRADED';
                const offline = st.status === 'OFFLINE';

                return (
                  <tr 
                    key={st._id || st.stationId}
                    onClick={() => setSelectedStation(st)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#00F0FF]/10 text-white font-bold' : 'hover:bg-[#121C36]/50'
                    }`}
                  >
                    <td className="py-3 px-5 text-[#00F0FF] font-bold flex items-center space-x-2">
                      <RadioTower size={13} className={isSelected ? 'text-[#00F0FF]' : 'text-gray-500'} />
                      <span>{st.stationId}</span>
                    </td>

                    <td className="py-3 px-5 text-gray-200">
                      {st.country ? `${st.name.split(' ')[0]}, ${st.country}` : st.name}
                    </td>

                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        offline ? 'text-[#FF2A2A]' : degraded ? 'text-[#FFB020]' : 'text-[#00FF66]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          offline ? 'bg-[#FF2A2A]' : degraded ? 'bg-[#FFB020]' : 'bg-[#00FF66]'
                        }`}></span>
                        <span>{st.status || 'ACTIVE'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-5 text-center font-bold text-[#00F0FF]">
                      {resolveStationConnectedSatellites(st, allSatellites).length}
                    </td>

                    <td className={`py-3 px-5 text-center font-bold ${
                      (st.signalQuality || 90) < 70 ? 'text-[#FFB020]' : 'text-gray-200'
                    }`}>
                      {st.signalQuality || (st.stationId === 'GS-002' ? 64 : 92)}%
                    </td>

                    <td className="py-3 px-5 text-gray-400">
                      {st.lastContact 
                        ? new Date(st.lastContact).toUTCString().slice(17, 25) + ' UTC' 
                        : '16:53:55 UTC'}
                    </td>

                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStation(st);
                          }}
                          className="px-2 py-1 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 text-[#00F0FF] transition-colors font-bold text-[10px] uppercase"
                          title="Focus station on 3D Globe"
                        >
                          FOCUS
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStation(st);
                            setShowDiagnostics(true);
                            handleRunDiagnostics();
                          }}
                          className="p-1 text-gray-400 hover:text-[#00F0FF] rounded hover:bg-gray-800 transition-colors"
                          title="Run Diagnostics on this station"
                        >
                          <Radio size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
