import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Satellite, 
  Globe2, 
  Activity, 
  TerminalSquare,
  AlertTriangle,
  Settings,
  HelpCircle,
  Bell,
  User,
  Shield,
  ShieldAlert,
  PieChart,
  FileBarChart,
  Boxes,
  Radio,
  RadioTower
} from 'lucide-react';
import api from '../../lib/apiClient';
import { adminService } from '../../services/adminService';

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date().toISOString().substr(11, 8));
  const [sysStatus, setSysStatus] = useState({ api: true, sim: true });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString().substr(11, 8));
    }, 1000);

    const checkStatus = async () => {
      try {
        await api.get('/health');
        const sim = await adminService.getSimulationStatus();
        setSysStatus({ api: true, sim: sim.data?.isRunning ?? true });
      } catch (err) {
        setSysStatus({ api: false, sim: false });
      }
    };
    checkStatus();
    const statusTimer = setInterval(checkStatus, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Satellites', path: '/satellites', icon: <Satellite size={18} /> },
    { name: 'Orbital Viewer', path: '/orbit', icon: <Globe2 size={18} /> },
    { name: '3D Studio', path: '/studio', icon: <Boxes size={18} /> },
    { name: 'Telemetry', path: '/telemetry', icon: <Activity size={18} /> },
    { name: 'Mission Control', path: '/missions', icon: <TerminalSquare size={18} /> },
    { name: 'Communications', path: '/communications', icon: <Radio size={18} /> },
    { name: 'Ground Stations', path: '/ground-stations', icon: <RadioTower size={18} /> },
    { name: 'Alerts', path: '/alerts', icon: <ShieldAlert size={18} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
    { name: 'Fleet Analytics', path: '/analytics', icon: <PieChart size={18} /> },
    { name: 'Reports', path: '/reports', icon: <FileBarChart size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#0A0F1F] text-gray-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0F1F] border-r border-gray-800 flex flex-col justify-between hidden md:flex shrink-0 relative z-20">
        
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6">
            <span className="text-xl font-bold tracking-wider text-[#00F0FF]">ORBITAL-X</span>
          </div>

          {/* Nav Links */}
          <nav className="mt-8 px-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded font-mono text-sm tracking-wider transition-colors ${
                    isActive || (item.name === 'Overview' && location.pathname === '/dashboard') || (item.name === 'Satellites' && location.pathname.includes('/satellites')) || (item.name === 'Orbital Viewer' && location.pathname === '/orbit')
                      ? 'bg-gradient-to-r from-[#00F0FF]/20 to-transparent text-[#00F0FF] border-l-2 border-[#00F0FF]'
                      : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                  }`
                }
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Admin Section */}
          {user?.role === 'ADMIN' && (
            <div className="mt-8">
              <div className="px-6 mb-2 flex items-center space-x-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                <Shield size={12} className="text-[#FF2A2A]" />
                <span>Admin Hub</span>
              </div>
              <nav className="px-4 space-y-1">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded font-mono text-xs tracking-wider transition-colors ${
                      isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                    }`
                  }
                >
                  <Shield size={16} className="mr-3" /> Admin Console
                </NavLink>
                <NavLink
                  to="/admin/logs"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded font-mono text-xs tracking-wider transition-colors ${
                      isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                    }`
                  }
                >
                  <TerminalSquare size={16} className="mr-3" /> Activity Logs
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-4">
          <button className="w-full flex items-center justify-center space-x-2 border border-[#FF2A2A]/50 bg-[#FF2A2A]/5 hover:bg-[#FF2A2A]/10 text-[#FF2A2A] text-xs font-mono font-bold tracking-widest px-4 py-3 rounded transition-colors">
            <AlertTriangle size={14} />
            <span>EMERGENCY OVERRIDE</span>
          </button>

          <div className="space-y-1">
            <NavLink to="/settings" className="flex items-center px-4 py-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider transition-colors">
              <Settings size={14} className="mr-3" /> Settings
            </NavLink>
            <NavLink to="/support" className="flex items-center px-4 py-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider transition-colors">
              <HelpCircle size={14} className="mr-3" /> Support
            </NavLink>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-800 flex items-center px-2">
            <div className="w-8 h-8 rounded-full bg-[#121C36] flex items-center justify-center text-[#00F0FF] font-bold text-xs border border-[#00F0FF]/30">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="ml-3">
              <p className="text-xs font-bold text-white">{user?.name || 'Operator 09'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-[#0A0F1F] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 relative z-10">
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-6 text-[10px] font-mono tracking-widest uppercase">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${sysStatus.sim ? 'bg-[#00FF66] shadow-[0_0_5px_#00FF66]' : 'bg-[#FF2A2A] shadow-[0_0_5px_#FF2A2A]'}`}></div>
              <span className={sysStatus.sim ? 'text-[#00FF66]' : 'text-[#FF2A2A]'}>
                SIMULATION: {sysStatus.sim ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${sysStatus.api ? 'bg-[#00F0FF] shadow-[0_0_5px_#00F0FF]' : 'bg-[#FF2A2A] shadow-[0_0_5px_#FF2A2A]'}`}></div>
              <span className={sysStatus.api ? 'text-gray-400' : 'text-[#FF2A2A]'}>
                UPLINK: {sysStatus.api ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            <div className="bg-[#121C36] border border-gray-800 px-4 py-1.5 rounded text-xs font-mono tracking-widest text-gray-300">
              SYSTEM TIME: {time} UTC
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Bell size={18} />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <User size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
          {/* Subtle background glow for depth */}
          <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#00F0FF]/5 to-transparent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
          
          <div className="relative z-10 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
