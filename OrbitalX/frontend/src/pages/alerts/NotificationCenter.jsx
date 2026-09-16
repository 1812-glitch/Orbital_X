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
  Layers
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import { format, isToday, isYesterday } from 'date-fns';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD, ALERT, COMMS, SYSTEM
  const [isTriggering, setIsTriggering] = useState(false);

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

  const getFilteredNotifications = () => {
    return notifications.filter(notif => {
      if (filter === 'UNREAD') return !notif.read;
      if (filter === 'ALERT') return notif.type === 'ALERT';
      if (filter === 'COMMS') return notif.type === 'COMMS';
      if (filter === 'SYSTEM') return notif.type === 'SYSTEM';
      return true; // ALL
    });
  };

  const filteredItems = getFilteredNotifications();

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
    <div className="space-y-6 max-w-[1100px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="bg-[#FF2A2A]/20 border border-[#FF2A2A]/40 text-[#FF2A2A] text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-gray-400 font-mono mt-1 tracking-widest text-xs">
            REALTIME ORBITAL TELEMETRY, COMMS & SUBSYSTEM ALERTS
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
        <span className="text-xs font-mono text-gray-500 mr-2 flex items-center">
          <Filter size={12} className="mr-1" /> FILTER:
        </span>
        {[
          { key: 'ALL', label: 'ALL NOTIFICATIONS', count: notifications.length },
          { key: 'UNREAD', label: 'UNREAD ONLY', count: unreadCount },
          { key: 'ALERT', label: 'ALERTS', count: alertCount },
          { key: 'COMMS', label: 'COMMS', count: commsCount },
          { key: 'SYSTEM', label: 'SYSTEM', count: systemCount }
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

      {/* Feed */}
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
            <h3 className="font-mono text-sm tracking-widest text-white uppercase mb-1">
              NO NOTIFICATIONS IN QUEUE
            </h3>
            <p className="text-xs font-mono text-gray-500 max-w-md mx-auto mb-5">
              {filter !== 'ALL' 
                ? `No notifications found matching filter "${filter}". Switch filters or generate a test alert.` 
                : 'All operational subsystems reporting nominal status with zero unacknowledged telemetry alerts.'}
            </p>
            <button
              onClick={handleTriggerTestNotification}
              className="inline-flex items-center space-x-2 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/60 text-[#00F0FF] px-4 py-2 rounded text-xs font-mono tracking-wider transition-colors"
            >
              <PlusCircle size={14} />
              <span>GENERATE SAMPLE NOTIFICATION</span>
            </button>
          </div>
        ) : (
          <>
            {renderGroup('Today', today)}
            {renderGroup('Yesterday', yesterday)}
            {renderGroup('Earlier', earlier)}
          </>
        )}
      </div>
    </div>
  );
}

