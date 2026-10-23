import React, { useState } from 'react';
import {
  Play,
  Pause,
  Sun,
  Moon,
  Sunset,
  Tag,
  CircleDot,
  RotateCcw,
  Target,
  ChevronUp
} from 'lucide-react';

/**
 * Orbital Simulator Bottom Dock Controls
 * Replicates the cyber dock in the reference screenshot:
 * - Play / Pause
 * - Speed Multiplier (1x, 2x, 5x, 10x)
 * - Terminator / Day / Night lighting mode segmented toggle
 * - Labels toggle
 * - Orbits toggle
 * - Reset View button
 * - Target Lock button
 */
export default function OrbitalBottomDock({
  isPaused = false,
  onTogglePause,
  timeScale = 1,
  onChangeTimeScale,
  lightingMode = 'TERMINATOR', // 'TERMINATOR' | 'DAY' | 'NIGHT'
  onChangeLightingMode,
  showLabels = true,
  onToggleLabels,
  showOrbits = true,
  onToggleOrbits,
  onResetView,
  followTracking = false,
  onToggleTracking,
  hasSelectedSat = false
}) {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speeds = [1, 2, 5, 10];

  return (
    <div
      id="orbital-bottom-dock"
      className="bg-[#0A0F1F]/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center space-x-1 sm:space-x-2 text-white font-mono select-none"
    >
      {/* 1. Play / Pause Button */}
      <button
        id="dock-play-pause-btn"
        onClick={onTogglePause}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          isPaused
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
            : 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF] hover:bg-[#00F0FF]/25'
        }`}
        title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
      >
        {isPaused ? <Play size={13} className="fill-amber-400" /> : <Pause size={13} className="fill-[#00F0FF]" />}
        <span className="hidden sm:inline">{isPaused ? 'Play' : 'Pause'}</span>
      </button>

      {/* 2. Speed Multiplier Dropdown */}
      <div className="relative">
        <button
          id="dock-speed-btn"
          onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#050810] hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer text-gray-200"
          title="Adjust Simulation Speed"
        >
          <span>{timeScale}x</span>
          <ChevronUp size={12} className={`text-gray-400 transition-transform ${speedMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {speedMenuOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-[#0A0F1F] border border-gray-800 rounded-xl p-1 shadow-2xl flex flex-col space-y-1 min-w-[70px] z-50">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChangeTimeScale(s);
                  setSpeedMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs font-bold text-center transition-colors cursor-pointer ${
                  timeScale === s
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-gray-800" />

      {/* 3. Segmented Day / Night / Terminator Mode Toggle */}
      <div className="flex items-center bg-[#050810] p-0.5 rounded-xl border border-gray-800 text-[11px]">
        {/* Terminator Mode */}
        <button
          id="dock-mode-terminator-btn"
          onClick={() => onChangeLightingMode('TERMINATOR')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            lightingMode === 'TERMINATOR'
              ? 'bg-[#00F0FF]/20 border border-[#00F0FF]/50 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Dynamic Sun-angle terminator with smooth twilight band and ocean glint"
        >
          <Sunset size={12} />
          <span>Terminator</span>
        </button>

        {/* Day Mode */}
        <button
          id="dock-mode-day-btn"
          onClick={() => onChangeLightingMode('DAY')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            lightingMode === 'DAY'
              ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Full daylight surface illumination"
        >
          <Sun size={12} />
          <span>Day</span>
        </button>

        {/* Night Mode */}
        <button
          id="dock-mode-night-btn"
          onClick={() => onChangeLightingMode('NIGHT')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            lightingMode === 'NIGHT'
              ? 'bg-indigo-400/20 border border-indigo-400/50 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.3)]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Nocturnal city lights and dark space view"
        >
          <Moon size={12} />
          <span>Night</span>
        </button>
      </div>

      <div className="h-4 w-px bg-gray-800" />

      {/* 4. Labels Toggle */}
      <button
        id="dock-toggle-labels-btn"
        onClick={onToggleLabels}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          showLabels
            ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
            : 'bg-[#050810] border-gray-800 text-gray-400 hover:text-gray-200'
        }`}
        title="Toggle satellite & ground station labels"
      >
        <Tag size={12} />
        <span className="hidden sm:inline">Labels</span>
      </button>

      {/* 5. Orbits Toggle */}
      <button
        id="dock-toggle-orbits-btn"
        onClick={onToggleOrbits}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          showOrbits
            ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
            : 'bg-[#050810] border-gray-800 text-gray-400 hover:text-gray-200'
        }`}
        title="Toggle 3D orbital trajectory paths"
      >
        <CircleDot size={12} />
        <span className="hidden sm:inline">Orbits</span>
      </button>

      <div className="h-4 w-px bg-gray-800" />

      {/* 6. Reset Camera View Button */}
      <button
        id="dock-reset-view-btn"
        onClick={onResetView}
        className="p-1.5 rounded-xl bg-[#050810] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        title="Reset Camera View to Default"
      >
        <RotateCcw size={14} />
      </button>

      {/* 7. Target Tracking Lock Button (Quick Trigger) */}
      {hasSelectedSat && (
        <button
          id="dock-target-track-btn"
          onClick={onToggleTracking}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            followTracking
              ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.35)] animate-pulse'
              : 'bg-[#050810] hover:bg-gray-800 border-gray-800 text-gray-300 hover:text-[#00FF66]'
          }`}
          title={followTracking ? 'Camera locked onto satellite' : 'Lock camera onto active satellite'}
        >
          <Target size={14} className={followTracking ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
