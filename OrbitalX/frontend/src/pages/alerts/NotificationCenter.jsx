import React, { useState, useEffect } from 'react';
import { Check, Trash2, AlertTriangle, Zap, WifiOff, Bell } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { format, isToday, isYesterday } from 'date-fns';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleClear = async () => {
    try {
      await notificationService.clearAll();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  };

  const groupNotifications = () => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    notifications.forEach(notif => {
      const date = new Date(notif.createdAt);
      if (isToday(date)) today.push(notif);
      else if (isYesterday(date)) yesterday.push(notif);
      else earlier.push(notif);
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = groupNotifications();

  const getIcon = (type, title) => {
    const t = title.toLowerCase();
    if (t.includes('thermal') || t.includes('temp')) return <AlertTriangle size={18} className="text-[#FF2A2A]" />;
    if (t.includes('power') || t.includes('battery')) return <Zap size={18} className="text-[#FFB000]" />;
    if (t.includes('signal') || t.includes('lost')) return <WifiOff size={18} className="text-[#00F0FF]" />;
    return <Bell size={18} className="text-gray-400" />;
  };

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-4 mb-8">
        <h3 className="text-[10px] font-mono tracking-widest uppercase text-[#00F0FF] flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mr-2"></div>
          {title}
        </h3>
        <div className="space-y-3">
          {items.map(notif => (
            <div key={notif._id} className={`flex items-center p-4 border rounded ${notif.read ? 'bg-[#0B1221] border-gray-800' : 'bg-[#0B1221] border-gray-700 shadow-[0_0_15px_rgba(0,240,255,0.05)]'}`}>
              <div className="p-3 bg-[#050810] border border-gray-800 rounded mr-4">
                {getIcon(notif.type, notif.title)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-mono text-sm tracking-widest uppercase ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 tracking-widest">
                    {format(new Date(notif.createdAt), 'HH:mm UTC')}
                  </span>
                </div>
                <p className="text-gray-500 text-sm font-sans">{notif.message}</p>
              </div>
              {!notif.read && <div className="ml-4 w-2 h-2 rounded-full bg-[#00F0FF]"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notification Center</h1>
          <p className="text-gray-400 font-mono mt-2 tracking-widest text-sm">SYSTEM ALERTS & OPERATIONS LOG</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#00F0FF] text-gray-300 hover:text-[#00F0FF] px-4 py-2 rounded text-xs font-mono tracking-widest uppercase transition-colors"
          >
            <Check size={14} />
            <span>Mark All As Read</span>
          </button>
          <button 
            onClick={handleClear}
            className="flex items-center space-x-2 border border-gray-700 hover:border-[#FF2A2A] text-gray-300 hover:text-[#FF2A2A] px-4 py-2 rounded text-xs font-mono tracking-widest uppercase transition-colors"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Feed */}
      <div>
        {loading ? (
          <div className="text-[#00F0FF] font-mono text-center py-8 tracking-widest">LOADING NOTIFICATIONS...</div>
        ) : notifications.length === 0 ? (
          <div className="text-gray-500 font-mono text-center py-8 tracking-widest bg-[#0B1221] border border-gray-800 rounded">
            NO NOTIFICATIONS IN QUEUE
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
