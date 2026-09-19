import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  ShieldCheck, 
  Download, 
  SlidersHorizontal,
  Eye,
  Satellite
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
  const terminalBottomRef = useRef(null);

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

  // Default Seed Messages matching Live Comunications.png
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

  // Scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    status: 'ACTIVE'
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 font-sans pb-10">
      
      {/* 1. TOP HEADER WITH TABS & LIVE SYSTEM CLOCK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-mono font-bold text-white tracking-widest uppercase flex items-center space-x-3">
            <span className="text-[#00F0FF]">ORBITAL-X</span>
            <span>MISSION CONTROL</span>
          </h1>
        </div>

        {/* Center Tabs: LIVE FEED | COMMAND | ARCHIVE */}
        <div className="flex items-center bg-[#12192b] border border-gray-800 rounded p-1 font-mono text-xs font-bold">
          {['LIVE FEED', 'COMMAND', 'ARCHIVE'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded transition-all ${
                activeTab === tab 
                  ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Parameters & System State */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
              type="text"
              placeholder="Search parameters..."
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
              className="bg-[#12192b] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
            />
          </div>

          <div className="flex items-center space-x-3 font-mono text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></span>
            <span>SYSTEM ACTIVE</span>
            <span className="text-gray-600">|</span>
            <span className="text-white font-bold">{currentTime} UTC</span>
          </div>
        </div>
      </div>

      {/* 2. THREE-PANE CONSOLE: ACTIVE TARGETS | LIVE TERMINAL | COMM METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
        
        {/* Left Pane (3 cols): ACTIVE TARGETS */}
        <div className="lg:col-span-3 bg-[#0A0F1F] border border-gray-800 rounded-lg p-4 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
            <span className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest">
              ACTIVE TARGETS
            </span>
            <SlidersHorizontal size={13} className="text-gray-500 cursor-pointer hover:text-white" />
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {satellites.length > 0 ? (
              satellites.map(sat => {
                const isSelected = (selectedSat?._id || selectedSat?.satelliteId) === (sat._id || sat.satelliteId);
                const isWarning = sat.status === 'WARNING';
                const isOffline = sat.status === 'OFFLINE';

                return (
                  <div
                    key={sat._id || sat.satelliteId}
                    onClick={() => {
                      setSelectedSat(sat);
                      selectSatellite(sat);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]' 
                        : 'bg-[#12192b]/60 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {sat.satelliteId} {sat.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isOffline ? 'bg-gray-500' : isWarning ? 'bg-[#FFB020] shadow-[0_0_6px_#FFB020]' : 'bg-[#00FF66] shadow-[0_0_6px_#00FF66]'
                        }`}></span>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-gray-500">{sat.orbitType || 'LEO-POLAR'}</span>
                        <span className={isOffline ? 'text-gray-500' : isWarning ? 'text-[#FFB020]' : 'text-[#00FF66]'}>
                          {isOffline ? 'LOS' : isWarning ? 'WARNING' : 'CONNECTED'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSatellite(sat);
                        openDetailModal(sat);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#00F0FF] hover:bg-gray-800 rounded transition-colors ml-2 shrink-0"
                      title={`Inspect ${sat.name} Details`}
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                );
              })
            ) : (
              // Seed fallback targets matching Live Comunications.png
              [
                { id: 'SAT-001', name: 'ORION', orbit: 'LEO-POLAR', status: 'CONNECTED', color: '#00FF66' },
                { id: 'SAT-002', name: 'NOVA', orbit: 'MEO-EQ', status: 'CONNECTED', color: '#00FF66' },
                { id: 'SAT-003', name: 'AURORA', orbit: 'GEO-SYNC', status: 'WARNING: HIGH LATENCY', color: '#FFB020' },
                { id: 'SAT-004', name: 'VANGUARD', orbit: 'LEO-SSO', status: 'LOS', color: '#6b7280' },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    const satObj = { satelliteId: item.id, name: item.name, orbitType: item.orbit, status: item.status };
                    setSelectedSat(satObj);
                    selectSatellite(satObj);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    currentSat.satelliteId === item.id 
                      ? 'bg-[#00F0FF]/10 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]' 
                      : 'bg-[#12192b]/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {item.id} {item.name}
                      </span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-gray-500">{item.orbit}</span>
                      <span style={{ color: item.color }}>{item.status}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const satObj = { satelliteId: item.id, name: item.name, orbitType: item.orbit, status: item.status };
                      openDetailModal(satObj);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#00F0FF] hover:bg-gray-800 rounded transition-colors ml-2 shrink-0"
                    title={`Inspect ${item.name} Details`}
                  >
                    <Eye size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Pane (6 cols): LIVE TERMINAL SESSION */}
        <div className="lg:col-span-6 bg-[#070B14] border border-gray-800 rounded-lg flex flex-col shadow-2xl relative">
          
          {/* Terminal Session Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
            <div>
              <h3 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
                {currentSat.satelliteId} / {currentSat.name}
              </h3>
              <p className="font-mono text-[10px] text-[#00F0FF] tracking-widest uppercase">
                UPLINK ESTABLISHED
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="comm-inspect-specs-btn"
                onClick={() => openDetailModal(currentSat)}
                className="px-2.5 py-1 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Inspect Satellite Details"
              >
                <Eye size={12} />
                <span>SPECS</span>
              </button>

              <span className="px-2.5 py-1 rounded bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] font-mono text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1.5 shadow-[0_0_10px_rgba(0,255,102,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse"></span>
                <span>SECURE LINK</span>
              </span>
            </div>
          </div>

          {/* Terminal Scroll Content */}
          <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-4 max-h-[340px]">
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
                  <div key={idx} className="space-y-1">
                    <span className="text-gray-400 text-[10px] block">
                      {m.sender} [{m.time}]
                    </span>
                    <div className="p-3 rounded bg-[#121C36] border border-[#00F0FF]/30 text-[#00F0FF] whitespace-pre-wrap">
                      {m.text}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="space-y-1">
                  <span className="text-[#00FF66] text-[10px] block">
                    [{m.time}] {m.sender}
                  </span>
                  <div className="p-3 rounded bg-[#0A1628] border border-gray-700 text-gray-200 whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={terminalBottomRef} />
          </div>

          {/* Bottom Command Dispatch Input Bar */}
          <form onSubmit={handleSendCommand} className="p-3 border-t border-gray-800 bg-[#0A0F1F] flex items-center space-x-2">
            
            {/* Priority Selector Dropdown */}
            <select
              value={commandPriority}
              onChange={(e) => setCommandPriority(e.target.value)}
              className="bg-[#12192b] border border-gray-800 text-gray-300 font-mono text-xs rounded px-2.5 py-2 focus:outline-none focus:border-[#00F0FF]/50 uppercase"
            >
              <option value="NORMAL">NORMAL ▼</option>
              <option value="HIGH">HIGH</option>
              <option value="EMERGENCY">EMERGENCY</option>
            </select>

            {/* Input field */}
            <input 
              type="text"
              placeholder="Enter communication command..."
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              className="flex-1 bg-[#12192b] border border-gray-800 rounded px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !commandText.trim()}
              className="px-4 py-2 bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] rounded font-mono text-xs font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          </form>

        </div>

        {/* Right Pane (3 cols): COMMUNICATION METRICS */}
        <div className="lg:col-span-3 bg-[#0A0F1F] border border-gray-800 rounded-lg p-5 flex flex-col justify-between shadow-xl">
          
          <div>
            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-800">
              COMMUNICATION METRICS
            </h3>

            {/* Signal Strength & Latency Big Boxes */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              
              {/* Signal Strength */}
              <div className="bg-[#121C36]/70 border border-gray-800 rounded p-3 font-mono">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                  SIGNAL STR
                </span>
                <div className="text-xl font-bold text-white mb-2">
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
              <div className="bg-[#121C36]/70 border border-gray-800 rounded p-3 font-mono">
                <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                  LATENCY
                </span>
                <div className="text-xl font-bold text-white mb-2">
                  124 <span className="text-xs font-normal text-gray-400">ms</span>
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00FF66] h-full w-[35%]"></div>
                </div>
              </div>

            </div>

            {/* Link Parameters Table */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-500">Status</span>
                <span className="text-[#00FF66] font-bold">CONNECTED</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-500">Last Contact</span>
                <span className="text-white">14:22:05 UTC</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-500">Ground Stn</span>
                <span className="text-[#00F0FF] font-bold">GS-001 INDIA</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-800/60">
                <span className="text-gray-500">Protocol</span>
                <span className="text-gray-300">S-BAND XFER</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500">Encryption</span>
                <span className="text-[#00FF66] font-bold flex items-center space-x-1">
                  <ShieldCheck size={13} />
                  <span>AES-256</span>
                </span>
              </div>
            </div>

          </div>

          {/* Quick Frequency Uplink Indicator */}
          <div className="p-3 rounded bg-[#0A1628] border border-gray-800 text-[10px] font-mono text-gray-400 flex items-center justify-between mt-4">
            <span>UPLINK FREQ: 2025.5 MHz</span>
            <span className="text-[#00F0FF] font-bold">LOCKED</span>
          </div>

        </div>

      </div>

      {/* 3. BOTTOM EVENT LOG: COMMUNICATION EVENT LOG WITH EXPORT */}
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden shadow-xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
            COMMUNICATION EVENT LOG
          </h3>

          <button
            onClick={handleExportLog}
            className="flex items-center space-x-2 text-xs font-mono text-gray-400 hover:text-[#00F0FF] transition-colors"
          >
            <Download size={13} />
            <span className="uppercase tracking-wider">EXPORT LOG</span>
          </button>
        </div>

        {/* Log Lines */}
        <div className="p-5 font-mono text-xs space-y-2.5 max-h-60 overflow-y-auto">
          {eventLogs.map((log, index) => (
            <div key={index} className="flex items-start space-x-4 border-l-2 border-transparent hover:border-[#00F0FF] pl-2 py-0.5 transition-colors">
              <span className="text-gray-500 whitespace-nowrap">{log.time}</span>
              <span className={`font-bold whitespace-nowrap ${
                log.level === 'WARN' ? 'text-[#FFB020]' : log.level === 'ERROR' ? 'text-[#FF2A2A]' : 'text-[#00F0FF]'
              }`}>
                {log.level}
              </span>
              <span className="text-gray-400 whitespace-nowrap">{log.src}</span>
              <span className="text-gray-300">{log.text}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
