import React from 'react';
import { X } from 'lucide-react';
import TrackingTargetsCard from './TrackingTargetsCard';
import GroundNetworkCard from './GroundNetworkCard';
import DisplayControlsCard from './DisplayControlsCard';

export default function OrbitalSidebar({
  onClose,
  // Tracking targets props
  targets = [],
  selectedSatIds = [],
  onToggleSatellite,
  searchQuery = '',
  onSearchChange,

  // Ground network props
  groundStations = [],

  // Display controls props
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
    <div className="w-full h-full flex flex-col space-y-4 overflow-y-auto custom-scrollbar p-3.5">
      {onClose && (
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              CONTROLS & TARGETS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded border border-gray-800 hover:border-gray-700 bg-gray-900/60 transition-colors flex items-center space-x-1 px-2"
            title="Collapse Controls Sidebar"
          >
            <X size={13} />
            <span className="text-[10px] font-mono">CLOSE</span>
          </button>
        </div>
      )}
      <TrackingTargetsCard
        targets={targets}
        selectedSatIds={selectedSatIds}
        onToggleSatellite={onToggleSatellite}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      <GroundNetworkCard groundStations={groundStations} />

      <DisplayControlsCard
        showRings={showRings}
        setShowRings={setShowRings}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        showUplinks={showUplinks}
        setShowUplinks={setShowUplinks}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        lightingMode={lightingMode}
        setLightingMode={setLightingMode}
      />
    </div>
  );
}
