import React, { useState, useEffect } from 'react';
import { Activity, Battery, Thermometer } from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FleetAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orbitFilter, setOrbitFilter] = useState('ALL');

  useEffect(() => {
    fetchAnalytics();
  }, [orbitFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getFleetAnalytics({ orbitType: orbitFilter });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="text-[#00F0FF] font-mono text-center py-10 tracking-widest">GATHERING FLEET METRICS...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fleet Analytics</h1>
          <p className="text-gray-400 font-mono mt-2 tracking-widest text-sm">REAL-TIME PERFORMANCE METRICS FOR OPERATIONAL ASSETS</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <select 
            className="bg-[#050810] border border-gray-700 rounded px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
            disabled
          >
            <option>LAST 7 DAYS</option>
          </select>
          <select 
            value={orbitFilter}
            onChange={(e) => setOrbitFilter(e.target.value)}
            className="bg-[#050810] border border-gray-700 rounded px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">ALL ASSETS</option>
            <option value="LEO">LEO</option>
            <option value="MEO">MEO</option>
            <option value="GEO">GEO</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health */}
        <div className="bg-[#0B1221] border border-[#00FF66]/30 shadow-[0_0_15px_rgba(0,255,102,0.05)] p-6 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} className="text-[#00FF66]" />
          </div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <p className="text-gray-400 font-mono text-xs tracking-widest uppercase flex items-center">
              Avg Health
            </p>
            <Activity size={16} className="text-[#00FF66]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white tracking-tight">{data?.avgHealth || 0}%</h2>
            <p className="text-[#00FF66] font-mono text-xs mt-2 flex items-center tracking-widest">
              <span className="text-lg leading-none mr-1">~</span> NOMINAL
            </p>
          </div>
        </div>

        {/* Battery */}
        <div className="bg-[#0B1221] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.05)] p-6 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Battery size={64} className="text-[#00F0FF]" />
          </div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <p className="text-gray-400 font-mono text-xs tracking-widest uppercase flex items-center">
              Avg Battery
            </p>
            <Battery size={16} className="text-[#00F0FF]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white tracking-tight">{data?.avgBattery || 0}%</h2>
            <p className="text-[#00F0FF] font-mono text-xs mt-2 flex items-center tracking-widest">
              <span className="text-lg leading-none mr-1">⚡</span> CHARGING
            </p>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-[#0B1221] border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.05)] p-6 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Thermometer size={64} className="text-[#00F0FF]" />
          </div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <p className="text-gray-400 font-mono text-xs tracking-widest uppercase flex items-center">
              Avg Temp
            </p>
            <Thermometer size={16} className="text-[#00F0FF]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white tracking-tight">{data?.avgTemp || 0}°C</h2>
            <p className="text-gray-400 font-mono text-xs mt-2 tracking-widest">NOMINAL RANGE</p>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-[#0B1221] border border-gray-800 rounded p-6">
        <h3 className="text-white font-bold mb-6 tracking-tight">Fleet Health & Battery Trend (24h)</h3>
        <div className="h-[300px]">
          {data?.chartData && data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF66" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FF66" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis stroke="#4b5563" tick={{fill: '#9ca3af', fontSize: 12}} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050810', borderColor: '#1f2937', color: '#fff', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Area type="monotone" dataKey="health" stroke="#00FF66" fillOpacity={1} fill="url(#colorHealth)" />
                <Area type="monotone" dataKey="battery" stroke="#00F0FF" fillOpacity={1} fill="url(#colorBattery)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono text-sm tracking-widest">
              INSUFFICIENT HISTORICAL DATA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
