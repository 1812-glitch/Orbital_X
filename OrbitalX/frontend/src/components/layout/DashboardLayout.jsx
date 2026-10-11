import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle,
  Radio,
  TerminalSquare
} from 'lucide-react';
import api from '../../lib/apiClient';
import { adminService } from '../../services/adminService';
import notificationService from '../../services/notificationService';
import { useSatellite } from '../../context/SatelliteContext';
import SatelliteDetailModal from '../satellites/SatelliteDetailModal';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import DashboardToast from './DashboardToast';

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sysStatus, setSysStatus] = useState({ api: true, sim: true });

  // Closable Sidebar State (Desktop)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('orbital_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('orbital_sidebar_open', String(next));
      return next;
    });
  };

  // Notification states
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const notifRef = useRef(null);
  const lastCountRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Satellite Context & Dropdown State
  const { satellites, selectedSatellite, selectSatellite, openDetailModal } = useSatellite();
  const [isSatDropdownOpen, setIsSatDropdownOpen] = useState(false);
  const [satSearch, setSatSearch] = useState('');
  const satDropdownRef = useRef(null);

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
    const statusTimer = setInterval(checkStatus, 15000);

    fetchNotificationData();
    const notifTimer = setInterval(fetchNotificationData, 10000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(notifTimer);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (satDropdownRef.current && !satDropdownRef.current.contains(event.target)) {
        setIsSatDropdownOpen(false);
      }
    };
    if (isNotifOpen || isSatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen, isSatDropdownOpen]);

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
    if (t.includes('alert') || t.includes('storm') || t.includes('radiation') || t.includes('thermal') || t.includes('temp') || t.hazard) {
      return <AlertTriangle size={15} className="text-[#FF2A2A]" />;
    }
    if (t.includes('comm') || t.includes('signal') || t.includes('link') || t.includes('ground') || t.includes('uplink') || t.includes('downlink')) {
      return <Radio size={15} className="text-[#00F0FF]" />;
    }
    return <TerminalSquare size={15} className="text-[#00FF66]" />;
  };

  return (
    <div className="flex h-screen bg-[#0A0F1F] text-gray-200 font-sans overflow-hidden">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          sysStatus={sysStatus}
          satDropdownRef={satDropdownRef}
          isSatDropdownOpen={isSatDropdownOpen}
          setIsSatDropdownOpen={setIsSatDropdownOpen}
          selectedSatellite={selectedSatellite}
          openDetailModal={openDetailModal}
          satellites={satellites}
          satSearch={satSearch}
          setSatSearch={setSatSearch}
          selectSatellite={selectSatellite}
          notifRef={notifRef}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          fetchNotificationData={fetchNotificationData}
          unreadCount={unreadCount}
          handleMarkAllRead={handleMarkAllRead}
          recentNotifs={recentNotifs}
          handleItemClick={handleItemClick}
          getNotifIcon={getNotifIcon}
        />

        <DashboardToast
          activeToast={activeToast}
          setActiveToast={setActiveToast}
          getNotifIcon={getNotifIcon}
        />

        <main className={`flex-1 relative z-0 ${
          ['/studio', '/cubesat-sim', '/orbit'].includes(location.pathname)
            ? 'overflow-hidden p-0'
            : ['/communications', '/ground-stations'].includes(location.pathname)
            ? 'overflow-y-auto p-2 sm:p-3 md:p-4'
            : 'overflow-y-auto p-4 sm:p-6 lg:p-8'
        }`}>
          <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#00F0FF]/5 to-transparent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>
          
          <div className={`relative z-10 mx-auto ${
            ['/studio', '/cubesat-sim', '/orbit'].includes(location.pathname) 
              ? 'h-full w-full max-w-full' 
              : ['/communications', '/ground-stations'].includes(location.pathname)
              ? 'w-full max-w-none'
              : 'max-w-[1400px]'
          }`}>
            <Outlet />
          </div>
        </main>
      </div>

      <SatelliteDetailModal />
    </div>
  );
}
