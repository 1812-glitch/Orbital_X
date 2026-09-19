import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  Eye, 
  Satellite, 
  PlusCircle, 
  CheckCheck, 
  Trash2, 
  Zap, 
  Radio, 
  Activity,
  ShieldAlert
} from 'lucide-react';
import alertService from '../../services/alertService';
import satelliteService from '../../services/satelliteService';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useSatellite } from '../../context/SatelliteContext';

export default function AlertsIncidents() {
  const [alerts, setAlerts] = useState([]);
  const [satellites, setSatellites] = useState([]);
  const [stats, setStats] = useState({ critical: 0, warning: 0, resolved: 0, total24h: 0 });
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const { selectedSatellite, selectSatellite, openDetailModal } = useSatellite();

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
      fetchData(); // Refresh background stats
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
    const isCritical = alert.severity === 'CRITICAL';
    const isTemp = alert.metric === 'Temperature';
    const targetVal = alert.value || (isTemp ? 94 : 12);
    const normalVal = isTemp ? 24 : 95;
    
    const points = [];
    const totalPoints = 30;
    
    for (let i = 0; i < totalPoints; i++) {
      const minute = i - 29; // -29m to 0m
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

  // Global Actions: Simulate Incident
  const handleSimulateIncident = async () => {
    try {
      setIsTriggering(true);
      const targetSat = activeSat || fleetList[Math.floor(Math.random() * fleetList.length)];
      const targetSatId = targetSat?._id || targetSat?.satelliteId || '1';

      const anomalySamples = [
        {
          type: 'Propulsion Thruster B Overheat',
          severity: 'CRITICAL',
          metric: 'Temperature',
          value: 348,
          threshold: 310,
          message: `Sudden thermal spike detected on ${targetSat?.name || 'CubeSat'} thruster nozzle B. Temperature at 348K exceeds operational threshold (310K). Thermal isolation valve triggered.`
        },
        {
          type: 'Battery Cell Depletion Rate',
          severity: 'WARNING',
          metric: 'Power',
          value: 18,
          threshold: 25,
          message: `Bus battery state of charge dropped to 18% on ${targetSat?.name || 'CubeSat'} during solar eclipse phase. Non-critical payload power shedding activated.`
        },
        {
          type: 'ADCS Magnetorquer Z Flux Spike',
          severity: 'CRITICAL',
          metric: 'Magnetic Flux',
          value: 165,
          threshold: 120,
          message: `Z-axis magnetorquer current draw (165mA) on ${targetSat?.name || 'CubeSat'} exceeded rated limits. Momentum desaturation loop engaged.`
        },
        {
          type: 'UHF Downlink Signal Attenuation',
          severity: 'WARNING',
          metric: 'Signal RSSI',
          value: -112,
          threshold: -98,
          message: `Canberra ground station pass SNR degraded by -14dB on ${targetSat?.name || 'CubeSat'}. Antenna deployment impedance verified.`
        }
      ];

      const sample = anomalySamples[Math.floor(Math.random() * anomalySamples.length)];
      const payload = {
        ...sample,
        satelliteId: targetSatId
      };

      try {
        const res = await alertService.create(payload);
        if (res?.data) {
          setAlerts(prev => [res.data, ...prev]);
        } else {
          const localAlert = {
            _id: `sim_${Date.now()}`,
            ...payload,
            satelliteId: targetSat,
            createdAt: new Date().toISOString(),
            acknowledged: false
          };
          setAlerts(prev => [localAlert, ...prev]);
        }
      } catch {
        const localAlert = {
          _id: `sim_${Date.now()}`,
          ...payload,
          satelliteId: targetSat,
          createdAt: new Date().toISOString(),
          acknowledged: false
        };
        setAlerts(prev => [localAlert, ...prev]);
      }

      setStats(prev => ({
        ...prev,
        critical: sample.severity === 'CRITICAL' ? prev.critical + 1 : prev.critical,
        warning: sample.severity === 'WARNING' ? prev.warning + 1 : prev.warning,
        total24h: prev.total24h + 1
      }));

    } catch (err) {
      console.error('Failed to simulate incident', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Global Actions: Acknowledge All
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

  // Global Actions: Resolve All
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

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      
      {/* 1. Top Header with Title, Actions and KPI Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-sans flex items-center space-x-3">
              <span>Alerts & Incidents</span>
              {satelliteFilter && (
                <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                  CUBESAT ISOLATED
                </span>
              )}
            </h1>
            {stats.critical > 0 && (
              <span className="bg-[#FF2A2A]/20 border border-[#FF2A2A]/40 text-[#FF2A2A] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {stats.critical} CRITICAL
              </span>
            )}
          </div>
          <p className="text-gray-400 font-mono text-xs tracking-wider mt-1">
            {satelliteFilter 
              ? `Realtime telemetry anomalies, incident logs & telemetry curves for ${activeSatName}`
              : `Select a CubeSat below to inspect its dedicated telemetry anomalies & incident logs`
            }
          </p>
        </div>

        {/* Global Actions + Live KPI Badges */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Action Buttons matching NotificationCenter */}
          <button 
            id="simulate-incident-btn"
            onClick={handleSimulateIncident}
            disabled={isTriggering}
            className="flex items-center space-x-2 bg-[#FF2A2A]/15 hover:bg-[#FF2A2A]/25 border border-[#FF2A2A]/60 text-[#FF2A2A] hover:text-white px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(255,42,42,0.15)] disabled:opacity-50 font-bold"
          >
            <PlusCircle size={14} />
            <span>{isTriggering ? 'INJECTING...' : '+ SIMULATE INCIDENT'}</span>
          </button>
          
          <button 
            id="acknowledge-all-btn"
            onClick={handleAcknowledgeAll}
            disabled={unacknowledgedCount === 0}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none font-bold"
          >
            <CheckCheck size={14} />
            <span>Acknowledge All</span>
          </button>

          <button 
            id="resolve-all-btn"
            onClick={handleResolveAll}
            disabled={(satelliteFilter ? currentSatAlerts : alerts).every(a => a.severity === 'RESOLVED')}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#00FF66] text-gray-300 hover:text-[#00FF66] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none font-bold"
          >
            <CheckCircle size={14} />
            <span>Resolve All</span>
          </button>

          {/* Sleek KPI Metric Badges */}
          <div className="hidden xl:flex items-center space-x-2 pl-2 border-l border-gray-800">
            <div className="bg-[#0B1221] border border-[#FF2A2A]/60 px-3 py-1.5 rounded flex items-center space-x-2">
              <span className="text-[#FF2A2A] font-mono text-[9px] font-bold tracking-widest uppercase">CRIT</span>
              <span className="text-white font-mono text-xs font-bold">{stats.critical.toString().padStart(2, '0')}</span>
            </div>
            <div className="bg-[#0B1221] border border-[#FFB000]/60 px-3 py-1.5 rounded flex items-center space-x-2">
              <span className="text-[#FFB000] font-mono text-[9px] font-bold tracking-widest uppercase">WARN</span>
              <span className="text-white font-mono text-xs font-bold">{stats.warning.toString().padStart(2, '0')}</span>
            </div>
            <div className="bg-[#0B1221] border border-[#00FF66]/60 px-3 py-1.5 rounded flex items-center space-x-2">
              <span className="text-[#00FF66] font-mono text-[9px] font-bold tracking-widest uppercase">OK</span>
              <span className="text-white font-mono text-xs font-bold">{stats.resolved.toString().padStart(2, '0')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCENARIO A: NO CUBESAT SELECTED -> SHOW MAIN CUBESAT LIST WITH ALERT BADGES */}
      {/* ========================================================================= */}
      {!satelliteFilter ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Instructions and Fleet Search / Filter Bar */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="w-8 h-8 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
                <Satellite size={16} className="text-[#00F0FF]" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  CUBESAT INCIDENT FLEET
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Select a CubeSat to inspect its live telemetry anomalies and incident logs
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
              
              {/* Fleet search */}
              <div className="relative flex-1 md:w-56">
                <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search CubeSat name / ID..."
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
                />
              </div>

              {/* Status Filter buttons */}
              {[
                { key: 'ALL', label: 'ALL CUBESATS' },
                { key: 'CRITICAL', label: 'CRITICAL' },
                { key: 'WARNING', label: 'WARNINGS' },
                { key: 'NOMINAL', label: 'NOMINAL' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFleetFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded transition-all font-bold ${
                    fleetFilterType === tab.key
                      ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-[#050810] border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

            </div>
          </div>

          {/* Fleet Grid: List of CubeSats with Colored Alert Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFleetList.map(sat => {
              const satKey = sat._id || sat.satelliteId;
              const stat = satAlertStats[satKey] || { total: 0, critical: 0, warning: 0, resolved: 0, activeTotal: 0, latestAlert: null };
              const hasCritical = stat.critical > 0;
              const hasWarning = stat.warning > 0;
              const isNominal = stat.activeTotal === 0;

              // Border and glow based on status
              const cardBorder = hasCritical 
                ? 'border-[#FF2A2A]/70 hover:border-[#FF2A2A] shadow-[0_0_20px_rgba(255,42,42,0.15)]' 
                : hasWarning 
                ? 'border-[#FFB000]/70 hover:border-[#FFB000] shadow-[0_0_15px_rgba(255,176,0,0.12)]' 
                : 'border-gray-800 hover:border-[#00FF66]/60 shadow-md';

              return (
                <div
                  key={satKey}
                  onClick={() => {
                    setSatelliteFilter(sat._id || sat.satelliteId);
                    selectSatellite(sat);
                  }}
                  className={`bg-[#0A0F1F] rounded-lg border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${cardBorder}`}
                >
                  <div>
                    {/* Header: ID, Name & Colored Circle Count Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-[#121C36] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-[#00F0FF] transition-colors">
                          <Satellite size={20} className={hasCritical ? 'text-[#FF2A2A]' : hasWarning ? 'text-[#FFB000]' : 'text-[#00FF66]'} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-mono font-bold text-white text-base tracking-wider group-hover:text-[#00F0FF] transition-colors">
                              {sat.name || sat.satelliteId}
                            </h3>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                              {sat.type || 'CubeSat'}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-gray-500 mt-0.5">
                            {sat.satelliteId} • {sat.orbitType || 'LEO'}
                          </p>
                        </div>
                      </div>

                      {/* PROMINENT COLORED CIRCLE WITH NUMBER INDICATING HOW MANY ALERTS */}
                      <div className="flex flex-col items-end">
                        {hasCritical ? (
                          <div className="flex items-center space-x-1.5 bg-[#FF2A2A]/15 border border-[#FF2A2A]/40 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#FF2A2A] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(255,42,42,0.8)] animate-pulse">
                              {stat.activeTotal}
                            </span>
                            <span className="font-mono text-[10px] text-[#FF2A2A] font-bold uppercase tracking-wider">
                              ALERTS
                            </span>
                          </div>
                        ) : hasWarning ? (
                          <div className="flex items-center space-x-1.5 bg-[#FFB000]/15 border border-[#FFB000]/40 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#FFB000] text-black font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(255,176,0,0.6)]">
                              {stat.activeTotal}
                            </span>
                            <span className="font-mono text-[10px] text-[#FFB000] font-bold uppercase tracking-wider">
                              WARNINGS
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 bg-[#00FF66]/10 border border-[#00FF66]/30 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold text-xs flex items-center justify-center">
                              0
                            </span>
                            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider">
                              NOMINAL
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="grid grid-cols-2 gap-2 my-3.5 font-mono text-[11px]">
                      <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                        <span className="text-gray-500">Critical:</span>
                        <span className={`font-bold ${stat.critical > 0 ? 'text-[#FF2A2A]' : 'text-gray-400'}`}>
                          {stat.critical}
                        </span>
                      </div>
                      <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                        <span className="text-gray-500">Warnings:</span>
                        <span className={`font-bold ${stat.warning > 0 ? 'text-[#FFB000]' : 'text-gray-400'}`}>
                          {stat.warning}
                        </span>
                      </div>
                    </div>

                    {/* Latest Incident Snippet */}
                    <div className="bg-[#070B14] border border-gray-800/80 rounded p-2.5 mb-4 font-mono text-xs">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                        LATEST TELEMETRY STATE:
                      </span>
                      {stat.latestAlert ? (
                        <p className="text-gray-300 truncate text-[11px] flex items-center space-x-1">
                          <span className={stat.latestAlert.severity === 'CRITICAL' ? 'text-[#FF2A2A]' : 'text-[#FFB000]'}>
                            ●
                          </span>
                          <span className="font-bold text-white truncate">
                            {stat.latestAlert.type || stat.latestAlert.message}:
                          </span>
                          <span className="text-gray-400 truncate">
                            {stat.latestAlert.message}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[#00FF66] text-[11px] flex items-center space-x-1">
                          <span>✓</span>
                          <span>All orbital subsystems nominal. No active incidents.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Selection Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSatelliteFilter(sat._id || sat.satelliteId);
                      selectSatellite(sat);
                    }}
                    className={`w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                      hasCritical
                        ? 'bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-white border border-[#FF2A2A]/50 hover:border-[#FF2A2A]'
                        : hasWarning
                        ? 'bg-[#FFB000]/20 hover:bg-[#FFB000] text-[#FFB000] hover:text-black border border-[#FFB000]/50 hover:border-[#FFB000]'
                        : 'bg-[#00F0FF]/15 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] border border-[#00F0FF]/40'
                    }`}
                  >
                    <span>SELECT CUBESAT TO VIEW ALERTS ({stat.activeTotal})</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>

          {filteredFleetList.length === 0 && (
            <div className="py-16 text-center bg-[#0B1221] border border-gray-800 rounded-lg font-mono">
              <p className="text-gray-400 text-sm">No CubeSats match your search query "{fleetSearch}"</p>
              <button
                onClick={() => { setFleetSearch(''); setFleetFilterType('ALL'); }}
                className="mt-3 text-xs text-[#00F0FF] underline font-bold"
              >
                Clear Search & Filters
              </button>
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* SCENARIO B: CUBESAT SELECTED -> SHOW INCIDENTS FOR THIS CUBESAT ONLY     */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Active CubeSat Header Bar with Navigation Back Button */}
          <div className="bg-[#0B1221] border border-[#00F0FF]/40 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <button
                onClick={() => setSatelliteFilter(null)}
                className="px-3.5 py-2 rounded bg-[#12192b] hover:bg-[#1c2642] border border-gray-700 hover:border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <span>← BACK TO ALL CUBESATS</span>
              </button>

              <div className="border-l border-gray-800 pl-4">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {activeSatName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
                    {activeSat?.type || 'CubeSat'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  {currentSatAlerts.length} incident record(s) for this asset ({activeSatStats.critical} critical, {activeSatStats.warning} warning)
                </p>
              </div>
            </div>

            {/* CubeSat Quick Switcher */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider hidden sm:inline">
                SWITCH CUBESAT:
              </span>
              <select
                value={satelliteFilter}
                onChange={(e) => {
                  if (e.target.value === 'ALL') {
                    setSatelliteFilter(null);
                  } else {
                    setSatelliteFilter(e.target.value);
                    const found = fleetList.find(s => s._id === e.target.value || s.satelliteId === e.target.value);
                    if (found) selectSatellite(found);
                  }
                }}
                className="bg-[#050810] border border-gray-700 hover:border-[#00F0FF] rounded px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#00F0FF] cursor-pointer"
              >
                <option value="ALL">← RETURN TO ALL CUBESATS</option>
                {fleetList.map(sat => {
                  const key = sat._id || sat.satelliteId;
                  const stat = satAlertStats[key] || { activeTotal: 0 };
                  return (
                    <option key={key} value={key}>
                      {sat.name || sat.satelliteId} ({stat.activeTotal} active alerts)
                    </option>
                  );
                })}
              </select>

              <button
                onClick={() => {
                  if (activeSat) openDetailModal(activeSat);
                }}
                className="p-2 border border-gray-700 hover:border-[#00F0FF] rounded bg-[#050810] text-[#00F0FF] hover:text-white transition-colors"
                title="Inspect Satellite Specs"
              >
                <Eye size={15} />
              </button>
            </div>

          </div>

          {/* Filter Pills with Badge Counters matching NotificationCenter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-gray-500 mr-2 flex items-center">
                <Filter size={12} className="mr-1" /> CATEGORY:
              </span>

              {[
                { 
                  key: 'ALL', 
                  label: 'ALL INCIDENTS', 
                  count: currentSatAlerts.length,
                  badgeColor: 'bg-[#00F0FF] text-black'
                },
                { 
                  key: 'CRITICAL', 
                  label: 'CRITICAL', 
                  count: currentSatAlerts.filter(a => a.severity === 'CRITICAL').length,
                  badgeColor: 'bg-[#FF2A2A] text-white'
                },
                { 
                  key: 'WARNING', 
                  label: 'WARNINGS', 
                  count: currentSatAlerts.filter(a => a.severity === 'WARNING').length,
                  badgeColor: 'bg-[#FFB000] text-black'
                },
                { 
                  key: 'RESOLVED', 
                  label: 'RESOLVED', 
                  count: currentSatAlerts.filter(a => a.severity === 'RESOLVED').length,
                  badgeColor: 'bg-[#00FF66] text-black'
                }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setIncidentCategory(tab.key)}
                  className={`px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all flex items-center space-x-2 ${
                    incidentCategory === tab.key
                      ? tab.key === 'CRITICAL'
                        ? 'bg-[#FF2A2A]/20 text-[#FF2A2A] border border-[#FF2A2A]/50 shadow-[0_0_10px_rgba(255,42,42,0.2)] font-bold'
                        : tab.key === 'WARNING'
                        ? 'bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/50 shadow-[0_0_10px_rgba(255,176,0,0.2)] font-bold'
                        : tab.key === 'RESOLVED'
                        ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/50 shadow-[0_0_10px_rgba(0,255,102,0.2)] font-bold'
                        : 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                      : 'text-gray-400 hover:text-white bg-[#0B1221] border border-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    incidentCategory === tab.key ? tab.badgeColor : 'bg-gray-800 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={13} />
              <input 
                type="text" 
                placeholder="Search incident metrics or text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
            </div>

          </div>

          {/* Incident Feed Cards for this CubeSat */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-[#00F0FF] font-mono text-center py-12 tracking-widest animate-pulse">
                RETRIEVING CUBESAT TELEMETRY ANOMALIES...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#0B1221] border border-gray-800 rounded-lg mt-4">
                <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-4 bg-[#00FF66]/10 border-[#00FF66]/30">
                  <CheckCircle size={24} className="text-[#00FF66]" />
                </div>
                <h3 className="text-white mb-1 font-bold font-mono text-sm">All systems nominal for {activeSatName}</h3>
                <p className="text-gray-400 font-mono text-xs mb-4">No active incidents matching your filter criteria.</p>
                <button
                  onClick={() => setSatelliteFilter(null)}
                  className="px-4 py-2 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs font-bold uppercase transition-colors"
                >
                  ← Return to CubeSat Fleet
                </button>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                const isWarning = alert.severity === 'WARNING';
                const isResolved = alert.severity === 'RESOLVED';
                const telemetryCurveData = generateTelemetryCurve(alert);

                return (
                  <div 
                    key={alert._id} 
                    className={`bg-[#0B1221] rounded-lg overflow-hidden transition-all duration-300 ${
                      isCritical 
                        ? 'border border-[#FF2A2A] shadow-[0_0_25px_rgba(255,42,42,0.12)]' 
                        : isWarning 
                        ? 'border border-[#FFB000] shadow-[0_0_20px_rgba(255,176,0,0.10)]' 
                        : 'border border-gray-800'
                    }`}
                  >
                    
                    {/* Alert Header: Severity Badge + Satellite ID + Title */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest ${
                          isCritical ? 'border border-[#FF2A2A] text-[#FF2A2A] bg-[#FF2A2A]/10' :
                          isWarning ? 'border border-[#FFB000] text-[#FFB000] bg-[#FFB000]/10' :
                          'border border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10'
                        }`}>
                          {alert.severity}
                        </span>
                        
                        {/* Interactive Satellite Badge */}
                        <button
                          onClick={() => {
                            const target = alert.satelliteId || activeSat;
                            if (target) {
                              selectSatellite(target);
                              openDetailModal(target);
                            }
                          }}
                          className="inline-flex items-center space-x-1.5 text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 px-2 py-0.5 rounded font-mono text-xs font-bold tracking-wider uppercase transition-colors"
                          title="Inspect Satellite Details"
                        >
                          <Eye size={12} />
                          <span>{activeSatName}</span>
                        </button>

                        {alert.acknowledged && !isResolved && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
                        {alert.type}
                      </h2>
                    </div>

                    {/* 4 Metric Boxes Grid (TIME DETECTED, SUBSYSTEM, CURRENT VALUE, THRESHOLD) */}
                    <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-[#050810] p-3.5 rounded border border-gray-800/90">
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">
                          TIME DETECTED
                        </span>
                        <p className="text-white font-mono text-sm font-bold">
                          {alert.createdAt ? format(new Date(alert.createdAt), "HH:mm:ss 'UTC'") : '14:02:14 UTC'}
                        </p>
                      </div>

                      <div className="bg-[#050810] p-3.5 rounded border border-gray-800/90">
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">
                          SUBSYSTEM
                        </span>
                        <p className="text-white font-mono text-sm font-bold">
                          {alert.metric === 'Temperature' ? 'Thermal / Propulsion' : alert.metric || 'Telemetry Subsystem'}
                        </p>
                      </div>

                      <div className="bg-[#050810] p-3.5 rounded border border-gray-800/90">
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">
                          CURRENT VALUE
                        </span>
                        <p className={`font-mono text-sm font-bold ${isCritical ? 'text-[#FF2A2A]' : isWarning ? 'text-[#FFB000]' : 'text-[#00FF66]'}`}>
                          {alert.value ? `${alert.value}${alert.metric === 'Temperature' ? 'K' : '%'}` : '314K'}
                        </p>
                      </div>

                      <div className="bg-[#050810] p-3.5 rounded border border-gray-800/90">
                        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">
                          THRESHOLD
                        </span>
                        <p className="text-gray-400 font-mono text-sm font-bold">
                          {alert.threshold ? `${alert.threshold}${alert.metric === 'Temperature' ? 'K' : '%'}` : '310K'}
                        </p>
                      </div>
                    </div>

                    {/* Incident Log Narrative */}
                    <div className="px-6 pt-4 pb-2">
                      <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1.5 font-bold">
                        INCIDENT LOG
                      </span>
                      <p className="text-xs text-gray-300 font-mono leading-relaxed bg-[#050810]/40 p-3 rounded border border-gray-800/50">
                        {alert.message}
                      </p>
                    </div>

                    {/* TELEMETRY (LAST 30M) CHART */}
                    <div className="px-6 py-4">
                      <div className="bg-[#050810] border border-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase font-bold">
                            TELEMETRY (LAST 30M)
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></span>
                            <span className="text-[10px] font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
                              LIVE
                            </span>
                          </div>
                        </div>

                        {/* SVG/Recharts Anomaly Trend Line */}
                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={telemetryCurveData}>
                              <defs>
                                <linearGradient id={`gradient-${alert._id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={isCritical ? '#FF2A2A' : isWarning ? '#FFB000' : '#00FF66'} stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor={isCritical ? '#FF2A2A' : isWarning ? '#FFB000' : '#00FF66'} stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="time" 
                                stroke="#475569" 
                                fontSize={9} 
                                tickLine={false}
                                axisLine={false}
                                interval={5}
                              />
                              <YAxis 
                                hide 
                                domain={['dataMin - 5', 'dataMax + 5']} 
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0A0F1F', 
                                  borderColor: '#334155',
                                  fontFamily: 'monospace',
                                  fontSize: '11px'
                                }} 
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={isCritical ? '#FF2A2A' : isWarning ? '#FFB000' : '#00FF66'} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill={`url(#gradient-${alert._id})`} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Full-width ACKNOWLEDGE & RESOLVE */}
                    {!isResolved && (
                      <div className="px-6 pb-6 pt-2 flex space-x-4">
                        {!alert.acknowledged ? (
                          <button 
                            onClick={() => handleAction(alert._id, 'ACKNOWLEDGE')}
                            className="flex-1 bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold py-3 rounded text-xs font-mono tracking-widest uppercase transition-colors shadow-lg shadow-[#00F0FF]/10"
                          >
                            ACKNOWLEDGE
                          </button>
                        ) : (
                          <div className="flex-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-xs py-3 rounded text-center tracking-widest uppercase font-bold flex items-center justify-center space-x-1.5">
                            <Check size={14} />
                            <span>ACKNOWLEDGED</span>
                          </div>
                        )}
                        <button 
                          onClick={() => handleAction(alert._id, 'RESOLVE')}
                          className="flex-1 bg-[#12192b] hover:bg-[#1f2d4d] text-gray-200 hover:text-white border border-gray-700 py-3 rounded text-xs font-mono tracking-widest uppercase font-bold transition-colors"
                        >
                          RESOLVE
                        </button>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
