import React from 'react';
import { RotateCw, Sun, Moon } from 'lucide-react';

function GlobeControlsHud({
  warpSpeed,
  setWarpSpeed,
  lightingMode = 'DAY',
  onToggleLightingMode
}) {
  return (
    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10 pointer-events-auto">

      {/* Orbit Speed Warp Toggle */}
      <div className="flex items-center bg-[#0A0F1F]/90 border border-gray-800 rounded-lg p-0.5 backdrop-blur-md text-xs font-mono">
        <span className="text-gray-500 px-2 flex items-center">
          <RotateCw size={11} className="mr-1" /> WARP:
        </span>
        {[1, 5, 15, 30, 60].map((w) => (
          <button
            key={w}
            onClick={() => setWarpSpeed(w)}
            className={`px-2 py-1 rounded transition-colors ${
              warpSpeed === w
                ? 'bg-[#00F0FF]/25 text-[#00F0FF] font-bold border border-[#00F0FF]/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {w}x
          </button>
        ))}
      </div>

      {/* Day / Night Mode Toggle */}
      {onToggleLightingMode && (
        <button
          onClick={onToggleLightingMode}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-xs backdrop-blur-md border transition-all ${
            lightingMode === 'NIGHT'
              ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-300 font-bold shadow-[0_0_10px_rgba(99,102,241,0.25)]'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/25'
          }`}
          title={lightingMode === 'NIGHT' ? 'Current: NIGHT (Click to switch to DAY mode)' : 'Current: DAY (Click to switch to NIGHT mode)'}
        >
          {lightingMode === 'NIGHT' ? <Moon size={12} className="text-indigo-400" /> : <Sun size={12} className="text-amber-400" />}
          <span>{lightingMode === 'NIGHT' ? 'NIGHT' : 'DAY'}</span>
        </button>
      )}
    </div>
  );
}

export default React.memo(GlobeControlsHud);
