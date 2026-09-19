import React, { useState, useEffect } from 'react';
import telemetryService from '../../services/telemetryService';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Activity, Zap, Thermometer, Wifi, Satellite, Eye, ChevronDown } from 'lucide-react';
import { useSatellite } from '../../context/SatelliteContext';

export default function TelemetryAnalytics() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { satellites, selectedSatellite, selectSatellite, openDetailModal } = useSatellite();

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        telemetryService.getFleetStats(),
        telemetryService.getHistoricalTelemetry()
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-2">Telemetry Analytics</h1>
          <p className="text-gray-400 font-mono text-sm">Historical performance and subsystem tracking</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 h-24 animate-pulse"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`bg-[#0B1221] border border-gray-800 rounded-lg p-6 h-[380px] animate-pulse ${i === 3 ? 'lg:col-span-2' : ''}`}></div>
        ))}
      </div>
    </div>
  );

  if (!stats || !history.length) return (
    <div className="flex flex-col items-center justify-center py-32 bg-[#0A0F1F] animate-in fade-in h-[80vh]">
      <div className="text-[#FF2A2A] mb-6">
        <Wifi size={64} className="opacity-80" />
      </div>
      <h2 className="text-4xl font-bold text-white tracking-widest uppercase mb-4">Telemetry Stream Interrupted</h2>
      <p className="text-gray-400 font-mono text-sm max-w-lg text-center leading-relaxed">
        Connection to satellite nodes failed or sync aborted. The telemetry stream could not be established.
      </p>
      <div className="mt-8 flex items-center space-x-3 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-pulse"></span>
        <span className="text-[#FF2A2A]">STATUS: ERROR</span>
        <span className="text-gray-600 px-2">|</span>
        <span className="text-gray-500">WS: DISCONNECTED</span>
      </div>
    </div>
  );

  // Match the user's selected satellite with one in historical telemetry records
  const targetSat = history.find(s => 
    s._id === selectedSatellite?._id || 
    s.satelliteId === selectedSatellite?.satelliteId ||
    (s.name && selectedSatellite?.name && s.name.toLowerCase() === selectedSatellite.name.toLowerCase())
  ) || history[0];

  const chartData = targetSat?.records?.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    power: r.power,
    temperature: r.temperature,
    latency: r.latency,
    health: r.health
  })) || [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-1">Telemetry Analytics</h1>
          <p className="text-gray-400 font-mono text-sm">Historical performance and subsystem tracking</p>
        </div>

        {/* Prominent Satellite Selector Bar */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#0B1221] border border-gray-700/80 p-2 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 pl-2">
            <Satellite size={16} className="text-[#00F0FF]" />
            <span className="hidden sm:inline font-bold text-gray-300">ASSET:</span>
          </div>

          <select
            id="telemetry-satellite-select"
            value={targetSat?._id || targetSat?.satelliteId || ''}
            onChange={(e) => {
              const matched = history.find(s => s._id === e.target.value || s.satelliteId === e.target.value);
              if (matched) selectSatellite(matched);
            }}
            className="bg-[#050810] border border-gray-700 text-[#00F0FF] font-mono text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00F0FF] cursor-pointer"
          >
            {history.map((sat) => (
              <option key={sat._id || sat.satelliteId} value={sat._id || sat.satelliteId}>
                {sat.name || sat.satelliteId} ({sat.satelliteId})
              </option>
            ))}
          </select>

          <button
            id="telemetry-inspect-modal-btn"
            onClick={() => openDetailModal(targetSat)}
            className="flex items-center space-x-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors shadow-sm"
            title="Inspect Satellite Specs"
          >
            <Eye size={13} />
            <span>INSPECT SPECS</span>
          </button>
        </div>
      </div>

      {/* Quick Selection Chips for Active Fleet */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-gray-500 uppercase text-[11px] whitespace-nowrap">FLEET NODES:</span>
        {history.map((sat) => {
          const isCurrent = (targetSat?._id === sat._id || targetSat?.satelliteId === sat.satelliteId);
          return (
            <button
              key={sat._id || sat.satelliteId}
              onClick={() => selectSatellite(sat)}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap border ${
                isCurrent
                  ? 'bg-[#00F0FF] text-black font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-[#0B1221] hover:bg-[#121C36] text-gray-300 border-gray-800 hover:border-gray-700'
              }`}
            >
              {sat.name || sat.satelliteId}
            </button>
          );
        })}
      </div>

      {/* Global Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-[#00F0FF]/10 p-3 rounded text-[#00F0FF]">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Fleet Health</p>
            <p className="text-2xl font-bold text-white">{stats.avgHealth}%</p>
          </div>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-green-500/10 p-3 rounded text-green-500">
            <Wifi size={24} />
          </div>
          <div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Active Links</p>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
          </div>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-yellow-500/10 p-3 rounded text-yellow-500">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Warning States</p>
            <p className="text-2xl font-bold text-white">{stats.warning}</p>
          </div>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-red-500/10 p-3 rounded text-red-500">
            <Thermometer size={24} />
          </div>
          <div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Offline Assets</p>
            <p className="text-2xl font-bold text-white">{stats.offline}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Power Consumption Chart */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-6 flex items-center">
            <Zap size={16} className="text-[#00F0FF] mr-2" />
            Power Draw Dynamics ({targetSat?.name || targetSat?.satelliteId})
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickMargin={10} />
                <YAxis stroke="#4b5563" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050810', borderColor: '#1f2937', color: '#fff' }}
                  itemStyle={{ color: '#00F0FF' }}
                />
                <Area type="monotone" dataKey="power" stroke="#00F0FF" fillOpacity={1} fill="url(#colorPower)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Stability Chart */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-6 flex items-center">
            <Thermometer size={16} className="text-red-500 mr-2" />
            Thermal Stability ({targetSat?.name || targetSat?.satelliteId})
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickMargin={10} />
                <YAxis stroke="#4b5563" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050810', borderColor: '#1f2937', color: '#fff' }}
                />
                <Line type="monotone" dataKey="temperature" stroke="#ff2a2a" strokeWidth={2} dot={{ r: 4, fill: '#050810' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency & Health Combined Chart */}
        <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-white font-mono text-sm tracking-widest uppercase mb-6 flex items-center">
            <Activity size={16} className="text-[#00FF66] mr-2" />
            Latency vs Core Health ({targetSat?.name || targetSat?.satelliteId})
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickMargin={10} />
                <YAxis yAxisId="left" stroke="#00FF66" fontSize={10} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#FFB000" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050810', borderColor: '#1f2937', color: '#fff' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="health" fill="#00FF66" name="Core Health (%)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="latency" fill="#FFB000" name="Latency (ms)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
