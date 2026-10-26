import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PanelRightClose, 
  PanelRightOpen, 
  FileText 
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

export default function CommsHeader({
  currentSat,
  searchParam,
  setSearchParam,
  showMetricsSidebar,
  setShowMetricsSidebar,
  showEventLog,
  setShowEventLog,
  eventLogsCount
}) {
  return (
    <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between border-b border-gray-800 pb-3 gap-3">
      {/* Left: Brand + Active Target */}
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-mono font-bold text-white tracking-widest uppercase flex items-center space-x-2">
          <span className="text-[#00F0FF]">ORBITAL-X</span>
          <span className="hidden sm:inline">COMMUNICATIONS</span>
        </h1>
        
        <div className="flex items-center space-x-2 bg-[#121C36] px-2.5 py-1 rounded border border-[#00F0FF]/30 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse"></span>
          <span className="text-white font-bold">{currentSat.satelliteId}</span>
          <span className="text-gray-400">({currentSat.name || 'ACTIVE'})</span>
        </div>
      </div>



      {/* Right: Search, Clock & Closable Sidebar Toggle Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48">
          <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
          <input 
            type="text"
            placeholder="Search parameters..."
            value={searchParam}
            onChange={(e) => setSearchParam(e.target.value)}
            className="w-full bg-[#12192b] border border-gray-800 rounded pl-7 pr-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50"
          />
        </div>

        {/* UTC Clock */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded bg-[#0A0F1F] border border-gray-800 text-gray-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]"></span>
          <span className="text-white font-bold"><UtcClock /></span>
        </div>

        {/* TOGGLE BUTTON: METRICS SIDEBAR */}
        <button
          id="toggle-metrics-sidebar-btn"
          onClick={() => setShowMetricsSidebar(!showMetricsSidebar)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border transition-all font-bold ${
            showMetricsSidebar 
              ? 'bg-[#00F0FF] text-[#0A0F1F] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]' 
              : 'bg-[#121C36] text-gray-300 border-gray-700 hover:border-[#00F0FF] hover:text-white'
          }`}
          title={showMetricsSidebar ? "Hide Metrics Sidebar to Maximize Terminal" : "Show Communication Metrics Sidebar"}
        >
          {showMetricsSidebar ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
          <span>METRICS SIDEBAR</span>
          <span className={`text-[9px] px-1 rounded ${showMetricsSidebar ? 'bg-[#0A0F1F] text-[#00F0FF]' : 'bg-gray-800 text-gray-400'}`}>
            {showMetricsSidebar ? 'OPEN' : 'CLOSED'}
          </span>
        </button>

        {/* TOGGLE BUTTON: EVENT LOG */}
        <button
          id="toggle-event-log-btn"
          onClick={() => setShowEventLog(!showEventLog)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border transition-all font-bold ${
            showEventLog 
              ? 'bg-[#121C36] text-[#00F0FF] border-[#00F0FF]/60 shadow-sm' 
              : 'bg-[#0A0F1F] text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-200'
          }`}
          title={showEventLog ? "Hide Communication Event Log" : "Show Communication Event Log"}
        >
          <FileText size={13} />
          <span>EVENT LOG</span>
          <span className="text-[9px] px-1 rounded bg-gray-800 text-gray-300">
            {eventLogsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
