import React, { useState } from 'react';
import {
  Play,
  Pause,
  Tag,
  CircleDot,
  RotateCcw,
  Target,
  ChevronUp,
  Sun,
  Moon
} from 'lucide-react';

/**
 * Orbital Simulator Bottom Dock Controls
 * - Play / Pause
 * - Speed Multiplier (1x, 2x, 5x, 10x)
 * - Labels toggle
 * - Orbits toggle
 * - Day / Night mode toggle
 * - Reset View button
 * - Target Lock button
 */
export default function OrbitalBottomDock({
  isPaused = false,
  onTogglePause,
  timeScale = 1,
  onChangeTimeScale,
  showLabels = true,
  onToggleLabels,
  showOrbits = true,
  onToggleOrbits,
  lightingMode = 'DAY',
  onToggleLightingMode,
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

      {/* 5.5 Day / Night Mode Toggle (Clean switch between Daylight Blue Marble & Nocturnal Black Marble with city lights) */}
      <button
        id="dock-toggle-day-night-btn"
        onClick={onToggleLightingMode}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          lightingMode === 'NIGHT'
            ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
            : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
        }`}
        title={lightingMode === 'NIGHT' ? 'Current: NIGHT (Click to switch to DAY mode)' : 'Current: DAY (Click to switch to NIGHT mode)'}
      >
        {lightingMode === 'NIGHT' ? (
          <Moon size={12} className="text-indigo-400 fill-indigo-400/40" />
        ) : (
          <Sun size={12} className="text-amber-400 fill-amber-400/40" />
        )}
        <span className="hidden sm:inline font-bold">
          {lightingMode === 'NIGHT' ? 'Night' : 'Day'}
        </span>
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
