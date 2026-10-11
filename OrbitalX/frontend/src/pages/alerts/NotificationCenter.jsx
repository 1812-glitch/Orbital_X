import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { useSatellite } from '../../context/SatelliteContext';
import { isToday, isYesterday } from 'date-fns';
import NotificationCenterHeader from './components/NotificationCenterHeader';
import NotificationFleetDeck from './components/NotificationFleetDeck';
import NotificationDetailFeed from './components/NotificationDetailFeed';

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      <NotificationCenterHeader
        satFilter={satFilter}
        activeSatName={activeSatName}
        unreadCount={unreadCount}
        notificationsCount={notifications.length}
        isTriggering={isTriggering}
        handleTriggerTestNotification={handleTriggerTestNotification}
        handleMarkAllRead={handleMarkAllRead}
        handleClear={handleClear}
      />

      {!satFilter ? (
        <NotificationFleetDeck
          fleetSearch={fleetSearch}
          setFleetSearch={setFleetSearch}
          fleetFilterType={fleetFilterType}
          setFleetFilterType={setFleetFilterType}
          filteredFleetList={filteredFleetList}
          satNotifStats={satNotifStats}
          setSatFilter={setSatFilter}
          selectSatellite={selectSatellite}
        />
      ) : (
        <NotificationDetailFeed
          satFilter={satFilter}
          setSatFilter={setSatFilter}
          activeSat={activeSat}
          activeSatName={activeSatName}
          filteredItems={filteredItems}
          fleetList={fleetList}
          satNotifStats={satNotifStats}
          selectSatellite={selectSatellite}
          openDetailModal={openDetailModal}
          filter={filter}
          setFilter={setFilter}
          loading={loading}
          today={today}
          yesterday={yesterday}
          earlier={earlier}
          handleMarkSingleRead={handleMarkSingleRead}
          handleDeleteSingle={handleDeleteSingle}
        />
      )}
    </div>
  );
}
