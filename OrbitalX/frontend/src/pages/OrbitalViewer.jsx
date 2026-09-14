import React, { useState, useEffect } from 'react';
import telemetryService from '../services/telemetryService';
import Scene from '../components/3d/Scene';
import OrbitingSatellitesPanel, { SAT_SLOT_COLORS } from '../components/3d/OrbitingSatellitesPanel';
import { groundStationService } from '../services/groundStationService';
import { Layers, Activity, Search, RadioTower, Satellite as SatIcon, Wifi } from 'lucide-react';

export default function OrbitalViewer() {
  const [fleetData, setFleetData] = useState([]);
  const [groundStations, setGroundStations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Target Selection State (Max 3)
  const [selectedSatIds, setSelectedSatIds] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Display Controls State
  const [showRings, setShowRings] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showUplinks, setShowUplinks] = useState(true);
  const [nightMode, setNightMode] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const fetchFleetData = async () => {
    try {
      const [telemetryRes, gsRes] = await Promise.all([
        telemetryService.getLatestTelemetry(),
        groundStationService.getAllGroundStations()
      ]);
      const fleet = telemetryRes.data || [];
      const stations = gsRes.data || [];
      setFleetData(fleet);
      setGroundStations(stations);

      // Initialize default selection with first 2 satellites if empty
      setSelectedSatIds((prev) => {
        if (prev.length === 0 && fleet.length > 0) {
          return fleet.slice(0, 2).map(f => f.satellite.satelliteId);
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch fleet telemetry for 3D viewer', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for satellite selection (Max 3)
  const handleToggleSatellite = (satId) => {
    setSelectedSatIds(prev => {
      if (prev.includes(satId)) {
        return prev.filter(id => id !== satId);
      }
      if (prev.length >= 3) {
        return prev; // Enforce maximum 3
      }
      return [...prev, satId];
    });
  };

  const handleClearSelection = () => {
    setSelectedSatIds([]);
  };

  const handleSelectTop3 = () => {
    const top3 = fleetData.slice(0, 3).map(f => f.satellite.satelliteId);
    setSelectedSatIds(top3);
  };

  // Filter sidebar tracking targets
  const filteredSidebarTargets = fleetData.filter(d => {
    if (!sidebarSearch.trim()) return true;
    const q = sidebarSearch.toLowerCase();
    return d.satellite.satelliteId.toLowerCase().includes(q) || 
           d.satellite.name.toLowerCase().includes(q);
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">Orbital Viewer</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              3D EARTH SIMULATION
            </span>
          </div>
          <p className="text-gray-400 font-mono text-sm">
            Real-time 3D spatial mapping, orbital trajectory projections, and ground station communication links.
          </p>
        </div>
        
        <div className="flex space-x-4">
          {/* Active Selection Indicator Badge */}
          <div className="bg-[#12192b] border border-gray-800 rounded-lg px-4 py-2 flex items-center space-x-2.5">
            <SatIcon size={16} className="text-[#00F0FF]" />
            <span className="font-mono text-xs text-gray-400">Tracking Orbits:</span>
            <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/40">
              {selectedSatIds.length}/3 MAX
            </span>
          </div>

          <div className="bg-[#12192b] border border-gray-800 rounded-lg px-4 py-2 flex items-center space-x-2">
            <Layers size={16} className="text-gray-400" />
            <span className="font-mono text-sm text-white">Constellation: {fleetData.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content: 3D Viewer Container & Controls Sidebar */}
      <div className="flex-1 flex space-x-6 min-h-0">
        
        {/* 3D Canvas Container with Floating OrbitingSatellitesPanel */}
        <div className="flex-1 rounded-lg overflow-hidden relative border border-gray-800 bg-[#050810]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050810] space-y-3">
              <Activity className="animate-pulse text-[#00F0FF]" size={48} />
              <span className="font-mono text-xs text-[#00F0FF] tracking-widest uppercase">
                CALCULATING 3D ORBITAL TRAJECTORIES...
              </span>
            </div>
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
        <div className="w-80 shrink-0 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Tracking Targets List with Slot Badges */}
          <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
              <h3 className="text-white font-mono text-xs tracking-widest uppercase font-bold">
                Tracking Targets
              </h3>
              <span className="text-[10px] font-mono text-[#00F0FF]">
                {selectedSatIds.length}/3 Selected
              </span>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2 text-gray-500" size={13} />
              <input 
                type="text" 
                placeholder="Filter target ID..." 
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full bg-[#12192b] border border-gray-800 text-white rounded py-1.5 pl-8 pr-3 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSidebarTargets.map((data) => {
                const sat = data.satellite;
                const slotIdx = selectedSatIds.indexOf(sat.satelliteId);
                const isSelected = slotIdx !== -1;
                const slotColor = isSelected ? SAT_SLOT_COLORS[slotIdx] : null;

                return (
                  <div 
                    key={sat._id || sat.satelliteId} 
                    onClick={() => handleToggleSatellite(sat.satelliteId)}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer border transition-all ${
                      isSelected 
                        ? 'bg-[#121c36] border-l-4 shadow-sm' 
                        : 'bg-[#12192b]/50 hover:bg-[#12192b] border-gray-800/60 hover:border-gray-700'
                    }`}
                    style={isSelected ? { borderLeftColor: slotColor, borderColor: `${slotColor}40` } : {}}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div 
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          sat.status === 'OFFLINE' ? 'bg-[#FF2A2A]' : 'bg-[#00FF66]'
                        }`}
                        style={isSelected ? { backgroundColor: slotColor } : {}}
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-white font-mono truncate">{sat.satelliteId}</div>
                        <div className="text-[10px] text-gray-400 font-sans truncate">{sat.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      {isSelected ? (
                        <span 
                          className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                          style={{ backgroundColor: `${slotColor}20`, color: slotColor, borderColor: `${slotColor}60` }}
                        >
                          SLOT {slotIdx + 1}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-400">{sat.orbitType}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ground Network Status */}
          <div className="bg-[#0A0F1F] border border-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-mono text-xs tracking-widest uppercase border-b border-gray-800 pb-2 mb-3 flex items-center justify-between">
              <span>Ground Network</span>
              <RadioTower size={14} className="text-[#00F0FF]" />
            </h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {groundStations.map((gs) => (
                <div key={gs._id || gs.stationId} className="flex flex-col p-2 bg-[#12192b]/50 rounded border border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white truncate">{gs.name}</span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                      gs.status === 'ACTIVE' || gs.status === 'OPERATIONAL'
                        ? 'bg-[#00F0FF]/10 text-[#00F0FF]' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {gs.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>{gs.country}</span>
                    <span className="text-gray-500">{gs.stationId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Display Controls */}
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
          
        </div>
      </div>

    </div>
  );
}
