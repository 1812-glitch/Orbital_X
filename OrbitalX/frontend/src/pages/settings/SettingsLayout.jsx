import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Sliders, Shield, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Profile', path: '/settings/profile', icon: <User size={16} /> },
    { name: 'Preferences', path: '/settings/preferences', icon: <Sliders size={16} /> },
    { name: 'Security', path: '/settings/security', icon: <Shield size={16} /> },
    { name: 'System Health', path: '/settings/diagnostics', icon: <Activity size={16} /> },
  ];

  return (
    <div className="flex h-full -m-6 lg:-m-8 animate-in fade-in duration-500">
      
      {/* Settings Sub-Sidebar */}
      <div className="w-64 border-r border-gray-800 bg-[#0A0F1F] flex flex-col justify-between shrink-0">
        
        <div>
          {/* Operator Info block */}
          <div className="p-6 border-b border-gray-800 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full border border-gray-700 bg-[#121C36] flex items-center justify-center text-[#00F0FF] font-bold">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div>
              <p className="text-white font-bold text-sm truncate">{user?.name}</p>
              <p className="text-[#00F0FF] font-mono text-[10px] tracking-widest uppercase truncate">{user?.role} CLEARANCE</p>
            </div>
          </div>

          <nav className="mt-4 px-2 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded font-mono text-xs tracking-widest uppercase transition-colors ${
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
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex justify-between items-center px-2 py-1">
            <NavLink to="/support" className="text-gray-400 hover:text-[#00F0FF] text-[11px] font-mono tracking-widest transition-colors flex items-center">
              Support
            </NavLink>
            <button onClick={handleLogout} className="text-[#FF2A2A] hover:text-red-400 flex items-center text-[11px] font-mono tracking-widest transition-colors">
              <LogOut size={12} className="mr-1" />
              Sign Out
            </button>
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#0B1221]">
        <div className="max-w-[1000px] mx-auto">
          <Outlet />
        </div>
      </div>

    </div>
  );
}
