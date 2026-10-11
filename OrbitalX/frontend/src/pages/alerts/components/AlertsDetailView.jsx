import React from 'react';
import { 
  CheckCircle, 
  Check, 
  Search, 
  Filter, 
  Eye 
} from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import AiDiagnosisCard from '../../../components/alerts/AiDiagnosisCard';

export default function AlertsDetailView({
  activeSat,
  activeSatName,
  currentSatAlerts,
  activeSatStats,
  setSatelliteFilter,
  fleetList,
  satAlertStats,
  selectSatellite,
  openDetailModal,
  incidentCategory,
  setIncidentCategory,
  search,
  setSearch,
  loading,
  filteredAlerts,
  generateTelemetryCurve,
  handleAction
}) {
  return (
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
            value={activeSat ? (activeSat._id || activeSat.satelliteId) : 'ALL'}
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

      {/* Filter Pills with Badge Counters */}
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
                {/* Alert Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest ${
                      isCritical ? 'border border-[#FF2A2A] text-[#FF2A2A] bg-[#FF2A2A]/10' :
                      isWarning ? 'border border-[#FFB000] text-[#FFB000] bg-[#FFB000]/10' :
                      'border border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10'
                    }`}>
                      {alert.severity}
                    </span>
                    
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

                {/* 4 Metric Boxes Grid */}
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

                {/* AI Anomaly Diagnostics Card */}
                <div className="px-6 pb-2">
                  <AiDiagnosisCard 
                    alert={alert} 
                    activeSat={activeSat} 
                    onCommandDispatched={(cmd) => {
                      console.log('Command dispatched from AI copilot:', cmd);
                    }}
                  />
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
  );
}
