import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Shield, UserX, UserCheck, Play, Square, RotateCcw, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [simStatus, setSimStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simActionLoading, setSimActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      const [usersData, logsData, simData] = await Promise.all([
        adminService.getUsers(),
        adminService.getAuditLogs({ limit: 5 }),
        adminService.getSimulationStatus()
      ]);
      setUsers(usersData.data);
      setLogs(logsData.data.slice(0, 5)); // 5 recent logs for timeline
      setSimStatus(simData.data);
      if (simData.data?.isRunning !== undefined) {
        window.dispatchEvent(new CustomEvent('orbital-sim-status', { detail: { isRunning: simData.data.isRunning } }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await adminService.updateUserRole(userId, newRole);
    fetchData();
  };

  const handleStatusToggle = async (userId, isActive) => {
    await adminService.toggleUserStatus(userId, !isActive);
    fetchData();
  };

  const handleSimStart = async () => {
    // 1. Instant optimistic UI update & top header sync
    setSimStatus(prev => ({ ...(prev || {}), isRunning: true }));
    setSimActionLoading('start');
    window.dispatchEvent(new CustomEvent('orbital-sim-status', { detail: { isRunning: true } }));

    try {
      const res = await adminService.startSimulation();
      if (res?.data) {
        setSimStatus(res.data);
        window.dispatchEvent(new CustomEvent('orbital-sim-status', { detail: { isRunning: res.data.isRunning } }));
      }
      // Refresh timeline asynchronously without freezing button
      adminService.getAuditLogs({ limit: 5 }).then(logsData => {
        if (logsData?.data) setLogs(logsData.data.slice(0, 5));
      }).catch(() => {});
    } catch (error) {
      console.error('Error starting simulation:', error);
      fetchData(); // Rollback if error
    } finally {
      setSimActionLoading(null);
    }
  };

  const handleSimStop = async () => {
    // 1. Instant optimistic UI update & top header sync
    setSimStatus(prev => ({ ...(prev || {}), isRunning: false }));
    setSimActionLoading('stop');
    window.dispatchEvent(new CustomEvent('orbital-sim-status', { detail: { isRunning: false } }));

    try {
      const res = await adminService.stopSimulation();
      if (res?.data) {
        setSimStatus(res.data);
        window.dispatchEvent(new CustomEvent('orbital-sim-status', { detail: { isRunning: res.data.isRunning } }));
      }
      // Refresh timeline asynchronously without freezing button
      adminService.getAuditLogs({ limit: 5 }).then(logsData => {
        if (logsData?.data) setLogs(logsData.data.slice(0, 5));
      }).catch(() => {});
    } catch (error) {
      console.error('Error stopping simulation:', error);
      fetchData(); // Rollback if error
    } finally {
      setSimActionLoading(null);
    }
  };

  const handleSimSpeed = async (speed) => {
    // 1. Instant optimistic UI update
    setSimStatus(prev => ({
      ...(prev || {}),
      speedMultiplier: speed,
      intervalMs: Math.round(15000 / speed)
    }));
    try {
      const res = await adminService.setSimulationSpeed(speed);
      if (res?.data) {
        setSimStatus(res.data);
      }
    } catch (error) {
      console.error('Error setting simulation speed:', error);
      fetchData();
    }
  };

  if (loading) return <div className="p-8 text-[#00F0FF] font-mono text-center">LOADING ADMIN CONSOLE...</div>;

  const operatorsCount = users.filter(u => u.role === 'OPERATOR').length;
  const viewersCount = users.filter(u => u.role === 'VIEWER').length;
  const activeAlerts = 0; // Ideally fetched from alertService, hardcoding for visual match or fetch later

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <h1 className="text-xl font-bold tracking-widest text-[#00F0FF] uppercase flex items-center">
          ORBITAL-X ADMIN
          <span className="ml-6 text-sm text-[#00FF66] font-mono flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] mr-2"></span>
            SYS.HEALTH: 99.8%
          </span>
        </h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-[#0B1221] border border-gray-800 p-4 rounded">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Total Users</p>
          <p className="text-2xl font-bold text-[#00F0FF]">{users.length}</p>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 p-4 rounded">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Operators</p>
          <p className="text-2xl font-bold text-white">{operatorsCount}</p>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 p-4 rounded">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Viewers</p>
          <p className="text-2xl font-bold text-white">{viewersCount}</p>
        </div>
        <div className="bg-[#0B1221] border border-gray-800 p-4 rounded">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Satellites</p>
          <p className="text-2xl font-bold text-[#00F0FF] flex items-center">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] mr-2"></span> 24 ACT
          </p>
        </div>
        <div className="bg-[#0B1221] border border-[#FF2A2A]/30 p-4 rounded shadow-[0_0_10px_rgba(255,42,42,0.05)]">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Active Alerts</p>
          <p className="text-2xl font-bold text-[#FF2A2A]">{activeAlerts}</p>
        </div>
        <div className="bg-[#0B1221] border border-[#00FF66]/30 p-4 rounded shadow-[0_0_10px_rgba(0,255,102,0.05)]">
          <p className="text-gray-400 font-mono text-[10px] tracking-widest uppercase mb-2">Sys. Status</p>
          <p className="text-2xl font-bold text-[#00FF66] flex items-center">
            <Activity size={16} className="mr-2" /> NOMINAL
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: User Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">User Directory</h2>
                <p className="text-gray-400 font-mono text-sm tracking-widest">Manage platform access and roles.</p>
              </div>
              <button className="bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 px-4 py-2 text-xs font-mono tracking-widest uppercase rounded hover:bg-[#00F0FF]/20 transition-colors">
                + ADD USER
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Name / Email</th>
                    <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Role</th>
                    <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Status</th>
                    <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal">Last Login (UTC)</th>
                    <th className="py-3 text-[10px] text-gray-500 font-mono tracking-widest uppercase font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="py-4">
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-gray-500 font-mono text-xs">{user.email}</div>
                      </td>
                      <td className="py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`bg-[#050810] border rounded px-2 py-1 text-[10px] font-mono tracking-widest uppercase focus:outline-none ${
                            user.role === 'ADMIN' ? 'text-[#FFB000] border-[#FFB000]/30' :
                            user.role === 'OPERATOR' ? 'text-[#00F0FF] border-[#00F0FF]/30' :
                            'text-gray-400 border-gray-700'
                          }`}
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="OPERATOR">Operator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="py-4">
                        {user.isActive ? (
                          <span className="text-[#00FF66] font-mono text-xs flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] mr-2"></span> Active</span>
                        ) : (
                          <span className="text-gray-500 font-mono text-xs flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-2"></span> Inactive</span>
                        )}
                      </td>
                      <td className="py-4 text-gray-400 font-mono text-[10px]">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'yyyy-MM-dd HH:mm:ss') : 'NEVER'}
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className={`p-1.5 rounded transition-colors ${
                            user.isActive 
                              ? 'text-[#FF2A2A] hover:bg-[#FF2A2A]/10' 
                              : 'text-[#00FF66] hover:bg-[#00FF66]/10'
                          }`}
                        >
                          {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Controls & Timeline */}
        <div className="space-y-6">
          
          {/* Simulation Control */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[10px] font-bold text-[#00F0FF] tracking-[0.2em] uppercase">Simulation Control</h2>
            </div>
            
            <div className="flex items-center mb-6">
              <span className={`w-2 h-2 rounded-full mr-2 ${simStatus?.isRunning ? 'bg-[#00FF66] shadow-[0_0_5px_#00FF66]' : 'bg-[#FF2A2A] shadow-[0_0_5px_#FF2A2A]'}`}></span>
              <span className={`font-mono text-xs tracking-widest ${simStatus?.isRunning ? 'text-[#00FF66]' : 'text-[#FF2A2A]'}`}>
                {simStatus?.isRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <button 
                onClick={handleSimStart}
                disabled={simStatus?.isRunning || simActionLoading !== null}
                className="bg-gray-800/50 hover:bg-[#00FF66]/10 text-gray-300 hover:text-[#00FF66] border border-gray-700 hover:border-[#00FF66]/50 py-2 rounded text-xs font-mono tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {simActionLoading === 'start' ? (
                  <RefreshCw size={12} className="mr-2 animate-spin text-[#00FF66]" />
                ) : (
                  <Play size={12} className="mr-2" />
                )}
                {simActionLoading === 'start' ? 'STARTING...' : 'START'}
              </button>
              <button 
                onClick={handleSimStop}
                disabled={!simStatus?.isRunning || simActionLoading !== null}
                className="bg-gray-800/50 hover:bg-[#FF2A2A]/10 text-gray-300 hover:text-[#FF2A2A] border border-gray-700 hover:border-[#FF2A2A]/50 py-2 rounded text-xs font-mono tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {simActionLoading === 'stop' ? (
                  <RefreshCw size={12} className="mr-2 animate-spin text-[#FF2A2A]" />
                ) : (
                  <Square size={12} className="mr-2" />
                )}
                {simActionLoading === 'stop' ? 'STOPPING...' : 'STOP'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-2">Simulation Speed</p>
                <div className="flex w-full bg-[#050810] border border-gray-800 rounded overflow-hidden">
                  {[0.5, 1, 2, 5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSimSpeed(speed)}
                      className={`flex-1 py-1.5 text-xs font-mono border-r border-gray-800 last:border-r-0 ${
                        simStatus?.speedMultiplier === speed 
                          ? 'bg-[#00F0FF]/20 text-[#00F0FF]' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-2">
                <p className="text-gray-500 font-mono text-[10px] tracking-widest uppercase">Telemetry Interval</p>
                <p className="text-[#00F0FF] font-mono text-xs">{simStatus?.intervalMs}ms</p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <h2 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-6">Activity Timeline</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-1 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
              {logs.map((log, i) => (
                <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-2 h-2 rounded-full border-2 border-[#0B1221] ${
                    log.action.includes('CREATED') || log.action.includes('GRANTED') ? 'bg-[#00F0FF]' :
                    log.action.includes('DELETED') || log.action.includes('LOST') ? 'bg-[#FF2A2A]' :
                    'bg-[#FFB000]'
                  } absolute left-1/2 -translate-x-1/2 z-10`} />
                  
                  <div className="w-[calc(100%-1rem)] md:w-[calc(50%-1rem)] p-3 rounded border border-gray-800 bg-[#050810]">
                    <div className="flex items-center mb-1">
                      <p className="text-gray-300 text-xs font-mono">{log.action}</p>
                    </div>
                    <span className="text-gray-500 font-mono">{format(new Date(log.timestamp), "HH:mm:ss 'UTC'")}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 font-mono text-xs">NO ACTIVITY</div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
