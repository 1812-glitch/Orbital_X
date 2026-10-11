import React, { useState, useEffect, useMemo } from 'react';
import alertService from '../../services/alertService';
import satelliteService from '../../services/satelliteService';
import { useSatellite } from '../../context/SatelliteContext';
import AnomalyInjectorDrawer from '../../components/alerts/AnomalyInjectorDrawer';
import AlertsHeader from './components/AlertsHeader';
import AlertsFleetGrid from './components/AlertsFleetGrid';
import AlertsDetailView from './components/AlertsDetailView';

export default function AlertsIncidents() {
  const [alerts, setAlerts] = useState([]);
  const [satellites, setSatellites] = useState([]);
  const [stats, setStats] = useState({ critical: 0, warning: 0, resolved: 0, total24h: 0 });
  const [loading, setLoading] = useState(true);
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const { selectSatellite, openDetailModal } = useSatellite();

  // Navigation & Filtering
  const [satelliteFilter, setSatelliteFilter] = useState(null); // NULL by default: require selecting a CubeSat
  const [incidentCategory, setIncidentCategory] = useState('ALL'); // ALL, CRITICAL, WARNING, RESOLVED
  const [search, setSearch] = useState('');
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetFilterType, setFleetFilterType] = useState('ALL'); // ALL, CRITICAL, WARNING, NOMINAL

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        const res = await satelliteService.getAll();
        setSatellites(res.data || []);
      } catch (err) {
        console.error('Failed to fetch satellites for filter', err);
      }
    };
    fetchSatellites();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        alertService.getAll({ status: 'ALL' }),
        alertService.getStats()
      ]);
      setAlerts(alertsRes.data || []);
      setStats(statsRes.data || { critical: 0, warning: 0, resolved: 0, total24h: 0 });
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await alertService.updateStatus(id, action);
      if (action === 'ACKNOWLEDGE') {
        setAlerts(prev => prev.map(a => a._id === id ? { ...a, acknowledged: true } : a));
      } else if (action === 'RESOLVE') {
        setAlerts(prev => prev.map(a => a._id === id ? { ...a, severity: 'RESOLVED', resolvedAt: new Date().toISOString() } : a));
      }
      fetchData();
    } catch (error) {
      console.error(`Failed to ${action} alert`, error);
    }
  };

  // Combine API satellites with any discovered from alerts or fallbacks
  const fleetList = useMemo(() => {
    const list = [...(satellites || [])];
    alerts.forEach(a => {
      const sat = a.satelliteId;
      if (sat && typeof sat === 'object') {
        if (!list.some(s => s._id === sat._id || s.satelliteId === sat.satelliteId)) {
          list.push(sat);
        }
      }
    });
    if (list.length > 0) return list;
    return [
      { _id: '1', satelliteId: 'SAT-001', name: 'ORION', type: 'CubeSat 3U', orbitType: 'LEO-POLAR' },
      { _id: '2', satelliteId: 'SAT-002', name: 'NOVA', type: 'CubeSat 6U', orbitType: 'MEO-EQ' },
      { _id: '3', satelliteId: 'SAT-003', name: 'AURORA', type: 'CubeSat 12U', orbitType: 'GEO-SYNC' },
      { _id: '4', satelliteId: 'SAT-004', name: 'VANGUARD', type: 'CubeSat 3U', orbitType: 'LEO-SSO' },
      { _id: '5', satelliteId: 'CUBE-01', name: 'ALPHA-SAT', type: 'CubeSat 1U', orbitType: 'LEO-500KM' }
    ];
  }, [satellites, alerts]);

  // Compute alert counts and recent alert preview per satellite
  const satAlertStats = useMemo(() => {
    const statsMap = {};
    fleetList.forEach(sat => {
      const initObj = { total: 0, critical: 0, warning: 0, resolved: 0, activeTotal: 0, latestAlert: null };
      statsMap[sat._id] = { ...initObj };
      if (sat.satelliteId) {
        statsMap[sat.satelliteId] = { ...initObj };
      }
    });

    alerts.forEach(a => {
      const sat = a.satelliteId;
      if (!sat) return;
      const id1 = typeof sat === 'object' ? sat._id : sat;
      const id2 = typeof sat === 'object' ? sat.satelliteId : null;

      [id1, id2].filter(Boolean).forEach(key => {
        if (!statsMap[key]) {
          statsMap[key] = { total: 0, critical: 0, warning: 0, resolved: 0, activeTotal: 0, latestAlert: null };
        }
        statsMap[key].total += 1;
        if (a.severity === 'CRITICAL') {
          statsMap[key].critical += 1;
          statsMap[key].activeTotal += 1;
        } else if (a.severity === 'WARNING') {
          statsMap[key].warning += 1;
          statsMap[key].activeTotal += 1;
        } else if (a.severity === 'RESOLVED') {
          statsMap[key].resolved += 1;
        }
        if (!statsMap[key].latestAlert) {
          statsMap[key].latestAlert = a;
        }
      });
    });

    return statsMap;
  }, [fleetList, alerts]);

  // Active satellite display object
  const activeSat = fleetList.find(s => s._id === satelliteFilter || s.satelliteId === satelliteFilter);
  const activeSatName = activeSat ? (activeSat.name ? `${activeSat.name} (${activeSat.satelliteId})` : activeSat.satelliteId) : satelliteFilter;

  // Filter alerts for the selected CubeSat
  const currentSatAlerts = useMemo(() => {
    if (!satelliteFilter) return [];
    return alerts.filter(a => {
      const satObj = a.satelliteId;
      return satObj && (
        satObj === satelliteFilter ||
        satObj._id === satelliteFilter || 
        satObj.satelliteId === satelliteFilter ||
        satObj.name === satelliteFilter
      );
    });
  }, [alerts, satelliteFilter]);

  // Filtered alerts with search and category pills
  const filteredAlerts = useMemo(() => {
    return currentSatAlerts.filter(a => {
      if (incidentCategory === 'CRITICAL' && a.severity !== 'CRITICAL') return false;
      if (incidentCategory === 'WARNING' && a.severity !== 'WARNING') return false;
      if (incidentCategory === 'RESOLVED' && a.severity !== 'RESOLVED') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (a.message && a.message.toLowerCase().includes(q)) ||
        (a.type && a.type.toLowerCase().includes(q)) ||
        (a.metric && a.metric.toLowerCase().includes(q))
      );
    });
  }, [currentSatAlerts, incidentCategory, search]);

  // Filter the main CubeSat Fleet grid
  const filteredFleetList = useMemo(() => {
    return fleetList.filter(sat => {
      const key = sat._id || sat.satelliteId;
      const stat = satAlertStats[key] || { total: 0, critical: 0, warning: 0, activeTotal: 0 };
      const query = fleetSearch.toLowerCase();

      const matchesQuery = 
        (sat.name && sat.name.toLowerCase().includes(query)) ||
        (sat.satelliteId && sat.satelliteId.toLowerCase().includes(query)) ||
        (sat.orbitType && sat.orbitType.toLowerCase().includes(query)) ||
        (sat.type && sat.type.toLowerCase().includes(query));

      if (fleetFilterType === 'CRITICAL') return matchesQuery && stat.critical > 0;
      if (fleetFilterType === 'WARNING') return matchesQuery && stat.warning > 0 && stat.critical === 0;
      if (fleetFilterType === 'NOMINAL') return matchesQuery && stat.activeTotal === 0;
      return matchesQuery;
    });
  }, [fleetList, satAlertStats, fleetSearch, fleetFilterType]);

  // Realistic 30m historical telemetry anomaly curve for each alert
  const generateTelemetryCurve = (alert) => {
    const isTemp = alert.metric === 'Temperature';
    const targetVal = alert.value || (isTemp ? 94 : 12);
    const normalVal = isTemp ? 24 : 95;
    
    const points = [];
    for (let i = 0; i < 30; i++) {
      const minute = i - 29;
      let val;
      let isAnomaly = false;

      if (i < 20) {
        val = normalVal + (Math.sin(i * 0.5) * 1.5) + (Math.random() * 0.5 - 0.25);
      } else {
        isAnomaly = true;
        const progress = (i - 20) / 9;
        val = normalVal + (targetVal - normalVal) * progress + (Math.random() * 1.0 - 0.5);
      }

      points.push({
        time: `${minute}m`,
        value: parseFloat(val.toFixed(1)),
        isAnomaly,
        threshold: alert.threshold || (isTemp ? 90 : 15)
      });
    }
    return points;
  };

  const handleAcknowledgeAll = async () => {
    try {
      const targets = (satelliteFilter ? currentSatAlerts : alerts).filter(a => !a.acknowledged && a.severity !== 'RESOLVED');
      for (const alert of targets) {
        alertService.updateStatus(alert._id, 'ACKNOWLEDGE').catch(() => {});
      }
      setAlerts(prev => prev.map(a => {
        if (satelliteFilter) {
          const satObj = a.satelliteId;
          const match = satObj && (satObj === satelliteFilter || satObj._id === satelliteFilter || satObj.satelliteId === satelliteFilter);
          if (match) return { ...a, acknowledged: true };
          return a;
        }
        return { ...a, acknowledged: true };
      }));
    } catch (error) {
      console.error('Failed to acknowledge all', error);
    }
  };

  const handleResolveAll = async () => {
    try {
      const targets = (satelliteFilter ? currentSatAlerts : alerts).filter(a => a.severity !== 'RESOLVED');
      for (const alert of targets) {
        alertService.updateStatus(alert._id, 'RESOLVE').catch(() => {});
      }
      setAlerts(prev => prev.map(a => {
        if (satelliteFilter) {
          const satObj = a.satelliteId;
          const match = satObj && (satObj === satelliteFilter || satObj._id === satelliteFilter || satObj.satelliteId === satelliteFilter);
          if (match) return { ...a, severity: 'RESOLVED', resolvedAt: new Date().toISOString() };
          return a;
        }
        return { ...a, severity: 'RESOLVED', resolvedAt: new Date().toISOString() };
      }));
      setStats(prev => ({
        ...prev,
        critical: 0,
        warning: 0,
        resolved: prev.resolved + targets.length
      }));
    } catch (error) {
      console.error('Failed to resolve all', error);
    }
  };

  const activeSatKey = activeSat ? (activeSat._id || activeSat.satelliteId) : null;
  const activeSatStats = activeSatKey ? (satAlertStats[activeSatKey] || { total: 0, critical: 0, warning: 0, resolved: 0 }) : { total: 0, critical: 0, warning: 0, resolved: 0 };
  const unacknowledgedCount = (satelliteFilter ? currentSatAlerts : alerts).filter(a => !a.acknowledged && a.severity !== 'RESOLVED').length;
  const allResolved = (satelliteFilter ? currentSatAlerts : alerts).every(a => a.severity === 'RESOLVED');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <AlertsHeader
        satelliteFilter={satelliteFilter}
        activeSatName={activeSatName}
        stats={stats}
        setIsInjectorOpen={setIsInjectorOpen}
        handleAcknowledgeAll={handleAcknowledgeAll}
        handleResolveAll={handleResolveAll}
        unacknowledgedCount={unacknowledgedCount}
        allResolved={allResolved}
      />

      {!satelliteFilter ? (
        <AlertsFleetGrid
          fleetSearch={fleetSearch}
          setFleetSearch={setFleetSearch}
          fleetFilterType={fleetFilterType}
          setFleetFilterType={setFleetFilterType}
          setIsInjectorOpen={setIsInjectorOpen}
          filteredFleetList={filteredFleetList}
          satAlertStats={satAlertStats}
          setSatelliteFilter={setSatelliteFilter}
          selectSatellite={selectSatellite}
        />
      ) : (
        <AlertsDetailView
          activeSat={activeSat}
          activeSatName={activeSatName}
          currentSatAlerts={currentSatAlerts}
          activeSatStats={activeSatStats}
          setSatelliteFilter={setSatelliteFilter}
          fleetList={fleetList}
          satAlertStats={satAlertStats}
          selectSatellite={selectSatellite}
          openDetailModal={openDetailModal}
          incidentCategory={incidentCategory}
          setIncidentCategory={setIncidentCategory}
          search={search}
          setSearch={setSearch}
          loading={loading}
          filteredAlerts={filteredAlerts}
          generateTelemetryCurve={generateTelemetryCurve}
          handleAction={handleAction}
        />
      )}

      <AnomalyInjectorDrawer
        isOpen={isInjectorOpen}
        onClose={() => setIsInjectorOpen(false)}
        satellites={fleetList}
        activeSat={activeSat}
        onAnomalyInjected={() => {
          fetchData();
        }}
      />
    </div>
  );
}
