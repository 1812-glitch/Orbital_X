import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Box, Activity, SlidersHorizontal, Play, Pause, ArrowLeft, Undo2, Rocket, ChevronDown, Layers } from 'lucide-react';
import { CUBESAT_FLEET } from '../utils/cubesatFleetData';

export default function SimToolbar({
  viewportMode,
  setViewportMode,
  selectedSatId,
  setSelectedSatId,
  metricsOpen,
  setMetricsOpen,
  sidebarOpen,
  setSidebarOpen,
  autoRotate,
  setAutoRotate,
  getStatusBadge,
  sat,
  onOpenFleetModal
}) {
  const navigate = useNavigate();

  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
      {/* Left: Quick Nav, Viewport Switcher & CubeSat Target */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-[#0A0F1F]/92 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-1.5 shadow-2xl">
        <button
          type="button"
          id="sim-undo-back-btn"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}
          className="flex items-center space-x-1.5 text-xs font-mono text-gray-300 hover:text-[#00F0FF] transition-colors pr-2.5 border-r border-gray-800 cursor-pointer group"
          title="Undo: Return to most immediate recently opened page"
        >
          <Undo2 size={13} className="text-[#00F0FF] group-hover:-rotate-45 transition-transform duration-200" />
          <span className="font-bold hidden sm:inline">UNDO</span>
        </button>

        {/* Viewport Mode Switcher: Earth Orbit vs Close-Up */}
        <div className="flex items-center bg-[#050810] border border-gray-800 rounded p-0.5">
          <button
            id="cubesat-viewmode-earth-btn"
            onClick={() => setViewportMode('EARTH_ORBIT')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
              viewportMode === 'EARTH_ORBIT'
                ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe2 size={13} />
            <span className="hidden sm:inline">EARTH ORBIT</span>
          </button>
          <button
            id="cubesat-viewmode-closeup-btn"
            onClick={() => setViewportMode('CLOSEUP')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
              viewportMode === 'CLOSEUP'
                ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box size={13} />
            <span className="hidden sm:inline">SPACECRAFT</span>
          </button>
        </div>

        {/* Mission & Spacecraft Fleet Dispatcher Trigger */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="sim-mission-fleet-selector-btn"
            onClick={onOpenFleetModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-[#00F0FF]/60 bg-gradient-to-r from-[#00F0FF]/20 via-[#00FF66]/10 to-[#00F0FF]/15 hover:from-[#00F0FF]/30 hover:to-[#00FF66]/20 text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] group cursor-pointer"
            title="Open Hierarchical Mission & CubeSat Dispatcher (select from missions, supports 1,000+ assets)"
          >
            <Rocket size={14} className="text-[#00F0FF] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200" />
            <div className="flex items-center space-x-1.5">
              <span className="text-[#00F0FF] text-[10px] uppercase tracking-wider font-extrabold hidden sm:inline">
                {sat.missionId || 'MSN-APOLLO'}:
              </span>
              <span className="text-white tracking-wide font-sans text-xs font-semibold">
                {sat.name || sat.fullName || selectedSatId}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-black/60 text-[10px] font-mono font-bold text-[#00FF66] border border-[#00FF66]/40">
                {sat.formFactor || '3U'}
              </span>
            </div>
            <ChevronDown size={13} className="text-gray-400 group-hover:text-[#00F0FF] transition-colors ml-1" />
          </button>

          {/* Quick Mission / Fleet Browser Tag */}
          <button
            type="button"
            onClick={onOpenFleetModal}
            className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold text-gray-300 hover:text-[#00F0FF] hover:bg-[#12192b] border border-gray-800 hover:border-[#00F0FF]/40 transition-all cursor-pointer"
            title="Browse all registered Missions and assigned CubeSats"
          >
            <Layers size={11} className="text-[#00F0FF]" />
            <span>MISSIONS & FLEET</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="hidden md:block">
          {getStatusBadge(sat.status)}
        </div>

        {/* Heater Indicator */}
        {sat.heaterActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFD700]/25 text-[#FFEA00] border border-[#FFD700] shadow-[0_0_12px_rgba(255,234,0,0.3)] animate-pulse hidden lg:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFEA00] mr-1.5 shadow-[0_0_6px_#ffea00]" />
            HEATER ON
          </span>
        )}
      </div>

      {/* Right: Floating Controls Sidebar Toggle Buttons */}
      <div className="pointer-events-auto flex items-center space-x-2">
        <button
          id="toggle-telemetry-metrics-btn"
          onClick={() => setMetricsOpen(!metricsOpen)}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
            metricsOpen
              ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
              : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
          }`}
          title={metricsOpen ? "Hide Telemetry HUD" : "Open Telemetry & Subsystems HUD"}
        >
          <Activity size={14} className={metricsOpen ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
          <span>{metricsOpen ? 'HIDE METRICS' : 'TELEMETRY HUD'}</span>
        </button>

        <button
          id="toggle-command-sidebar-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
            sidebarOpen
              ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
              : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
          }`}
          title={sidebarOpen ? "Hide Command Deck" : "Open Telecommands & CLI Deck"}
        >
          <SlidersHorizontal size={14} className={sidebarOpen ? 'text-[#00F0FF]' : 'text-gray-400'} />
          <span>{sidebarOpen ? 'HIDE COMMANDS' : 'COMMAND DECK'}</span>
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-[#0A0F1F]/90 hover:bg-[#121C36] border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-mono text-gray-300 hover:text-white transition-all shadow-xl backdrop-blur-md hidden xl:flex"
          title="Toggle 3D Viewport Auto-Rotation"
        >
          {autoRotate ? <Play size={13} className="text-[#00F0FF]" /> : <Pause size={13} />}
          <span>{autoRotate ? 'Spin' : 'Static'}</span>
        </button>
      </div>
    </div>
  );
}
