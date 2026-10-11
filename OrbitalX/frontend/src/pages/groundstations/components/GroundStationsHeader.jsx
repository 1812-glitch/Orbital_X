import React, { useState, useEffect } from 'react';
import { 
  RadioTower, 
  Sun, 
  Moon, 
  Play, 
  Pause, 
  Radio, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

const UtcClock = React.memo(function UtcClock() {
  const [time, setTime] = useState(() => new Date().toUTCString().slice(17, 25));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time} UTC</span>;
});

export default function GroundStationsHeader({
  activeStation,
  nightMode,
  setNightMode,
  autoRotate,
  setAutoRotate,
  showDiagnostics,
  setShowDiagnostics,
  showNetworkTable,
  setShowNetworkTable,
  stationsCount,
  fetchData
}) {
  return (
    <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between border-b border-gray-800 pb-3 gap-3">
      {/* Left: System Status & Focus Indicator */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 bg-[#0A0F1F] border border-gray-800 px-3 py-1.5 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_#00F0FF]"></span>
          <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
            ORBITAL_X_SYSTEM
          </span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs bg-[#121C36]/70 border border-[#00F0FF]/30 px-3 py-1.5 rounded-lg">
          <RadioTower size={14} className="text-[#00F0FF]" />
          <span className="text-gray-400">ACTIVE GROUND NODE:</span>
          <span className="text-white font-bold">{activeStation.stationId}</span>
          <span className="text-[#00F0FF]">({activeStation.country || activeStation.name})</span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-gray-400 hidden sm:flex">
          <span>STATUS:</span>
          <span className="text-[#00FF66] font-bold">STABLE NOMINAL</span>
          <span className="text-gray-600">|</span>
          <span className="text-white font-bold"><UtcClock /></span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <button
          id="toggle-day-night-btn"
          onClick={() => setNightMode(!nightMode)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all font-bold ${
            nightMode 
              ? 'bg-[#121C36] text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
              : 'bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/50 shadow-[0_0_10px_rgba(255,176,0,0.2)]'
          }`}
          title="Toggle Earth Day / Night Illumination"
        >
          {nightMode ? <Moon size={13} className="text-[#00F0FF]" /> : <Sun size={13} className="text-[#FFB000]" />}
          <span>{nightMode ? 'NIGHT LIGHTS' : 'DAY MARBLE'}</span>
        </button>

        <button
          id="toggle-rotation-btn"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all font-bold ${
            autoRotate 
              ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/40 shadow-[0_0_10px_rgba(0,255,102,0.15)]' 
              : 'bg-gray-800 text-gray-300 border-gray-700'
          }`}
          title="Toggle Earth Auto-Rotation vs Static Position"
        >
          {autoRotate ? <Play size={12} className="text-[#00FF66]" /> : <Pause size={12} />}
          <span>{autoRotate ? 'ROTATION' : 'STATIC'}</span>
        </button>

        <button
          id="toggle-diagnostics-btn"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all font-bold ${
            showDiagnostics 
              ? 'bg-[#00F0FF] text-[#0A0F1F] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]' 
              : 'bg-[#0A0F1F] text-gray-300 border-gray-700 hover:border-[#00F0FF] hover:text-[#00F0FF]'
          }`}
          title="Open / Close Ground Station RF Diagnostics"
        >
          <Radio size={13} className={showDiagnostics ? 'animate-pulse' : ''} />
          <span>DIAGNOSTICS</span>
          <span className={`text-[9px] px-1 rounded ${showDiagnostics ? 'bg-[#0A0F1F] text-[#00F0FF]' : 'bg-gray-800 text-gray-400'}`}>
            {showDiagnostics ? 'ACTIVE' : 'READY'}
          </span>
        </button>

        <button
          id="toggle-station-network-btn"
          onClick={() => setShowNetworkTable(!showNetworkTable)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all font-bold ${
            showNetworkTable 
              ? 'bg-[#121C36] text-[#00F0FF] border-[#00F0FF]/50' 
              : 'bg-[#0A0F1F] text-gray-400 border-gray-800 hover:text-white'
          }`}
          title="Show / Hide Global Station Network Table"
        >
          <Layers size={13} />
          <span>STATIONS NETWORK</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono font-bold">
            {stationsCount}
          </span>
        </button>

        <button
          onClick={fetchData}
          title="Refresh Ground Station Telemetry"
          className="p-1.5 text-gray-400 hover:text-[#00F0FF] bg-[#0A0F1F] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
