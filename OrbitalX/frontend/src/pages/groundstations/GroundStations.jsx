import React, { useState, useEffect, useRef } from 'react';
import { groundStationService } from '../../services/groundStationService';
import telemetryService from '../../services/telemetryService';
import Scene from '../../components/3d/Scene';
import OrbitalBottomDock from '../../components/3d/OrbitalBottomDock';
import { useSatellite } from '../../context/SatelliteContext';
import { RadioTower } from 'lucide-react';
import GroundStationsHeader from './components/GroundStationsHeader';
import GroundStationDetailDrawer from './components/GroundStationDetailDrawer';
import GroundStationsDiagnosticsModal from './components/GroundStationsDiagnosticsModal';
import GroundStationsNetworkTable from './components/GroundStationsNetworkTable';

export default function GroundStations() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openDetailModal, satellites: allFleetSatellites = [] } = useSatellite();

  // 3D Earth Globe Controls & Middle Bottom Dock State
  const sceneRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [showRings, setShowRings] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightingMode, setLightingMode] = useState('DAY');
  const [isFloatingWindowOpen, setIsFloatingWindowOpen] = useState(true);

  // Closable Panels
  const [showNetworkTable, setShowNetworkTable] = useState(true);
  const [isTableMinimized, setIsTableMinimized] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState([]);

  const fetchData = async () => {
    try {
      const [gsRes, telRes] = await Promise.all([
        groundStationService.getAllGroundStations(),
        telemetryService.getLatestTelemetry()
      ]);
      const stationList = gsRes.data || [];
      setStations(stationList);
      if (stationList.length > 0 && !selectedStation) {
        setSelectedStation(stationList[0]);
      } else if (selectedStation) {
        const updated = stationList.find(s => s._id === selectedStation._id || s.stationId === selectedStation.stationId);
        if (updated) setSelectedStation(updated);
      }
      setFleetData(telRes.data || []);
    } catch (err) {
      console.error('Failed to fetch ground station data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsLogs([
      `[${new Date().toUTCString().slice(17, 25)} UTC] INITIATING FULL DIAGNOSTIC SWEEP ON ${activeStation.stationId}...`,
      `[${new Date().toUTCString().slice(17, 25)} UTC] SYNTHESIZING CARRIER SWEEP: S-BAND 2025.5 MHz / X-BAND 8450 MHz...`
    ]);

    setTimeout(() => {
      setDiagnosticsLogs(prev => [
        ...prev,
        `[${new Date().toUTCString().slice(17, 25)} UTC] PHASE LOCK DETECTED: 100% | LOOP BANDWIDTH: 200 Hz`,
        `[${new Date().toUTCString().slice(17, 25)} UTC] AZIMUTH/ELEVATION SERVO RESPONSE: DELTA < 0.02 DEG (OPTIMAL)`,
        `[${new Date().toUTCString().slice(17, 25)} UTC] CARRIER-TO-NOISE RATIO (C/N0): 18.4 dB | BIT ERROR RATE < 10^-8`,
        `[${new Date().toUTCString().slice(17, 25)} UTC] DIAGNOSTIC SWEEP COMPLETE: ALL SYSTEMS NOMINAL.`
      ]);
      setDiagnosticsRunning(false);
    }, 1800);
  };

  const handleFocusStation = (st) => {
    if (sceneRef.current && st?.latitude !== undefined && st?.longitude !== undefined) {
      if (sceneRef.current.focusCoordinates) {
        sceneRef.current.focusCoordinates(st.latitude, st.longitude, 1.85, 1000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-[#00F0FF] tracking-widest uppercase animate-pulse">
          INITIALIZING 3D GROUND STATION NETWORK SIMULATOR...
        </p>
      </div>
    );
  }

  const activeStation = selectedStation || stations[0] || {
    stationId: 'GS-001',
    name: 'Ground Station Alpha',
    country: 'India',
    locationName: 'Bangalore, India',
    status: 'ACTIVE',
    signalQuality: 98,
    connectedSatellites: [],
    latitude: 12.97,
    longitude: 77.59,
    lastContact: new Date(),
    nextContact: new Date(Date.now() + 83 * 60000)
  };

  return (
    <div className="w-full h-full font-sans space-y-4 pb-6 animate-in fade-in duration-300 relative">
      <GroundStationsHeader
        activeStation={activeStation}
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        showDiagnostics={showDiagnostics}
        setShowDiagnostics={setShowDiagnostics}
        showNetworkTable={showNetworkTable}
        setShowNetworkTable={setShowNetworkTable}
        stationsCount={stations.length}
        fetchData={fetchData}
        lightingMode={lightingMode}
        onToggleLightingMode={() => setLightingMode(m => m === 'DAY' ? 'NIGHT' : 'DAY')}
      />

      {/* Main 3D Simulator Viewport with Full-Bleed 3D Globe & Floating Station HUD */}
      <div className="w-full bg-[#070B14] border border-gray-800 rounded-lg overflow-hidden flex flex-col relative shadow-2xl min-h-[580px] lg:min-h-[660px]">
        {/* Globe Header HUD */}
        <div className="h-10 px-4 border-b border-gray-800/80 bg-[#0A0F1F]/80 backdrop-blur-md flex items-center justify-between z-10 font-mono text-xs">
          <span className="font-bold text-white tracking-wider uppercase">
            GLOBAL ANTENNA COVERAGE & TELEMETRY BEACONS
          </span>
          <div className="flex items-center space-x-3 text-[10px] text-gray-400 uppercase">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse"></span>
              <span>VERTICAL BEACONS: ACTIVE</span>
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:inline">{stations.length} TRACKING STATIONS</span>
            {!isFloatingWindowOpen && (
              <button
                id="show-station-floating-window-btn"
                onClick={() => setIsFloatingWindowOpen(true)}
                className="px-2.5 py-1 bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 text-[#00F0FF] rounded font-bold transition-all flex items-center space-x-1.5 cursor-pointer text-xs shadow-[0_0_10px_rgba(0,240,255,0.25)]"
                title="Open Ground Station Details Floating Window"
              >
                <RadioTower size={12} className="text-[#00F0FF]" />
                <span>DETAILS: {activeStation.stationId}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3D Earth Globe with Vertical Ground Station Beacons */}
        <div className="flex-1 relative w-full h-[580px] lg:h-[660px]">
          <Scene 
            ref={sceneRef}
            fleetData={fleetData}
            groundStations={stations}
            selectedStationId={activeStation.stationId || activeStation._id}
            onSelectStation={(st) => {
              setSelectedStation(st);
              setIsFloatingWindowOpen(true);
            }}
            showRings={showRings}
            showLabels={showLabels}
            showUplinks={true}
            showStationPins={true}
            timeScale={timeScale}
            isPaused={isPaused}
            autoRotate={autoRotate}
            lightingMode={lightingMode}
          />

          <div className="absolute top-4 left-4 pointer-events-none opacity-20 text-[#00F0FF] font-mono font-black text-2xl tracking-[0.3em]">
            GROUND_STATIONS
          </div>

          {/* Closable Floating Window over 3D Globe when open */}
          {isFloatingWindowOpen && (
            <div className="absolute top-3 right-3 bottom-20 w-84 sm:w-[420px] max-w-[calc(100vw-24px)] z-30 pointer-events-auto animate-in slide-in-from-right duration-250">
              <GroundStationDetailDrawer
                activeStation={activeStation}
                fleetData={fleetData}
                allSatellites={allFleetSatellites}
                onClose={() => setIsFloatingWindowOpen(false)}
                onFocusStation={handleFocusStation}
                openDetailModal={openDetailModal}
                setShowDiagnostics={setShowDiagnostics}
                handleRunDiagnostics={handleRunDiagnostics}
              />
            </div>
          )}

          {/* Quick Station Selector Pills Overlaid on Globe bottom above dock */}
          <div className={`absolute bottom-18 left-4 overflow-x-auto pb-1 z-10 pointer-events-auto custom-scrollbar flex items-center space-x-2 transition-all duration-300 ${isFloatingWindowOpen ? 'right-92 sm:right-[440px]' : 'right-4'}`}>
            {stations.map(st => {
              const isSelected = activeStation.stationId === st.stationId || activeStation._id === st._id;
              const isOffline = st.status === 'OFFLINE';
              const isDegraded = st.status === 'DEGRADED';

              return (
                <button
                  key={st._id || st.stationId}
                  onClick={() => {
                    setSelectedStation(st);
                    setIsFloatingWindowOpen(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border flex items-center space-x-1.5 shadow-md cursor-pointer ${
                    isSelected
                      ? 'bg-[#00F0FF] text-[#0A0F1F] font-bold border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-[1.02]'
                      : 'bg-[#0A0F1F]/90 backdrop-blur-md text-gray-300 border-gray-800 hover:text-white hover:border-[#00F0FF]/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isOffline ? 'bg-[#FF2A2A]' : isDegraded ? 'bg-[#FFB000]' : isSelected ? 'bg-[#0A0F1F]' : 'bg-[#00FF66]'
                  }`}></span>
                  <span>{st.stationId}</span>
                  <span className={isSelected ? 'text-[#0A0F1F] opacity-90' : 'text-gray-400'}>
                    ({st.country ? st.country.split(' ')[0] : st.name.split(' ')[0]})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Middle-Bottom Cyber Dock / Controls (Matches 3D Orbital Simulator) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto scale-90 sm:scale-100 origin-bottom">
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
              onResetView={() => {
                if (sceneRef.current?.resetView) {
                  sceneRef.current.resetView();
                }
              }}
              hasSelectedSat={false}
            />
          </div>
        </div>
      </div>

      <GroundStationsDiagnosticsModal
        showDiagnostics={showDiagnostics}
        setShowDiagnostics={setShowDiagnostics}
        activeStation={activeStation}
        diagnosticsRunning={diagnosticsRunning}
        handleRunDiagnostics={handleRunDiagnostics}
        diagnosticsLogs={diagnosticsLogs}
      />

      <GroundStationsNetworkTable
        showNetworkTable={showNetworkTable}
        setShowNetworkTable={setShowNetworkTable}
        isTableMinimized={isTableMinimized}
        setIsTableMinimized={setIsTableMinimized}
        stations={stations}
        activeStation={activeStation}
        allSatellites={allFleetSatellites}
        setSelectedStation={(st) => {
          setSelectedStation(st);
          setIsFloatingWindowOpen(true);
        }}
        fetchData={fetchData}
        setShowDiagnostics={setShowDiagnostics}
        handleRunDiagnostics={handleRunDiagnostics}
      />
    </div>
  );
}
