import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Satellite as SatIcon, 
  Radio, 
  Wifi, 
  CheckSquare, 
  Square, 
  Layers, 
  ChevronRight, 
  RadioTower, 
  Activity, 
  Lock,
  RotateCcw,
  Zap
} from 'lucide-react';

export const SAT_SLOT_COLORS = ['#00F0FF', '#00FF66', '#A855F7'];

export default function OrbitingSatellitesPanel({
  fleetData = [],
  groundStations = [],
  selectedSatIds = [],
  onToggleSatellite,
  isOpen,
  onToggleOpen,
  onClearSelection,
  onSelectTop3
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [orbitFilter, setOrbitFilter] = useState('ALL');
  const [limitWarning, setLimitWarning] = useState(false);

  // Helper to get slot color for selected satellite
  const getSlotIndex = (satId) => selectedSatIds.indexOf(satId);
  const getSatColor = (satId) => {
    const idx = getSlotIndex(satId);
    return idx !== -1 ? SAT_SLOT_COLORS[idx] : null;
  };

  // Angular distance helper in degrees
  const getAngularDist = (lat1, lng1, lat2, lng2) => {
    const rlat1 = (lat1 * Math.PI) / 180;
    const rlng1 = (lng1 * Math.PI) / 180;
    const rlat2 = (lat2 * Math.PI) / 180;
    const rlng2 = (lng2 * Math.PI) / 180;
    const cosDist = Math.sin(rlat1) * Math.sin(rlat2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.cos(rlng1 - rlng2);
    return (Math.acos(Math.max(-1, Math.min(1, cosDist))) * 180) / Math.PI;
  };

  // Find ground stations connected to a satellite with Line-of-Sight (LOS) status
  const getConnectedGroundStations = (sat) => {
    if (!groundStations || groundStations.length === 0) return [];
    
    // Check direct assignment in ground station connectedSatellites
    const connectedByDb = groundStations.filter(gs => {
      if (!gs.connectedSatellites) return false;
      return gs.connectedSatellites.some(s => {
        const id = typeof s === 'object' ? (s.satelliteId || s._id) : s;
        return id === sat.satellite.satelliteId || id === sat.satellite._id;
      });
    });

    const lat = sat.telemetry?.latitude ?? 0;
    const lng = sat.telemetry?.longitude ?? 0;

    return connectedByDb.map(gs => {
      const distDeg = getAngularDist(lat, lng, gs.latitude, gs.longitude);
      const isInSight = distDeg <= 55; // Horizon line-of-sight footprint
      return {
        ...gs,
        isInSight,
        distKm: Math.round(distDeg * 111)
      };
    });
  };

  // Filter fleet data
  const filteredFleet = useMemo(() => {
    return fleetData.filter(item => {
      const sat = item.satellite;
      const isCubeSat = (sat.type && sat.type.includes('CUBESAT')) || 
                        sat.name.toLowerCase().includes('cube') || 
                        sat.satelliteId.toLowerCase().includes('cube');

      // Filter by orbit type / category
      if (orbitFilter === 'CUBESAT' && !isCubeSat) return false;
      if (orbitFilter === 'LEO' && sat.orbitType !== 'LEO') return false;
      if (orbitFilter === 'MEO' && sat.orbitType !== 'MEO') return false;
      if (orbitFilter === 'GEO' && sat.orbitType !== 'GEO') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = sat.satelliteId.toLowerCase().includes(query);
        const matchName = sat.name.toLowerCase().includes(query);
        const matchOrbit = (sat.orbitType || '').toLowerCase().includes(query);
        if (!matchId && !matchName && !matchOrbit) return false;
      }

      return true;
    });
  }, [fleetData, orbitFilter, searchQuery]);

  const handleToggle = (satId) => {
    const isSelected = selectedSatIds.includes(satId);
    if (!isSelected && selectedSatIds.length >= 3) {
      setLimitWarning(true);
      setTimeout(() => setLimitWarning(false), 4000);
      return;
    }
    onToggleSatellite(satId);
  };

  // Collapsed trigger pill button
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        id="btn-open-orbital-panel"
        className="absolute top-4 left-4 z-20 flex items-center space-x-3 bg-[#0A0F1F]/90 hover:bg-[#12192b] border border-[#00F0FF]/40 hover:border-[#00F0FF] text-white px-4 py-2.5 rounded-lg shadow-[0_0_25px_rgba(0,240,255,0.2)] backdrop-blur-md transition-all duration-300 group cursor-pointer"
        title="Open Active Orbiters & Signal Matrix Panel"
      >
        <div className="relative flex items-center justify-center">
          <SatIcon size={18} className="text-[#00F0FF] animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
          </span>
        </div>
        <div className="flex flex-col items-start text-left">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-gray-200">Orbiters HUD</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              selectedSatIds.length > 0 
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' 
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {selectedSatIds.length}/3
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300">
            {selectedSatIds.length === 0 ? 'Click to track orbital paths' : 'Tracking active trajectories & comms'}
          </span>
        </div>
        <div className="flex -space-x-1 pl-1">
          {selectedSatIds.map((id, idx) => (
            <span 
              key={id} 
              className="w-2.5 h-2.5 rounded-full border border-gray-900 shadow-sm"
              style={{ backgroundColor: SAT_SLOT_COLORS[idx] }}
            />
          ))}
        </div>
        <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  // Expanded HUD Floating Panel
  return (
    <div 
      id="orbiting-satellites-panel"
      className="absolute top-4 left-4 z-20 w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-[#0A0F1F]/95 border border-[#00F0FF]/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-300 overflow-hidden font-sans"
    >
      {/* 1. Header with Close Button and Active Selection Counter */}
      <div className="p-4 border-b border-gray-800/80 bg-gradient-to-r from-[#00F0FF]/10 via-[#0A0F1F] to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF]">
            <SatIcon size={16} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-mono font-bold text-white tracking-widest uppercase">
                Active Orbiters & Comms
              </h2>
            </div>
            <p className="text-[11px] font-mono text-gray-400">
              3D Trajectories & Ground Signal Link Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tracking Counter Pill */}
          <div className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors flex items-center space-x-1 ${
            selectedSatIds.length === 3
              ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]/40 shadow-[0_0_10px_rgba(255,176,32,0.2)]'
              : selectedSatIds.length > 0
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40'
              : 'bg-gray-800/60 text-gray-400 border-gray-700'
          }`}>
            <span>{selectedSatIds.length}/3</span>
            <span className="text-[9px] uppercase tracking-wider">TRACKING</span>
          </div>

          {/* Close Panel Button */}
          <button
            onClick={onToggleOpen}
            id="btn-close-orbital-panel"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 border border-transparent hover:border-gray-700 transition-colors cursor-pointer"
            title="Close / Minimize Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Limit Warning Banner */}
      {limitWarning && (
        <div className="bg-[#FFB020]/15 border-b border-[#FFB020]/40 px-4 py-2 flex items-center space-x-2 text-xs font-mono text-[#FFB020] animate-in fade-in duration-200">
          <Lock size={14} className="shrink-0" />
          <span>Maximum 3 satellites can be tracked simultaneously. Deselect one to add another.</span>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="p-3 border-b border-gray-800/80 bg-[#12192b]/40 space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={13} />
          <input
            type="text"
            placeholder="Search Satellite or CubeSat ID / Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1322] border border-gray-800 text-white rounded-lg py-1.5 pl-8 pr-3 font-mono text-xs focus:outline-none focus:border-[#00F0FF]/60 placeholder-gray-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Categories & Quick Selection Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {['ALL', 'CUBESAT', 'LEO', 'MEO', 'GEO'].map((f) => (
              <button
                key={f}
                onClick={() => setOrbitFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
                  orbitFilter === f
                    ? 'bg-[#00F0FF] text-[#0A0F1F] font-bold shadow-[0_0_8px_#00F0FF]/40'
                    : 'bg-[#12192b] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onSelectTop3}
              className="px-2 py-0.5 rounded text-[10px] font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 border border-[#00F0FF]/30 transition-colors cursor-pointer"
              title="Quickly track top 3 active orbiters"
            >
              Top 3
            </button>
            {selectedSatIds.length > 0 && (
              <button
                onClick={onClearSelection}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-gray-800 transition-colors cursor-pointer"
                title="Deselect all satellites"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Scrollable List of Satellites and CubeSats */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
        {filteredFleet.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No satellites matching current filter criteria.
          </div>
        ) : (
          filteredFleet.map((item) => {
            const sat = item.satellite;
            const tel = item.telemetry;
            const isSelected = selectedSatIds.includes(sat.satelliteId);
            const slotIdx = getSlotIndex(sat.satelliteId);
            const slotColor = getSatColor(sat.satelliteId);
            const connectedStations = getConnectedGroundStations(item);
            const isMaxReached = selectedSatIds.length >= 3 && !isSelected;
            const isCubeSat = (sat.type && sat.type.includes('CUBESAT')) || 
                              sat.name.toLowerCase().includes('cube') || 
                              sat.satelliteId.toLowerCase().includes('cube');

            return (
              <div
                key={sat._id || sat.satelliteId}
                onClick={() => handleToggle(sat.satelliteId)}
                className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#121c36]/90 border-transparent shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : isMaxReached
                    ? 'bg-[#0e1424]/40 border-gray-800/60 opacity-60 hover:opacity-80'
                    : 'bg-[#12192b]/50 border-gray-800 hover:border-gray-700 hover:bg-[#12192b]'
                }`}
                style={isSelected ? { borderColor: slotColor } : {}}
              >
                {/* Active Slot Color Left Border Indicator */}
                {isSelected && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg shadow-sm"
                    style={{ backgroundColor: slotColor }}
                  />
                )}

                {/* Top Row: Checkbox, Name, ID, Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    {/* Checkbox button */}
                    <div className="mt-0.5">
                      {isSelected ? (
                        <div 
                          className="w-4 h-4 rounded flex items-center justify-center shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: `${slotColor}25`, color: slotColor }}
                        >
                          <CheckSquare size={16} style={{ color: slotColor }} />
                        </div>
                      ) : isMaxReached ? (
                        <Lock size={15} className="text-gray-600 mt-0.5" />
                      ) : (
                        <Square size={16} className="text-gray-500 group-hover:text-gray-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white font-mono tracking-wide">
                          {sat.satelliteId}
                        </span>
                        <span className="text-xs text-gray-300 font-medium">
                          {sat.name}
                        </span>
                      </div>

                      {/* Type & Orbit Badges */}
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isCubeSat
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                        }`}>
                          {isCubeSat ? 'CUBESAT' : sat.type || 'SATELLITE'}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700">
                          {sat.orbitType}
                        </span>
                        {isSelected && (
                          <span 
                            className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shadow-sm"
                            style={{ 
                              backgroundColor: `${slotColor}20`, 
                              color: slotColor,
                              borderColor: `${slotColor}60`
                            }}
                          >
                            SLOT {slotIdx + 1} PATH
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        sat.status === 'OFFLINE' 
                          ? 'bg-red-500' 
                          : sat.status === 'WARNING' 
                          ? 'bg-yellow-400' 
                          : 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]'
                      } ${isSelected ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                      {sat.status}
                    </span>
                  </div>
                </div>

                {/* Telemetry Row: Coordinates & Orbit Specs */}
                {tel && (
                  <div className="mt-2.5 pt-2 border-t border-gray-800/60 grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-400">
                    <div>
                      <span className="text-gray-500">ALT: </span>
                      <span className="text-gray-200">{Math.round(tel.altitude || 550)} km</span>
                    </div>
                    <div>
                      <span className="text-gray-500">VEL: </span>
                      <span className="text-gray-200">{(tel.speed || 7.6).toFixed(1)} km/s</span>
                    </div>
                    <div>
                      <span className="text-gray-500">LAT/LNG: </span>
                      <span className="text-gray-200">
                        {(tel.latitude || 0).toFixed(1)}°, {(tel.longitude || 0).toFixed(1)}°
                      </span>
                    </div>
                  </div>
                )}

                {/* Ground Station Connectivity & Active Signal Transmission Details */}
                <div className="mt-2.5 pt-2 border-t border-gray-800/60 block">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                      <RadioTower size={12} className={isSelected ? 'text-[#00F0FF]' : 'text-gray-500'} />
                      <span>Connected Ground Stations ({connectedStations.length})</span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center space-x-1 text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded border border-[#00FF66]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                        <span>TRANSMITTING SIGNALS</span>
                      </div>
                    )}
                  </div>

                  {/* Ground Station Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {connectedStations.map(gs => (
                      <div 
                        key={gs._id || gs.stationId}
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          gs.isInSight
                            ? 'bg-[#00FF66]/10 text-white border-[#00FF66]/40 shadow-sm'
                            : 'bg-[#12192b] text-gray-400 border-gray-800'
                        }`}
                      >
                        <Radio size={10} style={{ color: gs.isInSight ? '#00FF66' : '#6b7280' }} />
                        <span className="font-semibold text-gray-200">{gs.name}</span>
                        <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                          gs.isInSight ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {gs.isInSight ? 'IN SIGHT' : 'STANDBY'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Signal Transmission Telemetry Info (Shown when selected) */}
                  {isSelected && (
                    <div className="mt-2 p-2 rounded bg-[#0A0F1F]/80 border border-gray-800 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="flex items-center space-x-1 text-gray-400">
                          <Wifi size={10} className={connectedStations.some(g => g.isInSight) ? 'text-[#00FF66]' : 'text-gray-500'} />
                          <span>SENDING DOWNLINK TO:</span>
                        </span>
                        <span className="text-white font-bold">
                          {connectedStations.filter(g => g.isInSight).map(g => g.name).join(', ') || 'ORBITAL TRANSIT (AWAITING PASS)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-400 pt-1 border-t border-gray-800/60">
                        <div>
                          <span className="text-gray-500">RF FREQ: </span>
                          <span className="text-[#00F0FF]">
                            {isCubeSat ? '437.5 MHz (UHF)' : '2.24 GHz (S-Band)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">THROUGHPUT: </span>
                          <span className="text-[#00FF66]">
                            {isCubeSat ? '19.2 kbps' : '148.5 Mbps'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">SIGNAL SNR: </span>
                          <span className="text-gray-200">
                            {tel?.signal || -74} dBm (98%)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">LOCK: </span>
                          <span className="text-[#00FF66]">CARRIER LOCKED</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer Quick Info Bar */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0d1322]/80 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
        <div className="flex items-center space-x-2">
          <Activity size={12} className="text-[#00F0FF]" />
          <span>Select max 3 to project 3D orbits</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAT_SLOT_COLORS[0] }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAT_SLOT_COLORS[1] }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SAT_SLOT_COLORS[2] }} />
        </div>
      </div>
    </div>
  );
}
