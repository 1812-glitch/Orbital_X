import React, { useState } from 'react';
import Scene from '../components/3d/Scene';
import OrbitingSatellitesPanel from '../components/3d/OrbitingSatellitesPanel';
import OrbitalViewerLoading from '../components/orbital/OrbitalViewerLoading';
import OrbitalSidebar from '../components/orbital/OrbitalSidebar';
import { useOrbitalViewerState } from '../hooks/useOrbitalViewerState';
import { SlidersHorizontal, Satellite as SatIcon, Layers } from 'lucide-react';
import { SAT_SLOT_COLORS, MAX_SELECTED_SATELLITES } from '../utils/orbitalMath';

export default function OrbitalViewer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="w-full h-full relative overflow-hidden bg-[#050810] select-none animate-in fade-in duration-500">
      
      {/* 1. Full-Bleed 3D Globe Visualization Canvas */}
      <div className="absolute inset-0 w-full h-full">
        {loading ? (
          <OrbitalViewerLoading />
        ) : (
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
        )}
      </div>

      {/* 2. Floating Top Header Toolbar (Translucent Cyber HUD) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
        
        {/* Left: Mission & Orbit Mode Indicator */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-xl px-3.5 py-2 shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
            <h1 className="text-xs sm:text-sm font-bold tracking-widest text-white uppercase font-mono">
              ORBITAL VIEWER
            </h1>
          </div>
          <span className="text-gray-700 hidden sm:inline">|</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 hidden sm:inline">
            3D EARTH SIMULATION
          </span>
          <span className="text-gray-700 hidden md:inline">|</span>
          <div className="flex items-center space-x-1.5 text-xs font-mono text-gray-300 hidden md:flex">
            <SatIcon size={13} className="text-[#00F0FF]" />
            <span>Tracking:</span>
            <strong className="text-[#00F0FF]">{selectedSatIds.length}/{MAX_SELECTED_SATELLITES}</strong>
            {selectedSatIds.length > 0 && (
              <div className="flex items-center space-x-1 pl-1.5">
                {selectedSatIds.map((id, idx) => (
                  <span 
                    key={id}
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                    style={{ 
                      backgroundColor: `${SAT_SLOT_COLORS[idx]}25`, 
                      color: SAT_SLOT_COLORS[idx],
                      border: `1px solid ${SAT_SLOT_COLORS[idx]}60`
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-mono text-gray-400 hidden lg:flex">
            <Layers size={13} className="text-gray-500" />
            <span>Fleet: <strong>{fleetData.length}</strong></span>
          </div>
        </div>

        {/* Right: Floating Controls Sidebar Toggle Buttons */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            id="toggle-orbiters-panel-btn"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              isPanelOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={isPanelOpen ? "Hide Fleet Orbiters HUD" : "Open Fleet Orbiters HUD"}
          >
            <SatIcon size={14} className={isPanelOpen ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
            <span>{isPanelOpen ? 'HIDE FLEET HUD' : 'FLEET HUD'}</span>
            {selectedSatIds.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00F0FF] text-black text-[10px] flex items-center justify-center font-bold ml-1">
                {selectedSatIds.length}
              </span>
            )}
          </button>

          <button
            id="toggle-orbital-controls-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md ${
              sidebarOpen
                ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#0A0F1F]/90 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
            }`}
            title={sidebarOpen ? "Hide Controls Sidebar" : "Open Controls & Fleet Filter Sidebar"}
          >
            <SlidersHorizontal size={14} className={sidebarOpen ? 'text-[#00F0FF]' : 'text-gray-400'} />
            <span>{sidebarOpen ? 'HIDE CONTROLS' : 'CONTROLS & TARGETS'}</span>
          </button>
        </div>
      </div>

      {/* 3. Closable Floating HUD Panel (Bottom-Left: OrbitingSatellitesPanel) */}
      {!loading && (
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
      )}

      {/* 4. Closable Floating Sidebar OVER the Canvas (Right: OrbitalSidebar) */}
      {sidebarOpen && (
        <div className="absolute top-16 right-3 bottom-3 w-80 sm:w-88 z-30 bg-[#0A0F1F]/92 backdrop-blur-lg border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in slide-in-from-right duration-250">
          <OrbitalSidebar
            onClose={() => setSidebarOpen(false)}
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
      )}
    </div>
  );
}
