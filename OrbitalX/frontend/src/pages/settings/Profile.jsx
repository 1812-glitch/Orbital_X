import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Key, Monitor, Smartphone as Phone, Lock, Settings } from 'lucide-react';
import { authService } from '../../services/authService';

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setMessage({ text: 'Fill all fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(currentPassword, newPassword);
      setMessage({ text: 'Access Key Updated Successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Operator Profile</h1>
          <p className="text-[#00F0FF] font-mono text-xs uppercase tracking-widest">SYS.TERMINAL.USER_CFG // ACTIVE</p>
        </div>
        <div className="bg-[#00FF66]/10 border border-[#00FF66]/30 px-3 py-1.5 rounded flex items-center text-[10px] font-mono tracking-widest text-[#00FF66]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] mr-2"></span>
          Uplink Stable
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Identity */}
        <div className="space-y-6">
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6 text-center">
            <div className="w-32 h-32 mx-auto rounded border border-gray-700 bg-gray-900 overflow-hidden mb-4 flex items-center justify-center text-4xl text-[#00F0FF] font-bold">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
            <div className="inline-block bg-[#121C36] border border-gray-700 px-3 py-1 text-xs font-mono text-[#00F0FF] mb-6">
              {user?.role === 'ADMIN' ? 'Senior Flight Director' : 'Flight Controller'}
            </div>

            <div className="space-y-3 text-left border-t border-gray-800 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">ID</span>
                <span className="text-gray-300 font-mono text-xs">OP-{user?._id.substring(0,6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Clearance</span>
                <span className="text-[#FFB000] font-mono text-xs flex items-center"><Lock size={10} className="mr-1"/> {user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">Station</span>
                <span className="text-gray-300 font-mono text-xs">Ground Control 01</span>
              </div>
            </div>
          </div>

          {/* Security Subsystem */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 flex items-center">
              <Shield size={14} className="mr-2" /> Security Subsystem
            </h3>
            
            <div className="bg-[#121C36] border border-gray-700 rounded p-3 mb-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-white">Biometric 2FA</p>
                <p className="text-xs text-gray-500 font-mono">Retina + Fingerprint active</p>
              </div>
              <span className="text-[#00FF66] font-mono text-[10px] flex items-center">
                <span className="w-1 h-1 rounded-full bg-[#00FF66] mr-1"></span> Enabled
              </span>
            </div>

            <div>
              <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-2">Active Uplink Sessions</p>
              <div className="border border-gray-800 rounded bg-[#050810] divide-y divide-gray-800">
                <div className="p-3 flex items-center">
                  <Monitor size={16} className="text-[#00F0FF] mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-white">Main Console Terminal</p>
                    <p className="text-[10px] text-gray-500 font-mono">IP: 192.168.x.x • Current Session</p>
                  </div>
                </div>
                <div className="p-3 flex items-center">
                  <Phone size={16} className="text-gray-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Remote Comm Pad</p>
                    <p className="text-[10px] text-gray-600 font-mono">Last sync: 14 mins ago</p>
                  </div>
                  <button className="text-[10px] text-[#FF2A2A] font-mono tracking-widest uppercase hover:underline">Revoke</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Config Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <h3 className="text-[10px] font-bold text-[#00F0FF] tracking-[0.2em] uppercase mb-6 flex items-center">
              <Settings size={14} className="mr-2" /> Configuration Parameters
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-2">Comms Identifier (Email)</label>
                <div className="flex items-center bg-[#050810] border border-gray-800 rounded px-3 py-2">
                  <span className="text-gray-500 mr-2">@</span>
                  <input type="text" disabled value={user?.email} className="bg-transparent text-[#00F0FF] font-mono text-xs w-full outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-2">Secure Line (Phone)</label>
                <div className="flex items-center bg-[#050810] border border-gray-800 rounded px-3 py-2">
                  <Phone size={14} className="text-gray-500 mr-2" />
                  <input type="text" disabled value="+1 (555) 019-8372" className="bg-transparent text-gray-400 font-mono text-xs w-full outline-none" />
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate}>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-2">Current Access Key</label>
                  <div className="flex items-center bg-white rounded px-3 py-2">
                    <Key size={14} className="text-gray-400 mr-2" />
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="bg-transparent text-black text-sm w-full outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-2">New Access Key</label>
                  <div className="flex items-center bg-white rounded px-3 py-2">
                    <Lock size={14} className="text-gray-400 mr-2" />
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Generate new key..." 
                      className="bg-transparent text-black text-sm w-full outline-none" 
                    />
                  </div>
                </div>
              </div>

              {message.text && (
                <div className={`mb-4 text-xs font-mono p-2 rounded border ${message.type === 'error' ? 'text-[#FF2A2A] border-[#FF2A2A]/30 bg-[#FF2A2A]/10' : 'text-[#00FF66] border-[#00FF66]/30 bg-[#00FF66]/10'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end space-x-4 border-t border-gray-800 pt-6">
                <button 
                  type="button" 
                  onClick={() => {setCurrentPassword(''); setNewPassword('');}}
                  className="px-6 py-2 border border-gray-700 text-gray-300 font-mono text-[10px] tracking-widest uppercase rounded hover:bg-gray-800"
                >
                  Reset Form
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-[#00F0FF] text-black font-bold font-mono text-[10px] tracking-widest uppercase rounded hover:bg-[#00F0FF]/80 disabled:opacity-50"
                >
                  {loading ? 'Transmitting...' : 'Transmit Updates'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Mission Logs */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Recent Mission Logs</h3>
              <span className="text-[10px] text-[#00F0FF] font-mono tracking-widest uppercase cursor-pointer hover:underline">Full Archive →</span>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest font-normal">Mission ID</th>
                  <th className="pb-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest font-normal">Designation</th>
                  <th className="pb-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest font-normal">Status</th>
                  <th className="pb-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest font-normal text-right">Date (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                <tr>
                  <td className="py-3 text-xs font-mono text-[#00F0FF]">#ORB-992</td>
                  <td className="py-3 text-sm text-gray-300">Sat-Deploy Vanguard</td>
                  <td className="py-3">
                    <span className="border border-[#00FF66]/30 text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] mr-1.5"></span> Success
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono text-gray-500 text-right">2023.10.14</td>
                </tr>
                <tr>
                  <td className="py-3 text-xs font-mono text-[#00F0FF]">#LUN-441</td>
                  <td className="py-3 text-sm text-gray-300">Lunar Relay Maint.</td>
                  <td className="py-3">
                    <span className="border border-[#00FF66]/30 text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] mr-1.5"></span> Success
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono text-gray-500 text-right">2023.09.28</td>
                </tr>
                <tr>
                  <td className="py-3 text-xs font-mono text-[#00F0FF]">#ORB-980</td>
                  <td className="py-3 text-sm text-gray-300">Debris Avoidance Ma.</td>
                  <td className="py-3">
                    <span className="border border-[#FFB000]/30 text-[#FFB000] bg-[#FFB000]/10 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB000] mr-1.5"></span> Anomaly
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono text-gray-500 text-right">2023.09.15</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
