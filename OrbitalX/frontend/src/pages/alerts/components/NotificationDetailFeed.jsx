import React from 'react';
import { Filter, Bell, Check, Trash2, Eye, AlertTriangle, Zap, Radio, TerminalSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationDetailFeed({
  satFilter,
  setSatFilter,
  activeSat,
  activeSatName,
  filteredItems,
  fleetList,
  satNotifStats,
  selectSatellite,
  openDetailModal,
  filter,
  setFilter,
  loading,
  today,
  yesterday,
  earlier,
  handleMarkSingleRead,
  handleDeleteSingle
}) {
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

  return (
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
  );
}
