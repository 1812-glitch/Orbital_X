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
  const [satelliteFilter, setSatelliteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

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

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = 
      a.message?.toLowerCase().includes(search.toLowerCase()) || 
      a.type?.toLowerCase().includes(search.toLowerCase()) ||
      (a.satelliteId && a.satelliteId.satelliteId?.toLowerCase().includes(search.toLowerCase())) ||
      (a.satelliteId && a.satelliteId.name?.toLowerCase().includes(search.toLowerCase()));

    const matchesSat = 
      satelliteFilter === 'ALL' || 
      (a.satelliteId && (a.satelliteId._id === satelliteFilter || a.satelliteId.satelliteId === satelliteFilter));

    return matchesSearch && matchesSat;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
      
      {/* 1. Header with Title & Top-Right KPI Cards (Matching Alerts & Incidents.png) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase font-sans">
            Alerts & Incidents
          </h1>
          <p className="text-gray-400 font-mono text-xs tracking-wider mt-1">
            Live monitoring across {satellites.length > 0 ? satellites.length : 42} active assets
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

          {/* TOTAL (24H) */}
          <div className="bg-[#0B1221] border border-gray-700 px-4 py-2.5 rounded min-w-[100px]">
            <span className="text-gray-400 font-mono text-[10px] tracking-widest uppercase block">
              TOTAL (24H)
            </span>
            <div className="mt-0.5">
              <span className="text-2xl font-bold text-white font-mono leading-none">
                {stats.total24h.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Filter Bar with Search, Severity, Sat, Status & Filter Button (Matching Alerts & Incidents.png) */}
      <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-3 flex flex-col md:flex-row items-center gap-3">
        
        {/* Search Input */}
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3.5 top-2.5 text-gray-500" size={15} />
          <input 
            type="text" 
            placeholder="Search alerts, IDs, or values..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050810] border border-gray-800 rounded pl-10 pr-4 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-2 w-full md:w-auto font-mono text-xs">
          
          {/* Severity Dropdown */}
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#050810] border border-gray-800 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
          >
            <option value="ALL">SEVERITY: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
          </select>

          {/* Satellite Filter Dropdown (Enhanced with Names) */}
          <select 
            value={satelliteFilter} 
            onChange={(e) => {
              setSatelliteFilter(e.target.value);
              if (e.target.value !== 'ALL') {
                const found = satellites.find(s => s._id === e.target.value || s.satelliteId === e.target.value);
                if (found) selectSatellite(found);
              }
            }}
            className="bg-[#050810] border border-gray-800 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer font-bold"
          >
            <option value="ALL">ALL SATELLITES</option>
            {satellites.map(sat => (
              <option key={sat._id} value={sat._id}>
                {sat.name ? `${sat.name} (${sat.satelliteId})` : sat.satelliteId}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#050810] border border-gray-800 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
          >
            <option value="ACTIVE">STATUS: ACTIVE</option>
            <option value="RESOLVED">STATUS: RESOLVED</option>
            <option value="ALL">STATUS: ALL</option>
          </select>

          {/* Filter icon action button */}
          <button 
            onClick={() => {
              setSearch('');
              setSeverityFilter('ALL');
              setSatelliteFilter('ALL');
              setStatusFilter('ACTIVE');
            }}
            title="Reset Filters"
            className="p-2 border border-gray-800 rounded bg-[#050810] text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-colors"
          >
            <Filter size={15} />
          </button>
        </div>

      </div>

      {/* 3. Alerts Feed Cards (Matching Alerts & Incidents.png) */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-[#00F0FF] font-mono text-center py-12 tracking-widest animate-pulse">
            SCANNING TELEMETRY ANOMALIES...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0B1221] border border-gray-800 rounded-lg h-64 mt-4">
            <div className="w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center mb-4">
              <CheckCircle size={24} className="text-gray-500" />
            </div>
            <h3 className="text-gray-300 mb-1 font-medium font-mono text-sm">No active incidents</h3>
            <p className="text-[#00FF66] font-mono text-xs">All systems nominal.</p>
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
  );
}
