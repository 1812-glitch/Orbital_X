import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Scene from '../components/3d/Scene';
import OrbitingSatellitesPanel from '../components/3d/OrbitingSatellitesPanel';
import SatelliteInspectorHud from '../components/3d/SatelliteInspectorHud';
import OrbitalBottomDock from '../components/3d/OrbitalBottomDock';
import OrbitTypesLegend from '../components/3d/OrbitTypesLegend';
import OrbitalViewerLoading from '../components/orbital/OrbitalViewerLoading';
import OrbitalSidebar from '../components/orbital/OrbitalSidebar';
import { useOrbitalViewerState } from '../hooks/useOrbitalViewerState';
import { SlidersHorizontal, Satellite as SatIcon, Layers, Undo2, Rocket, ChevronDown } from 'lucide-react';
import { SAT_SLOT_COLORS, MAX_SELECTED_SATELLITES } from '../utils/orbitalMath';
import MissionFleetSelectorModal from '../components/common/MissionFleetSelectorModal';

export default function OrbitalViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sceneRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const lastHandledUrlSatRef = useRef(null);

  // Dynamic Simulator State
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [followTracking, setFollowTracking] = useState(false);
  const [inspectorSatId, setInspectorSatId] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

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
    autoRotate,
    setAutoRotate,
  } = useOrbitalViewerState();

  // Day / Night Lighting Mode ('DAY' | 'NIGHT')
  const [lightingMode, setLightingMode] = useState('DAY');

  // Sync with URL query parameter (e.g. /orbit?sat=SAT-ALPHA-1)
  useEffect(() => {
    const sat = searchParams.get('sat') || searchParams.get('satelliteId');
    if (sat && sat !== lastHandledUrlSatRef.current) {
      lastHandledUrlSatRef.current = sat;
      if (!selectedSatIds.includes(sat)) {
        handleToggleSatellite(sat);
      }
      setInspectorSatId(sat);
      setIsInspectorOpen(true);
      navigate('/orbit', { replace: true });
    }
  }, [searchParams, selectedSatIds, handleToggleSatellite, navigate]);

  // When a satellite is selected, set it as active inspected satellite
  useEffect(() => {
    if (selectedSatIds.length > 0) {
      if (!inspectorSatId || !selectedSatIds.includes(inspectorSatId)) {
        setInspectorSatId(selectedSatIds[selectedSatIds.length - 1]);
      }
      setIsInspectorOpen(true);
    } else {
      setFollowTracking(false);
      setInspectorSatId(null);
    }
  }, [selectedSatIds, inspectorSatId]);

  // Selected satellite record for inspector HUD (null in zero selected state)
  const activeInspectedItem = selectedSatIds.length > 0 ? (
    (fleetData || []).find((item) => {
      const id = item?.satellite?.satelliteId || item?.satellite?._id;
      return id === inspectorSatId || id === selectedSatIds[0];
    }) || null
  ) : null;

  const handleSelectSatellite = (satId) => {
    if (selectedSatIds.includes(satId)) {
      // Toggle off to zero-selected state
      handleToggleSatellite(satId);
      setInspectorSatId(null);
    } else {
      handleToggleSatellite(satId);
      setInspectorSatId(satId);
      setIsInspectorOpen(true);
    }
  };

  const handleResetCamera = () => {
    if (sceneRef.current?.resetView) {
      sceneRef.current.resetView();
    }
    setFollowTracking(false);
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050810] select-none animate-in fade-in duration-500">
      
      {/* 1. Full-Bleed 4-Layer Photorealistic 3D Globe Visualization Canvas */}
      <div className="absolute inset-0 w-full h-full">
        {loading ? (
          <OrbitalViewerLoading />
        ) : (
          <Scene
            ref={sceneRef}
            fleetData={fleetData}
            groundStations={groundStations}
            selectedSatIds={selectedSatIds}
            trackedSatId={inspectorSatId || selectedSatIds[0]}
            onSelectSatellite={handleSelectSatellite}
            showRings={showRings}
            showLabels={showLabels}
            showUplinks={showUplinks}
            autoRotate={autoRotate}
            followTracking={followTracking}
            timeScale={timeScale}
            isPaused={isPaused}
            lightingMode={lightingMode}
          />
        )}
      </div>

      {/* 2. Floating Top Header Toolbar (Translucent Cyber HUD) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 gap-3">
        
        {/* Left: Mission & Orbit Mode Indicator */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 bg-[#0A0F1F]/90 backdrop-blur-md border border-gray-800 rounded-xl px-3.5 py-2 shadow-xl">
          <button
            type="button"
            id="orbit-undo-back-btn"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="flex items-center space-x-1.5 text-xs font-mono text-gray-300 hover:text-[#00F0FF] transition-colors pr-2.5 border-r border-gray-800 cursor-pointer group"
            title="Undo: Return to most immediate recently opened page"
          >
            <Undo2 size={13} className="text-[#00F0FF] group-hover:-rotate-45 transition-transform duration-200" />
            <span className="font-bold hidden sm:inline">UNDO</span>
          </button>

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
            <strong className={selectedSatIds.length > 0 ? "text-[#00F0FF]" : "text-gray-400"}>
              {selectedSatIds.length}/{MAX_SELECTED_SATELLITES}
            </strong>
            {selectedSatIds.length > 0 ? (
              <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/60 ml-1"
              >
                {selectedSatIds[0]}
              </span>
            ) : (
              <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-800/80 text-gray-400 border border-gray-700 ml-1"
              >
                ALL SATELLITES (ZERO SELECTED)
              </span>
            )}
          </div>

          {/* Mission & CubeSat Fleet Dispatcher Trigger */}
          <button
            type="button"
            id="orbital-fleet-selector-btn"
            onClick={() => setIsFleetModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg font-mono text-xs font-bold border border-[#00F0FF]/60 bg-gradient-to-r from-[#00F0FF]/20 via-[#00FF66]/10 to-[#00F0FF]/15 hover:from-[#00F0FF]/30 hover:to-[#00FF66]/20 text-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] group cursor-pointer"
            title="Open Hierarchical Mission & CubeSat Dispatcher (select from missions, supports 1,000+ assets)"
          >
            <Rocket size={13} className="text-[#00F0FF] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200" />
            <span>MISSION FLEET</span>
            <ChevronDown size={12} className="text-gray-400 group-hover:text-[#00F0FF] transition-colors" />
          </button>

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
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md cursor-pointer ${
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
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-xl backdrop-blur-md cursor-pointer ${
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

      {/* 3. Left Closable Floating Fleet HUD (OrbitingSatellitesPanel) */}
      {!loading && (
        <OrbitingSatellitesPanel
          fleetData={fleetData}
          groundStations={groundStations}
          selectedSatIds={selectedSatIds}
          onToggleSatellite={handleSelectSatellite}
          isOpen={isPanelOpen}
          onToggleOpen={() => setIsPanelOpen(!isPanelOpen)}
          onClearSelection={handleClearSelection}
          onSelectTop3={handleSelectTop3}
        />
      )}

      {/* 4. Right Satellite Detail Inspector HUD (HORIZON Style from Reference Screenshot) */}
      {selectedSatIds.length > 0 && isInspectorOpen && activeInspectedItem && (
        <div className={`absolute top-16 z-30 transition-all duration-300 ${sidebarOpen ? 'right-84 sm:right-92' : 'right-3'}`}>
          <SatelliteInspectorHud
            satelliteItem={activeInspectedItem}
            selectedSatIds={selectedSatIds}
            activeSatId={inspectorSatId}
            onSelectActiveSatId={(id) => setInspectorSatId(id)}
            onDeselectSatellite={(id) => handleToggleSatellite(id)}
            followTracking={followTracking}
            onToggleTracking={() => setFollowTracking(!followTracking)}
            onClose={() => setIsInspectorOpen(false)}
          />
        </div>
      )}

      {/* 5. Closable Floating Controls Sidebar OVER the Canvas (Right: OrbitalSidebar) */}
      {sidebarOpen && (
        <div className="absolute top-16 right-3 bottom-3 w-80 sm:w-88 z-40 bg-[#0A0F1F]/95 backdrop-blur-lg border border-gray-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in slide-in-from-right duration-250">
          <OrbitalSidebar
            onClose={() => setSidebarOpen(false)}
            targets={filteredSidebarTargets}
            selectedSatIds={selectedSatIds}
            onToggleSatellite={handleSelectSatellite}
            searchQuery={sidebarSearch}
            onSearchChange={setSidebarSearch}
            groundStations={groundStations}
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
      )}

      {/* 6. Bottom-Left Orbit Types Legend (Matches Screenshot, repositions cleanly when Fleet HUD is open) */}
      <div className={`absolute bottom-4 z-20 pointer-events-auto transition-all duration-300 hidden sm:block ${isPanelOpen ? 'left-84 sm:left-100' : 'left-3'}`}>
        <OrbitTypesLegend />
      </div>

      {/* 7. Bottom-Center Cyber Dock / Controls (Matches Screenshot) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <OrbitalBottomDock
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          timeScale={timeScale}
          onChangeTimeScale={setTimeScale}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          showOrbits={showRings}
          onToggleOrbits={() => setShowRings(!showRings)}
          lightingMode={lightingMode}
          onToggleLightingMode={() => setLightingMode(m => m === 'DAY' ? 'NIGHT' : 'DAY')}
          onResetView={handleResetCamera}
          followTracking={followTracking}
          onToggleTracking={() => setFollowTracking(!followTracking)}
          hasSelectedSat={selectedSatIds.length > 0}
        />
      </div>

      {/* Hierarchical Mission & CubeSat Fleet Selector Modal */}
      <MissionFleetSelectorModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        selectedSatIds={selectedSatIds}
        multiSelect={true}
        onSelectSatellite={(satObj) => {
          handleSelectSatellite(satObj.satelliteId);
        }}
        title="Orbital Viewer Fleet Dispatcher"
        subtitle="Filter by Mission or search 1,000+ CubeSats to track on the 3D globe"
        actionLabel="TRACK ON GLOBE"
      />
    </div>
  );
}
