import React, { useState, useEffect, useRef } from 'react';
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
  RadioTower,
  CheckCheck,
  X,
  Menu,
  ExternalLink,
  Cpu
} from 'lucide-react';
import api from '../../lib/apiClient';
import { adminService } from '../../services/adminService';
import notificationService from '../../services/notificationService';

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [time, setTime] = useState(new Date().toISOString().substr(11, 8));
  const [sysStatus, setSysStatus] = useState({ api: true, sim: true });
  
  // Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const notifRef = useRef(null);
  const lastCountRef = useRef(null);

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer and reset window scroll on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [location.pathname]);

  const fetchNotificationData = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getAll({ limit: 6 })
      ]);
      const newCount = countRes.count || 0;
      setUnreadCount(newCount);
      const items = listRes.data || [];
      setRecentNotifs(items);

      // Trigger toast banner if count increased
      if (lastCountRef.current !== null && newCount > lastCountRef.current && items.length > 0) {
        const latest = items[0];
        if (!latest.read) {
          setActiveToast(latest);
          setTimeout(() => {
            setActiveToast(prev => (prev?._id === latest._id ? null : prev));
          }, 6000);
        }
      }
      lastCountRef.current = newCount;
    } catch (err) {
      // ignore network glitch on polling
    }
  };

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

    // Initial notification fetch and interval polling
    fetchNotificationData();
    const notifTimer = setInterval(fetchNotificationData, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
      clearInterval(notifTimer);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead();
      setUnreadCount(0);
      setRecentNotifs(prev => prev.map(n => ({ ...n, read: true })));
      lastCountRef.current = 0;
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead([], notif._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setRecentNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        if (lastCountRef.current) lastCountRef.current = Math.max(0, lastCountRef.current - 1);
      } catch (err) {
        console.error('Failed to mark notification read', err);
      }
    }
  };

  const getNotifIcon = (type = '', title = '') => {
    const t = (title + ' ' + type).toLowerCase();
    if (t.includes('alert') || t.includes('storm') || t.includes('radiation') || t.includes('thermal') || t.includes('temp') || t.includes('hazard')) {
      return <AlertTriangle size={15} className="text-[#FF2A2A]" />;
    }
    if (t.includes('comm') || t.includes('signal') || t.includes('link') || t.includes('ground') || t.includes('uplink') || t.includes('downlink')) {
      return <Radio size={15} className="text-[#00F0FF]" />;
    }
    return <TerminalSquare size={15} className="text-[#00FF66]" />;
  };

  const navItems = [
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
        <header className="h-16 bg-[#0A0F1F] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
          
          {/* Status Indicators & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3 sm:space-x-6 text-[10px] font-mono tracking-widest uppercase">
            {/* Mobile Navigation Toggle (visible on screens < md) */}
            <button
              id="mobile-nav-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-gray-300 hover:text-white rounded border border-gray-800 hover:border-gray-700 bg-[#121C36] flex items-center justify-center transition-colors"
              title="Toggle Navigation Menu"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} className="text-[#00F0FF]" /> : <Menu size={18} />}
            </button>

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
              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={notifRef}>
                <button 
                  id="header-notification-bell"
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    fetchNotificationData();
                  }}
                  className={`relative p-2 rounded transition-colors border ${
                    isNotifOpen 
                      ? 'bg-[#121C36] text-[#00F0FF] border-[#00F0FF]/40' 
                      : 'text-gray-400 hover:text-white border-transparent hover:border-gray-800'
                  }`}
                  title="Notifications & Live Alerts"
                  aria-label="Open notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span 
                      id="header-unread-badge"
                      className="absolute -top-1 -right-1 bg-[#FF2A2A] text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ring-2 ring-[#0A0F1F] animate-pulse"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isNotifOpen && (
                  <div 
                    id="header-notification-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1221] border border-gray-700/90 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 bg-[#070C18] border-b border-gray-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
                        <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                          NOTIFICATIONS
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-[#FF2A2A]/20 text-[#FF2A2A] border border-[#FF2A2A]/40 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          id="dropdown-mark-all-read-btn"
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-mono tracking-wider text-[#00F0FF] hover:text-white hover:underline flex items-center space-x-1 transition-colors"
                        >
                          <CheckCheck size={12} />
                          <span>MARK ALL READ</span>
                        </button>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                      {recentNotifs.length === 0 ? (
                        <div className="p-6 text-center text-xs font-mono text-gray-500">
                          NO NOTIFICATIONS IN QUEUE
                        </div>
                      ) : (
                        recentNotifs.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleItemClick(notif)}
                            className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                              notif.read 
                                ? 'bg-transparent hover:bg-[#121C36]/40 opacity-75' 
                                : 'bg-[#121C36]/70 hover:bg-[#121C36] border-l-2 border-[#00F0FF]'
                            }`}
                          >
                            <div className="p-2 bg-[#050810] border border-gray-800 rounded shrink-0 mt-0.5">
                              {getNotifIcon(notif.type, notif.title)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-mono font-semibold truncate ${
                                  notif.read ? 'text-gray-400' : 'text-white'
                                }`}>
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 font-sans line-clamp-2 mt-0.5 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[9px] font-mono text-gray-500 tracking-wider mt-1 block">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer Link to Notification Center */}
                    <div className="p-2.5 bg-[#070C18] border-t border-gray-800 text-center">
                      <NavLink
                        to="/notifications"
                        onClick={() => setIsNotifOpen(false)}
                        className="inline-flex items-center space-x-1.5 text-xs font-mono tracking-widest text-[#00F0FF] hover:text-white transition-colors"
                      >
                        <span>VIEW NOTIFICATION CENTER</span>
                        <ExternalLink size={12} />
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>

              <button className="text-gray-400 hover:text-white transition-colors p-2">
                <User size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Realtime In-App Notification Toast */}
        {activeToast && (
          <div 
            id="live-notification-toast"
            className="fixed top-20 right-6 max-w-sm w-full bg-[#0B1221]/95 border border-[#00F0FF]/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] rounded-lg p-4 z-50 backdrop-blur-md animate-in slide-in-from-top-4 duration-300"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-[#050810] border border-[#00F0FF]/30 rounded text-[#00F0FF] shrink-0">
                {getNotifIcon(activeToast.type, activeToast.title)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                    {activeToast.type || 'SYSTEM ALERT'}
                  </span>
                  <button 
                    onClick={() => setActiveToast(null)}
                    className="text-gray-500 hover:text-white transition-colors ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h4 className="text-xs font-mono font-semibold text-white mt-1 truncate">
                  {activeToast.title}
                </h4>
                <p className="text-[11px] text-gray-300 font-sans mt-0.5 line-clamp-2">
                  {activeToast.message}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-gray-500">JUST NOW</span>
                  <NavLink
                    to="/notifications"
                    onClick={() => setActiveToast(null)}
                    className="text-[10px] font-mono text-[#00F0FF] hover:underline"
                  >
                    OPEN CENTER →
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <main className={`flex-1 relative ${
          ['/studio', '/cubesat-sim', '/orbit'].includes(location.pathname)
            ? 'overflow-hidden p-0'
            : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
        }`}>
          {/* Subtle background glow for depth */}
          <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#00F0FF]/5 to-transparent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
          
          <div className={`relative z-10 mx-auto ${
            ['/studio', '/cubesat-sim', '/orbit'].includes(location.pathname) ? 'h-full w-full max-w-full' : 'max-w-[1400px]'
          }`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Visible when hamburger clicked on mobile/narrow windows) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0A0F1F] border-r border-gray-800 flex flex-col justify-between h-full z-10 p-4 overflow-y-auto shadow-2xl">
            <div>
              <div className="h-12 flex items-center justify-between px-2 mb-4 border-b border-gray-800 pb-2">
                <span className="text-xl font-bold tracking-wider text-[#00F0FF]">ORBITAL-X</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded border border-gray-800"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
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
            </div>
            
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <NavLink 
                to="/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3.5 py-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider"
              >
                <Settings size={14} className="mr-3" /> Settings
              </NavLink>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
