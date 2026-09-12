import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, ShieldAlert, MonitorPlay, Smartphone, Settings, Clock, ArrowRight, Satellite } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-gray-200 font-sans pb-12">
      {/* Navbar */}
      <nav className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0A0F1F] sticky top-0 z-50">
        <div className="flex items-center space-x-3 text-[#00F0FF]">
          <Satellite size={24} />
          <span className="text-xl font-bold tracking-wider">OrbitalX</span>
        </div>
        <div className="flex items-center space-x-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          <div className="flex items-center space-x-3 border-l border-gray-800 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">AUTH_LVL_{user.role === 'ADMIN' ? '9' : '5'}</p>
            </div>
            <div className="w-9 h-9 bg-[#121C36] rounded border border-[#00F0FF]/30 flex items-center justify-center overflow-hidden">
              {/* Dummy Avatar */}
              <div className="w-full h-full bg-gradient-to-tr from-[#00F0FF]/20 to-[#121C36] text-[#00F0FF] flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Operator Profile</h1>
            <p className="text-[#00F0FF] font-mono text-[11px] tracking-widest uppercase">
              SYS.TERMINAL.USER_CFG // ACTIVE
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-[#0A0F1F] border border-gray-800 px-4 py-2 rounded">
            <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"></div>
            <span className="font-mono text-xs text-gray-400">Uplink Stable</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (Narrow) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Card */}
            <div className="bg-transparent border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-8 flex flex-col items-center border-b border-gray-800 bg-[#0B1221]/50">
                <div className="w-32 h-32 rounded-xl bg-[#121C36] border-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)] mb-6 flex items-center justify-center overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=400&q=80')] bg-cover opacity-80 mix-blend-luminosity"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#00F0FF]/30 to-transparent"></div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
                <div className="bg-[#121C36] text-[#00F0FF] font-mono text-xs px-3 py-1.5 border border-[#00F0FF]/30">
                  {user.role === 'ADMIN' ? 'Mission Commander' : 'Flight Controller'}
                </div>
              </div>
              <div className="p-6 space-y-4 bg-[#0A0F1F] font-mono text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">ID</span>
                  <span className="text-gray-300 text-right">OP-{user._id.substring(0,6).toUpperCase()}-X</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Clearance</span>
                  <div className="flex items-center space-x-1 text-[#FFB000]">
                    <Lock size={14} />
                    <span>Level {user.role === 'ADMIN' ? '9' : '5'} ({user.role})</span>
                  </div>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500">Station</span>
                  <span className="text-gray-300 text-right">Ground Control 01</span>
                </div>
              </div>
            </div>

            {/* Security Subsystem Card */}
            <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center space-x-2 text-gray-400">
                <ShieldAlert size={16} />
                <h3 className="font-mono text-xs tracking-widest uppercase font-bold">Security Subsystem</h3>
              </div>
              <div className="p-6 space-y-6">
                
                <div className="flex justify-between items-center bg-[#0B1221] p-4 border border-gray-800 rounded">
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">Biometric 2FA</h4>
                    <p className="text-gray-500 text-xs font-mono">Retina + Fingerprint active</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_5px_#00FF66]"></div>
                    <span className="text-[#00FF66] text-xs font-mono">Enabled</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-gray-400 text-xs font-mono tracking-widest uppercase mb-4">Active Uplink Sessions</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-[#121C36]/50 border border-gray-700 rounded p-4 flex items-start space-x-3">
                      <MonitorPlay size={18} className="text-[#00F0FF] mt-0.5" />
                      <div className="flex-1">
                        <h5 className="text-white text-sm font-medium">Main Console Terminal</h5>
                        <p className="text-gray-500 text-xs font-mono mt-1">IP: 192.168.1.14 • Current Session</p>
                      </div>
                    </div>

                    <div className="bg-[#0B1221] border border-gray-800 rounded p-4 flex items-start space-x-3 group transition-colors hover:border-gray-700">
                      <Smartphone size={18} className="text-gray-500 mt-0.5 group-hover:text-gray-300" />
                      <div className="flex-1">
                        <h5 className="text-gray-300 text-sm font-medium">Remote Comm Pad</h5>
                        <p className="text-gray-600 text-xs font-mono mt-1">Last sync: 14 mins ago</p>
                      </div>
                      <button className="text-[#FF2A2A] text-[10px] font-mono tracking-wider uppercase border border-[#FF2A2A]/30 px-2 py-1 rounded hover:bg-[#FF2A2A]/10 transition-colors">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={logout}
                  className="w-full mt-4 text-[#FF2A2A] text-xs font-mono tracking-wider uppercase border border-[#FF2A2A]/30 py-3 rounded hover:bg-[#FF2A2A]/10 transition-colors"
                >
                  Terminate Current Session
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Wide) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Config Parameters Form */}
            <div className="bg-transparent border border-gray-800 rounded-lg">
               <div className="p-4 border-b border-gray-800 flex items-center space-x-2 text-[#00F0FF]">
                <Settings size={16} />
                <h3 className="font-mono text-xs tracking-widest uppercase font-bold text-[#00F0FF]">Configuration Parameters</h3>
              </div>
              <div className="p-8 bg-[#0A0F1F]">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">
                        Comms Identifier (Email)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-600 font-mono">@</span>
                        <input 
                          type="email" 
                          disabled
                          defaultValue={user.email}
                          className="w-full bg-[#E5E7EB] border border-transparent text-gray-900 font-mono p-2.5 pl-8 focus:outline-none opacity-90 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">
                        Current Access Key
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock size={14}/></span>
                        <input 
                          type="password" 
                          defaultValue="••••••••••••"
                          disabled
                          className="w-full bg-[#E5E7EB] border border-transparent text-gray-900 font-mono p-2.5 pl-8 focus:outline-none opacity-90 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">
                        Secure Line (Phone)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-mono">📞</span>
                        <input 
                          type="text" 
                          defaultValue="+1 (555) 019-8372"
                          className="w-full bg-[#E5E7EB] border border-transparent text-gray-900 font-mono p-2.5 pl-8 focus:outline-none opacity-90"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">
                        New Access Key
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock size={14}/></span>
                        <input 
                          type="password" 
                          placeholder="Generate new key..."
                          className="w-full bg-[#E5E7EB] border border-transparent text-gray-900 font-mono p-2.5 pl-8 focus:outline-none opacity-90"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" className="border border-gray-600 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-6 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors">
                      Reset Form
                    </button>
                    <button type="button" className="bg-[#00F0FF] hover:bg-white text-[#0A0F1F] font-bold px-6 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                      Transmit Updates
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Mission Logs Table */}
            <div className="bg-[#0A0F1F] border border-gray-800 rounded-lg overflow-hidden">
               <div className="p-4 flex items-center justify-between border-b border-gray-800">
                 <div className="flex items-center space-x-2 text-gray-400">
                  <Clock size={16} />
                  <h3 className="font-mono text-xs tracking-widest uppercase font-bold text-gray-300">Recent Mission Logs</h3>
                 </div>
                 <button className="text-[#00F0FF] text-[10px] font-mono tracking-widest uppercase hover:underline flex items-center space-x-1">
                   <span>Full Archive</span>
                   <ArrowRight size={12} />
                 </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono text-gray-400">
                  <thead className="bg-[#0B1221] text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Mission ID</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Designation</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Role</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Date (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50 bg-[#0A0F1F]">
                    
                    <tr className="hover:bg-[#121C36]/30 transition-colors">
                      <td className="px-6 py-4 text-[#00F0FF]">#ORB-992</td>
                      <td className="px-6 py-4 text-gray-300">Sat-Deploy Vanguard</td>
                      <td className="px-6 py-4">Lead Cmdr</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          <span className="w-1 h-1 bg-[#00FF66] rounded-full"></span>
                          <span>Success</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">2023.10.14</td>
                    </tr>

                    <tr className="hover:bg-[#121C36]/30 transition-colors">
                      <td className="px-6 py-4 text-[#00F0FF]">#LUN-441</td>
                      <td className="px-6 py-4 text-gray-300">Lunar Relay Maint.</td>
                      <td className="px-6 py-4">Observer</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          <span className="w-1 h-1 bg-[#00FF66] rounded-full"></span>
                          <span>Success</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">2023.09.28</td>
                    </tr>

                    <tr className="hover:bg-[#121C36]/30 transition-colors">
                      <td className="px-6 py-4 text-[#00F0FF]">#ORB-980</td>
                      <td className="px-6 py-4 text-gray-300">Debris Avoidance Ma.</td>
                      <td className="px-6 py-4">Lead Cmdr</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 border border-[#FFB000]/30 text-[#FFB000] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          <span className="w-1 h-1 bg-[#FFB000] rounded-full"></span>
                          <span>Anomaly</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">2023.09.15</td>
                    </tr>

                    <tr className="hover:bg-[#121C36]/30 transition-colors">
                      <td className="px-6 py-4 text-[#00F0FF]">#DEE-102</td>
                      <td className="px-6 py-4 text-gray-300">Deep Space Probe Init</td>
                      <td className="px-6 py-4">Telemetry Auth</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1.5 border border-[#00FF66]/30 text-[#00FF66] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          <span className="w-1 h-1 bg-[#00FF66] rounded-full"></span>
                          <span>Success</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">2023.08.02</td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
