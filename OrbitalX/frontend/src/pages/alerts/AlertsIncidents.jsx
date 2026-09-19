import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Search, Filter, Eye, Satellite } from 'lucide-react';
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
  const { selectedSatellite, selectSatellite, openDetailModal } = useSatellite();

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [satelliteFilter, setSatelliteFilter] = useState(null); // NULL by default: require selecting a CubeSat
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetFilterType, setFleetFilterType] = useState('ALL'); // ALL, CRITICAL, WARNING, NOMINAL

  useEffect(() => {
    fetchData();
  }, [severityFilter, statusFilter]);

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
        alertService.getAll({ severity: severityFilter, status: statusFilter }),
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
      fetchData(); // Refresh to get updated stats and list
    } catch (error) {
      console.error(`Failed to ${action} alert`, error);
    }
  };

  // Generate realistic 30m historical telemetry anomaly curve for each alert
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
        // Normal baseline fluctuation
        val = normalVal + (Math.sin(i * 0.5) * 1.5) + (Math.random() * 0.5 - 0.25);
      } else {
        // Rapid spike or drop anomaly from minute -10m to 0m
        isAnomaly = true;
        const progress = (i - 20) / 9; // 0 to 1
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
      statsMap[sat._id] = { total: 0, critical: 0, warning: 0, latestAlert: null };
      if (sat.satelliteId) {
        statsMap[sat.satelliteId] = { total: 0, critical: 0, warning: 0, latestAlert: null };
      }
    });

    alerts.forEach(a => {
      const sat = a.satelliteId;
      if (!sat) return;
      const id1 = typeof sat === 'object' ? sat._id : sat;
      const id2 = typeof sat === 'object' ? sat.satelliteId : null;

      [id1, id2].filter(Boolean).forEach(key => {
        if (!statsMap[key]) {
          statsMap[key] = { total: 0, critical: 0, warning: 0, latestAlert: null };
        }
        statsMap[key].total += 1;
        if (a.severity === 'CRITICAL') statsMap[key].critical += 1;
        if (a.severity === 'WARNING') statsMap[key].warning += 1;
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
  const filteredAlerts = alerts.filter(a => {
    if (!satelliteFilter) return false; // Do not show alerts if no satellite is selected

    const matchesSearch = 
      a.message?.toLowerCase().includes(search.toLowerCase()) || 
      a.type?.toLowerCase().includes(search.toLowerCase()) ||
      (a.satelliteId && a.satelliteId.satelliteId?.toLowerCase().includes(search.toLowerCase())) ||
      (a.satelliteId && a.satelliteId.name?.toLowerCase().includes(search.toLowerCase()));

    const satObj = a.satelliteId;
    const matchesSat = 
      satObj && (
        satObj === satelliteFilter ||
        satObj._id === satelliteFilter || 
        satObj.satelliteId === satelliteFilter ||
        satObj.name === satelliteFilter
      );

    return matchesSearch && matchesSat;
  });

  // Filter the main CubeSat Fleet grid
  const filteredFleetList = fleetList.filter(sat => {
    const key = sat._id || sat.satelliteId;
    const stat = satAlertStats[key] || { total: 0, critical: 0, warning: 0 };
    const query = fleetSearch.toLowerCase();

    const matchesQuery = 
      (sat.name && sat.name.toLowerCase().includes(query)) ||
      (sat.satelliteId && sat.satelliteId.toLowerCase().includes(query)) ||
      (sat.orbitType && sat.orbitType.toLowerCase().includes(query)) ||
      (sat.type && sat.type.toLowerCase().includes(query));

    if (fleetFilterType === 'CRITICAL') return matchesQuery && stat.critical > 0;
    if (fleetFilterType === 'WARNING') return matchesQuery && stat.warning > 0 && stat.critical === 0;
    if (fleetFilterType === 'NOMINAL') return matchesQuery && stat.total === 0;
    return matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      
      {/* 1. Header with Title & Top-Right KPI Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-sans flex items-center space-x-3">
            <span>Alerts & Incidents</span>
            {satelliteFilter && (
              <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                CUBESAT ISOLATED
              </span>
            )}
          </h1>
          <p className="text-gray-400 font-mono text-xs tracking-wider mt-1">
            {satelliteFilter 
              ? `Inspecting incident logs and telemetry telemetry curves for ${activeSatName}`
              : `Select a CubeSat below to inspect its active anomalies and telemetry curves`
            }
          </p>
        </div>

        {/* 4 Metric Boxes Aligned on Right */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-1">
          
          {/* CRITICAL */}
          <div className="bg-[#0B1221] border border-[#FF2A2A] px-4 py-2.5 rounded min-w-[100px] shadow-sm shadow-[#FF2A2A]/10">
            <span className="text-[#FF2A2A] font-mono text-[10px] tracking-widest uppercase block font-bold">
              CRITICAL
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-2xl font-bold text-white font-mono leading-none">
                {stats.critical.toString().padStart(2, '0')}
              </span>
              <span className="text-[#FF2A2A] text-xs">▲</span>
            </div>
          </div>

          {/* WARNINGS */}
          <div className="bg-[#0B1221] border border-[#FFB000] px-4 py-2.5 rounded min-w-[100px] shadow-sm shadow-[#FFB000]/10">
            <span className="text-[#FFB000] font-mono text-[10px] tracking-widest uppercase block font-bold">
              WARNINGS
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-2xl font-bold text-white font-mono leading-none">
                {stats.warning.toString().padStart(2, '0')}
              </span>
              <span className="text-[#FFB000] text-xs">⚠</span>
            </div>
          </div>

          {/* RESOLVED */}
          <div className="bg-[#0B1221] border border-[#00FF66] px-4 py-2.5 rounded min-w-[100px] shadow-sm shadow-[#00FF66]/10">
            <span className="text-[#00FF66] font-mono text-[10px] tracking-widest uppercase block font-bold">
              RESOLVED
            </span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-2xl font-bold text-white font-mono leading-none">
                {stats.resolved.toString().padStart(2, '0')}
              </span>
              <span className="text-[#00FF66] text-xs">✓</span>
            </div>
          </div>

          {/* ASSETS MONITORED */}
          <div className="bg-[#0B1221] border border-gray-700 px-4 py-2.5 rounded min-w-[100px]">
            <span className="text-gray-400 font-mono text-[10px] tracking-widest uppercase block">
              ASSETS MONITORED
            </span>
            <div className="mt-0.5">
              <span className="text-2xl font-bold text-white font-mono leading-none">
                {fleetList.length.toString().padStart(2, '0')}
              </span>
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
                  CUBESAT INCIDENT DECK
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Select an asset to inspect live telemetry anomalies & incident logs
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
                { key: 'ALL', label: 'ALL ASSETS' },
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
              const stat = satAlertStats[satKey] || { total: 0, critical: 0, warning: 0, latestAlert: null };
              const hasCritical = stat.critical > 0;
              const hasWarning = stat.warning > 0;
              const isNominal = stat.total === 0;

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
                              {stat.total}
                            </span>
                            <span className="font-mono text-[10px] text-[#FF2A2A] font-bold uppercase tracking-wider">
                              ALERTS
                            </span>
                          </div>
                        ) : hasWarning ? (
                          <div className="flex items-center space-x-1.5 bg-[#FFB000]/15 border border-[#FFB000]/40 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#FFB000] text-black font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(255,176,0,0.6)]">
                              {stat.total}
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
                          <span>All orbital subsystems nominal. No incidents.</span>
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
                    <span>SELECT CUBESAT TO VIEW ALERTS ({stat.total})</span>
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
                  {filteredAlerts.length} active incident(s) reported for this asset
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
                  const stat = satAlertStats[key] || { total: 0 };
                  return (
                    <option key={key} value={key}>
                      {sat.name || sat.satelliteId} ({stat.total} alerts)
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

          {/* Sub-Filters for this CubeSat */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 flex flex-col md:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3.5 top-2.5 text-gray-500" size={15} />
              <input 
                type="text" 
                placeholder={`Search ${activeSat?.name || 'CubeSat'} alerts, metrics, or anomaly details...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#050810] border border-gray-800 rounded pl-10 pr-4 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
              />
            </div>

            {/* Severity and Status Dropdowns */}
            <div className="flex items-center space-x-2 w-full md:w-auto font-mono text-xs">
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#050810] border border-gray-800 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer font-bold"
              >
                <option value="ALL">SEVERITY: ALL</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="WARNING">WARNING</option>
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#050810] border border-gray-800 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
              >
                <option value="ACTIVE">STATUS: ACTIVE</option>
                <option value="RESOLVED">STATUS: RESOLVED</option>
                <option value="ALL">STATUS: ALL</option>
              </select>

              <button 
                onClick={() => {
                  setSearch('');
                  setSeverityFilter('ALL');
                  setStatusFilter('ACTIVE');
                }}
                title="Reset Filters"
                className="p-2 border border-gray-800 rounded bg-[#050810] text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-colors"
              >
                <Filter size={15} />
              </button>
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
                        const target = alert.satelliteId || satellites.find(s => s.satelliteId === 'SAT-003');
                        if (target) {
                          selectSatellite(target);
                          openDetailModal(target);
                        }
                      }}
                      className="inline-flex items-center space-x-1.5 text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 px-2 py-0.5 rounded font-mono text-xs font-bold tracking-wider uppercase transition-colors"
                      title="Inspect Satellite Details"
                    >
                      <Eye size={12} />
                      <span>{alert.satelliteId ? (alert.satelliteId.name ? `${alert.satelliteId.name} [${alert.satelliteId.satelliteId}]` : alert.satelliteId.satelliteId) : 'SAT-003'}</span>
                    </button>
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
                      {alert.metric === 'Temperature' ? 'Thermal / Propulsion' : alert.metric || 'Propulsion'}
                    </p>
                  </div>

                  <div className="bg-[#050810] p-3.5 rounded border border-gray-800/90">
                    <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-1">
                      CURRENT VALUE
                    </span>
                    <p className={`font-mono text-sm font-bold ${isCritical ? 'text-[#FF2A2A]' : 'text-[#FFB000]'}`}>
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
                    {alert.message || 'A sudden temperature spike was detected in Propulsion Thruster B assembly. Value exceeded operational threshold (310K) at T-00:02:14. Correlated with a 4% drop in available bus power. Recommend immediate visual telemetry check and preparation for subsystem isolation.'}
                  </p>
                </div>

                {/* TELEMETRY (LAST 30M) CHART (Matching Alerts & Incidents.png) */}
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
                              <stop offset="5%" stopColor={isCritical ? '#FF2A2A' : '#FFB000'} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={isCritical ? '#FF2A2A' : '#FFB000'} stopOpacity={0.0}/>
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
                            stroke={isCritical ? '#FF2A2A' : '#FFB000'} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill={`url(#gradient-${alert._id})`} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons: Full-width ACKNOWLEDGE & RESOLVE (Matching Alerts & Incidents.png) */}
                {alert.severity !== 'RESOLVED' && (
                  <div className="px-6 pb-6 pt-2 flex space-x-4">
                    {!alert.acknowledged ? (
                      <button 
                        onClick={() => handleAction(alert._id, 'ACKNOWLEDGE')}
                        className="flex-1 bg-[#00F0FF] hover:bg-[#82E6E6] text-[#0A0F1F] font-bold py-3 rounded text-xs font-mono tracking-widest uppercase transition-colors shadow-lg shadow-[#00F0FF]/10"
                      >
                        ACKNOWLEDGE
                      </button>
                    ) : (
                      <div className="flex-1 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-xs py-3 rounded text-center tracking-widest uppercase">
                        ACKNOWLEDGED ✓
                      </div>
                    )}
                    <button 
                      onClick={() => handleAction(alert._id, 'RESOLVE')}
                      className="flex-1 bg-[#12192b] hover:bg-gray-800 text-gray-200 border border-gray-700 py-3 rounded text-xs font-mono tracking-widest uppercase font-bold transition-colors"
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
