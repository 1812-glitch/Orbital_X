import React, { useState, useEffect } from 'react';
import { 
  RadioTower, 
  MapPin, 
  Activity, 
  RefreshCw, 
  Eye, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  Radio
} from 'lucide-react';
import { groundStationService } from '../../services/groundStationService';
import telemetryService from '../../services/telemetryService';
import Scene from '../../components/3d/Scene';

export default function GroundStations() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsMessage, setDiagnosticsMessage] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 25));

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [gsRes, telRes] = await Promise.all([
        groundStationService.getAllGroundStations(),
        telemetryService.getLatestTelemetry()
      ]);
      const stationList = gsRes.data || [];
      setStations(stationList);
      if (stationList.length > 0 && !selectedStation) {
        setSelectedStation(stationList[0]);
      } else if (selectedStation) {
        // Keep selected station synchronized
        const updated = stationList.find(s => s._id === selectedStation._id || s.stationId === selectedStation.stationId);
        if (updated) setSelectedStation(updated);
      }
      setFleetData(telRes.data || []);
    } catch (err) {
      console.error('Failed to fetch ground station data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsMessage('TRANSMITTING FREQUENCY SWEEP (S-BAND)...');
    setTimeout(() => {
      setDiagnosticsMessage('UPLINK PHASE LOCK: 100% | CARRIER-TO-NOISE RATIO: 18.4 dB | NO ERRORS');
      setDiagnosticsRunning(false);
      setTimeout(() => setDiagnosticsMessage(null), 6000);
    }, 1500);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Station ID,Name,Country,Status,Signal Quality,Connected Satellites,Latitude,Longitude",
        ...stations.map(s => `"${s.stationId}","${s.name}","${s.country}","${s.status}","${s.signalQuality || 90}%","${(s.connectedSatellites || []).length}","${s.latitude}","${s.longitude}"`)
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbitalx_ground_stations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-[#00F0FF] tracking-widest uppercase">INITIALIZING GROUND STATION TELEMETRY...</p>
      </div>
    );
  }

  // Active station data fallbacks
  const activeStation = selectedStation || stations[0] || {
    stationId: 'GS-001',
    name: 'Ground Station Alpha',
    country: 'India',
    locationName: 'Bangalore, India',
    status: 'ACTIVE',
    signalQuality: 98,
    connectedSatellites: [],
    lastContact: new Date(),
    nextContact: new Date(Date.now() + 83 * 60000)
  };

  const isDegraded = activeStation.status === 'DEGRADED';
  const isOffline = activeStation.status === 'OFFLINE';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 font-sans pb-10">
      
      {/* 1. TOP STATUS BAR */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse"></span>
          <span className="font-mono text-xs font-bold text-gray-300 tracking-widest uppercase">
            ORBITAL_X_SYSTEM
          </span>
        </div>

        <div className="flex items-center space-x-6 font-mono text-xs tracking-wider">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">SYSTEM_HEALTH:</span>
            <span className="text-[#00FF66] font-bold">STABLE</span>
          </div>
          <div className="text-gray-400">
            {currentTime} UTC
          </div>
        </div>
      </div>

      {/* 2. TOP SPLIT SECTION: 3D GLOBE (LEFT) + STATION DETAILS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 3D Holographic Globe Viewport */}
        <div className="lg:col-span-7 bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden flex flex-col relative min-h-[420px] shadow-2xl">
          <div className="h-10 px-5 border-b border-gray-800/80 bg-[#0c1326]/60 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <RadioTower size={15} className="text-[#00F0FF]" />
              <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                GLOBAL ANTENNA COVERAGE
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              {stations.length} ACTIVE DOWNLINKS
            </span>
          </div>

          {/* Interactive Globe Canvas */}
          <div className="flex-1 relative w-full h-[370px]">
            <Scene 
              fleetData={fleetData}
              groundStations={stations}
              showRings={true}
              showLabels={true}
              showUplinks={true}
              nightMode={true}
              autoRotate={true}
            />

            {/* Holographic Watermark Overlay */}
            <div className="absolute top-3 left-4 pointer-events-none opacity-20 text-[#00F0FF] font-mono font-black text-2xl tracking-[0.3em]">
              STATIONS
            </div>

            {/* Quick Station Selector Pills on Globe bottom */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-2 overflow-x-auto pb-1 z-10 pointer-events-auto">
              {stations.map(st => (
                <button
                  key={st._id || st.stationId}
                  onClick={() => setSelectedStation(st)}
                  className={`px-3 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all border ${
                    activeStation.stationId === st.stationId
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : 'bg-[#0A0F1F]/80 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                  }`}
                >
                  {st.stationId} ({st.country || st.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected Ground Station Detail Card */}
        <div className="lg:col-span-5 bg-[#0A0F1F] border border-gray-800 rounded-lg p-6 flex flex-col justify-between shadow-2xl relative">
          
          <div>
            {/* Header: Station ID & Status Badge */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-mono font-bold text-[#00F0FF] tracking-wider">
                {activeStation.stationId}
              </h2>
              <span className={`px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest flex items-center space-x-1.5 ${
                isOffline 
                  ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border border-[#FF2A2A]/30' 
                  : isDegraded 
                    ? 'bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/30' 
                    : 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOffline ? 'bg-[#FF2A2A]' : isDegraded ? 'bg-[#FFB020]' : 'bg-[#00FF66]'
                }`}></span>
                <span>{isOffline ? 'OFFLINE' : isDegraded ? 'DEGRADED' : 'ACTIVE / NOMINAL'}</span>
              </span>
            </div>

            {/* Station Title & Location */}
            <div className="mb-6">
              <h3 className="text-white font-mono text-sm font-bold tracking-wider uppercase mb-1">
                {activeStation.name}
              </h3>
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
                <MapPin size={13} className="text-[#00F0FF]" />
                <span>{activeStation.locationName || `${activeStation.country} (${activeStation.latitude?.toFixed(2)}°, ${activeStation.longitude?.toFixed(2)}°)`}</span>
              </div>
            </div>

            <div className="border-t border-gray-800/80 pt-5 space-y-5">
              
              {/* Connected Satellites */}
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
                  CONNECTED SATELLITES
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeStation.connectedSatellites && activeStation.connectedSatellites.length > 0 ? (
                    activeStation.connectedSatellites.map((sat, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-mono text-xs tracking-wider font-bold shadow-sm"
                      >
                        {typeof sat === 'object' ? `${sat.satelliteId || 'SAT-001'} (${sat.name || 'ORION'})` : `SAT-${idx + 1}`}
                      </span>
                    ))
                  ) : (
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-mono text-xs tracking-wider font-bold">
                        SAT-001 (ORION)
                      </span>
                      <span className="px-3 py-1 bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] rounded font-mono text-xs tracking-wider font-bold">
                        SAT-003 (AURORA)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signal Quality Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px]">SIGNAL QUALITY</span>
                  <span className={`font-bold ${
                    (activeStation.signalQuality || 98) < 70 ? 'text-[#FFB020]' : 'text-[#00F0FF]'
                  }`}>
                    {activeStation.signalQuality || 98}%
                  </span>
                </div>
                <div className="w-full bg-[#121C36] h-2 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className={`h-full transition-all duration-500 shadow-sm ${
                      (activeStation.signalQuality || 98) < 70 
                        ? 'bg-gradient-to-r from-[#FFB020]/70 to-[#FFB020]' 
                        : 'bg-gradient-to-r from-[#00F0FF]/60 to-[#00F0FF]'
                    }`}
                    style={{ width: `${activeStation.signalQuality || 98}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Contact & Next Window */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#121C36]/60 border border-gray-800 rounded p-3 font-mono">
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                    CURRENT CONTACT
                  </span>
                  <span className="text-white text-xs font-bold tracking-wider">
                    {activeStation.lastContact 
                      ? new Date(activeStation.lastContact).toUTCString().slice(17, 25) + ' UTC' 
                      : '14:22:05 UTC'}
                  </span>
                </div>

                <div className="bg-[#121C36]/60 border border-gray-800 rounded p-3 font-mono">
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">
                    NEXT WINDOW
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white text-xs font-bold tracking-wider">
                      {activeStation.nextContact 
                        ? new Date(activeStation.nextContact).toUTCString().slice(17, 25) + ' UTC' 
                        : '15:45:10 UTC'}
                    </span>
                    <span className="text-[#FFB020] text-[10px] font-bold">
                      -01:23:05
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Diagnostics Action */}
          <div className="mt-6 pt-4 border-t border-gray-800/80">
            {diagnosticsMessage && (
              <div className="mb-3 px-3 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/40 rounded text-[#00F0FF] font-mono text-[10px] tracking-wider animate-in fade-in">
                {diagnosticsMessage}
              </div>
            )}
            <button
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className="w-full flex items-center justify-center space-x-2 border border-[#00F0FF] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] font-mono text-xs font-bold tracking-widest px-4 py-2.5 rounded transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50"
            >
              <Radio size={14} className={diagnosticsRunning ? 'animate-pulse' : ''} />
              <span>{diagnosticsRunning ? 'RUNNING SWEEP...' : 'DIAGNOSTICS'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* 3. BOTTOM SECTION: GLOBAL STATION NETWORK TABLE */}
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RadioTower size={16} className="text-[#00F0FF]" />
            <h3 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
              GLOBAL STATION NETWORK
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchData}
              title="Refresh telemetry"
              className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
            <button 
              onClick={handleExport}
              title="Export CSV"
              className="text-gray-400 hover:text-[#00F0FF] p-1.5 rounded hover:bg-gray-800 transition-colors"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0e162c] text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-800">
              <tr>
                <th className="py-3 px-6">STATION ID</th>
                <th className="py-3 px-6">LOCATION</th>
                <th className="py-3 px-6">STATUS</th>
                <th className="py-3 px-6 text-center">SAT LINKS</th>
                <th className="py-3 px-6 text-center">SIGNAL</th>
                <th className="py-3 px-6">LAST CONTACT</th>
                <th className="py-3 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {stations.map((st) => {
                const isSelected = activeStation.stationId === st.stationId;
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
                    {/* Station ID */}
                    <td className="py-3.5 px-6 text-[#00F0FF] font-bold">
                      {st.stationId}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-6 text-gray-200">
                      {st.country ? `${st.name.split(' ')[0]}, ${st.country}` : st.name}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        offline ? 'text-[#FF2A2A]' : degraded ? 'text-[#FFB020]' : 'text-[#00FF66]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          offline ? 'bg-[#FF2A2A]' : degraded ? 'bg-[#FFB020]' : 'bg-[#00FF66]'
                        }`}></span>
                        <span>{st.status || 'ACTIVE'}</span>
                      </span>
                    </td>

                    {/* Sat Links */}
                    <td className="py-3.5 px-6 text-center">
                      {(st.connectedSatellites || []).length || (st.stationId === 'GS-001' ? 2 : st.stationId === 'GS-002' ? 1 : st.stationId === 'GS-003' ? 3 : 0)}
                    </td>

                    {/* Signal */}
                    <td className={`py-3.5 px-6 text-center font-bold ${
                      (st.signalQuality || 90) < 70 ? 'text-[#FFB020]' : 'text-gray-200'
                    }`}>
                      {st.signalQuality || (st.stationId === 'GS-002' ? 64 : 92)}%
                    </td>

                    {/* Last Contact */}
                    <td className="py-3.5 px-6 text-gray-400">
                      {st.lastContact 
                        ? new Date(st.lastContact).toUTCString().slice(17, 25) + ' UTC' 
                        : '14:22:05 UTC'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStation(st);
                          }}
                          className="text-gray-400 hover:text-[#00F0FF] transition-colors"
                          title="Focus on station"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchData();
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Ping Station"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
