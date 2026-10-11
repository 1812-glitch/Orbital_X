import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Eye 
} from 'lucide-react';
import satelliteService from '../../services/satelliteService';
import { useSatellite } from '../../context/SatelliteContext';
import CommsHeader from './components/CommsHeader';
import CommsTargetDropdown from './components/CommsTargetDropdown';
import CommsMetricsSidebar from './components/CommsMetricsSidebar';
import CommsEventLog from './components/CommsEventLog';

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
  const [sending, setSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalBottomRef = useRef(null);

  // Closable panels state
  const [showMetricsSidebar, setShowMetricsSidebar] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [isEventLogMinimized, setIsEventLogMinimized] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // Dropdown states for CubeSat / Satellite Selection
  const [isSatDropdownOpen, setIsSatDropdownOpen] = useState(false);
  const [satSearchTerm, setSatSearchTerm] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const satDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (satDropdownRef.current && !satDropdownRef.current.contains(event.target)) {
        setIsSatDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (selectedSatellite && satellites.length > 0) {
      const matched = satellites.find(s => s._id === selectedSatellite._id || s.satelliteId === selectedSatellite.satelliteId);
      if (matched) setSelectedSat(matched);
    }
  }, [selectedSatellite, satellites]);

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

    setEventLogs([
      { time: '14:22:05.112', level: 'INFO', src: 'SYS_COMM', text: 'RX: Packet validation successful. Checksum OK.' },
      { time: '14:21:45.890', level: 'INFO', src: 'SAT_001', text: 'RX: CMD_ACK (ADJUST_SOLAR_ARRAY) - Status: COMPLETE.' },
      { time: '14:21:05.002', level: 'INFO', src: 'TX_CNTRL', text: 'TX: Dispatching command ADJUST_SOLAR_ARRAY to SAT_001 via GS-001.' },
      { time: '14:19:12.445', level: 'WARN', src: 'GS_001', text: 'Signal fluctuation detected. SNR dropped to 12dB momentarily. Auto-corrected.' },
      { time: '14:18:27.100', level: 'INFO', src: 'DATA_LNK', text: 'RX: Telemetry dump completed. 142kb written to buffer.' }
    ]);
  }, []);

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

    setMessages(prev => [
      ...prev,
      {
        type: 'tx',
        sender: `MISSION CONTROL [${commandPriority}]`,
        time: timeStr,
        text: `CMD: ${newCmd}`
      }
    ]);

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
      <CommsHeader
        currentSat={currentSat}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchParam={searchParam}
        setSearchParam={setSearchParam}
        showMetricsSidebar={showMetricsSidebar}
        setShowMetricsSidebar={setShowMetricsSidebar}
        showEventLog={showEventLog}
        setShowEventLog={setShowEventLog}
        eventLogsCount={eventLogs.length}
      />

      {/* Main Terminal Workspace */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className={`${
          showMetricsSidebar ? 'xl:col-span-9' : 'xl:col-span-12'
        } w-full bg-[#070B14] border border-gray-800 rounded-lg flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300`}>
          
          {/* Terminal Session Header */}
          <div className="p-3 sm:p-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between bg-[#0A0F1F] gap-3 relative z-30">
            <CommsTargetDropdown
              currentSat={currentSat}
              isSatDropdownOpen={isSatDropdownOpen}
              setIsSatDropdownOpen={setIsSatDropdownOpen}
              satDropdownRef={satDropdownRef}
              targetTypeFilter={targetTypeFilter}
              setTargetTypeFilter={setTargetTypeFilter}
              satSearchTerm={satSearchTerm}
              setSatSearchTerm={setSatSearchTerm}
              filteredFleet={filteredFleet}
              setSelectedSat={setSelectedSat}
              selectSatellite={selectSatellite}
              openDetailModal={openDetailModal}
            />

            {/* Right Header Controls */}
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

          {/* Terminal Messages */}
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
            <select
              value={commandPriority}
              onChange={(e) => setCommandPriority(e.target.value)}
              className="bg-[#12192b] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-2.5 focus:outline-none focus:border-[#00F0FF]/50 uppercase cursor-pointer shrink-0"
            >
              <option value="NORMAL">NORMAL ▼</option>
              <option value="HIGH">HIGH</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>

            <input 
              type="text"
              placeholder={`Enter uplink command for ${currentSat.satelliteId || 'target'} (e.g. EXEC ADCS_CALIBRATE, DUMP_LOGS)...`}
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              className="flex-1 bg-[#12192b] border border-gray-800 rounded px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
            />

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

        <CommsMetricsSidebar
          showMetricsSidebar={showMetricsSidebar}
          setShowMetricsSidebar={setShowMetricsSidebar}
          currentSat={currentSat}
        />
      </div>

      <CommsEventLog
        showEventLog={showEventLog}
        setShowEventLog={setShowEventLog}
        eventLogs={eventLogs}
        handleExportLog={handleExportLog}
        isEventLogMinimized={isEventLogMinimized}
        setIsEventLogMinimized={setIsEventLogMinimized}
      />
    </div>
  );
}
