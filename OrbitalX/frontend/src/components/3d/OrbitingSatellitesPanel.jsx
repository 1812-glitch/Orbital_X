import React, { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import {
  SAT_SLOT_COLORS,
  MAX_SELECTED_SATELLITES,
  isCubeSatType,
  getConnectedGroundStations,
} from '../../utils/orbitalMath';
import OrbitersHUDTrigger from './orbiting/OrbitersHUDTrigger';
import OrbitingSatellitesHeader from './orbiting/OrbitingSatellitesHeader';
import OrbitingSatellitesFilterBar from './orbiting/OrbitingSatellitesFilterBar';
import OrbitingSatelliteCard from './orbiting/OrbitingSatelliteCard';

// Re-export for backward compatibility
export { SAT_SLOT_COLORS, MAX_SELECTED_SATELLITES };

export default function OrbitingSatellitesPanel({
  fleetData = [],
  groundStations = [],
  selectedSatIds = [],
  onToggleSatellite,
  isOpen,
  onToggleOpen,
  onClearSelection,
  onSelectTop3,
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

  // Filter fleet data
  const filteredFleet = useMemo(() => {
    return fleetData.filter((item) => {
      const sat = item.satellite;
      const isCubeSat = isCubeSatType(sat);

      // Filter by orbit type / category
      if (orbitFilter === 'CUBESAT' && !isCubeSat) return false;
      if (orbitFilter === 'LEO' && sat.orbitType !== 'LEO') return false;
      if (orbitFilter === 'MEO' && sat.orbitType !== 'MEO') return false;
      if (orbitFilter === 'GEO' && sat.orbitType !== 'GEO') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = (sat.satelliteId || '').toLowerCase().includes(query);
        const matchName = (sat.name || '').toLowerCase().includes(query);
        const matchOrbit = (sat.orbitType || '').toLowerCase().includes(query);
        if (!matchId && !matchName && !matchOrbit) return false;
      }

      return true;
    });
  }, [fleetData, orbitFilter, searchQuery]);

  const handleToggle = (satId) => {
    const isSelected = selectedSatIds.includes(satId);
    if (!isSelected && selectedSatIds.length >= MAX_SELECTED_SATELLITES) {
      setLimitWarning(true);
      setTimeout(() => setLimitWarning(false), 4000);
      return;
    }
    onToggleSatellite(satId);
  };

  // Collapsed trigger pill button
  if (!isOpen) {
    return (
      <OrbitersHUDTrigger
        onToggleOpen={onToggleOpen}
        selectedSatIds={selectedSatIds}
      />
    );
  }

  // Expanded HUD Floating Panel
  return (
    <div
      id="orbiting-satellites-panel"
      className="absolute top-4 left-4 z-20 w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-[#0A0F1F]/95 border border-[#00F0FF]/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-300 overflow-hidden font-sans"
    >
      {/* 1. Header with Close Button and Active Selection Counter */}
      <OrbitingSatellitesHeader
        selectedCount={selectedSatIds.length}
        onToggleOpen={onToggleOpen}
        limitWarning={limitWarning}
      />

      {/* 2. Search & Filter Bar */}
      <OrbitingSatellitesFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        orbitFilter={orbitFilter}
        onOrbitFilterChange={setOrbitFilter}
        selectedCount={selectedSatIds.length}
        onSelectTop3={onSelectTop3}
        onClearSelection={onClearSelection}
      />

      {/* 3. Scrollable List of Satellites and CubeSats */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
        {filteredFleet.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-mono text-xs">
            No satellites matching current filter criteria.
          </div>
        ) : (
          filteredFleet.map((item) => {
            const sat = item.satellite;
            const isSelected = selectedSatIds.includes(sat.satelliteId);
            const slotIdx = getSlotIndex(sat.satelliteId);
            const slotColor = getSatColor(sat.satelliteId);
            const connectedStations = getConnectedGroundStations(
              item,
              groundStations
            );
            const isMaxReached =
              selectedSatIds.length >= MAX_SELECTED_SATELLITES && !isSelected;

            return (
              <OrbitingSatelliteCard
                key={sat._id || sat.satelliteId}
                item={item}
                isSelected={isSelected}
                isMaxReached={isMaxReached}
                slotIdx={slotIdx}
                slotColor={slotColor}
                connectedStations={connectedStations}
                onToggle={handleToggle}
              />
            );
          })
        )}
      </div>

      {/* 4. Footer Quick Info Bar */}
      <div className="p-3 border-t border-gray-800/80 bg-[#0d1322]/80 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0">
        <div className="flex items-center space-x-2">
          <Activity size={12} className="text-[#00F0FF]" />
          <span>Select max {MAX_SELECTED_SATELLITES} to project 3D orbits</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {SAT_SLOT_COLORS.map((color, idx) => (
            <span
              key={idx}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
