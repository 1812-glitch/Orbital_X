import React from 'react';
import { Sun, Moon, RotateCw, Crosshair } from 'lucide-react';

function GlobeControlsHud({
  nightMode,
  setNightMode,
  warpSpeed,
  setWarpSpeed,
  followSat,
  onToggleFollow
}) {
  return (
    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10 pointer-events-auto">
      {/* Day / Night Toggle */}
      <div className="flex items-center bg-[#0A0F1F]/90 border border-gray-800 rounded-lg p-0.5 backdrop-blur-md shadow-lg">
        <button
          id="earth-toggle-day-btn"
          onClick={() => setNightMode(false)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all ${
            !nightMode
              ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Switch to Daytime Blue Marble Earth"
        >
          <Sun size={13} className={!nightMode ? 'text-black' : 'text-[#FFB000]'} />
          <span>DAY</span>
        </button>
        <button
          id="earth-toggle-night-btn"
          onClick={() => setNightMode(true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all ${
            nightMode
              ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
          title="Switch to Night Lights Earth"
        >
          <Moon size={13} className={nightMode ? 'text-black' : 'text-[#00F0FF]'} />
          <span>NIGHT</span>
        </button>
      </div>

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

      {/* Camera Tracking Toggle */}
      <button
        onClick={onToggleFollow}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-xs backdrop-blur-md border transition-all ${
          followSat
            ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] font-bold shadow-[0_0_12px_rgba(0,255,102,0.3)]'
            : 'bg-[#0A0F1F]/90 border-gray-800 text-gray-400 hover:text-white'
        }`}
        title="Toggle camera following CubeSat in orbit"
      >
        <Crosshair size={13} className={followSat ? 'animate-spin' : ''} />
        <span>{followSat ? 'TRACKING CUBESAT' : 'FREE CAMERA'}</span>
      </button>
    </div>
  );
}

export default React.memo(GlobeControlsHud);
