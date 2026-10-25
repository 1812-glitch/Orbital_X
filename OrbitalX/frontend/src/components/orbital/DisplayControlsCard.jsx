import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DisplayControlsCard({
  showRings,
  setShowRings,
  showLabels,
  setShowLabels,
  showUplinks,
  setShowUplinks,
  autoRotate,
  setAutoRotate,
  lightingMode = 'DAY',
  setLightingMode,
}) {
  return (
    <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-mono text-xs tracking-widest uppercase border-b border-gray-800 pb-2 mb-3">
        Display Controls
      </h3>

      {/* Day / Night Mode Segmented Switch */}
      {setLightingMode && (
        <div className="mb-4 pb-3 border-b border-gray-800/80">
          <div className="text-[11px] font-mono text-gray-400 mb-2">Lighting Mode:</div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#050810] border border-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setLightingMode('DAY')}
              className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                lightingMode === 'DAY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sun size={12} className="text-amber-400" />
              <span>DAY</span>
            </button>
            <button
              type="button"
              onClick={() => setLightingMode('NIGHT')}
              className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                lightingMode === 'NIGHT'
                  ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/60 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Moon size={12} className="text-indigo-400" />
              <span>NIGHT</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 text-xs font-mono text-gray-400">
        <label className="flex items-center space-x-3 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showRings}
            onChange={(e) => setShowRings(e.target.checked)}
            className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700"
          />
          <span>Orbital Path Overlays</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700"
          />
          <span>Data Labels & Telemetry</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={showUplinks}
            onChange={(e) => setShowUplinks(e.target.checked)}
            className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700"
          />
          <span>Ground Comm Signals</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
            className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700"
          />
          <span>Globe Auto-Rotation</span>
        </label>
      </div>
    </div>
  );
}
