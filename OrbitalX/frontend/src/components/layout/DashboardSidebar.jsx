import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Satellite, 
  Globe2, 
  Boxes, 
  Cpu, 
  Activity, 
  TerminalSquare, 
  Radio, 
  RadioTower, 
  ShieldAlert, 
  Bell, 
  PieChart, 
  PanelLeftClose, 
  Shield, 
  Settings, 
  HelpCircle,
  X 
} from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { name: 'Satellites', path: '/satellites', icon: <Satellite size={18} /> },
  { name: 'Orbital Viewer', path: '/orbit', icon: <Globe2 size={18} /> },
  { name: '3D Studio', path: '/studio', icon: <Boxes size={18} /> },
  { name: 'CubeSat Simulator', path: '/cubesat-sim', icon: <Cpu size={18} /> },
  { name: 'Telemetry', path: '/telemetry', icon: <Activity size={18} /> },
  { name: 'Mission Control', path: '/missions', icon: <TerminalSquare size={18} /> },
  { name: 'Communications', path: '/communications', icon: <Radio size={18} /> },
  { name: 'Ground Stations', path: '/ground-stations', icon: <RadioTower size={18} /> },
  { name: 'Alerts', path: '/alerts', icon: <ShieldAlert size={18} /> },
  { name: 'Notifications', path: '/notifications', icon: <Bell size={18} /> },
  { name: 'Fleet Analytics', path: '/analytics', icon: <PieChart size={18} /> },
];

export default function DashboardSidebar({
  sidebarOpen,
  toggleSidebar,
  user,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const location = useLocation();

  return (
    <>
      {/* Sidebar (Desktop Collapsible) */}
      <aside 
        className={`bg-[#0A0F1F] border-r border-gray-800 flex flex-col h-full hidden md:flex shrink-0 relative z-20 overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64 opacity-100' : 'w-0 border-r-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header: Logo & Close Button Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800/60 shrink-0 w-64 min-w-[16rem]">
          <span className="text-xl font-bold tracking-wider text-[#00F0FF]">ORBITAL-X</span>
          <button
            id="sidebar-close-btn"
            onClick={toggleSidebar}
            className="p-1.5 text-gray-400 hover:text-[#00F0FF] hover:bg-[#121C36] rounded-lg transition-colors cursor-pointer"
            title="Close Left Navigation Panel"
            aria-label="Close Left Navigation Panel"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Scrollable Navigation & Content Above Profile */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar w-64 min-w-[16rem] py-4 space-y-6">
          {/* Main Nav Links */}
          <nav className="px-4 space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 rounded font-mono text-sm tracking-wider transition-colors ${
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
            <div>
              <div className="px-6 mb-2 flex items-center space-x-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                <Shield size={12} className="text-[#FF2A2A]" />
                <span>Admin Hub</span>
              </div>
              <nav className="px-4 space-y-1">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                      isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                    }`
                  }
                >
                  <Shield size={16} className="mr-3" /> Admin Console
                </NavLink>
                <NavLink
                  to="/admin/logs"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                      isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                    }`
                  }
                >
                  <TerminalSquare size={16} className="mr-3" /> Activity Logs
                </NavLink>
              </nav>
            </div>
          )}

          {/* System Links (Settings & Support) */}
          <div className="pt-3 border-t border-gray-800/60">
            <div className="px-6 mb-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
              <span>System</span>
            </div>
            <nav className="px-4 space-y-1">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                    isActive
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-l-2 border-[#00F0FF]'
                      : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                  }`
                }
              >
                <Settings size={15} className="mr-3" /> Settings
              </NavLink>
              <NavLink
                to="/support"
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                    isActive
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-l-2 border-[#00F0FF]'
                      : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                  }`
                }
              >
                <HelpCircle size={15} className="mr-3" /> Support
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Pinned Bottom Profile Area - stays static at bottom left */}
        <div className="p-3 border-t border-gray-800 bg-[#0A0F1F] shrink-0 w-64 min-w-[16rem]">
          <NavLink
            to="/settings/profile"
            className="flex items-center p-2 rounded-lg hover:bg-[#121C36]/70 transition-colors group"
            title="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#121C36] flex items-center justify-center text-[#00F0FF] font-bold text-xs border border-[#00F0FF]/30 shrink-0 group-hover:border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#00F0FF] transition-colors">
                {user?.name || 'Operator 09'}
              </p>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider truncate">
                {user?.role || 'Operator'}
              </p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Mobile Drawer (Visible when hamburger clicked on mobile/narrow windows) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0A0F1F] border-r border-gray-800 flex flex-col justify-between h-full z-10 overflow-hidden shadow-2xl">
            {/* Mobile Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
              <span className="text-xl font-bold tracking-wider text-[#00F0FF]">ORBITAL-X</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded border border-gray-800"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-6">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2.5 rounded font-mono text-sm tracking-wider transition-colors ${
                        isActive
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

              {user?.role === 'ADMIN' && (
                <div>
                  <div className="px-3.5 mb-2 flex items-center space-x-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                    <Shield size={12} className="text-[#FF2A2A]" />
                    <span>Admin Hub</span>
                  </div>
                  <nav className="space-y-1">
                    <NavLink
                      to="/admin"
                      end
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3.5 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                          isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                        }`
                      }
                    >
                      <Shield size={15} className="mr-3" /> Admin Console
                    </NavLink>
                    <NavLink
                      to="/admin/logs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-3.5 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                          isActive ? 'bg-[#FF2A2A]/10 text-[#FF2A2A] border-l-2 border-[#FF2A2A]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                        }`
                      }
                    >
                      <TerminalSquare size={15} className="mr-3" /> Activity Logs
                    </NavLink>
                  </nav>
                </div>
              )}

              <div className="pt-2 border-t border-gray-800/60">
                <div className="px-3.5 mb-2 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                  <span>System</span>
                </div>
                <nav className="space-y-1">
                  <NavLink 
                    to="/settings" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                        isActive ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-l-2 border-[#00F0FF]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                      }`
                    }
                  >
                    <Settings size={14} className="mr-3" /> Settings
                  </NavLink>
                  <NavLink 
                    to="/support" 
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2 rounded font-mono text-xs tracking-wider transition-colors ${
                        isActive ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-l-2 border-[#00F0FF]' : 'text-gray-400 hover:text-white hover:bg-[#121C36]/50 border-l-2 border-transparent'
                      }`
                    }
                  >
                    <HelpCircle size={14} className="mr-3" /> Support
                  </NavLink>
                </nav>
              </div>
            </div>

            {/* Mobile Pinned Profile */}
            <div className="p-3 border-t border-gray-800 bg-[#0A0F1F] shrink-0">
              <NavLink
                to="/settings/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center p-2 rounded-lg hover:bg-[#121C36]/70 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#121C36] flex items-center justify-center text-[#00F0FF] font-bold text-xs border border-[#00F0FF]/30 shrink-0">
                  {user?.name?.charAt(0) || 'O'}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Operator 09'}</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider truncate">{user?.role || 'Operator'}</p>
                </div>
              </NavLink>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
