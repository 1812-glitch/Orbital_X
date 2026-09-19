import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Trash2, 
  AlertTriangle, 
  Zap, 
  WifiOff, 
  Bell, 
  Radio, 
  TerminalSquare, 
  PlusCircle, 
  CheckCheck,
  Filter,
  Layers,
  Satellite,
  Eye,
  Search
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useSatellite } from '../../context/SatelliteContext';
import { format, isToday, isYesterday } from 'date-fns';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ALERT, COMMS, SYSTEM
  const [satFilter, setSatFilter] = useState(null); // NULL by default: require selecting a CubeSat
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetFilterType, setFleetFilterType] = useState('ALL'); // ALL, ALERT, UNREAD, NOMINAL
  const [isTriggering, setIsTriggering] = useState(false);
  const { satellites, selectSatellite, openDetailModal } = useSatellite();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      setNotifications(res.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationService.markAsRead([], id);
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleDeleteSingle = async (id) => {
    try {
      await notificationService.clearAll(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const handleClear = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  const handleTriggerTestNotification = async () => {
    try {
      setIsTriggering(true);
      const testSamples = [
        {
          type: 'ALERT',
          title: 'MAGNETIC TORQUE ANOMALY',
          message: 'CubeSat Aero-6 ADCS magnetorquer axis Z exceeding rated current draw (142mA).'
        },
        {
          type: 'COMMS',
          title: 'S-BAND CARRIER LOCK ESTABLISHED',
          message: 'Canberra Complex (GS-004) telemetry lock confirmed with SAT-BETA-2 at 2.24 GHz.'
        },
        {
          type: 'SYSTEM',
          title: 'ORBITAL EPHEMERIS REFRESHED',
          message: 'High-precision two-line element set (TLE) updated for all 5 orbital assets.'
        },
        {
          type: 'ALERT',
          title: 'HIGH SOLAR FLUX ELEVATION',
          message: 'Space weather alert: Class C8.2 solar radiation event impacting LEO communications.'
        }
      ];
      const randomSample = testSamples[Math.floor(Math.random() * testSamples.length)];
      const res = await notificationService.create(randomSample);
      if (res.data) {
        setNotifications(prev => [res.data, ...prev]);
      }
    } catch (error) {
      console.error('Failed to trigger test notification', error);
    } finally {
      setIsTriggering(false);
    }
  };

  // Combine satellites from context or fallback list
  const fleetList = satellites.length > 0 ? satellites : [
    { _id: '1', satelliteId: 'SAT-001', name: 'ORION', type: 'CubeSat 3U', orbitType: 'LEO-POLAR' },
    { _id: '2', satelliteId: 'SAT-002', name: 'NOVA', type: 'CubeSat 6U', orbitType: 'MEO-EQ' },
    { _id: '3', satelliteId: 'SAT-003', name: 'AURORA', type: 'CubeSat 12U', orbitType: 'GEO-SYNC' },
    { _id: '4', satelliteId: 'SAT-004', name: 'VANGUARD', type: 'CubeSat 3U', orbitType: 'LEO-SSO' },
    { _id: '5', satelliteId: 'CUBE-01', name: 'ALPHA-SAT', type: 'CubeSat 1U', orbitType: 'LEO-500KM' },
    { _id: '6', satelliteId: 'SAT-BETA-2', name: 'BETA-2', type: 'CubeSat 6U', orbitType: 'MEO-EQ' }
  ];

  // Calculate per-satellite notification statistics
  const satNotifStats = fleetList.reduce((acc, sat) => {
    const satId = sat.satelliteId?.toLowerCase() || '';
    const satName = sat.name?.toLowerCase() || '';
    const key = sat._id || sat.satelliteId;

    let count = 0;
    let hasAlert = false;
    let unreadSatCount = 0;
    let latestNotif = null;

    notifications.forEach(n => {
      const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
      const directMatch = n.satelliteId && (n.satelliteId === sat._id || n.satelliteId === sat.satelliteId || n.satelliteId?.satelliteId === sat.satelliteId);
      const textMatch = (satId && text.includes(satId)) || (satName && text.includes(satName));
      if (directMatch || textMatch) {
        count += 1;
        if (n.type === 'ALERT') hasAlert = true;
        if (!n.read) unreadSatCount += 1;
        if (!latestNotif) latestNotif = n;
      }
    });

    acc[key] = { count, hasAlert, unreadSatCount, latestNotif };
    return acc;
  }, {});

  const activeSat = fleetList.find(s => s._id === satFilter || s.satelliteId === satFilter);
  const activeSatName = activeSat ? (activeSat.name ? `${activeSat.name} (${activeSat.satelliteId})` : activeSat.satelliteId) : satFilter;

  // Filter notifications specifically for the selected CubeSat
  const getFilteredNotifications = () => {
    if (!satFilter) return [];

    return notifications.filter(notif => {
      if (filter === 'UNREAD' && notif.read) return false;
      if (filter === 'ALERT' && notif.type !== 'ALERT') return false;
      if (filter === 'COMMS' && notif.type !== 'COMMS') return false;
      if (filter === 'SYSTEM' && notif.type !== 'SYSTEM') return false;

      const text = `${notif.title || ''} ${notif.message || ''}`.toLowerCase();
      const target = fleetList.find(s => s._id === satFilter || s.satelliteId === satFilter);
      if (target) {
        const directMatch = notif.satelliteId && (notif.satelliteId === target._id || notif.satelliteId === target.satelliteId || notif.satelliteId?.satelliteId === target.satelliteId);
        const idMatch = target.satelliteId && text.includes(target.satelliteId.toLowerCase());
        const nameMatch = target.name && text.includes(target.name.toLowerCase());
        if (!directMatch && !idMatch && !nameMatch) return false;
      }
      return true;
    });
  };

  const filteredItems = getFilteredNotifications();

  // Filter CubeSat fleet list for the main screen
  const filteredFleetList = fleetList.filter(sat => {
    const key = sat._id || sat.satelliteId;
    const stat = satNotifStats[key] || { count: 0, hasAlert: false, unreadSatCount: 0 };
    const query = fleetSearch.toLowerCase();

    const matchesQuery = 
      (sat.name && sat.name.toLowerCase().includes(query)) ||
      (sat.satelliteId && sat.satelliteId.toLowerCase().includes(query)) ||
      (sat.orbitType && sat.orbitType.toLowerCase().includes(query)) ||
      (sat.type && sat.type.toLowerCase().includes(query));

    if (fleetFilterType === 'ALERT') return matchesQuery && stat.hasAlert;
    if (fleetFilterType === 'UNREAD') return matchesQuery && stat.unreadSatCount > 0;
    if (fleetFilterType === 'NOMINAL') return matchesQuery && stat.count === 0;
    return matchesQuery;
  });

  const groupNotifications = (items) => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    items.forEach(notif => {
      const date = new Date(notif.createdAt);
      if (isToday(date)) today.push(notif);
      else if (isYesterday(date)) yesterday.push(notif);
      else earlier.push(notif);
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = groupNotifications(filteredItems);

  const getIcon = (type = '', title = '') => {
    const t = (title + ' ' + type).toLowerCase();
    if (t.includes('thermal') || t.includes('temp') || t.includes('radiation') || t.includes('torque') || t.includes('alert')) {
      return <AlertTriangle size={18} className="text-[#FF2A2A]" />;
    }
    if (t.includes('power') || t.includes('battery')) {
      return <Zap size={18} className="text-[#FFB000]" />;
    }
    if (t.includes('signal') || t.includes('lost') || t.includes('comm') || t.includes('carrier') || t.includes('link')) {
      return <Radio size={18} className="text-[#00F0FF]" />;
    }
    return <TerminalSquare size={18} className="text-[#00FF66]" />;
  };

  const getTypeBadge = (type) => {
    const t = (type || 'SYSTEM').toUpperCase();
    if (t === 'ALERT') {
      return <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest bg-[#FF2A2A]/15 text-[#FF2A2A] border border-[#FF2A2A]/30">ALERT</span>;
    }
    if (t === 'COMMS') {
      return <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">COMMS</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">SYSTEM</span>;
  };

  const renderGroup = (groupTitle, items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-4 mb-8">
        <h3 className="text-[10px] font-mono tracking-widest uppercase text-[#00F0FF] flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mr-2"></div>
          {groupTitle} ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map(notif => (
            <div 
              key={notif._id} 
              className={`flex items-start sm:items-center justify-between p-4 border rounded transition-all ${
                notif.read 
                  ? 'bg-[#0B1221]/70 border-gray-800/80 hover:border-gray-700' 
                  : 'bg-[#10192E] border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.08)]'
              }`}
            >
              <div className="flex items-start space-x-4 flex-1 min-w-0 pr-4">
                <div className="p-3 bg-[#050810] border border-gray-800 rounded shrink-0 mt-0.5 sm:mt-0">
                  {getIcon(notif.type, notif.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {getTypeBadge(notif.type)}
                    <h4 className={`font-mono text-sm tracking-wider font-semibold truncate ${
                      notif.read ? 'text-gray-300' : 'text-white'
                    }`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs font-sans leading-relaxed break-words">
                    {notif.message}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-[10px] font-mono text-gray-500 tracking-widest">
                    <span>{format(new Date(notif.createdAt), 'yyyy-MM-dd HH:mm:ss')} UTC</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0">
                {!notif.read && (
                  <button
                    onClick={() => handleMarkSingleRead(notif._id)}
                    className="p-1.5 text-gray-400 hover:text-[#00FF66] hover:bg-[#00FF66]/10 rounded border border-transparent hover:border-[#00FF66]/30 transition-colors"
                    title="Mark as Read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSingle(notif._id)}
                  className="p-1.5 text-gray-400 hover:text-[#FF2A2A] hover:bg-[#FF2A2A]/10 rounded border border-transparent hover:border-[#FF2A2A]/30 transition-colors"
                  title="Delete Notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const alertCount = notifications.filter(n => n.type === 'ALERT').length;
  const commsCount = notifications.filter(n => n.type === 'COMMS').length;
  const systemCount = notifications.filter(n => n.type === 'SYSTEM').length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
              <span>Notification Center</span>
              {satFilter && (
                <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                  CUBESAT ISOLATED
                </span>
              )}
            </h1>
            {unreadCount > 0 && (
              <span className="bg-[#FF2A2A]/20 border border-[#FF2A2A]/40 text-[#FF2A2A] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-gray-400 font-mono mt-1 tracking-widest text-xs">
            {satFilter 
              ? `Realtime telemetry, comms & subsystem alerts for ${activeSatName}`
              : `Select a CubeSat below to inspect its dedicated telemetry & comms notifications`
            }
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            id="trigger-test-notif-btn"
            onClick={handleTriggerTestNotification}
            disabled={isTriggering}
            className="flex items-center space-x-2 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/60 text-[#00F0FF] hover:text-white px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50"
          >
            <PlusCircle size={14} />
            <span>{isTriggering ? 'GENERATING...' : '+ TRIGGER TEST ALERT'}</span>
          </button>
          
          <button 
            id="mark-all-read-btn"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#00FF66] text-gray-300 hover:text-[#00FF66] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <CheckCheck size={14} />
            <span>Mark All Read</span>
          </button>

          <button 
            id="clear-all-notif-btn"
            onClick={handleClear}
            disabled={notifications.length === 0}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#FF2A2A] text-gray-300 hover:text-[#FF2A2A] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={14} />
            <span>Clear Queue</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCENARIO A: NO CUBESAT SELECTED -> SHOW MAIN CUBESAT NOTIFICATION DECK   */}
      {/* ========================================================================= */}
      {!satFilter ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Deck Instruction & Fleet Filter Bar */}
          <div className="bg-[#0B1221] border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="w-8 h-8 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
                <Satellite size={16} className="text-[#00F0FF]" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  CUBESAT NOTIFICATION FLEET
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Select a CubeSat to view its realtime telemetry log and communications
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
              <div className="relative flex-1 md:w-56">
                <Search size={13} className="absolute left-3 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search CubeSat name / ID..."
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="w-full bg-[#050810] border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 font-mono"
                />
              </div>

              {[
                { key: 'ALL', label: 'ALL CUBESATS' },
                { key: 'ALERT', label: 'HAS ALERTS' },
                { key: 'UNREAD', label: 'UNREAD' },
                { key: 'NOMINAL', label: 'NOMINAL' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFleetFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded transition-all font-bold ${
                    fleetFilterType === tab.key
                      ? 'bg-[#00F0FF] text-[#0A0F1F] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-[#050810] border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of CubeSats with Colored Circles with Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFleetList.map(sat => {
              const satKey = sat._id || sat.satelliteId;
              const stat = satNotifStats[satKey] || { count: 0, hasAlert: false, unreadSatCount: 0, latestNotif: null };
              const hasAlert = stat.hasAlert;
              const hasUnread = stat.unreadSatCount > 0;
              const isNominal = stat.count === 0;

              const cardBorder = hasAlert
                ? 'border-[#FF2A2A]/70 hover:border-[#FF2A2A] shadow-[0_0_20px_rgba(255,42,42,0.15)]'
                : hasUnread
                ? 'border-[#00F0FF]/70 hover:border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'border-gray-800 hover:border-[#00FF66]/60 shadow-md';

              return (
                <div
                  key={satKey}
                  onClick={() => {
                    setSatFilter(sat._id || sat.satelliteId);
                    selectSatellite(sat);
                  }}
                  className={`bg-[#0A0F1F] rounded-lg border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${cardBorder}`}
                >
                  <div>
                    {/* Header: ID, Name & Colored Circle Count Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-[#121C36] border border-gray-700 flex items-center justify-center shrink-0 group-hover:border-[#00F0FF] transition-colors">
                          <Satellite size={20} className={hasAlert ? 'text-[#FF2A2A]' : hasUnread ? 'text-[#00F0FF]' : 'text-[#00FF66]'} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-mono font-bold text-white text-base tracking-wider group-hover:text-[#00F0FF] transition-colors">
                              {sat.name || sat.satelliteId}
                            </h3>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                              {sat.type || 'CubeSat'}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-gray-500 mt-0.5">
                            {sat.satelliteId} • {sat.orbitType || 'LEO'}
                          </p>
                        </div>
                      </div>

                      {/* PROMINENT COLORED CIRCLE WITH NUMBER INDICATING HOW MANY NOTIFICATIONS */}
                      <div className="flex flex-col items-end">
                        {hasAlert ? (
                          <div className="flex items-center space-x-1.5 bg-[#FF2A2A]/15 border border-[#FF2A2A]/40 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#FF2A2A] text-white font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_10px_rgba(255,42,42,0.8)] animate-pulse">
                              {stat.count}
                            </span>
                            <span className="font-mono text-[10px] text-[#FF2A2A] font-bold uppercase tracking-wider">
                              ALERTS
                            </span>
                          </div>
                        ) : hasUnread ? (
                          <div className="flex items-center space-x-1.5 bg-[#00F0FF]/15 border border-[#00F0FF]/40 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#00F0FF] text-[#0A0F1F] font-mono font-bold text-xs flex items-center justify-center shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                              {stat.count}
                            </span>
                            <span className="font-mono text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider">
                              UNREAD
                            </span>
                          </div>
                        ) : stat.count > 0 ? (
                          <div className="flex items-center space-x-1.5 bg-[#00FF66]/10 border border-[#00FF66]/30 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] font-mono font-bold text-xs flex items-center justify-center">
                              {stat.count}
                            </span>
                            <span className="font-mono text-[10px] text-[#00FF66] font-bold uppercase tracking-wider">
                              LOGGED
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 bg-gray-800/60 border border-gray-700 px-2.5 py-1 rounded-full">
                            <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 font-mono font-bold text-xs flex items-center justify-center">
                              0
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              CLEAR
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown Chips */}
                    <div className="grid grid-cols-2 gap-2 my-3 font-mono text-[11px]">
                      <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                        <span className="text-gray-500">Unread:</span>
                        <span className={`font-bold ${stat.unreadSatCount > 0 ? 'text-[#00F0FF]' : 'text-gray-400'}`}>
                          {stat.unreadSatCount}
                        </span>
                      </div>
                      <div className="bg-[#050810] border border-gray-800 rounded p-2 flex items-center justify-between">
                        <span className="text-gray-500">Alerts:</span>
                        <span className={`font-bold ${stat.hasAlert ? 'text-[#FF2A2A]' : 'text-gray-400'}`}>
                          {stat.hasAlert ? 'YES' : 'NONE'}
                        </span>
                      </div>
                    </div>

                    {/* Recent Notification Preview */}
                    <div className="bg-[#070B14] border border-gray-800/80 rounded p-2.5 mb-4 font-mono text-xs">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">
                        RECENT TRANSMISSION:
                      </span>
                      {stat.latestNotif ? (
                        <p className="text-gray-300 truncate text-[11px]">
                          <strong className={stat.latestNotif.type === 'ALERT' ? 'text-[#FF2A2A]' : 'text-[#00F0FF]'}>
                            [{stat.latestNotif.type}]
                          </strong>{' '}
                          {stat.latestNotif.title}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-[11px]">No recent telemetry signals logged.</p>
                      )}
                    </div>
                  </div>

                  {/* Selection Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSatFilter(sat._id || sat.satelliteId);
                      selectSatellite(sat);
                    }}
                    className={`w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                      hasAlert
                        ? 'bg-[#FF2A2A]/20 hover:bg-[#FF2A2A] text-white border border-[#FF2A2A]/50 hover:border-[#FF2A2A]'
                        : hasUnread
                        ? 'bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#0A0F1F] border border-[#00F0FF]/50'
                        : 'bg-[#12192b] hover:bg-[#182547] text-gray-300 hover:text-white border border-gray-800'
                    }`}
                  >
                    <span>SELECT CUBESAT TO VIEW NOTIFICATIONS ({stat.count})</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>

          {filteredFleetList.length === 0 && (
            <div className="py-16 text-center bg-[#0B1221] border border-gray-800 rounded-lg font-mono">
              <p className="text-gray-400 text-sm">No CubeSats match your search query "{fleetSearch}"</p>
              <button
                onClick={() => { setFleetSearch(''); setFleetFilterType('ALL'); }}
                className="mt-3 text-xs text-[#00F0FF] underline font-bold"
              >
                Clear Search & Filters
              </button>
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* SCENARIO B: CUBESAT SELECTED -> SHOW NOTIFICATIONS FOR THIS CUBESAT ONLY */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Active CubeSat Header Bar with Navigation Back Button */}
          <div className="bg-[#0B1221] border border-[#00F0FF]/40 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <button
                onClick={() => setSatFilter(null)}
                className="px-3.5 py-2 rounded bg-[#12192b] hover:bg-[#1c2642] border border-gray-700 hover:border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <span>← BACK TO ALL CUBESATS</span>
              </button>

              <div className="border-l border-gray-800 pl-4">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-white">
                    {activeSatName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
                    {activeSat?.type || 'CubeSat'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  {filteredItems.length} notification log(s) for this asset
                </p>
              </div>
            </div>

            {/* Quick Switcher Dropdown */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider hidden sm:inline">
                SWITCH CUBESAT:
              </span>
              <select
                value={satFilter}
                onChange={(e) => {
                  if (e.target.value === 'ALL') {
                    setSatFilter(null);
                  } else {
                    setSatFilter(e.target.value);
                    const found = fleetList.find(s => s._id === e.target.value || s.satelliteId === e.target.value);
                    if (found) selectSatellite(found);
                  }
                }}
                className="bg-[#050810] border border-gray-700 hover:border-[#00F0FF] rounded px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#00F0FF] cursor-pointer"
              >
                <option value="ALL">← RETURN TO ALL CUBESATS</option>
                {fleetList.map(sat => {
                  const key = sat._id || sat.satelliteId;
                  const stat = satNotifStats[key] || { count: 0 };
                  return (
                    <option key={key} value={key}>
                      {sat.name || sat.satelliteId} ({stat.count} notifs)
                    </option>
                  );
                })}
              </select>

              <button
                onClick={() => {
                  if (activeSat) openDetailModal(activeSat);
                }}
                className="p-2 border border-gray-700 hover:border-[#00F0FF] rounded bg-[#050810] text-[#00F0FF] hover:text-white transition-colors"
                title="Inspect Satellite Specs"
              >
                <Eye size={15} />
              </button>
            </div>

          </div>

          {/* Filter Tabs for this CubeSat */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
            <span className="text-xs font-mono text-gray-500 mr-2 flex items-center">
              <Filter size={12} className="mr-1" /> CATEGORY:
            </span>
            {[
              { key: 'ALL', label: 'ALL NOTIFICATIONS', count: filteredItems.length },
              { key: 'UNREAD', label: 'UNREAD ONLY', count: filteredItems.filter(n => !n.read).length },
              { key: 'ALERT', label: 'ALERTS', count: filteredItems.filter(n => n.type === 'ALERT').length },
              { key: 'COMMS', label: 'COMMS', count: filteredItems.filter(n => n.type === 'COMMS').length },
              { key: 'SYSTEM', label: 'SYSTEM', count: filteredItems.filter(n => n.type === 'SYSTEM').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all flex items-center space-x-2 ${
                  filter === tab.key
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                    : 'text-gray-400 hover:text-white bg-[#0B1221] border border-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  filter === tab.key ? 'bg-[#00F0FF] text-black' : 'bg-gray-800 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Feed for this CubeSat */}
          <div>
            {loading ? (
              <div className="text-[#00F0FF] font-mono text-center py-12 tracking-widest animate-pulse">
                INITIALIZING SECURE TELEMETRY FEED...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 px-6 bg-[#0B1221]/60 border border-gray-800 rounded-lg">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#121C36] flex items-center justify-center text-gray-500 mb-3 border border-gray-800">
                  <Bell size={22} />
                </div>
                <h3 className="text-base font-mono font-bold text-gray-300">No Notifications for {activeSatName}</h3>
                <p className="text-gray-500 text-xs font-mono mt-1 mb-4">
                  No telemetry anomalies or communications have been flagged for this asset.
                </p>
                <button
                  onClick={() => setSatFilter(null)}
                  className="px-4 py-2 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs font-bold uppercase transition-colors"
                >
                  ← Return to CubeSat Fleet
                </button>
              </div>
            ) : (
              <div>
                {renderGroup('Today', today)}
                {renderGroup('Yesterday', yesterday)}
                {renderGroup('Earlier', earlier)}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

