import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  ShieldCheck, 
  Download, 
  SlidersHorizontal,
  Eye,
  Satellite,
  ChevronDown,
  ChevronUp,
  Check,
  Radio,
  Wifi,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Activity,
  FileText
} from 'lucide-react';
import satelliteService from '../../services/satelliteService';
import { useSatellite } from '../../context/SatelliteContext';

export default function Communications() {
  const [activeTab, setActiveTab] = useState('COMMAND'); // 'LIVE FEED' | 'COMMAND' | 'ARCHIVE'
  const [satellites, setSatellites] = useState([]);
  const { selectedSatellite, selectSatellite, openDetailModal } = useSatellite();
  const [selectedSat, setSelectedSat] = useState(null);
  const [searchParam, setSearchParam] = useState('');
  const [commandPriority, setCommandPriority] = useState('NORMAL');
  const [commandText, setCommandText] = useState('');
  const [messages, setMessages] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 25));
  const [sending, setSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalBottomRef = useRef(null);

  // Closable panels state
  const [showMetricsSidebar, setShowMetricsSidebar] = useState(false); // Closed by default so terminal has maximum width
  const [showEventLog, setShowEventLog] = useState(false); // Closed/minimized by default so terminal has maximum height
  const [isEventLogMinimized, setIsEventLogMinimized] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // Dropdown states for CubeSat / Satellite Selection
  const [isSatDropdownOpen, setIsSatDropdownOpen] = useState(false);
  const [satSearchTerm, setSatSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL'); // 'ALL' | 'CUBESAT'
  const satDropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (satDropdownRef.current && !satDropdownRef.current.contains(event.target)) {
        setIsSatDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Satellites & Initialize Comm Feed
  useEffect(() => {
    const loadFleet = async () => {
      try {
        const res = await satelliteService.getAll();
        const fleet = res.data || [];
        setSatellites(fleet);
        if (fleet.length > 0 && !selectedSat) {
          setSelectedSat(fleet[0]);
        }
      } catch (err) {
        console.error('Failed to load satellites for communications:', err);
      }
    };
    loadFleet();
  }, []);

  // Sync with global SatelliteContext
  useEffect(() => {
    if (selectedSatellite && satellites.length > 0) {
      const matched = satellites.find(s => s._id === selectedSatellite._id || s.satelliteId === selectedSatellite.satelliteId);
      if (matched) setSelectedSat(matched);
    }
  }, [selectedSatellite, satellites]);

  // Default Seed Messages
  useEffect(() => {
    setMessages([
      { type: 'system', text: `--- ENCRYPTED COMM SESSION INITIATED AT ${new Date(Date.now() - 15 * 60000).toUTCString().slice(17, 25)} UTC ---` },
      { 
        type: 'tx', 
        sender: 'MISSION CONTROL', 
        time: '14:18:22 UTC', 
        text: 'CMD: REQUEST_TELEMETRY_DUMP -ARG FULL -SYS NAV,PWR' 
      },
      { 
        type: 'rx', 
        sender: 'SAT-001 / ORION', 
        time: '14:18:25 UTC', 
        text: 'ACK: CMD_RECEIVED. PREPARING DUMP...\n[OK] NAV DATA PACKET 1/1\n[OK] PWR DATA PACKET 1/2\n[OK] PWR DATA PACKET 2/2\nTX_COMPLETE. 142kb TRANSFERRED.' 
      }
    ]);

    // Seed Event Log
    setEventLogs([
      { time: '14:22:05.112', level: 'INFO', src: 'SYS_COMM', text: 'RX: Packet validation successful. Checksum OK.' },
      { time: '14:21:45.890', level: 'INFO', src: 'SAT_001', text: 'RX: CMD_ACK (ADJUST_SOLAR_ARRAY) - Status: COMPLETE.' },
      { time: '14:21:05.002', level: 'INFO', src: 'TX_CNTRL', text: 'TX: Dispatching command ADJUST_SOLAR_ARRAY to SAT_001 via GS-001.' },
      { time: '14:19:12.445', level: 'WARN', src: 'GS_001', text: 'Signal fluctuation detected. SNR dropped to 12dB momentarily. Auto-corrected.' },
      { time: '14:18:27.100', level: 'INFO', src: 'DATA_LNK', text: 'RX: Telemetry dump completed. 142kb written to buffer.' }
    ]);
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (autoScroll) {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleSendCommand = (e) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    const newCmd = commandText.trim();
    const timeStr = new Date().toUTCString().slice(17, 25) + ' UTC';

    // Append TX message
    setMessages(prev => [
      ...prev,
      {
        type: 'tx',
        sender: `MISSION CONTROL [${commandPriority}]`,
        time: timeStr,
        text: `CMD: ${newCmd}`
      }
    ]);

    // Append Event log
    setEventLogs(prev => [
      {
        time: new Date().toISOString().slice(11, 23),
        level: 'INFO',
        src: 'TX_CNTRL',
        text: `TX [${commandPriority}]: Dispatched '${newCmd}' to ${selectedSat?.satelliteId || 'SAT-001'}.`
      },
      ...prev
    ]);

    setCommandText('');
    setSending(true);

    // Simulated Satellite Response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          type: 'rx',
          sender: `${selectedSat?.satelliteId || 'SAT-001'} / ${selectedSat?.name || 'ORION'}`,
          time: new Date().toUTCString().slice(17, 25) + ' UTC',
          text: `ACK: CMD_EXEC [${newCmd}] SUCCESSFUL.\n[OK] SUBSYSTEM STATUS: NOMINAL\n[OK] BUFFER FLUSHED.`
        }
      ]);
      setEventLogs(prev => [
        {
          time: new Date().toISOString().slice(11, 23),
          level: 'INFO',
          src: selectedSat?.satelliteId || 'SAT-001',
          text: `RX: CMD_ACK for '${newCmd}' received with status code 0 (SUCCESS).`
        },
        ...prev
      ]);
      setSending(false);
    }, 1200);
  };

  const handleClearBuffer = () => {
    setMessages([
      { type: 'system', text: `--- TERMINAL BUFFER CLEARED AT ${new Date().toUTCString().slice(17, 25)} UTC ---` }
    ]);
  };

  const handleExportLog = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Timestamp,Level,Source,Message",
        ...eventLogs.map(l => `"${l.time}","${l.level}","${l.src}","${l.text.replace(/"/g, '""')}"`)
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbitalx_comm_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentSat = selectedSat || {
    satelliteId: 'SAT-001',
    name: 'ORION',
    orbitType: 'LEO-POLAR',
    status: 'ACTIVE',
    type: 'CubeSat 3U'
  };

  // Fallback fleet if satellites not loaded
  const displayFleet = satellites.length > 0 ? satellites : [
    { _id: '1', satelliteId: 'SAT-001', name: 'ORION', orbitType: 'LEO-POLAR', status: 'ACTIVE', type: 'CubeSat 3U' },
    { _id: '2', satelliteId: 'SAT-002', name: 'NOVA', orbitType: 'MEO-EQ', status: 'ACTIVE', type: 'CubeSat 6U' },
    { _id: '3', satelliteId: 'SAT-003', name: 'AURORA', orbitType: 'GEO-SYNC', status: 'WARNING', type: 'CubeSat 12U' },
    { _id: '4', satelliteId: 'SAT-004', name: 'VANGUARD', orbitType: 'LEO-SSO', status: 'OFFLINE', type: 'LEO Constellation' },
    { _id: '5', satelliteId: 'CUBE-01', name: 'ALPHA-SAT', orbitType: 'LEO-500KM', status: 'ACTIVE', type: 'CubeSat 1U' },
  ];

  const filteredFleet = displayFleet.filter(sat => {
    const matchesSearch = 
      (sat.name && sat.name.toLowerCase().includes(satSearchTerm.toLowerCase())) ||
      (sat.satelliteId && sat.satelliteId.toLowerCase().includes(satSearchTerm.toLowerCase())) ||
      (sat.type && sat.type.toLowerCase().includes(satSearchTerm.toLowerCase()));

    const isCube = (sat.type && sat.type.toLowerCase().includes('cube')) ||
      (sat.name && sat.name.toLowerCase().includes('cube')) ||
      (sat.satelliteId && sat.satelliteId.toLowerCase().includes('cube')) ||
      sat.satelliteId?.startsWith('SAT-') ||
      sat.satelliteId?.startsWith('CUBE-');

    if (targetTypeFilter === 'CUBESAT') {
      return matchesSearch && isCube;
    }
    return matchesSearch;
  });

  return (
    <div className={`w-full h-full font-sans space-y-4 pb-6 transition-all ${
      isTerminalMaximized ? 'fixed inset-0 z-50 bg-[#050810] p-4 overflow-y-auto' : ''
    }`}>
      
      {/* 1. ULTRA-WIDE TOP HEADER WITH SYSTEM CONTROLS & SIDEBAR TOGGLE BUTTONS */}
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

        {/* Center: Comm Tabs */}
        <div className="flex items-center bg-[#12192b] border border-gray-800 rounded p-1 font-mono text-xs font-bold self-start xl:self-auto">
          {['LIVE FEED', 'COMMAND', 'ARCHIVE'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 rounded transition-all ${
                activeTab === tab 
                  ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
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
            <span className="text-white font-bold">{currentTime} UTC</span>
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
              {eventLogs.length}
            </span>
          </button>

        </div>
      </div>

      {/* 2. MAIN TERMINAL WORKSPACE (EXPANDS TO 100% WIDTH WHEN SIDEBAR IS CLOSED) */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* MAIN TERMINAL CONSOLE: 12 COLS WHEN SIDEBAR CLOSED, 9 COLS WHEN OPEN */}
        <div className={`${
          showMetricsSidebar ? 'xl:col-span-9' : 'xl:col-span-12'
        } w-full bg-[#070B14] border border-gray-800 rounded-lg flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300`}>
          
          {/* Terminal Session Header */}
          <div className="p-3 sm:p-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between bg-[#0A0F1F] gap-3 relative z-30">
            
            {/* Left: CubeSat / Satellite Dropdown Menu */}
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
                  
                  {/* Dropdown Header & Search */}
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

                    {/* Filter Tabs: ALL vs CUBESATS ONLY */}
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

                    {/* Search Input */}
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

                  {/* Satellite / CubeSat List */}
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

                  {/* Dropdown Footer */}
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

            {/* Right Header Controls: Inspect Specs, Buffer Clear, Auto-scroll, Maximize */}
            <div className="flex items-center space-x-2 font-mono text-xs">
              
              <button
                id="comm-inspect-specs-btn"
                onClick={() => openDetailModal(currentSat)}
                className="px-2.5 py-1.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Inspect Satellite Details"
              >
                <Eye size={12} />
                <span className="hidden sm:inline">SPECS</span>
              </button>

              <button
                onClick={handleClearBuffer}
                className="p-1.5 text-gray-400 hover:text-[#FF2A2A] hover:bg-[#FF2A2A]/10 rounded border border-transparent hover:border-[#FF2A2A]/30 transition-colors"
                title="Clear Terminal Buffer"
              >
                <Trash2 size={13} />
              </button>

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                  autoScroll ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30' : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}
                title="Toggle Auto-Scroll"
              >
                AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => setIsTerminalMaximized(!isTerminalMaximized)}
                className="p-1.5 text-gray-400 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 rounded border border-gray-800 hover:border-[#00F0FF]/30 transition-colors"
                title={isTerminalMaximized ? "Restore Terminal" : "Maximize Terminal"}
              >
                {isTerminalMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>

              <span className="px-2 py-1 rounded bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
                <span className="hidden sm:inline">LINK ACTIVE</span>
              </span>
            </div>

          </div>

          {/* Terminal Messages Scroll Content - MAXIMUM AREA & FULL EXTENSION */}
          <div className={`flex-1 p-5 sm:p-6 overflow-y-auto font-mono text-xs space-y-4 bg-[#050912] ${
            isTerminalMaximized ? 'min-h-[70vh]' : showMetricsSidebar ? 'min-h-[540px]' : 'min-h-[620px]'
          }`}>
            {messages.map((m, idx) => {
              if (m.type === 'system') {
                return (
                  <div key={idx} className="text-center text-gray-500 text-[11px] py-1 border-y border-gray-800/40">
                    {m.text}
                  </div>
                );
              }

              if (m.type === 'tx') {
                return (
                  <div key={idx} className="space-y-1 max-w-[85%]">
                    <span className="text-gray-400 text-[10px] block">
                      {m.sender} [{m.time}]
                    </span>
                    <div className="p-3.5 rounded bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] whitespace-pre-wrap shadow-md leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="space-y-1 ml-auto max-w-[85%]">
                  <span className="text-[#00FF66] text-[10px] block text-right">
                    [{m.time}] {m.sender}
                  </span>
                  <div className="p-3.5 rounded bg-[#0A1628] border border-gray-700 text-gray-200 whitespace-pre-wrap shadow-md leading-relaxed">
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>

          {/* Bottom Command Dispatch Input Bar */}
          <form onSubmit={handleSendCommand} className="p-3 sm:p-4 border-t border-gray-800 bg-[#0A0F1F] flex items-center space-x-2">
            
            {/* Priority Selector Dropdown */}
            <select
              value={commandPriority}
              onChange={(e) => setCommandPriority(e.target.value)}
              className="bg-[#12192b] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-2.5 focus:outline-none focus:border-[#00F0FF]/50 uppercase cursor-pointer shrink-0"
            >
              <option value="NORMAL">NORMAL ▼</option>
              <option value="HIGH">HIGH</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>

            {/* Input field */}
            <input 
              type="text"
              placeholder={`Enter uplink command for ${currentSat.satelliteId || 'target'} (e.g. EXEC ADCS_CALIBRATE, DUMP_LOGS)...`}
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              className="flex-1 bg-[#12192b] border border-gray-800 rounded px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !commandText.trim()}
              className="px-5 py-2.5 bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] rounded font-mono text-xs font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-40 flex items-center space-x-1.5 shrink-0"
            >
              <Send size={13} />
              <span className="hidden sm:inline">DISPATCH</span>
            </button>
          </form>

        </div>

        {/* CLOSABLE RIGHT SIDEBAR: COMMUNICATION METRICS & LINK SPECS */}
        {showMetricsSidebar && (
          <div className="xl:col-span-3 w-full bg-[#0A0F1F] border border-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-xl space-y-4 animate-in fade-in slide-in-from-right duration-200">
            
            <div>
              {/* Sidebar Header with Close Button */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <Activity size={14} className="text-[#00F0FF]" />
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    COMM METRICS
                  </h3>
                </div>
                
                {/* ✕ Close Sidebar Button */}
                <button
                  onClick={() => setShowMetricsSidebar(false)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  title="Close Metrics Sidebar (Maximize Terminal)"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Selected Target Quick Overview Card */}
              <div className="bg-[#12192b]/70 border border-gray-800 rounded p-3 mb-4 font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">TARGET IN FOCUS</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">
                    ONLINE
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-1">
                  {currentSat.satelliteId} - {currentSat.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-2 border-t border-gray-800/80">
                  <div>
                    <span className="text-gray-500 block">TYPE</span>
                    <span className="text-gray-200">{currentSat.type || 'CubeSat 3U'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">ORBIT</span>
                    <span className="text-[#00F0FF]">{currentSat.orbitType || 'LEO-POLAR'}</span>
                  </div>
                </div>
              </div>

              {/* Signal Strength & Latency Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                
                {/* Signal Strength */}
                <div className="bg-[#121C36]/70 border border-gray-800 rounded p-2.5 font-mono">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                    SIGNAL STR
                  </span>
                  <div className="text-lg font-bold text-white mb-1.5">
                    -62 <span className="text-xs font-normal text-gray-400">dBm</span>
                  </div>
                  {/* 5-bar signal strength meter */}
                  <div className="flex items-end space-x-1 h-3">
                    <span className="w-1.5 h-1 bg-[#00F0FF] rounded-xs"></span>
                    <span className="w-1.5 h-1.5 bg-[#00F0FF] rounded-xs"></span>
                    <span className="w-1.5 h-2 bg-[#00F0FF] rounded-xs"></span>
                    <span className="w-1.5 h-2.5 bg-[#00F0FF] rounded-xs"></span>
                    <span className="w-1.5 h-3 bg-[#00F0FF] rounded-xs"></span>
                  </div>
                </div>

                {/* Latency */}
                <div className="bg-[#121C36]/70 border border-gray-800 rounded p-2.5 font-mono">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                    LATENCY
                  </span>
                  <div className="text-lg font-bold text-white mb-1.5">
                    124 <span className="text-xs font-normal text-gray-400">ms</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#00FF66] h-full w-[35%]"></div>
                  </div>
                </div>

              </div>

              {/* Link Parameters Table */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500">Link Status</span>
                  <span className="text-[#00FF66] font-bold">CONNECTED</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500">Last Contact</span>
                  <span className="text-white">14:22:05 UTC</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500">Ground Station</span>
                  <span className="text-[#00F0FF] font-bold">GS-001 INDIA</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500">Protocol</span>
                  <span className="text-gray-300">S-BAND XFER</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Encryption</span>
                  <span className="text-[#00FF66] font-bold flex items-center space-x-1">
                    <ShieldCheck size={12} />
                    <span>AES-256</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Quick Frequency Uplink Indicator */}
            <div className="p-2.5 rounded bg-[#0A1628] border border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between mt-2">
              <span>UPLINK FREQ: 2025.5 MHz</span>
              <span className="text-[#00F0FF] font-bold">LOCKED</span>
            </div>

          </div>
        )}

      </div>

      {/* 3. CLOSABLE / MINIMIZABLE BOTTOM EVENT LOG */}
      {showEventLog && (
        <div className="w-full bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden shadow-xl animate-in fade-in duration-200">
          
          {/* Log Header with Controls */}
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-[#070C18]">
            <div className="flex items-center space-x-3 font-mono">
              <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center space-x-2">
                <FileText size={13} className="text-[#00F0FF]" />
                <span>COMMUNICATION EVENT LOG</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-[#00F0FF]">
                {eventLogs.length} EVENTS
              </span>
            </div>

            <div className="flex items-center space-x-3 font-mono text-xs">
              <button
                onClick={handleExportLog}
                className="flex items-center space-x-1.5 text-gray-400 hover:text-[#00F0FF] transition-colors"
                title="Download CSV log"
              >
                <Download size={12} />
                <span className="uppercase text-[11px]">EXPORT</span>
              </button>

              <button
                onClick={() => setIsEventLogMinimized(!isEventLogMinimized)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title={isEventLogMinimized ? "Expand Event Log" : "Minimize Event Log"}
              >
                {isEventLogMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              <button
                onClick={() => setShowEventLog(false)}
                className="p-1 text-gray-400 hover:text-[#FF2A2A] transition-colors"
                title="Close Event Log (Maximize Space)"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Log Lines (Collapsed or Expanded) */}
          {!isEventLogMinimized && (
            <div className="p-4 font-mono text-xs space-y-2 max-h-48 overflow-y-auto bg-[#050912]">
              {eventLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 border-l-2 border-transparent hover:border-[#00F0FF] pl-2 py-0.5 transition-colors">
                  <span className="text-gray-500 whitespace-nowrap text-[11px]">{log.time}</span>
                  <span className={`font-bold whitespace-nowrap text-[11px] ${
                    log.level === 'WARN' ? 'text-[#FFB020]' : log.level === 'ERROR' ? 'text-[#FF2A2A]' : 'text-[#00F0FF]'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-400 whitespace-nowrap text-[11px]">{log.src}</span>
                  <span className="text-gray-300 text-[11px] leading-tight">{log.text}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
