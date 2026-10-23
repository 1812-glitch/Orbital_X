import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Menu, 
  X, 
  Satellite, 
  ChevronDown, 
  Search, 
  Eye, 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  User,
  Undo2
} from 'lucide-react';

const HeaderClock = React.memo(function HeaderClock() {
  const [time, setTime] = useState(() => new Date().toISOString().substr(11, 8));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toISOString().substr(11, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#121C36] border border-gray-800 px-4 py-1.5 rounded text-xs font-mono tracking-widest text-gray-300">
      SYSTEM TIME: {time} UTC
    </div>
  );
});

export default function DashboardHeader({
  sidebarOpen,
  toggleSidebar,
  mobileMenuOpen,
  setMobileMenuOpen,
  sysStatus,
  satDropdownRef,
  isSatDropdownOpen,
  setIsSatDropdownOpen,
  selectedSatellite,
  openDetailModal,
  satellites,
  satSearch,
  setSatSearch,
  selectSatellite,
  notifRef,
  isNotifOpen,
  setIsNotifOpen,
  fetchNotificationData,
  unreadCount,
  handleMarkAllRead,
  recentNotifs,
  handleItemClick,
  getNotifIcon
}) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="h-16 bg-[#0A0F1F] border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-40">
      {/* Status Indicators & Mobile/Desktop Nav Toggles */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 text-[10px] font-mono tracking-widest uppercase">
        {/* Global Undo / Back Navigation Button */}
        <button
          id="global-undo-btn"
          type="button"
          onClick={handleGoBack}
          className="p-1.5 flex items-center justify-center space-x-1.5 rounded-lg border border-gray-800 hover:border-[#00F0FF] bg-[#121C36] hover:bg-[#00F0FF]/15 text-gray-300 hover:text-[#00F0FF] transition-all shadow-sm group"
          title="Undo: Return to most immediate recently opened page"
          aria-label="Undo to previous page"
        >
          <Undo2 size={16} className="text-[#00F0FF] group-hover:-rotate-45 transition-transform duration-200" />
          <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-wider text-gray-400 group-hover:text-[#00F0FF]">
            UNDO
          </span>
        </button>

        <button
          id="desktop-sidebar-toggle-btn"
          onClick={toggleSidebar}
          className={`p-1.5 hidden md:flex items-center justify-center rounded-lg border transition-all ${
            !sidebarOpen 
              ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)] hover:bg-[#00F0FF]/25' 
              : 'bg-[#121C36] border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white'
          }`}
          title={sidebarOpen ? "Close Left Navigation Panel" : "Open Left Navigation Panel"}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

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

      {/* Ubiquitous Satellite Quick Selector */}
      <div className="relative mx-2 sm:mx-4" ref={satDropdownRef}>
        <button
          id="header-satellite-selector-btn"
          onClick={() => setIsSatDropdownOpen(!isSatDropdownOpen)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all shadow-sm ${
            isSatDropdownOpen
              ? 'bg-[#121C36] border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'bg-[#121C36]/80 hover:bg-[#121C36] border-gray-700 hover:border-[#00F0FF]/50 text-gray-200'
          }`}
          title="Select Active Satellite"
        >
          <div className="flex items-center space-x-1.5">
            <Satellite size={14} className="text-[#00F0FF]" />
            <span className="font-bold tracking-wider text-white">
              {selectedSatellite?.name || 'SELECT SATELLITE'}
            </span>
            {selectedSatellite && (
              <span className="text-[10px] text-[#00FF66] font-semibold hidden md:inline px-1.5 py-0.2 bg-[#00FF66]/10 rounded border border-[#00FF66]/20">
                {selectedSatellite.orbitType || 'LEO'}
              </span>
            )}
          </div>
          <ChevronDown size={13} className={`text-gray-400 transition-transform ${isSatDropdownOpen ? 'rotate-180 text-[#00F0FF]' : ''}`} />
        </button>

        {isSatDropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 sm:w-80 bg-[#0B1221] border border-gray-700 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden backdrop-blur-md animate-in fade-in duration-150">
            <div className="p-2.5 bg-[#070C18] border-b border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                <span>ACTIVE ASSETS ({satellites.length})</span>
                {selectedSatellite && (
                  <button
                    id="inspect-active-satellite-btn"
                    onClick={() => {
                      setIsSatDropdownOpen(false);
                      openDetailModal(selectedSatellite);
                    }}
                    className="text-[#00F0FF] hover:underline flex items-center space-x-1"
                  >
                    <Eye size={11} />
                    <span>INSPECT ACTIVE</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or orbit..."
                  value={satSearch}
                  onChange={(e) => setSatSearch(e.target.value)}
                  className="w-full bg-[#050810] border border-gray-800 rounded pl-7 pr-3 py-1 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/60"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/60 p-1">
              {satellites
                .filter((s) => 
                  (s.name || '').toLowerCase().includes(satSearch.toLowerCase()) ||
                  (s.satelliteId || '').toLowerCase().includes(satSearch.toLowerCase()) ||
                  (s.orbitType || '').toLowerCase().includes(satSearch.toLowerCase())
                )
                .map((s) => {
                  const isSelected = selectedSatellite?._id === s._id || selectedSatellite?.satelliteId === s.satelliteId;
                  return (
                    <div
                      key={s._id || s.satelliteId}
                      onClick={() => {
                        selectSatellite(s);
                        setIsSatDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-l-2 border-[#00F0FF]'
                          : 'hover:bg-[#121C36]/80 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          s.status === 'CRITICAL' ? 'bg-[#FF2A2A]' :
                          s.status === 'WARNING' ? 'bg-[#FFB000]' :
                          'bg-[#00FF66]'
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-[#00F0FF]' : 'text-white'}`}>
                              {s.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              {s.satelliteId}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 uppercase">
                            {s.orbitType || 'LEO'} • {s.status || 'NOMINAL'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSatDropdownOpen(false);
                          openDetailModal(s);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#00F0FF] hover:bg-gray-800 rounded transition-colors ml-2"
                        title={`Inspect ${s.name} Details`}
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        <HeaderClock />
        <div className="flex items-center space-x-4">
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

            {isNotifOpen && (
              <div 
                id="header-notification-dropdown"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1221] border border-gray-700/90 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              >
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
  );
}
