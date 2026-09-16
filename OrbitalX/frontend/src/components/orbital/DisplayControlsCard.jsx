import React from 'react';

export default function DisplayControlsCard({
  showRings,
  setShowRings,
  showLabels,
  setShowLabels,
  showUplinks,
  setShowUplinks,
  nightMode,
  setNightMode,
  autoRotate,
  setAutoRotate,
}) {
  return (
    <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
      <h3 className="text-white font-mono text-xs tracking-widest uppercase border-b border-gray-800 pb-2 mb-3">
        Display Controls
      </h3>
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
            checked={nightMode}
            onChange={(e) => setNightMode(e.target.checked)}
            className="form-checkbox text-[#00F0FF] rounded bg-gray-800 border-gray-700"
          />
          <span>Night Vision Mode</span>
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
