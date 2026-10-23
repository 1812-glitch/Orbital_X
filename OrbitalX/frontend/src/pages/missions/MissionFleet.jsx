import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import missionService from '../../services/missionService';
import { Search, Plus, Target, CheckCircle2, Clock, Activity, Box, ChevronRight, Trash2 } from 'lucide-react';
import CreateMissionModal from '../../components/forms/CreateMissionModal';

export default function MissionFleet() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const data = await missionService.getAll();
      setMissions(data.data || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMission = async (e, mission) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Permanently delete mission "${mission.name}" (${mission.missionId}) from MongoDB Atlas?`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(mission._id);
      await missionService.delete(mission._id);
      setMissions(prev => prev.filter(m => m._id !== mission._id));
    } catch (err) {
      console.error('Failed to delete mission from MongoDB:', err);
      alert(err.response?.data?.message || 'Failed to delete mission from database.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: missions.length || 0,
    active: missions.filter(m => m.status === 'ACTIVE').length || 0,
    planned: missions.filter(m => m.status === 'PLANNED').length || 0,
    completed: missions.filter(m => m.status === 'COMPLETED').length || 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-3">Mission Control</h1>
        <p className="text-gray-400 max-w-2xl text-[15px] leading-relaxed">
          Manage orbital assignments, launch schedules, and strategic directives.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1221]/80 border border-[#00F0FF]/30 p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Total Missions</h3>
            <Target size={14} className="text-[#00F0FF]" />
          </div>
          <p className="text-3xl font-bold text-[#00F0FF] font-mono">{stats.total}</p>
        </div>

        <div className="bg-[#0B1221]/80 border border-[#00FF66]/30 p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Active</h3>
            <Activity size={14} className="text-[#00FF66]" />
          </div>
          <p className="text-3xl font-bold text-[#00FF66] font-mono">{stats.active}</p>
        </div>

        <div className="bg-[#0B1221]/80 border border-[#FFB000]/30 p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Planned</h3>
            <Clock size={14} className="text-[#FFB000]" />
          </div>
          <p className="text-3xl font-bold text-[#FFB000] font-mono">{stats.planned}</p>
        </div>

        <div className="bg-[#0B1221]/80 border border-gray-600 p-5 rounded relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-gray-400 font-mono text-[10px] tracking-widest uppercase">Completed</h3>
            <CheckCircle2 size={14} className="text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-300 font-mono">{stats.completed}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-1 w-full space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search mission ID or name..."
              className="w-full bg-[#0A0F1F] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded font-mono text-xs focus:outline-none focus:border-[#00F0FF]/50"
            />
          </div>
          <select className="bg-[#0A0F1F] border border-gray-800 text-gray-300 px-4 py-2.5 rounded font-mono text-xs focus:outline-none">
            <option>Status: All</option>
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#82E6E6] hover:bg-white text-[#0A0F1F] font-bold py-2.5 px-6 rounded text-[11px] tracking-widest uppercase flex items-center space-x-2 transition-colors">
          <Plus size={14} />
          <span>Add Mission</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead className="text-[10px] tracking-widest text-gray-500 uppercase border-b border-gray-800 bg-[#0B1221]/50">
              <tr>
                <th className="px-6 py-4 font-medium">Mission</th>
                <th className="px-6 py-4 font-medium">Target Orbit</th>
                <th className="px-6 py-4 font-medium">CubeSat Size</th>
                <th className="px-6 py-4 font-medium">Launch Date</th>
                <th className="px-6 py-4 font-medium">Site</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading missions from MongoDB...</td></tr>
              ) : missions.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No missions logged in database. Click "Add Mission" to create your first mission.</td></tr>
              ) : (
                missions.map((mission) => (
                  <tr 
                    key={mission._id} 
                    onClick={() => navigate(`/missions/${mission._id}`)}
                    className="hover:bg-[#121C36]/50 transition-colors group cursor-pointer border-b border-gray-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-white group-hover:text-[#00F0FF] transition-colors">{mission.name.toUpperCase()}</div>
                      <div className="text-[10px] text-gray-500">{mission.missionId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                        {mission.orbitType || 'LEO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] font-bold">
                          <Box size={10} className="mr-1 text-[#00F0FF]" />
                          {mission.formFactor || '3U'} CUBESAT
                        </span>
                        {mission.assignedSatellites?.[0]?.name && (
                          <span className="text-[10px] text-gray-400 truncate max-w-[120px] hidden md:inline">
                            {mission.assignedSatellites[0].name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{mission.launchDate ? new Date(mission.launchDate).toLocaleDateString() : 'TBD'}</td>
                    <td className="px-6 py-4 text-gray-400">{mission.launchSite || 'Cape Canaveral'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <span className={`inline-flex items-center space-x-1.5 border px-2 py-0.5 rounded text-[10px] uppercase tracking-wider
                          ${mission.status === 'ACTIVE' ? 'border-[#00FF66]/30 text-[#00FF66]' : 
                            mission.status === 'PLANNED' ? 'border-[#FFB000]/30 text-[#FFB000]' : 
                            'border-gray-600/30 text-gray-400'}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${
                            mission.status === 'ACTIVE' ? 'bg-[#00FF66]' : 
                            mission.status === 'PLANNED' ? 'bg-[#FFB000]' : 'bg-gray-400'
                          }`}></span>
                          <span>{mission.status}</span>
                        </span>
                        <ChevronRight size={14} className="text-gray-500 group-hover:text-[#00F0FF] group-hover:translate-x-1 transition-all" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteMission(e, mission)}
                        disabled={deletingId === mission._id}
                        className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50"
                        title="Delete mission permanently from MongoDB"
                      >
                        <Trash2 size={14} className={deletingId === mission._id ? 'animate-spin' : ''} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateMissionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onMissionCreated={fetchMissions} 
      />
    </div>
  );
}
