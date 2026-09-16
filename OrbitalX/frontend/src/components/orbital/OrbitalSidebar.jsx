import React from 'react';
import TrackingTargetsCard from './TrackingTargetsCard';
import GroundNetworkCard from './GroundNetworkCard';
import DisplayControlsCard from './DisplayControlsCard';

export default function OrbitalSidebar({
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
  nightMode,
  setNightMode,
  autoRotate,
  setAutoRotate,
}) {
  return (
    <div className="w-80 shrink-0 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
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
        nightMode={nightMode}
        setNightMode={setNightMode}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
      />
    </div>
  );
}
