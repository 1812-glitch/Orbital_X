import React from 'react';
import { PlusCircle, CheckCheck, Trash2 } from 'lucide-react';

export default function NotificationCenterHeader({
  satFilter,
  activeSatName,
  unreadCount,
  notificationsCount,
  isTriggering,
  handleTriggerTestNotification,
  handleMarkAllRead,
  handleClear
}) {
  return (
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
          disabled={notificationsCount === 0}
          className="flex items-center space-x-2 border border-gray-700 hover:border-[#FF2A2A] text-gray-300 hover:text-[#FF2A2A] px-3.5 py-2 rounded text-xs font-mono tracking-wider uppercase transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Trash2 size={14} />
          <span>Clear Queue</span>
        </button>
      </div>
    </div>
  );
}
