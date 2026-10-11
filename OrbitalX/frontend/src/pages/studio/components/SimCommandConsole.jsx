import React from 'react';
import { 
  Send, 
  ChevronRight, 
  Zap, 
  RotateCcw, 
  Flame, 
  Thermometer, 
  ShieldAlert, 
  ShieldCheck, 
  Compass, 
  Camera, 
  DownloadCloud, 
  Terminal 
} from 'lucide-react';

export default function SimCommandConsole({
  sidebarOpen,
  setSidebarOpen,
  sidebarTab,
  setSidebarTab,
  sat,
  panelTransit,
  panelCountdown,
  burstCycle,
  burstCountdown,
  handleSendCommand,
  isExecuting,
  cliInput,
  setCliInput,
  handleCliSubmit,
  terminalEndRef
}) {
  if (!sidebarOpen) return null;

  return (
    <div className="absolute top-16 right-3 bottom-14 sm:bottom-16 w-80 sm:w-96 z-30 bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
      
      {/* Sidebar Header & Tab Filter */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#0A0F1F]">
        <div className="flex items-center space-x-2">
          <Send size={14} className="text-[#00F0FF]" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            TELECOMMAND DECK
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5 text-[10px] font-mono">
            {['ALL', 'CMDS', 'CLI'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  sidebarTab === tab
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            id="close-command-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors ml-1"
            title="Close sidebar (expand view to full width)"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Scrollable Command Deck & Stream Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col">
        
        {/* BOX 1: DISPATCH TELECOMMANDS */}
        {(sidebarTab === 'ALL' || sidebarTab === 'CMDS') && (
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 shadow-lg">
            <h3 className="font-mono text-xs tracking-widest text-[#00F0FF] uppercase mb-2.5 flex items-center justify-between">
              <span className="flex items-center">
                <Send size={13} className="mr-1.5" /> DISPATCH COMMANDS
              </span>
              <span className="text-[10px] text-gray-500">UPLINK READY</span>
            </h3>

            <div className="space-y-3">
              {/* 1. Solar Wing Arrays */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>1. SOLAR WING ARRAYS</span>
                  <span className={
                    panelTransit === 'DEPLOYING' ? 'text-[#00F0FF] font-bold animate-pulse' :
                    panelTransit === 'STOWING' ? 'text-[#FFB000] font-bold animate-pulse' :
                    sat.solarPanelsDeployed ? 'text-[#00FF66] font-bold' : 'text-[#FFB000] font-bold'
                  }>
                    {panelTransit === 'DEPLOYING' ? `DEPLOYING (${panelCountdown}s)` :
                     panelTransit === 'STOWING' ? `STOWING (${panelCountdown}s)` :
                     sat.solarPanelsDeployed ? 'DEPLOYED' : 'STOWED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('DEPLOY_SOLAR_PANELS')}
                    disabled={sat.solarPanelsDeployed || panelTransit !== null}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono tracking-wider transition-all border ${
                      sat.solarPanelsDeployed
                        ? 'bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66] opacity-60 cursor-not-allowed'
                        : panelTransit === 'DEPLOYING'
                        ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border-[#00F0FF]/50 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    }`}
                    title="Unfold origami solar array wings outward symmetrically"
                  >
                    <Zap size={13} className={panelTransit === 'DEPLOYING' ? 'animate-bounce' : ''} />
                    <span>{panelTransit === 'DEPLOYING' ? `DEPLOYING...` : sat.solarPanelsDeployed ? 'DEPLOYED' : 'DEPLOY PANELS'}</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('STOW_SOLAR_PANELS')}
                    disabled={!sat.solarPanelsDeployed || panelTransit !== null}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono tracking-wider transition-all border ${
                      !sat.solarPanelsDeployed
                        ? 'bg-[#FFB000]/10 border-[#FFB000]/30 text-[#FFB000] opacity-60 cursor-not-allowed'
                        : panelTransit === 'STOWING'
                        ? 'bg-[#FFB000]/25 border-[#FFB000] text-[#FFB000] animate-pulse shadow-[0_0_15px_rgba(255,176,0,0.4)]'
                        : 'bg-gray-800/90 hover:bg-gray-700 border-gray-700 text-gray-200'
                    }`}
                    title="Fold solar wings flush with chassis side"
                  >
                    <RotateCcw size={13} className={panelTransit === 'STOWING' ? 'animate-spin' : ''} />
                    <span>{panelTransit === 'STOWING' ? `STOWING...` : !sat.solarPanelsDeployed ? 'STOWED' : 'STOW PANELS'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Cold-Gas Thruster Cloud Burst */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>2. COLD-GAS CLOUD BURST</span>
                  <span className={burstCycle === 'FIRING' ? 'text-[#FF6600] font-bold animate-pulse' : burstCycle === 'COOLDOWN' ? 'text-amber-400' : 'text-gray-500'}>
                    {burstCycle === 'FIRING' ? `BURST (${burstCountdown}s)` : burstCycle === 'COOLDOWN' ? 'RECHARGING...' : 'READY'}
                  </span>
                </div>
                <button
                  onClick={() => handleSendCommand('COLD_GAS_THRUST')}
                  disabled={burstCycle !== 'READY'}
                  className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded text-xs font-mono font-bold tracking-wider transition-all border shadow-lg ${
                    burstCycle === 'FIRING'
                      ? 'bg-[#FF6600]/30 border-[#FF6600] text-[#FFAA00] shadow-[0_0_20px_rgba(255,102,0,0.4)] animate-pulse'
                      : burstCycle === 'COOLDOWN'
                      ? 'bg-amber-900/30 border-amber-600/50 text-amber-300 opacity-80 cursor-wait'
                      : 'bg-[#FF6600]/15 hover:bg-[#FF6600]/30 border-[#FF6600]/50 text-[#FF8800] hover:text-white shadow-[0_0_15px_rgba(255,102,0,0.15)] active:scale-[0.98]'
                  }`}
                >
                  <Flame size={14} className={burstCycle === 'FIRING' ? 'text-[#FF6600] animate-bounce' : 'text-[#FF6600]'} />
                  <span>
                    {burstCycle === 'FIRING'
                      ? `FIRING CLOUD BURST (${burstCountdown}s)...`
                      : burstCycle === 'COOLDOWN'
                      ? 'RECHARGING NOZZLE (1.4s)...'
                      : 'FIRE COLD-GAS THRUST (+0.08 km/s)'}
                  </span>
                </button>
              </div>

              {/* 3. Thermal Management & Heater */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  <span>3. THERMAL & SAFETY</span>
                  <span className={sat.heaterActive ? 'text-[#FFEA00] font-bold' : 'text-gray-500'}>
                    {sat.heaterActive ? 'HEATER: ON (BEACON LIT)' : 'HEATER: OFF'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('CYCLE_HEATERS')}
                    disabled={isExecuting}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono font-bold tracking-wider transition-all border ${
                      sat.heaterActive
                        ? 'bg-[#FFD700]/25 border-[#FFD700] text-[#FFEA00] shadow-[0_0_15px_rgba(255,234,0,0.35)]'
                        : 'bg-gray-800/80 hover:bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Thermometer size={13} className={sat.heaterActive ? 'text-[#FFEA00] animate-pulse' : ''} />
                    <span>{sat.heaterActive ? 'HEATER: ON' : 'TOGGLE HEATER'}</span>
                  </button>

                  <button
                    onClick={() => handleSendCommand(sat.status === 'SAFE_MODE' ? 'RESUME_NORMAL_OPS' : 'ENTER_SAFE_MODE')}
                    disabled={isExecuting}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded text-xs font-mono font-bold tracking-wider transition-all border ${
                      sat.status === 'SAFE_MODE'
                        ? 'bg-[#00FF66]/20 border-[#00FF66]/50 text-[#00FF66]'
                        : 'bg-[#FF2A2A]/15 border-[#FF2A2A]/40 text-[#FF2A2A] hover:bg-[#FF2A2A]/25'
                    }`}
                  >
                    {sat.status === 'SAFE_MODE' ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                    <span>{sat.status === 'SAFE_MODE' ? 'RESUME OPS' : 'SAFE MODE'}</span>
                  </button>
                </div>
              </div>

              {/* 4. ADCS Pointing */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  4. ADCS ATTITUDE POINTING
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleSendCommand('ADCS_DETUMBLE')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Compass size={11} />
                    <span>DETUMBLE</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('POINT_NADIR')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>NADIR</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('POINT_SUN')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-gray-300 py-1.5 px-1 rounded text-[11px] font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <span>SUN</span>
                  </button>
                </div>
              </div>

              {/* 5. Payload & Comms */}
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-1.5">
                  5. SCIENCE PAYLOAD & RF
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('EXECUTE_PAYLOAD_CAPTURE')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] py-1.5 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <Camera size={12} />
                    <span>CAPTURE DATA</span>
                  </button>
                  <button
                    onClick={() => handleSendCommand('START_DATA_DOWNLINK')}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-1.5 bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] py-1.5 px-2 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-50"
                  >
                    <DownloadCloud size={12} />
                    <span>DOWNLINK</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* BOX 2: CUBESAT TELECOMMAND UPLINK STREAM & INTERACTIVE CLI */}
        {(sidebarTab === 'ALL' || sidebarTab === 'CLI') && (
          <div className="bg-[#050810] border border-gray-800 rounded-lg p-3 flex flex-col flex-1 min-h-[220px] shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2 text-xs font-mono">
              <span className="text-gray-400 flex items-center">
                <Terminal size={13} className="mr-1.5 text-[#00F0FF]" /> TELECOMMAND STREAM
              </span>
              <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.2 rounded font-bold">
                ONLINE
              </span>
            </div>

            {/* Scrollable Command Stream */}
            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-2 pr-1 custom-scrollbar min-h-[120px]">
              {(!sat.commandHistory || sat.commandHistory.length === 0) ? (
                <div className="text-gray-600 text-center py-6 text-xs">
                  AWAITING TELECOMMAND DISPATCH...
                </div>
              ) : (
                sat.commandHistory.map((item, idx) => (
                  <div key={idx} className="bg-[#0A0F1F] border border-gray-800/80 rounded p-2 text-gray-300">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                      <span className="text-[#00F0FF] font-bold">SEQ#{item.seq} [{item.command}]</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()} UTC</span>
                    </div>
                    <div className="text-gray-400 text-[10.5px] leading-relaxed">
                      {item.response}
                    </div>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Interactive CLI Input */}
            <form onSubmit={handleCliSubmit} className="mt-2 pt-2 border-t border-gray-800 flex items-center space-x-2">
              <span className="text-[#00F0FF] font-mono text-xs font-bold shrink-0">CMD&gt;</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type THRUST, HEATERS, STOW..."
                className="flex-1 bg-[#0A0F1F] border border-gray-800 rounded px-2.5 py-1 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]"
              />
              <button
                type="submit"
                disabled={isExecuting || !cliInput.trim()}
                className="bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] px-2.5 py-1 rounded text-xs font-mono tracking-wider transition-colors disabled:opacity-40 font-bold"
              >
                UPLINK
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
