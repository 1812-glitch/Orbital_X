import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import satelliteService from '../services/satelliteService';

const SatelliteContext = createContext(null);

export function SatelliteProvider({ children }) {
  const [satellites, setSatellites] = useState([]);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState(() => {
    return localStorage.getItem('orbital_active_satellite_id') || null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Satellite Details Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalSatellite, setModalSatellite] = useState(null);

  // Fetch all fleet satellites
  const refreshSatellites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await satelliteService.getAll();
      const fleet = res.data || [];
      setSatellites(fleet);

      // If no satellite is currently selected or the saved one doesn't exist, select the first
      setSelectedSatelliteId((prevId) => {
        if (fleet.length === 0) return null;
        const exists = fleet.some((s) => s._id === prevId || s.satelliteId === prevId);
        if (exists) return prevId;
        const defaultId = fleet[0]._id || fleet[0].satelliteId;
        localStorage.setItem('orbital_active_satellite_id', defaultId);
        return defaultId;
      });
      setError(null);
    } catch (err) {
      console.error('SatelliteContext: Failed to load satellites', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSatellites();
  }, [refreshSatellites]);

  // Find the selected satellite object
  const selectedSatellite = useMemo(() => {
    return satellites.find(
      (s) => s._id === selectedSatelliteId || s.satelliteId === selectedSatelliteId
    ) || satellites[0] || null;
  }, [satellites, selectedSatelliteId]);

  // Select a satellite by object, _id, or satelliteId
  const selectSatellite = useCallback((satOrId) => {
    if (!satOrId) return;
    const targetId = typeof satOrId === 'string' ? satOrId : (satOrId._id || satOrId.satelliteId);
    setSelectedSatelliteId(targetId);
    localStorage.setItem('orbital_active_satellite_id', targetId);
  }, []);

  // Open the global satellite details modal for any satellite
  const openDetailModal = useCallback((satOrId) => {
    if (!satOrId) {
      if (selectedSatellite) {
        setModalSatellite(selectedSatellite);
        setIsDetailModalOpen(true);
      }
      return;
    }

    let satObj = null;
    if (typeof satOrId === 'object') {
      satObj = satOrId;
    } else {
      satObj = satellites.find((s) => s._id === satOrId || s.satelliteId === satOrId);
    }

    if (satObj) {
      setModalSatellite(satObj);
      setIsDetailModalOpen(true);
    }
  }, [satellites, selectedSatellite]);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setModalSatellite(null);
  }, []);

  const value = useMemo(() => ({
    satellites,
    selectedSatellite,
    selectedSatelliteId,
    selectSatellite,
    isDetailModalOpen,
    modalSatellite,
    openDetailModal,
    closeDetailModal,
    refreshSatellites,
    loading,
    error,
  }), [
    satellites,
    selectedSatellite,
    selectedSatelliteId,
    selectSatellite,
    isDetailModalOpen,
    modalSatellite,
    openDetailModal,
    closeDetailModal,
    refreshSatellites,
    loading,
    error,
  ]);

  return (
    <SatelliteContext.Provider value={value}>
      {children}
    </SatelliteContext.Provider>
  );
}

export function useSatellite() {
  const context = useContext(SatelliteContext);
  if (!context) {
    throw new Error('useSatellite must be used within a SatelliteProvider');
  }
  return context;
}

export default SatelliteContext;
