import React from 'react';
import Scene from '../components/3d/Scene';
import OrbitingSatellitesPanel from '../components/3d/OrbitingSatellitesPanel';
import OrbitalViewerHeader from '../components/orbital/OrbitalViewerHeader';
import OrbitalViewerLoading from '../components/orbital/OrbitalViewerLoading';
import OrbitalSidebar from '../components/orbital/OrbitalSidebar';
import { useOrbitalViewerState } from '../hooks/useOrbitalViewerState';

export default function OrbitalViewer() {
  const {
    fleetData,
    groundStations,
    loading,

    selectedSatIds,
    isPanelOpen,
    setIsPanelOpen,
    sidebarSearch,
    setSidebarSearch,
    filteredSidebarTargets,

    handleToggleSatellite,
    handleClearSelection,
    handleSelectTop3,

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
  } = useOrbitalViewerState();

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <OrbitalViewerHeader
        selectedCount={selectedSatIds.length}
        totalCount={fleetData.length}
      />

      {/* Main Content: 3D Viewer Container & Controls Sidebar */}
      <div className="flex-1 flex space-x-6 min-h-0">
        {/* 3D Canvas Container with Floating OrbitingSatellitesPanel */}
        <div className="flex-1 rounded-lg overflow-hidden relative border border-gray-800 bg-[#050810]">
          {loading ? (
            <OrbitalViewerLoading />
          ) : (
            <>
              {/* 3D Globe Visualization */}
              <Scene
                fleetData={fleetData}
                groundStations={groundStations}
                selectedSatIds={selectedSatIds}
                onSelectSatellite={handleToggleSatellite}
                showRings={showRings}
                showLabels={showLabels}
                showUplinks={showUplinks}
                nightMode={nightMode}
                autoRotate={autoRotate}
              />

              {/* Closable Floating HUD Panel */}
              <OrbitingSatellitesPanel
                fleetData={fleetData}
                groundStations={groundStations}
                selectedSatIds={selectedSatIds}
                onToggleSatellite={handleToggleSatellite}
                isOpen={isPanelOpen}
                onToggleOpen={() => setIsPanelOpen(!isPanelOpen)}
                onClearSelection={handleClearSelection}
                onSelectTop3={handleSelectTop3}
              />
            </>
          )}
        </div>

        {/* Right Controls Sidebar */}
        <OrbitalSidebar
          targets={filteredSidebarTargets}
          selectedSatIds={selectedSatIds}
          onToggleSatellite={handleToggleSatellite}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
          groundStations={groundStations}
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
    </div>
  );
}
