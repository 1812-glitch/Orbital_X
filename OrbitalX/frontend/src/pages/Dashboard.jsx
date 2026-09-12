import React, { useState, useEffect } from 'react';
import telemetryService from '../services/telemetryService';
import { Activity, Radio, AlertTriangle, ShieldCheck, Zap, Thermometer, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, warning: 0, offline: 0, avgHealth: 100 });
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, telemetryData] = await Promise.all([
        telemetryService.getFleetStats(),
        telemetryService.getLatestTelemetry()
      ]);
      
      setStats(statsData.data);
      setTelemetry(telemetryData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 10 seconds to simulate live data
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0A0F1F] border-t-[#00F0FF] rounded-full animate-spin"></div>
          <p className="text-[#00F0FF] font-mono tracking-widest animate-pulse">ESTABLISHING UPLINK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-widest text-white uppercase mb-2">Fleet Overview</h1>
        <p className="text-gray-400 font-mono text-sm">System-wide operational metrics and telemetry feed.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0A0F1F] border border-gray-800 p-6 rounded-lg relative overflow-hidden group hover:border-[#00F0FF]/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Radio size={48} className="text-[#00F0FF]" />
          </div>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-2">Active Satellites</p>
          <div className="flex items-end space-x-2">
            <span className="text-4xl font-bold text-[#00F0FF]">{stats.active}</span>
            <span className="text-gray-500 font-mono text-sm mb-1">/ {stats.total}</span>
          </div>
        </div>

        <div className="bg-[#0A0F1F] border border-gray-800 p-6 rounded-lg relative overflow-hidden group hover:border-[#22c55e]/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={48} className="text-[#22c55e]" />
          </div>
          <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-2">Fleet Health Avg</p>
          <div className="flex items-end space-x-2">
            <span className="text-4xl font-bold text-[#22c55e]">{stats.avgHealth}%</span>
          </div>
        </div>

        <div className="bg-[#0A0F1F] border border-[#FFB020]/30 p-6 rounded-lg relative overflow-hidden group hover:border-[#FFB020]/70 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={48} className="text-[#FFB020]" />
          </div>
          <p className="text-[#FFB020] font-mono text-xs uppercase tracking-widest mb-2">Warnings</p>
          <div className="flex items-end space-x-2">
            <span className="text-4xl font-bold text-[#FFB020]">{stats.warning}</span>
          </div>
        </div>

        <div className="bg-[#0A0F1F] border border-[#FF2A2A]/30 p-6 rounded-lg relative overflow-hidden group hover:border-[#FF2A2A]/70 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-[#FF2A2A]" />
          </div>
          <p className="text-[#FF2A2A] font-mono text-xs uppercase tracking-widest mb-2">Critical / Offline</p>
          <div className="flex items-end space-x-2">
            <span className="text-4xl font-bold text-[#FF2A2A]">{stats.offline}</span>
          </div>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#12192b]/50">
          <h2 className="text-white font-mono text-sm tracking-widest uppercase flex items-center space-x-2">
            <Activity size={16} className="text-[#00F0FF]" />
            <span>Live Telemetry Feed</span>
          </h2>
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#00F0FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-mono text-gray-500 tracking-widest uppercase">
                <th className="px-6 py-4 font-normal">Asset ID</th>
                <th className="px-6 py-4 font-normal">Altitude</th>
                <th className="px-6 py-4 font-normal">Velocity</th>
                <th className="px-6 py-4 font-normal">Temp</th>
                <th className="px-6 py-4 font-normal">Power</th>
                <th className="px-6 py-4 font-normal">Signal</th>
              </tr>
            </thead>
            <tbody className="text-sm font-mono text-gray-300 divide-y divide-gray-800/50">
              {telemetry.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No active telemetry feeds available.
                  </td>
                </tr>
              ) : (
                telemetry.map((feed) => (
                  <tr key={feed.satellite._id} className="hover:bg-[#12192b]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${feed.telemetry ? 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]' : 'bg-gray-600'}`}></div>
                        <span className="text-white font-bold">{feed.satellite.satelliteId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {feed.telemetry ? (
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} className="text-gray-500" />
                          <span>{feed.telemetry.altitude.toFixed(1)} <span className="text-gray-500 text-xs">km</span></span>
                        </div>
                      ) : <span className="text-gray-600">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      {feed.telemetry ? (
                        <span className="text-[#82E6E6]">{feed.telemetry.speed.toFixed(2)} <span className="text-[#82E6E6]/50 text-xs">km/s</span></span>
                      ) : <span className="text-gray-600">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      {feed.telemetry ? (
                        <div className="flex items-center space-x-2">
                          <Thermometer size={14} className={feed.telemetry.temperature > 80 ? 'text-[#FF2A2A]' : 'text-gray-500'} />
                          <span className={feed.telemetry.temperature > 80 ? 'text-[#FF2A2A]' : ''}>{feed.telemetry.temperature.toFixed(1)} °C</span>
                        </div>
                      ) : <span className="text-gray-600">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      {feed.telemetry ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${feed.telemetry.battery < 20 ? 'bg-[#FF2A2A]' : 'bg-[#22c55e]'}`} 
                              style={{ width: `${feed.telemetry.battery}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{feed.telemetry.battery}%</span>
                        </div>
                      ) : <span className="text-gray-600">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      {feed.telemetry ? (
                        <span className="font-bold text-white">{feed.telemetry.signal} <span className="text-gray-500 font-normal text-xs">dBm</span></span>
                      ) : <span className="text-gray-600">--</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
