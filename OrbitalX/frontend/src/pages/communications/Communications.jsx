import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Eye,
  Radio,
  Sparkles,
  Terminal,
  Plus,
  RotateCcw
} from 'lucide-react';
import satelliteService from '../../services/satelliteService';
import { groundStationService, FALLBACK_GROUND_STATIONS } from '../../services/groundStationService';
import { cubesatSimService } from '../../services/cubesatSimService';
import { useSatellite } from '../../context/SatelliteContext';
import CommsHeader from './components/CommsHeader';
import CommsTargetDropdown from './components/CommsTargetDropdown';
import CommsMetricsSidebar from './components/CommsMetricsSidebar';
import CommsEventLog from './components/CommsEventLog';
import { TELECOMMAND_CATEGORIES, ALL_TELECOMMANDS } from './telecommands';

export default function Communications() {
  const [satellites, setSatellites] = useState([]);
  const { selectedSatellite, selectSatellite, openDetailModal } = useSatellite();
  const [selectedSat, setSelectedSat] = useState(null);
  const [searchParam, setSearchParam] = useState('');
  const [commandPriority, setCommandPriority] = useState('NORMAL');
  const [commandText, setCommandText] = useState('');
  const [sending, setSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalBottomRef = useRef(null);

  // Ground Stations State
  const [groundStations, setGroundStations] = useState(FALLBACK_GROUND_STATIONS);
  const [selectedGS, setSelectedGS] = useState(FALLBACK_GROUND_STATIONS[0]);

  // Command Suggestions & Presets State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);
  const commandInputRef = useRef(null);
  const suggestionsBoxRef = useRef(null);

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

  // Fetch Ground Stations
  useEffect(() => {
    const fetchGS = async () => {
      try {
        const res = await groundStationService.getAllGroundStations();
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setGroundStations(list);
          setSelectedGS(list[0]);
        }
      } catch (err) {
        console.warn('Failed to load ground stations for communications:', err);
      }
    };
    fetchGS();
  }, []);

  // Filter matching suggestions as user types
  const matchingSuggestions = useMemo(() => {
    const query = commandText.trim().toLowerCase();
    if (!query) return [];
    return ALL_TELECOMMANDS.filter(cmd => 
      cmd.code.toLowerCase().includes(query) ||
      cmd.desc.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [commandText]);

  // Click outside suggestions overlay to dismiss
  useEffect(() => {
    function handleOutsideSuggestions(e) {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target) && commandInputRef.current !== e.target) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideSuggestions);
    return () => document.removeEventListener('mousedown', handleOutsideSuggestions);
  }, []);

  const handleSelectSuggestion = (code) => {
    setCommandText(code);
    setShowSuggestions(false);
    setActiveSuggestionIdx(-1);
    commandInputRef.current?.focus();
  };

  const handleInputKeyDown = (e) => {
    if (matchingSuggestions.length === 0 || !showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev + 1) % matchingSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev - 1 + matchingSuggestions.length) % matchingSuggestions.length);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const target = activeSuggestionIdx >= 0 ? matchingSuggestions[activeSuggestionIdx] : matchingSuggestions[0];
      if (target) handleSelectSuggestion(target.code);
    } else if (e.key === 'Enter' && activeSuggestionIdx >= 0) {
      e.preventDefault();
      handleSelectSuggestion(matchingSuggestions[activeSuggestionIdx].code);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIdx(-1);
    }
  };

  useEffect(() => {
    if (selectedSatellite && satellites.length > 0) {
      const matched = satellites.find(s => s._id === selectedSatellite._id || s.satelliteId === selectedSatellite.satelliteId);
      if (matched) setSelectedSat(matched);
    }
  }, [selectedSatellite, satellites]);

  // Defaults & Persistence
  const DEFAULT_INITIAL_MESSAGES = [
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
  ];

  const DEFAULT_INITIAL_LOGS = [
    { time: '14:22:05.112', level: 'INFO', src: 'SYS_COMM', text: 'RX: Packet validation successful. Checksum OK.' },
    { time: '14:21:45.890', level: 'INFO', src: 'SAT_001', text: 'RX: CMD_ACK (ADJUST_SOLAR_ARRAY) - Status: COMPLETE.' },
    { time: '14:21:05.002', level: 'INFO', src: 'TX_CNTRL', text: 'TX: Dispatching command ADJUST_SOLAR_ARRAY to SAT_001 via GS-001.' },
    { time: '14:19:12.445', level: 'WARN', src: 'GS_001', text: 'Signal fluctuation detected. SNR dropped to 12dB momentarily. Auto-corrected.' },
    { time: '14:18:27.100', level: 'INFO', src: 'DATA_LNK', text: 'RX: Telemetry dump completed. 142kb written to buffer.' }
  ];

  const COMMS_STORAGE_KEY = 'orbitalx_comms_persistent_v1';

  // Helper to load persistent state across panel navigation
  const getStoredCommsState = () => {
    try {
      const saved = localStorage.getItem(COMMS_STORAGE_KEY) || sessionStorage.getItem(COMMS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.terminals) && parsed.terminals.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  };

  const initialStoredState = getStoredCommsState();

  const [terminals, setTerminals] = useState(() => {
    return initialStoredState?.terminals || [{ id: 'term-1', name: 'TERMINAL 1', messages: DEFAULT_INITIAL_MESSAGES }];
  });

  const [activeTerminalId, setActiveTerminalId] = useState(() => {
    return initialStoredState?.activeTerminalId || 'term-1';
  });

  const [eventLogs, setEventLogs] = useState(() => {
    return initialStoredState?.eventLogs || DEFAULT_INITIAL_LOGS;
  });

  // Permanently save state so navigating between panels (e.g. CubeSat Simulator, Overview) NEVER wipes the terminal
  useEffect(() => {
    try {
      const dataToSave = JSON.stringify({
        terminals,
        activeTerminalId,
        eventLogs
      });
      localStorage.setItem(COMMS_STORAGE_KEY, dataToSave);
      sessionStorage.setItem(COMMS_STORAGE_KEY, dataToSave);
    } catch (e) {}
  }, [terminals, activeTerminalId, eventLogs]);

  const activeTerminal = useMemo(() => {
    return terminals.find(t => t.id === activeTerminalId) || terminals[0] || { id: 'term-1', name: 'TERMINAL 1', messages: [] };
  }, [terminals, activeTerminalId]);

  const messages = activeTerminal.messages || [];

  const appendMessageToActiveTerminal = (msg) => {
    setTerminals(prev => prev.map(t => {
      if (t.id === (activeTerminal?.id || activeTerminalId)) {
        return { ...t, messages: [...t.messages, msg] };
      }
      return t;
    }));
  };

  const handleCreateNewTerminal = () => {
    const newIdx = terminals.length + 1;
    const newId = `term-${Date.now()}`;
    const newTerm = {
      id: newId,
      name: `TERMINAL ${newIdx}`,
      messages: [
        { type: 'system', text: `--- COMMAND TERMINAL ${newIdx} OPENED AT ${new Date().toUTCString().slice(17, 25)} UTC ---` },
        { type: 'system', text: `Dedicated command & telemetry session active. Ready to uplink.` }
      ]
    };

    setTerminals(prev => [...prev, newTerm]);
    setActiveTerminalId(newId);

    setEventLogs(prev => [
      {
        time: new Date().toISOString().slice(11, 23),
        level: 'INFO',
        src: 'SYS_COMM',
        text: `New terminal session spawned: TERMINAL ${newIdx} (${newId}).`
      },
      ...prev
    ]);
  };

  const handleCloseTerminal = (termId) => {
    if (terminals.length <= 1) return;
    const remaining = terminals.filter(t => t.id !== termId);
    setTerminals(remaining);
    if (activeTerminalId === termId) {
      setActiveTerminalId(remaining[remaining.length - 1].id);
    }
  };

  const handleResetTerminal = () => {
    const timeStr = new Date().toUTCString().slice(17, 25) + ' UTC';
    const currentName = activeTerminal?.name || 'TERMINAL';
    setTerminals(prev => prev.map(t => {
      if (t.id === (activeTerminal?.id || activeTerminalId)) {
        return {
          ...t,
          messages: [
            { type: 'system', text: `--- ${currentName} BUFFER RESET AT ${timeStr} ---` },
            { type: 'system', text: `Session re-initialized. Ready for uplink commands.` }
          ]
        };
      }
      return t;
    }));

    setEventLogs(prev => [
      {
        time: new Date().toISOString().slice(11, 23),
        level: 'WARN',
        src: 'SYS_COMM',
        text: `Operator manual reset executed on ${currentName}. Buffer cleared.`
      },
      ...prev
    ]);
  };

  useEffect(() => {
    if (autoScroll) {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Real Telecommand Dispatch Handler
  const handleSendCommand = async (e) => {
    if (e) e.preventDefault();
    if (!commandText.trim()) return;

    const newCmd = commandText.trim();
    const timeStr = new Date().toUTCString().slice(17, 25) + ' UTC';
    const gsId = selectedGS?.stationId || 'GS-001';
    const gsName = selectedGS?.name || 'Svalbard Sat Station';
    const satId = selectedSat?.satelliteId || 'SAT-001';
    const satName = selectedSat?.name || 'ORION';

    // Append TX command to active terminal
    appendMessageToActiveTerminal({
      type: 'tx',
      sender: `MISSION CONTROL [${commandPriority}] via ${gsId} (${gsName})`,
      time: timeStr,
      text: `CMD: ${newCmd}`
    });

    setEventLogs(prev => [
      {
        time: new Date().toISOString().slice(11, 23),
        level: 'INFO',
        src: 'TX_CNTRL',
        text: `TX [${commandPriority}]: Dispatched '${newCmd}' to ${satId} via ${gsId} (${gsName}).`
      },
      ...prev
    ]);

    setCommandText('');
    setShowSuggestions(false);
    setSending(true);

    try {
      const res = await cubesatSimService.sendCommand(satId, newCmd, {
        priority: commandPriority,
        groundStation: gsId,
        groundStationName: gsName
      });

      const data = res?.data || res;
      const satState = data?.satellite;
      const exec = data?.execution;
      const responseMsg = data?.message || exec?.response || 'TELECOMMAND EXECUTED';

      let telemetryText = `ACK: CMD_EXEC [${newCmd}] SUCCESSFUL via ${gsId}.\n`;
      telemetryText += `[EXEC] ${responseMsg}\n`;
      if (satState) {
        telemetryText += `[SYS] STATE: ${satState.status || 'NOMINAL'} | BAT: ${satState.battery}% | ALT: ${satState.altitude}km | SPEED: ${satState.speed}km/s\n`;
        telemetryText += `[PWR] SOLAR ARRAYS: ${satState.solarPanelsDeployed ? 'DEPLOYED (+35W)' : 'STOWED (0W)'} | HEATERS: ${satState.heaterActive ? 'ON' : 'OFF'}\n`;
        if (satState.attitude) {
          telemetryText += `[ADCS] MODE: ${satState.attitude.mode || 'NADIR'} | SPIN: ${satState.attitude.spinRate} rad/s\n`;
        }
      }
      telemetryText += `[LINK] LINK MARGIN: +24.8 dB | SIGNAL: ${satState?.signalStrength || -78} dBm | CHECKSUM: 0x9F4D (OK)`;

      appendMessageToActiveTerminal({
        type: 'rx',
        sender: `${satId} / ${satName}`,
        time: new Date().toUTCString().slice(17, 25) + ' UTC',
        text: telemetryText
      });

      setEventLogs(prev => [
        {
          time: new Date().toISOString().slice(11, 23),
          level: 'INFO',
          src: satId,
          text: `RX: CMD_ACK for '${newCmd}' executed via ${gsId}. Result: ${responseMsg.slice(0, 50)}`
        },
        ...prev
      ]);

      if (satState) {
        window.dispatchEvent(new CustomEvent('orbital-telemetry-update', { detail: satState }));
      }
    } catch (err) {
      console.error('Command dispatch error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Uplink transmission error';
      appendMessageToActiveTerminal({
        type: 'rx',
        sender: `${satId} / ${satName}`,
        time: new Date().toUTCString().slice(17, 25) + ' UTC',
        text: `ERR: CMD_EXEC [${newCmd}] REJECTED.\n[FAIL] REASON: ${errMsg}\n[STATUS] LINK DEGRADED OR SUBSYSTEM BUSY.`
      });
      setEventLogs(prev => [
        {
          time: new Date().toISOString().slice(11, 23),
          level: 'ERROR',
          src: 'TX_CNTRL',
          text: `ERR: Failed to execute '${newCmd}' on ${satId}: ${errMsg}`
        },
        ...prev
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleClearBuffer = () => {
    setTerminals(prev => prev.map(t => {
      if (t.id === (activeTerminal?.id || activeTerminalId)) {
        return {
          ...t,
          messages: [
            { type: 'system', text: `--- TERMINAL BUFFER CLEARED AT ${new Date().toUTCString().slice(17, 25)} UTC ---` }
          ]
        };
      }
      return t;
    }));
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
          
          {/* Multi-Terminal Session Tabs & Control Bar */}
          <div className="flex items-center justify-between bg-[#060A14] border-b border-gray-800 px-3 py-2 overflow-x-auto gap-2">
            <div className="flex items-center space-x-1.5 shrink-0">
              {terminals.map((term) => {
                const isActive = term.id === activeTerminalId;
                return (
                  <div
                    key={term.id}
                    onClick={() => setActiveTerminalId(term.id)}
                    className={`group flex items-center space-x-2 px-3 py-1.5 rounded font-mono text-xs cursor-pointer border transition-all ${
                      isActive
                        ? 'bg-[#121C36] text-[#00F0FF] border-[#00F0FF]/60 font-bold shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                        : 'bg-[#0A0F1F]/60 text-gray-400 border-gray-800/80 hover:text-gray-200 hover:bg-[#0A0F1F]'
                    }`}
                  >
                    <Terminal size={12} className={isActive ? 'text-[#00F0FF]' : 'text-gray-500'} />
                    <span>{term.name}</span>
                    {terminals.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTerminal(term.id);
                        }}
                        className="text-gray-500 hover:text-[#FF3B30] p-0.5 rounded ml-1 transition-colors leading-none text-sm"
                        title="Close this terminal"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                );
              })}

              {/* + New Terminal Tab Button */}
              <button
                type="button"
                id="new-terminal-btn"
                onClick={handleCreateNewTerminal}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded font-mono text-xs text-[#00F0FF] hover:bg-[#00F0FF]/15 border border-[#00F0FF]/30 hover:border-[#00F0FF]/60 transition-all shadow-sm ml-1 cursor-pointer"
                title="Open New Command Terminal Session (+)"
              >
                <Plus size={13} className="shrink-0" />
                <span className="font-bold text-[11px] uppercase tracking-wider">NEW TERMINAL</span>
              </button>
            </div>

            {/* Reset Terminal Button */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                id="reset-terminal-btn"
                onClick={handleResetTerminal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 border border-[#FF3B30]/40 hover:border-[#FF3B30] transition-all cursor-pointer font-bold tracking-wider"
                title="Reset Active Command Terminal Buffer"
              >
                <RotateCcw size={12} className="shrink-0" />
                <span>RESET TERMINAL</span>
              </button>
            </div>
          </div>

          {/* Terminal Session Header */}
          <div className="p-3 sm:p-3.5 border-b border-gray-800 flex flex-wrap items-center justify-between bg-[#0A0F1F] gap-3 relative z-30">
            <div className="flex flex-wrap items-center gap-3">
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

              {/* Ground Station Selection Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest hidden md:inline-block">
                  GS UPLINK:
                </span>
                <div className="flex items-center space-x-2 bg-[#121C36] px-3 py-1.5 rounded border border-[#00FF66]/40 hover:border-[#00FF66] font-mono text-xs shadow-sm transition-colors">
                  <Radio size={13} className="text-[#00FF66] animate-pulse shrink-0" />
                  <select
                    id="comm-gs-selector-header"
                    value={selectedGS?.stationId || selectedGS?._id || ''}
                    onChange={(e) => {
                      const found = groundStations.find(g => (g.stationId === e.target.value || g._id === e.target.value));
                      if (found) setSelectedGS(found);
                    }}
                    className="bg-transparent text-[#00FF66] font-bold text-xs focus:outline-none cursor-pointer pr-1"
                    title="Select transmitting Ground Station"
                  >
                    {groundStations.map((gs) => (
                      <option key={gs.stationId || gs._id} value={gs.stationId || gs._id} className="bg-[#0A0F1F] text-white">
                        {gs.stationId}: {gs.name} ({gs.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

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

          {/* Bottom Command Dispatch Input Bar with Categorized Presets & Suggestions */}
          <div className="relative border-t border-gray-800 bg-[#0A0F1F]">
            {/* Live Autocomplete Suggestions Overlay */}
            {showSuggestions && matchingSuggestions.length > 0 && (
              <div 
                ref={suggestionsBoxRef}
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#0A0F1F]/98 border border-[#00F0FF]/50 rounded-xl shadow-[0_-10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div className="p-2.5 border-b border-gray-800 bg-[#080D1A] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#00F0FF] font-bold flex items-center space-x-1.5 uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Suggested Telecommands ({matchingSuggestions.length})</span>
                  </span>
                  <span className="text-gray-400 text-[10px] hidden sm:inline">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[#00F0FF] border border-gray-700">TAB</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[#00F0FF] border border-gray-700">ENTER</kbd> to insert · <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 border border-gray-700">ESC</kbd> to close
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-gray-800/60 font-mono text-xs">
                  {matchingSuggestions.map((cmd, idx) => {
                    const isSelected = idx === activeSuggestionIdx;
                    return (
                      <button
                        key={cmd.code}
                        type="button"
                        onClick={() => handleSelectSuggestion(cmd.code)}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[#00F0FF]/20 text-white' : 'hover:bg-gray-800/60 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="font-bold text-[#00F0FF] tracking-wider text-xs shrink-0">
                            {cmd.code}
                          </span>
                          <span className="text-gray-400 text-[11px] truncate hidden md:inline">
                            — {cmd.desc}
                          </span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 border ml-2 bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30">
                          {cmd.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSendCommand} className="p-3 sm:p-4 flex flex-wrap lg:flex-nowrap items-center gap-2">
              {/* Command Priority */}
              <select
                value={commandPriority}
                onChange={(e) => setCommandPriority(e.target.value)}
                className="bg-[#12192b] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-2.5 focus:outline-none focus:border-[#00F0FF]/50 uppercase cursor-pointer shrink-0"
                title="Command Priority"
              >
                <option value="NORMAL">NORMAL ▼</option>
                <option value="HIGH">HIGH</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>

              {/* Ground Station Selection Dropdown */}
              <select
                id="comm-gs-selector-form"
                value={selectedGS?.stationId || selectedGS?._id || ''}
                onChange={(e) => {
                  const found = groundStations.find(g => (g.stationId === e.target.value || g._id === e.target.value));
                  if (found) setSelectedGS(found);
                }}
                className="bg-[#12192b] border border-gray-800 hover:border-[#00FF66]/50 text-[#00FF66] font-mono text-xs rounded px-2.5 py-2.5 focus:outline-none focus:border-[#00FF66] cursor-pointer shrink-0 transition-colors"
                title="Transmitting Ground Station"
              >
                {groundStations.map((gs) => (
                  <option key={gs.stationId || gs._id} value={gs.stationId || gs._id} className="bg-[#0A0F1F] text-white">
                    📡 {gs.stationId} ({gs.name.slice(0, 16)})
                  </option>
                ))}
              </select>

              {/* Categorized Preset Commands Dropdown */}
              <select
                id="preset-commands-dropdown"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setCommandText(e.target.value);
                    setShowSuggestions(false);
                    commandInputRef.current?.focus();
                  }
                }}
                className="bg-[#121C36] hover:bg-[#182547] border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs rounded px-3 py-2.5 focus:outline-none focus:border-[#00F0FF] cursor-pointer shrink-0 transition-all shadow-sm"
                title="Choose from categorized preset commands"
              >
                <option value="" disabled>⚡ PRESET COMMANDS (CATEGORIZED) ▼</option>
                {TELECOMMAND_CATEGORIES.map((cat) => (
                  <optgroup key={cat.category} label={`── ${cat.category} ──`} className="bg-[#0A0F1F] text-gray-300 font-bold">
                    {cat.commands.map((cmd) => (
                      <option key={cmd.code} value={cmd.code} className="bg-[#0A0F1F] text-white font-mono">
                        {cmd.code} — {cmd.desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Command Input Box with Live Suggestions */}
              <div className="relative flex-1 min-w-[200px]">
                <input 
                  ref={commandInputRef}
                  type="text"
                  placeholder={`Type or select command (e.g. SYS:PING, PWR:SOLAR:DEPLOY)...`}
                  value={commandText}
                  onChange={(e) => {
                    setCommandText(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestionIdx(0);
                  }}
                  onFocus={() => {
                    if (commandText.trim()) setShowSuggestions(true);
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="w-full bg-[#12192b] border border-gray-800 rounded px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/60 font-mono tracking-wider shadow-inner"
                />
              </div>

              {/* Dispatch Button */}
              <button
                type="submit"
                disabled={sending || !commandText.trim()}
                className="px-5 py-2.5 bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] rounded font-mono text-xs font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-40 flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Send size={13} className={sending ? 'animate-spin' : ''} />
                <span>{sending ? 'UPLINKING...' : 'DISPATCH'}</span>
              </button>
            </form>
          </div>
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
