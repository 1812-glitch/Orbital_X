import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import satelliteService from '../../services/satelliteService';
import { Search, Plus, Wifi, AlertTriangle, WifiOff, Activity, Trash2, Satellite } from 'lucide-react';
import CreateSatelliteModal from '../../components/forms/CreateSatelliteModal';

export default function SatelliteFleet() {
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSatellites();
  }, []);

  const fetchSatellites = async () => {
    try {
      const data = await satelliteService.getAll();
      setSatellites(data.data || []);
    } catch (error) {
      console.error('Error fetching satellites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSatellite = async (e, sat) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Permanently delete satellite/CubeSat "${sat.name}" (${sat.satelliteId}) from MongoDB Atlas?`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(sat._id);
      await satelliteService.delete(sat._id);
      setSatellites(prev => prev.filter(s => s._id !== sat._id));
    } catch (err) {
      console.error('Failed to delete satellite from MongoDB:', err);
      alert(err.response?.data?.message || 'Failed to delete satellite from database.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: satellites.length,
    connected: satellites.filter(s => s.status === 'ACTIVE').length,
    warning: 0,
    critical: satellites.filter(s => s.status === 'OFFLINE').length
  };

  // Mock telemetry data for the table as approved in the plan
  const getMockTelemetry = (orbit) => {
    if (orbit === 'GEO') return { alt: '35,786 km', speed: '3.07 km/s', temp: '40 °C', bat: '100%', sig: '-65 dBm', status: 'HEALTHY' };
    if (orbit === 'MEO') return { alt: '20,200 km', speed: '3.12 km/s', temp: '38 °C', bat: '92%', sig: '-58 dBm', status: 'HEALTHY' };
    return { alt: '550 km', speed: '7.52 km/s', temp: '42 °C', bat: '87%', sig: '-62 dBm', status: 'HEALTHY' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-3">Satellite Fleet</h1>
        <p className="text-gray-400 max-w-2xl text-[15px] leading-relaxed">
          Monitor and manage the OrbitalX satellite constellation. Real-time telemetry and operational status.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-[#0B1221]/80 border border-[#00F0FF]/30 p-5 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#00F0FF]/10 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Total Satellites</h3>
            <Activity size={14} className="text-[#00F0FF]" />
          </div>
          <p className="text-3xl font-bold text-[#00F0FF] font-mono">{stats.total}</p>
        </div>

        {/* Connected */}
        <div className="bg-[#0B1221]/80 border border-[#00FF66]/30 p-5 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#00FF66]/10 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Connected</h3>
            <Wifi size={14} className="text-[#00FF66]" />
          </div>
          <p className="text-3xl font-bold text-[#00FF66] font-mono">{stats.connected}</p>
        </div>

        {/* Warning */}
        <div className="bg-[#0B1221]/80 border border-[#FFB000]/30 p-5 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/10 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Warning</h3>
            <AlertTriangle size={14} className="text-[#FFB000]" />
          </div>
          <p className="text-3xl font-bold text-[#FFB000] font-mono">{stats.warning}</p>
        </div>

        {/* Critical */}
        <div className="bg-[#0B1221]/80 border border-[#FF2A2A]/30 p-5 rounded relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF2A2A]/10 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Critical / Offline</h3>
            <WifiOff size={14} className="text-[#FF2A2A]" />
          </div>
          <p className="text-3xl font-bold text-[#FF2A2A] font-mono">{stats.critical}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-1 w-full space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search satellite ID or name..."
              className="w-full bg-[#0A0F1F] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50"
            />
          </div>
          <select className="bg-[#0A0F1F] border border-gray-800 text-gray-300 px-4 py-2.5 rounded font-mono text-xs focus:outline-none">
            <option>Status: All</option>
          </select>
          <select className="bg-[#0A0F1F] border border-gray-800 text-gray-300 px-4 py-2.5 rounded font-mono text-xs focus:outline-none">
            <option>Orbit: All</option>
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold py-2.5 px-6 rounded text-[11px] tracking-widest uppercase flex items-center space-x-2 transition-colors">
          <Plus size={14} />
          <span>Add Satellite</span>
        </button>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg p-12 text-center text-gray-500 font-mono">Loading fleet data...</div>
      ) : satellites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0B1221] border border-gray-800 rounded h-64 mt-6">
          <Satellite size={48} className="text-gray-600 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">No satellites deployed</h3>
          <p className="text-gray-500 font-mono text-xs">Register a new satellite to begin monitoring.</p>
        </div>
      ) : (
        <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm whitespace-nowrap">
              <thead className="text-[10px] tracking-widest text-gray-500 uppercase border-b border-gray-800 bg-[#0B1221]/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Satellite</th>
                  <th className="px-6 py-4 font-medium">Orbit</th>
                  <th className="px-6 py-4 font-medium">Altitude</th>
                  <th className="px-6 py-4 font-medium">Speed</th>
                  <th className="px-6 py-4 font-medium">Temp</th>
                  <th className="px-6 py-4 font-medium">Battery</th>
                  <th className="px-6 py-4 font-medium">Signal</th>
                  <th className="px-6 py-4 font-medium">Health</th>
                  <th className="px-6 py-4 font-medium text-right">Last Update</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {satellites.map((sat) => {
                  const telemetry = getMockTelemetry(sat.orbitType);
                  return (
                    <tr key={sat._id} className="hover:bg-[#121C36]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/satellites/${sat._id}`} className="block">
                          <div className="font-bold text-white group-hover:text-[#00F0FF] transition-colors">{sat.name.toUpperCase()}</div>
                          <div className="text-[10px] text-gray-500">{sat.satelliteId}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#00F0FF]">{sat.orbitType}</td>
                      <td className="px-6 py-4 text-gray-300">{telemetry.alt}</td>
                      <td className="px-6 py-4 text-[#00F0FF]">{telemetry.speed}</td>
                      <td className="px-6 py-4 text-gray-300">{telemetry.temp}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00FF66]" style={{width: telemetry.bat}}></div>
                          </div>
                          <span className="text-[10px] text-gray-400">{telemetry.bat}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{telemetry.sig}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          <span className="w-1 h-1 bg-[#00FF66] rounded-full"></span>
                          <span>Healthy</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-[11px]">10:42:31 UTC</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSatellite(e, sat)}
                          disabled={deletingId === sat._id}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50"
                          title="Delete satellite permanently from MongoDB"
                        >
                          <Trash2 size={14} className={deletingId === sat._id ? 'animate-spin' : ''} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <CreateSatelliteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSatelliteCreated={fetchSatellites} 
      />
    </div>
  );
}
