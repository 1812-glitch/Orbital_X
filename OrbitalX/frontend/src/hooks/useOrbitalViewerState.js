import { useState, useEffect, useMemo, useCallback } from 'react';
import telemetryService from '../services/telemetryService';
import { groundStationService } from '../services/groundStationService';
import { MAX_SELECTED_SATELLITES } from '../utils/orbitalMath';

/**
 * Custom hook to manage data fetching, polling, selection states,
 * and display controls for the OrbitalViewer page.
 */
export function useOrbitalViewerState() {
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

  // Data fetching routine
  const fetchFleetData = useCallback(async () => {
    try {
      const [telemetryRes, gsRes] = await Promise.all([
        telemetryService.getLatestTelemetry(),
        groundStationService.getAllGroundStations(),
      ]);
      const fleet = telemetryRes.data || [];
      const stations = gsRes.data || [];
      setFleetData(fleet);
      setGroundStations(stations);

      // Initialize default selection with first 2 satellites if selection is empty
      setSelectedSatIds((prev) => {
        if (prev.length === 0 && fleet.length > 0) {
          return fleet.slice(0, 2).map((f) => f.satellite.satelliteId);
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to fetch fleet telemetry for 3D viewer', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling setup (every 10s)
  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 10000);
    return () => clearInterval(interval);
  }, [fetchFleetData]);

  // Handlers for satellite selection
  const handleToggleSatellite = useCallback((satId) => {
    setSelectedSatIds((prev) => {
      if (prev.includes(satId)) {
        return prev.filter((id) => id !== satId);
      }
      if (prev.length >= MAX_SELECTED_SATELLITES) {
        return prev; // Enforce maximum 3
      }
      return [...prev, satId];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedSatIds([]);
  }, []);

  const handleSelectTop3 = useCallback(() => {
    const top3 = fleetData.slice(0, MAX_SELECTED_SATELLITES).map((f) => f.satellite.satelliteId);
    setSelectedSatIds(top3);
  }, [fleetData]);

  // Filter sidebar tracking targets
  const filteredSidebarTargets = useMemo(() => {
    if (!sidebarSearch.trim()) return fleetData;
    const q = sidebarSearch.toLowerCase();
    return fleetData.filter((d) => {
      const satId = d.satellite?.satelliteId?.toLowerCase() || '';
      const name = d.satellite?.name?.toLowerCase() || '';
      return satId.includes(q) || name.includes(q);
    });
  }, [fleetData, sidebarSearch]);

  return {
    // Data & status
    fleetData,
    groundStations,
    loading,

    // Selection & panel
    selectedSatIds,
    isPanelOpen,
    setIsPanelOpen,
    sidebarSearch,
    setSidebarSearch,
    filteredSidebarTargets,

    // Selection handlers
    handleToggleSatellite,
    handleClearSelection,
    handleSelectTop3,

    // Display controls
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
  };
}

export default useOrbitalViewerState;
